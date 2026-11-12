import { test, expect } from "@playwright/test";

const slug = (process.env.E2E_PUBLIC_WORK_SLUG || "").trim();
const workId = (process.env.E2E_PUBLIC_WORK_ID || "").trim();
const chapterId = (process.env.E2E_PUBLIC_CHAPTER_ID || "").trim();
const chapterNumber = Number(process.env.E2E_PUBLIC_CHAPTER_NUMBER || "1");
const publicChapterNumber =
  Number.isInteger(chapterNumber) && chapterNumber > 0 ? chapterNumber : 1;
const canonicalPath = `/obra/${encodeURIComponent(slug)}/capitulo/${publicChapterNumber}`;

const activeReader = (page) =>
  page.locator('main[data-historietas-ler-capitulo-root="true"]:visible');

function publicChapterResponse(page, number) {
  // Registrar antes da navegação: uma resposta atrasada de uma requisição
  // anterior (mesmo do mesmo capítulo) não pode confirmar a nova transição.
  const request = page.waitForRequest((request) => {
    const url = new URL(request.url());
    return url.pathname === "/api/leitura-publica" &&
      url.searchParams.get("slug") === slug &&
      url.searchParams.get("numero") === String(number);
  });
  return request.then(async (request) => {
    const response = await request.response();
    expect(response).not.toBeNull();
    expect(response.status()).toBe(200);
    const snapshot = await response.json();
    expect(["disponivel", "inalterada"]).toContain(snapshot.estado);
    expect(snapshot.obraId).toBe(workId);
    expect(snapshot.numeroCapitulo).toBe(number);
    if (number === publicChapterNumber) expect(snapshot.capituloId).toBe(chapterId);
    return snapshot;
  });
}

async function expectActiveChapter(page, path, title, text) {
  await expect(page).toHaveURL(new RegExp(`${path}$`));
  const reader = activeReader(page);
  // Não escolher uma raiz arbitrária nem aceitar dois leitores ativos.
  await expect(reader).toHaveCount(1);
  await expect(reader).not.toHaveAttribute("aria-busy", "true");
  await expect(reader.getByRole("heading", { name: title, exact: true })).toBeVisible();
  await expect(reader.getByText(text, { exact: true })).toBeVisible();
}

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

  test("capítulo público inexistente responde 404 sem redirect", async ({
    page,
  }) => {
    const response = await page.goto(
      `/obra/${encodeURIComponent(slug)}/capitulo/999999`,
      { waitUntil: "domcontentloaded" },
    );
    const html = await page.content();

    expect(response?.status()).toBe(404);
    expect(page.url()).toContain(
      `/obra/${encodeURIComponent(slug)}/capitulo/999999`,
    );
    expect(page.url()).not.toContain("/ler-capitulo");
    expect(html).toContain('name="robots" content="noindex"');
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

  test("ignora IDs conflitantes da query após hidratar a rota canônica", async ({
    page,
  }) => {
    const urlComQueryConflitante = `${canonicalPath}?obraId=outra-obra&capituloId=outro-capitulo`;
    const response = await page.goto(urlComQueryConflitante, {
      waitUntil: "domcontentloaded",
    });

    expect(response?.status()).toBe(200);
    await expect(page).toHaveURL(urlComQueryConflitante);
    await expect(page.getByRole("heading", { name: "Capítulo 1" })).toBeVisible();
    await expect(
      page.getByText(
        "Este capítulo existe somente no ambiente local descartável dos testes E2E.",
      ),
    ).toBeVisible();

    await page.getByRole("button", { name: "Ajustes" }).click();
    await expect(page.getByText("Tamanho da fonte")).toBeVisible();
  });

  for (const device of ["desktop", "mobile"]) {
    test(`sincroniza conteúdo e URL ao voltar e avançar entre capítulos (${device})`, async ({
      page,
    }) => {
      await page.setViewportSize(device === "mobile"
        ? { width: 390, height: 844 } : { width: 1440, height: 900 });
      const chapterOnePath = `/obra/${encodeURIComponent(slug)}/capitulo/1`;
      const chapterTwoPath = `/obra/${encodeURIComponent(slug)}/capitulo/2`;
      const chapterOneText =
        "Este capítulo existe somente no ambiente local descartável dos testes E2E.";
      const chapterTwoText =
        "Este é o segundo capítulo público descartável dos testes E2E.";

      const hydration = publicChapterResponse(page, 1);
      await page.goto(chapterOnePath, { waitUntil: "domcontentloaded" });
      await hydration;
      await expectActiveChapter(page, chapterOnePath, "Capítulo 1", chapterOneText);

      // Regressão determinística do seletor global: uma árvore oculta do SSR
      // pode conter o mesmo texto, mas não é o leitor interativo confirmado.
      await activeReader(page).evaluate((reader) => {
        const copy = document.createElement("div");
        copy.hidden = true;
        copy.dataset.qaReaderCopy = "true";
        copy.append(reader.cloneNode(true));
        document.body.append(copy);
      });
      await expect(page.getByText(chapterOneText, { exact: true })).toHaveCount(2);
      await expectActiveChapter(page, chapterOnePath, "Capítulo 1", chapterOneText);

      const next = publicChapterResponse(page, 2);
      await Promise.all([
        next,
        activeReader(page).getByRole("button", { name: "Próximo capítulo →", exact: true }).click(),
      ]);
      await expectActiveChapter(page, chapterTwoPath, "Capítulo 2", chapterTwoText);

      const back = publicChapterResponse(page, 1);
      await page.goBack();
      await back;
      await expectActiveChapter(page, chapterOnePath, "Capítulo 1", chapterOneText);

      const forward = publicChapterResponse(page, 2);
      await page.goForward();
      await forward;
      await expectActiveChapter(page, chapterTwoPath, "Capítulo 2", chapterTwoText);

      // A delimitação não mascara duplicação visível: duas raízes entram no
      // seletor e violariam o toHaveCount(1) de todas as transições acima.
      await activeReader(page).evaluate((reader) => {
        const copy = reader.cloneNode(true);
        copy.dataset.qaVisibleReaderCopy = "true";
        document.body.append(copy);
      });
      await expect(activeReader(page)).toHaveCount(2);
      await page.locator('[data-qa-visible-reader-copy="true"], [data-qa-reader-copy="true"]').evaluateAll(
        (copies) => copies.forEach((copy) => copy.remove()),
      );
      await expectActiveChapter(page, chapterTwoPath, "Capítulo 2", chapterTwoText);
    });
  }

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
