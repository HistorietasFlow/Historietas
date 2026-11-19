import { randomUUID } from "node:crypto";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { cleanupWorkByTitle, destructiveEnabled, hasAuthorCredentials, loginAsAuthor } from "./helpers.mjs";

const textoCapitulo = "Este texto pertence somente à obra fictícia criada no ambiente local de teste.";

async function preencherObra(page, titulo) {
  await page.goto("/publicar");
  const form = page.locator("form");
  await form.getByLabel("Título da obra", { exact: true }).fill(titulo);
  await form.locator("#publicar-formato").selectOption("Conto");
  await form.locator("#publicar-genero").selectOption("Fantasia");
  await form.locator("#publicar-classificacao").selectOption("Livre");
  await form.getByRole("textbox", { name: "Sinopse", exact: true }).fill(textoCapitulo);
  return form;
}

for (const [dispositivo, viewport] of [
  ["desktop", { width: 1440, height: 900 }],
  ["mobile", { width: 390, height: 844 }],
]) {
  test(`atalho abre a mesma obra e cria o capítulo 2 somente ao enviar (${dispositivo})`, async ({ page, baseURL }) => {
    test.skip(!hasAuthorCredentials || !destructiveEnabled, "Requer conta de teste e autorização de escrita no Supabase local descartável.");
    for (const url of [baseURL, process.env.NEXT_PUBLIC_SUPABASE_URL]) {
      expect(["127.0.0.1", "localhost", "[::1]"]).toContain(new URL(url).hostname);
    }
    await page.setViewportSize(viewport);

    const titulo = `Obra QA próximo capítulo ${randomUUID()}`;
    const tituloSemCapitulo = `Obra QA sem capítulo ${randomUUID()}`;
    const enviosCapitulos = [];
    page.on("request", request => {
      if (request.method() === "POST" && new URL(request.url()).pathname === "/rest/v1/capitulos") {
        const dados = request.postDataJSON();
        enviosCapitulos.push(...(Array.isArray(dados) ? dados : [dados]));
      }
    });
    const atalho = page.getByRole("link", { name: "Adicionar próximo capítulo", exact: true });

    try {
      await loginAsAuthor(page);
      const publicar = await preencherObra(page, titulo);
      await publicar.locator('input[type="file"][accept^=".pdf"]').setInputFiles({
        name: "capitulo-1.txt", mimeType: "text/plain", buffer: Buffer.from(textoCapitulo),
      });
      await page.getByRole("button", { name: "Transformar em capítulo", exact: true }).click();
      await expect(page.getByRole("region", { name: "Primeiro capítulo importado" })).toBeVisible();
      await publicar.getByRole("button", { name: "Criar obra", exact: true }).click();

      await expect(page).toHaveURL(/\/painel-autor$/);
      await expect(atalho).toBeVisible();
      expect(enviosCapitulos).toHaveLength(1);
      const obraId = enviosCapitulos[0].obra_id;
      expect(enviosCapitulos[0]).toMatchObject({ ordem: 1, publicado: true });
      await expect(atalho).toHaveAttribute("href", `/adicionar-capitulo?obraId=${obraId}`);
      await expect(page.getByRole("region", { name: "Capítulo 1 publicado" })).toContainText(titulo);

      const axe = await new AxeBuilder({ page }).include('[aria-labelledby="painel-proximo-capitulo"]').analyze();
      expect(axe.violations.filter(v => ["serious", "critical"].includes(v.impact))).toEqual([]);
      if (dispositivo === "desktop") await atalho.press("Enter");
      else await atalho.click();
      await expect(page).toHaveURL(`/adicionar-capitulo?obraId=${obraId}`);

      const adicionar = page.locator("form");
      const texto = adicionar.getByLabel("Texto do capítulo", { exact: true });
      await expect(adicionar.getByRole("heading", { name: titulo, exact: true })).toBeVisible();
      await expect(adicionar.getByText("Capítulo 02", { exact: true })).toBeVisible();
      await texto.fill(textoCapitulo);
      expect(enviosCapitulos).toHaveLength(1);
      await adicionar.getByRole("button", { name: "Criar capítulo", exact: true }).click();
      await expect(adicionar.getByRole("button", { name: "Criado", exact: true })).toBeVisible();
      expect(enviosCapitulos).toHaveLength(2);
      expect(enviosCapitulos[1]).toMatchObject({ obra_id: obraId, ordem: 2 });

      await adicionar.getByRole("button", { name: "Novo capítulo", exact: true }).click();
      await expect(adicionar.getByText("Capítulo 03", { exact: true })).toBeVisible();
      await expect(texto).toHaveValue("");
      await expect(adicionar.getByRole("heading", { name: titulo, exact: true })).toBeVisible();
      expect(enviosCapitulos).toHaveLength(2);

      const semCapitulo = await preencherObra(page, tituloSemCapitulo);
      await semCapitulo.getByRole("button", { name: "Criar obra", exact: true }).click();
      await expect(page).toHaveURL(/\/painel-autor$/);
      await expect(page.getByText(tituloSemCapitulo, { exact: true })).toBeVisible();
      await expect(atalho).toHaveCount(0);
      expect(enviosCapitulos).toHaveLength(2);
    } finally {
      await cleanupWorkByTitle(titulo);
      await cleanupWorkByTitle(tituloSemCapitulo);
    }
  });
}
