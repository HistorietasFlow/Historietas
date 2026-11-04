import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { hasAuthorCredentials, loginAsAuthor } from "./helpers.mjs";

const rotasPublicas = ["/", "/explorar", "/login"];
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

for (const rota of rotasPublicas) {
  test(`acessibilidade básica sem violações críticas em ${rota}`, async ({ page }) => {
    await page.goto(rota, { waitUntil: "domcontentloaded" });
    await expect(page.locator("main")).toBeVisible();
    await esperarAxeSemViolacoesCriticas(page, rota);
  });
}

test("obra pública integra o baseline axe após renderizar o conteúdo", async ({
  page,
}) => {
  test.skip(
    !publicWorkSlug,
    "Prepare a obra pública no Supabase local descartável.",
  );

  const rota = `/obra/${encodeURIComponent(publicWorkSlug)}`;
  await page.goto(rota, { waitUntil: "domcontentloaded" });

  const main = page.locator('[data-historietas-obra-dinamica-root="true"]');
  await expect(page.getByRole("heading", { name: publicWorkTitle })).toBeVisible();
  await expect(main).not.toHaveAttribute("aria-busy", "true");
  await esperarAxeSemViolacoesCriticas(page, rota);
});

test("capítulo público canônico integra o baseline axe após hidratar o leitor", async ({
  page,
}) => {
  test.skip(
    !publicWorkSlug,
    "Prepare a obra e o capítulo públicos no Supabase local descartável.",
  );

  const rota = `/obra/${encodeURIComponent(publicWorkSlug)}/capitulo/1`;
  await page.goto(rota, { waitUntil: "domcontentloaded" });

  const main = page.locator('[data-historietas-ler-capitulo-root="true"]');
  await expect(page.getByRole("heading", { name: "Capítulo 1" })).toBeVisible();
  await expect(
    page.getByText(
      "Este capítulo existe somente no ambiente local descartável dos testes E2E.",
    ),
  ).toBeVisible();
  await expect(main).not.toHaveAttribute("aria-busy", "true");
  await esperarAxeSemViolacoesCriticas(page, rota);
});

test("Comunidade integra o baseline axe após carregar o feed público", async ({
  page,
}) => {
  await page.goto("/comunidade", { waitUntil: "domcontentloaded" });

  const main = page.locator("main");
  await expect(main).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("Comunidade", { exact: true }).first()).toBeVisible();
  await esperarAxeSemViolacoesCriticas(page, "/comunidade");
});

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

  for (const rota of ["/", "/explorar"]) {
    await page.goto(rota, {
      waitUntil: "domcontentloaded",
    });

    await expect(page.locator("main")).toBeVisible();

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
