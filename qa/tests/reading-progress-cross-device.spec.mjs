import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

import {
  hasVisitorCredentials,
  loginAsVisitor,
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

test("sincroniza leitor, Home e Biblioteca entre computador e celular", async ({
  browser,
}) => {
  test.skip(
    !hasVisitorCredentials || !slug || !workId || !chapterId,
    "Prepare as fixtures E2E locais antes do teste.",
  );

  await limparProgressoLocal();

  const computador = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const celular = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const paginaComputador = await computador.newPage();
  const paginaCelular = await celular.newPage();

  try {
    await loginAsVisitor(paginaComputador);
    await loginAsVisitor(paginaCelular);
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
    await computador.close();
    await celular.close();
    await limparProgressoLocal();
  }
});
