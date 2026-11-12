import { randomUUID } from "node:crypto";
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createClient } from "@supabase/supabase-js";
import { authorEmail, authorPassword, destructiveEnabled, hasAuthorCredentials, loginAsAuthor } from "./helpers.mjs";

const tituloRascunho = "Editar capítulo — um rascunho com título longo para verificar quebra de linha no celular e continuidade da edição";
const texto = "Texto privado que já estava salvo.\n\n  Espaços, parágrafos e **marcação literal** preservados.";
let cliente, obraId, obraSemRascunhosId, publicadoId, primeiroId, outroId, estadoInicial;

test.beforeAll(async () => {
  if (!hasAuthorCredentials || !destructiveEnabled) return;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  expect(["127.0.0.1", "localhost", "[::1]"]).toContain(new URL(url).hostname);
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  cliente = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const login = await cliente.auth.signInWithPassword({ email: authorEmail, password: authorPassword });
  expect(login.error).toBeNull();
  const userId = login.data.user.id;
  obraId = randomUUID(); publicadoId = randomUUID(); primeiroId = randomUUID(); outroId = randomUUID();
  obraSemRascunhosId = randomUUID();
  expect((await cliente.from("obras").insert({ id: obraId, user_id: userId, titulo: "Obra com rascunhos E2E",
    autor: "Autor E2E", genero: "Fantasia", formato: "Romance", classificacao_indicativa: "Livre",
    publicado: true, slug: `rascunhos-e2e-${obraId}` })).error).toBeNull();
  expect((await cliente.from("obras").insert({ id: obraSemRascunhosId, user_id: userId, titulo: "Obra sem rascunhos E2E",
    autor: "Autor E2E", genero: "Fantasia", formato: "Romance", classificacao_indicativa: "Livre",
    publicado: false, slug: `sem-rascunhos-e2e-${obraSemRascunhosId}` })).error).toBeNull();
  expect((await cliente.from("capitulos").insert([
    { id: publicadoId, obra_id: obraId, user_id: userId, ordem: 1, titulo: "Publicado", texto: "Texto público.", publicado: true },
    { id: primeiroId, obra_id: obraId, user_id: userId, ordem: 7, titulo: tituloRascunho, texto, publicado: false },
    { id: outroId, obra_id: obraId, user_id: userId, ordem: 19, titulo: "Outro rascunho", texto: "Outro texto privado.", publicado: false },
    { id: randomUUID(), obra_id: obraSemRascunhosId, user_id: userId, ordem: 3, titulo: "Publicado sem rascunhos", texto: "Texto salvo.", publicado: true },
  ])).error).toBeNull();
  estadoInicial = await estadoBanco();
});

async function estadoBanco() {
  const result = await cliente.from("capitulos").select("id,titulo,texto,ordem,publicado,atualizado_em").in("obra_id", [obraId, obraSemRascunhosId]).order("ordem");
  expect(result.error).toBeNull();
  return result.data;
}

test.afterAll(async () => {
  if (cliente && obraId) expect((await cliente.from("obras").delete().in("id", [obraId, obraSemRascunhosId])).error).toBeNull();
  await cliente?.auth.signOut({ scope: "local" });
});

async function selecionarRascunhos(page) {
  await page.getByRole("button", { name: "Abrir painel do autor", exact: true }).click();
  const opcao = page.getByRole("button", { name: "Com capítulos em rascunho", exact: true });
  await opcao.focus();
  await page.keyboard.press("Enter");
  await expect(opcao).toHaveCount(0);
}

for (const [device, viewport] of [["desktop", { width: 1440, height: 900 }], ["mobile", { width: 390, height: 844 }]]) {
  test(`continua o primeiro rascunho confirmado sem escrever nem consultar novamente — ${device}`, async ({ page, baseURL }) => {
    test.skip(!hasAuthorCredentials || !destructiveEnabled, "Requer fixtures descartáveis locais.");
    expect(["127.0.0.1", "localhost", "[::1]"]).toContain(new URL(baseURL).hostname);
    await page.setViewportSize(viewport);
    await loginAsAuthor(page);
    const consultas = [], escritas = [];
    page.on("request", request => {
      const url = new URL(request.url());
      if (url.pathname === "/rest/v1/capitulos") {
        if (request.method() !== "GET") escritas.push(request.method());
        if (url.searchParams.get("select") === "id,obra_id,user_id,titulo,texto,ordem,publicado,criado_em,atualizado_em") consultas.push(url.pathname);
      }
    });
    await page.goto("/painel-autor", { waitUntil: "domcontentloaded" });
    const painel = page.locator('[data-historietas-painel-autor-root="true"]');
    const card = painel.locator("article").filter({ has: page.getByRole("heading", { name: "Obra com rascunhos E2E", exact: true }) });
    await expect(card.getByText("2 capítulos em rascunho", { exact: true })).toBeVisible();
    await expect(card.getByText("Publicado", { exact: true })).toBeVisible();
    const semRascunhos = painel.getByRole("heading", { name: "Obra sem rascunhos E2E", exact: true });
    await expect(semRascunhos).toBeVisible();
    const requisicoesFiltro = [];
    const registrarFiltro = request => {
      if (new URL(request.url()).pathname.startsWith("/rest/v1/")) requisicoesFiltro.push(request.method());
    };
    page.on("request", registrarFiltro);
    await selecionarRascunhos(page);
    await expect(card).toBeVisible();
    await expect(semRascunhos).toHaveCount(0);
    await page.getByRole("button", { name: "Abrir painel do autor", exact: true }).click();
    await expect(page.getByRole("button", { name: "Com capítulos em rascunho", exact: true })).toHaveAttribute("aria-pressed", "true");
    const axeFiltro = await new AxeBuilder({ page }).include('section[aria-label="Painel do autor"]').analyze();
    expect(axeFiltro.violations.filter(v => ["serious", "critical"].includes(v.impact))).toEqual([]);
    await page.getByRole("button", { name: "Com capítulos em rascunho", exact: true }).click();
    await painel.getByRole("button", { name: "Limpar filtros", exact: true }).click();
    await expect(semRascunhos).toBeVisible();
    await selecionarRascunhos(page);
    await expect(semRascunhos).toHaveCount(0);
    expect(requisicoesFiltro).toEqual([]);
    page.off("request", registrarFiltro);
    await card.getByRole("button", { name: "Abrir opções de Obra com rascunhos E2E", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toHaveCount(1);
    await expect(dialog).toHaveAccessibleName("Ações de Obra com rascunhos E2E");
    const atalho = dialog.getByRole("link", { name: `Continuar rascunho — ${tituloRascunho}`, exact: true });
    await expect(atalho).toHaveAttribute("href", `/editar-capitulo?obraId=${obraId}&capituloId=${primeiroId}`);
    await expect(dialog.getByRole("link", { name: "Editar capítulo", exact: true })).toHaveAttribute("href", `/editar-capitulo?obraId=${obraId}&capituloId=${publicadoId}`);
    for (const [idioma, rotulo, contagem, nomeDialogo] of [["en", "Continue draft", "2 draft chapters", "Actions for"], ["es", "Continuar borrador", "2 capítulos en borrador", "Acciones de"], ["pt-BR", "Continuar rascunho", "2 capítulos em rascunho", "Ações de"]]) {
      await page.evaluate(idioma => {
        localStorage.setItem("historietas-idioma", idioma);
        window.dispatchEvent(new StorageEvent("storage", { key: "historietas-idioma", newValue: idioma }));
      }, idioma);
      await expect(dialog).toHaveAccessibleName(`${nomeDialogo} Obra com rascunhos E2E`);
      await expect(dialog.getByRole("link", { name: `${rotulo} — ${tituloRascunho}`, exact: true })).toBeVisible();
      await expect(card.getByText(contagem, { exact: true })).toBeVisible();
    }
    const axe = await new AxeBuilder({ page }).include('[role="dialog"]').analyze();
    expect(axe.violations.filter(v => ["serious", "critical"].includes(v.impact))).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    expect(await atalho.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    expect(consultas).toHaveLength(1);
    expect(escritas).toEqual([]);
    await atalho.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(`${baseURL}/editar-capitulo?obraId=${obraId}&capituloId=${primeiroId}`);
    await expect(page.getByLabel("Texto do capítulo", { exact: true })).toHaveValue(texto);
    expect(await estadoBanco()).toEqual(estadoInicial);
    expect(escritas).toEqual([]);
  });

  test(`falha remota preserva fallback sem certificar contagem ou destino — ${device}`, async ({ page }) => {
    test.skip(!hasAuthorCredentials || !destructiveEnabled, "Requer fixtures descartáveis locais.");
    await page.setViewportSize(viewport);
    await loginAsAuthor(page);
    await page.goto("/painel-autor");
    const painel = page.locator('[data-historietas-painel-autor-root="true"]');
    await expect(painel.getByRole("heading", { name: "Obra com rascunhos E2E", exact: true })).toBeVisible();
    await expect(painel.locator("article").filter({ has: page.getByRole("heading", { name: "Obra com rascunhos E2E", exact: true }) }).getByText("2 capítulos em rascunho", { exact: true })).toBeVisible();
    await page.route("**/rest/v1/capitulos?**", route => route.fulfill({ status: 503, json: { message: "Falha local controlada" } }));
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(painel.getByRole("heading", { name: "Obra com rascunhos E2E", exact: true })).toBeVisible();
    await expect(painel.getByText(/\d+ capítulos? em rascunho/)).toHaveCount(0);
    const requisicoesFiltro = [];
    const registrarFiltro = request => {
      if (new URL(request.url()).pathname.startsWith("/rest/v1/")) requisicoesFiltro.push(request.method());
    };
    page.on("request", registrarFiltro);
    await selecionarRascunhos(page);
    const aviso = painel.getByRole("status");
    await expect(aviso.getByText("Confirmação de rascunhos limitada", { exact: true })).toBeVisible();
    await expect(painel.locator("article")).toHaveCount(0);
    await expect(painel.getByText("Nenhuma obra encontrada", { exact: true })).toHaveCount(0);
    for (const [idioma, titulo] of [["en", "Limited draft confirmation"], ["es", "Confirmación de borradores limitada"], ["pt-BR", "Confirmação de rascunhos limitada"]]) {
      await page.evaluate(idioma => {
        localStorage.setItem("historietas-idioma", idioma);
        window.dispatchEvent(new StorageEvent("storage", { key: "historietas-idioma", newValue: idioma }));
      }, idioma);
      await expect(aviso.getByText(titulo, { exact: true })).toBeVisible();
    }
    const axeAviso = await new AxeBuilder({ page }).include('[data-historietas-painel-autor-root="true"]').analyze();
    expect(axeAviso.violations.filter(v => ["serious", "critical"].includes(v.impact))).toEqual([]);
    await aviso.getByRole("button", { name: "Limpar filtros", exact: true }).click();
    await expect(painel.getByRole("heading", { name: "Obra com rascunhos E2E", exact: true })).toBeVisible();
    expect(requisicoesFiltro).toEqual([]);
    page.off("request", registrarFiltro);
    await painel.getByRole("button", { name: "Abrir opções de Obra com rascunhos E2E", exact: true }).click();
    await expect(page.getByRole("dialog").getByRole("link", { name: /^Continuar rascunho/ })).toHaveCount(0);
    expect(await estadoBanco()).toEqual(estadoInicial);
  });
}
