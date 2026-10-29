import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const componente = readFileSync(new URL("../../app/explorar/components/explorar-advanced-filters-shell.tsx", import.meta.url), "utf8");
const pagina = readFileSync(new URL("../../app/explorar/page.tsx", import.meta.url), "utf8");

test("ExplorarAdvancedFiltersShell preserva o envelope visual do modal", () => {
  assert.match(componente, /export function ExplorarAdvancedFiltersShell/);
  assert.match(componente, /isDesktop: boolean;/);
  assert.match(componente, /onFechar: \(\) => void;/);
  assert.match(componente, /children: ReactNode;/);
  assert.match(componente, /style=\{explorarModalOverlayStyle\}/);
  assert.match(componente, /onClick=\{onFechar\}/);
  assert.match(componente, /desktopExplorarModalSheetStyle/);
  assert.match(componente, /explorarModalSheetStyle/);
  assert.match(componente, /event\.stopPropagation\(\)/);
  assert.match(componente, /explorarModalHandleStyle/);
  assert.match(componente, /aria-hidden="true"/);
  assert.match(componente, /"EXPLORAR"/);
  assert.match(componente, /aria-label=\{traduzirTextoExplorar\("EXPLORAR", language\)\}/);
  assert.match(componente, /\{children\}/);
});

test("Explorar mantém condição, fechamento e regras do modal na página", () => {
  assert.match(pagina, /import \{ ExplorarAdvancedFiltersShell \} from "\.\/components\/explorar-advanced-filters-shell";/);
  assert.match(pagina, /\{mostrarFiltrosAvancados && \(/);
  assert.match(pagina, /<ExplorarAdvancedFiltersShell/);
  assert.match(pagina, /onFechar=\{\(\) => \{\s*setMostrarFiltrosAvancados\(false\);\s*setMostrarConfirmacaoConteudo18\(false\);\s*setConfirmouIdadeConteudo18\(false\);\s*\}\}/);
  assert.match(pagina, /ACESSO_CONTEUDO_18_TEMPORARIAMENTE_BLOQUEADO/);
  assert.match(pagina, /<ExplorarOrderingOptions/);
  assert.match(pagina, /onSelecionar=\{setOrdenacao\}/);
  assert.match(pagina, /limparFiltros/);
});
