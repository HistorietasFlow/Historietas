import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pagina = readFileSync(
  new URL("../../app/seguindo/page.tsx", import.meta.url),
  "utf8",
);
const visualizacao = readFileSync(
  new URL(
    "../../app/seguindo/hooks/use-seguindo-page-view.ts",
    import.meta.url,
  ),
  "utf8",
);
const contexto = readFileSync(
  new URL(
    "../../app/seguindo/hooks/use-seguindo-page-context.ts",
    import.meta.url,
  ),
  "utf8",
);
const carregamento = readFileSync(
  new URL(
    "../../app/seguindo/components/seguindo-page-loading-state.tsx",
    import.meta.url,
  ),
  "utf8",
);

test("a fronteira visual preserva tema e lock na ordem original", () => {
  assert.match(visualizacao, /^"use client";/);
  assert.match(
    visualizacao,
    /const \{ pageThemeStyle \} = useHistorietasTheme\(pageStyle\);[\s\S]*?useSeguindoSortingSheetBodyLock\(mostrarPainelOrdenacao\);/,
  );
  assert.match(visualizacao, /return \{ pageThemeStyle \};/);
  assert.doesNotMatch(visualizacao, /supabase|localStorage|useState/);
});

test("o estado de carregamento preserva frame, spinner e acessibilidade", () => {
  assert.match(carregamento, /^"use client";/);
  assert.match(
    carregamento,
    /<SeguindoPageFrame isDesktop=\{isDesktop\} pageThemeStyle=\{pageThemeStyle\}>[\s\S]*?<LoadingSpinner label="Carregando seguindo" \/>/,
  );
  assert.doesNotMatch(carregamento, /supabase|localStorage|useEffect/);
});

test("a página delega a fronteira de apresentação pelo contexto", () => {
  assert.match(
    contexto,
    /import \{ useSeguindoPageView \} from "\.\/use-seguindo-page-view";/,
  );
  assert.match(
    contexto,
    /const \{ pageThemeStyle \} = useSeguindoPageView\(mostrarPainelOrdenacao\);/,
  );
  assert.match(
    pagina,
    /import \{ useSeguindoPageContext \} from "\.\/hooks\/use-seguindo-page-context";/,
  );
  assert.match(pagina, /useSeguindoPageContext\(\s*mostrarPainelOrdenacao,?\s*\)/);
  assert.match(
    pagina,
    /<SeguindoPageLoadingState isDesktop=\{isDesktop\} pageThemeStyle=\{pageThemeStyle\} \/>/,
  );
  assert.doesNotMatch(pagina, /useHistorietasTheme\(pageStyle\)/);
  assert.doesNotMatch(pagina, /useSeguindoSortingSheetBodyLock\(mostrarPainelOrdenacao\)/);
  assert.doesNotMatch(pagina, /<LoadingSpinner label="Carregando seguindo" \/>/);
});
