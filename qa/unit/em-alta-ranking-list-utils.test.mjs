import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const modulo = readFileSync(
  new URL(
    "../../app/em-alta/lib/em-alta-ranking-list-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/em-alta/page.tsx", import.meta.url),
  "utf8",
);
const moduloExecutavel = modulo.replace(
  'import { criarSlugBase, normalizarTexto } from "../../../lib/utils";',
  `const normalizarTexto = (texto) => texto
    .normalize("NFD")
    .replace(/[\\u0300-\\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\\s+/g, " ");
  const criarSlugBase = (titulo) => {
    const slug = normalizarTexto(titulo)
      .replace(/[^a-z0-9\\s-]/g, "")
      .replace(/\\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");
    return slug || "obra";
  };`,
);
const javascriptModulo = typescript.transpileModule(moduloExecutavel, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const {
  adicionarRankingObraNaLista,
  listaTemRankingObra,
  normalizarListaIdsEmAlta,
  obterIdentificadoresRankingObra,
  ordenarRanking,
  pegarTopRanking,
  rankingTemInteracaoReal,
  removerRankingObraDaLista,
} = await import(
  `data:text/javascript;base64,${Buffer.from(javascriptModulo).toString("base64")}`,
);

function criarObraRanking(sobrescritas = {}) {
  return {
    storageId: "obra-aurora",
    titulo: "Aurora do Sol",
    href: "/obra/aurora-do-sol",
    pontuacao: 0,
    views: 0,
    curtidas: 0,
    comentarios: 0,
    salvos: 0,
    avaliacoes: 0,
    mediaAvaliacao: 0,
    criadaEmTimestamp: 0,
    capitulos: 0,
    ...sobrescritas,
  };
}

test("normaliza IDs de lista sem aceitar valores inválidos", () => {
  assert.deepEqual(
    normalizarListaIdsEmAlta([" aurora ", 1, "", "aurora", null, "sol"]),
    ["aurora", "sol"],
  );
  assert.deepEqual(normalizarListaIdsEmAlta({}), []);
});

test("identifica uma obra pelos aliases preservando a ordem", () => {
  const obra = criarObraRanking({
    storageId: " obra-aurora ",
    titulo: "Aurora do Sol",
    href: "/obra/Aurora%20do%20Sol?origem=ranking#topo",
  });

  assert.deepEqual(obterIdentificadoresRankingObra(obra), [
    "obra-aurora",
    "Aurora do Sol",
    "aurora-do-sol",
    "aurora do sol",
  ]);
  assert.equal(listaTemRankingObra(obra, ["aurora-do-sol"]), true);
  assert.equal(listaTemRankingObra(obra, ["outra-obra"]), false);
});

test("remove e adiciona aliases sem duplicar a obra", () => {
  const obra = criarObraRanking();

  assert.deepEqual(
    removerRankingObraDaLista(obra, [
      "outra-obra",
      "obra-aurora",
      "aurora-do-sol",
      "aurora do sol",
      "outra-obra",
    ]),
    ["outra-obra"],
  );
  assert.deepEqual(
    adicionarRankingObraNaLista(obra, ["outra-obra", "aurora-do-sol"]),
    ["outra-obra", "obra-aurora"],
  );
});

test("ordena cada ranking sem alterar a lista original", () => {
  const criterios = [
    ["geral", "pontuacao"],
    ["lidas", "views"],
    ["curtidas", "curtidas"],
    ["comentadas", "comentarios"],
    ["salvas", "salvos"],
    ["recentes", "criadaEmTimestamp"],
    ["capitulos", "capitulos"],
  ];

  for (const [tipo, campo] of criterios) {
    const lista = [
      criarObraRanking({ storageId: `${tipo}-baixo`, [campo]: 1 }),
      criarObraRanking({ storageId: `${tipo}-alto`, [campo]: 2 }),
    ];

    assert.deepEqual(
      ordenarRanking(lista, tipo).map((obra) => obra.storageId),
      [`${tipo}-alto`, `${tipo}-baixo`],
    );
    assert.deepEqual(lista.map((obra) => obra.storageId), [
      `${tipo}-baixo`,
      `${tipo}-alto`,
    ]);
  }
});

test("limita o top cinco pela ordenação selecionada", () => {
  const lista = Array.from({ length: 7 }, (_, indice) =>
    criarObraRanking({ storageId: `obra-${indice + 1}`, pontuacao: indice + 1 }),
  );

  assert.deepEqual(
    pegarTopRanking(lista, "geral").map((obra) => obra.storageId),
    ["obra-7", "obra-6", "obra-5", "obra-4", "obra-3"],
  );
});

test("reconhece qualquer interação real no ranking", () => {
  assert.equal(rankingTemInteracaoReal(criarObraRanking()), false);

  for (const campo of [
    "views",
    "curtidas",
    "comentarios",
    "salvos",
    "avaliacoes",
    "mediaAvaliacao",
  ]) {
    assert.equal(
      rankingTemInteracaoReal(criarObraRanking({ [campo]: 1 })),
      true,
      campo,
    );
  }
});

test("Em Alta delega helpers de listas e ranking para a fronteira pura", () => {
  assert.match(
    pagina,
    /import \{[\s\S]*?adicionarRankingObraNaLista,[\s\S]*?listaTemRankingObra,[\s\S]*?normalizarListaIdsEmAlta,[\s\S]*?pegarTopRanking,[\s\S]*?rankingTemInteracaoReal,[\s\S]*?removerRankingObraDaLista,[\s\S]*?\} from "\.\/lib\/em-alta-ranking-list-utils";/,
  );

  for (const helper of [
    "adicionarRankingObraNaLista",
    "listaTemRankingObra",
    "normalizarListaIdsEmAlta",
    "pegarTopRanking",
    "rankingTemInteracaoReal",
    "removerRankingObraDaLista",
  ]) {
    assert.match(pagina, new RegExp(`\\b${helper}\\b`));
    assert.doesNotMatch(pagina, new RegExp(`function ${helper}\\(`));
  }

  for (const helper of [
    "normalizarListaIdsEmAlta",
    "obterIdentificadoresRankingObra",
    "listaTemRankingObra",
    "removerRankingObraDaLista",
    "adicionarRankingObraNaLista",
    "ordenarRanking",
    "pegarTopRanking",
    "rankingTemInteracaoReal",
  ]) {
    assert.match(modulo, new RegExp(`export function ${helper}\\(`));
  }
});

test("módulo de listas e ranking permanece puro", () => {
  assert.match(
    modulo,
    /import type \{ ObraRanking, TipoRanking \} from "\.\/em-alta-models";/,
  );
  assert.match(
    modulo,
    /import \{ criarSlugBase, normalizarTexto \} from "\.\.\/\.\.\/\.\.\/lib\/utils";/,
  );

  for (const termoProibido of [
    /from ["']react["']/i,
    /\buse[A-Z]\w*\b/,
    /\bsupabase\b/i,
    /\blocalStorage\b/,
    /\bwindow\b/,
    /\bdocument\b/,
  ]) {
    assert.doesNotMatch(modulo, termoProibido);
  }
});
