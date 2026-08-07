import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const rotasPublicas = ["/", "/explorar", "/login"];

for (const rota of rotasPublicas) {
  test(`acessibilidade básica sem violações críticas em ${rota}`, async ({ page }) => {
    await page.goto(rota, { waitUntil: "domcontentloaded" });

    const resultados = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const violacoesCriticas = resultados.violations.filter(
      (violacao) =>
        violacao.impact === "critical" || violacao.impact === "serious",
    );

    expect(
      violacoesCriticas,
      [
        `Violações de acessibilidade encontradas em ${rota}:`,
        ...violacoesCriticas.map(
          (violacao) =>
            `${violacao.id} (${violacao.impact}) - ${violacao.help} - ${violacao.nodes.length} ocorrência(s)`,
        ),
      ].join("\n"),
    ).toEqual([]);
  });
}

test("home e explorar não criam rolagem horizontal em celular", async ({ page }) => {
  await page.setViewportSize({
    width: 390,
    height: 844,
  });

  for (const rota of ["/", "/explorar"]) {
    await page.goto(rota, {
      waitUntil: "domcontentloaded",
    });

    await expect(page.locator("main")).toBeVisible();

    const dimensoes = await page.evaluate(() => ({
      viewport: window.innerWidth,
      document: document.documentElement.scrollWidth,
    }));

    expect(
      dimensoes.document,
      `Rolagem horizontal detectada em ${rota}`,
    ).toBeLessThanOrEqual(dimensoes.viewport + 2);
  }
});