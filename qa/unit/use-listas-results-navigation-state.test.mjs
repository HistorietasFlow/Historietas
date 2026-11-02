import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ler = (path) =>
  readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");

const hook = ler("../../app/listas/hooks/use-listas-results-navigation-state.ts");
const pagina = ler("../../app/listas/page.tsx");
const routeSync = ler("../../app/listas/hooks/use-listas-route-ui-sync.ts");
const targetFocus = ler("../../app/listas/hooks/use-listas-target-work-focus.ts");
const categoryNavigation = ler(
  "../../app/listas/hooks/use-listas-category-navigation.ts",
);
const resultsViewState = ler(
  "../../app/listas/hooks/use-listas-results-view-state.ts",
);

test("hook centraliza somente o estado de navegação e apresentação dos resultados de Listas", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /import \{ useState \} from "react";/);
  assert.match(hook, /import type \{ CategoriaPerfil \} from "\.\.\/types";/);
  assert.match(
    hook,
    /export function useListasResultsNavigationState\(\s*categoriaInicial: CategoriaPerfil,?\s*\)/,
  );
  assert.match(
    hook,
    /categoria, setCategoria\]\s*=\s*useState<CategoriaPerfil>\(categoriaInicial\)/,
  );
  assert.match(
    hook,
    /quantidadeVisivel, setQuantidadeVisivel\] = useState\(40\)/,
  );
  assert.match(hook, /obraDestacadaId, setObraDestacadaId\] = useState\(""\)/);
  assert.doesNotMatch(
    hook,
    /useEffect|useMemo|supabase|localStorage|router|scrollIntoView|return\s*\(\s*</,
  );
});

test("Listas delega os estados e preserva sincronização, foco e resultados", () => {
  assert.match(
    pagina,
    /import \{ useListasResultsNavigationState \} from "\.\/hooks\/use-listas-results-navigation-state";/,
  );
  assert.match(
    pagina,
    /\} = useListasResultsNavigationState\(categoriaUrl\);/,
  );

  for (const estadoLocal of [
    "const [categoria, setCategoria]",
    "const [quantidadeVisivel, setQuantidadeVisivel]",
    "const [obraDestacadaId, setObraDestacadaId]",
  ]) {
    assert.equal(pagina.includes(estadoLocal), false, estadoLocal);
  }

  assert.match(
    pagina,
    /useListasRouteUiSync\(\{[\s\S]*?categoriaUrl,[\s\S]*?setCategoria,[\s\S]*?categoria,[\s\S]*?setQuantidadeVisivel,/,
  );
  assert.match(
    pagina,
    /useListasTargetWorkFocus\(\{[\s\S]*?categoria,[\s\S]*?setCategoria,[\s\S]*?setObraDestacadaId,/,
  );
  assert.match(
    pagina,
    /useListasResultsViewState\(\{[\s\S]*?categoria,[\s\S]*?quantidadeVisivel,/,
  );
  assert.match(
    pagina,
    /useListasCategoryNavigation<CategoriaPerfil>\(\{[\s\S]*?setCategoria,/,
  );
  assert.match(pagina, /obraDestacadaId,/);
  assert.match(
    pagina,
    /onCarregarMais=\{\(\) =>\s*setQuantidadeVisivel\(\(quantidade\) => quantidade \+ 40\)/,
  );

  assert.match(routeSync, /setCategoria\(categoriaUrl\);/);
  assert.match(routeSync, /setQuantidadeVisivel\(40\);/);
  assert.match(targetFocus, /setCategoria\("tudo"\);/);
  assert.match(targetFocus, /router\.replace\(`\/listas\?\$\{params\.toString\(\)\}`/);
  assert.match(targetFocus, /elemento\.scrollIntoView/);
  assert.match(targetFocus, /setObraDestacadaId\(obraAlvoId\);/);
  assert.match(targetFocus, /\}, 2400\)/);
  assert.match(categoryNavigation, /router\.replace\(`\/listas\?\$\{params\.toString\(\)\}`/);
  assert.match(resultsViewState, /\.slice\(0, quantidadeVisivel\)/);
});
