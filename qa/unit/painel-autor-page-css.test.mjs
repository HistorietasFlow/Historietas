import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const css = readFileSync(
  new URL(
    "../../app/painel-autor/lib/painel-autor-page-css.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/painel-autor/page.tsx", import.meta.url),
  "utf8",
);

test("painelAutorPageCss preserva o CSS global do Painel do Autor", () => {
  assert.match(css, /export const painelAutorPageCss = `/);
  assert.match(css, /@keyframes historietas-loading-spin/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /--historietas-painel-bg/);
  assert.match(css, /nav a\[href="\/painel-autor"\]/);
  assert.match(css, /nav a\[href="\/painel"\]/);
  assert.match(css, /\[data-bottom-nav\]/);
  assert.match(css, /\[data-mobile-nav\]/);
  assert.match(css, /a\[href="\/publicar"\]/);
  assert.match(css, /input::placeholder/);
  assert.match(css, /\] input,\s*html\[data-historietas-tema-visual\] textarea,/);
  assert.match(css, /button:disabled/);
});

test("Painel do Autor mantém os mounts e as fronteiras fora do CSS extraído", () => {
  assert.match(
    pagina,
    /import \{ painelAutorPageCss \} from "\.\/lib\/painel-autor-page-css";/,
  );
  assert.doesNotMatch(pagina, /const painelAutorPageCss = `/);

  const consumidores = pagina.match(
    /<style>\{`\$\{historietasThemeCss\}\$\{painelAutorPageCss\}`\}<\/style>/g,
  );
  assert.equal(consumidores?.length, 2);
  assert.doesNotMatch(
    pagina,
    /\$\{painelAutorPageCss\}\$\{historietasThemeCss\}/,
  );

  assert.match(pagina, /const safeTextStyle: CSSProperties/);
  assert.match(
    pagina,
    /import \{ LoadingSpinner \} from "\.\/components\/painel-autor-loading-spinner";/,
  );
  assert.doesNotMatch(pagina, /function LoadingSpinner\(/);
  assert.match(
    pagina,
    /import \{ PainelAutorLanguageBridge \} from "\.\/components\/painel-autor-language-bridge";/,
  );
  assert.match(pagina, /const isDesktop = usePainelAutorDesktopMode\(\);/);
  assert.match(pagina, /async function carregarDadosPainelAutor\(\)/);
  assert.match(pagina, /supabase\.auth\.getUser\(\)/);
});
