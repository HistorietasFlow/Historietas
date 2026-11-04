import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import {
  hasAuthorCredentials,
  loginAsAuthor,
  monitorRuntime,
} from "./helpers.mjs";

const COMMUNITY_RELATED_WORK = "Obra Pública E2E";
const COMMUNITY_POST_TEXT = "Publicação E2E para denúncia de comentário";

test("sheet de comentários da Comunidade preserva diálogo, foco e teclado", async ({
  page,
}) => {
  test.skip(
    !hasAuthorCredentials,
    "Defina E2E_USER_EMAIL e E2E_USER_PASSWORD.",
  );

  await loginAsAuthor(page);
  const runtime = monitorRuntime(page);

  await page.goto(
    `/comunidade?obra=${encodeURIComponent(COMMUNITY_RELATED_WORK)}`,
    { waitUntil: "domcontentloaded" },
  );

  const publicacao = page.locator("article").filter({
    hasText: COMMUNITY_POST_TEXT,
  });
  await expect(publicacao).toBeVisible();
  await publicacao.scrollIntoViewIfNeeded();

  const trigger = publicacao.getByRole("button", {
    name: "1 comentários",
    exact: true,
  });
  await trigger.focus();
  await expect(trigger).toBeFocused();
  await trigger.click();

  const dialog = page.getByRole("dialog", { name: "1 comentário" });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute("aria-modal", "true");

  const handle = dialog.locator('[data-comments-sheet-handle="true"]');
  const enviar = dialog.getByRole("button", { name: "Enviar comentário" });
  await expect(handle).toBeFocused();

  await page.keyboard.press("Shift+Tab");
  await expect(enviar).toBeFocused();

  await page.keyboard.press("Tab");
  await expect(handle).toBeFocused();

  await page.keyboard.press("Tab");
  await expect(dialog.locator(":focus")).toHaveCount(1);

  const resultados = await new AxeBuilder({ page })
    .include('[data-historietas-comunidade-sheet="true"]')
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

  runtime.assertClean();
});
