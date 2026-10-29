import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hook = readFileSync(
  new URL(
    "../../app/explorar/hooks/use-explorar-desktop-mode.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/explorar/page.tsx", import.meta.url),
  "utf8",
);
const estilos = readFileSync(
  new URL("../../app/explorar/lib/explorar-content-styles.ts", import.meta.url),
  "utf8",
);
const storage = readFileSync(
  new URL("../../app/explorar/lib/explorar-local-storage.ts", import.meta.url),
  "utf8",
);
const autorCard = readFileSync(new URL("../../app/explorar/components/explorar-autor-card.tsx", import.meta.url), "utf8");
const obraCard = readFileSync(new URL("../../app/explorar/components/explorar-obra-publicada-card.tsx", import.meta.url), "utf8");
const auxiliares = readFileSync(new URL("../../app/explorar/components/explorar-section-components.tsx", import.meta.url), "utf8");
const categoriesBar = readFileSync(new URL("../../app/explorar/components/explorar-categories-bar.tsx", import.meta.url), "utf8");

test("useExplorarDesktopMode preserva o lifecycle responsivo síncrono", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /export function useExplorarDesktopMode\(\)/);
  assert.match(hook, /const \[isDesktop, setIsDesktop\] = useState\(false\);/);
  assert.match(
    hook,
    /const mediaQuery = window\.matchMedia\("\(min-width: 1024px\)"\);/,
  );
  assert.match(
    hook,
    /const atualizarModoDesktop = \(\) => \{\s*setIsDesktop\(mediaQuery\.matches\);\s*\};/,
  );
  assert.match(
    hook,
    /setIsDesktop\(mediaQuery\.matches\);\s*\};\s*atualizarModoDesktop\(\);/,
  );
  assert.doesNotMatch(hook, /window\.setTimeout/);
  assert.match(
    hook,
    /mediaQuery\.addEventListener\("change", atualizarModoDesktop\);[\s\S]*?mediaQuery\.removeEventListener\("change", atualizarModoDesktop\);/,
  );
  assert.match(hook, /mediaQuery\.addListener\(atualizarModoDesktop\);/);
  assert.match(
    hook,
    /mediaQuery\.addListener\(atualizarModoDesktop\);[\s\S]*?mediaQuery\.removeListener\(atualizarModoDesktop\);/,
  );
  assert.match(hook, /\}, \[\]\);/);
  assert.match(hook, /return isDesktop;/);
});

test("Explorar delega apenas o modo desktop e mantém as fronteiras sensíveis", () => {
  assert.match(
    pagina,
    /import \{ useExplorarDesktopMode \} from "\.\/hooks\/use-explorar-desktop-mode";/,
  );
  assert.match(pagina, /const isDesktop = useExplorarDesktopMode\(\);/);
  assert.doesNotMatch(
    pagina,
    /const \[isDesktop, setIsDesktop\] = useState\(false\);/,
  );
  assert.doesNotMatch(pagina, /setIsDesktop/);
  assert.doesNotMatch(
    pagina,
    /window\.matchMedia\("\(min-width: 1024px\)"\)/,
  );
  assert.equal(([pagina, autorCard, obraCard, auxiliares].join("\n").match(/\bisDesktop\b/g) || []).length, 75);
  assert.equal((categoriesBar.match(/\bisDesktop\b/g) || []).length, 3);
  assert.match(pagina, /<ExplorarCategoriesBar isDesktop=\{isDesktop\}/);
  assert.match(categoriesBar, /isDesktop: boolean/);
  assert.match(categoriesBar, /style=\{isDesktop \? desktopCategoriesStyle : categoriesStyle\}/);
  assert.equal((estilos.match(/\bisDesktop\b/g) || []).length, 2);
  assert.match(estilos, /export function criarCardPrimaryActionStyle\(\s*isDesktop\?: boolean/);
  assert.match(estilos, /isDesktop \? desktopCardPrimaryActionStyle : cardPrimaryActionStyle/);
  assert.match(obraCard, /criarCardPrimaryActionStyle\(isDesktop\)/);
  assert.match(
    pagina,
    /import \{ useExplorarAdvancedFiltersBodyLock \} from "\.\/hooks\/use-explorar-advanced-filters-body-lock";/,
  );
  assert.match(
    pagina,
    /useExplorarAdvancedFiltersBodyLock\(mostrarFiltrosAvancados\);/,
  );
  assert.match(
    pagina,
    /const \[mostrarFiltrosAvancados, setMostrarFiltrosAvancados\] = useState\(false\);/,
  );
  assert.match(pagina, /useExplorarInitialLoad\(\{/);
  assert.match(
    readFileSync(new URL("../../app/explorar/hooks/use-explorar-initial-load.ts", import.meta.url), "utf8"),
    /async function carregarExplorar\(\)/,
  );
  assert.match(pagina, /supabase\.auth\.getUser\(\)/);
  assert.match(pagina, /useExplorarCatalogQuery\(\{/);
  assert.match(
    readFileSync(new URL("../../app/explorar/hooks/use-explorar-catalog-query.ts", import.meta.url), "utf8"),
    /carregarObrasPublicadasSupabase\(/,
  );
  assert.match(
    readFileSync(new URL("../../app/explorar/lib/explorar-remote-loader.ts", import.meta.url), "utf8"),
    /listarSelecaoCatalogo/,
  );
  assert.match(pagina, /from "\.\/lib\/explorar-local-storage"/);
  assert.match(
    readFileSync(new URL("../../app/explorar/hooks/use-explorar-initial-load.ts", import.meta.url), "utf8"),
    /lerStorageUsuarioExplorar\(/,
  );
  assert.match(storage, /localStorage\.getItem/);
});
