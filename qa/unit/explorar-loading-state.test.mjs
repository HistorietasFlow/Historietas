import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const component = await readFile(
  new URL("../../app/explorar/components/explorar-loading-state.tsx", import.meta.url),
  "utf8",
);
const pageRaw = await readFile(
  new URL("../../app/explorar/page.tsx", import.meta.url),
  "utf8",
);
const page = pageRaw.replace(/\r\n/g, "\n");

test("estado de loading preserva apresentação e decisão na página", () => {
  for (const trecho of [
    "export function ExplorarLoadingState",
    "mainStyle: CSSProperties",
    "themeCss: string",
    "label: string",
    "<main",
    'aria-busy="true"',
    "<style>{themeCss}</style>",
    "<LoadingSpinner label={label} />",
  ]) {
    assert.ok(component.includes(trecho), `Trecho ausente: ${trecho}`);
  }
  assert.match(page, /if \(!dadosExplorarCarregados\) \{[\s\S]*?<ExplorarLoadingState/);
  assert.match(page, /"Carregando Explorar",\n          language,/);
  assert.match(page, /themeCss=\{`\$\{themePageCss\}\$\{historietasThemeCss\}`\}/);
  assert.doesNotMatch(page, /import \{ LoadingSpinner \}/);
});
