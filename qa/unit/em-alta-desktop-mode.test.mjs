import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hook = readFileSync(
  new URL(
    "../../app/em-alta/hooks/use-em-alta-desktop-mode.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/em-alta/page.tsx", import.meta.url),
  "utf8",
);
const bridge = readFileSync(
  new URL(
    "../../app/em-alta/components/em-alta-language-bridge.tsx",
    import.meta.url,
  ),
  "utf8",
);
const header = readFileSync(
  new URL(
    "../../app/em-alta/components/em-alta-header.tsx",
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
const autorRankingCard = readFileSync(
  new URL(
    "../../app/em-alta/components/em-alta-author-ranking-card.tsx",
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
const rankingSection = readFileSync(
  new URL(
    "../../app/em-alta/components/em-alta-ranking-section.tsx",
    import.meta.url,
  ),
  "utf8",
);
const authorsSection = readFileSync(
  new URL(
    "../../app/em-alta/components/em-alta-authors-ranking-section.tsx",
    import.meta.url,
  ),
  "utf8",
);
const rankingContent = readFileSync(
  new URL(
    "../../app/em-alta/components/em-alta-ranking-content.tsx",
    import.meta.url,
  ),
  "utf8",
);

test("useEmAltaDesktopMode preserva o lifecycle responsivo com timer", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /export function useEmAltaDesktopMode\(\)/);
  assert.match(hook, /const \[isDesktop, setIsDesktop\] = useState\(false\);/);
  assert.match(
    hook,
    /window\.matchMedia\("\(min-width: 1024px\)"\)/,
  );
  assert.match(
    hook,
    /const atualizarModoDesktop = \(\) => \{\s*setIsDesktop\(mediaQuery\.matches\);\s*\};/,
  );
  assert.match(
    hook,
    /const atualizarModoDesktopTimer = window\.setTimeout\(\s*atualizarModoDesktop,\s*0,\s*\);/,
  );
  assert.equal((hook.match(/atualizarModoDesktop\(\);/g) || []).length, 0);
  assert.doesNotMatch(hook, /window\.setTimeout\([^]*?atualizarModoDesktop\(\)/);
  assert.match(
    hook,
    /mediaQuery\.addEventListener\("change", atualizarModoDesktop\);/,
  );
  assert.match(
    hook,
    /window\.clearTimeout\(atualizarModoDesktopTimer\);\s*mediaQuery\.removeEventListener\("change", atualizarModoDesktop\);/,
  );
  assert.match(hook, /mediaQuery\.addListener\(atualizarModoDesktop\);/);
  assert.match(
    hook,
    /window\.clearTimeout\(atualizarModoDesktopTimer\);\s*mediaQuery\.removeListener\(atualizarModoDesktop\);/,
  );
  assert.match(hook, /useEffect\(\(\) => \{[^]*?\}, \[\]\);/);
  assert.match(hook, /return isDesktop;/);
  assert.doesNotMatch(hook, /return \{[^]*?setIsDesktop/);
});

test("Em Alta delega somente o modo desktop e preserva suas fronteiras", () => {
  assert.match(
    pagina,
    /import \{ useEmAltaDesktopMode \} from "\.\/hooks\/use-em-alta-desktop-mode";/,
  );
  assert.match(pagina, /const isDesktop = useEmAltaDesktopMode\(\);/);
  assert.doesNotMatch(
    pagina,
    /const \[isDesktop, setIsDesktop\] = useState\(false\);/,
  );
  assert.doesNotMatch(pagina, /setIsDesktop/);
  assert.doesNotMatch(
    pagina,
    /window\.matchMedia\("\(min-width: 1024px\)"\)/,
  );
  assert.doesNotMatch(pagina, /atualizarModoDesktopTimer/);
  assert.equal((pagina.match(/\bisDesktop\b/g) || []).length, 8);
  assert.equal((header.match(/\bisDesktop\b/g) || []).length, 6);
  assert.equal((decorations.match(/\bisDesktop\b/g) || []).length, 4);
  assert.match(
    pagina,
    /<EmAltaHeader isDesktop=\{isDesktop\} titulo=\{tituloCabecalho\} \/>/,
  );
  assert.match(
    pagina,
    /<EmAltaPageDecorations isDesktop=\{isDesktop\} \/>/,
  );
  assert.match(
    decorations,
    /\{isDesktop && <div style=\{desktopTopWaterFadeStyle\} aria-hidden="true" \/>\}/,
  );
  assert.match(
    decorations,
    /\{!isDesktop && <div style=\{mobileTopWaterFadeStyle\} aria-hidden="true" \/>\}/,
  );
  assert.equal((rankingContent.match(/\bisDesktop\b/g) || []).length, 20);
  assert.equal((rankingSection.match(/\bisDesktop\b/g) || []).length, 13);
  assert.equal((authorsSection.match(/\bisDesktop\b/g) || []).length, 13);
  assert.equal((autorRankingCard.match(/\bisDesktop\b/g) || []).length, 5);
  assert.equal((rankingCard.match(/\bisDesktop\b/g) || []).length, 7);

  assert.match(pagina, /async function carregarRanking\(\)/);
  assert.match(pagina, /supabase\.auth\.getUser\(\)/);
  assert.match(pagina, /localStorage\.getItem/);
  assert.match(
    pagina,
    /import \{ EmAltaLanguageBridge \} from "\.\/components\/em-alta-language-bridge";/,
  );
  assert.doesNotMatch(pagina, /function EmAltaLanguageBridge\(\)/);
  assert.match(bridge, /export function EmAltaLanguageBridge\(\)/);
  assert.match(
    pagina,
    /import \{ LoadingSpinner \} from "\.\/components\/em-alta-loading-spinner";/,
  );
  assert.doesNotMatch(pagina, /function LoadingSpinner\(/);
  assert.match(
    pagina,
    /import \{ EmAltaRankingContent \} from "\.\/components\/em-alta-ranking-content";/,
  );
  assert.match(
    pagina,
    /<EmAltaRankingContent[\s\S]*?isDesktop=\{isDesktop\}/,
  );
  assert.match(
    rankingContent,
    /import \{ RankingSection \} from "\.\/em-alta-ranking-section";/,
  );
  assert.match(
    rankingContent,
    /import \{ AutoresEmAltaSection \} from "\.\/em-alta-authors-ranking-section";/,
  );
  assert.doesNotMatch(pagina, /function RankingSection\(/);
  assert.doesNotMatch(pagina, /function AutoresEmAltaSection\(/);
});
