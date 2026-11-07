import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createClient } from "@supabase/supabase-js";
import { authorEmail, authorPassword, visitorEmail, visitorPassword, loginAsVisitor, loginAsAuthor } from "./helpers.mjs";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const obraId = process.env.E2E_PUBLIC_WORK_ID;
const capituloId = process.env.E2E_PUBLIC_CHAPTER_ID;
const slug = process.env.E2E_PUBLIC_WORK_SLUG;
const caminho = `/obra/${slug}/capitulo/1`;
const texto = "Spoiler E2E: a identidade secreta do final";
const resposta = "Resposta E2E: confirmação do segredo final";
let autor, leitor, comentarioId, leitorId, seguimentoCriado = false;

function cliente() {
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}
async function marcar(lido) {
  const result = await leitor.rpc("salvar_progresso_leitura", {
    p_obra_id: obraId, p_capitulo_id: capituloId, p_lido: lido,
    p_progresso: lido ? 50 : 0, p_ocorrido_em: new Date().toISOString(),
  });
  expect(result.error).toBeNull(); expect(result.data).toBe(true);
}
async function abrir(page, path = caminho) {
  const interacoes = page.waitForResponse((r) => r.url().includes("/rpc/obter_metricas_conteudos") &&
    r.ok() && (r.request().postDataJSON()?.p_obra_ids || []).length === 0);
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await interacoes;
  await expect(page.getByRole("heading", { name: "Capítulo 1", exact: true })).toBeVisible();
  await page.getByRole("button", { name: /^\d+ comentários?$/i }).click();
  return page.getByRole("dialog", { name: /comentários/i });
}

test.beforeAll(async () => {
  // Escritas da fixture são recusadas fora do Supabase descartável de loopback.
  expect(["127.0.0.1", "localhost", "[::1]"]).toContain(new URL(url).hostname);
  expect(obraId && capituloId && slug && authorEmail && visitorEmail).toBeTruthy();
  autor = cliente(); leitor = cliente();
  expect((await autor.auth.signInWithPassword({ email: authorEmail, password: authorPassword })).error).toBeNull();
  const login = await leitor.auth.signInWithPassword({ email: visitorEmail, password: visitorPassword });
  expect(login.error).toBeNull(); leitorId = login.data.user.id;
  // Notificações locais de capítulos só são elegíveis para obras seguidas.
  const seguindo = await leitor.from("seguindo_obras").select("id")
    .eq("user_id", leitorId).eq("obra_id", obraId).maybeSingle();
  expect(seguindo.error).toBeNull();
  if (!seguindo.data) {
    const seguir = await leitor.from("seguindo_obras").insert({ user_id: leitorId, obra_id: obraId });
    expect(seguir.error).toBeNull(); seguimentoCriado = true;
  }
  const root = await autor.from("comentarios_capitulos").insert({ user_id: (await autor.auth.getUser()).data.user.id,
    capitulo_id: capituloId, comentario: texto }).select("id").single();
  expect(root.error).toBeNull(); comentarioId = root.data.id;
  const reply = await autor.from("comentarios_capitulos").insert({ user_id: (await autor.auth.getUser()).data.user.id,
    capitulo_id: capituloId, comentario: resposta, comentario_pai_id: comentarioId });
  expect(reply.error).toBeNull();
});
test.afterAll(async () => {
  if (comentarioId) expect((await autor.from("comentarios_capitulos").delete().eq("id", comentarioId)).error).toBeNull();
  if (leitorId) expect((await leitor.from("progresso_leitura").delete().eq("user_id", leitorId).eq("obra_id", obraId).eq("capitulo_id", capituloId)).error).toBeNull();
  if (seguimentoCriado) expect((await leitor.from("seguindo_obras").delete().eq("user_id", leitorId).eq("obra_id", obraId)).error).toBeNull();
  await autor?.auth.signOut({ scope: "local" }); await leitor?.auth.signOut({ scope: "local" });
});

for (const dispositivo of ["desktop", "mobile"]) {
  test.describe(dispositivo, () => {
    test.use({ viewport: dispositivo === "mobile" ? { width: 390, height: 844 } : { width: 1440, height: 900 } });

    test("visitante não carrega textos; revelação, respostas, foco e axe", async ({ page }) => {
      const consultas = [];
      page.on("request", (r) => { if (/\/rest\/v1\/comentarios_capitulos\?/.test(r.url())) consultas.push(r.url()); });
      const dialog = await abrir(page);
      const revelar = dialog.getByRole("button", { name: "Mostrar comentários — podem conter spoilers" });
      await expect(revelar).toBeVisible(); expect(consultas).toEqual([]);
      expect(await page.content()).not.toContain(texto);
      expect(await page.content()).not.toContain(resposta);
      const axe = await new AxeBuilder({ page }).include('[data-historietas-ler-capitulo-comments-root="true"]')
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
      expect(axe.violations.filter((v) => ["critical", "serious"].includes(v.impact)),
        axe.violations.map((v) => `${v.id}: ${v.nodes.length}`).join("; ")).toEqual([]);
      await revelar.click();
      await expect(dialog.getByText(texto, { exact: true })).toBeVisible();
      expect(consultas.length).toBe(1);
      await expect(dialog.locator(":focus")).toHaveCount(1);
      await dialog.getByRole("button", { name: "Ver 1 resposta", exact: true }).click();
      await expect(dialog.getByText(resposta, { exact: true })).toBeVisible();
      await dialog.locator('[data-comments-sheet-handle="true"]').focus();
      await page.keyboard.press("Escape");
      await expect(dialog).toHaveCount(0);
      await page.getByRole("button", { name: /^\d+ comentários?$/i }).click();
      await expect(revelar).toBeVisible(); expect(await page.content()).not.toContain(texto);
    });

    test("leitura confirmada em outro dispositivo libera; desmarcação e falha protegem", async ({ page }) => {
      await marcar(false);
      await loginAsVisitor(page);
      const dialog = await abrir(page, `/ler-capitulo?obraId=${obraId}&capituloId=${capituloId}`);
      const revelar = dialog.getByRole("button", { name: "Mostrar comentários — podem conter spoilers" });
      await expect(revelar).toBeVisible();
      // A consulta deve ter terminado antes de simular a próxima alteração remota.
      await expect.poll(async () => (await leitor.from("progresso_leitura").select("lido").eq("user_id", leitorId)
        .eq("obra_id", obraId).eq("capitulo_id", capituloId).single()).data?.lido).toBe(false);
      await marcar(true);
      await page.evaluate(() => window.dispatchEvent(new Event("focus")));
      await expect(dialog.getByText(texto, { exact: true })).toBeVisible();
      await marcar(false);
      await page.evaluate(() => window.dispatchEvent(new Event("focus")));
      await expect(revelar).toBeVisible(); expect(await page.content()).not.toContain(texto);
      await page.route("**/rest/v1/progresso_leitura?**", (route) => route.fulfill({ status: 503, body: '{}' }));
      await page.evaluate(() => window.dispatchEvent(new Event("focus")));
      await expect(revelar).toBeVisible();
      await revelar.click(); await expect(dialog.getByText(texto, { exact: true })).toBeVisible();
    });

    test("autor verificado mantém acesso sem marcar leitura", async ({ page }) => {
      await loginAsAuthor(page);
      const dialog = await abrir(page);
      await expect(dialog.getByText(texto, { exact: true })).toBeVisible();
      await expect(dialog.getByRole("button", { name: "Mostrar comentários — podem conter spoilers" })).toHaveCount(0);
    });

    test("notificação legada não revela nem indexa o spoiler", async ({ page }) => {
      await loginAsVisitor(page);
      await page.evaluate(({ leitorId, obraId, capituloId, caminho, texto }) => {
        localStorage.setItem(`historietas-notificacoes:${leitorId}`, JSON.stringify([{
          id: "spoiler-legado-e2e", obraId, capituloId, link: caminho,
          tipo: "comentario-capitulo", titulo: texto, mensagem: texto,
          lida: false, criadaEm: new Date().toISOString(),
        }]));
      }, { leitorId, obraId, capituloId, caminho, texto });
      await page.goto("/notificacoes", { waitUntil: "domcontentloaded" });
      // O card usa o título fixo do tipo; o título legado não deve ser exibido.
      await expect(page.getByRole("heading", { name: "Novo comentário no capítulo", exact: true })).toBeVisible();
      expect(await page.content()).not.toContain(texto);
      if (dispositivo === "mobile") await page.getByRole("button", { name: "Abrir busca", exact: true }).click();
      await page.getByRole("textbox", { name: "Buscar notificações..." }).fill("identidade secreta do final");
      await expect(page.getByText("Nada encontrado", { exact: true })).toBeVisible();
    });
  });
}
