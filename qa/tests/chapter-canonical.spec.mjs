import { test, expect } from "@playwright/test";

const slug = (process.env.E2E_PUBLIC_WORK_SLUG || "").trim();
const workId = (process.env.E2E_PUBLIC_WORK_ID || "").trim();
const chapterId = (process.env.E2E_PUBLIC_CHAPTER_ID || "").trim();
const chapterNumber = Number(process.env.E2E_PUBLIC_CHAPTER_NUMBER || "1");
const publicChapterNumber =
  Number.isInteger(chapterNumber) && chapterNumber > 0 ? chapterNumber : 1;
const canonicalPath = `/obra/${encodeURIComponent(slug)}/capitulo/${publicChapterNumber}`;

test.describe("capítulo público canônico", () => {
  test.beforeEach(() => {
    test.skip(
      !slug || !workId || !chapterId,
      "Prepare a obra e o capítulo públicos no Supabase local.",
    );
  });

  test("responde 200 com metadata e conteúdo no HTML inicial", async ({
    request,
  }) => {
    const response = await request.get(canonicalPath, { maxRedirects: 0 });
    const html = await response.text();

    expect(response.status()).toBe(200);
    expect(response.headers().location).toBeUndefined();
    expect(response.url()).not.toContain("/ler-capitulo");
    expect(html).toContain("Capítulo 1");
    expect(html).toContain(
      "Este capítulo existe somente no ambiente local descartável dos testes E2E.",
    );
    expect(html).toContain(
      `https://www.historietas.com.br${canonicalPath}`,
    );
    expect(html).toContain("Capítulo 1 — Obra Pública E2E");
  });

  test("hidrata o leitor compartilhado sem trocar a URL canônica", async ({
    page,
  }) => {
    const response = await page.goto(canonicalPath, {
      waitUntil: "domcontentloaded",
    });

    expect(response?.status()).toBe(200);
    await expect(page).toHaveURL(new RegExp(`${canonicalPath}$`));
    await expect(page).toHaveTitle(/Capítulo 1.*Obra Pública E2E/);
    await expect(page.getByRole("heading", { name: "Capítulo 1" })).toBeVisible();
    await expect(
      page.getByText(
        "Este capítulo existe somente no ambiente local descartável dos testes E2E.",
      ),
    ).toBeVisible();

    await page.getByRole("button", { name: "Ajustes" }).click();
    await expect(page.getByText("Tamanho da fonte")).toBeVisible();
  });

  test("mantém o leitor interno por IDs", async ({ page }) => {
    const internalPath = `/ler-capitulo?obraId=${encodeURIComponent(
      workId,
    )}&capituloId=${encodeURIComponent(chapterId)}`;
    const response = await page.goto(internalPath, {
      waitUntil: "domcontentloaded",
    });

    expect(response?.status()).toBe(200);
    await expect(page).toHaveURL(new RegExp("/ler-capitulo\\?"));
    await expect(page.getByRole("heading", { name: "Capítulo 1" })).toBeVisible();
  });
});
