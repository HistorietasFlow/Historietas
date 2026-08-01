import { test, expect } from "@playwright/test";
import {
  cleanupWorkByTitle,
  destructiveEnabled,
  hasAuthorCredentials,
  loginAsAuthor,
  openWorkActions
} from "./helpers.mjs";

test.describe.serial("fluxo completo do autor", () => {
  test("publicar, editar capítulo, excluir capítulo e excluir obra", async ({ page }) => {
    test.skip(!hasAuthorCredentials, "Defina E2E_USER_EMAIL e E2E_USER_PASSWORD.");
    test.skip(!destructiveEnabled, "Defina E2E_ALLOW_DESTRUCTIVE=true usando uma conta exclusiva de teste.");

    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const title = `E2E Historietas ${unique}`;
    const chapterOriginal = "Este capítulo foi criado automaticamente para validar o fluxo completo do site.";
    const chapterEdited = `${chapterOriginal} Atualização automática confirmada.`;

    await cleanupWorkByTitle(title);

    try {
      await loginAsAuthor(page);
      await page.goto("/publicar", { waitUntil: "domcontentloaded" });
      const form = page.locator("form");

      await form.getByPlaceholder("Ex: Shadow Eclipse").fill(title);
      const author = form.getByPlaceholder("Ex: Historietas Studio");
      if ((await author.inputValue()).trim().length < 2) await author.fill("Autor E2E");

      const selects = form.locator("select");
      await selects.nth(0).selectOption({ label: "Conto" });
      await selects.nth(1).selectOption({ label: "Fantasia" });
      await selects.nth(3).selectOption("Livre");
      await form.locator("textarea").fill(
        "Esta é uma obra criada automaticamente para testar publicação, edição e exclusão com segurança."
      );

      await Promise.all([
        page.waitForURL(/\/painel-autor$/, { timeout: 45_000 }),
        form.getByRole("button", { name: "Criar obra", exact: true }).click()
      ]);
      await expect(page.getByText(title, { exact: true })).toBeVisible();

      let sheet = await openWorkActions(page, title);
      await sheet.getByRole("link", { name: "Adicionar capítulo", exact: true }).click();
      await expect(page).toHaveURL(/\/adicionar-capitulo\?obraId=/);
      await page.getByPlaceholder("Escreva o texto do capítulo aqui...").fill(chapterOriginal);
      await page.getByRole("button", { name: "Criar capítulo", exact: true }).click();
      await expect(page.getByRole("button", { name: /Criado/ })).toBeVisible({ timeout: 30_000 });
      await page.getByRole("link", { name: "Cancelar", exact: true }).click();
      await expect(page).toHaveURL(/\/painel-autor$/);

      sheet = await openWorkActions(page, title);
      await sheet.getByRole("link", { name: "Editar capítulo", exact: true }).click();
      await expect(page).toHaveURL(/\/editar-capitulo\?.*capituloId=/);
      const chapterTextarea = page.getByPlaceholder("Escreva o texto do capítulo");
      await expect(chapterTextarea).toHaveValue(chapterOriginal);
      await chapterTextarea.fill(chapterEdited);
      await page.getByRole("button", { name: "Salvar alterações", exact: true }).click();
      await expect(page.getByRole("button", { name: /Atualizado/ })).toBeVisible({ timeout: 30_000 });

      page.once("dialog", (dialog) => dialog.accept());
      await page.getByRole("button", { name: "Excluir capítulo", exact: true }).click();
      await page.waitForURL(/\/painel-autor$/, { timeout: 30_000 });
      await expect(page.getByText(title, { exact: true })).toBeVisible();

      sheet = await openWorkActions(page, title);
      page.once("dialog", (dialog) => dialog.accept());
      await sheet.getByRole("button", { name: "Excluir", exact: true }).click();
      await expect(page.getByText(title, { exact: true })).toHaveCount(0, { timeout: 30_000 });
    } finally {
      await cleanupWorkByTitle(title);
    }
  });
});
