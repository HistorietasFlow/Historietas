import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const componente = readFileSync(
  new URL(
    "../../app/painel-autor/components/painel-autor-loading-spinner.tsx",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/painel-autor/page.tsx", import.meta.url),
  "utf8",
);
const cssGlobal = readFileSync(
  new URL(
    "../../app/painel-autor/lib/painel-autor-page-css.ts",
    import.meta.url,
  ),
  "utf8",
);

test("LoadingSpinner preserva a estrutura, acessibilidade e estilos", () => {
  assert.match(componente, /export function LoadingSpinner\(/);
  assert.match(componente, /label = "Carregando"/);
  assert.match(componente, /<div/);
  assert.match(componente, /role="status"/);
  assert.match(componente, /aria-live="polite"/);
  assert.match(componente, /aria-label=\{label\}/);
  assert.match(componente, /className="historietas-loading-spinner"/);
  assert.match(componente, /aria-hidden="true"/);
  assert.match(componente, /const loadingPageStyle: CSSProperties/);
  assert.match(componente, /const loadingSpinnerStyle: CSSProperties/);
  assert.match(
    componente,
    /animation: "historietas-loading-spin 0\.78s linear infinite"/,
  );
  assert.doesNotMatch(componente, /@keyframes historietas-loading-spin/);
  assert.match(cssGlobal, /@keyframes historietas-loading-spin/);
  assert.match(cssGlobal, /prefers-reduced-motion/);
});

test("Painel do Autor mantém o único consumidor e as fronteiras", () => {
  assert.match(
    pagina,
    /import \{ LoadingSpinner \} from "\.\/components\/painel-autor-loading-spinner";/,
  );
  assert.doesNotMatch(pagina, /function LoadingSpinner\(/);
  assert.doesNotMatch(pagina, /const loadingPageStyle: CSSProperties/);
  assert.doesNotMatch(pagina, /const loadingSpinnerStyle: CSSProperties/);
  assert.equal(
    (pagina.match(/<LoadingSpinner label="Carregando Painel do Autor" \/>/g) || [])
      .length,
    1,
  );
  assert.match(
    pagina,
    /if \(verificandoUsuario \|\| !usuarioLogado \|\| carregandoDados\)/,
  );
  assert.match(pagina, /function PainelAutorLanguageBridge\(\)/);
  assert.match(pagina, /const isDesktop = usePainelAutorDesktopMode\(\);/);
  assert.match(pagina, /supabase\.auth\.getUser\(\)/);
});
