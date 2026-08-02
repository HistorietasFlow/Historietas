import { test, expect } from "@playwright/test";
import { monitorRuntime } from "./helpers.mjs";

test("Home carrega navegação e busca filtra obras", async ({ page }) => {
  const runtime = monitorRuntime(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });

  await expect(page.getByLabel("Navegação principal")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Explorar", exact: true })
  ).toBeVisible();

  const search = page.getByPlaceholder("Buscar obras, autor, gênero...");
  await expect(search).toBeVisible();

  // Usa o título da obra em destaque, que vem de uma obra pública real.
  const heroTitle = page.locator("h1.historietas-home-hero-title");
  await expect(heroTitle).toBeVisible({ timeout: 30_000 });
  const title = ((await heroTitle.textContent()) || "").trim();
  expect(title.length).toBeGreaterThan(0);

  // A mensagem vazia do Catálogo pode coexistir com resultados reais de outras
  // seções. Por isso, confirmamos o filtro pela própria obra em destaque.
  await search.fill(title);
  await expect(heroTitle).toHaveText(title, { timeout: 20_000 });
  await expect(page.locator('a[href^="/obra/"]').first()).toBeVisible({
    timeout: 20_000,
  });

  await search.fill("__historietas_e2e_sem_resultado_9f8d7c__");
  await expect(
    page.getByText("Nenhuma obra encontrada", { exact: true }).first()
  ).toBeVisible();

  await search.fill("");
  await expect(heroTitle).toBeVisible({ timeout: 20_000 });
  runtime.assertClean();
});

test("Explorar aplica categoria, abre filtros e limpa estado", async ({
  page,
}) => {
  const runtime = monitorRuntime(page);
  await page.goto("/explorar", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { name: "Explorar", exact: true })
  ).toBeVisible();

  await page.getByRole("button", { name: "Fantasia", exact: true }).click();
  await expect(page).toHaveURL(/\/explorar\?categoria=Fantasia/);

  await page
    .getByRole("button", { name: "Abrir funções do Explorar", exact: true })
    .click();

  const modal = page.locator('section[aria-label="EXPLORAR"]');
  await expect(modal).toBeVisible();

  // Depois de selecionado, o nome acessível passa a incluir o símbolo de seleção.
  const recentButton = modal.getByRole("button", { name: /^Mais recentes/ });
  await recentButton.click();
  await expect(
    modal.getByRole("button", { name: /^Mais recentes/ })
  ).toContainText("✓");

  await modal
    .getByRole("button", { name: "Limpar filtros", exact: true })
    .click();
  await expect(page).toHaveURL(/\/explorar$/);
  await expect(modal).toBeHidden();
  runtime.assertClean();
});

test("Home e Explorar não criam rolagem horizontal no celular", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });

  for (const route of ["/", "/explorar"]) {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    await expect(page.locator("main")).toBeVisible();

    const dimensions = await page.evaluate(() => ({
      viewport: window.innerWidth,
      document: document.documentElement.scrollWidth,
    }));

    expect(
      dimensions.document,
      `Rolagem horizontal detectada em ${route}`
    ).toBeLessThanOrEqual(dimensions.viewport + 2);
  }
});