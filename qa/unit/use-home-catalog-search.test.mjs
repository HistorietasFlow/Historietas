import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hook = readFileSync(
  new URL("../../app/hooks/use-home-catalog-search.ts", import.meta.url),
  "utf8",
);
const pagina = readFileSync(new URL("../../app/page.tsx", import.meta.url), "utf8");

test("useHomeCatalogSearch preserva o lifecycle de busca do catálogo", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /import \{ useEffect, useRef \} from "react";/);
  assert.match(hook, /const consultaCatalogoHomeRef = useRef\(0\);/);
  assert.match(hook, /const buscaCatalogoHomeAtivaRef = useRef\(false\);/);
  assert.match(hook, /if \(!dadosHomeCarregados\) \{\s*return;\s*\}/);
  assert.match(hook, /const buscaAtiva = Boolean\(termoBusca\);/);
  assert.match(
    hook,
    /if \(!buscaAtiva && !buscaCatalogoHomeAtivaRef\.current\) \{\s*return;\s*\}/,
  );
  assert.match(hook, /buscaCatalogoHomeAtivaRef\.current = buscaAtiva;/);
  assert.match(
    hook,
    /const numeroConsulta = consultaCatalogoHomeRef\.current \+ 1;\s*consultaCatalogoHomeRef\.current = numeroConsulta;/,
  );
  assert.match(hook, /ordenacao: "relevancia",\s*limite: 50,/);
  assert.match(hook, /: CONSULTAS_INICIAIS_CATALOGO_HOME;/);
  assert.match(
    hook,
    /await carregarObrasSupabaseHome\(\s*obrasCacheLocalHomeRef\.current,\s*usuarioIdLogado,\s*consultas,\s*\);/,
  );
  assert.match(
    hook,
    /if \(!cancelado && consultaCatalogoHomeRef\.current === numeroConsulta\) \{\s*setObrasLocais\(obras\);\s*\}/,
  );
  assert.match(hook, /\}, 350\);/);
  assert.match(
    hook,
    /return \(\) => \{\s*cancelado = true;\s*window\.clearTimeout\(timer\);\s*\};/,
  );
  assert.match(
    hook,
    /\}, \[dadosHomeCarregados, termoBusca, usuarioIdLogado\]\);/,
  );
  assert.doesNotMatch(hook, /\.insert\(|\.update\(|\.delete\(|localStorage/);
});

test("Home consome o hook sem reter o lifecycle de busca anterior", () => {
  assert.match(pagina, /import useHomeCatalogSearch from "\.\/hooks\/use-home-catalog-search";/);
  assert.match(
    pagina,
    /useHomeCatalogSearch\(\{[\s\S]*?dadosHomeCarregados,[\s\S]*?termoBusca,[\s\S]*?usuarioIdLogado,[\s\S]*?obrasCacheLocalHomeRef,[\s\S]*?setObrasLocais,[\s\S]*?\}\);/,
  );
  assert.doesNotMatch(pagina, /consultaCatalogoHomeRef|buscaCatalogoHomeAtivaRef/);
  assert.doesNotMatch(pagina, /CONSULTAS_INICIAIS_CATALOGO_HOME/);
  assert.doesNotMatch(pagina, /carregarObrasSupabaseHome/);
});
