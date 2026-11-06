import { test, expect } from "@playwright/test";
import {
  destructiveEnabled,
  hasVisitorCredentials,
  loginAsVisitor,
  monitorRuntime,
  setVisitorFavoriteByWorkSlug,
} from "./helpers.mjs";

test("Home carrega navegação e busca funciona", async ({ page }) => {
  const runtime = monitorRuntime(page);

  await page.goto("/", {
    waitUntil: "domcontentloaded",
  });

  await expect(
    page.getByLabel("Navegação principal")
  ).toBeVisible();

  await expect(
    page.getByRole("link", {
      name: "Explorar",
      exact: true,
    })
  ).toBeVisible();

  const search = page.getByPlaceholder(
    "Buscar obras, autor, gênero..."
  );

  await expect(search).toBeVisible();

  const impossibleSearch =
    "historietas_e2e_sem_resultado_9f8d7c";

  await search.fill(impossibleSearch);

  await expect(search).toHaveValue(
    impossibleSearch
  );

  await search.fill("");

  await expect(search).toHaveValue("");

  runtime.assertClean();
});

test("Explorar aplica categoria, abre filtros e limpa estado", async ({
  page,
}) => {
  const runtime = monitorRuntime(page);

  await page.goto("/explorar", {
    waitUntil: "domcontentloaded",
  });

  await expect(
    page.getByRole("heading", {
      name: "Explorar",
      exact: true,
    })
  ).toBeVisible();

  await page
    .getByRole("button", {
      name: "Fantasia",
      exact: true,
    })
    .click();

  await expect(page).toHaveURL(
    /\/explorar\?categoria=Fantasia/
  );

  await page
    .getByRole("button", {
      name: "Abrir funções do Explorar",
      exact: true,
    })
    .click();

  const modal = page.locator(
    'section[aria-label="EXPLORAR"]'
  );

  await expect(modal).toBeVisible();

  const recentButton = modal.getByRole(
    "button",
    {
      name: /^Mais recentes/,
    }
  );

  await recentButton.click();

  await expect(
    modal.getByRole("button", {
      name: /^Mais recentes/,
    })
  ).toContainText("✓");

  await modal
    .getByRole("button", {
      name: "Limpar filtros",
      exact: true,
    })
    .click();

  await expect(page).toHaveURL(
    /\/explorar$/
  );

  await expect(modal).toBeHidden();

  runtime.assertClean();
});

test("Explorar restaura e preserva filtros públicos de uma URL compartilhada", async ({
  page,
}) => {
  const consultasCatalogo = [];
  page.on("request", (request) => {
    if (request.url().includes("/rpc/listar_obras_catalogo")) {
      consultasCatalogo.push(request.postDataJSON());
    }
  });

  const urlCompartilhada =
    "/explorar?categoria=Fantasia&busca=QA%20Pagina%C3%A7%C3%A3o&ordenacao=mais-recentes";
  await page.goto(urlCompartilhada, { waitUntil: "domcontentloaded" });

  const search = page.getByPlaceholder("Buscar histórias...").first();
  await expect(search).toBeVisible();
  await expect(search).toHaveValue("QA Paginação");
  await page
    .getByRole("button", {
      name: "Abrir funções do Explorar",
      exact: true,
    })
    .click();
  const modal = page.locator('section[aria-label="EXPLORAR"]');
  await expect(
    modal.getByRole("button", { name: /^Mais recentes/ }),
  ).toContainText("✓");
  await expect
    .poll(
      () =>
        consultasCatalogo.filter(
          (consulta) =>
            consulta?.p_busca === "QA Paginação" &&
            consulta?.p_genero === "Fantasia" &&
            consulta?.p_ordenacao === "mais-recentes",
        ).length,
      { message: "a consulta compartilhada deve ser enviada uma única vez" },
    )
    .toBe(1);

  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(search).toBeVisible();
  await expect(search).toHaveValue("QA Paginação");
  await expect(page).toHaveURL(/categoria=Fantasia/);
  await expect(page).toHaveURL(/busca=QA%20Pagina%C3%A7%C3%A3o/);
  await expect(page).toHaveURL(/ordenacao=mais-recentes/);
});

test("Explorar sincroniza estado e resultados ao voltar e avançar", async ({
  page,
}) => {
  await page.goto("/explorar", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { name: "Explorar", exact: true }),
  ).toBeVisible();

  await page
    .getByRole("button", { name: "Fantasia", exact: true })
    .click();
  const search = page.getByPlaceholder("Buscar histórias...").first();
  await search.fill("QA Paginação");
  await page
    .getByRole("button", {
      name: "Abrir funções do Explorar",
      exact: true,
    })
    .click();
  const modal = page.locator('section[aria-label="EXPLORAR"]');
  const recentButton = modal.getByRole("button", { name: /^Mais recentes/ });
  await recentButton.click();
  await expect(page).toHaveURL(/ordenacao=mais-recentes/);

  await page.goBack();
  await expect(page).not.toHaveURL(/ordenacao=/);
  await expect(search).toHaveValue("QA Paginação");
  await expect(recentButton).not.toContainText("✓");

  await page.goBack();
  await expect(page).toHaveURL(/\/explorar$/);
  await expect(search).toHaveValue("");

  await page.goForward();
  await expect(page).toHaveURL(/categoria=Fantasia/);
  await expect(search).toHaveValue("QA Paginação");

  await page.goForward();
  await expect(page).toHaveURL(/ordenacao=mais-recentes/);
  await expect(recentButton).toContainText("✓");
});

test("Explorar restaura busca e ordenação compartilhadas no mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(
    "/explorar?busca=QA%20Pagina%C3%A7%C3%A3o&ordenacao=mais-curtidas",
    { waitUntil: "domcontentloaded" },
  );

  await page
    .getByRole("button", { name: "Abrir busca", exact: true })
    .click();
  await expect(page.getByPlaceholder("Buscar histórias...")).toHaveValue(
    "QA Paginação",
  );
  await page
    .getByRole("button", {
      name: "Abrir funções do Explorar",
      exact: true,
    })
    .click();
  await expect(
    page
      .locator('section[aria-label="EXPLORAR"]')
      .getByRole("button", { name: /^Mais curtidas/ }),
  ).toContainText("✓");
});

test("Explorar busca no catálogo real e carrega a próxima página", async ({
  page,
}) => {
  const runtime = monitorRuntime(page);

  await page.goto("/explorar", {
    waitUntil: "domcontentloaded",
  });

  const search = page
    .getByPlaceholder("Buscar histórias...")
    .first();
  await expect(search).toBeVisible();
  await search.fill("QA Paginação");

  const loadMore = page.getByRole("button", {
    name: "Carregar mais",
    exact: true,
  });
  await expect(loadMore).toBeVisible();

  const catalogLinks = page.locator(
    'a[href^="/obra/qa-paginacao-obra-"]',
  );
  const firstPageLinkCount = await catalogLinks.count();
  expect(firstPageLinkCount).toBeGreaterThan(0);

  await loadMore.click();
  await expect
    .poll(() => catalogLinks.count())
    .toBeGreaterThan(firstPageLinkCount);

  await search.fill("QA Paginação Obra 000600");
  await expect(
    page.locator('a[href="/obra/qa-paginacao-obra-000600"]').first(),
  ).toBeVisible();

  await search.fill("QA Paginações Obra 000600");
  await expect(
    page.locator('a[href="/obra/qa-paginacao-obra-000600"]').first(),
  ).toBeVisible();

  runtime.assertClean();
});

for (const dispositivo of [
  { nome: "desktop", viewport: { width: 1440, height: 900 } },
  { nome: "mobile", viewport: { width: 390, height: 844 } },
]) {
  test(`Explorar pagina autores e busca pelo nome público atual (${dispositivo.nome})`, async ({
    page,
  }) => {
    const runtime = monitorRuntime(page);
    await page.setViewportSize(dispositivo.viewport);
    await page.goto("/explorar?tipo=autores", { waitUntil: "domcontentloaded" });

    const autoraRenomeada = page.getByRole("link", {
      name: "Abrir perfil do autor Autora Renomeada Fora da Página",
      exact: true,
    });
    const carregarMais = page.getByRole("button", {
      name: "Carregar mais",
      exact: true,
    });

    await expect(carregarMais).toBeVisible();
    await expect(autoraRenomeada).toHaveCount(0);
    await carregarMais.click();
    await expect(autoraRenomeada.first()).toBeVisible();

    const consultasDoNomeAtual = [];
    page.on("request", (request) => {
      if (!request.url().includes("/rpc/listar_obras_catalogo")) {
        return;
      }

      const corpo = request.postDataJSON();
      if (corpo?.p_busca === "Autora Renomeada Fora da Página") {
        consultasDoNomeAtual.push(corpo);
      }
    });

    await page.goto(
      "/explorar?tipo=autores&busca=Autora%20Renomeada%20Fora%20da%20P%C3%A1gina",
      { waitUntil: "domcontentloaded" },
    );
    await expect(autoraRenomeada.first()).toBeVisible();
    await expect
      .poll(() => consultasDoNomeAtual.length, {
        message: "a busca pelo nome público atual deve consultar o catálogo uma vez",
      })
      .toBe(1);
    await expect(page).toHaveURL(/tipo=autores/);
    await expect(page).toHaveURL(/busca=Autora%20Renomeada/);

    runtime.assertClean();
  });
}

test("Explorar encontra coleção pessoal fora da primeira página no desktop e mobile", async ({
  page,
}) => {
  test.skip(
    !destructiveEnabled || !hasVisitorCredentials,
    "A regressão autenticada exige as fixtures descartáveis do Supabase local.",
  );

  const slug = "qa-paginacao-obra-000600";
  await setVisitorFavoriteByWorkSlug(slug, true);

  try {
    await loginAsVisitor(page);

    for (const viewport of [
      { width: 1440, height: 900 },
      { width: 390, height: 844 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto("/explorar", { waitUntil: "domcontentloaded" });
      await page
        .getByRole("button", {
          name: "Abrir funções do Explorar",
          exact: true,
        })
        .click();
      const modal = page.locator('section[aria-label="EXPLORAR"]');
      await modal.getByRole("button", { name: /^Na lista/ }).click();

      await expect(
        page.locator(`a[href="/obra/${slug}"]`).first(),
      ).toBeAttached();
      await expect(page).not.toHaveURL(/favoritas|colecao|obraId/);
    }
  } finally {
    await setVisitorFavoriteByWorkSlug(slug, false);
  }
});

for (const dispositivo of [
  { nome: "desktop", viewport: { width: 1440, height: 900 } },
  { nome: "mobile", viewport: { width: 390, height: 844 } },
]) {
  test(`Explorar diferencia falha temporária de catálogo vazio e recupera no retry (${dispositivo.nome})`, async ({
    page,
  }) => {
    await page.setViewportSize(dispositivo.viewport);
    const interromperCatalogo = (route) => route.abort("failed");
    await page.route(
      "**/rest/v1/rpc/listar_obras_catalogo",
      interromperCatalogo,
    );

    await page.goto("/explorar", { waitUntil: "domcontentloaded" });

    const botaoTentarNovamente = page.getByRole("button", {
      name: "Tentar novamente",
      exact: true,
    });
    const aviso = page.getByRole("alert").filter({
      has: botaoTentarNovamente,
    });
    await expect(aviso).toBeVisible();
    await expect(botaoTentarNovamente).toBeVisible();
    await expect(
      page.getByText("PUBLIQUE SUA HISTÓRIA", { exact: true }),
    ).toHaveCount(0);

    await page.unroute(
      "**/rest/v1/rpc/listar_obras_catalogo",
      interromperCatalogo,
    );
    await botaoTentarNovamente.click();

    await expect(aviso).toBeHidden();
    await expect(
      page.locator('a[href^="/obra/qa-paginacao-obra-"]').first(),
    ).toBeVisible();
  });
}

test("Home e Explorar não criam rolagem horizontal no celular", async ({
  page,
}) => {
  await page.setViewportSize({
    width: 390,
    height: 844,
  });

  for (const { route, getFinalMain } of [
    {
      route: "/",
      getFinalMain: () =>
        page.locator("main").filter({
          has: page.locator('section[aria-label="Atalhos principais"]'),
        }),
    },
    {
      route: "/explorar",
      getFinalMain: () =>
        page.locator("main").filter({
          has: page.locator('section[aria-label="Categorias"]'),
        }),
    },
  ]) {
    await page.goto(route, {
      waitUntil: "domcontentloaded",
    });

    await expect(getFinalMain()).toBeVisible();
    await expect(page.locator("main.historietas-loading-page")).toHaveCount(0);

    const dimensions = await page.evaluate(
      () => ({
        viewport: window.innerWidth,
        document:
          document.documentElement.scrollWidth,
      })
    );

    expect(
      dimensions.document,
      `Rolagem horizontal detectada em ${route}`
    ).toBeLessThanOrEqual(
      dimensions.viewport + 2
    );
  }
});
