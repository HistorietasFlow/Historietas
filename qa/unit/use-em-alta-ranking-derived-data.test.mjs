import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hook = readFileSync(
  new URL(
    "../../app/em-alta/hooks/use-em-alta-ranking-derived-data.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/em-alta/page.tsx", import.meta.url),
  "utf8",
);

test("useEmAltaRankingDerivedData preserva o pipeline derivado do ranking", () => {
  assert.match(hook, /import \{ useMemo \} from "react";/);
  assert.match(
    hook,
    /import type \{ ObraLocal, ObraRanking \} from "\.\.\/lib\/em-alta-models";/,
  );
  assert.match(
    hook,
    /import \{ calcularRankingAutores \} from "\.\.\/lib\/em-alta-author-ranking-utils";/,
  );
  assert.match(
    hook,
    /import \{ calcularRankingObrasLocais \} from "\.\.\/lib\/em-alta-local-ranking-utils";/,
  );
  assert.match(
    hook,
    /import \{ criarVisaoRankingEmAlta \} from "\.\.\/lib\/em-alta-ranking-view-utils";/,
  );
  assert.match(hook, /export function useEmAltaRankingDerivedData\(/);
  assert.match(
    hook,
    /const ranking = useMemo<ObraRanking\[\]>\([\s\S]*?calcularRankingObrasLocais\([\s\S]*?obrasLocais,[\s\S]*?avaliacoesLocaisRegistradas,[\s\S]*?visualizacoesRegistradas,[\s\S]*?\)[\s\S]*?\[avaliacoesLocaisRegistradas, obrasLocais, visualizacoesRegistradas\],[\s\S]*?\);/,
  );
  assert.match(
    hook,
    /const rankingAutores = useMemo\(\s*\(\) => calcularRankingAutores\(ranking\),\s*\[ranking\],\s*\);/,
  );
  assert.match(
    hook,
    /\} = useMemo\(\(\) => criarVisaoRankingEmAlta\(ranking\), \[ranking\]\);/,
  );
  assert.match(
    hook,
    /return \{[\s\S]*?ranking,[\s\S]*?rankingAutores,[\s\S]*?rankingGeral,[\s\S]*?rankingMaisCapitulos,[\s\S]*?rankingTemAtividadeReal,[\s\S]*?rankingParaCatalogoInicial,[\s\S]*?\};/,
  );
  assert.doesNotMatch(
    hook,
    /useEffect|useState|supabase|localStorage|window\.|document\.|<[A-Z][A-Za-z]+(?:\s|\/|>)/,
  );
});

test("Em Alta delega somente os dados derivados do ranking", () => {
  assert.match(
    pagina,
    /import \{ useEmAltaRankingDerivedData \} from "\.\/hooks\/use-em-alta-ranking-derived-data";/,
  );
  assert.match(
    pagina,
    /\} = useEmAltaRankingDerivedData\(\{[\s\S]*?avaliacoesLocaisRegistradas,[\s\S]*?obrasLocais,[\s\S]*?visualizacoesRegistradas,[\s\S]*?\}\);/,
  );
  assert.doesNotMatch(pagina, /\buseMemo\b/);
  assert.doesNotMatch(pagina, /calcularRankingObrasLocais/);
  assert.doesNotMatch(pagina, /calcularRankingAutores/);
  assert.doesNotMatch(pagina, /criarVisaoRankingEmAlta/);
  assert.match(pagina, /useEmAltaRankingLoader\(/);
  assert.match(pagina, /useEmAltaRankingCollectionActions\(/);
  assert.doesNotMatch(pagina, /async function alternarFavorito\(/);
  assert.doesNotMatch(pagina, /async function alternarConcluido\(/);
});
