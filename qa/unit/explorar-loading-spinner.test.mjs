import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const componente = readFileSync(
  new URL(
    "../../app/explorar/components/explorar-loading-spinner.tsx",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/explorar/page.tsx", import.meta.url),
  "utf8",
);
const loadingState = readFileSync(
  new URL("../../app/explorar/components/explorar-loading-state.tsx", import.meta.url),
  "utf8",
);
const cssGlobal = readFileSync(
  new URL("../../app/explorar/lib/explorar-page-css.ts", import.meta.url),
  "utf8",
);

test("LoadingSpinner de Explorar preserva estrutura, props e estilos", () => {
  assert.match(
    componente,
    /export function LoadingSpinner\(\{ label = "Carregando" \}: \{ label\?: string \}\)/,
  );
  assert.match(componente, /<div[\s\S]*?role="status"/);
  assert.match(componente, /aria-live="polite"/);
  assert.match(componente, /aria-label=\{label\}/);
  assert.match(componente, /style=\{loadingPageStyle\}/);
  assert.match(componente, /<span[\s\S]*?aria-hidden="true"/);
  assert.match(componente, /className="historietas-loading-spinner"/);
  assert.match(componente, /style=\{loadingSpinnerStyle\}/);
  assert.match(componente, /const loadingPageStyle: CSSProperties/);
  assert.match(componente, /const loadingSpinnerStyle: CSSProperties/);
  assert.match(
    componente,
    /animation: "historietas-loading-spin 0\.78s linear infinite"/,
  );
  assert.doesNotMatch(componente, /@keyframes historietas-loading-spin/);
  assert.match(cssGlobal, /@keyframes historietas-loading-spin/);
});

test("Explorar delega somente o spinner e preserva suas fronteiras", () => {
  assert.match(
    pagina,
    /import \{ ExplorarLoadingState \} from "\.\/components\/explorar-loading-state";/,
  );
  assert.doesNotMatch(pagina, /function LoadingSpinner\(/);
  assert.doesNotMatch(pagina, /const loadingPageStyle: CSSProperties/);
  assert.doesNotMatch(pagina, /const loadingSpinnerStyle: CSSProperties/);
  assert.doesNotMatch(pagina, /import \{ LoadingSpinner \}/);
  assert.match(
    pagina,
    /<ExplorarLoadingState[\s\S]*?mainStyle=\{criarExplorarPageStyle\(pageThemeStyle\)\}[\s\S]*?themeCss=\{`\$\{themePageCss\}\$\{historietasThemeCss\}`\}[\s\S]*?"Carregando Explorar"/,
  );
  assert.match(loadingState, /import \{ LoadingSpinner \} from "\.\/explorar-loading-spinner";/);
  assert.match(loadingState, /<LoadingSpinner label=\{label\} \/>/);
  assert.match(pagina, /if \(!dadosExplorarCarregados\) \{/);
  assert.match(
    pagina,
    /import \{ explorarBuscaToggleCss \} from "\.\/lib\/explorar-search-toggle-css";/,
  );
  assert.match(
    pagina,
    /import \{ themePageCss \} from "\.\/lib\/explorar-page-css";/,
  );
  assert.match(
    pagina,
    /import \{ useExplorarDesktopMode \} from "\.\/hooks\/use-explorar-desktop-mode";/,
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
});
