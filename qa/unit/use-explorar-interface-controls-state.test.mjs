import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ler = (path) => readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const hook = ler("../../app/explorar/hooks/use-explorar-interface-controls-state.ts");
const pagina = ler("../../app/explorar/page.tsx");

test("hook centraliza somente os controles visuais de Explorar", () => {
  assert.match(hook, /export function useExplorarInterfaceControlsState\(\)/);
  for (const estado of ["buscaMobileAberta", "mostrarFiltrosAvancados", "mostrarConfirmacaoConteudo18", "confirmouIdadeConteudo18"]) assert.match(hook, new RegExp(`${estado}, set[A-Z][A-Za-z0-9]+\\]\\s*=\\s*useState\\(false\\)`));
  assert.doesNotMatch(hook, /useEffect|supabase|return\s*\(\s*</);
});

test("página delega controles e preserva handlers e body lock", () => {
  assert.match(pagina, /useExplorarInterfaceControlsState/);
  assert.match(pagina, /useExplorarAdvancedFiltersBodyLock\(mostrarFiltrosAvancados\)/);
  assert.match(pagina, /function selecionarModoConteudo/);
  assert.match(pagina, /function selecionarFiltroClassificacaoExplorar/);
  assert.match(pagina, /function confirmarFiltroConteudo18Explorar/);
  assert.match(pagina, /function limparFiltros/);
});
