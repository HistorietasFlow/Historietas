import { test, expect } from "@playwright/test";
import {
  hasAuthorCredentials,
  loginAsAuthor,
  monitorRuntime,
} from "./helpers.mjs";

test("modal de denúncia de comentário fica acima do comments sheet", async ({
  page,
}) => {
  test.skip(
    !hasAuthorCredentials,
    "Defina E2E_USER_EMAIL e E2E_USER_PASSWORD."
  );

  await loginAsAuthor(page);
  const runtime = monitorRuntime(page);

  await page.goto("/comunidade", {
    waitUntil: "domcontentloaded",
  });

  const publicacao = page.locator("article").filter({
    hasText: "QA PAGINACAO POST 000137",
  });
  await expect(publicacao).toBeVisible();
  await publicacao.scrollIntoViewIfNeeded();

  const estadoScrollInicial = await page.evaluate(() => ({
    overflow: document.body.style.getPropertyValue("overflow"),
    overscroll: document.documentElement.style.getPropertyValue(
      "overscroll-behavior"
    ),
    scrollY: window.scrollY,
  }));

  await publicacao
    .getByRole("button", {
      name: "1 comentário",
      exact: true,
    })
    .click();

  const sheet = page.locator(
    '[data-historietas-comunidade-sheet="true"]'
  );
  await expect(sheet).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() => ({
        overflow: document.body.style.getPropertyValue("overflow"),
        overscroll: document.documentElement.style.getPropertyValue(
          "overscroll-behavior"
        ),
      }))
    )
    .toEqual({
      overflow: "hidden",
      overscroll: "none",
    });

  await sheet
    .getByRole("button", {
      name: "Denunciar",
      exact: true,
    })
    .first()
    .click();

  const dialogo = page.getByRole("dialog", {
    name: "Denunciar conteúdo",
    exact: true,
  });
  const botaoFecharDenuncia = dialogo.getByRole("button", {
    name: "Fechar denúncia",
    exact: true,
  });

  await expect(sheet).toBeVisible();
  await expect(dialogo).toBeVisible();
  await expect(botaoFecharDenuncia).toBeFocused();

  const camadas = await page.evaluate(() => {
    const commentsSheet = document.querySelector(
      '[data-historietas-comunidade-sheet="true"]'
    );
    const dialog = document.querySelector('[role="dialog"]');
    const modalOverlay = dialog?.parentElement;

    return {
      sheet: commentsSheet
        ? Number(window.getComputedStyle(commentsSheet).zIndex)
        : 0,
      modal: modalOverlay
        ? Number(window.getComputedStyle(modalOverlay).zIndex)
        : 0,
    };
  });

  expect(camadas.modal).toBeGreaterThan(camadas.sheet);

  const modalRecebeInteracao = await dialogo.evaluate((dialog) => {
    const retangulo = dialog.getBoundingClientRect();
    const elementoNoTopo = document.elementFromPoint(
      retangulo.left + retangulo.width / 2,
      retangulo.top + retangulo.height / 2
    );

    return Boolean(elementoNoTopo && dialog.contains(elementoNoTopo));
  });
  expect(modalRecebeInteracao).toBe(true);

  const primeiroMotivo = dialogo.getByRole("radio").first();
  await primeiroMotivo.check();
  await expect(primeiroMotivo).toBeChecked();

  await botaoFecharDenuncia.click();
  await expect(dialogo).toBeHidden();
  await expect(sheet).toBeVisible();

  await sheet
    .getByRole("button", {
      name: "Ordenar comentários",
      exact: true,
    })
    .click();
  await expect(sheet.getByRole("menu")).toBeVisible();

  await sheet
    .getByRole("button", {
      name: "Fechar comentários",
      exact: true,
    })
    .click({
      position: {
        x: 10,
        y: 10,
      },
    });

  await expect(sheet).toBeHidden();
  await expect
    .poll(() =>
      page.evaluate(() => ({
        overflow: document.body.style.getPropertyValue("overflow"),
        overscroll: document.documentElement.style.getPropertyValue(
          "overscroll-behavior"
        ),
        scrollY: window.scrollY,
      }))
    )
    .toEqual(estadoScrollInicial);

  runtime.assertClean();
});
