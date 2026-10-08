import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const componente = readFileSync(
  new URL(
    "../../app/ler-capitulo/components/ler-capitulo-loading-spinner.tsx",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/ler-capitulo/page.tsx", import.meta.url),
  "utf8",
);
const cssLeitor = readFileSync(
  new URL("../../app/ler-capitulo/lib/ler-capitulo-page-css.ts", import.meta.url),
  "utf8",
);

test("LoadingSpinner preserva os dois modos, props e semântica acessível", () => {
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

test("LoadingSpinner preserva literalmente os estilos exclusivos", () => {
  assert.match(componente, /const loadingPageStyle: CSSProperties = \{/);
  assert.match(componente, /minHeight: "100dvh"/);
  assert.match(componente, /const loadingInlineStyle: CSSProperties = \{/);
  assert.match(componente, /display: "inline-flex"/);
  assert.match(componente, /verticalAlign: "middle"/);
  assert.match(componente, /const loadingSpinnerStyle: CSSProperties = \{/);
  assert.match(
    componente,
    /animation: "historietas-loading-spin 0\.78s linear infinite"/,
  );
  assert.match(componente, /const loadingSpinnerCompactStyle: CSSProperties = \{/);
  assert.match(componente, /\.\.\.loadingSpinnerStyle,/);
  assert.match(componente, /borderWidth: "2px"/);
  assert.doesNotMatch(componente, /@keyframes historietas-loading-spin/);
  assert.match(cssLeitor, /@keyframes historietas-loading-spin/);
  assert.match(cssLeitor, /\.historietas-loading-spinner/);
});

test("Leitor delega somente os quatro spinners e preserva consumidores", () => {
  assert.match(
    pagina,
    /import \{ LoadingSpinner \} from "\.\/components\/ler-capitulo-loading-spinner";/,
  );
  assert.doesNotMatch(pagina, /function LoadingSpinner\(/);
  assert.doesNotMatch(pagina, /const loadingPageStyle: CSSProperties/);
  assert.doesNotMatch(pagina, /const loadingInlineStyle: CSSProperties/);
  assert.doesNotMatch(pagina, /const loadingSpinnerStyle: CSSProperties/);
  assert.doesNotMatch(pagina, /const loadingSpinnerCompactStyle: CSSProperties/);
  assert.equal((pagina.match(/<LoadingSpinner/g) || []).length, 4);
  assert.equal((pagina.match(/compacto/g) || []).length, 2);
  assert.match(pagina, /<LoadingSpinner label="Carregando capítulo" \/>/);
  assert.match(pagina, /<LoadingSpinner label="Verificando acesso" \/>/);
  assert.match(
    pagina,
    /<LoadingSpinner\s+compacto\s+label="Carregando comentários"\s+\/>/,
  );
  assert.match(
    pagina,
    /<LoadingSpinner\s+compacto\s+label="Enviando comentário"\s+\/>/,
  );
});
