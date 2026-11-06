import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const dispositivos = [
  { nome: "desktop", viewport: { width: 1440, height: 900 } },
  { nome: "mobile", viewport: { width: 390, height: 844 } },
];

for (const dispositivo of dispositivos) {
  test(`filtros avançados preservam foco, teclado e seleção (${dispositivo.nome})`, async ({
    page,
  }) => {
    await page.setViewportSize(dispositivo.viewport);
    await page.goto("/explorar", { waitUntil: "domcontentloaded" });

    await expect(
      page.locator("main").filter({
        has: page.locator('section[aria-label="Categorias"]'),
      }),
    ).toBeVisible();

    const acionador = page.getByRole("button", {
      name: "Abrir funções do Explorar",
      exact: true,
    });
    await acionador.focus();
    await acionador.click();

    const dialogo = page.getByRole("dialog", { name: "EXPLORAR" });
    await expect(dialogo).toBeVisible();
    await expect(dialogo).toHaveAttribute("aria-modal", "true");

    const todas = dialogo.getByRole("button", { name: /^Todas/ });
    await expect(todas).toBeFocused();
    await expect(todas).toHaveAttribute("aria-pressed", "true");

    const botoes = dialogo.locator("button:visible");
    const ultimoBotao = botoes.last();
    await page.keyboard.press("Shift+Tab");
    await expect(ultimoBotao).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(todas).toBeFocused();

    const maisRecentes = dialogo.getByRole("button", {
      name: /^Mais recentes/,
    });
    await maisRecentes.click();
    await expect(maisRecentes).toHaveAttribute("aria-pressed", "true");
    await expect(page).toHaveURL(/ordenacao=mais-recentes/);

    const resultadosAxe = await new AxeBuilder({ page })
      .include('section[role="dialog"]')
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const violacoesGraves = resultadosAxe.violations.filter(
      (violacao) =>
        violacao.impact === "critical" || violacao.impact === "serious",
    );
    expect(
      violacoesGraves,
      violacoesGraves
        .map(
          (violacao) =>
            `${violacao.id}: ${violacao.nodes.length} ocorrência(s)`,
        )
        .join("\n"),
    ).toEqual([]);

    await page.keyboard.press("Escape");
    await expect(dialogo).toBeHidden();
    await expect(acionador).toBeFocused();
  });
}
