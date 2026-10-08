import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hook = readFileSync(
  new URL(
    "../../app/seguindo/hooks/use-seguindo-sorting-sheet-body-lock.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/seguindo/page.tsx", import.meta.url),
  "utf8",
);

test("hook preserva o lifecycle de lock do painel de ordena\u00e7\u00e3o", () => {
  assert.match(hook, /"use client";/);
  assert.match(
    hook,
    /export function useSeguindoSortingSheetBodyLock\(\s*mostrarPainelOrdenacao: boolean,?\s*\)/,
  );
  assert.match(hook, /useEffect\(\(\) => \{/);
  assert.match(
    hook,
    /if \(!mostrarPainelOrdenacao \|\| typeof document === "undefined"\) \{\s*return;\s*\}/,
  );
  assert.match(hook, /const overflowAnterior = document\.body\.style\.overflow;/);
  assert.match(
    hook,
    /const overscrollAnterior = document\.body\.style\.overscrollBehavior;/,
  );
  assert.match(hook, /document\.body\.style\.overflow = "hidden";/);
  assert.match(hook, /document\.body\.style\.overscrollBehavior = "none";/);
  assert.match(
    hook,
    /return \(\) => \{\s*document\.body\.style\.overflow = overflowAnterior;\s*document\.body\.style\.overscrollBehavior = overscrollAnterior;\s*\};/,
  );
  assert.match(hook, /\}, \[mostrarPainelOrdenacao\]\);/);
  assert.doesNotMatch(hook, /return \{/);
  assert.doesNotMatch(hook, /useState|set[A-Z]/);
});

test("p\u00e1gina delega apenas o lifecycle e mant\u00e9m o painel de ordena\u00e7\u00e3o", () => {
  assert.match(
    pagina,
    /import \{ useSeguindoSortingSheetBodyLock \} from "\.\/hooks\/use-seguindo-sorting-sheet-body-lock";/,
  );
  assert.match(
    pagina,
    /const \[mostrarPainelOrdenacao, setMostrarPainelOrdenacao\] = useState\(false\);/,
  );
  assert.match(
    pagina,
    /useSeguindoSortingSheetBodyLock\(mostrarPainelOrdenacao\);/,
  );
  assert.doesNotMatch(
    pagina,
    /useEffect\(\(\) => \{[\s\S]*?const overflowAnterior = document\.body\.style\.overflow;[\s\S]*?\}, \[mostrarPainelOrdenacao\]\);/,
  );
  assert.match(pagina, /\{mostrarPainelOrdenacao && \(/);
  assert.match(pagina, /style=\{sortingBackdropStyle\}/);
  assert.match(
    pagina,
    /onClick=\{\(\) => setMostrarPainelOrdenacao\(false\)\}/,
  );
  assert.match(pagina, /onClick=\{\(event\) => event\.stopPropagation\(\)\}/);
  assert.match(pagina, /import \{ useCallback, useEffect, useMemo, useState \} from "react";/);
});
