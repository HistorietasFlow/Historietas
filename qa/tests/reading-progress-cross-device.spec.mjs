import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

import {
  hasVisitorCredentials,
  resetVisitorWorkInteractions,
  visitorEmail,
  visitorPassword,
} from "./helpers.mjs";

const slug = (process.env.E2E_PUBLIC_WORK_SLUG || "").trim();
const workId = (process.env.E2E_PUBLIC_WORK_ID || "").trim();
const chapterId = (process.env.E2E_PUBLIC_CHAPTER_ID || "").trim();
const canonicalPath = `/obra/${encodeURIComponent(slug)}/capitulo/1`;

async function abrirLeitorComIdentidadeCarregada(page) {
  const identidadeCarregada = page.waitForResponse(
    (response) =>
      response.url().includes("/auth/v1/user") && response.status() === 200,
  );
  const interacoesCarregadas = page.waitForResponse(
    (response) =>
      response.url().includes("/rpc/obter_metricas_conteudos") &&
      response.status() === 200 &&
      (response.request().postDataJSON()?.p_obra_ids || []).length === 0 &&
      (response.request().postDataJSON()?.p_capitulo_ids || []).includes(chapterId),
  );

  await Promise.all([
    identidadeCarregada,
    interacoesCarregadas,
    page.goto(canonicalPath, { waitUntil: "domcontentloaded" }),
  ]);
  await page.evaluate(() =>
    new Promise((resolve) => requestAnimationFrame(() => resolve(null))),
  );
}

async function limparProgressoLocal() {
  await resetVisitorWorkInteractions(slug);

  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const key = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ""
  ).trim();
  const destino = new URL(url);

  expect(["127.0.0.1", "localhost", "[::1]"]).toContain(destino.hostname);

  const client = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
  const login = await client.auth.signInWithPassword({
    email: visitorEmail,
    password: visitorPassword,
  });
  expect(login.error).toBeNull();
  expect(login.data.user?.id).toBeTruthy();

  const limpeza = await client
    .from("progresso_leitura")
    .delete()
    .eq("user_id", login.data.user.id)
    .eq("obra_id", workId)
    .eq("capitulo_id", chapterId);
  expect(limpeza.error).toBeNull();
  await client.auth.signOut({ scope: "local" });
}

// O alvo deste E2E é sincronização entre dispositivos, não o formulário de login.
// Reutiliza a sessão Auth real e cookies SSR já exercitados no leitor canônico.
async function criarPaginaVisitante(browser, baseURL, width) {
  const api = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const key = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
  expect(["127.0.0.1", "localhost", "[::1"]).toContain(new URL(api).hostname);
  expect(["127.0.0.1", "localhost", "[::1"]).toContain(new URL(baseURL).hostname);
  const client = createClient(api, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  const auth = await client.auth.signInWithPassword({ email: visitorEmail, password: visitorPassword });
  expect(auth.error).toBeNull();
  const session = auth.data.session;
  expect(session).toBeTruthy();
  const cookies = new Map();
  const serverAuth = createServerClient(api, key, { cookies: { getAll: () => [], setAll: values => {
    for (const cookie of values) cookies.set(cookie.name, cookie);
  } } });
  const saved = await serverAuth.auth.setSession({ access_token: session.access_token, refresh_token: session.refresh_token });
  expect(saved.error).toBeNull();
  const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 900 } });
  await context.addCookies([...cookies.values()].filter(c => c.value).map(c => ({ name: c.name, value: c.value, url: baseURL, sameSite: "Lax" })));
  return { context, client, page: await context.newPage() };
}

test("sincroniza leitor, Home e Biblioteca entre computador e celular", async ({
  browser, baseURL,
}) => {
  test.skip(
    !hasVisitorCredentials || !slug || !workId || !chapterId,
    "Prepare as fixtures E2E locais antes do teste.",
  );

  await limparProgressoLocal();

  const sessions = [];
  try {
    const desktop = await criarPaginaVisitante(browser, baseURL, 1440);
    sessions.push(desktop);
    const mobile = await criarPaginaVisitante(browser, baseURL, 390);
    sessions.push(mobile);
    const paginaComputador = desktop.page;
    const paginaCelular = mobile.page;
    await abrirLeitorComIdentidadeCarregada(paginaComputador);
    await abrirLeitorComIdentidadeCarregada(paginaCelular);

    const marcarComputador = paginaComputador.getByRole("button", {
      name: "Marcar capítulo como lido",
    });
    await expect(marcarComputador).toBeVisible();
    const respostaMarcacao = paginaComputador.waitForResponse((response) =>
      response.url().includes("/rpc/salvar_progresso_leitura"),
    );
    await marcarComputador.click();
    const respostaMarcacaoRecebida = await respostaMarcacao;
    expect(
      respostaMarcacaoRecebida.ok(),
      await respostaMarcacaoRecebida.text(),
    ).toBe(true);
    await expect(
      paginaComputador.getByRole("button", {
        name: "Marcar capítulo como não lido",
      }),
    ).toBeVisible();

    await paginaCelular.reload({ waitUntil: "domcontentloaded" });
    await expect(
      paginaCelular.getByRole("button", {
        name: "Marcar capítulo como não lido",
      }),
    ).toBeVisible();

    await paginaCelular.goto("/", { waitUntil: "domcontentloaded" });
    const continuar = paginaCelular
      .locator("section")
      .filter({ has: paginaCelular.getByRole("heading", { name: "Continuar lendo" }) });
    await expect(continuar).toContainText("Obra Pública E2E");
    await expect(continuar).toContainText("50% lido");

    await paginaCelular.goto("/perfil-autor", { waitUntil: "domcontentloaded" });
    await expect(
      paginaCelular.getByRole("heading", { name: "Leitor E2E" }),
    ).toBeVisible();
    const bibliotecaSincronizada = paginaCelular.waitForResponse(
      (response) =>
        response.url().includes("/rest/v1/progresso_leitura") &&
        response.status() === 200,
    );
    await paginaCelular.getByRole("button", { name: "Biblioteca" }).click();
    const respostaBiblioteca = await bibliotecaSincronizada;
    const progressoBiblioteca = await respostaBiblioteca.json();
    expect(progressoBiblioteca).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ obra_id: workId, lido: true }),
      ]),
    );
    await paginaCelular.getByRole("button", { name: "Lendo", exact: true }).click();
    await expect(
      paginaCelular.getByRole("link", { name: "Abrir Obra Pública E2E" }),
    ).toBeVisible();

    await paginaCelular.goto(canonicalPath, { waitUntil: "domcontentloaded" });
    const desmarcarCelular = paginaCelular.getByRole("button", {
      name: "Marcar capítulo como não lido",
    });
    await expect(desmarcarCelular).toBeVisible();
    await desmarcarCelular.click();
    await expect(
      paginaCelular.getByRole("button", { name: "Marcar capítulo como lido" }),
    ).toBeVisible();

    await paginaComputador.reload({ waitUntil: "domcontentloaded" });
    await expect(
      paginaComputador.getByRole("button", { name: "Marcar capítulo como lido" }),
    ).toBeVisible();
  } finally {
    for (const session of sessions) await session.context.close();
    for (const session of sessions) await session.client.auth.signOut({ scope: "local" });
    await limparProgressoLocal();
  }
});
