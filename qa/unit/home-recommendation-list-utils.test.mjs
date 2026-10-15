import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const modulo = readFileSync(
  new URL("../../app/lib/home-recommendation-list-utils.ts", import.meta.url),
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
  .trim();
`,
  )
  .replace(
    `import {
  obraCatalogoCombinaBuscaHome,
  obraCatalogoCombinaComTemasRecomendados,
  obraCombinaComTemasRecomendados,
  obraLocalCombinaBusca,
  obterTemasRecomendacaoObra,
  obterTemasRecomendacaoObraCatalogo,
} from "./home-discovery-utils";\n`,
    `const obterTemasRecomendacaoObra = (obra) => obra.temas;
const obterTemasRecomendacaoObraCatalogo = (obra) => obra.temas;
const obraCombinaComTemasRecomendados = (obra, temas) => obra.temas.some((tema) => temas.has(tema));
const obraCatalogoCombinaComTemasRecomendados = obraCombinaComTemasRecomendados;
const obraLocalCombinaBusca = (obra, termoBusca) => !termoBusca || obra.titulo.toLowerCase().includes(termoBusca);
const obraCatalogoCombinaBuscaHome = obraLocalCombinaBusca;
`,
  )
  .replace(
    'import { obterTempoUltimoCapitulo } from "./home-reading-utils";\n',
    "const obterTempoUltimoCapitulo = (obra) => obra.tempoUltimoCapitulo;\n",
  );
const javascriptModulo = typescript.transpileModule(moduloExecutavel, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const {
  criarObrasCatalogoRecomendadasHome,
  criarObrasRecomendadasHome,
  criarTemasRecomendadosUsuarioHome,
} = await import(
  `data:text/javascript;base64,${Buffer.from(javascriptModulo).toString("base64")}`,
);

function criarObraLocal(titulo, temas, sobrescritas = {}) {
  return {
    id: titulo.toLowerCase(),
    titulo,
    autor: "Autor",
    genero: "Fantasia",
    formato: "Webnovel",
    classificacaoIndicativa: "Livre",
    sinopse: "Sinopse",
    tags: [],
    capaNome: "capa.jpg",
    capitulos: [],
    criadaEm: "2025-01-01T00:00:00.000Z",
    ultimoCapituloLidoId: "",
    ultimaLeituraEm: "",
    temas,
    tempoUltimoCapitulo: 0,
    ...sobrescritas,
  };
}

function criarObraCatalogo(titulo, temas, sobrescritas = {}) {
  return {
    titulo,
    autor: "Autor",
    genero: "Fantasia",
    classificacaoIndicativa: "Livre",
    status: "Publicado",
    temas,
    ...sobrescritas,
  };
}

test("home-recommendation-list-utils une temas locais e do catálogo sem duplicatas", () => {
  const temas = criarTemasRecomendadosUsuarioHome(
    [criarObraLocal("Continuar", ["fantasia", "aventura"])],
    [criarObraLocal("Lista", ["aventura", "drama"])],
    [criarObraCatalogo("Catálogo", ["drama", "sci-fi"])],
  );

  assert.deepEqual([...temas], ["fantasia", "aventura", "drama", "sci-fi"]);
});

test("home-recommendation-list-utils exclui priorizadas, respeita busca, afinidade, desempate e limite", () => {
  const priorizada = criarObraLocal("Priorizada", ["fantasia"], { id: "priorizada" });
  const obras = [
    priorizada,
    criarObraLocal("Busca Menos Antiga", ["fantasia"], { tempoUltimoCapitulo: 10 }),
    criarObraLocal("Busca Mais Antiga", ["fantasia"], { tempoUltimoCapitulo: 20 }),
    criarObraLocal("Busca Afinidade", ["fantasia", "aventura"], { tempoUltimoCapitulo: 1 }),
    criarObraLocal("Fora", ["fantasia", "aventura"], { tempoUltimoCapitulo: 100 }),
    ...Array.from({ length: 10 }, (_, indice) =>
      criarObraLocal(`Busca Extra ${indice}`, ["fantasia"], {
        tempoUltimoCapitulo: indice,
      }),
    ),
  ];
  const resultado = criarObrasRecomendadasHome(
    obras,
    [priorizada],
    [],
    new Set(["fantasia", "aventura"]),
    "busca",
  );

  assert.equal(resultado.length, 12);
  assert.deepEqual(
    resultado.slice(0, 3).map((obra) => obra.titulo),
    ["Busca Afinidade", "Busca Mais Antiga", "Busca Menos Antiga"],
  );
  assert.equal(resultado.some((obra) => obra.id === "priorizada"), false);
  assert.equal(resultado.some((obra) => obra.titulo === "Fora"), false);
});

test("home-recommendation-list-utils usa o catálogo temático, exclui Minha Lista e preserva ordem", () => {
  const catalogo = [
    criarObraCatalogo("Na Minha Lista", ["fantasia"]),
    criarObraCatalogo("Primeira Temática", ["fantasia"]),
    criarObraCatalogo("Segunda Temática", ["fantasia"]),
    criarObraCatalogo("Sem Tema", ["terror"]),
  ];
  const resultado = criarObrasCatalogoRecomendadasHome(
    catalogo,
    [catalogo[0]],
    new Set(["fantasia"]),
    "",
  );

  assert.deepEqual(
    resultado.map((obra) => obra.titulo),
    ["Primeira Temática", "Segunda Temática"],
  );
});

test("home-recommendation-list-utils usa fallback do catálogo e limita a doze", () => {
  const catalogo = [
    criarObraCatalogo("Salva", ["fantasia"]),
    ...Array.from({ length: 13 }, (_, indice) =>
      criarObraCatalogo(`Busca ${indice}`, ["terror"]),
    ),
  ];
  const resultado = criarObrasCatalogoRecomendadasHome(
    catalogo,
    [catalogo[0]],
    new Set(["fantasia"]),
    "busca",
  );

  assert.equal(resultado.length, 12);
  assert.deepEqual(
    resultado.map((obra) => obra.titulo),
    Array.from({ length: 12 }, (_, indice) => `Busca ${indice}`),
  );
});

test("home-recommendation-list-utils estabelece a fronteira pura das recomendações", () => {
  for (const nomeFuncao of [
    "criarTemasRecomendadosUsuarioHome",
    "criarObrasRecomendadasHome",
    "criarObrasCatalogoRecomendadasHome",
  ]) {
    assert.match(modulo, new RegExp(`export function ${nomeFuncao}\\b`));
  }
  assert.match(modulo, /const temas = new Set<string>\(\);/);
  assert.match(modulo, /const obrasJaPriorizadas = new Set\(/);
  assert.match(modulo, /afinidadeB - afinidadeA \|\|/);
  assert.match(modulo, /recomendadasPorTema\.length > 0/);
  assert.equal((modulo.match(/\.slice\(0, 12\)/g) || []).length, 2);
  assert.doesNotMatch(modulo, /supabase|localStorage|useEffect|useState|useMemo|from "react"/);
  assert.match(pagina, /from "\.\/lib\/home-recommendation-list-utils";/);
  assert.match(
    pagina,
    /const temasRecomendadosUsuario = useMemo\(\(\) => \{[\s\S]*?criarTemasRecomendadosUsuarioHome\([\s\S]*?\}, \[obrasCatalogoMinhaLista, obrasMinhaLista, obrasParaContinuar\]\);/,
  );
  assert.match(
    pagina,
    /const obrasRecomendadas = useMemo\(\(\) => \{[\s\S]*?criarObrasRecomendadasHome\([\s\S]*?\}, \[[\s\S]*?obrasMinhaLista,[\s\S]*?obrasParaContinuar,[\s\S]*?obrasPublicadas,[\s\S]*?temasRecomendadosUsuario,[\s\S]*?termoBusca,[\s\S]*?\]\);/,
  );
  assert.match(
    pagina,
    /const obrasCatalogoRecomendadas = useMemo\(\(\) => \{[\s\S]*?criarObrasCatalogoRecomendadasHome\([\s\S]*?\}, \[obrasCatalogoMinhaLista, temasRecomendadosUsuario, termoBusca\]\);/,
  );
});
