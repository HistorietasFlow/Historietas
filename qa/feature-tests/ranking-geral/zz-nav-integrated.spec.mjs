import { test, expect } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

async function capturarViewport(page, dir, nome) {
  // Somente geometria e estados fechados: nunca texto, URL, storage ou identidade.
  const viewport = await page.evaluate(() => {
    const titulo = document.getElementById("ranking-geral-titulo");
    const nav = document.querySelector('nav[data-bottom-nav="true"][data-mobile-nav="true"]');
    const primeiro = document.querySelector(".ranking-geral-lista > li");
    const caixa = element => {
      if (!element) return null;
      const { x, y, width, height } = element.getBoundingClientRect();
      return { x, y, width, height };
    };
    return {
      largura: innerWidth, altura: innerHeight, scrollY,
      alturaDocumento: document.documentElement.scrollHeight,
      tituloComFoco: document.activeElement === titulo,
      titulo: caixa(titulo), primeiroItem: caixa(primeiro), navegacao: caixa(nav),
    };
  });
  const png = await page.screenshot({ path: path.join(dir, nome + ".png"), fullPage: false });
  const imagem = await page.evaluate(async base64 => {
    const bytes = Uint8Array.from(atob(base64), character => character.charCodeAt(0));
    const bitmap = await createImageBitmap(new Blob([bytes], { type: "image/png" }));
    try {
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Contexto 2D indisponível para conferir a captura");
      context.drawImage(bitmap, 0, 0);
      const { data } = context.getImageData(0, 0, bitmap.width, bitmap.height);
      let uniforme = true;
      let preta = true;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] !== data[0] || data[i + 1] !== data[1] || data[i + 2] !== data[2]) uniforme = false;
        if (data[i] !== 0 || data[i + 1] !== 0 || data[i + 2] !== 0) preta = false;
      }
      return { largura: bitmap.width, altura: bitmap.height, uniforme, preta };
    } finally { bitmap.close(); }
  }, png.toString("base64"));
  writeFileSync(path.join(dir, nome + "-viewport.json"),
    JSON.stringify({ schemaVersion: 1, viewport, imagem }, null, 2) + "\n");
  return imagem;
}

test("paginação integrada: Voltar ao início livre da barra inferior real", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith("mobile"), "Barra inferior: validar mobile 390/320");

  await page.goto("/em-alta");
  const ranking = page.getByRole("region", { name: "Ranking Geral de Histórias" });
  await expect(ranking.getByRole("listitem")).toHaveCount(20);

  await ranking.getByRole("button", { name: "Próxima página" }).click();
  await expect(ranking.getByRole("listitem")).toHaveCount(5);
  const back = ranking.getByRole("button", { name: "Voltar ao início" });
  const nav = page.locator('nav[data-bottom-nav="true"][data-mobile-nav="true"]');
  await expect(nav).toBeVisible();
  await expect(back).toBeVisible();
  await back.scrollIntoViewIfNeeded();

  const buttonBox = await back.boundingBox();
  const navBox = await nav.boundingBox();
  expect(buttonBox, "O botão precisa ter geometria visível").not.toBeNull();
  expect(navBox, "A navegação inferior precisa ter geometria visível").not.toBeNull();
  expect(buttonBox.y + buttonBox.height,
    "Botão Voltar ao início não pode ficar atrás da navegação inferior real")
    .toBeLessThanOrEqual(navBox.y - 2);
  const point = { x: buttonBox.x + buttonBox.width / 2,
    y: buttonBox.y + buttonBox.height / 2 };
  const elementAtButton = await page.evaluate(({ x, y }) => {
    const hit = document.elementFromPoint(x, y);
    return hit?.closest("nav[data-bottom-nav]") !== null;
  }, point);
  expect(elementAtButton, "Navegação inferior não pode capturar o toque no botão")
    .toBe(false);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1))
    .toBe(true);

  const dir = path.join(process.cwd(), "reports", "ranking-geral-etapa3-visual");
  mkdirSync(dir, { recursive: true });
  const segunda = await capturarViewport(page, dir, testInfo.project.name + "-integrado-pagina2-com-barra");
  expect(segunda.uniforme, "A captura da segunda página precisa conter conteúdo visível").toBe(false);
  await back.click();
  await expect(ranking.getByRole("listitem")).toHaveCount(20);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1))
    .toBe(true);
  // Preserva a evidência do instante original, antes de aguardar o visor pronto.
  await capturarViewport(page, dir, testInfo.project.name + "-integrado-retorno-imediato");
  const titulo = ranking.getByRole("heading", { name: "Ranking Geral de Histórias" });
  await expect(titulo).toBeFocused();
  await expect(titulo).toBeInViewport({ ratio: 1 });
  await expect(ranking.getByRole("listitem").first()).toBeInViewport({ ratio: 1 });
  await expect(nav).toBeInViewport({ ratio: 1 });
  // Aguarda pintura após o foco/rolagem sem alterar CSS, rolar por script ou usar sleep.
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  const primeira = await capturarViewport(page, dir, testInfo.project.name + "-integrado-pagina1-com-barra");
  expect(primeira.uniforme, "A captura do retorno precisa conter conteúdo visível").toBe(false);
});
