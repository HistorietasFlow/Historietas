import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const componente = readFileSync(
  new URL(
    "../../app/em-alta/components/em-alta-loading-spinner.tsx",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/em-alta/page.tsx", import.meta.url),
  "utf8",
);
const css = readFileSync(
  new URL("../../app/em-alta/lib/em-alta-page-css.ts", import.meta.url),
  "utf8",
);

test("LoadingSpinner de Em Alta preserva estrutura, acessibilidade e estilos", () => {
  assert.match(componente, /export function LoadingSpinner\(/);
  assert.match(componente, /label\?: string/);
  assert.match(componente, /label = "Carregando"/);
  assert.match(componente, /role="status"/);
  assert.match(componente, /aria-live="polite"/);
  assert.match(componente, /aria-label=\{label\}/);
  assert.match(componente, /className="historietas-loading-spinner"/);
  assert.match(componente, /aria-hidden="true"/);
  assert.match(componente, /const loadingPageStyle: CSSProperties/);
  assert.match(componente, /const loadingSpinnerStyle: CSSProperties/);
  assert.match(componente, /minHeight: "100dvh"/);
  assert.match(componente, /width: "30px"/);
  assert.match(componente, /height: "30px"/);
  assert.match(componente, /border: "3px solid rgba\(255,255,255,0\.20\)"/);
  assert.match(componente, /borderTopColor: "#FFFFFF"/);
  assert.match(
    componente,
    /animation: "historietas-loading-spin 0\.78s linear infinite"/,
  );
  assert.doesNotMatch(componente, /@keyframes|prefers-reduced-motion/);
  assert.match(css, /@keyframes historietas-loading-spin/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});

test("Em Alta mantém o único consumidor no branch de carregamento", () => {
  assert.match(
    pagina,
    /import \{ LoadingSpinner \} from "\.\/components\/em-alta-loading-spinner";/,
  );
  assert.doesNotMatch(pagina, /function LoadingSpinner\(/);
  assert.doesNotMatch(pagina, /const loadingPageStyle: CSSProperties/);
  assert.doesNotMatch(pagina, /const loadingSpinnerStyle: CSSProperties/);
  assert.equal((pagina.match(/<LoadingSpinner\b/g) || []).length, 1);
  assert.match(pagina, /<LoadingSpinner label="Carregando Em Alta" \/>/);
  assert.match(pagina, /if \(carregandoRanking\)/);
  assert.match(
    pagina,
    /<style>\{`\$\{historietasThemeCss\}\$\{emAltaPageCss\}`\}<\/style>\s*<EmAltaLanguageBridge \/>\s*<LoadingSpinner label="Carregando Em Alta" \/>/,
  );
});
