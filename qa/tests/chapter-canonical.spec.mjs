import { test, expect } from "@playwright/test";

const slug = (process.env.E2E_PUBLIC_WORK_SLUG || "").trim();
const workId = (process.env.E2E_PUBLIC_WORK_ID || "").trim();
const chapterId = (process.env.E2E_PUBLIC_CHAPTER_ID || "").trim();
const chapterNumber = Number(process.env.E2E_PUBLIC_CHAPTER_NUMBER || "1");
const publicChapterNumber =
  Number.isInteger(chapterNumber) && chapterNumber > 0 ? chapterNumber : 1;
const canonicalPath = `/obra/${encodeURIComponent(slug)}/capitulo/${publicChapterNumber}`;

test.describe("capítulo público canônico", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const events = [];
      window.__readerHistoryProbe = events;
      const snapshot = (source, detail = {}) => {
        const state = window.history.state;
        events.push({
          time: performance.now(), source, url: location.href,
          heading: document.querySelector("h1")?.textContent,
          historyLength: history.length,
          state: state && {
            keys: Object.keys(state), __NA: state.__NA,
            identity: state.__historietasLeitorCapitulo,
            tree: state.__PRIVATE_NEXTJS_INTERNALS_TREE,
          },
          ...detail,
        });
      };
      for (const method of ["pushState", "replaceState"]) {
        const original = history[method];
        history[method] = function(data, unused, url) {
          snapshot(`${method}:before`, { targetUrl: url, incomingIdentity: data?.__historietasLeitorCapitulo, incomingNA: data?.__NA, stack: new Error().stack });
          const result = original.call(this, data, unused, url);
          snapshot(`${method}:after`);
          return result;
        };
      }
      addEventListener("popstate", event => snapshot("native-popstate", { incomingIdentity: event.state?.__historietasLeitorCapitulo }));
      addEventListener("historietas:history-probe", event => snapshot(event.detail.source, event.detail));
      addEventListener("click", event => {
        const button = event.target.closest?.("button");
        if (button) snapshot("click", { button: button.textContent });
      }, true);
      new MutationObserver(() => {
        const heading = document.querySelector("h1")?.textContent;
        if (heading !== window.__lastReaderProbeHeading) {
          window.__lastReaderProbeHeading = heading;
          snapshot("heading-change");
        }
      }).observe(document, { childList: true, subtree: true, characterData: true });
    });
  });
  test.afterEach(async ({ page }, testInfo) => {
    const events = await page.evaluate(() => window.__readerHistoryProbe || []).catch(() => []);
    const report = { react: process.env.PROBE_REACT_VERSION, repeat: testInfo.repeatEachIndex, retry: testInfo.retry, status: testInfo.status, events };
    await testInfo.attach("history-probe", { body: JSON.stringify(report, null, 2), contentType: "application/json" });
    console.log(`HISTORY_PROBE ${JSON.stringify(report)}`);
  });
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

  test("sincroniza conteúdo e URL ao voltar e avançar entre capítulos", async ({
    page,
  }) => {
    const chapterOnePath = `/obra/${encodeURIComponent(slug)}/capitulo/1`;
    const chapterTwoPath = `/obra/${encodeURIComponent(slug)}/capitulo/2`;
    const chapterOneText =
      "Este capítulo existe somente no ambiente local descartável dos testes E2E.";
    const chapterTwoText =
      "Este é o segundo capítulo público descartável dos testes E2E.";

    await page.goto(chapterOnePath, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Capítulo 1" })).toBeVisible();
    await expect(page.getByText(chapterOneText)).toBeVisible();

    await page.getByRole("button", { name: "Próximo capítulo" }).click();
    await expect(page).toHaveURL(new RegExp(`${chapterTwoPath}$`));
    await expect(page.getByRole("heading", { name: "Capítulo 2" })).toBeVisible();
    await expect(page.getByText(chapterTwoText)).toBeVisible();

    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`${chapterOnePath}$`));
    await expect(page.getByRole("heading", { name: "Capítulo 1" })).toBeVisible();
    await expect(page.getByText(chapterOneText)).toBeVisible();

    await page.goForward();
    await expect(page).toHaveURL(new RegExp(`${chapterTwoPath}$`));
    await expect(page.getByRole("heading", { name: "Capítulo 2" })).toBeVisible();
    await expect(page.getByText(chapterTwoText)).toBeVisible();
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
