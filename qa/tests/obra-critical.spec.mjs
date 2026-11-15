import { test, expect } from "@playwright/test";
import {
  hasAuthorCredentials,
  hasVisitorCredentials,
  destructiveEnabled,
  loginAsAuthor,
  loginAsVisitor,
  monitorRuntime,
  resetVisitorWorkInteractions,
} from "./helpers.mjs";
import { expectActiveChapter, publicChapterResponse } from "./public-reader-readiness.mjs";

const publicWorkSlug = (process.env.E2E_PUBLIC_WORK_SLUG || "").trim();
const publicWorkId = (process.env.E2E_PUBLIC_WORK_ID || "").trim();
const publicChapterId = (process.env.E2E_PUBLIC_CHAPTER_ID || "").trim();
const activeWork = (page) =>
  page.locator('main[data-historietas-obra-dinamica-root="true"]:visible');

function workPath() {
  return `/obra/${encodeURIComponent(publicWorkSlug)}`;
}

async function openPublicWork(page, path = workPath()) {
  const pending = page.waitForRequest(request => {
    const url = new URL(request.url());
    return url.pathname === "/api/obra-publica" && url.searchParams.get("slug") === publicWorkSlug;
  });
  const response = await page.goto(path, { waitUntil: "domcontentloaded" });
  const confirmation = await (await pending).response();
  expect(confirmation).not.toBeNull();
  expect(confirmation.status()).toBe(200);
  const result = await confirmation.json();
  expect(["disponivel", "inalterada"]).toContain(result.estado);
  const snapshot = result.estado === "disponivel" ? result.snapshot : result;
  expect(snapshot.obraId).toBe(publicWorkId);
  expect(snapshot.slug).toBe(publicWorkSlug);
  const work = activeWork(page);
  await expect(work).toHaveCount(1);
  await expect(work).toHaveAttribute("data-public-work-state", "confirmada");
  await expect(work).toHaveAttribute("aria-busy", "false");
  await expect(work).not.toHaveAttribute("inert", "");
  await expect(page.locator("main:visible")).toHaveCount(1);
  return { response, work };
}

test.describe("página da obra — cenários críticos", () => {
  test.beforeEach(() => {
    test.skip(!publicWorkSlug, "Defina E2E_PUBLIC_WORK_SLUG.");
  });

  test("obra inexistente mostra not-found e noindex", async ({ page }) => {
    const response = await page.goto("/obra/obra-e2e-inexistente-404", {
      waitUntil: "domcontentloaded",
    });

    // O App Router pode responder 200 quando o not-found é streamed.
    expect([200, 404]).toContain(response?.status());
    await expect(
      page.getByRole("heading", { name: "Página não encontrada", exact: true }),
    ).toBeVisible();
    await expect(
      page.locator('meta[name="robots"][content*="noindex" i]'),
    ).not.toHaveCount(0);
  });

  for (const device of ["desktop", "mobile"]) {
    test(`obra pública expõe Começar a ler e abre o capítulo correto (${device})`, async ({ page }) => {
      await page.setViewportSize(device === "mobile"
        ? { width: 390, height: 844 } : { width: 1440, height: 900 });
      const runtime = monitorRuntime(page);
      const { response, work } = await openPublicWork(page);

      expect(response?.status()).toBe(200);

      const cta = work
        .getByRole("link", {
          name: "Começar a ler: Obra Pública E2E",
          exact: true,
        })
        .filter({ hasText: "Começar a ler" });
      await expect(cta).toBeVisible();
      await expect(cta).toHaveAttribute("href", /\/capitulo\/1$/);

      const readerConfirmation = publicChapterResponse(page, 1, {
        slug: publicWorkSlug, workId: publicWorkId, chapterId: publicChapterId,
      });
      await Promise.all([
        page.waitForURL(/\/obra\/obra-publica-e2e\/capitulo\/1$/),
        cta.click(),
      ]);

      await readerConfirmation;
      await expectActiveChapter(page, `${workPath()}/capitulo/1`, "Capítulo 1",
        "Este capítulo existe somente no ambiente local descartável dos testes E2E.");
      runtime.assertClean();
    });

    test(`seleciona a Obra ativa sem aceitar duplicação visível (${device})`, async ({ page }) => {
      await page.setViewportSize(device === "mobile"
        ? { width: 390, height: 844 } : { width: 1440, height: 900 });
      const { work } = await openPublicWork(page);
      await work.evaluate(root => {
        const hidden = document.createElement("div");
        hidden.hidden = true;
        hidden.dataset.qaHiddenWorkCopy = "true";
        hidden.append(root.cloneNode(true));
        document.body.append(hidden);
      });
      await expect(page.locator('[data-qa-hidden-work-copy="true"] main')).toBeHidden();
      // Reproduz o strict mode do seletor antigo, sem aguardar um timeout.
      await expect(page.locator("main").isVisible()).rejects.toThrow(/strict mode violation/);
      await expect(activeWork(page)).toHaveCount(1);
      await expect(work.getByRole("heading", { name: "Obra Pública E2E", exact: true })).toBeVisible();

      await work.evaluate(root => {
        const visible = root.cloneNode(true);
        visible.dataset.qaVisibleWorkCopy = "true";
        document.body.append(visible);
      });
      // A mesma seleção usada no carregamento encontra as DUAS raízes ativas;
      // não escolhe uma arbitrariamente para fazer as verificações passarem.
      await expect(activeWork(page)).toHaveCount(2);
      await page.locator('[data-qa-hidden-work-copy="true"], [data-qa-visible-work-copy="true"]').evaluateAll(
        copies => copies.forEach(copy => copy.remove()),
      );
      await expect(activeWork(page)).toHaveCount(1);
    });
  }

  test("comentários só carregam ao abrir e paginam os 25 itens", async ({ page }) => {
    let requestsComentarios = 0;

    page.on("request", (request) => {
      const url = request.url();

      if (/\/rest\/v1\/comentarios_obras(?:\?|$)/.test(url)) {
        requestsComentarios += 1;
      }
    });

    const { work } = await openPublicWork(page);
    await expect(work.getByText("Começar a ler", { exact: true })).toBeVisible();
    await page.waitForLoadState("networkidle");

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

  for (const cenario of [
    { nome: "desktop", viewport: { width: 1440, height: 900 } },
    { nome: "mobile", viewport: { width: 390, height: 844 } },
  ]) {
    test(`deep link de comentario abre o sheet para localizar e responder no ${cenario.nome}`, async ({
      page,
    }) => {
      await page.setViewportSize(cenario.viewport);
      await openPublicWork(page, `${workPath()}?comentarios=1`);

      const dialog = page.getByRole("dialog", {
        name: /Coment.*rios de Obra P.*blica E2E/i,
      });
      await expect(dialog).toBeVisible();
      await expect(
        dialog.getByText(/Coment.*rio E2E 01/, { exact: true }),
      ).toBeVisible();
      await expect(dialog.getByRole("textbox")).toBeVisible();
    });
  }

  test("Escape fecha comentários e devolve foco ao gatilho", async ({ page }) => {
    await openPublicWork(page);

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
    await openPublicWork(page);

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
    await openPublicWork(page);

    await page.getByRole("button", { name: "Abrir ações da obra" }).click();
    const actions = page.getByRole("dialog", {
      name: /Ações da obra Obra Pública E2E/i,
    });

    await expect(actions).toBeVisible();
    await expect(
      actions.getByRole("button", { name: "Denunciar", exact: true }),
    ).toHaveCount(0);
  });

  test("autor remove comentário recebido na própria obra", async ({ page }) => {
    test.skip(!hasAuthorCredentials, "Credenciais do autor E2E ausentes.");
    test.skip(!destructiveEnabled, "Teste destrutivo permitido apenas no Supabase local.");
    await loginAsAuthor(page);
    await openPublicWork(page);

    await page.getByRole("button", { name: /^Abrir comentários/i }).click();
    const dialog = page.getByRole("dialog", {
      name: /Comentários de Obra Pública E2E/i,
    });
    const comentario = dialog.locator("article").filter({
      has: page.getByText("Comentário E2E 01", { exact: true }),
    });

    await expect(comentario.getByRole("button", { name: "Remover" })).toBeVisible();
    await expect(comentario.getByRole("button", { name: "Denunciar" })).toHaveCount(0);
    await comentario.getByRole("button", { name: "Remover" }).click();
    await expect(dialog.getByText("Comentário E2E 01", { exact: true })).toHaveCount(0);
  });
});
