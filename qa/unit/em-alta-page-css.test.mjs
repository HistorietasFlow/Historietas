import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const css = readFileSync(
  new URL("../../app/em-alta/lib/em-alta-page-css.ts", import.meta.url),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/em-alta/page.tsx", import.meta.url),
  "utf8",
);

test("emAltaPageCss preserva o CSS global de Em Alta", () => {
  assert.match(css, /export const emAltaPageCss = `/);
  assert.match(css, /@keyframes historietas-loading-spin/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /--historietas-em-alta-/);

  for (const nivel of ["diamante", "rubi", "ouro", "prata", "bronze"]) {
    assert.match(css, new RegExp(`data-ranking-level=\\"${nivel}\\"`));
  }

  assert.match(css, /\.historietas-ranking-level-line/);
  assert.match(css, /\.historietas-em-alta-hero-title/);
  assert.match(css, /nav a\[href="\/em-alta"\]/);
  assert.match(css, /\[data-bottom-nav\]/);
  assert.match(css, /\[data-mobile-nav\]/);
  assert.match(css, /::placeholder/);
  assert.match(css, /input,\s*textarea,\s*select/);
});

test("Em Alta mantém os mounts e as fronteiras fora do CSS extraído", () => {
  assert.match(
    pagina,
    /import \{ emAltaPageCss \} from "\.\/lib\/em-alta-page-css";/,
  );
  assert.doesNotMatch(pagina, /const emAltaPageCss = `/);

  const consumidores = pagina.match(
    /<style>\{`\$\{historietasThemeCss\}\$\{emAltaPageCss\}`\}<\/style>/g,
  );
  assert.equal(consumidores?.length, 2);
  assert.doesNotMatch(
    pagina,
    /\$\{emAltaPageCss\}\$\{historietasThemeCss\}/,
  );

  assert.match(pagina, /const safeTextStyle: CSSProperties/);
  assert.match(
    pagina,
    /import \{ LoadingSpinner \} from "\.\/components\/em-alta-loading-spinner";/,
  );
  assert.doesNotMatch(pagina, /function LoadingSpinner\(/);
  assert.match(pagina, /function EmAltaLanguageBridge\(\)/);
  assert.equal((pagina.match(/<EmAltaLanguageBridge \/>/g) || []).length, 2);
  assert.match(pagina, /if \(carregandoRanking\)/);
  assert.match(pagina, /const isDesktop = useEmAltaDesktopMode\(\);/);
  assert.match(pagina, /async function carregarRanking\(\)/);
  assert.match(pagina, /supabase\.auth\.getUser\(\)/);
});
