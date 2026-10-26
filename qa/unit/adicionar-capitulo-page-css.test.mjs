import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const cssSource = readFileSync(
  new URL(
    "../../app/adicionar-capitulo/lib/adicionar-capitulo-page-css.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/adicionar-capitulo/page.tsx", import.meta.url),
  "utf8",
);

test("CSS global de Adicionar Capítulo preserva seletores, variáveis e regras duplicadas", () => {
  assert.match(cssSource, /export const adicionarCapituloPageCss = `/);
  assert.match(cssSource, /html \{/);
  assert.match(cssSource, /body,\s*\r?\n\s*main \{/);
  assert.match(cssSource, /input::placeholder,/);
  assert.match(cssSource, /textarea::placeholder/);
  assert.match(cssSource, /nav,/);
  assert.match(cssSource, /a\[href="\/painel-autor"\]/);
  assert.match(cssSource, /\.historietas-bottom-nav-icon/);
  assert.match(cssSource, /--historietas-adicionar-capitulo-bg-page/);
  assert.match(cssSource, /--historietas-adicionar-capitulo-accent/);
  assert.match(cssSource, /--historietas-adicionar-capitulo-danger/);
  assert.match(cssSource, /--historietas-adicionar-capitulo-success/);
  assert.match(cssSource, /background: #000000 !important/);
  assert.match(cssSource, /color: #FFFFFF !important/);
  assert.equal(
    (cssSource.match(/nav a\[href="\/painel-autor"\],/g) || []).length,
    2,
  );
  assert.equal(
    (cssSource.match(/nav a\[href="\/painel-autor"\] \.historietas-bottom-nav-icon,/g) || [])
      .length,
    2,
  );
});

test("Adicionar Capítulo consome o CSS global extraído sem alterar os três estilos", () => {
  assert.doesNotMatch(pageSource, /const adicionarCapituloPageCss\s*=/);
  assert.match(
    pageSource,
    /import \{\s*adicionarCapituloPageCss,\s*\} from "\.\/lib\/adicionar-capitulo-page-css";/,
  );
  assert.equal(
    (
      pageSource.match(
        /\$\{historietasThemeCss\}\$\{adicionarCapituloPageCss\}/g,
      ) || []
    ).length,
    3,
  );
});

test("módulo de CSS global de Adicionar Capítulo permanece isolado", () => {
  assert.doesNotMatch(
    cssSource,
    /from\s+["']react["']|useState|useEffect|useMemo|useRef|supabase|localStorage|router/i,
  );
});
