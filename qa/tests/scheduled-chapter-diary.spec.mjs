import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { randomBytes, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
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
  for (const id of works) check(await author.from("obras").delete().eq("id", id));
  if (userId) check(await admin.auth.admin.deleteUser(userId));
});

for (const device of ["desktop", "mobile"]) {
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
    await page.goto(path, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
    await expect(page.getByText(text, { exact: true })).toBeVisible();
    const diary = check(await anon.from("diario_atividades").select("id,metadata,user_id").eq("capitulo_id", chapterId));
    expect(diary).toHaveLength(1); expect(diary[0].user_id).toBe(userId); expect(diary[0].metadata.href).toBe(path);
    expect(diary[0].metadata.numero_capitulo).toBe(1234);
    expect(JSON.parse(sql(`select historietas_privado.executar_agendamento_capitulo('${chapterId}',1);`)).repetido).toBe(true);
    expect(check(await anon.from("diario_atividades").select("id").eq("capitulo_id", chapterId))).toHaveLength(1);
    info.annotations.push({ type: "limite-cache", description: "Cobre 404 do proxy seguido de 200. Nao comprova invalidacao de uma entrada negativa ja persistida em unstable_cache nem do sitemap ISR." });
  });
}
