import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const cssSource = readFileSync(
  new URL("../../app/listas/lib/listas-page-css.ts", import.meta.url),
  "utf8",
).replace(/\r\n/g, "\n");
const pagina = readFileSync(
  new URL("../../app/listas/page.tsx", import.meta.url),
  "utf8",
).replace(/\r\n/g, "\n");

test("listasPageCss preserva o CSS global crítico de Listas", () => {
  assert.match(cssSource, /export const listasPageCss = `/);
  assert.match(cssSource, /--historietas-list-like-active: #FFFFFF;/);
  assert.match(cssSource, /--historietas-list-diary-rating-muted: rgba\(255,255,255,0\.30\);/);
  assert.match(cssSource, /@keyframes historietas-list-heart-pop/);
  assert.match(cssSource, /@keyframes historietas-list-comments-sheet-up/);
  assert.match(cssSource, /@keyframes historietas-list-highlight/);
  assert.match(cssSource, /@keyframes historietas-list-spin/);
  assert.match(cssSource, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(cssSource, /body,\n  main \{/);
  assert.match(cssSource, /\.historietas-list-row \{/);
  assert.match(cssSource, /\.historietas-list-annotation \{/);
  assert.match(cssSource, /\.historietas-list-row::after \{/);
  assert.match(cssSource, /\.historietas-list-row-highlight \{/);
  assert.match(cssSource, /\.historietas-list-spinner \{/);
  assert.match(cssSource, /animation: historietas-list-spin 0\.75s linear infinite;/);
  assert.match(cssSource, /animation: historietas-list-highlight 2\.4s ease both;/);
  assert.match(cssSource, /@media \(min-width: 760px\)/);
  assert.match(cssSource, /min-height: 108px !important;/);
});

test("Listas consome somente o CSS extraído na ordem original", () => {
  assert.match(
    pagina,
    /import \{ listasPageCss \} from "\.\/lib\/listas-page-css";/,
  );
  assert.doesNotMatch(pagina, /const listasPageCss = `/);
  assert.equal(
    (pagina.match(/<style>\{`\$\{historietasThemeCss\}\$\{listasPageCss\}`\}<\/style>/g) || [])
      .length,
    1,
  );
  assert.doesNotMatch(pagina, /\$\{listasPageCss\}\$\{historietasThemeCss\}/);
  assert.match(pagina, /const pageStyle: CSSProperties = \{/);
  assert.match(pagina, /const commentsSheetStyle: CSSProperties = \{/);
  assert.match(pagina, /const isDesktop = useListasDesktopMode\(\);/);
  assert.match(pagina, /await supabase\.auth\.getUser\(\)/);
  assert.match(pagina, /async function salvarAnotacaoListas\(\)/);
  assert.match(pagina, /async function enviarComentarioAnotacaoListas\(/);
});
