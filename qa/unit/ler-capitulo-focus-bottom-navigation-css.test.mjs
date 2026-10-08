import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const cssSource = readFileSync(
  new URL(
    "../../app/ler-capitulo/lib/ler-capitulo-focus-bottom-navigation-css.ts",
    import.meta.url,
  ),
  "utf8",
).replace(/\r\n/g, "\n");
const leitorPageCss = readFileSync(
  new URL("../../app/ler-capitulo/lib/ler-capitulo-page-css.ts", import.meta.url),
  "utf8",
).replace(/\r\n/g, "\n");
const pagina = readFileSync(
  new URL("../../app/ler-capitulo/page.tsx", import.meta.url),
  "utf8",
).replace(/\r\n/g, "\n");

test("focusBottomNavigationCss preserva as regras globais críticas da navegação", () => {
  assert.match(cssSource, /export const focusBottomNavigationCss = `/);
  assert.match(cssSource, /--historietas-bottom-nav-bg: #000000;/);
  assert.match(cssSource, /--historietas-bottom-nav-border: rgba\(255,255,255,0\.18\);/);
  assert.match(cssSource, /--historietas-bottom-nav-main-border: #FFFFFF;/);
  assert.match(cssSource, /body nav,/);
  assert.match(cssSource, /body \[data-bottom-nav\],/);
  assert.match(cssSource, /body \[data-mobile-nav\],/);
  assert.match(cssSource, /:has\(a\[href="\/publicar"\]\)/);
  assert.match(cssSource, /\/perfil-autor\?aba=biblioteca/);
  assert.match(cssSource, /body \.historietas-bottom-nav-icon \{/);
  assert.ok((cssSource.match(/!important/g) || []).length >= 10);
});

test("Leitor mantém o CSS de foco separado no único consumidor normal", () => {
  assert.match(
    pagina,
    /import \{ focusBottomNavigationCss \} from "\.\/lib\/ler-capitulo-focus-bottom-navigation-css";/,
  );
  assert.doesNotMatch(pagina, /const focusBottomNavigationCss = `/);
  assert.equal(
    (pagina.match(/<style>\{focusBottomNavigationCss\}<\/style>/g) || []).length,
    1,
  );
  assert.match(
    pagina,
    /<style>\{`\$\{historietasThemeCss\}\$\{leitorPageCss\}`\}<\/style>\n\n      <LerCapituloLanguageBridge \/>\n      <style>\{focusBottomNavigationCss\}<\/style>/,
  );
  assert.match(leitorPageCss, /export const leitorPageCss = `/);
  assert.doesNotMatch(leitorPageCss, /focusBottomNavigationCss/);
  assert.doesNotMatch(leitorPageCss, /historietas-bottom-nav-main-border/);
  assert.match(pagina, /const safeTextStyle: CSSProperties = \{/);
  assert.match(pagina, /const isDesktop = useLerCapituloDesktopMode\(\);/);
  assert.match(pagina, /async function enviarComentarioCapitulo\(/);
});
