import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ler = (path) =>
  readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");

const hook = ler(
  "../../app/explorar/hooks/use-explorar-navigation-filter-state.ts",
);
const pagina = ler("../../app/explorar/page.tsx");
const authState = ler("../../app/explorar/hooks/use-explorar-auth-state.ts");
const catalogQuery = ler("../../app/explorar/hooks/use-explorar-catalog-query.ts");

test("hook centraliza somente os estados de navegação e filtros de Explorar", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /import \{ useState \} from "react";/);
  assert.match(hook, /ModoConteudoExplorar/);
  assert.match(hook, /FiltroColecaoExplorar/);
  assert.match(hook, /OrdenacaoExplorar/);
  assert.match(hook, /export function useExplorarNavigationFilterState\(\)/);
  assert.match(hook, /modoConteudo, setModoConteudo\]\s*=\s*useState<ModoConteudoExplorar>\("obras"\)/);
  assert.match(hook, /categoriaSelecionada, setCategoriaSelecionada\] = useState\(""\)/);
  assert.match(hook, /busca, setBusca\] = useState\(""\)/);
  assert.match(hook, /filtroFormato, setFiltroFormato\] = useState\("todos"\)/);
  assert.match(hook, /filtroClassificacao, setFiltroClassificacao\] = useState\("todos"\)/);
  assert.match(hook, /filtroCapitulos, setFiltroCapitulos\] = useState\("todos"\)/);
  assert.match(hook, /filtroColecao, setFiltroColecao\]\s*=\s*useState<FiltroColecaoExplorar>\("todos"\)/);
  assert.match(hook, /ordenacao, setOrdenacao\] = useState<OrdenacaoExplorar>\("relevancia"\)/);
  assert.doesNotMatch(
    hook,
    /useEffect|useMemo|supabase|localStorage|setTimeout|pushState|return\s*\(\s*</,
  );
});

test("Explorar delega os estados e preserva handlers, auth e consulta", () => {
  assert.match(
    pagina,
    /import \{ useExplorarNavigationFilterState \} from "\.\/hooks\/use-explorar-navigation-filter-state";/,
  );
  assert.match(pagina, /\} = useExplorarNavigationFilterState\(\);/);

  for (const estadoLocal of [
    "const [modoConteudo, setModoConteudo]",
    "const [categoriaSelecionada, setCategoriaSelecionada]",
    "const [busca, setBusca]",
    "const [filtroFormato, setFiltroFormato]",
    "const [filtroClassificacao, setFiltroClassificacao]",
    "const [filtroCapitulos, setFiltroCapitulos]",
    "const [filtroColecao, setFiltroColecao]",
    "const [ordenacao, setOrdenacao]",
  ]) {
    assert.equal(pagina.includes(estadoLocal), false, estadoLocal);
  }

  assert.match(
    pagina,
    /useExplorarAuthState\(\{[\s\S]*?setFiltroColecao,/,
  );
  assert.match(
    pagina,
    /useExplorarInitialLoad\(\{[\s\S]*?setModoConteudo,[\s\S]*?setCategoriaSelecionada,[\s\S]*?setBusca,[\s\S]*?setOrdenacao,/,
  );
  assert.match(
    pagina,
    /useExplorarRouteFilterSync\(\{[\s\S]*?setModoConteudo,[\s\S]*?setCategoriaSelecionada,[\s\S]*?setBusca,[\s\S]*?setOrdenacao,/,
  );
  assert.match(
    pagina,
    /useExplorarCatalogQuery\(\{[\s\S]*?busca,[\s\S]*?categoriaSelecionada,[\s\S]*?filtroFormato,[\s\S]*?filtroClassificacao,[\s\S]*?filtroCapitulos,[\s\S]*?ordenacao,/,
  );
  assert.match(pagina, /function selecionarModoConteudo\(modo: ModoConteudoExplorar\)/);
  assert.match(pagina, /function selecionarFiltroClassificacaoExplorar\(filtro: string\)/);
  assert.match(pagina, /function selecionarCategoria\(categoria: string\)/);
  assert.match(pagina, /function atualizarBuscaExplorar\(valor: string\)/);
  assert.match(pagina, /function selecionarOrdenacaoExplorar\(novaOrdenacao: typeof ordenacao\)/);
  assert.match(pagina, /function selecionarFiltroColecao\(filtro: FiltroColecaoExplorar\)/);
  assert.match(pagina, /function limparFiltros\(\)/);
  assert.doesNotMatch(pagina, /window\.history\.(?:pushState|replaceState)/);
  assert.match(authState, /setFiltroColecao\("todos"\);/);
  assert.match(catalogQuery, /const consultaCatalogoRef = useRef\(0\);/);
  assert.match(catalogQuery, /\}, 350\);/);
});
