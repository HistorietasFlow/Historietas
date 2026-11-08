import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

function ler(caminho) {
  return readFileSync(new URL(caminho, import.meta.url), "utf8");
}

const source = ler(
  "../../app/obra/[slug]/capitulo/[numero]/lib/obra-chapter-canonical-route-utils.ts",
);
const page = ler("../../app/obra/[slug]/capitulo/[numero]/page.tsx");
const proxy = ler("../../proxy.ts");
const metadataUtils = ler(
  "../../app/obra/[slug]/capitulo/[numero]/lib/obra-chapter-metadata-utils.ts",
);
const publicCache = ler("../../lib/cache/obrasPublicas.ts");
const readerPage = ler("../../app/ler-capitulo/page.tsx");
const initialLoad = ler(
  "../../app/ler-capitulo/hooks/use-ler-capitulo-initial-load.ts",
);
const javascript = typescript.transpileModule(source, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const routeUtils = await import(
  "data:text/javascript;base64," + Buffer.from(javascript).toString("base64"),
);

test("decodificarSlugSeguro preserva trim, decode e rejeições de segurança", () => {
  assert.equal(routeUtils.decodificarSlugSeguro("  obra%20nova  "), "obra nova");
  assert.equal(routeUtils.decodificarSlugSeguro(""), "");
  assert.equal(routeUtils.decodificarSlugSeguro("obra/parte"), "");
  assert.equal(routeUtils.decodificarSlugSeguro("obra\\parte"), "");
  assert.equal(routeUtils.decodificarSlugSeguro("obra\u0000nova"), "");
  assert.equal(routeUtils.decodificarSlugSeguro("obra\u007Fnova"), "");
  assert.equal(routeUtils.decodificarSlugSeguro("a".repeat(181)), "");
  assert.equal(routeUtils.decodificarSlugSeguro("%E0%A4%A"), "");
});

test("obterNumeroCapituloSeguro preserva o contrato de inteiros positivos seguros", () => {
  assert.equal(routeUtils.obterNumeroCapituloSeguro("1"), 1);
  assert.equal(routeUtils.obterNumeroCapituloSeguro("  12  "), 12);
  assert.equal(routeUtils.obterNumeroCapituloSeguro("0"), null);
  assert.equal(routeUtils.obterNumeroCapituloSeguro("01"), null);
  assert.equal(routeUtils.obterNumeroCapituloSeguro("-1"), null);
  assert.equal(routeUtils.obterNumeroCapituloSeguro("1.5"), null);
  assert.equal(routeUtils.obterNumeroCapituloSeguro("capitulo"), null);
  assert.equal(routeUtils.obterNumeroCapituloSeguro(""), null);
  assert.equal(
    routeUtils.obterNumeroCapituloSeguro(String(Number.MAX_SAFE_INTEGER + 1)),
    null,
  );
});

test("a página pública renderiza o leitor compartilhado sem redirecionar capítulos válidos", () => {
  [
    'from "./lib/obra-chapter-canonical-route-utils";',
    'decodificarSlugSeguro(slug || "")',
    'obterNumeroCapituloSeguro(numero || "")',
    'import { notFound } from "next/navigation";',
    "await obterLeituraCapituloPublico(",
    "notFound();",
    "<LerCapituloClient",
    "obraId: leitura.obraId",
    "capituloId: leitura.capituloId",
    "obras: [leitura.obra]",
  ].forEach((contract) => assert.ok(page.includes(contract), contract));

  assert.ok(!page.includes("redirect("));
  assert.ok(!page.includes(".catch(() => null)"));
  assert.ok(!page.includes("new URLSearchParams"));
  assert.ok(!page.includes("function decodificarSlugSeguro"));
  assert.ok(!page.includes("function obterNumeroCapituloSeguro"));
});

test("ausência real usa 404 e erro de infraestrutura continua propagando", () => {
  assert.match(
    page,
    /const leitura = await obterLeituraCapituloPublico\([\s\S]*?if \(!leitura\) \{\s*notFound\(\);/,
  );
  assert.doesNotMatch(
    page,
    /obterLeituraCapituloPublico\([\s\S]*?\.catch\(\(\) => null\)/,
  );
  assert.match(
    page,
    /export async function generateMetadata[\s\S]*?if \(!slug \|\| numero === null\) \{\s*notFound\(\);/,
  );
  assert.match(
    page,
    /export async function generateMetadata[\s\S]*?if \(!leitura\) \{\s*notFound\(\);[\s\S]*?return criarMetadataCapituloPublico/,
  );
  assert.match(
    page,
    /try \{\s*leitura = await obterLeituraCapituloPublico\(slug, numero\);\s*\} catch \{\s*return criarMetadataPadrao/,
  );
  [
    "capituloCanonicoPublicoInexistente(pathname)",
    '.from("capitulos")',
    '"id,obras!inner(slug,publicado,classificacao_indicativa)"',
    '.eq("ordem", alvo.numero)',
    '.eq("publicado", true)',
    '.eq("obras.slug", alvo.slug)',
    '.eq("obras.publicado", true)',
    "ACESSO_CONTEUDO_18_TEMPORARIAMENTE_BLOQUEADO",
    'destino.pathname = "/_not-found"',
    "NextResponse.rewrite(destino, { status: 404 })",
  ].forEach((contract) => assert.ok(proxy.includes(contract), contract));

  assert.match(proxy, /if \(error\) \{\s*return false;\s*\}/);
  assert.match(proxy, /catch \{\s*return false;\s*\}/);
  assert.ok(!proxy.includes("service_role"));
  assert.ok(!proxy.includes("NextResponse.redirect(destino"));
});

test("metadata e loader público preservam canonical, capítulo e conteúdo inicial", () => {
  [
    "export async function generateMetadata",
    "criarMetadataCapituloPublico({ leitura, slug })",
  ].forEach((contract) => assert.ok(page.includes(contract), contract));

  [
    "alternates:",
    "canonical: hrefCanonico",
    'type: "article"',
    "authors: [{ name: autor }]",
    "capitulo?.texto.trim()",
    "criarHrefCanonicoCapitulo(slug, leitura.numeroCapitulo)",
  ].forEach((contract) =>
    assert.ok(metadataUtils.includes(contract), contract),
  );

  [
    "export const obterLeituraCapituloPublico = (slug: string, numeroCapitulo: number) => unstable_cache(",
    '.eq("publicado", true)',
    '.select("id,titulo,texto,ordem,publicado,visualizacoes,criado_em")',
    'nomeColecao: "capítulos públicos da leitura canônica"',
    "ACESSO_CONTEUDO_18_TEMPORARIAMENTE_BLOQUEADO",
    "capitulos: capitulosNormalizados",
  ].forEach((contract) => assert.ok(publicCache.includes(contract), contract));

  assert.match(publicCache, /ordem:\s*[\s\S]*?capitulo\.ordem/);
});

test("o leitor interno continua disponível e aceita dados públicos iniciais", () => {
  [
    "export function LerCapituloClient({",
    "dadosIniciais?: DadosIniciaisLerCapitulo",
    "useLerCapituloLoadedDataState(dadosIniciais?.obras)",
    "obraIdInicial: dadosIniciais?.obraId",
    "capituloIdInicial: dadosIniciais?.capituloId",
    "export default function LerCapituloPage()",
    "return <LerCapituloClient />",
  ].forEach((contract) => assert.ok(readerPage.includes(contract), contract));

  [
    "const obraIdParam = possuiDadosIniciais",
    "? obraIdInicial",
    "const capituloIdParam = possuiDadosIniciais",
    "? capituloIdInicial",
    "if (!possuiDadosIniciais)",
    "execucaoCarregamentoEstaAtual()",
  ].forEach((contract) => assert.ok(initialLoad.includes(contract), contract));
});
