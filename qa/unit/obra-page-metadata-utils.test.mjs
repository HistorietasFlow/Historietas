import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL(
    "../../app/obra/[slug]/lib/obra-page-metadata-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const page = readFileSync(
  new URL("../../app/obra/[slug]/page.tsx", import.meta.url),
  "utf8",
);
const i18nUrl = `data:text/javascript;base64,${Buffer.from([
  'export const DEFAULT_HISTORIETAS_LANGUAGE = "pt-BR";',
  'export const normalizeHistorietasLanguage = (value) => value.startsWith("en") ? "en" : value.startsWith("es") ? "es" : "pt-BR";',
].join("\n")).toString("base64")}`;
const javascript = typescript.transpileModule(source, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText.replace(
  'from "../../../../lib/i18n";',
  `from "${i18nUrl}";`,
);
const metadata = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`,
);

test("normaliza slug com trim, decode e rejeições atuais", () => {
  assert.equal(metadata.normalizarSlugParametro("  obra%20nova  "), "obra nova");
  assert.equal(metadata.normalizarSlugParametro(""), "");
  assert.equal(metadata.normalizarSlugParametro(null), "");
  assert.equal(metadata.normalizarSlugParametro("obra/parte"), "");
  assert.equal(metadata.normalizarSlugParametro("obra\\parte"), "");
  assert.equal(metadata.normalizarSlugParametro("obra\u0000nova"), "");
  assert.equal(metadata.normalizarSlugParametro("%E0%A4%A"), "");
  assert.equal(metadata.normalizarSlugParametro("a".repeat(181)), "");
});

test("limita texto, cria canonical e aceita somente URLs de imagem HTTP(S)", () => {
  assert.equal(metadata.limitarTexto("  texto   com espaços  ", 40), "texto com espaços");
  assert.equal(metadata.limitarTexto("abcdef", 5), "abcd…");
  assert.equal(
    metadata.criarHrefCanonicoObra("obra com espaço"),
    "/obra/obra%20com%20espa%C3%A7o",
  );
  assert.equal(metadata.obterUrlImagemSegura("http://example.com/capa.png"), "http://example.com/capa.png");
  assert.equal(metadata.obterUrlImagemSegura("https://example.com/capa.png"), "https://example.com/capa.png");
  assert.equal(metadata.obterUrlImagemSegura("javascript:alert(1)"), "");
  assert.equal(metadata.obterUrlImagemSegura("data:image/png;base64,x"), "");
});

test("resolve idiomas suportados pela primeira preferência e usa fallback", () => {
  assert.equal(metadata.resolverIdiomaMetadata("en-US,pt-BR"), "en");
  assert.equal(metadata.resolverIdiomaMetadata("es-ES;q=0.8,en;q=0.5"), "es");
  assert.equal(metadata.resolverIdiomaMetadata("fr-FR,de-DE"), "pt-BR");
});

test("compõe metadata padrão, não encontrada e pública", () => {
  const padrao = metadata.criarMetadataPadrao({ idioma: "en" });
  assert.equal(padrao.title, "HISTORIETAS");
  assert.equal(padrao.openGraph.type, "website");
  assert.equal(padrao.twitter.card, "summary_large_image");
  assert.equal(padrao.robots, undefined);

  const naoEncontrada = metadata.criarMetadataObraNaoEncontrada("pt-BR");
  assert.equal(naoEncontrada.title, "Obra não encontrada");
  assert.deepEqual(naoEncontrada.robots, { index: false, follow: false });

  const obra = metadata.criarMetadataObraPublica({
    obra: {
      titulo: "  Uma obra  ",
      autor: "  Autora  ",
      sinopse: "  Sinopse   completa  ",
      capa_url: "https://example.com/capa.png",
      slug: "obra-canonica",
    },
    slugSolicitado: "obra-solicitada",
    idioma: "pt-BR",
  });
  assert.equal(obra.title, "Uma obra");
  assert.equal(obra.authors[0].name, "Autora");
  assert.equal(obra.description, "Sinopse completa — por Autora");
  assert.equal(obra.alternates.canonical, "/obra/obra-canonica");
  assert.equal(obra.openGraph.type, "article");
  assert.equal(obra.openGraph.images[0].alt, "Capa de Uma obra");
  assert.deepEqual(obra.twitter.images, ["https://example.com/capa.png"]);
});

test("página preserva a integração Next e delega somente helpers puros", () => {
  [
    'import { headers } from "next/headers";',
    'import { notFound } from "next/navigation";',
    "export async function generateMetadata",
    "await headers()",
    "obterObraMetadataPublica(slug)",
    "return <ObraDinamicaClient />;",
    "normalizarSlugParametro",
    "resolverIdiomaMetadata",
    "criarMetadataPadrao",
    "criarMetadataObraPublica({",
  ].forEach((contract) => assert.ok(page.includes(contract), contract));
  [
    "function normalizarSlugParametro",
    "function limitarTexto",
    "function criarHrefCanonicoObra",
    "function obterUrlImagemSegura",
    "function resolverIdiomaMetadata",
    "function criarMetadataPadrao",
    "TEXTOS_METADATA_OBRA",
  ].forEach((contract) => assert.ok(!page.includes(contract), contract));
  assert.match(page, /obterObraMetadataPublica\(slug\)/g);
});
