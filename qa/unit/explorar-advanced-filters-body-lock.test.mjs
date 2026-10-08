import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hook = readFileSync(
  new URL(
    "../../app/explorar/hooks/use-explorar-advanced-filters-body-lock.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/explorar/page.tsx", import.meta.url),
  "utf8",
);

test("useExplorarAdvancedFiltersBodyLock preserva o lifecycle do body lock", () => {
  assert.match(hook, /^"use client";/);
  assert.match(
    hook,
    /export function useExplorarAdvancedFiltersBodyLock\(\s*mostrarFiltrosAvancados: boolean,?\s*\)/,
  );
  assert.match(hook, /useEffect\(\(\) => \{/);
  assert.match(
    hook,
    /if \(!mostrarFiltrosAvancados \|\| typeof document === "undefined"\) \{\s*return;\s*\}/,
  );
  assert.match(
    hook,
    /const bodyOverflowAnterior = document\.body\.style\.overflow;/,
  );
  assert.match(
    hook,
    /const htmlOverflowAnterior = document\.documentElement\.style\.overflow;/,
  );
  assert.match(hook, /document\.body\.style\.overflow = "hidden";/);
  assert.match(
    hook,
    /document\.documentElement\.style\.overflow = "hidden";/,
  );
  assert.match(
    hook,
    /document\.body\.style\.overflow = bodyOverflowAnterior;/,
  );
  assert.match(
    hook,
    /document\.documentElement\.style\.overflow = htmlOverflowAnterior;/,
  );
  assert.match(hook, /\}, \[mostrarFiltrosAvancados\]\);/);
  assert.doesNotMatch(hook, /return \{/);
});

test("Explorar delega somente o body lock e preserva o painel e fronteiras", () => {
  assert.match(
    pagina,
    /import \{ useExplorarAdvancedFiltersBodyLock \} from "\.\/hooks\/use-explorar-advanced-filters-body-lock";/,
  );
  assert.match(
    pagina,
    /useExplorarAdvancedFiltersBodyLock\(mostrarFiltrosAvancados\);/,
  );
  assert.doesNotMatch(
    pagina,
    /useEffect\(\(\) => \{[\s\S]*?mostrarFiltrosAvancados[\s\S]*?document\.body\.style\.overflow = "hidden"/,
  );
  assert.match(
    pagina,
    /const \[mostrarFiltrosAvancados, setMostrarFiltrosAvancados\] = useState\(false\);/,
  );
  assert.match(pagina, /\{mostrarFiltrosAvancados && \(/);
  assert.match(pagina, /setMostrarFiltrosAvancados\(false\)/);
  assert.match(pagina, /stopPropagation\(\)/);
  assert.match(
    pagina,
    /const \[mostrarConfirmacaoConteudo18, setMostrarConfirmacaoConteudo18\]/,
  );
  assert.match(
    pagina,
    /const \[confirmouIdadeConteudo18, setConfirmouIdadeConteudo18\]/,
  );
  assert.match(
    pagina,
    /import \{ Children, useEffect, useMemo, useRef, useState \} from "react";/,
  );
  assert.match(pagina, /async function carregarExplorar\(\)/);
  assert.match(pagina, /supabase\.auth\.getUser\(\)/);
  assert.match(pagina, /listarSelecaoCatalogo/);
});
