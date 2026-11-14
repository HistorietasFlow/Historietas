import { randomUUID } from "node:crypto";
import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import {
  authorEmail, authorPassword, visitorEmail, visitorPassword,
  hasAuthorCredentials, hasVisitorCredentials, destructiveEnabled,
  loginAsAuthor, loginAsVisitor,
} from "./helpers.mjs";

let author, visitor, authorId, visitorId;
const works = [];
const text = "Texto integral do capítulo em rascunho. Não deve mudar ao editar metadados.";
const synopsis = "Sinopse original suficientemente longa para a edição de uma obra de texto.";
const check = result => { expect(result.error).toBeNull(); return result.data; };
const root = page => page.locator('main[data-historietas-editar-obra-root="true"]:visible');
const status = page => root(page).getByRole("combobox", { name: "Estado da história", exact: true });
const save = page => root(page).getByRole("button", { name: "Salvar alterações", exact: true });
const isWorkRequest = (request, id, method) => {
  const url = new URL(request.url());
  return request.method() === method && url.pathname === "/rest/v1/obras"
    && url.searchParams.get("id") === `eq.${id}`;
};

test.beforeAll(async () => {
  expect(hasAuthorCredentials && hasVisitorCredentials && destructiveEnabled).toBe(true);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  for (const target of [url, process.env.E2E_BASE_URL]) {
    expect(["127.0.0.1", "localhost", "[::1]"]).toContain(new URL(target).hostname);
  }
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };
  author = createClient(url, key, options);
  visitor = createClient(url, key, options);
  authorId = check(await author.auth.signInWithPassword({ email: authorEmail, password: authorPassword })).user.id;
  visitorId = check(await visitor.auth.signInWithPassword({ email: visitorEmail, password: visitorPassword })).user.id;
  expect(visitorId).not.toBe(authorId);
});

test.afterAll(async () => {
  // Somente os UUIDs criados neste arquivo; nunca limpar catálogo ou contas.
  if (author && works.length) check(await author.from("obras").delete().in("id", works));
});

async function fixture() {
  const id = randomUUID(), chapterId = randomUUID();
  works.push(id);
  const work = {
    id, user_id: authorId, titulo: `QA texto ${id}`, autor: "Autor E2E",
    genero: "Fantasia", formato: "Romance", classificacao_indicativa: "Livre",
    avisos_conteudo: [], tags: [], sinopse: synopsis, publicado: false,
    slug: `qa-editar-texto-${id}`, capa_url: "", status_editorial: "pausada",
  };
  check(await author.from("obras").insert(work));
  check(await author.from("capitulos").insert({
    id: chapterId, obra_id: id, user_id: authorId, ordem: 3,
    titulo: "Capítulo em rascunho", texto: text, publicado: false, tipo_conteudo: "texto",
  }));
  return { ...work, chapterId, path: `/editar-obra?obraId=${id}` };
}

async function editor(page, work) {
  await page.goto(work.path, { waitUntil: "domcontentloaded" });
  await expect(root(page)).toHaveCount(1);
  await expect(status(page)).toBeEnabled(); // confirmação remota, não o fallback local
  await expect(root(page).getByRole("textbox", { name: "Título da obra", exact: true })).toHaveValue(work.titulo);
  await expect(status(page)).toHaveValue("pausada");
}

async function chapterUnchanged(work) {
  expect(check(await author.from("capitulos")
    .select("id,obra_id,user_id,ordem,texto,publicado,tipo_conteudo").eq("id", work.chapterId).single()))
    .toEqual({ id: work.chapterId, obra_id: work.id, user_id: authorId,
      ordem: 3, texto: text, publicado: false, tipo_conteudo: "texto" });
}

async function cachedFixture(page, id) {
  return page.evaluate(({ id, users }) => users.map(userId => {
    const row = JSON.parse(localStorage.getItem(`historietas-obras:${userId}`) || "[]")
      .find(work => work.id === id);
    return row ? { id: row.id, titulo: row.titulo, autorId: row.autorId } : null;
  }), { id, users: [authorId, visitorId] });
}

for (const [device, viewport] of [
  ["desktop", { width: 1440, height: 900 }],
  ["mobile", { width: 390, height: 844 }],
]) {
  test(`salva metadados de texto sem reescrever status, capítulos ou publicação — ${device}`, async ({ page }) => {
    const work = await fixture();
    await page.setViewportSize(viewport);
    await loginAsAuthor(page);
    await editor(page, work);
    const before = check(await author.from("obras").select("status_editorial_versao").eq("id", work.id).single());
    const patches = [], storageWrites = [];
    page.on("request", request => {
      if (isWorkRequest(request, work.id, "PATCH")) patches.push(request);
      if (new URL(request.url()).pathname.startsWith("/storage/v1/")
        && ["POST", "PUT", "PATCH", "DELETE"].includes(request.method())) storageWrites.push(request);
    });
    const title = `${work.titulo} revisada`;
    const revised = "Sinopse revisada com  espaços internos.\n\n<b>Literal</b> e **marcação literal**.";
    await root(page).getByRole("textbox", { name: "Título da obra", exact: true }).fill(title);
    await root(page).getByRole("textbox", { name: "Sinopse", exact: true }).fill(revised);
    const confirmation = page.waitForResponse(response => isWorkRequest(response.request(), work.id, "PATCH"));
    await save(page).click();
    expect((await confirmation).status()).toBe(200);
    await expect(root(page).getByRole("button", { name: "Atualizada", exact: true })).toBeVisible();
    expect(patches).toHaveLength(1);
    const request = patches[0];
    expect(new URL(request.url()).searchParams.get("user_id")).toBe(`eq.${authorId}`);
    expect(request.postDataJSON()).not.toHaveProperty("status_editorial");
    expect(request.postDataJSON()).not.toHaveProperty("status_editorial_versao");
    expect(check(await author.from("obras")
      .select("titulo,sinopse,status_editorial,status_editorial_versao,publicado,formato,capa_url")
      .eq("id", work.id).single())).toEqual({
      titulo: title, sinopse: revised, status_editorial: "pausada",
      status_editorial_versao: before.status_editorial_versao,
      publicado: false, formato: "Romance", capa_url: "",
    });
    await chapterUnchanged(work);
    expect(check(await visitor.from("obras").select("id").eq("id", work.id))).toEqual([]);
    await page.reload();
    await expect(status(page)).toBeEnabled();
    await expect(root(page).getByRole("textbox", { name: "Título da obra", exact: true })).toHaveValue(title);
    await expect(root(page).getByRole("textbox", { name: "Sinopse", exact: true })).toHaveValue(revised);
    await expect(status(page)).toHaveValue("pausada");
    expect(patches).toHaveLength(1);
    expect(storageWrites).toHaveLength(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  });

  test(`resposta de A após logout e troca para B não confirma nem persiste na nova identidade — ${device}`, async ({ page, context }) => {
    const work = await fixture();
    await page.setViewportSize(viewport);
    await loginAsAuthor(page);
    await editor(page, work);
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    let committed;
    const commit = new Promise(resolve => { committed = resolve; });
    const patches = [], storageWrites = [];
    page.on("request", request => {
      if (isWorkRequest(request, work.id, "PATCH")) patches.push(request);
      if (new URL(request.url()).pathname.startsWith("/storage/v1/")
        && ["POST", "PUT", "PATCH", "DELETE"].includes(request.method())) storageWrites.push(request);
    });
    const routeHandler = async route => {
      if (!isWorkRequest(route.request(), work.id, "PATCH")) return route.continue();
      const response = await route.fetch({ maxRetries: 0 });
      expect(response.status()).toBe(200);
      const rows = await response.json();
      expect(rows).toHaveLength(1);
      expect(rows[0].id).toBe(work.id);
      expect(rows[0].user_id).toBe(authorId);
      committed(); // commit real anterior ao logout; não pode ser desfeito pela UI
      await gate;
      await route.fulfill({ response });
    };
    await page.route("**/rest/v1/obras?*", routeHandler);
    const other = await context.newPage();
    try {
      await root(page).getByRole("textbox", { name: "Título da obra", exact: true }).fill("Intenção autorizada de A antes do logout");
      await status(page).selectOption("concluida");
      await save(page).click();
      await commit;
      await expect(root(page).locator("fieldset")).toHaveJSProperty("disabled", true);
      expect(check(await author.from("obras").select("status_editorial").eq("id", work.id).single()).status_editorial).toBe("concluida");
      await other.goto("/configuracoes");
      await other.getByRole("button", { name: /Sair da conta/ }).click();
      await expect(other).toHaveURL(/\/login/);
      const login = other.waitForResponse(response => {
        const url = new URL(response.url());
        return url.pathname === "/auth/v1/token" && url.searchParams.get("grant_type") === "password";
      });
      await loginAsVisitor(other);
      const authenticated = await login;
      expect(authenticated.status()).toBe(200);
      expect((await authenticated.json()).user.id).toBe(visitorId);
      await expect(root(page).getByText(
        "O estado atual não foi confirmado. A edição editorial está indisponível.", { exact: true },
      )).toBeVisible();
      const cache = await cachedFixture(page, work.id);
      const late = page.waitForResponse(response => isWorkRequest(response.request(), work.id, "PATCH"));
      release();
      expect((await late).status()).toBe(200);
      await expect(root(page).locator("fieldset")).toHaveJSProperty("disabled", false); // finally do envio anterior terminou
      await expect(save(page)).toBeDisabled();
      await expect(status(page)).toBeDisabled();
      await expect(root(page).getByRole("button", { name: "Atualizada", exact: true })).toHaveCount(0);
      expect(await cachedFixture(page, work.id)).toEqual(cache);
      expect(patches).toHaveLength(1);
      expect(storageWrites).toHaveLength(0);
      await chapterUnchanged(work);
      expect(check(await visitor.from("obras").select("id").eq("id", work.id))).toEqual([]);
      expect(check(await visitor.from("obras").update({ titulo: "B não pode sobrescrever A" })
        .eq("id", work.id).select("id"))).toEqual([]);
      expect(check(await author.from("obras").select("titulo,user_id").eq("id", work.id).single()))
        .toEqual({ titulo: "Intenção autorizada de A antes do logout", user_id: authorId });
      await page.reload();
      await expect(root(page).getByText("Obra não encontrada", { exact: true })).toBeVisible();
      await expect(root(page).getByRole("textbox", { name: "Título da obra", exact: true })).toHaveCount(0);
      expect(patches).toHaveLength(1);
    } finally {
      release();
      await page.unrouteAll({ behavior: "wait" });
      await other.close();
    }
  });
}
