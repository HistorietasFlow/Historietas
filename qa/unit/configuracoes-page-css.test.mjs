import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const css = readFileSync(
  new URL("../../app/configuracoes/lib/configuracoes-page-css.ts", import.meta.url),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/configuracoes/page.tsx", import.meta.url),
  "utf8",
);

test("configuracoesPageCss preserva as regras globais de Configurações", () => {
  assert.match(css, /export const configuracoesPageCss = `/);
  assert.match(css, /--configuracoes-page-bg: #000000;/);
  assert.match(css, /--historietas-input-text: #FFFFFF;/);
  assert.match(css, /html body,\s*html main/);
  assert.match(css, /\.configuracoes-input::placeholder/);
  assert.match(css, /\.configuracoes-input-transparente/);
  assert.match(css, /\.configuracoes-theme-swatch/);
  assert.match(css, /\[data-tema-visual-opcao="foco"\]/);
  assert.match(css, /@keyframes historietas-loading-spin/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /\.historietas-loading-spinner/);
  assert.match(css, /::-webkit-search-cancel-button/);
});

test("Configurações mantém os dois consumidores e suas fronteiras", () => {
  assert.match(
    pagina,
    /import \{ configuracoesPageCss \} from "\.\/lib\/configuracoes-page-css";/,
  );
  assert.doesNotMatch(pagina, /const configuracoesPageCss = `/);

  const consumidores = pagina.match(
    /<style>\{`\$\{historietasThemeCss\}\$\{configuracoesPageCss\}`\}<\/style>/g,
  );
  assert.equal(consumidores?.length, 2);
  assert.doesNotMatch(
    pagina,
    /\$\{configuracoesPageCss\}\$\{historietasThemeCss\}/,
  );
  assert.match(pagina, /const safeTextStyle: CSSProperties =/);
  assert.match(pagina, /function LoadingSpinner\(/);
  assert.match(pagina, /if \(verificandoAcesso\) \{/);
  assert.match(pagina, /useEffect\(/);
});
