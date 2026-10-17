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
const rankingLoaderFase891 = readFileSync(
  new URL("../../app/em-alta/hooks/use-em-alta-ranking-loader.ts", import.meta.url),
  "utf8",
);
const bridge = readFileSync(
  new URL(
    "../../app/em-alta/components/em-alta-language-bridge.tsx",
    import.meta.url,
  ),
  "utf8",
);
const shell = readFileSync(
  new URL(
    "../../app/em-alta/components/em-alta-page-shell.tsx",
    import.meta.url,
  ),
  "utf8",
);
const decorations = readFileSync(
  new URL(
    "../../app/em-alta/components/em-alta-page-decorations.tsx",
    import.meta.url,
  ),
  "utf8",
);
const rankingCard = readFileSync(
  new URL(
    "../../app/em-alta/components/em-alta-ranking-card.tsx",
    import.meta.url,
  ),
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
    /import \{ EmAltaPageShell \} from "\.\/components\/em-alta-page-shell";/,
  );
  assert.doesNotMatch(pagina, /const emAltaPageCss = `/);
  assert.doesNotMatch(pagina, /import \{ emAltaPageCss \}/);

  const consumidores = shell.match(
    /<style>\{`\$\{historietasThemeCss\}\$\{emAltaPageCss\}`\}<\/style>/g,
  );
  assert.equal(consumidores?.length, 2);
  assert.doesNotMatch(
    shell,
    /\$\{emAltaPageCss\}\$\{historietasThemeCss\}/,
  );

  assert.match(
    pagina,
    /import \{ EmAltaPageDecorations \} from "\.\/components\/em-alta-page-decorations";/,
  );
  assert.match(
    pagina,
    /<EmAltaPageDecorations isDesktop=\{isDesktop\} \/>/,
  );
  assert.match(
    decorations,
    /import \{[\s\S]*?criarDecoracaoPaginaStyle,[\s\S]*?\} from "\.\.\/lib\/em-alta-ranking-visual-style-utils";/,
  );
  assert.match(
    rankingCard,
    /import \{[\s\S]*?cardTopStyle,[\s\S]*?\} from "\.\.\/lib\/em-alta-ranking-visual-style-utils";/,
  );
  assert.doesNotMatch(pagina, /const safeTextStyle: CSSProperties/);
  assert.doesNotMatch(pagina, /\bsafeTextStyle\b/);
  assert.match(
    pagina,
    /import \{ LoadingSpinner \} from "\.\/components\/em-alta-loading-spinner";/,
  );
  assert.doesNotMatch(pagina, /function LoadingSpinner\(/);
  assert.match(
    shell,
    /import \{ EmAltaLanguageBridge \} from "\.\/em-alta-language-bridge";/,
  );
  assert.doesNotMatch(pagina, /EmAltaLanguageBridge/);
  assert.match(bridge, /export function EmAltaLanguageBridge\(\)/);
  assert.equal((shell.match(/<EmAltaLanguageBridge \/>/g) || []).length, 2);
  assert.match(pagina, /if \(carregandoRanking\)/);
  assert.match(pagina, /const isDesktop = useEmAltaDesktopMode\(\);/);
  assert.match(pagina, /useEmAltaRankingLoader\(/);
  assert.match(rankingLoaderFase891, /supabase\.auth\.getUser\(\)/);
});
