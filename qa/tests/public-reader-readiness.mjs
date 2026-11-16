import { expect } from "@playwright/test";

export const activeReader = (page) =>
  page.locator('main[data-historietas-ler-capitulo-root="true"]:visible');

export function publicChapterResponse(page, number, { slug, workId, chapterId }) {
  // Registrar antes da ação e acompanhar a resposta desta Request, nunca uma
  // resposta atrasada de outra navegação (mesmo se o capítulo for o mesmo).
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
    if (chapterId) expect(snapshot.capituloId).toBe(chapterId);
    return snapshot;
  });
}

export async function expectActiveChapter(page, path, title, text) {
  await expect(page).toHaveURL(path);
  const reader = activeReader(page);
  await expect(reader).toHaveCount(1);
  await expect(reader).not.toHaveAttribute("aria-busy", "true");
  await expect(page.locator("main:visible")).toHaveCount(1);
  await expect(reader.getByRole("heading", { name: title, exact: true })).toBeVisible();
  await expect(reader.getByText(text, { exact: true })).toBeVisible();
}
