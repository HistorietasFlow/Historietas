import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pagina = readFileSync(
  new URL("../../app/em-alta/page.tsx", import.meta.url),
  "utf8",
);
const decorations = readFileSync(
  new URL(
    "../../app/em-alta/components/em-alta-page-decorations.tsx",
    import.meta.url,
  ),
  "utf8",
);

test("EmAltaPageDecorations preserva os ornamentos e fades responsivos", () => {
  assert.match(
    decorations,
    /import \{[\s\S]*?criarDecoracaoPaginaStyle,[\s\S]*?desktopTopWaterFadeStyle,[\s\S]*?mobileTopWaterFadeStyle,[\s\S]*?pageDecorationLayerStyle,[\s\S]*?\} from "\.\.\/lib\/em-alta-ranking-visual-style-utils";/,
  );
  assert.match(decorations, /export function EmAltaPageDecorations\(/);
  assert.match(decorations, /isDesktop: boolean;/);
  assert.match(decorations, /<div style=\{pageDecorationLayerStyle\} aria-hidden="true">/);
  assert.match(decorations, /\["#", "★"\]\.map\(\(decoracao, index\) => \(/);
  assert.match(decorations, /key=\{`\$\{decoracao\}-\$\{index\}`\}/);
  assert.match(decorations, /style=\{criarDecoracaoPaginaStyle\(index\)\}/);
  assert.match(decorations, /\{decoracao\}/);
  assert.match(
    decorations,
    /\{isDesktop && <div style=\{desktopTopWaterFadeStyle\} aria-hidden="true" \/>\}/,
  );
  assert.match(
    decorations,
    /\{!isDesktop && <div style=\{mobileTopWaterFadeStyle\} aria-hidden="true" \/>\}/,
  );
  assert.doesNotMatch(decorations, /useEffect|useMemo|useState|supabase|localStorage|window\.|document\./);
});

test("Em Alta delega somente a camada decorativa estática", () => {
  assert.match(
    pagina,
    /import \{ EmAltaPageDecorations \} from "\.\/components\/em-alta-page-decorations";/,
  );
  assert.match(pagina, /<EmAltaPageDecorations isDesktop=\{isDesktop\} \/>/);
  assert.doesNotMatch(pagina, /\["#", "★"\]\.map\(/);
  assert.doesNotMatch(pagina, /criarDecoracaoPaginaStyle/);
  assert.doesNotMatch(pagina, /desktopTopWaterFadeStyle/);
  assert.doesNotMatch(pagina, /mobileTopWaterFadeStyle/);
  assert.doesNotMatch(pagina, /pageDecorationLayerStyle/);
  assert.match(pagina, /async function carregarRanking\(\)/);
  assert.match(pagina, /supabase\.auth\.getUser\(\)/);
});
