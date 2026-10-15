import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hook = readFileSync(
  new URL("../../app/hooks/use-home-initial-data.ts", import.meta.url),
  "utf8",
);
const pagina = readFileSync(new URL("../../app/page.tsx", import.meta.url), "utf8");

test("useHomeInitialData preserva estados, timer e lifecycle inicial da Home", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /import \{ useEffect, useState \} from "react";/);
  assert.match(
    hook,
    /export default function useHomeInitialData\(\s*usuarioIdLogado: string,\s*obrasCacheLocalHomeRef: MutableRefObject<ObrasLocaisHome>/,
  );
  assert.match(hook, /const \[obrasLocais, setObrasLocais\] = useState<ObrasLocaisHome>\(\[\]\);/);
  assert.match(hook, /const \[obrasFavoritas, setObrasFavoritas\] = useState<string\[\]>\(\[\]\);/);
  assert.match(hook, /const \[perfisAutores, setPerfisAutores\] = useState<PerfisAutoresSalvos>\(\{\}\);/);
  assert.match(hook, /const \[dadosHomeCarregados, setDadosHomeCarregados\] = useState\(false\);/);
  assert.match(hook, /let cancelado = false;/);
  assert.match(
    hook,
    /const reiniciarCarregamentoTimer = window\.setTimeout\(\(\) => \{\s*if \(!cancelado\) \{\s*setDadosHomeCarregados\(false\);\s*\}\s*\}, 0\);/,
  );
  assert.match(hook, /async function carregarDadosHome\(\)/);
  assert.match(hook, /await carregarSnapshotInicialHome\(\{[\s\S]*?usuarioIdLogado,[\s\S]*?storageKey: STORAGE_KEY,[\s\S]*?favoritesStorageKey: FAVORITES_STORAGE_KEY,[\s\S]*?completedStorageKey: COMPLETED_STORAGE_KEY,/);
  assert.match(hook, /aoNormalizarObras: \(obras\) => \{\s*obrasCacheLocalHomeRef\.current = obras;/);
  assert.match(hook, /if \(!cancelado\) \{\s*setObrasLocais\(obrasNormalizadas\);\s*setObrasFavoritas\(obrasFavoritasNormalizadas\);\s*setPerfisAutores\(perfisAutoresNormalizados\);/);
  assert.match(hook, /const obrasComSupabase = await carregarObrasSupabaseHome\(\s*obrasNormalizadas,\s*userIdHome\s*\);/);
  assert.match(hook, /window\.clearTimeout\(reiniciarCarregamentoTimer\);\s*setObrasLocais\(obrasComSupabase\);\s*setPerfisAutores\(carregarPerfisAutoresHomeSalvos\(userIdHome\)\);\s*setDadosHomeCarregados\(true\);/);
  assert.match(hook, /catch \{\s*if \(!cancelado\) \{\s*window\.clearTimeout\(reiniciarCarregamentoTimer\);\s*setObrasLocais\(\[\]\);\s*setObrasFavoritas\(\[\]\);\s*setPerfisAutores\(\{\}\);\s*setDadosHomeCarregados\(true\);/);
  assert.match(hook, /return \(\) => \{\s*cancelado = true;\s*window\.clearTimeout\(reiniciarCarregamentoTimer\);\s*\};[\s\S]*?\}, \[usuarioIdLogado\]\);/);
});

test("Home consome o hook e mantém o segundo lifecycle fora da fronteira", () => {
  assert.match(
    pagina,
    /import useHomeInitialData, \{[\s\S]*?FAVORITES_STORAGE_KEY,[\s\S]*?\} from "\.\/hooks\/use-home-initial-data";/,
  );
  assert.match(
    pagina,
    /const \{[\s\S]*?obrasLocais,[\s\S]*?obrasFavoritas,[\s\S]*?perfisAutores,[\s\S]*?dadosHomeCarregados,[\s\S]*?setObrasLocais,[\s\S]*?setObrasFavoritas,[\s\S]*?\} = useHomeInitialData\(usuarioIdLogado, obrasCacheLocalHomeRef\);/,
  );
  assert.doesNotMatch(pagina, /async function carregarDadosHome\(/);
  assert.doesNotMatch(pagina, /carregarSnapshotInicialHome/);
  assert.match(
    pagina,
    /useEffect\(\(\) => \{[\s\S]*?consultaCatalogoHomeRef\.current = numeroConsulta;[\s\S]*?carregarObrasSupabaseHome\(/,
  );
  assert.match(hook, /return \{[\s\S]*?obrasLocais,[\s\S]*?obrasFavoritas,[\s\S]*?perfisAutores,[\s\S]*?dadosHomeCarregados,/);
  assert.doesNotMatch(hook, /\.insert\(|\.update\(|\.delete\(/);
});
