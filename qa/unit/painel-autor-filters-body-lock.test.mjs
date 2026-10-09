import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hook = readFileSync(
  new URL(
    "../../app/painel-autor/hooks/use-painel-autor-filters-body-lock.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/painel-autor/page.tsx", import.meta.url),
  "utf8",
);

test("usePainelAutorFiltersBodyLock preserva o lifecycle do painel de filtros", () => {
  assert.match(hook, /^"use client";/);
  assert.match(
    hook,
    /export function usePainelAutorFiltersBodyLock\(\s*mostrarFiltrosPainel: boolean,?\s*\)/,
  );
  assert.match(hook, /useEffect\(\(\) => \{/);
  assert.match(
    hook,
    /if \(!mostrarFiltrosPainel\) \{\s*return;\s*\}/,
  );
  assert.match(
    hook,
    /const overflowAnterior = document\.body\.style\.getPropertyValue\("overflow"\);/,
  );
  assert.match(
    hook,
    /const overscrollAnterior = document\.documentElement\.style\.getPropertyValue\(\s*"overscroll-behavior",?\s*\);/,
  );
  assert.match(
    hook,
    /document\.body\.style\.setProperty\("overflow", "hidden"\);/,
  );
  assert.match(
    hook,
    /document\.documentElement\.style\.setProperty\("overscroll-behavior", "none"\);/,
  );
  assert.match(
    hook,
    /if \(overflowAnterior\) \{\s*document\.body\.style\.setProperty\("overflow", overflowAnterior\);\s*\} else \{\s*document\.body\.style\.removeProperty\("overflow"\);\s*\}/,
  );
  assert.match(
    hook,
    /if \(overscrollAnterior\) \{\s*document\.documentElement\.style\.setProperty\(\s*"overscroll-behavior",\s*overscrollAnterior,?\s*\);\s*\} else \{\s*document\.documentElement\.style\.removeProperty\("overscroll-behavior"\);\s*\}/,
  );
  assert.match(hook, /\}, \[mostrarFiltrosPainel\]\);/);
  assert.doesNotMatch(hook, /return \{/);
  assert.doesNotMatch(hook, /useState/);
});

test("Painel do Autor delega somente o body lock e preserva o painel", () => {
  assert.match(
    pagina,
    /import \{ usePainelAutorFiltersBodyLock \} from "\.\/hooks\/use-painel-autor-filters-body-lock";/,
  );
  assert.match(
    pagina,
    /usePainelAutorFiltersBodyLock\(mostrarFiltrosPainel\);/,
  );
  assert.equal(
    (
      pagina.match(
        /document\.body\.style\.getPropertyValue\("overflow"\)/g,
      ) || []
    ).length,
    1,
  );
  assert.match(
    pagina,
    /const \[mostrarFiltrosPainel, setMostrarFiltrosPainel\] = useState\(false\);/,
  );
  assert.match(pagina, /\{mostrarFiltrosPainel && \(/);
  assert.match(pagina, /onClick=\{\(\) => setMostrarFiltrosPainel\(false\)\}/);
  assert.match(pagina, /stopPropagation\(\)/);
  assert.match(pagina, /const \[filtro, setFiltro\] = useState<FiltroPainel>/);
  assert.match(pagina, /const \[ordenacao, setOrdenacao\] = useState<OrdenacaoPainel>/);
  assert.match(pagina, /supabase\.auth\.getUser\(\)/);
  assert.match(pagina, /async function carregarDadosPainelAutor\(\)/);
  assert.match(pagina, /import \{ useEffect, useMemo, useState \} from "react";/);
});
