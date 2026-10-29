import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const modulePath = path.join(
  root,
  "app/explorar/lib/explorar-list-route-utils.ts",
);
const pagePath = path.join(root, "app/explorar/page.tsx");

function normalizarTexto(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

async function carregarCriarHrefListaExplorar() {
  const source = await readFile(modulePath, "utf8");
  const executable = source
    .replace(
      'import { normalizarTexto } from "../../../lib/utils";\n',
      "",
    )
    .replace(
      'import type { ModoConteudoExplorar } from "../components/explorar-section-components";\n\n',
      "",
    )
    .replace("export function criarHrefListaExplorar", "function criarHrefListaExplorar")
    .replace(
      /\}: \{\n  titulo: string;\n  modo: ModoConteudoExplorar;\n  genero\?: string;\n\}\)/,
      "})",
    );

  return new Function(
    "normalizarTexto",
    `${executable}\nreturn criarHrefListaExplorar;`,
  )(normalizarTexto);
}

function parametrosDaUrl(href) {
  assert.ok(href.startsWith("/listas?"));
  return new URL(href, "https://historietas.local").searchParams;
}

test("o helper de rotas preserva contratos estruturais e deixa a página como chamadora", async () => {
  const [source, page] = await Promise.all([
    readFile(modulePath, "utf8"),
    readFile(pagePath, "utf8"),
  ]);

  assert.match(source, /import \{ normalizarTexto \} from "\.\.\/\.\.\/\.\.\/lib\/utils";/);
  assert.match(
    source,
    /import type \{ ModoConteudoExplorar \} from "\.\.\/components\/explorar-section-components";/,
  );
  assert.match(source, /export function criarHrefListaExplorar/);
  assert.match(page, /import \{ criarHrefListaExplorar \} from "\.\/lib\/explorar-list-route-utils";/);
  assert.doesNotMatch(page, /function criarHrefListaExplorar/);
  assert.match(page, /criarHrefListaExplorar\(\{/);
  assert.match(page, /normalizarTexto\(busca\)/);
  assert.match(source, /const tituloLimpo = titulo\.trim\(\);/);
  assert.match(source, /const generoLimpo = genero\.trim\(\);/);
  assert.match(source, /const tituloNormalizado = normalizarTexto\(tituloLimpo\);/);
  assert.match(source, /parametros\.set\("modo", modo\);/);
});

test("constrói as seções especiais e fallbacks de obras com os parâmetros preservados", async () => {
  const criarHrefListaExplorar = await carregarCriarHrefListaExplorar();
  const casos = [
    ["Recomendações para você", "recomendacoes", "popularidade"],
    ["Publicações recentes", "recentes", "recentes"],
    ["Novos capítulos", "novos-capitulos", "recentes"],
    ["Mais curtidas", "mais-curtidas", "popularidade"],
    ["Mais comentadas", "mais-comentadas", "popularidade"],
    ["Para ler agora", "para-ler-agora", "recentes"],
    ["Desconhecida", "catalogo", "recentes"],
  ];

  for (const [titulo, secao, ordem] of casos) {
    const href = criarHrefListaExplorar({ titulo, modo: "obras" });
    const parametros = parametrosDaUrl(href);

    assert.equal(parametros.get("modo"), "obras");
    assert.equal(parametros.get("titulo"), titulo);
    assert.equal(parametros.get("secao"), secao);
    assert.equal(parametros.get("ordem"), ordem);
  }

  const comGenero = parametrosDaUrl(
    criarHrefListaExplorar({
      titulo: "Publicações recentes",
      modo: "obras",
      genero: " Fantasia ",
    }),
  );
  assert.equal(comGenero.get("genero"), "Fantasia");

  const semCampos = parametrosDaUrl(
    criarHrefListaExplorar({ titulo: "", modo: "obras", genero: "" }),
  );
  assert.equal(semCampos.has("titulo"), false);
  assert.equal(semCampos.has("genero"), false);
  assert.equal(semCampos.get("secao"), "catalogo");
  assert.equal(semCampos.get("ordem"), "recentes");
});

test("constrói as seções e fallbacks de autores com a ordenação preservada", async () => {
  const criarHrefListaExplorar = await carregarCriarHrefListaExplorar();
  const casos = [
    ["Mais bem avaliados", "avaliacao"],
    ["Autores em destaque", "popularidade"],
    ["Autores desconhecidos", "recentes"],
  ];

  for (const [titulo, ordem] of casos) {
    const parametros = parametrosDaUrl(
      criarHrefListaExplorar({ titulo, modo: "autores" }),
    );

    assert.equal(parametros.get("modo"), "autores");
    assert.equal(parametros.get("titulo"), titulo);
    assert.equal(parametros.get("secao"), "autores");
    assert.equal(parametros.get("ordem"), ordem);
  }
});
