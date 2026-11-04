import { test, expect } from "@playwright/test";

const slug = (process.env.E2E_PUBLIC_WORK_SLUG || "").trim();
const chapterNumber = Number(process.env.E2E_PUBLIC_CHAPTER_NUMBER || "1");
const publicChapterNumber =
  Number.isInteger(chapterNumber) && chapterNumber > 0 ? chapterNumber : 1;
const workPath = `/obra/${encodeURIComponent(slug)}`;
const chapterPath = `${workPath}/capitulo/${publicChapterNumber}`;

function extrairJsonLd(html, id) {
  const pattern = new RegExp(
    `<script(?=[^>]*id=["']${id}["'])(?=[^>]*type=["']application/ld\\+json["'])[^>]*>([\\s\\S]*?)<\\/script>`,
  );
  const correspondencia = pattern.exec(html);

  expect(correspondencia, `JSON-LD ${id} ausente do HTML inicial`).not.toBeNull();

  return JSON.parse(correspondencia[1]);
}

test.describe("structured data do conteúdo público", () => {
  test.beforeEach(() => {
    test.skip(!slug, "Prepare a obra pública no Supabase local.");
  });

  test("obra inclui CreativeWork no HTML inicial", async ({ request }) => {
    const response = await request.get(workPath);
    const html = await response.text();
    const dados = extrairJsonLd(html, "obra-structured-data");
    const urlCanonica = `https://www.historietas.com.br${workPath}`;

    expect(response.status()).toBe(200);
    expect(dados["@context"]).toBe("https://schema.org");
    expect(dados["@type"]).toBe("CreativeWork");
    expect(dados["@id"]).toBe(urlCanonica);
    expect(dados.url).toBe(urlCanonica);
    expect(dados.name).toBe("Obra Pública E2E");
    expect(dados.author).toEqual({
      "@type": "Person",
      name: "Autor E2E",
    });
  });

  test("capítulo inclui Chapter canônico apesar de query conflitante", async ({
    request,
  }) => {
    const response = await request.get(
      `${chapterPath}?obraId=outra-obra&capituloId=outro-capitulo`,
    );
    const html = await response.text();
    const dados = extrairJsonLd(html, "capitulo-structured-data");
    const urlCanonica = `https://www.historietas.com.br${chapterPath}`;
    const urlObra = `https://www.historietas.com.br${workPath}`;

    expect(response.status()).toBe(200);
    expect(dados["@type"]).toBe("Chapter");
    expect(dados["@id"]).toBe(urlCanonica);
    expect(dados.url).toBe(urlCanonica);
    expect(dados.name).toBe("Capítulo 1");
    expect(dados.position).toBe(publicChapterNumber);
    expect(dados.isPartOf).toEqual({
      "@type": "CreativeWork",
      "@id": urlObra,
      url: urlObra,
      name: "Obra Pública E2E",
    });
  });

  test("404 não recebe structured data de capítulo", async ({ request }) => {
    const response = await request.get(`${workPath}/capitulo/999999`, {
      maxRedirects: 0,
    });
    const html = await response.text();

    expect(response.status()).toBe(404);
    expect(html).not.toContain('id="capitulo-structured-data"');
    expect(html).not.toContain('"@type":"Chapter"');
  });
});
