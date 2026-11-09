import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { randomBytes, randomUUID } from "node:crypto";
import { execFileSync, spawn } from "node:child_process";
import { createServer } from "node:net";
import { fileURLToPath } from "node:url";
import { criarInvocacaoStatusSupabase } from "../scripts/supabase-cli-invocation.mjs";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
let admin, author, anon, userId, container;
const works = [];
function sql(source) {
  return execFileSync("docker", ["exec", "-i", container, "psql", "-U", "postgres", "-d", "postgres", "-XqAt", "-v", "ON_ERROR_STOP=1"],
    { input: source, encoding: "utf8", windowsHide: true, stdio: ["pipe", "pipe", "pipe"] }).trim();
}
function check(result) { expect(result.error).toBeNull(); return result.data; }

test.beforeAll(async () => {
  expect(["127.0.0.1", "localhost", "[::1]"]).toContain(new URL(url).hostname);
  const invocation = criarInvocacaoStatusSupabase();
  const status = execFileSync(invocation.comando, invocation.argumentos,
    { encoding: "utf8", windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
  const values = Object.fromEntries(status.split(/\r?\n/).filter((line) => /^[A-Z0-9_]+=/.test(line)).map((line) => {
    const i = line.indexOf("="), value = line.slice(i + 1).trim();
    return [line.slice(0, i), value.startsWith('"') ? JSON.parse(value) : value];
  }));
  expect(values.API_URL).toBe(url);
  const db = new URL(values.DB_URL);
  expect(["127.0.0.1", "localhost", "[::1]"]).toContain(db.hostname);
  const containers = execFileSync("docker", ["ps", "--filter", `publish=${db.port}`, "--format", "{{.Names}}"],
    { encoding: "utf8", windowsHide: true }).trim().split(/\r?\n/).filter(Boolean);
  expect(containers).toHaveLength(1); expect(containers[0]).toMatch(/^supabase_db_/); container = containers[0];
  const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };
  admin = createClient(url, values.SERVICE_ROLE_KEY, options);
  author = createClient(url, key, options); anon = createClient(url, key, options);
  const email = `scheduled-${randomUUID()}@historietas.test`, password = randomBytes(24).toString("base64url");
  userId = check(await admin.auth.admin.createUser({ email, password, email_confirm: true })).user.id;
  check(await author.auth.signInWithPassword({ email, password }));
  check(await author.from("profiles").insert({ id: userId, user_id: userId, nome: "Autor agendamento E2E", tipo: "autor" }));
  check(await author.rpc("aceitar_termos_publicacao", {
    p_termos_versao: "2026-08-05", p_politica_versao: "2026-08-05", p_diretrizes_versao: "2026-08-05",
  }));
});

test.afterAll(async () => {
  for (const id of works) {
    check(await author.from("obras").delete().eq("id", id));
    // Apenas a fixture local remove seu proprio snapshot duravel apos o teste.
    sql(`delete from historietas_privado.capitulo_cache_outbox where obra_id='${id}';`);
  }
  if (userId) check(await admin.auth.admin.deleteUser(userId));
});

test("duas instancias Next consultam revisao atual mesmo com conteudo aquecido", async ({ request }) => {
  const probe = createServer();
  await new Promise((resolve, reject) => { probe.once("error", reject); probe.listen(0, "127.0.0.1", resolve); });
  const port = probe.address().port;
  await new Promise((resolve) => probe.close(resolve));
  const root = fileURLToPath(new URL("../../", import.meta.url));
  const server = spawn(process.execPath, [fileURLToPath(new URL("../../node_modules/next/dist/bin/next", import.meta.url)), "start", "-H", "127.0.0.1", "-p", String(port)], {
    cwd: root, env: process.env, windowsHide: true, stdio: ["ignore", "pipe", "pipe"],
  });
  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Segunda instancia nao ficou pronta")), 30000);
      let output = "";
      server.stdout.on("data", (data) => { output += data; if (output.includes("Ready in")) { clearTimeout(timer); resolve(); } });
      server.stderr.resume();
      server.once("error", (err) => { clearTimeout(timer); reject(err); });
      server.once("exit", () => { clearTimeout(timer); reject(new Error("Segunda instancia encerrou antes do teste")); });
    });
    const workId = randomUUID(), chapterId = randomUUID(), slug = `qa-duas-instancias-${randomUUID()}`;
    check(await author.from("obras").insert({ id: workId, user_id: userId, titulo: "Obra duas instancias", autor: "QA",
      genero: "Fantasia", formato: "Romance", classificacao_indicativa: "Livre", publicado: true, slug }));
    works.push(workId);
    check(await author.from("capitulos").insert({ id: chapterId, obra_id: workId, user_id: userId, titulo: "Capitulo duas instancias",
      texto: "Texto antes da revisao", ordem: 1, publicado: true }));
    const path = `/obra/${slug}/capitulo/1`, origins = ["", `http://127.0.0.1:${port}`];
    for (const origin of origins) expect(await (await request.get(`${origin}${path}`)).text()).toContain("Texto antes da revisao");
    check(await author.from("capitulos").update({ texto: "Texto depois da revisao" }).eq("id", chapterId));
    for (const origin of origins) {
      const response = await request.get(`${origin}${path}`);
      expect(response.status()).toBe(200);
      const html = await response.text();
      expect(html).toContain("Texto depois da revisao"); expect(html).not.toContain("Texto antes da revisao");
    }
  } finally {
    if (server.pid && server.exitCode === null) {
      const exit = new Promise((resolve) => server.once("exit", resolve));
      server.kill(); await exit;
    }
  }
});

for (const device of ["desktop", "mobile"]) {
  test(`barreira atualiza metadata/lista/sitemap sem depender de invalidacao manual (${device})`, async ({ page, request, context, baseURL }, info) => {
    await page.setViewportSize(device === "mobile" ? { width: 390, height: 844 } : { width: 1440, height: 900 });
    const workId = randomUUID(), one = randomUUID(), two = randomUUID(), slug = `qa-cache-${randomUUID()}`;
    const title = `Obra cache ${workId}`, secondTitle = `Segundo capítulo ${two}`;
    // A ausencia anterior do slug nao pode sobreviver a uma publicacao posterior.
    const missing = await request.get(`/obra/${slug}`);
    expect(await missing.text()).not.toContain(title);
    check(await author.from("obras").insert({ id: workId, user_id: userId, titulo: title, autor: "Autor agendamento E2E",
      genero: "Fantasia", formato: "Romance", classificacao_indicativa: "Livre", publicado: true, slug }));
    works.push(workId);
    check(await author.from("capitulos").insert([
      { id: one, obra_id: workId, user_id: userId, titulo: "Primeiro capítulo cache", texto: "Texto inicial público.", ordem: 1, publicado: true },
      { id: two, obra_id: workId, user_id: userId, titulo: secondTitle, texto: "Texto agendado não antecipado.", ordem: 2, publicado: false },
    ]));
    expect(await (await request.get(`/obra/${slug}`)).text()).toContain(title);
    const first = await request.get(`/obra/${slug}/capitulo/1`);
    expect(first.headers()["cache-control"]).toContain("no-store");
    expect(first.status()).toBe(200); expect(await first.text()).not.toContain(secondTitle);
    const sitemapBefore = await request.get("/sitemap.xml");
    expect(sitemapBefore.headers()["cache-control"]).toContain("no-store");
    expect(await sitemapBefore.text()).not.toContain(`/obra/${slug}/capitulo/2`);
    expect((await request.get(`/obra/${slug}/capitulo/2`)).status()).toBe(404);
    const endpoint = "/api/admin/cache-capitulos", origin = new URL(baseURL).origin;
    expect((await request.post(endpoint, { headers: { origin } })).status()).toBe(401);
    // Usa sessao real descartavel. Cookies somente em memoria; nenhum segredo no relatorio.
    const current = check(await author.auth.getSession()).session;
    const cookies = [];
    const serverAuth = createServerClient(url, key, { cookies: { getAll: () => [], setAll: (items) => cookies.push(...items) } });
    check(await serverAuth.auth.setSession({ access_token: current.access_token, refresh_token: current.refresh_token }));
    expect(cookies.length).toBeGreaterThan(0);
    await context.addCookies(cookies.map(({ name, value }) => ({ name, value, url: origin })));
    check(await admin.auth.admin.updateUserById(userId, { app_metadata: { role: "admin" } }));
    check(await author.rpc("agendar_capitulo", { p_capitulo_id: two, p_revisao_esperada: 0, p_publicar_em: "2099-01-01Z", p_fuso_horario: "UTC" }));
    sql(`update historietas_privado.capitulo_agendamentos set publicar_em=now()-interval '1 minute' where capitulo_id='${two}';
      select historietas_privado.executar_agendamento_capitulo('${two}',1);`);
    // A nova revisao torna caches antigos inacessiveis, ANTES do consumidor.
    expect(await (await request.get(`/obra/${slug}/capitulo/1`)).text()).toContain(secondTitle);
    expect(await (await request.get("/sitemap.xml")).text()).toContain(`/obra/${slug}/capitulo/2`);
    // A fixture request e isolada; context.request compartilha os cookies reais.
    expect((await context.request.post(endpoint, { headers: { origin: "https://outro.test" } })).status()).toBe(403);
    const queued = await context.request.post(endpoint, { headers: { origin } });
    expect(queued.status()).toBe(202); expect((await queued.json()).confirmadas).toBe(0);
    // Verifica efeitos observaveis no servidor local; isso nao cria um ack duravel.
    const work = await request.get(`/obra/${slug}`); expect(work.status()).toBe(200); expect(await work.text()).toContain(title);
    expect(await (await request.get(`/obra/${slug}/capitulo/1`)).text()).toContain(secondTitle);
    expect(await (await request.get("/sitemap.xml")).text()).toContain(`/obra/${slug}/capitulo/2`);
    await page.goto(`/obra/${slug}/capitulo/2`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: secondTitle, exact: true })).toBeVisible();
    expect(sql(`select count(*) from historietas_privado.capitulo_cache_outbox where capitulo_id='${two}' and solicitada_em is not null;`)).toBe("1");
    expect(sql(`select count(*) from public.diario_atividades where capitulo_id='${two}';`)).toBe("1");
    const retry = await context.request.post(endpoint, { headers: { origin } });
    expect(retry.status()).toBe(202); expect((await retry.json()).confirmadas).toBe(0);
    // Despublicacao antes de repetir invalidacao nao pode restituir visibilidade.
    check(await author.from("capitulos").update({ publicado: false }).eq("id", two));
    sql(`update historietas_privado.capitulo_cache_outbox set lease_ate=clock_timestamp()-interval '1 second' where obra_id='${workId}';`);
    expect((await context.request.post(endpoint, { headers: { origin } })).status()).toBe(202);
    expect((await request.get(`/obra/${slug}/capitulo/2`)).status()).toBe(404);
    expect(await (await request.get("/sitemap.xml")).text()).not.toContain(`/obra/${slug}/capitulo/2`);
    expect(await (await request.get(`/obra/${slug}/capitulo/1`)).text()).not.toContain(secondTitle);
    check(await author.from("obras").update({ slug: `${slug}-renomeada` }).eq("id", workId));
    expect((await request.get(`/obra/${slug}/capitulo/1`)).status()).toBe(404);
    expect((await request.get(`/obra/${slug}-renomeada/capitulo/1`)).status()).toBe(200);
    const renamedSitemap = await (await request.get("/sitemap.xml")).text();
    expect(renamedSitemap).not.toContain(`/obra/${slug}/capitulo/1`);
    expect(renamedSitemap).toContain(`/obra/${slug}-renomeada/capitulo/1`);
    check(await admin.auth.admin.updateUserById(userId, { app_metadata: { role: "autor" } }));
    info.annotations.push({ type: "sem-ack", description: "API retorna solicitacao, nao conclusao; falha tardia do backend ainda impede confirmacao duravel/ativacao automatica." });
  });

  test(`publicacao SQL registra Diario atomico e libera URL antes inexistente (${device})`, async ({ page, request }, info) => {
    await page.setViewportSize(device === "mobile" ? { width: 390, height: 844 } : { width: 1440, height: 900 });
    const workId = randomUUID(), chapterId = randomUUID(), slug = `qa-agendado-${randomUUID()}`;
    const path = `/obra/${slug}/capitulo/1234`, title = `Capítulo agendado ${device}`;
    const text = `Texto publicado pelo executor privado para o cenário ${device}.`;
    check(await author.from("obras").insert({ id: workId, user_id: userId, titulo: "Obra agendada E2E", autor: "Autor agendamento E2E",
      genero: "Fantasia", formato: "Romance", classificacao_indicativa: "Livre", publicado: true, slug }));
    works.push(workId);
    check(await author.from("capitulos").insert({ id: chapterId, obra_id: workId, user_id: userId, titulo: title, texto: text, ordem: 1234, publicado: false }));
    const before = await request.get(path, { maxRedirects: 0 });
    expect(before.status()).toBe(404); expect(await before.text()).not.toContain(text);
    expect(check(await anon.from("diario_atividades").select("id").eq("capitulo_id", chapterId))).toEqual([]);
    check(await author.rpc("agendar_capitulo", { p_capitulo_id: chapterId, p_revisao_esperada: 0,
      p_publicar_em: "2099-01-01T12:00:00Z", p_fuso_horario: "UTC" }));
    // Somente fixture local: avanca o prazo, sem esperar relogio nem chamar API publica de execucao.
    sql(`update historietas_privado.capitulo_agendamentos set publicar_em=now()-interval '1 minute' where capitulo_id='${chapterId}';`);
    const published = JSON.parse(sql(`select historietas_privado.executar_agendamento_capitulo('${chapterId}',1);`));
    expect(published.estado).toBe("publicado");
    const after = await request.get(path, { maxRedirects: 0 });
    expect(after.status()).toBe(200);
    const html = await after.text(); expect(html).toContain(title); expect(html).toContain(text);
    // O streaming pode manter uma cópia oculta do Leitor durante a hidratação.
    // Confirme a barreira pública e a raiz única antes de verificar o conteúdo final.
    const hydration = page.waitForResponse(response => new URL(response.url()).pathname === "/api/leitura-publica");
    await page.goto(path, { waitUntil: "domcontentloaded" });
    expect((await hydration).status()).toBe(200);
    const reader = page.locator('main[data-historietas-ler-capitulo-root="true"]');
    await expect(reader).toHaveCount(1);
    await expect(reader).toBeVisible();
    await expect(reader.getByRole("heading", { name: title, exact: true })).toBeVisible();
    const chapterText = reader.getByText(text, { exact: true });
    await expect(chapterText).toHaveCount(1);
    await expect(chapterText).toBeVisible();
    const diary = check(await anon.from("diario_atividades").select("id,metadata,user_id").eq("capitulo_id", chapterId));
    expect(diary).toHaveLength(1); expect(diary[0].user_id).toBe(userId); expect(diary[0].metadata.href).toBe(path);
    expect(diary[0].metadata.numero_capitulo).toBe(1234);
    expect(JSON.parse(sql(`select historietas_privado.executar_agendamento_capitulo('${chapterId}',1);`)).repetido).toBe(true);
    expect(check(await anon.from("diario_atividades").select("id").eq("capitulo_id", chapterId))).toHaveLength(1);
    info.annotations.push({ type: "barreira-local", description: "Cobre 404 seguido de HTML 200 sob barreira, sem ACK de flush. Nao revoga HTML/RSC previamente entregue ao navegador." });
  });
}
