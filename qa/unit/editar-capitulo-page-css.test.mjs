import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pageSource = readFileSync("app/editar-capitulo/page.tsx", "utf8");
const cssSource = readFileSync(
  "app/editar-capitulo/lib/editar-capitulo-page-css.ts",
  "utf8",
);

test("Editar Capítulo delega o CSS estático ao módulo extraído", () => {
  assert.doesNotMatch(pageSource, /const editarCapituloPageCss\s*=/);
  assert.match(
    pageSource,
    /import \{ editarCapituloPageCss \} from "\.\/lib\/editar-capitulo-page-css";/,
  );

  const consumidoresCss = pageSource.match(
    /\$\{historietasThemeCss\}\$\{editarCapituloPageCss\}/g,
  );
  assert.equal(consumidoresCss?.length, 3);
  assert.doesNotMatch(
    pageSource,
    /\$\{editarCapituloPageCss\}\$\{historietasThemeCss\}/,
  );
});

test("módulo de CSS preserva a configuração visual de Editar Capítulo", () => {
  assert.match(cssSource, /^export const editarCapituloPageCss = `/);
  assert.equal((cssSource.match(/^  html \{/gm) || []).length, 2);

  [
    "--historietas-editar-capitulo-bg-page",
    "--historietas-editar-capitulo-bg-deep",
    "--historietas-editar-capitulo-surface",
    "--historietas-editar-capitulo-accent",
    "--historietas-editar-capitulo-danger",
    "--historietas-editar-capitulo-danger-text",
    "--historietas-editar-capitulo-danger-text-soft",
    "--historietas-editar-capitulo-success",
    "data-historietas-tema-visual",
    'href="/painel-autor"',
    ".historietas-bottom-nav-icon",
    "[data-bottom-nav]",
    "[data-mobile-nav]",
    "::placeholder",
    "background:",
    "border:",
    "box-shadow:",
    "opacity:",
    "!important",
  ].forEach((trecho) => assert.ok(cssSource.includes(trecho), trecho));

  assert.doesNotMatch(
    cssSource,
    /^(?:import|.*useEffect|.*supabase|.*localStorage|.*useRouter|.*<\w)/m,
  );
});
