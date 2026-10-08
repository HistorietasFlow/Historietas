import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const cssSource = readFileSync(
  new URL(
    "../../app/ler-capitulo/lib/ler-capitulo-page-css.ts",
    import.meta.url,
  ),
  "utf8",
).replace(/\r\n/g, "\n");
const pagina = readFileSync(
  new URL("../../app/ler-capitulo/page.tsx", import.meta.url),
  "utf8",
).replace(/\r\n/g, "\n");

test("leitorPageCss preserva o CSS global crítico do leitor", () => {
  assert.match(cssSource, /export const leitorPageCss = `/);
  assert.match(cssSource, /@keyframes historietas-reader-heart-pop/);
  assert.match(cssSource, /@keyframes historietas-loading-spin/);
  assert.match(cssSource, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(cssSource, /\.historietas-loading-spinner \{/);
  assert.match(cssSource, /\[data-historietas-reader-like\] svg \{/);
  assert.match(cssSource, /--historietas-reader-bg-page: #000000;/);
  assert.match(cssSource, /--historietas-reader-danger-border: rgba\(255,255,255,0\.18\);/);
  assert.match(cssSource, /body,\n  main \{/);
  assert.match(
    cssSource,
    /html\[data-historietas-tema-visual\] input::placeholder,/,
  );
  assert.match(cssSource, /html\[data-historietas-tema-visual\] select,/);
});

test("Leitor consome somente o CSS extraído na ordem original", () => {
  assert.match(
    pagina,
    /import \{ leitorPageCss \} from "\.\/lib\/ler-capitulo-page-css";/,
  );
  assert.doesNotMatch(pagina, /const leitorPageCss = `/);
  assert.equal(
    (
      pagina.match(
        /<style>\{`\$\{historietasThemeCss\}\$\{leitorPageCss\}`\}<\/style>/g,
      ) || []
    ).length,
    4,
  );
  assert.doesNotMatch(pagina, /\$\{leitorPageCss\}\$\{historietasThemeCss\}/);
  assert.match(pagina, /const focusBottomNavigationCss = `/);
  assert.match(pagina, /<style>\{focusBottomNavigationCss\}<\/style>/);
  assert.match(pagina, /const pageStyle: CSSProperties = \{/);
  assert.match(pagina, /const commentsSheetStyle: CSSProperties = \{/);
  assert.match(pagina, /const isDesktop = useLerCapituloDesktopMode\(\);/);
  assert.match(pagina, /await supabase\.auth\.getUser\(\)/);
  assert.match(pagina, /acessoConteudo18Confirmado\(\)/);
  assert.match(pagina, /async function enviarComentarioCapitulo\(/);
});
