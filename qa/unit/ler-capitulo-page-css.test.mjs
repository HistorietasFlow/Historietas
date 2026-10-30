import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import "./ler-capitulo-comments-styles.test.mjs";
import "./ler-capitulo-layout-styles.test.mjs";
import "./ler-capitulo-comments-sheet.test.mjs";
import "./ler-capitulo-work-normalization.test.mjs";
import "./ler-capitulo-reader-content.test.mjs";
import "./ler-capitulo-comments-read-loader.test.mjs";
import "./ler-capitulo-local-storage.test.mjs";
import "./ler-capitulo-work-read-loader.test.mjs";
import "./ler-capitulo-comment-actions.test.mjs";
import "./ler-capitulo-interaction-actions.test.mjs";
import "./ler-capitulo-reading-progress-action.test.mjs";
import "./ler-capitulo-initial-load.test.mjs";
import "./ler-capitulo-session-preferences.test.mjs";
import "./ler-capitulo-interaction-data.test.mjs";
import "./ler-capitulo-entry-lifecycle.test.mjs";
import "./ler-capitulo-metrics-persistence.test.mjs";
import "./ler-capitulo-social-persistence.test.mjs";

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
const sheet = readFileSync(
  new URL("../../app/ler-capitulo/components/ler-capitulo-comments-sheet.tsx", import.meta.url),
  "utf8",
).replace(/\r\n/g, "\n");
const acoes = readFileSync(
  new URL("../../app/ler-capitulo/lib/ler-capitulo-comment-actions.ts", import.meta.url),
  "utf8",
);
const acesso18 = readFileSync(
  new URL(
    "../../app/ler-capitulo/hooks/use-ler-capitulo-content-18-access.ts",
    import.meta.url,
  ),
  "utf8",
).replace(/\r\n/g, "\n");
const autenticacao = readFileSync(
  new URL(
    "../../app/ler-capitulo/lib/ler-capitulo-auth-actions.ts",
    import.meta.url,
  ),
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
  assert.match(
    pagina,
    /import \{ focusBottomNavigationCss \} from "\.\/lib\/ler-capitulo-focus-bottom-navigation-css";/,
  );
  assert.doesNotMatch(pagina, /const focusBottomNavigationCss = `/);
  assert.match(pagina, /<style>\{focusBottomNavigationCss\}<\/style>/);
  assert.match(pagina, /import \{[\s\S]*?focusPageStyle,[\s\S]*?\} from "\.\/lib\/ler-capitulo-layout-styles";/);
  assert.doesNotMatch(pagina, /const pageStyle: CSSProperties = \{/);
  assert.match(sheet, /import \{[\s\S]*?commentsSheetStyle,[\s\S]*?\} from "\.\.\/lib\/ler-capitulo-comments-styles";/);
  assert.doesNotMatch(pagina, /const commentsSheetStyle: CSSProperties = \{/);
  assert.match(pagina, /const isDesktop = useLerCapituloDesktopMode\(\);/);
  assert.match(pagina, /from "\.\/lib\/ler-capitulo-auth-actions";/);
  assert.match(autenticacao, /await supabase\.auth\.getUser\(\)/);
  assert.match(
    pagina,
    /import \{ useLerCapituloContent18Access \} from "\.\/hooks\/use-ler-capitulo-content-18-access";/,
  );
  assert.match(acesso18, /acessoConteudo18Confirmado\(\)/);
  assert.match(pagina, /criarAcoesComentariosCapitulo\(\{/);
  assert.match(acoes, /async function enviarComentarioCapitulo\(/);
});
