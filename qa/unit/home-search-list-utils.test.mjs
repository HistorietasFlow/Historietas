import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const modulo = readFileSync(
  new URL("../../app/lib/home-search-list-utils.ts", import.meta.url),
  "utf8",
);
const pagina = readFileSync(new URL("../../app/page.tsx", import.meta.url), "utf8");
const moduloExecutavel = modulo
  .replace(
    'import { normalizarTexto } from "../../lib/utils";\n',
    `const normalizarTexto = (valor) => String(valor || "")
  .normalize("NFD")
  .replace(/[\\u0300-\\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, " ")
  .trim();
`,
  )
  .replace(
    'import { obraLocalCombinaBusca } from "./home-discovery-utils";\n',
    'const obraLocalCombinaBusca = (obra, termo) => !termo || obra.titulo.toLowerCase().includes(termo);\n',
  )
  .replace(
    'import { formatarGeneroHome } from "./home-metadata-utils";\n',
    'const formatarGeneroHome = (genero) => genero === "Sci-Fi" ? "Ficção" : genero.trim() || "Não informado";\n',
  );
const javascriptModulo = typescript.transpileModule(moduloExecutavel, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const {
  criarObrasCatalogoFiltradasHome,
  criarObrasPublicadasFiltradasHome,
} = await import(
  `data:text/javascript;base64,${Buffer.from(javascriptModulo).toString("base64")}`,
);

function criarObraPublicada(titulo, criadaEm) {
  return {
    titulo,
    criadaEm,
    autor: "Autor",
    genero: "Fantasia",
    formato: "Webnovel",
    classificacaoIndicativa: "Livre",
    sinopse: "Sinopse",
    tags: [],
    capaNome: "capa.jpg",
    capitulos: [],
  };
}

function criarObraCatalogo(titulo, sobrescritas = {}) {
  return {
    titulo,
    autor: "Autor",
    genero: "Fantasia",
    classificacaoIndicativa: "Livre",
    status: "Publicado",
    ...sobrescritas,
  };
}

test("home-search-list-utils filtra e ordena obras publicadas por data descendente", () => {
  const obras = [
    criarObraPublicada("Mais antiga", "2025-01-01"),
    criarObraPublicada("Mais recente", "2026-01-01"),
    criarObraPublicada("Data inválida", "invalida"),
    criarObraPublicada("Fora", "2027-01-01"),
  ];

  assert.deepEqual(
    criarObrasPublicadasFiltradasHome(obras, "mais").map((obra) => obra.titulo),
    ["Mais recente", "Mais antiga"],
  );
  assert.deepEqual(
    criarObrasPublicadasFiltradasHome(obras, "").map((obra) => obra.titulo),
    ["Fora", "Mais recente", "Mais antiga", "Data inválida"],
  );
  assert.deepEqual(
    criarObrasPublicadasFiltradasHome(
      [criarObraPublicada("Primeira inválida", "x"), criarObraPublicada("Segunda inválida", "y")],
      "",
    ).map((obra) => obra.titulo),
    ["Primeira inválida", "Segunda inválida"],
  );
});

test("home-search-list-utils preserva a busca do catálogo e a referência sem termo", () => {
  const obrasCatalogo = [
    criarObraCatalogo("Código Lunar"),
    criarObraCatalogo("Outra", { autor: "Ana Souza" }),
    criarObraCatalogo("Terceira", { genero: "Sci-Fi" }),
    criarObraCatalogo("Quarta", { classificacaoIndicativa: "14 anos" }),
    criarObraCatalogo("Quinta", { status: "Em andamento" }),
    criarObraCatalogo("Sem correspondência"),
  ];

  assert.equal(criarObrasCatalogoFiltradasHome(obrasCatalogo, ""), obrasCatalogo);
  for (const [termo, titulo] of [
    ["codigo lunar", "Código Lunar"],
    ["ana souza", "Outra"],
    ["sci fi", "Terceira"],
    ["ficcao", "Terceira"],
    ["14 anos", "Quarta"],
    ["em andamento", "Quinta"],
  ]) {
    assert.deepEqual(
      criarObrasCatalogoFiltradasHome(obrasCatalogo, termo).map((obra) => obra.titulo),
      [titulo],
    );
  }
  assert.deepEqual(criarObrasCatalogoFiltradasHome(obrasCatalogo, "ausente"), []);
});

test("home-search-list-utils estabelece a fronteira pura das listas de busca", () => {
  assert.match(modulo, /import \{ normalizarTexto \} from "\.\.\/\.\.\/lib\/utils";/);
  assert.match(modulo, /import \{ obraLocalCombinaBusca \} from "\.\/home-discovery-utils";/);
  assert.match(modulo, /import \{ formatarGeneroHome \} from "\.\/home-metadata-utils";/);
  assert.match(modulo, /export function criarObrasPublicadasFiltradasHome/);
  assert.match(modulo, /export function criarObrasCatalogoFiltradasHome/);
  assert.match(modulo, /\.filter\(\(obra\) => obraLocalCombinaBusca\(obra, termoBusca\)\)/);
  assert.match(modulo, /new Date\(obraA\.criadaEm\)\.getTime\(\)/);
  assert.match(modulo, /Number\.isNaN\(dataB\) \? 0 : dataB/);
  assert.match(modulo, /if \(!termoBusca\) \{\s*return obrasCatalogo;/);
  assert.match(modulo, /obra\.titulo,[\s\S]*obra\.autor,[\s\S]*obra\.genero,[\s\S]*formatarGeneroHome\(obra\.genero\),[\s\S]*obra\.classificacaoIndicativa,[\s\S]*obra\.status,/);
  assert.doesNotMatch(modulo, /\.slice\(/);
  assert.doesNotMatch(modulo, /supabase|localStorage|useEffect|useState|useMemo|from "react"/);
  assert.match(pagina, /criarObrasPublicadasFiltradasHome\(obrasPublicadas, termoBusca\)/);
  assert.match(pagina, /const obrasPublicadasFiltradas = useMemo\(\(\) => \{[\s\S]*?\}, \[obrasPublicadas, termoBusca\]\);/);
  assert.match(pagina, /criarObrasCatalogoFiltradasHome\(OBRAS_CATALOGO_HOME, termoBusca\)/);
  assert.match(pagina, /const obrasFiltradas = useMemo\(\(\) => \{[\s\S]*?\}, \[termoBusca\]\);/);
  assert.match(pagina, /const OBRAS_CATALOGO_HOME: Obra\[\] = \[\];/);
});
