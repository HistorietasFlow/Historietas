import { test, expect } from "@playwright/test";
import {
  hasAuthorCredentials,
  hasVisitorCredentials,
  loginAsAuthor,
  loginAsVisitor,
  monitorRuntime,
} from "./helpers.mjs";

const publicWorkSlug = (process.env.E2E_PUBLIC_WORK_SLUG || "").trim();
const publicChapterNumber = Number(
  process.env.E2E_PUBLIC_CHAPTER_NUMBER || "1",
);
const workTitle = "Obra Pública E2E";

function workPath() {
  return `/obra/${encodeURIComponent(publicWorkSlug)}`;
}

function chapterPath() {
  const numero =
    Number.isInteger(publicChapterNumber) && publicChapterNumber > 0
      ? publicChapterNumber
      : 1;

  return `${workPath()}/capitulo/${numero}`;
}

function esperarGravacaoDataApi(page, tabela) {
  return page.waitForResponse(
    (response) => {
      const url = new URL(response.url());
      const metodo = response.request().method();

      return (
        url.pathname.endsWith(`/rest/v1/${tabela}`) &&
        ["POST", "PATCH", "DELETE"].includes(metodo) &&
        response.ok()
      );
    },
    { timeout: 20_000 },
  );
}

test.describe.serial("página pública da obra — cenários críticos", () => {
  test.beforeEach(() => {
    test.skip(
      !publicWorkSlug,
      "Defina E2E_PUBLIC_WORK_SLUG para validar a página pública da obra.",
    );
  });

  test("obra inexistente retorna 404 real", async ({ request }) => {
    const response = await request.get(
      "/obra/historietas-e2e-obra-inexistente-404",
    );

    expect(response.status()).toBe(404);
  });

  test("visitante vê CTA explícito e ele abre o capítulo público", async ({
    page,
  }) => {
    const runtime = monitorRuntime(page);

    const response = await page.goto(workPath(), {
      waitUntil: "domcontentloaded",
    });

    expect(response?.status()).toBe(200);
    await expect(
      page.getByRole("heading", {
        name: workTitle,
        exact: true,
      }),
    ).toBeVisible();

    const cta = page.getByRole("link", {
      name: `Começar a ler: ${workTitle}`,
      exact: true,
    });

    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute("href", chapterPath());

    await cta.click();
    await expect(page).toHaveURL(/\/ler-capitulo\?/);

    const leituraUrl = new URL(page.url());
    expect(leituraUrl.searchParams.get("obraId")).toMatch(
      /^[0-9a-f-]{36}$/i,
    );
    expect(leituraUrl.searchParams.get("capituloId")).toMatch(
      /^[0-9a-f-]{36}$/i,
    );

    runtime.assertClean();
  });

  test("comentários só consultam ao abrir e Escape restaura foco", async ({
    page,
  }) => {
    const runtime = monitorRuntime(page);
    const requisicoesComentarios = [];

    page.on("request", (request) => {
      const url = new URL(request.url());

      if (!/\/rest\/v1\/comentarios_obras$/.test(url.pathname)) {
        return;
      }

      const select = decodeURIComponent(url.searchParams.get("select") || "");

      if (select.includes("comentario_pai_id") && select.includes("comentario")) {
        requisicoesComentarios.push(url.toString());
      }
    });

    await page.goto(workPath(), {
      waitUntil: "domcontentloaded",
    });

    const abrirComentarios = page.getByRole("button", {
      name: /^Abrir comentários/,
    });

    await expect(abrirComentarios).toBeVisible();
    await page.waitForLoadState("networkidle");
    expect(requisicoesComentarios).toHaveLength(0);

    await abrirComentarios.click();

    const dialog = page.getByRole("dialog", {
      name: `Comentários de ${workTitle}`,
      exact: true,
    });

    await expect(dialog).toBeVisible();
    await expect
      .poll(() => requisicoesComentarios.length)
      .toBeGreaterThan(0);

    await expect(
      dialog.getByRole("button", {
        name: "Expandir comentários",
        exact: true,
      }),
    ).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(abrirComentarios).toBeFocused();

    runtime.assertClean();
  });

  test("dialogs de classificação e ações prendem foco e restauram gatilho", async ({
    page,
  }) => {
    const runtime = monitorRuntime(page);

    await page.goto(workPath(), {
      waitUntil: "domcontentloaded",
    });

    const abrirClassificacao = page.getByRole("button", {
      name: /^Ver classificação indicativa:/,
    });

    await abrirClassificacao.click();

    const classificacao = page.getByRole("dialog", {
      name: "Classificação indicativa",
      exact: true,
    });

    await expect(classificacao).toBeVisible();
    await expect(
      classificacao.getByRole("button", {
        name: "Fechar classificação indicativa",
        exact: true,
      }),
    ).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(classificacao).toBeHidden();
    await expect(abrirClassificacao).toBeFocused();

    const abrirAcoes = page.getByRole("button", {
      name: "Abrir ações da obra",
      exact: true,
    });

    await abrirAcoes.click();

    const acoes = page.getByRole("dialog", {
      name: `Ações da obra ${workTitle}`,
      exact: true,
    });

    await expect(acoes).toBeVisible();
    await expect(
      acoes.getByRole("button", {
        name: /^Salvar$/,
      }),
    ).toBeFocused();

    await page.keyboard.press("Shift+Tab");
    await expect(acoes.locator(":focus")).toHaveCount(1);

    await page.keyboard.press("Escape");
    await expect(acoes).toBeHidden();
    await expect(abrirAcoes).toBeFocused();

    runtime.assertClean();
  });

  test("ações sociais remotas sobrevivem sem cache local", async ({
    page,
  }) => {
    test.skip(
      !hasVisitorCredentials,
      "Defina E2E_VISITOR_EMAIL e E2E_VISITOR_PASSWORD.",
    );

    const runtime = monitorRuntime(page);

    await loginAsVisitor(page);
    await page.goto(workPath(), {
      waitUntil: "domcontentloaded",
    });

    const seguir = page.getByRole("button", {
      name: "Seguir obra",
      exact: true,
    });

    await expect(seguir).toBeVisible();
    await Promise.all([
      esperarGravacaoDataApi(page, "seguindo_obras"),
      seguir.click(),
    ]);
    await expect(
      page.getByRole("button", {
        name: "✓ Seguindo",
        exact: true,
      }),
    ).toBeVisible();

    let abrirAcoes = page.getByRole("button", {
      name: "Abrir ações da obra",
      exact: true,
    });

    await abrirAcoes.click();
    let acoes = page.getByRole("dialog", {
      name: `Ações da obra ${workTitle}`,
      exact: true,
    });
    await Promise.all([
      esperarGravacaoDataApi(page, "favoritos"),
      acoes.getByRole("button", { name: "Salvar", exact: true }).click(),
    ]);

    await abrirAcoes.click();
    acoes = page.getByRole("dialog", {
      name: `Ações da obra ${workTitle}`,
      exact: true,
    });
    await expect(
      acoes.getByRole("button", { name: "Salvo", exact: true }),
    ).toBeVisible();
    await Promise.all([
      esperarGravacaoDataApi(page, "concluidas"),
      acoes.getByRole("button", { name: "Concluir", exact: true }).click(),
    ]);

    await abrirAcoes.click();
    acoes = page.getByRole("dialog", {
      name: `Ações da obra ${workTitle}`,
      exact: true,
    });
    await expect(
      acoes.getByRole("button", { name: "Concluída", exact: true }),
    ).toBeVisible();
    await page.keyboard.press("Escape");

    await page.evaluate(() => {
      const prefixos = [
        "historietas-obras-seguidas",
        "historietas-obras-favoritas",
        "historietas-obras-concluidas",
      ];

      Object.keys(localStorage).forEach((chave) => {
        if (prefixos.some((prefixo) => chave.startsWith(prefixo))) {
          localStorage.removeItem(chave);
        }
      });
    });

    await page.reload({ waitUntil: "domcontentloaded" });

    await expect(
      page.getByRole("button", {
        name: "✓ Seguindo",
        exact: true,
      }),
    ).toBeVisible();

    abrirAcoes = page.getByRole("button", {
      name: "Abrir ações da obra",
      exact: true,
    });
    await abrirAcoes.click();

    acoes = page.getByRole("dialog", {
      name: `Ações da obra ${workTitle}`,
      exact: true,
    });

    await expect(
      acoes.getByRole("button", { name: "Salvo", exact: true }),
    ).toBeVisible();
    await expect(
      acoes.getByRole("button", { name: "Concluída", exact: true }),
    ).toBeVisible();

    runtime.assertClean();
  });

  test("avaliação remota prevalece depois de apagar cache local", async ({
    page,
  }) => {
    test.skip(
      !hasVisitorCredentials,
      "Defina E2E_VISITOR_EMAIL e E2E_VISITOR_PASSWORD.",
    );

    const runtime = monitorRuntime(page);

    await loginAsVisitor(page);
    await page.goto(workPath(), {
      waitUntil: "domcontentloaded",
    });

    await Promise.all([
      esperarGravacaoDataApi(page, "obra_avaliacoes"),
      page
        .getByRole("button", {
          name: "Avaliar com 4,5 estrelas",
          exact: true,
        })
        .click(),
    ]);

    await Promise.all([
      esperarGravacaoDataApi(page, "obra_avaliacoes"),
      page
        .getByRole("button", {
          name: "Avaliar com 5 estrelas",
          exact: true,
        })
        .click(),
    ]);

    await expect(
      page.getByRole("button", {
        name: "Avaliar com 0 estrelas",
        exact: true,
      }),
    ).toBeVisible();

    await page.evaluate(() => {
      Object.keys(localStorage).forEach((chave) => {
        if (chave.startsWith("historietas-obras-avaliacoes")) {
          localStorage.removeItem(chave);
        }
      });
    });

    await page.reload({ waitUntil: "domcontentloaded" });

    await expect(
      page.getByRole("button", {
        name: "Avaliar com 0 estrelas",
        exact: true,
      }),
    ).toBeVisible();

    runtime.assertClean();
  });

  test("visitante pode avaliar e denunciar; autor dono não", async ({
    page,
  }) => {
    test.skip(
      !hasAuthorCredentials,
      "Defina E2E_USER_EMAIL e E2E_USER_PASSWORD.",
    );

    const runtime = monitorRuntime(page);

    await page.goto(workPath(), {
      waitUntil: "domcontentloaded",
    });

    await expect(
      page.getByText("AVALIE ESTA OBRA", {
        exact: true,
      }),
    ).toBeVisible();

    let abrirAcoes = page.getByRole("button", {
      name: "Abrir ações da obra",
      exact: true,
    });

    await abrirAcoes.click();

    let acoes = page.getByRole("dialog", {
      name: `Ações da obra ${workTitle}`,
      exact: true,
    });

    await expect(
      acoes.getByRole("button", {
        name: "Denunciar",
        exact: true,
      }),
    ).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(acoes).toBeHidden();

    await loginAsAuthor(page);
    await page.goto(workPath(), {
      waitUntil: "domcontentloaded",
    });

    await expect(
      page.getByText("AVALIE ESTA OBRA", {
        exact: true,
      }),
    ).toHaveCount(0);

    abrirAcoes = page.getByRole("button", {
      name: "Abrir ações da obra",
      exact: true,
    });

    await abrirAcoes.click();

    acoes = page.getByRole("dialog", {
      name: `Ações da obra ${workTitle}`,
      exact: true,
    });

    await expect(acoes).toBeVisible();
    await expect(
      acoes.getByRole("button", {
        name: "Denunciar",
        exact: true,
      }),
    ).toHaveCount(0);

    runtime.assertClean();
  });

  test("autor marca capítulo como lido e CTA muda para Continuar leitura", async ({
    page,
  }) => {
    test.skip(
      !hasAuthorCredentials,
      "Defina E2E_USER_EMAIL e E2E_USER_PASSWORD.",
    );

    const runtime = monitorRuntime(page);

    await loginAsAuthor(page);
    await page.goto(chapterPath(), {
      waitUntil: "domcontentloaded",
    });

    await expect(page).toHaveURL(/\/ler-capitulo\?/);

    const marcarLido = page.getByRole("button", {
      name: "Marcar capítulo como lido",
      exact: true,
    });

    await expect(marcarLido).toBeVisible();
    await marcarLido.click();

    await expect(
      page.getByRole("button", {
        name: "Marcar capítulo como não lido",
        exact: true,
      }),
    ).toBeVisible();

    await page.goto(workPath(), {
      waitUntil: "domcontentloaded",
    });

    await expect(
      page.getByRole("link", {
        name: `Continuar leitura: ${workTitle}`,
        exact: true,
      }),
    ).toBeVisible();

    runtime.assertClean();
  });
});
