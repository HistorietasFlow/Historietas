import { test, expect } from "@playwright/test";
import { hasAuthorCredentials, loginAsAuthor, monitorRuntime } from "./helpers.mjs";

test("páginas autenticadas principais abrem com a conta de teste", async ({ page }) => {
  test.skip(!hasAuthorCredentials, "Defina E2E_USER_EMAIL e E2E_USER_PASSWORD.");
  await loginAsAuthor(page);

  const routes = [
    "/perfil-autor",
    "/listas",
    "/notificacoes",
    "/seguindo",
    "/configuracoes",
    "/painel-autor",
    "/publicar",
    "/comunidade"
  ];

  for (const route of routes) {
    const runtime = monitorRuntime(page);
    const response = await page.goto(route, { waitUntil: "domcontentloaded" });
    expect(response?.status(), `Status inesperado em ${route}`).toBeLessThan(500);
    await expect(page.locator("main")).toBeVisible();
    expect(new URL(page.url()).pathname, `${route} redirecionou para login`).not.toBe("/login");
    runtime.assertClean();
  }
});
