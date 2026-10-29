import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const componente = readFileSync(new URL("../../app/explorar/components/explorar-mobile-header.tsx", import.meta.url), "utf8");
const pagina = readFileSync(new URL("../../app/explorar/page.tsx", import.meta.url), "utf8");

test("ExplorarMobileHeader preserva busca aberta e fechada", () => {
  assert.match(componente, /export function ExplorarMobileHeader/);
  assert.match(componente, /buscaMobileAberta: boolean;/);
  assert.match(componente, /textoBotaoFiltrosAvancados: string;/);
  assert.match(componente, /\{buscaMobileAberta \? \(/);
  assert.match(componente, /<span>\{textoBotaoFiltrosAvancados\}<\/span>/);
  assert.match(componente, /onClick=\{onAbrirFiltros\}/);
  assert.match(componente, /onBuscaChange\(event\.target\.value\)/);
  assert.match(componente, /autoFocus/);
  assert.match(componente, /aria-expanded="true"/);
  assert.match(componente, /aria-expanded="false"/);
  assert.match(componente, /"Fechar busca"/);
  assert.match(componente, /"Abrir busca"/);
  assert.match(componente, /onClick=\{onFecharBusca\}/);
  assert.match(componente, /onClick=\{onAbrirBusca\}/);
  assert.match(componente, /width="24"/);
  assert.match(componente, /strokeWidth="2\.15"/);
  assert.match(componente, /autoComplete="off"/);
  assert.match(componente, /autoCorrect="off"/);
  assert.match(componente, /spellCheck=\{false\}/);
  assert.match(componente, /maxLength=\{90\}/);
  assert.match(componente, /type="text"/);
});

test("Explorar mantém o reset da busca mobile e seus setters na página", () => {
  assert.match(pagina, /import \{ ExplorarMobileHeader \} from "\.\/components\/explorar-mobile-header";/);
  assert.match(pagina, /<ExplorarMobileHeader/);
  assert.match(pagina, /onFecharBusca=\{\(\) => \{\s*setBusca\(""\);\s*setBuscaMobileAberta\(false\);\s*\}\}/);
  assert.match(pagina, /onAbrirBusca=\{\(\) => setBuscaMobileAberta\(true\)\}/);
  assert.match(pagina, /onAbrirFiltros=\{\(\) => setMostrarFiltrosAvancados\(true\)\}/);
});
