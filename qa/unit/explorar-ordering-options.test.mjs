import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const componente = readFileSync(
  new URL(
    "../../app/explorar/components/explorar-ordering-options.tsx",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/explorar/page.tsx", import.meta.url),
  "utf8",
);

test("ExplorarOrderingOptions preserva as opções e a ordem de ordenação", () => {
  assert.match(componente, /import type \{ OrdenacaoExplorar \}/);
  assert.match(componente, /export function ExplorarOrderingOptions/);
  assert.match(
    componente,
    /\["relevancia", "Relevância"\],\s*\["mais-curtidas", "Mais curtidas"\],\s*\["mais-recentes", "Mais recentes"\]/,
  );
  assert.match(componente, /opcoesOrdenacaoExplorar\.map/);
  assert.match(componente, /ordenacao === valor/);
  assert.match(componente, /onClick=\{\(\) => onSelecionar\(valor\)\}/);
  assert.match(componente, /criarExplorarModalOptionStyle\(ordenacao === valor\)/);
  assert.match(componente, /criarExplorarModalRadioStyle\(ordenacao === valor\)/);
  assert.match(componente, /"✓"/);
  assert.match(componente, /traduzirTextoExplorar\(rotulo, language\)/);
});

test("Explorar mantém a condição e o setter de ordenação na página", () => {
  assert.match(pagina, /import \{ ExplorarOrderingOptions \} from "\.\/components\/explorar-ordering-options";/);
  assert.match(pagina, /!mostrarConfirmacaoConteudo18 && \(/);
  assert.match(pagina, /traduzirTextoExplorar\("Ordenar", language\)/);
  assert.match(pagina, /<ExplorarOrderingOptions/);
  assert.match(pagina, /onSelecionar=\{setOrdenacao\}/);
});
