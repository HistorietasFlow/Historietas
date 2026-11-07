import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const publicWorkSlug = (process.env.E2E_PUBLIC_WORK_SLUG || "").trim();
const publicChapterNumber = Number(
  process.env.E2E_PUBLIC_CHAPTER_NUMBER || "1",
);

function chapterPath() {
  const chapter =
    Number.isInteger(publicChapterNumber) && publicChapterNumber > 0
      ? publicChapterNumber
      : 1;

  return `/obra/${encodeURIComponent(publicWorkSlug)}/capitulo/${chapter}`;
}

test.describe("sheet de comentários do leitor", () => {
  test.beforeEach(() => {
    test.skip(
      !publicWorkSlug,
      "Defina E2E_PUBLIC_WORK_SLUG para testar o capítulo público.",
    );
  });

  test("mantém foco, teclado e semântica de diálogo acessíveis", async ({
    page,
  }) => {
    const interacoes = page.waitForResponse((response) =>
      response.url().includes("/rpc/obter_metricas_conteudos") && response.ok() &&
      (response.request().postDataJSON()?.p_obra_ids || []).length === 0,
    );
    await page.goto(chapterPath(), { waitUntil: "domcontentloaded" });
    await interacoes;

    const trigger = page.getByRole("button", { name: /comentários$/i });
    await expect(trigger).toBeVisible();
    await trigger.focus();
    await expect(trigger).toBeFocused();
    await trigger.click();

    const dialog = page.getByRole("dialog", { name: /comentários/i });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute("aria-modal", "true");

    const handle = dialog.locator('[data-comments-sheet-handle="true"]');
    await expect(handle).toBeFocused();

    await page.keyboard.press("Shift+Tab");
    await expect(dialog.locator(":focus")).toHaveCount(1);

    await page.keyboard.press("Tab");
    await expect(handle).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(dialog.locator(":focus")).toHaveCount(1);

    const resultados = await new AxeBuilder({ page })
      .include('[data-historietas-ler-capitulo-comments-root="true"]')
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const violacoesCriticas = resultados.violations.filter(
      (violacao) =>
        violacao.impact === "critical" || violacao.impact === "serious",
    );
    expect(violacoesCriticas).toEqual([]);

    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });
});
