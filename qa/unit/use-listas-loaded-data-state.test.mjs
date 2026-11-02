import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ler = (path) =>
  readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");

const hook = ler("../../app/listas/hooks/use-listas-loaded-data-state.ts");
const pagina = ler("../../app/listas/page.tsx");
const loader = ler("../../app/listas/hooks/use-listas-page-data-loader.ts");

test("hook centraliza somente os dados principais carregados de Listas", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /import \{ useState \} from "react";/);
  assert.match(
    hook,
    /import \{ LISTAS_PERFIL_VAZIAS \} from "\.\.\/lib\/listas-page-constants";/,
  );
  assert.match(hook, /ListasPerfilEstado,/);
  assert.match(hook, /ObraLista,/);
  assert.match(hook, /AutorLista,/);
  assert.match(hook, /export function useListasLoadedDataState\(\)/);
  assert.match(
    hook,
    /listasPerfil, setListasPerfil\] =\s*useState<ListasPerfilEstado>\(LISTAS_PERFIL_VAZIAS\)/,
  );
  assert.match(hook, /obrasPublicas, setObrasPublicas\] = useState<ObraLista\[\]>\(\[\]\)/);
  assert.match(hook, /autores, setAutores\] = useState<AutorLista\[\]>\(\[\]\)/);
  assert.doesNotMatch(hook, /useEffect|useMemo|supabase|localStorage|router|return\s*\(\s*</);
});

test("Listas delega os dados e preserva loader, resultados e ações", () => {
  assert.match(
    pagina,
    /import \{ useListasLoadedDataState \} from "\.\/hooks\/use-listas-loaded-data-state";/,
  );
  assert.match(pagina, /\} = useListasLoadedDataState\(\);/);

  for (const estadoLocal of [
    "const [listasPerfil, setListasPerfil]",
    "const [obrasPublicas, setObrasPublicas]",
    "const [autores, setAutores]",
  ]) {
    assert.equal(pagina.includes(estadoLocal), false, estadoLocal);
  }

  assert.match(
    pagina,
    /useListasPageDataLoader\(\{[\s\S]*?setListasPerfil,[\s\S]*?setObrasPublicas,[\s\S]*?setAutores,[\s\S]*?\}\);/,
  );
  assert.match(
    pagina,
    /useListasResultsViewState\(\{[\s\S]*?autores,[\s\S]*?listasPerfil,[\s\S]*?obrasPublicas,[\s\S]*?\}\);/,
  );
  assert.match(pagina, /useListasDiaryInteractionsSync\(\{[\s\S]*?listasPerfil,/);
  assert.match(pagina, /useListasDiaryAnnotationActions\(\{[\s\S]*?setListasPerfil,/);
  assert.match(loader, /setListasPerfil\(listasPerfilVazias\);/);
  assert.match(loader, /setObrasPublicas\(obrasPreparadas\);/);
  assert.match(loader, /setAutores\(autoresCarregados\);/);
});
