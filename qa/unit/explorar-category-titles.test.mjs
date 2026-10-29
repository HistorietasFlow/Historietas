import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const modulePath = new URL(
  "../../app/explorar/lib/explorar-category-titles.ts",
  import.meta.url,
);
const pagePath = new URL(
  "../../app/explorar/page.tsx",
  import.meta.url,
);

const titulosObras = {
  acao: "Ação do começo ao fim",
  aventura: "Aventuras sem limites",
  comedia: "Para rir agora",
  drama: "Histórias que deixam marcas",
  fantasia: "Mundos além da imaginação",
  ficcao: "Além do que é possível",
  misterio: "Mistérios para desvendar",
  romance: "Amores que deixam marcas",
  suspense: "Tensão até a última página",
  terror: "Histórias para perder o sono",
  sobrenatural: "Entre este mundo e o outro",
  historico: "Viagens por outros tempos",
  biografia: "Vidas que merecem ser contadas",
  outros: "Descobertas fora do comum",
};

const titulosAutores = {
  acao: "Autores que aceleram o coração",
  aventura: "Autores de grandes jornadas",
  comedia: "Autores para arrancar risadas",
  drama: "Autores que tocam fundo",
  fantasia: "Criadores de mundos impossíveis",
  ficcao: "Autores que enxergam além",
  misterio: "Mestres dos enigmas",
  romance: "Autores que escrevem sentimentos",
  suspense: "Mestres da tensão",
  terror: "Autores que dominam o medo",
  sobrenatural: "Vozes do desconhecido",
  historico: "Autores que revivem o passado",
  biografia: "Autores de vidas reais",
  outros: "Novas vozes para descobrir",
};

function normalizarTexto(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

async function carregarResolvers() {
  const source = (await readFile(modulePath, "utf8"))
    .replace(/\r\n/g, "\n")
    .replace(
      'import { normalizarTexto } from "../../../lib/utils";\n\n',
      "",
    )
    .replace(/: Record<string, string>/g, "")
    .replace(/genero: string/g, "genero")
    .replace(
      "export function obterTituloCriativoObrasExplorar",
      "function obterTituloCriativoObrasExplorar",
    )
    .replace(
      "export function obterTituloCriativoAutoresExplorar",
      "function obterTituloCriativoAutoresExplorar",
    );

  return new Function(
    "normalizarTexto",
    `${source}\nreturn { obterTituloCriativoObrasExplorar, obterTituloCriativoAutoresExplorar };`,
  )(normalizarTexto);
}

test("títulos criativos de obras preservam textos e normalização", async () => {
  const { obterTituloCriativoObrasExplorar } = await carregarResolvers();

  for (const [genero, titulo] of Object.entries(titulosObras)) {
    assert.equal(obterTituloCriativoObrasExplorar(genero), titulo);
  }

  assert.equal(
    obterTituloCriativoObrasExplorar("  AÇÃO  "),
    titulosObras.acao,
  );
  assert.equal(
    obterTituloCriativoObrasExplorar("Ficção"),
    titulosObras.ficcao,
  );
  assert.equal(
    obterTituloCriativoObrasExplorar("desconhecido"),
    "Histórias para descobrir",
  );
});

test("títulos criativos de autores preservam textos e normalização", async () => {
  const { obterTituloCriativoAutoresExplorar } = await carregarResolvers();

  for (const [genero, titulo] of Object.entries(titulosAutores)) {
    assert.equal(obterTituloCriativoAutoresExplorar(genero), titulo);
  }

  assert.equal(
    obterTituloCriativoAutoresExplorar("  AÇÃO  "),
    titulosAutores.acao,
  );
  assert.equal(
    obterTituloCriativoAutoresExplorar("Ficção"),
    titulosAutores.ficcao,
  );
  assert.equal(
    obterTituloCriativoAutoresExplorar("desconhecido"),
    "Autores para descobrir",
  );
});

test("a página delega somente os títulos criativos por gênero", async () => {
  const [moduleSource, page] = await Promise.all([
    readFile(modulePath, "utf8"),
    readFile(pagePath, "utf8"),
  ]);

  assert.match(
    moduleSource,
    /import \{ normalizarTexto \} from "\.\.\/\.\.\/\.\.\/lib\/utils";/,
  );
  assert.match(
    moduleSource,
    /export function obterTituloCriativoObrasExplorar/,
  );
  assert.match(
    moduleSource,
    /export function obterTituloCriativoAutoresExplorar/,
  );
  assert.doesNotMatch(
    moduleSource,
    /export (const|\{) TITULOS_CRIATIVOS_(OBRAS|AUTORES)_EXPLORAR/,
  );

  for (const [genero, titulo] of [
    ...Object.entries(titulosObras),
    ...Object.entries(titulosAutores),
  ]) {
    assert.match(moduleSource, new RegExp(`${genero}: "${titulo}"`));
  }

  assert.match(
    page,
    /import \{\s*obterTituloCriativoAutoresExplorar,\s*obterTituloCriativoObrasExplorar,\s*\} from "\.\/lib\/explorar-category-titles";/,
  );
  assert.doesNotMatch(page, /const TITULOS_CRIATIVOS_OBRAS_EXPLORAR/);
  assert.doesNotMatch(page, /const TITULOS_CRIATIVOS_AUTORES_EXPLORAR/);
  assert.doesNotMatch(page, /function obterTituloCriativoObrasExplorar/);
  assert.doesNotMatch(page, /function obterTituloCriativoAutoresExplorar/);
  assert.match(
    page,
    /title=\{obterTituloCriativoObrasExplorar\(secao\.genero\)\}/,
  );
  assert.match(
    page,
    /titulo: obterTituloCriativoObrasExplorar\(secao\.genero\)/,
  );
  assert.match(
    page,
    /title=\{obterTituloCriativoAutoresExplorar\(secao\.genero\)\}/,
  );
  assert.match(
    page,
    /titulo: obterTituloCriativoAutoresExplorar\(secao\.genero\)/,
  );
  assert.match(page, /import \{ normalizarTexto \} from "\.\.\/\.\.\/lib\/utils";/);
  assert.match(page, /const categorias = \[/);
  assert.match(page, /normalizarTexto\(busca\)/);
});
