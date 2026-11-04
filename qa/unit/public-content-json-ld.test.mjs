import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

function ler(caminho) {
  return readFileSync(new URL(caminho, import.meta.url), "utf8");
}

const source = ler("../../lib/seo/public-content-json-ld.ts").replace(
  'import { SITE_URL } from "../seo";',
  'const SITE_URL = "https://www.historietas.com.br";',
);
const javascript = typescript.transpileModule(source, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const jsonLd = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`
);

test("representa a obra pública como CreativeWork com URLs absolutas", () => {
  const dados = jsonLd.criarJsonLdObraPublica({
    hrefCanonico: "/obra/obra-publica",
    nome: "  Obra pública  ",
    descricao: "  Uma   sinopse real.  ",
    autor: "  Autora Pública  ",
    imagem: "/capas/obra.png",
  });

  assert.deepEqual(dados, {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "@id": "https://www.historietas.com.br/obra/obra-publica",
    url: "https://www.historietas.com.br/obra/obra-publica",
    name: "Obra pública",
    description: "Uma sinopse real.",
    author: {
      "@type": "Person",
      name: "Autora Pública",
    },
    image: "https://www.historietas.com.br/capas/obra.png",
  });
});

test("representa o capítulo pela ordem canônica e vincula a obra pública", () => {
  const dados = jsonLd.criarJsonLdCapituloPublico({
    hrefCanonico: "/obra/obra-publica/capitulo/7",
    nome: "Capítulo Sete",
    descricao: "Texto público do capítulo.",
    autor: "Autora Pública",
    imagem: "https://cdn.example.com/capa.png",
    posicao: 7,
    obra: {
      hrefCanonico: "/obra/obra-publica",
      nome: "Obra pública",
    },
  });

  assert.equal(dados["@type"], "Chapter");
  assert.equal(dados.position, 7);
  assert.equal(
    dados.url,
    "https://www.historietas.com.br/obra/obra-publica/capitulo/7",
  );
  assert.equal(dados["@id"], dados.url);
  assert.deepEqual(dados.isPartOf, {
    "@type": "CreativeWork",
    "@id": "https://www.historietas.com.br/obra/obra-publica",
    url: "https://www.historietas.com.br/obra/obra-publica",
    name: "Obra pública",
  });
});

test("omite dados opcionais ausentes e não inventa autor ou imagem", () => {
  const dados = jsonLd.criarJsonLdObraPublica({
    hrefCanonico: "/obra/sem-opcionais",
    nome: "Sem opcionais",
    descricao: " ",
    autor: null,
    imagem: "javascript:alert(1)",
  });

  assert.ok(!("description" in dados));
  assert.ok(!("author" in dados));
  assert.ok(!("image" in dados));
});

test("limita a descrição e não inclui o texto completo do capítulo", () => {
  const textoCompleto = "x".repeat(300);
  const dados = jsonLd.criarJsonLdCapituloPublico({
    hrefCanonico: "/obra/obra-publica/capitulo/9",
    nome: "Capítulo Nove",
    descricao: textoCompleto,
    posicao: 9,
    obra: {
      hrefCanonico: "/obra/obra-publica",
      nome: "Obra pública",
    },
  });

  assert.equal(dados.description.length, 160);
  assert.ok(dados.description.endsWith("…"));
  assert.notEqual(dados.description, textoCompleto);
});

test("serialização neutraliza fechamento de script e continua sendo JSON válido", () => {
  const ataque = "</script><script>alert(1)</script>&\u2028\u2029";
  const serializado = jsonLd.serializarJsonLdSeguro({ name: ataque });

  assert.ok(!serializado.includes("</script>"));
  assert.ok(!serializado.includes("<script>"));
  assert.ok(serializado.includes("\\u003c/script\\u003e"));
  assert.ok(serializado.includes("\\u0026"));
  assert.ok(serializado.includes("\\u2028"));
  assert.ok(serializado.includes("\\u2029"));
  assert.deepEqual(JSON.parse(serializado), { name: ataque });
});

test("as rotas públicas aplicam o serializador no HTML server-rendered", () => {
  const obraPage = ler("../../app/obra/[slug]/page.tsx");
  const capituloPage = ler(
    "../../app/obra/[slug]/capitulo/[numero]/page.tsx",
  );

  [
    [obraPage, "obra-structured-data", "criarJsonLdObraPublica"],
    [capituloPage, "capitulo-structured-data", "criarJsonLdCapituloPublico"],
  ].forEach(([page, id, builder]) => {
    assert.ok(page.includes(`id="${id}"`));
    assert.ok(page.includes('type="application/ld+json"'));
    assert.ok(page.includes(builder));
    assert.ok(page.includes("serializarJsonLdSeguro(dadosEstruturados)"));
    assert.ok(!page.includes("JSON.stringify(dadosEstruturados)"));
  });

  assert.ok(
    capituloPage.indexOf("notFound();") <
      capituloPage.indexOf("capitulo-structured-data"),
  );
});
