import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const component = await readFile(
  new URL("../../app/explorar/components/explorar-top-water-fade.tsx", import.meta.url),
  "utf8",
);
const pageRaw = await readFile(
  new URL("../../app/explorar/page.tsx", import.meta.url),
  "utf8",
);
const page = pageRaw.replace(/\r\n/g, "\n");

test("fade usa isDesktop para renderizar exatamente uma camada decorativa", () => {
  assert.match(component, /isDesktop: boolean/);
  assert.match(component, /criarExplorarTopWaterFadeStyle\(isDesktop\)/);
  assert.match(component, /aria-hidden="true"/);
  assert.match(page, /<ExplorarTopWaterFade isDesktop=\{isDesktop\} \/>/);
  assert.doesNotMatch(page, /criarExplorarTopWaterFadeStyle\(true\)/);
  assert.doesNotMatch(page, /criarExplorarTopWaterFadeStyle\(false\)/);
});
