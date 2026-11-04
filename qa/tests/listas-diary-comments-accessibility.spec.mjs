import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import {
  hasAuthorCredentials,
  loginAsAuthor,
  monitorRuntime,
} from "./helpers.mjs";

const PUBLIC_WORK_TITLE = "Obra Pública E2E";

test("sheet de comentários do Diário preserva diálogo, foco e teclado", async ({
  page,
}) => {
  test.skip(
    !hasAuthorCredentials,
    "Defina E2E_USER_EMAIL e E2E_USER_PASSWORD.",
  );

  await loginAsAuthor(page);
  const runtime = monitorRuntime(page);

  await page.goto("/listas?modo=perfil&origem=diario", {
    waitUntil: "domcontentloaded",
  });

  const mostrarAnotacao = page.getByRole("button", {
    name: `Mostrar anotação de ${PUBLIC_WORK_TITLE}`,
  });
  await expect(mostrarAnotacao).toBeVisible();
  await mostrarAnotacao.click();

  const trigger = page.getByRole("button", {
    name: "Abrir 0 comentários da anotação",
  });
  await trigger.focus();
  await expect(trigger).toBeFocused();
  await trigger.click();

  const dialog = page.getByRole("dialog", {
    name: `Comentários de ${PUBLIC_WORK_TITLE}`,
  });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute("aria-modal", "true");

  const handle = dialog.locator('[data-comments-sheet-handle="true"]');
  await expect(handle).toBeFocused();

  const focaveis = dialog.locator(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
  );
  const ultimoFocavel = focaveis.last();

  await page.keyboard.press("Shift+Tab");
  await expect(ultimoFocavel).toBeFocused();

  await page.keyboard.press("Tab");
  await expect(handle).toBeFocused();

  await page.keyboard.press("Tab");
  await expect(dialog.locator(":focus")).toHaveCount(1);

  const resultados = await new AxeBuilder({ page })
    .include('[data-historietas-listas-diary-comments-root="true"]')
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
