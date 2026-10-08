import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const componente = readFileSync(
  new URL(
    "../../app/seguindo/components/seguindo-loading-spinner.tsx",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/seguindo/page.tsx", import.meta.url),
  "utf8",
);
const cssSeguindo = readFileSync(
  new URL("../../app/seguindo/lib/seguindo-page-css.ts", import.meta.url),
  "utf8",
);

test("LoadingSpinner de Seguindo preserva os dois modos, props e ARIA", () => {
  assert.match(componente, /export function LoadingSpinner\(/);
  assert.match(componente, /label = "Carregando"/);
  assert.match(componente, /compacto = false/);
  assert.match(componente, /if \(compacto\) \{/);
  assert.match(
    componente,
    /<span\s+role="status"\s+aria-live="polite"\s+aria-label=\{label\}\s+style=\{loadingInlineStyle\}/,
  );
  assert.match(
    componente,
    /<div\s+role="status"\s+aria-live="polite"\s+aria-label=\{label\}\s+style=\{loadingPageStyle\}/,
  );
  assert.equal(
    (componente.match(/className="historietas-loading-spinner"/g) || []).length,
    2,
  );
  assert.equal(
    (componente.match(/aria-hidden="true"/g) || []).length,
    2,
  );
});

test("LoadingSpinner de Seguindo preserva os estilos exclusivos e o CSS global", () => {
  assert.match(componente, /const loadingPageStyle: CSSProperties = \{/);
  assert.match(componente, /minHeight: "100dvh"/);
  assert.match(componente, /zIndex: 2/);
  assert.match(componente, /const loadingInlineStyle: CSSProperties = \{/);
  assert.match(componente, /minHeight: "62px"/);
  assert.match(componente, /display: "inline-flex"/);
  assert.match(componente, /const loadingSpinnerStyle: CSSProperties = \{/);
  assert.match(
    componente,
    /animation: "historietas-loading-spin 0\.78s linear infinite"/,
  );
  assert.match(componente, /const loadingSpinnerCompactStyle: CSSProperties = \{/);
  assert.match(componente, /\.\.\.loadingSpinnerStyle,/);
  assert.match(componente, /borderWidth: "2\.5px"/);
  assert.doesNotMatch(componente, /@keyframes historietas-loading-spin/);
  assert.match(cssSeguindo, /@keyframes historietas-loading-spin/);
  assert.match(cssSeguindo, /\.historietas-loading-spinner/);
});

test("Seguindo delega somente os dois spinners e preserva labels", () => {
  assert.match(
    pagina,
    /import \{ LoadingSpinner \} from "\.\/components\/seguindo-loading-spinner";/,
  );
  assert.doesNotMatch(pagina, /function LoadingSpinner\(/);
  assert.doesNotMatch(pagina, /const loadingPageStyle: CSSProperties/);
  assert.doesNotMatch(pagina, /const loadingInlineStyle: CSSProperties/);
  assert.doesNotMatch(pagina, /const loadingSpinnerStyle: CSSProperties/);
  assert.doesNotMatch(pagina, /const loadingSpinnerCompactStyle: CSSProperties/);
  assert.equal((pagina.match(/<LoadingSpinner/g) || []).length, 2);
  assert.equal((pagina.match(/compacto/g) || []).length, 1);
  assert.match(pagina, /<LoadingSpinner label="Carregando seguindo" \/>/);
  assert.match(
    pagina,
    /<LoadingSpinner\s+compacto\s+label="Carregando sugestões para seguir"\s+\/>/,
  );
});
