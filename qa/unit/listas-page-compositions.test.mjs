import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pagina = readFileSync(
  new URL("../../app/listas/page.tsx", import.meta.url),
  "utf8",
);
const cabecalho = readFileSync(
  new URL("../../app/listas/components/listas-page-header.tsx", import.meta.url),
  "utf8",
);
const categorias = readFileSync(
  new URL(
    "../../app/listas/components/listas-profile-category-controls.tsx",
    import.meta.url,
  ),
  "utf8",
);
const resultados = readFileSync(
  new URL("../../app/listas/components/listas-results-section.tsx", import.meta.url),
  "utf8",
);
const categoryNavigation = readFileSync(
  new URL("../../app/listas/hooks/use-listas-category-navigation.ts", import.meta.url),
  "utf8",
);
const pageRenderers = readFileSync(
  new URL("../../app/listas/hooks/use-listas-page-renderers.tsx", import.meta.url),
  "utf8",
);
const profileItemRenderer = readFileSync(
  new URL(
    "../../app/listas/hooks/use-listas-profile-item-renderer.tsx",
    import.meta.url,
  ),
  "utf8",
);
const resultsViewState = readFileSync(
  new URL(
    "../../app/listas/hooks/use-listas-results-view-state.ts",
    import.meta.url,
  ),
  "utf8",
);

test("ListasPageHeader preserva os dois cabeçalhos e a avaliação do Diário", () => {
  assert.match(cabecalho, /export function ListasPageHeader/);
  assert.match(cabecalho, /isDiaryProfile && perfil/);
  assert.match(cabecalho, /data-historietas-user-content="true"/);
  assert.match(cabecalho, /Média \$\{formatarNota\(/);
  assert.match(cabecalho, /Av\. Diário/);
  assert.match(cabecalho, /aria-label="Avaliar este Diário"/);
  assert.match(cabecalho, /onAvaliarDiario\(proximaNota\)/);
  assert.match(cabecalho, /disabled=\{!interativa\}/);
  assert.match(cabecalho, /Avaliar Diário com/);
  assert.match(cabecalho, /criarAvatarStyle\(perfil\.avatar\)/);
});

test("ListasProfileCategoryControls preserva a fronteira do modo perfil", () => {
  assert.match(categorias, /export function ListasProfileCategoryControls/);
  assert.match(categorias, /if \(modo !== "perfil" \|\| bloqueado\)/);
  assert.match(categorias, /aria-label="Categorias da lista"/);
  assert.match(categorias, /categorias\.map/);
  assert.match(categorias, /onTrocarCategoria\(item\.valor\)/);
  assert.match(categorias, /contagens\[item\.valor\]\.length/);
});

test("ListasResultsSection preserva estados, agrupamento, modos e paginação", () => {
  assert.match(resultados, /export function ListasResultsSection/);
  assert.match(resultados, /aria-live="polite"/);
  assert.match(resultados, /Organizando a lista\.\.\./);
  assert.match(resultados, /Esta lista é privada/);
  assert.match(resultados, /O dono do perfil escolheu quem pode visualizar esta seção\./);
  assert.match(resultados, /href="\/perfil-autor"/);
  assert.match(resultados, /Não foi possível abrir a lista/);
  assert.match(resultados, /Nenhum item encontrado/);
  assert.match(resultados, /modo === "perfil"/);
  assert.match(resultados, /gruposPerfil\.map/);
  assert.match(resultados, /itens\.map\(renderizarItemPerfil\)/);
  assert.match(resultados, /modo === "obras"/);
  assert.match(resultados, /obrasVisiveis\.map\(renderizarObraPublica\)/);
  assert.match(resultados, /modo === "autores"/);
  assert.match(resultados, /autoresVisiveis\.map\(renderizarAutor\)/);
  assert.match(resultados, /hasMore &&/);
  assert.match(resultados, /Carregar mais/);
});

test("página mantém derivações e delega navegação e renderizadores públicos", () => {
  for (const componente of [
    "ListasPageHeader",
    "ListasProfileCategoryControls",
    "ListasResultsSection",
  ]) {
    assert.match(
      pagina,
      new RegExp(`import \\{ ${componente} \\} from "\\.\\/components\\/`),
    );
    assert.match(pagina, new RegExp(`<${componente}\\b`));
  }

  assert.match(
    pagina,
    /import \{ useListasResultsViewState \} from "\.\/hooks\/use-listas-results-view-state";/,
  );
  assert.match(pagina, /\} = useListasResultsViewState\(\{/);
  assert.match(resultsViewState, /const tituloPagina =/);
  assert.match(resultsViewState, /const gruposPerfil = useMemo/);
  assert.match(resultsViewState, /const itensPerfilVisiveis =/);
  assert.match(resultsViewState, /const obrasVisiveis =/);
  assert.match(resultsViewState, /const autoresVisiveis =/);
  assert.match(pagina, /useListasCategoryNavigation<CategoriaPerfil>\(\{/);
  assert.doesNotMatch(pagina, /function trocarCategoria\(/);
  assert.match(categoryNavigation, /function trocarCategoria\(/);
  assert.match(
    pagina,
    /import \{ useListasProfileItemRenderer \} from "\.\/hooks\/use-listas-profile-item-renderer";/,
  );
  assert.match(pagina, /\} = useListasProfileItemRenderer\(\{/);
  assert.match(profileItemRenderer, /function renderizarItemPerfil\(/);
  assert.match(pagina, /useListasPageRenderers\(\{/);
  assert.doesNotMatch(pagina, /function renderizarObraPublica\(/);
  assert.doesNotMatch(pagina, /function renderizarAutor\(/);
  assert.match(pageRenderers, /function renderizarObraPublica\(/);
  assert.match(pageRenderers, /function renderizarAutor\(/);
  assert.match(
    pagina,
    /renderizarItemPerfil=\{\(item\) => renderizarItemPerfil\(item, categoria\)\}/,
  );
  assert.match(
    pagina,
    /onCarregarMais=\{\(\) =>\s*setQuantidadeVisivel\(\(quantidade\) => quantidade \+ 40\)/,
  );
});
