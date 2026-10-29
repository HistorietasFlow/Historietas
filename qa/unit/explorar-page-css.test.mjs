import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const modulo = readFileSync(
  new URL("../../app/explorar/lib/explorar-page-css.ts", import.meta.url),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/explorar/page.tsx", import.meta.url),
  "utf8",
);
const estilos = readFileSync(
  new URL("../../app/explorar/lib/explorar-layout-styles.ts", import.meta.url),
  "utf8",
);
const loadingState = readFileSync(
  new URL("../../app/explorar/components/explorar-loading-state.tsx", import.meta.url),
  "utf8",
);

test("themePageCss preserva o CSS global de Explorar", () => {
  assert.match(modulo, /export const themePageCss = `/);
  assert.match(modulo, /@keyframes historietas-loading-spin/);
  assert.match(modulo, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(modulo, /\.historietas-loading-spinner/);
  assert.match(modulo, /\.explorar-carousel/);
  assert.match(modulo, /\.explorar-carousel::-webkit-scrollbar/);
  assert.match(modulo, /nav a\[href="\/explorar"\]/);
  assert.match(modulo, /a\[href="\/publicar"\]:not/);
  assert.match(modulo, /\.historietas-bottom-nav-icon/);
  assert.match(modulo, /input::placeholder/);
  assert.match(
    modulo,
    /\[data-historietas-page-background-action="true"\]/,
  );
});

test("Explorar consome themePageCss sem alterar as fronteiras da página", () => {
  assert.match(
    pagina,
    /import \{ themePageCss \} from "\.\/lib\/explorar-page-css";/,
  );
  assert.doesNotMatch(pagina, /const themePageCss = `/);
  assert.equal(
    (
      pagina.match(
        /<style>\{`\$\{themePageCss\}\$\{historietasThemeCss\}`\}<\/style>/g,
      ) || []
    ).length,
    1,
  );
  assert.match(pagina, /themeCss=\{`\$\{themePageCss\}\$\{historietasThemeCss\}`\}/);
  assert.match(loadingState, /<style>\{themeCss\}<\/style>/);
  assert.doesNotMatch(
    pagina,
    /\$\{historietasThemeCss\}\$\{themePageCss\}/,
  );
  assert.match(
    pagina,
    /import \{ explorarBuscaToggleCss \} from "\.\/lib\/explorar-search-toggle-css";/,
  );
  assert.match(pagina, /<style>\{explorarBuscaToggleCss\}<\/style>/);
  assert.match(estilos, /export const safeTextStyle: CSSProperties/);
  assert.match(pagina, /from "\.\/lib\/explorar-layout-styles"/);
  assert.match(
    pagina,
    /import \{ useExplorarDesktopMode \} from "\.\/hooks\/use-explorar-desktop-mode";/,
  );
  assert.match(pagina, /useExplorarInitialLoad\(\{/);
  assert.match(
    readFileSync(new URL("../../app/explorar/hooks/use-explorar-initial-load.ts", import.meta.url), "utf8"),
    /async function carregarExplorar\(\)/,
  );
  assert.match(pagina, /useExplorarAuthState\(\{/);
  assert.match(pagina, /useExplorarCatalogQuery\(\{/);
  assert.match(
    readFileSync(new URL("../../app/explorar/hooks/use-explorar-catalog-query.ts", import.meta.url), "utf8"),
    /carregarObrasPublicadasSupabase\(/,
  );
  assert.match(
    readFileSync(new URL("../../app/explorar/lib/explorar-remote-loader.ts", import.meta.url), "utf8"),
    /listarSelecaoCatalogo/,
  );
  assert.match(pagina, /acessoConteudo18Confirmado/);
});
