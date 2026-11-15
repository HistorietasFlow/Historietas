import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

import {
  hasVisitorCredentials,
  visitorEmail,
  visitorPassword,
} from "./helpers.mjs";

const slug = (process.env.E2E_PUBLIC_WORK_SLUG || "").trim();
const workId = (process.env.E2E_PUBLIC_WORK_ID || "").trim();
const chapterId = (process.env.E2E_PUBLIC_CHAPTER_ID || "").trim();
const canonicalPath = `/obra/${encodeURIComponent(slug)}/capitulo/1`;
const sessions = [];
let cleanupSession, desktop, mobile;
const fixturesDisponiveis = hasVisitorCredentials && slug && workId && chapterId;

// Os nomes são constantes deste arquivo; nunca registrar respostas ou identidade.
async function etapa(nome, executar) {
  return test.step(nome, async () => {
    const inicio = performance.now();
    let status = "failed";
    try {
      const resultado = await executar();
      status = "passed";
      return resultado;
    } finally {
      console.log(JSON.stringify({ phase: nome, status, durationMs: Math.round(performance.now() - inicio) }));
    }
  });
}

async function autenticar(nome) {
  const api = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const key = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
  expect(["127.0.0.1", "localhost", "[::1]"]).toContain(new URL(api).hostname);
  const client = createClient(api, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  // Registrar antes do primeiro await garante cleanup mesmo em preparo parcial.
  const recurso = { nome, client };
  sessions.push(recurso);
  recurso.session = await etapa(`${nome}: autenticar`, async () => {
    const auth = await client.auth.signInWithPassword({ email: visitorEmail, password: visitorPassword });
    expect(auth.error === null).toBe(true);
    expect(Boolean(auth.data.user?.id && auth.data.session)).toBe(true);
    return auth.data.session;
  });
  return recurso;
}

async function abrirLeitorComIdentidadeCarregada(page, nome) {
  const identidadeCarregada = etapa(`${nome}: identidade HTTP 200`, () => page.waitForResponse(
    (response) =>
      response.url().includes("/auth/v1/user") && response.status() === 200,
  ));
  const interacoesCarregadas = etapa(`${nome}: metricas HTTP 200`, () => page.waitForResponse(
    (response) =>
      response.url().includes("/rpc/obter_metricas_conteudos") &&
      response.status() === 200 &&
      (response.request().postDataJSON()?.p_obra_ids || []).length === 0 &&
      (response.request().postDataJSON()?.p_capitulo_ids || []).includes(chapterId),
  ));

  await Promise.all([
    identidadeCarregada,
    interacoesCarregadas,
    etapa(`${nome}: navegar leitor`, () => page.goto(canonicalPath, { waitUntil: "domcontentloaded" })),
  ]);
  await page.evaluate(() =>
    new Promise((resolve) => requestAnimationFrame(() => resolve(null))),
  );
}

async function limparProgressoLocal(fase) {
  const { client, session } = cleanupSession;
  const work = await etapa(`${fase}: confirmar obra`, async () => {
    const result = await client.from("obras").select("id").eq("slug", slug).single();
    expect(result.error === null).toBe(true);
    expect(result.data?.id === workId).toBe(true);
    return result.data;
  });
  const falhas = [];
  for (const tabela of ["seguindo_obras", "obra_curtidas", "favoritos", "concluidas", "progresso_leitura"]) {
    try {
      await etapa(`${fase}: limpar ${tabela}`, async () => {
        let query = client.from(tabela).delete().eq("user_id", session.user.id).eq("obra_id", work.id);
        if (tabela === "progresso_leitura") query = query.eq("capitulo_id", chapterId);
        const result = await query;
        expect(result.error === null).toBe(true);
      });
    } catch {
      falhas.push(tabela);
    }
  }
  if (falhas.length) throw new Error(`Limpeza incompleta: ${falhas.join(", ")}`);
}

// O alvo deste E2E é sincronização entre dispositivos, não o formulário de login.
// Reutiliza a sessão Auth real e cookies SSR já exercitados no leitor canônico.
async function criarPaginaVisitante(browser, baseURL, width, nome) {
  const api = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const key = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
  expect(["127.0.0.1", "localhost", "[::1"]).toContain(new URL(api).hostname);
  expect(["127.0.0.1", "localhost", "[::1"]).toContain(new URL(baseURL).hostname);
  const recurso = await autenticar(nome);
  const { session } = recurso;
  const cookies = new Map();
  const serverAuth = createServerClient(api, key, { cookies: { getAll: () => [], setAll: values => {
    for (const cookie of values) cookies.set(cookie.name, cookie);
  } } });
  await etapa(`${nome}: sessao SSR`, async () => {
    const saved = await serverAuth.auth.setSession({ access_token: session.access_token, refresh_token: session.refresh_token });
    expect(saved.error === null).toBe(true);
  });
  recurso.context = await etapa(`${nome}: criar contexto`, () => browser.newContext({ viewport: { width, height: width === 390 ? 844 : 900 } }));
  await etapa(`${nome}: aplicar cookies SSR`, () => recurso.context.addCookies([...cookies.values()].filter(c => c.value).map(c => ({ name: c.name, value: c.value, url: baseURL, sameSite: "Lax" }))));
  recurso.page = await etapa(`${nome}: criar pagina`, () => recurso.context.newPage());
  return recurso;
}

// Hooks mantêm o limite padrão; o orçamento funcional não inclui preparo/teardown.
test.beforeAll(async ({ browser, baseURL }) => {
  if (!fixturesDisponiveis) return;
  await etapa("preparo", async () => {
    cleanupSession = await autenticar("limpeza");
    await limparProgressoLocal("preparo");
    desktop = await criarPaginaVisitante(browser, baseURL, 1440, "desktop");
    mobile = await criarPaginaVisitante(browser, baseURL, 390, "mobile");
  });
});

test.afterAll(async () => {
  const falhas = [];
  async function tentar(nome, executar) {
    try { await etapa(nome, executar); } catch { falhas.push(nome); }
  }
  // Cada recurso é independente: inclusive um erro de close não impede signOut.
  for (const recurso of sessions) {
    if (!recurso.context) continue;
    await tentar(`${recurso.nome}: fechar contexto`, async () => {
      try { await recurso.context.close(); } catch (error) {
        if (!String(error?.message).includes("Target page, context or browser has been closed")) throw error;
        console.log(JSON.stringify({ phase: `${recurso.nome}: contexto ja fechado`, status: "closed" }));
      }
    });
  }
  if (cleanupSession?.session) await tentar("limpeza final", () => limparProgressoLocal("final"));
  for (const recurso of sessions) {
    await tentar(`${recurso.nome}: encerrar sessao`, async () => {
      const result = await recurso.client.auth.signOut({ scope: "local" });
      expect(result.error === null).toBe(true);
    });
  }
  if (falhas.length) throw new Error(`Cleanup incompleto: ${falhas.join(", ")}`);
});

test("sincroniza leitor, Home e Biblioteca entre computador e celular", async () => {
  test.skip(!fixturesDisponiveis, "Prepare as fixtures E2E locais antes do teste.");
  await etapa("sincronizacao", async () => {
    const paginaComputador = desktop.page;
    const paginaCelular = mobile.page;
    await etapa("desktop: abrir leitor autenticado", () => abrirLeitorComIdentidadeCarregada(paginaComputador, "desktop"));
    await etapa("mobile: abrir leitor autenticado", () => abrirLeitorComIdentidadeCarregada(paginaCelular, "mobile"));

    await etapa("desktop: marcar leitura", async () => {
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
    ).toBe(true);
    await expect(
      paginaComputador.getByRole("button", {
        name: "Marcar capítulo como não lido",
      }),
    ).toBeVisible();
    });

    await etapa("mobile: confirmar leitura sincronizada", async () => {
    await paginaCelular.reload({ waitUntil: "domcontentloaded" });
    await expect(
      paginaCelular.getByRole("button", {
        name: "Marcar capítulo como não lido",
      }),
    ).toBeVisible();
    });

    await etapa("mobile: confirmar Home", async () => {
    await paginaCelular.goto("/", { waitUntil: "domcontentloaded" });
    const continuar = paginaCelular
      .locator("section")
      .filter({ has: paginaCelular.getByRole("heading", { name: "Continuar lendo" }) });
    await expect(continuar).toContainText("Obra Pública E2E");
    await expect(continuar).toContainText("50% lido");
    });

    await etapa("mobile: confirmar Biblioteca", async () => {
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
    });

    await etapa("mobile: desmarcar leitura", async () => {
    await paginaCelular.goto(canonicalPath, { waitUntil: "domcontentloaded" });
    const desmarcarCelular = paginaCelular.getByRole("button", {
      name: "Marcar capítulo como não lido",
    });
    await expect(desmarcarCelular).toBeVisible();
    await desmarcarCelular.click();
    await expect(
      paginaCelular.getByRole("button", { name: "Marcar capítulo como lido" }),
    ).toBeVisible();
    });

    await etapa("desktop: confirmar desmarcacao sincronizada", async () => {
    await paginaComputador.reload({ waitUntil: "domcontentloaded" });
    await expect(
      paginaComputador.getByRole("button", { name: "Marcar capítulo como lido" }),
    ).toBeVisible();
    });
  });
});
