import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const componente = readFileSync(new URL("../../app/explorar/components/explorar-desktop-header.tsx", import.meta.url), "utf8");
const pagina = readFileSync(new URL("../../app/explorar/page.tsx", import.meta.url), "utf8");

test("ExplorarDesktopHeader preserva a apresentação e callbacks da busca desktop", () => {
  assert.match(componente, /export function ExplorarDesktopHeader/);
  assert.match(componente, /busca: string;/);
  assert.match(componente, /modoConteudo: ModoConteudoExplorar;/);
  assert.match(componente, /language: HistorietasLanguage;/);
  assert.match(componente, /onBuscaChange: \(valor: string\) => void;/);
  assert.match(componente, /onAbrirFiltros: \(\) => void;/);
  assert.match(componente, /traduzirTextoExplorar\("Explorar", language\)/);
  assert.match(componente, /modoConteudo === "autores"/);
  assert.match(componente, /"Buscar autores\.\.\."/);
  assert.match(componente, /"Buscar histórias\.\.\."/);
  assert.match(componente, /onBuscaChange\(event\.target\.value\)/);
  assert.match(componente, /onClick=\{onAbrirFiltros\}/);
  assert.match(componente, /"Filtros"/);
  assert.match(componente, /width="20"/);
  assert.match(componente, /viewBox="0 0 24 24"/);
  assert.match(componente, /strokeWidth="2"/);
  assert.match(componente, /strokeLinecap="round"/);
  assert.match(componente, /autoComplete="off"/);
  assert.match(componente, /autoCorrect="off"/);
  assert.match(componente, /spellCheck=\{false\}/);
  assert.match(componente, /maxLength=\{90\}/);
  assert.match(componente, /type="text"/);
});

test("Explorar mantém estado e callbacks desktop na página", () => {
  assert.match(pagina, /import \{ ExplorarDesktopHeader \} from "\.\/components\/explorar-desktop-header";/);
  assert.match(pagina, /\{isDesktop \? \(/);
  assert.match(pagina, /<ExplorarDesktopHeader/);
  assert.match(pagina, /onBuscaChange=\{setBusca\}/);
  assert.match(pagina, /onAbrirFiltros=\{\(\) => setMostrarFiltrosAvancados\(true\)\}/);
});
