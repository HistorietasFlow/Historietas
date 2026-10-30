import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pagina = readFileSync(
  new URL("../../app/listas/page.tsx", import.meta.url),
  "utf8",
);
const hook = readFileSync(
  new URL(
    "../../app/listas/hooks/use-listas-results-view-state.ts",
    import.meta.url,
  ),
  "utf8",
);

test("estado derivado de Listas preserva memos, filtros, paginação e agrupamento", () => {
  assert.match(
    pagina,
    /import \{ useListasResultsViewState \} from "\.\/hooks\/use-listas-results-view-state";/,
  );
  assert.match(pagina, /\} = useListasResultsViewState\(\{/);

  for (const helper of [
    "filtrarOrdenarItensPerfilListas",
    "filtrarOrdenarObrasPublicasListas",
    "filtrarOrdenarAutoresListas",
    "calcularTotalResultadosListas",
    "obterTituloPaginaListas",
    "deveAgruparPorMesListas",
    "agruparItensPerfilPorMesListas",
  ]) {
    assert.match(hook, new RegExp(`\\b${helper}\\b`));
  }

  assert.match(
    hook,
    /\[busca, categoria, listasPerfil, ordenacao\]/,
  );
  assert.match(hook, /\[busca, obrasPublicas, ordenacao, secao\]/);
  assert.match(hook, /\[autores, busca, ordenacao\]/);
  assert.match(hook, /\[itensPerfilVisiveis\]/);
  assert.match(hook, /\.slice\(0, quantidadeVisivel\)/);
  assert.doesNotMatch(
    hook,
    /supabase|localStorage|useState|useEffect|\.insert\(|\.update\(|\.delete\(/,
  );
});
