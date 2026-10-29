import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const componente = readFileSync(
  new URL(
    "../../app/explorar/components/explorar-clear-filters-action.tsx",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/explorar/page.tsx", import.meta.url),
  "utf8",
);

test("ExplorarClearFiltersAction preserva o divisor e a ação visual", () => {
  assert.match(componente, /export function ExplorarClearFiltersAction/);
  assert.match(componente, /language: HistorietasLanguage;/);
  assert.match(componente, /onLimpar: \(\) => void;/);
  assert.match(componente, /explorarModalClearDividerStyle/);
  assert.match(componente, /aria-hidden="true"/);
  assert.match(componente, /type="button"/);
  assert.match(componente, /onClick=\{onLimpar\}/);
  assert.match(componente, /explorarModalClearButtonStyle/);
  assert.match(componente, /traduzirTextoExplorar\("Limpar filtros", language\)/);
});

test("Explorar mantém a decisão de limpar filtros na página", () => {
  assert.match(pagina, /import \{ ExplorarClearFiltersAction \} from "\.\/components\/explorar-clear-filters-action";/);
  assert.match(pagina, /!mostrarConfirmacaoConteudo18 && filtrosAtivos && \(/);
  assert.match(pagina, /function limparFiltros\(\)/);
  assert.match(pagina, /<ExplorarClearFiltersAction/);
  assert.match(pagina, /onLimpar=\{limparFiltros\}/);
});
