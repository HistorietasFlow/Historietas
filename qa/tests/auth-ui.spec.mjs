import { test, expect } from "@playwright/test";

test("Login alterna entre entrar, criar conta e recuperar senha", async ({ page }) => {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  const form = page.locator("form");

  await expect(page.getByRole("heading", { name: "FAZER LOGIN" })).toBeVisible();
  await expect(form.getByPlaceholder("seuemail@email.com")).toHaveAttribute("type", "email");
  await expect(form.getByPlaceholder("Mínimo de 6 caracteres")).toHaveAttribute("minlength", "6");

  await page.getByRole("button", { name: "CRIAR CONTA", exact: true }).click();
  await expect(page.getByRole("heading", { name: "CRIAR CONTA" })).toBeVisible();
  await expect(form.getByPlaceholder("Ex.: Nome do Autor")).toBeVisible();

  await page.getByRole("button", { name: "ENTRAR", exact: true }).first().click();
  await page.getByRole("button", { name: "Esqueci minha senha", exact: true }).click();
  await expect(page.getByRole("heading", { name: "RECUPERAR SENHA" })).toBeVisible();
  await expect(form.getByRole("button", { name: "ENVIAR LINK DE RECUPERAÇÃO" })).toBeVisible();
  await form.getByRole("button", { name: "VOLTAR PARA ENTRAR" }).click();
  await expect(page.getByRole("heading", { name: "FAZER LOGIN" })).toBeVisible();
});

test("Áreas de autor exigem autenticação e preservam o retorno", async ({ page }) => {
  for (const route of ["/publicar", "/painel-autor", "/configuracoes", "/notificacoes"]) {
    await page.context().clearCookies();
    await page.goto(route, { waitUntil: "domcontentloaded" });
    await page.waitForURL(/\/login\?redirectTo=/, { timeout: 20_000 });
    const current = new URL(page.url());
    expect(current.searchParams.get("redirectTo") || "").toContain(route);
  }
});
