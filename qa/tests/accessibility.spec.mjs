import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { hasAuthorCredentials, loginAsAuthor } from "./helpers.mjs";

const rotasPublicas = [
  {
    rota: "/",
    obterMainFinal: (page) =>
      page.locator("main").filter({
        has: page.locator('section[aria-label="Atalhos principais"]'),
      }),
  },
  {
    rota: "/explorar",
    obterMainFinal: (page) =>
      page.locator("main").filter({
        has: page.locator('section[aria-label="Categorias"]'),
      }),
  },
  {
    rota: "/login",
    obterMainFinal: (page) =>
      page.locator("main").filter({
        has: page.locator("form"),
      }),
  },
];
const publicWorkSlug = (process.env.E2E_PUBLIC_WORK_SLUG || "").trim();
const userId = (process.env.E2E_USER_ID || "").trim();
const workId = (process.env.E2E_PUBLIC_WORK_ID || "").trim();
const annotationId = (process.env.E2E_DIARY_ANNOTATION_ID || "").trim();
const publicWorkTitle = "Obra Pública E2E";

async function esperarAxeSemViolacoesCriticas(page, fluxo) {
  const resultados = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  const violacoesCriticas = resultados.violations.filter(
    (violacao) =>
      violacao.impact === "critical" || violacao.impact === "serious",
  );

  expect(
    violacoesCriticas,
    [
      `Violações de acessibilidade encontradas em ${fluxo}:`,
      ...violacoesCriticas.map(
        (violacao) =>
          `${violacao.id} (${violacao.impact}) - ${violacao.nodes.length} ocorrência(s) - ${violacao.help}`,
      ),
    ].join("\n"),
  ).toEqual([]);
}

test("viewport global permite zoom do usuário", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });

  const viewport = await page
    .locator('meta[name="viewport"]')
    .getAttribute("content");

  expect(viewport).not.toBeNull();
  expect(viewport).not.toMatch(/user-scalable\s*=\s*(?:no|0)/i);

  const maximumScale = viewport?.match(
    /maximum-scale\s*=\s*([0-9]+(?:\.[0-9]+)?)/i,
  );

  if (maximumScale) {
    expect(Number(maximumScale[1])).toBeGreaterThanOrEqual(2);
  }
});

for (const { rota, obterMainFinal } of rotasPublicas) {
  test(`acessibilidade básica sem violações críticas em ${rota}`, async ({ page }) => {
    await page.goto(rota, { waitUntil: "domcontentloaded" });
    await expect(obterMainFinal(page)).toBeVisible();
    await expect(page.locator("main.historietas-loading-page")).toHaveCount(0);
    await esperarAxeSemViolacoesCriticas(page, rota);
  });
}

for (const dispositivo of ["desktop", "mobile"]) {
  test(`obra pública integra o baseline axe após renderizar o conteúdo (${dispositivo})`, async ({ page }) => {
    test.skip(
      !publicWorkSlug,
      "Prepare a obra pública no Supabase local descartável.",
    );

    await page.setViewportSize(dispositivo === "mobile"
      ? { width: 390, height: 844 } : { width: 1440, height: 900 });
    const rota = `/obra/${encodeURIComponent(publicWorkSlug)}`;
    await page.goto(rota, { waitUntil: "domcontentloaded" });

    const main = page.locator('[data-historietas-obra-dinamica-root="true"]');
    // Streaming can briefly retain a hidden root alongside the visible one.
    // Audit the confirmed, interactive page, not that transitional DOM.
    await expect(page.locator(
      '[data-historietas-obra-dinamica-root="true"][data-public-work-state="confirmada"][aria-busy="false"]:not([inert])',
    )).toHaveCount(1);
    await expect(main).toHaveCount(1);
    await expect(main).toBeVisible();
    await expect(main.getByRole("heading", { name: publicWorkTitle })).toBeVisible();
    // The body title can disappear before React hoists metadata into head.
    // A missing/wrong final title must still fail, before the full-page axe scan.
    await expect(page.locator("head > title")).toHaveJSProperty(
      "textContent", `${publicWorkTitle} | Historietas`,
    );
    await expect(page).toHaveTitle(`${publicWorkTitle} | Historietas`);
    await esperarAxeSemViolacoesCriticas(page, `${rota} (${dispositivo})`);
  });
}

for (const dispositivo of ["desktop", "mobile"]) {
  test(`capítulo público canônico integra o baseline axe após hidratar o leitor (${dispositivo})`, async ({
    page,
  }) => {
    test.skip(
      !publicWorkSlug,
      "Prepare a obra e o capítulo públicos no Supabase local descartável.",
    );

    const rota = `/obra/${encodeURIComponent(publicWorkSlug)}/capitulo/1`;
    await page.setViewportSize(dispositivo === "mobile"
      ? { width: 390, height: 844 } : { width: 1440, height: 900 });
    const confirmacao = page.waitForResponse(response => {
      const url = new URL(response.url());
      return url.pathname === "/api/leitura-publica" &&
        url.searchParams.get("slug") === publicWorkSlug && url.searchParams.get("numero") === "1";
    });
    await page.goto(rota, { waitUntil: "domcontentloaded" });
    expect((await confirmacao).status()).toBe(200);

    // Não confundir o texto do SSR oculto com o Leitor hidratado, nem aceitar duas raízes ativas.
    const main = page.locator('main[data-historietas-ler-capitulo-root="true"]:visible');
    await expect(main).toHaveCount(1);
    await expect(main).not.toHaveAttribute("aria-busy", "true");
    await expect(page.locator("main:visible")).toHaveCount(1);
    await expect(main.getByRole("heading", { name: "Capítulo 1", exact: true })).toBeVisible();
    await expect(
      main.getByText(
        "Este capítulo existe somente no ambiente local descartável dos testes E2E.",
        { exact: true },
      ),
    ).toBeVisible();
    await expect(main).not.toHaveAttribute("aria-busy", "true");
    await esperarAxeSemViolacoesCriticas(page, rota);
  });
}

for (const dispositivo of ["desktop", "mobile"]) {
  test(`Comunidade integra o baseline axe após carregar o feed público (${dispositivo})`, async ({ page }) => {
    await page.setViewportSize(dispositivo === "mobile"
      ? { width: 390, height: 844 } : { width: 1440, height: 900 });
    await page.goto("/comunidade", { waitUntil: "domcontentloaded" });

    // The loading shell is also a <main>; the desktop title is absent on mobile.
    // These controls exist only in the final feed, including its legitimate empty state.
    const abas = page.getByRole("tablist", { name: "Organizar publicações da Comunidade" });
    const main = page.locator("main").filter({ has: abas });
    await expect(main).toBeVisible({ timeout: 30_000 });
    await expect(main.getByRole("tab", { name: "Para você", exact: true })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("status", { name: "Carregando Comunidade", exact: true })).toHaveCount(0);
    await esperarAxeSemViolacoesCriticas(page, `/comunidade (${dispositivo})`);
  });
}

test("Diário autenticado integra o baseline axe após carregar a lista", async ({
  page,
}) => {
  test.skip(
    !hasAuthorCredentials || !userId || !workId || !annotationId,
    "Prepare as credenciais e os IDs E2E no Supabase local descartável.",
  );

  await loginAsAuthor(page);
  await page.evaluate(
    ({ annotationIdValue, userIdValue, workIdValue }) => {
      window.localStorage.setItem(
        `historietas-obras-seguidas:${userIdValue}`,
        JSON.stringify([workIdValue]),
      );
      window.localStorage.setItem(
        `historietas-diario-anotacoes:${userIdValue.toLowerCase()}`,
        JSON.stringify([
          {
            id: annotationIdValue,
            user_id: userIdValue,
            obra_id: workIdValue,
            tipo: "lendo",
            texto: "Anotação E2E para validar a página principal do Diário.",
            visibilidade: "publico",
            quem_pode_comentar: "todos",
            visibilidade_comentarios: "publico",
            permitir_curtidas: true,
            contem_spoiler: false,
            atualizado_em: new Date().toISOString(),
          },
        ]),
      );
    },
    {
      annotationIdValue: annotationId,
      userIdValue: userId,
      workIdValue: workId,
    },
  );

  const rota = "/listas?modo=perfil&origem=diario";
  await page.goto(rota, { waitUntil: "domcontentloaded" });

  await expect(
    page.getByRole("heading", { name: "Diário de Autor E2E" }),
  ).toBeVisible();
  await expect(page.getByText("Organizando a lista...")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: `Mostrar anotação de ${publicWorkTitle}` }),
  ).toBeVisible();
  await esperarAxeSemViolacoesCriticas(page, rota);
});

test("home e explorar não criam rolagem horizontal em celular", async ({ page }) => {
  await page.setViewportSize({
    width: 390,
    height: 844,
  });

  for (const { rota, obterMainFinal } of rotasPublicas.filter(
    ({ rota }) => rota === "/" || rota === "/explorar",
  )) {
    await page.goto(rota, {
      waitUntil: "domcontentloaded",
    });

    await expect(obterMainFinal(page)).toBeVisible();
    await expect(page.locator("main.historietas-loading-page")).toHaveCount(0);

    const dimensoes = await page.evaluate(() => ({
      viewport: window.innerWidth,
      document: document.documentElement.scrollWidth,
    }));

    expect(
      dimensoes.document,
      `Rolagem horizontal detectada em ${rota}`,
    ).toBeLessThanOrEqual(dimensoes.viewport + 2);
  }
});
