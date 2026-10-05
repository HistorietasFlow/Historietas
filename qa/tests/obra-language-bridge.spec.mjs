import { expect, test } from "@playwright/test";

const publicWorkSlug = (process.env.E2E_PUBLIC_WORK_SLUG || "").trim();

function workPath() {
  return `/obra/${encodeURIComponent(publicWorkSlug)}`;
}

async function alterarIdioma(page, language) {
  await page.evaluate((nextLanguage) => {
    window.localStorage.setItem("historietas-idioma", nextLanguage);
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "historietas-idioma",
        newValue: nextLanguage,
        storageArea: window.localStorage,
        url: window.location.href,
      }),
    );
  }, language);
}

test.describe("bridge de idioma da obra", () => {
  test.beforeEach(() => {
    test.skip(!publicWorkSlug, "Defina E2E_PUBLIC_WORK_SLUG.");
  });

  test("traduz conteúdo inicial e dinâmico, respeita ignore, portal e restauração", async ({
    page,
  }) => {
    await page.goto(workPath(), { waitUntil: "domcontentloaded" });

    const abrirComentarios = page.getByRole("button", {
      name: /^Abrir comentários/i,
    });
    await abrirComentarios.click();

    const portalComentarios = page.locator(
      "[data-historietas-obra-comments-root='true']",
    );
    await expect(portalComentarios).toBeVisible();

    await alterarIdioma(page, "en");

    await expect(page.getByText("Start reading", { exact: true })).toBeVisible();
    await expect(
      portalComentarios.getByRole("button", { name: "Close comments" }),
    ).toBeVisible();

    await page.evaluate(() => {
      const raizObra = document.querySelector(
        "[data-historietas-obra-dinamica-root='true']",
      );
      const raizComentarios = document.querySelector(
        "[data-historietas-obra-comments-root='true']",
      );

      if (!raizObra || !raizComentarios) {
        throw new Error("Raízes da obra e dos comentários devem estar disponíveis.");
      }

      const textoDinamico = document.createElement("p");
      textoDinamico.id = "obra-language-bridge-dynamic-text";
      textoDinamico.textContent = "Começar a ler";

      const atributoDinamico = document.createElement("button");
      atributoDinamico.id = "obra-language-bridge-dynamic-attribute";
      atributoDinamico.setAttribute("aria-label", "Fechar comentários");
      atributoDinamico.textContent = "Ação de teste";

      const textoIgnorado = document.createElement("p");
      textoIgnorado.id = "obra-language-bridge-ignored";
      textoIgnorado.setAttribute("data-historietas-i18n-ignore", "true");
      textoIgnorado.textContent = "Começar a ler";

      const textoPortal = document.createElement("p");
      textoPortal.id = "obra-language-bridge-portal-text";
      textoPortal.textContent = "Fechar comentários";

      raizObra.append(textoDinamico, atributoDinamico, textoIgnorado);
      raizComentarios.append(textoPortal);
    });

    await expect(
      page.locator("#obra-language-bridge-dynamic-text"),
    ).toHaveText("Start reading");
    await expect(
      page.locator("#obra-language-bridge-dynamic-attribute"),
    ).toHaveAttribute("aria-label", "Close comments");
    await expect(page.locator("#obra-language-bridge-ignored")).toHaveText(
      "Começar a ler",
    );
    await expect(
      page.locator("#obra-language-bridge-portal-text"),
    ).toHaveText("Close comments");

    await alterarIdioma(page, "pt-BR");

    await expect(
      page.locator("#obra-language-bridge-dynamic-text"),
    ).toHaveText("Começar a ler");
    await expect(
      page.locator("#obra-language-bridge-dynamic-attribute"),
    ).toHaveAttribute("aria-label", "Fechar comentários");
    await expect(
      page.locator("#obra-language-bridge-portal-text"),
    ).toHaveText("Fechar comentários");
  });
});
