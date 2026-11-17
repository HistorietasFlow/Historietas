import { test, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";

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
  await page.screenshot({
    path: path.join(dir, testInfo.project.name + "-integrado-pagina2-com-barra.png"),
    fullPage: false,
  });
  await back.click();
  await expect(ranking.getByRole("listitem")).toHaveCount(20);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1))
    .toBe(true);
  await page.screenshot({
    path: path.join(dir, testInfo.project.name + "-integrado-pagina1-com-barra.png"),
    fullPage: false,
  });
});
