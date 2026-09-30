import { test, expect } from "@playwright/test";
import {
  hasAuthorCredentials,
  hasVisitorCredentials,
  loginAsAuthor,
  loginAsVisitor,
  monitorRuntime,
  resetVisitorWorkInteractions,
} from "./helpers.mjs";

const publicWorkSlug = (process.env.E2E_PUBLIC_WORK_SLUG || "").trim();

function workPath() {
  return `/obra/${encodeURIComponent(publicWorkSlug)}`;
}

test.describe("página da obra — cenários críticos", () => {
  test.beforeEach(() => {
    test.skip(!publicWorkSlug, "Defina E2E_PUBLIC_WORK_SLUG.");
  });

  test("obra inexistente mostra not-found e noindex", async ({ page }) => {
    const response = await page.goto("/obra/obra-e2e-inexistente-404", {
      waitUntil: "domcontentloaded",
    });

    expect([200, 404]).toContain(response?.status());
    await expect(
      page.getByRole("heading", { name: "Página não encontrada", exact: true }),
    ).toBeVisible();
    await expect(
      page.locator('meta[name="robots"][content*="noindex" i]'),
    ).not.toHaveCount(0);
  });

  test("obra pública expõe Começar a ler e abre o capítulo correto", async ({ page }) => {
    const runtime = monitorRuntime(page);
    const response = await page.goto(workPath(), {
      waitUntil: "domcontentloaded",
    });

    expect(response?.status()).toBe(200);

    const cta = page
      .getByRole("link", {
        name: "Começar a ler: Obra Pública E2E",
        exact: true,
      })
      .filter({ hasText: "Começar a ler" });
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute("href", /\/capitulo\/1$/);

    await Promise.all([
      page.waitForURL(/\/obra\/obra-publica-e2e\/capitulo\/1$/),
      cta.click(),
    ]);

    await expect(page.locator("main")).toBeVisible();
    runtime.assertClean();
  });

  test("comentários só carregam ao abrir e paginam os 25 itens", async ({ page }) => {
    let requestsComentarios = 0;

    page.on("request", (request) => {
      const url = request.url();

      if (/\/rest\/v1\/comentarios_obras(?:\?|$)/.test(url)) {
        requestsComentarios += 1;
      }
    });

    await page.goto(workPath(), { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Começar a ler", { exact: true })).toBeVisible();

    expect(
      requestsComentarios,
      "comentarios_obras não deve ser consultada com o painel fechado",
    ).toBe(0);

    const trigger = page.getByRole("button", { name: /^Abrir comentários/i });
    await trigger.click();

    const dialog = page.getByRole("dialog", { name: /Comentários de Obra Pública E2E/i });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Comentário E2E 01", { exact: true })).toBeVisible();
    await expect(dialog.getByText("Comentário E2E 20", { exact: true })).toBeVisible();
    await expect(dialog.getByText("Comentário E2E 21", { exact: true })).toHaveCount(0);

    const loadMore = dialog.getByRole("button", {
      name: "Carregar mais comentários",
      exact: true,
    });
    await expect(loadMore).toBeVisible();
    await loadMore.click();

    await expect(dialog.getByText("Comentário E2E 21", { exact: true })).toBeVisible();
    await expect(dialog.getByText("Comentário E2E 25", { exact: true })).toBeVisible();
    await expect(loadMore).toHaveCount(0);
    expect(requestsComentarios).toBeGreaterThan(0);
  });

  test("Escape fecha comentários e devolve foco ao gatilho", async ({ page }) => {
    await page.goto(workPath(), { waitUntil: "domcontentloaded" });

    const trigger = page.getByRole("button", { name: /^Abrir comentários/i });
    await trigger.focus();
    await expect(trigger).toBeFocused();

    await trigger.click();

    const dialog = page.getByRole("dialog", { name: /Comentários de Obra Pública E2E/i });
    await expect(dialog).toBeVisible();

    const handle = dialog.locator('[data-comments-sheet-handle="true"]');
    await expect(handle).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  test("visitante usa ações sociais e mantém opção de denunciar", async ({ page }) => {
    test.skip(!hasVisitorCredentials, "Credenciais do visitante E2E ausentes.");
    await resetVisitorWorkInteractions(publicWorkSlug);
    await loginAsVisitor(page);
    await page.goto(workPath(), { waitUntil: "domcontentloaded" });

    const follow = page.getByRole("button", { name: "Seguir obra", exact: true });
    await expect(follow).toBeVisible();
    await follow.click();
    await expect(
      page.getByRole("button", { name: "✓ Seguindo", exact: true }),
    ).toBeVisible();

    const like = page.getByRole("button", { name: /^Curtir\./ });
    await like.click();
    await expect(
      page.getByRole("button", { name: /^Remover curtida\./ }),
    ).toHaveAttribute("aria-pressed", "true");

    const actionsTrigger = page.getByRole("button", { name: "Abrir ações da obra" });
    await actionsTrigger.click();
    let actions = page.getByRole("dialog", { name: /Ações da obra Obra Pública E2E/i });
    await expect(actions.getByRole("button", { name: "Denunciar", exact: true })).toBeVisible();
    await actions.getByRole("button", { name: "Salvar", exact: true }).click();

    await actionsTrigger.click();
    actions = page.getByRole("dialog", { name: /Ações da obra Obra Pública E2E/i });
    await expect(actions.getByRole("button", { name: /^Salvo/ })).toBeVisible();
    await actions.getByRole("button", { name: "Concluir", exact: true }).click();

    await actionsTrigger.click();
    actions = page.getByRole("dialog", { name: /Ações da obra Obra Pública E2E/i });
    await expect(actions.getByRole("button", { name: /^Concluída/ })).toBeVisible();
  });

  test("autor não recebe ação de denunciar a própria obra", async ({ page }) => {
    test.skip(!hasAuthorCredentials, "Credenciais do autor E2E ausentes.");
    await loginAsAuthor(page);
    await page.goto(workPath(), { waitUntil: "domcontentloaded" });

    await page.getByRole("button", { name: "Abrir ações da obra" }).click();
    const actions = page.getByRole("dialog", {
      name: /Ações da obra Obra Pública E2E/i,
    });

    await expect(actions).toBeVisible();
    await expect(
      actions.getByRole("button", { name: "Denunciar", exact: true }),
    ).toHaveCount(0);
  });
});
