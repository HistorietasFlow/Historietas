import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pagina = readFileSync(
  new URL("../../app/explorar/page.tsx", import.meta.url),
  "utf8",
);
const composicao = readFileSync(
  new URL(
    "../../app/explorar/components/explorar-advanced-filters-composition.tsx",
    import.meta.url,
  ),
  "utf8",
);

test("Explorar adia o chunk da composição dos filtros avançados", () => {
  assert.match(pagina, /import \{ lazy, Suspense, useEffect, useMemo, useRef \} from "react";/);
  assert.match(
    pagina,
    /const ExplorarAdvancedFiltersComposition = lazy\(\s*\(\) => import\("\.\/components\/explorar-advanced-filters-composition"\),\s*\);/,
  );
  assert.match(
    pagina,
    /\{mostrarFiltrosAvancados && \(\s*<Suspense fallback=\{null\}>\s*<ExplorarAdvancedFiltersComposition/,
  );

  for (const componente of [
    "explorar-advanced-filters-shell",
    "explorar-collection-filter-options",
    "explorar-adult-content-filter",
    "explorar-ordering-options",
    "explorar-format-filter-options",
    "explorar-clear-filters-action",
  ]) {
    assert.doesNotMatch(
      pagina,
      new RegExp(`from "\\.\\/components\\/${componente}"`),
    );
    assert.match(composicao, new RegExp(`from "\\.\\/${componente}"`));
  }
});

test("a fronteira adiada recebe estado e callbacks sem mover as regras da página", () => {
  for (const contrato of [
    "modoConteudo",
    "filtroColecao",
    "filtroClassificacao",
    "mostrarConfirmacaoConteudo18",
    "confirmouIdadeConteudo18",
    "ordenacao",
    "filtrosAtivos",
    "onFechar",
    "onSelecionarColecao",
    "onSelecionarClassificacao",
    "onConfirmouIdadeChange",
    "onVoltarConteudo18",
    "onConfirmarConteudo18",
    "onSelecionarOrdenacao",
    "onLimparFiltros",
  ]) {
    assert.match(pagina, new RegExp(`${contrato}=`));
  }

  assert.match(pagina, /function limparFiltros\(\)/);
  assert.match(pagina, /function selecionarFiltroClassificacaoExplorar\(/);
  assert.match(pagina, /function confirmarFiltroConteudo18Explorar\(\)/);
});
