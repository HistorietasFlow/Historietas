import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const component = await readFile(
  new URL("../../app/explorar/components/explorar-load-more-button.tsx", import.meta.url),
  "utf8",
);
const pageRaw = await readFile(
  new URL("../../app/explorar/page.tsx", import.meta.url),
  "utf8",
);
const page = pageRaw.replace(/\r\n/g, "\n");

test("botão de carregar mais preserva acessibilidade, callback e tradução", () => {
  for (const trecho of [
    'type="button"',
    "onClick={onCarregarMais}",
    "disabled={carregando}",
    "explorarCarregarMaisButtonStyle",
    '"Carregando"',
    '"Carregar mais"',
    "traduzirTextoExplorar(",
  ]) {
    assert.ok(component.includes(trecho), `Trecho ausente: ${trecho}`);
  }
  assert.match(page, /consultaCatalogoPersonalizada && catalogoTemMais && \([\s\S]*?<ExplorarLoadMoreButton/);
  assert.match(page, /onCarregarMais=\{\(\) =>\n                    void carregarMaisObrasCatalogo\(\)\n                  \}/);
});
