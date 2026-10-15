import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const modulo = readFileSync(
  new URL("../../app/lib/home-user-library-list-utils.ts", import.meta.url),
  "utf8",
);
const pagina = readFileSync(new URL("../../app/page.tsx", import.meta.url), "utf8");
const moduloExecutavel = modulo
  .replace(
    `import {
  obraCatalogoCombinaBuscaHome,
  obraLocalCombinaBusca,
} from "./home-discovery-utils";\n`,
    `const obraLocalCombinaBusca = (obra, termoBusca) =>
  !termoBusca || obra.titulo.toLowerCase().includes(termoBusca);
const obraCatalogoCombinaBuscaHome = obraLocalCombinaBusca;
`,
  )
  .replace(
    `import {
  obraCatalogoEstaNaMinhaLista,
  obraLocalEstaNaMinhaLista,
} from "./home-collection-utils";\n`,
    `const obraLocalEstaNaMinhaLista = (obra, favoritas) => favoritas.includes(obra.id);
const obraCatalogoEstaNaMinhaLista = (obra, favoritas) => favoritas.includes(obra.id);
`,
  )
  .replace(
    `import {
  encontrarCapituloParaContinuar,
  obterTempoUltimaLeitura,
} from "./home-reading-utils";\n`,
    `const encontrarCapituloParaContinuar = (obra) => obra.continuar ? { id: "proximo" } : null;
const obterTempoUltimaLeitura = (obra) => obra.tempoLeitura;
`,
  );
const javascriptModulo = typescript.transpileModule(moduloExecutavel, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const {
  criarObrasCatalogoMinhaListaHome,
  criarObrasMinhaListaHome,
  criarObrasParaContinuarHome,
} = await import(
  `data:text/javascript;base64,${Buffer.from(javascriptModulo).toString("base64")}`,
);

function criarObraLocal(titulo, sobrescritas = {}) {
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
    slug: titulo.toLowerCase(),
    continuar: false,
    tempoLeitura: 0,
    ...sobrescritas,
  };
}

function criarObraCatalogo(titulo, sobrescritas = {}) {
  return {
    id: titulo.toLowerCase(),
    titulo,
    autor: "Autor",
    genero: "Fantasia",
    classificacaoIndicativa: "Livre",
    status: "Publicado",
    slug: titulo.toLowerCase(),
    ...sobrescritas,
  };
}

test("home-user-library-list-utils retorna listas vazias sem usuário", () => {
  const obrasLocais = [criarObraLocal("Local", { continuar: true })];
  const obrasCatalogo = [criarObraCatalogo("Catálogo")];

  assert.deepEqual(criarObrasParaContinuarHome(obrasLocais, "", null), []);
  assert.deepEqual(criarObrasMinhaListaHome(obrasLocais, ["local"], "", null), []);
  assert.deepEqual(criarObrasCatalogoMinhaListaHome(obrasCatalogo, ["catálogo"], "", null), []);
});

test("home-user-library-list-utils exige continuação, respeita busca, ordena e limita", () => {
  const obras = [
    criarObraLocal("Não lida", { continuar: false, tempoLeitura: 100 }),
    ...Array.from({ length: 6 }, (_, indice) =>
      criarObraLocal(`Busca ${indice}`, {
        continuar: true,
        tempoLeitura: indice,
      }),
    ),
    criarObraLocal("Fora", { continuar: true, tempoLeitura: 99 }),
  ];

  assert.deepEqual(
    criarObrasParaContinuarHome(obras, "busca", { id: "usuario" }).map((obra) => obra.titulo),
    ["Busca 5", "Busca 4", "Busca 3", "Busca 2", "Busca 1"],
  );
});

test("home-user-library-list-utils preserva favoritos, datas inválidas e o limite local", () => {
  const obras = [
    criarObraLocal("Criada", {
      id: "criada",
      criadaEm: "2025-03-01T00:00:00.000Z",
      ultimaLeituraEm: "",
    }),
    criarObraLocal("Lida", {
      id: "lida",
      criadaEm: "2025-01-01T00:00:00.000Z",
      ultimaLeituraEm: "2025-04-01T00:00:00.000Z",
    }),
    criarObraLocal("Inválida", {
      id: "invalida",
      criadaEm: "invalida",
      ultimaLeituraEm: "invalida",
    }),
    criarObraLocal("Ignorada", { id: "ignorada" }),
    ...Array.from({ length: 11 }, (_, indice) =>
      criarObraLocal(`Favorita ${indice}`, {
        id: `favorita-${indice}`,
        criadaEm: `2025-01-${String(indice + 1).padStart(2, "0")}T00:00:00.000Z`,
      }),
    ),
  ];
  const favoritas = obras
    .filter((obra) => obra.id !== "ignorada")
    .map((obra) => obra.id);
  const ordenadas = criarObrasMinhaListaHome(
    obras.slice(0, 3),
    favoritas,
    "",
    { id: "usuario" },
  );
  const resultado = criarObrasMinhaListaHome(obras, favoritas, "", { id: "usuario" });

  assert.deepEqual(
    ordenadas.map((obra) => obra.titulo),
    ["Lida", "Criada", "Inválida"],
  );
  assert.equal(resultado.length, 12);
  assert.equal(resultado[0].titulo, "Lida");
  assert.equal(resultado.some((obra) => obra.id === "ignorada"), false);
});

test("home-user-library-list-utils preserva filtro, ordem e ausência de sort do catálogo", () => {
  const catalogo = [
    criarObraCatalogo("Primeira", { id: "primeira" }),
    criarObraCatalogo("Busca", { id: "busca" }),
    criarObraCatalogo("Terceira", { id: "terceira" }),
    ...Array.from({ length: 12 }, (_, indice) =>
      criarObraCatalogo(`Busca ${indice}`, { id: `busca-${indice}` }),
    ),
  ];
  const resultado = criarObrasCatalogoMinhaListaHome(
    catalogo,
    catalogo
      .filter((obra) => obra.id !== "busca-11")
      .map((obra) => obra.id),
    "busca",
    { id: "usuario" },
  );

  assert.equal(resultado.length, 12);
  assert.deepEqual(
    resultado.map((obra) => obra.titulo),
    ["Busca", ...Array.from({ length: 11 }, (_, indice) => `Busca ${indice}`)],
  );
});

test("home-user-library-list-utils estabelece a fronteira pura das listas pessoais", () => {
  for (const nomeFuncao of [
    "criarObrasParaContinuarHome",
    "criarObrasMinhaListaHome",
    "criarObrasCatalogoMinhaListaHome",
  ]) {
    assert.match(modulo, new RegExp(`export function ${nomeFuncao}\\b`));
  }
  assert.match(modulo, /\.slice\(0, 5\)/);
  assert.match(modulo, /obraA\.ultimaLeituraEm \|\| obraA\.criadaEm/);
  assert.match(modulo, /Number\.isNaN\(dataB\) \? 0 : dataB/);
  assert.doesNotMatch(modulo, /supabase|localStorage|useEffect|useState|useMemo|from "react"/);
  assert.doesNotMatch(
    modulo.match(/export function criarObrasCatalogoMinhaListaHome[\s\S]*/)?.[0] || "",
    /\.sort\(/,
  );
  assert.match(pagina, /from "\.\/lib\/home-user-library-list-utils";/);
  assert.match(
    pagina,
    /const obrasParaContinuar = useMemo\(\(\) => \{[\s\S]*?criarObrasParaContinuarHome\([\s\S]*?\}, \[obrasPublicadas, termoBusca, usuarioLogado\]\);/,
  );
  assert.match(
    pagina,
    /const obrasMinhaLista = useMemo\(\(\) => \{[\s\S]*?criarObrasMinhaListaHome\([\s\S]*?\}, \[obrasPublicadas, obrasFavoritas, termoBusca, usuarioLogado\]\);/,
  );
  assert.match(
    pagina,
    /const obrasCatalogoMinhaLista = useMemo\(\(\) => \{[\s\S]*?criarObrasCatalogoMinhaListaHome\([\s\S]*?\}, \[obrasFavoritas, termoBusca, usuarioLogado\]\);/,
  );
});
