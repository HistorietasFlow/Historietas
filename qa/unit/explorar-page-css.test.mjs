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
    2,
  );
  assert.doesNotMatch(
    pagina,
    /\$\{historietasThemeCss\}\$\{themePageCss\}/,
  );
  assert.match(pagina, /const explorarBuscaToggleCss = `/);
  assert.match(pagina, /<style>\{explorarBuscaToggleCss\}<\/style>/);
  assert.match(pagina, /const safeTextStyle: CSSProperties/);
  assert.match(
    pagina,
    /import \{ useExplorarDesktopMode \} from "\.\/hooks\/use-explorar-desktop-mode";/,
  );
  assert.match(pagina, /async function carregarExplorar\(\)/);
  assert.match(pagina, /supabase\.auth\.getUser\(\)/);
  assert.match(pagina, /listarSelecaoCatalogo/);
  assert.match(pagina, /acessoConteudo18Confirmado/);
});
