import { test, expect } from "@playwright/test";
import { monitorRuntime } from "./helpers.mjs";

const routes = [
  "/",
  "/explorar",
  "/em-alta",
  "/em-breve",
  "/comunidade",
  "/ajuda",
  "/diretrizes-da-comunidade",
  "/politica-de-privacidade",
  "/termos",
  "/termos-de-uso",
  "/login",
  "/redefinir-senha",
  "/listas",
  "/notificacoes",
  "/seguindo",
  "/configuracoes",
  "/painel-autor",
  "/perfil-autor",
  "/perfil-autor/top-5",
  "/publicar",
  "/adicionar-capitulo",
  "/editar-capitulo",
  "/editar-obra",
  "/ler-capitulo",
  "/admin/comunidade",
  "/admin/problemas-tecnicos"
];

for (const route of routes) {
  test(`rota ${route} não retorna erro 5xx`, async ({ page }) => {
    const runtime = monitorRuntime(page);
    const response = await page.goto(route, { waitUntil: "domcontentloaded" });
    expect(response, `A rota ${route} não respondeu`).not.toBeNull();
    expect(response.status(), `Status inesperado em ${route}`).toBeLessThan(500);
    await expect(page.locator("body")).toBeVisible();
    runtime.assertClean();
  });
}

test("robots, sitemap, favicon e cabeçalhos de produção", async ({ request }) => {
  const home = await request.get("/");
  expect(home.status()).toBeLessThan(500);
  expect(home.headers()["x-powered-by"]).toBeUndefined();

  const robots = await request.get("/robots.txt");
  expect(robots.ok()).toBeTruthy();
  const robotsText = await robots.text();
  expect(robotsText).toMatch(/user-agent:/i);
  expect(robotsText).toContain("Sitemap:");

  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBeTruthy();
  const sitemapText = await sitemap.text();
  expect(sitemapText).toContain("<urlset");
  expect(sitemapText).toContain("historietas.com.br");

  const publicWorkSlug = (process.env.E2E_PUBLIC_WORK_SLUG || "").trim();
  if (publicWorkSlug) {
    expect(sitemapText).toContain(`/obra/${encodeURIComponent(publicWorkSlug)}`);
  }

  if (process.env.E2E_ALLOW_DESTRUCTIVE === "true") {
    expect(sitemapText).toContain("/obra/qa-paginacao-obra-001201");
  }

  const favicon = await request.get("/favicon.ico");
  expect(favicon.ok()).toBeTruthy();
  expect(favicon.headers()["content-type"] || "").toMatch(/image|icon/i);
});

test("Explorar possui SEO próprio e URL canônica correta", async ({ page }) => {
  await page.goto("/explorar", { waitUntil: "domcontentloaded" });

  await expect(page).toHaveTitle(/Explorar histórias \| Historietas/);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    /Explore webnovels, fanfics, mangás/,
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://www.historietas.com.br/explorar",
  );
});

test("obra pública configurada abre sem erro", async ({ page }) => {
  const slug = (process.env.E2E_PUBLIC_WORK_SLUG || "").trim();
  test.skip(!slug, "Defina E2E_PUBLIC_WORK_SLUG para testar uma obra pública específica.");

  const response = await page.goto(`/obra/${encodeURIComponent(slug)}`, {
    waitUntil: "domcontentloaded"
  });
  expect(response?.status()).toBeLessThan(500);
  await expect(page.locator("main")).toBeVisible();
});

test("capítulo público configurado abre sem erro", async ({ page }) => {
  const slug = (process.env.E2E_PUBLIC_WORK_SLUG || "").trim();
  const chapter = Number(process.env.E2E_PUBLIC_CHAPTER_NUMBER || "1");
  test.skip(!slug, "Defina E2E_PUBLIC_WORK_SLUG para testar um capítulo público específico.");

  const response = await page.goto(
    `/obra/${encodeURIComponent(slug)}/capitulo/${Number.isInteger(chapter) && chapter > 0 ? chapter : 1}`,
    { waitUntil: "domcontentloaded" }
  );
  expect(response?.status()).toBeLessThan(500);
  await expect(page.locator("main")).toBeVisible();
});
