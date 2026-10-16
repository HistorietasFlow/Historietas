import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const modulo = readFileSync(
  new URL(
    "../../app/em-alta/lib/em-alta-ranking-view-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/em-alta/page.tsx", import.meta.url),
  "utf8",
);
const executavel = modulo
  .replace('import type { ObraRanking } from "./em-alta-models";\n', "")
  .replace(
    /import \{\r?\n  pegarTopRanking,\r?\n  rankingTemInteracaoReal,\r?\n\} from "\.\/em-alta-ranking-list-utils";\r?\n/,
    `const pegarTopRanking = (ranking, tipo) =>
  [...ranking]
    .sort((obraA, obraB) => obraB[tipo] - obraA[tipo])
    .slice(0, 5);
const rankingTemInteracaoReal = (obra) => obra.atividade === true;
`,
  );
const javascriptModulo = typescript.transpileModule(executavel, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const { criarVisaoRankingEmAlta } = await import(
  `data:text/javascript;base64,${Buffer.from(javascriptModulo).toString("base64")}`,
);

function criarObra(storageId, sobrescritas = {}) {
  return {
    storageId,
    geral: 0,
    lidas: 0,
    curtidas: 0,
    comentadas: 0,
    salvas: 0,
    recentes: 0,
    capitulos: 0,
    atividade: false,
    ...sobrescritas,
  };
}

test("cria todos os tops do ranking preservando o limite e o tipo", () => {
  const ranking = Array.from({ length: 6 }, (_, indice) =>
    criarObra(`obra-${indice + 1}`, {
      geral: indice + 1,
      lidas: 6 - indice,
      curtidas: indice + 2,
      comentadas: indice + 3,
      salvas: indice + 4,
      recentes: indice + 5,
      capitulos: indice + 6,
    }),
  );

  const visao = criarVisaoRankingEmAlta(ranking);

  assert.deepEqual(visao.rankingGeral.map((obra) => obra.storageId), [
    "obra-6",
    "obra-5",
    "obra-4",
    "obra-3",
    "obra-2",
  ]);
  assert.deepEqual(visao.rankingMaisLidas.map((obra) => obra.storageId), [
    "obra-1",
    "obra-2",
    "obra-3",
    "obra-4",
    "obra-5",
  ]);

  for (const lista of [
    visao.rankingMaisCurtidas,
    visao.rankingMaisComentadas,
    visao.rankingMaisSalvas,
    visao.rankingMaisRecentes,
    visao.rankingMaisCapitulos,
  ]) {
    assert.equal(lista.length, 5);
    assert.equal(lista[0].storageId, "obra-6");
  }
});

test("preserva a atividade real e o fallback do catálogo inicial", () => {
  const visaoSemObras = criarVisaoRankingEmAlta([]);
  const visaoComObras = criarVisaoRankingEmAlta([
    criarObra("geral", { geral: 9, atividade: true }),
    criarObra("recente", { recentes: 3 }),
  ]);

  assert.equal(visaoSemObras.rankingTemAtividadeReal, false);
  assert.equal(visaoComObras.rankingTemAtividadeReal, true);
  assert.strictEqual(
    visaoSemObras.rankingParaCatalogoInicial,
    visaoSemObras.rankingGeral,
  );
  assert.strictEqual(
    visaoComObras.rankingParaCatalogoInicial,
    visaoComObras.rankingMaisRecentes,
  );
});

test("a fronteira preserva o useMemo e permanece pura", () => {
  assert.match(modulo, /export function criarVisaoRankingEmAlta\(/);
  assert.match(
    modulo,
    /import type \{ ObraRanking \} from "\.\/em-alta-models";/,
  );
  assert.match(
    modulo,
    /import \{[\s\S]*?pegarTopRanking,[\s\S]*?rankingTemInteracaoReal,[\s\S]*?\} from "\.\/em-alta-ranking-list-utils";/,
  );
  assert.match(
    pagina,
    /import \{ criarVisaoRankingEmAlta \} from "\.\/lib\/em-alta-ranking-view-utils";/,
  );
  assert.match(
    pagina,
    /\} = useMemo\(\(\) => criarVisaoRankingEmAlta\(ranking\), \[ranking\]\);/,
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
