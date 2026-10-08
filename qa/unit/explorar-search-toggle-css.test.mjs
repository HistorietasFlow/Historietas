import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const css = readFileSync(
  new URL(
    "../../app/explorar/lib/explorar-search-toggle-css.ts",
    import.meta.url,
  ),
  "utf8",
).replace(/\r\n/g, "\n");
const pagina = readFileSync(
  new URL("../../app/explorar/page.tsx", import.meta.url),
  "utf8",
);
const pageCss = readFileSync(
  new URL("../../app/explorar/lib/explorar-page-css.ts", import.meta.url),
  "utf8",
);

test("explorarBuscaToggleCss preserva literalmente as regras exclusivas de busca", () => {
  assert.equal(
    css,
    `export const explorarBuscaToggleCss = \`
  button[aria-label="Abrir busca"],
  button[aria-label="Fechar busca"],
  button[aria-label="Abrir busca"]:hover,
  button[aria-label="Fechar busca"]:hover,
  button[aria-label="Abrir busca"]:active,
  button[aria-label="Fechar busca"]:active,
  button[aria-label="Abrir busca"]:focus,
  button[aria-label="Fechar busca"]:focus,
  button[aria-label="Abrir busca"]:focus-visible,
  button[aria-label="Fechar busca"]:focus-visible {
    background: transparent !important;
    border: 0 !important;
    box-shadow: none !important;
    outline: none !important;
    filter: none !important;
    backdrop-filter: none !important;
    -webkit-tap-highlight-color: transparent !important;
  }

  input[placeholder="Buscar histórias..."],
  input[placeholder="Buscar histórias..."]:hover,
  input[placeholder="Buscar histórias..."]:focus,
  input[placeholder="Buscar histórias..."]:focus-visible,
  input[placeholder="Buscar autores..."],
  input[placeholder="Buscar autores..."]:hover,
  input[placeholder="Buscar autores..."]:focus,
  input[placeholder="Buscar autores..."]:focus-visible {
    box-shadow: none !important;
    outline: none !important;
    filter: none !important;
    backdrop-filter: none !important;
  }
\`;
`,
  );
});

test("Explorar mantém o único consumidor e as fronteiras da busca", () => {
  assert.match(
    pagina,
    /import \{ explorarBuscaToggleCss \} from "\.\/lib\/explorar-search-toggle-css";/,
  );
  assert.doesNotMatch(pagina, /const explorarBuscaToggleCss = `/);
  assert.equal(
    (pagina.match(/<style>\{explorarBuscaToggleCss\}<\/style>/g) || []).length,
    1,
  );

  const inicioLoading = pagina.indexOf("if (!dadosExplorarCarregados) {");
  const fimLoading = pagina.indexOf("return (", inicioLoading);
  assert.doesNotMatch(
    pagina.slice(inicioLoading, fimLoading),
    /explorarBuscaToggleCss/,
  );

  assert.match(
    pageCss,
    /export const themePageCss = `/,
  );
  assert.match(
    pagina,
    /import \{ themePageCss \} from "\.\/lib\/explorar-page-css";/,
  );
  assert.match(
    pagina,
    /import \{ LoadingSpinner \} from "\.\/components\/explorar-loading-spinner";/,
  );
  assert.match(
    pagina,
    /import \{ useExplorarDesktopMode \} from "\.\/hooks\/use-explorar-desktop-mode";/,
  );
  assert.match(
    pagina,
    /import \{ useExplorarAdvancedFiltersBodyLock \} from "\.\/hooks\/use-explorar-advanced-filters-body-lock";/,
  );
  assert.match(pagina, /const safeTextStyle: CSSProperties/);
  assert.match(pagina, /const \[busca, setBusca\] = useState\(""\);/);
  assert.match(
    pagina,
    /const \[buscaMobileAberta, setBuscaMobileAberta\] = useState\(false\);/,
  );
  assert.match(pagina, /async function carregarExplorar\(\)/);
  assert.match(pagina, /supabase\.auth\.getUser\(\)/);
  assert.match(pagina, /listarSelecaoCatalogo/);
});
