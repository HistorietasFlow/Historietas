import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ler = (path) =>
  readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");

const hook = ler(
  "../../app/explorar/hooks/use-explorar-catalog-pagination-state.ts",
);
const pagina = ler("../../app/explorar/page.tsx");
const initialLoad = ler("../../app/explorar/hooks/use-explorar-initial-load.ts");
const catalogQuery = ler("../../app/explorar/hooks/use-explorar-catalog-query.ts");
const authorData = ler("../../app/explorar/hooks/use-explorar-author-data.ts");

test("hook centraliza somente os estados de catálogo e paginação de Explorar", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /import \{ useState \} from "react";/);
  assert.match(hook, /CursorCatalogo/);
  assert.match(hook, /ObraLocal/);
  assert.match(hook, /export function useExplorarCatalogPaginationState\(\)/);
  assert.match(hook, /obrasLocais, setObrasLocais\] = useState<ObraLocal\[\]>\(\[\]\)/);
  assert.match(
    hook,
    /dadosExplorarCarregados, setDadosExplorarCarregados\] = useState\(false\)/,
  );
  assert.match(
    hook,
    /proximoCursorCatalogo, setProximoCursorCatalogo\]\s*=\s*useState<CursorCatalogo \| null>\(null\)/,
  );
  assert.match(hook, /catalogoTemMais, setCatalogoTemMais\] = useState\(false\)/);
  assert.match(
    hook,
    /carregandoMaisCatalogo, setCarregandoMaisCatalogo\] = useState\(false\)/,
  );
  assert.match(
    hook,
    /obraIdsBuscaRemota, setObraIdsBuscaRemota\] = useState<\s*string\[\] \| null\s*>\(null\)/,
  );
  assert.match(hook, /export type ErroCatalogoExplorar = "consulta" \| "paginacao" \| null;/);
  assert.match(
    hook,
    /erroCatalogoExplorar, setErroCatalogoExplorar\] =\s*useState<ErroCatalogoExplorar>\(null\)/,
  );
  assert.match(hook, /versaoRetryCatalogo, setVersaoRetryCatalogo\] = useState\(0\)/);
  assert.doesNotMatch(
    hook,
    /useEffect|useMemo|supabase|localStorage|setTimeout|return\s*\(\s*</,
  );
});

test("Explorar delega os estados e preserva carregamento, consulta e autores", () => {
  assert.match(
    pagina,
    /import \{ useExplorarCatalogPaginationState \} from "\.\/hooks\/use-explorar-catalog-pagination-state";/,
  );
  assert.match(pagina, /\} = useExplorarCatalogPaginationState\(\);/);

  for (const estadoLocal of [
    "const [obrasLocais, setObrasLocais]",
    "const [dadosExplorarCarregados, setDadosExplorarCarregados]",
    "const [proximoCursorCatalogo, setProximoCursorCatalogo]",
    "const [catalogoTemMais, setCatalogoTemMais]",
    "const [carregandoMaisCatalogo, setCarregandoMaisCatalogo]",
    "const [obraIdsBuscaRemota, setObraIdsBuscaRemota]",
    "const [erroCatalogoExplorar, setErroCatalogoExplorar]",
    "const [versaoRetryCatalogo, setVersaoRetryCatalogo]",
  ]) {
    assert.equal(pagina.includes(estadoLocal), false, estadoLocal);
  }

  assert.match(
    pagina,
    /useExplorarInitialLoad\(\{[\s\S]*?setObrasLocais,[\s\S]*?setProximoCursorCatalogo,[\s\S]*?setCatalogoTemMais,[\s\S]*?setErroCatalogoExplorar,[\s\S]*?setDadosExplorarCarregados,/,
  );
  assert.match(
    pagina,
    /useExplorarCatalogQuery\(\{[\s\S]*?dadosExplorarCarregados,[\s\S]*?obrasLocais,[\s\S]*?proximoCursorCatalogo,[\s\S]*?carregandoMaisCatalogo,[\s\S]*?versaoRetryCatalogo,[\s\S]*?setObrasLocais,[\s\S]*?setProximoCursorCatalogo,[\s\S]*?setCatalogoTemMais,[\s\S]*?setCarregandoMaisCatalogo,[\s\S]*?setObraIdsBuscaRemota,[\s\S]*?setErroCatalogoExplorar,/,
  );
  assert.match(pagina, /useExplorarAuthorData\(\{\s*obrasLocais,/);
  assert.match(pagina, /consultaCatalogoPersonalizada && catalogoTemMais/);
  assert.match(pagina, /carregando=\{carregandoMaisCatalogo\}/);

  assert.match(initialLoad, /obrasCacheLocalRef\.current = obrasNormalizadas;/);
  assert.match(initialLoad, /setDadosExplorarCarregados\(true\);/);
  assert.match(initialLoad, /setProximoCursorCatalogo\(resultadoCatalogo\.pagina\?\.proximoCursor \|\| null\);/);
  assert.match(initialLoad, /setCatalogoTemMais\(Boolean\(resultadoCatalogo\.pagina\?\.temMais\)\);/);
  assert.match(catalogQuery, /const consultaCatalogoRef = useRef\(0\);/);
  assert.match(catalogQuery, /\}, 350\);/);
  assert.match(catalogQuery, /setCarregandoMaisCatalogo\(false\);/);
  assert.match(catalogQuery, /setObrasLocais\(resultado\.obras\);/);
  assert.match(catalogQuery, /setObraIdsBuscaRemota\(/);
  assert.match(
    pagina,
    /filtrarObrasExplorar\(\{[\s\S]*?obraIdsBuscaRemota,/,
  );
  assert.match(authorData, /obrasLocais/);
});
