import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const componente = readFileSync(new URL("../../app/explorar/components/explorar-advanced-filters-shell.tsx", import.meta.url), "utf8");
const composicao = readFileSync(new URL("../../app/explorar/components/explorar-advanced-filters-composition.tsx", import.meta.url), "utf8");
const pagina = readFileSync(new URL("../../app/explorar/page.tsx", import.meta.url), "utf8");
const hookAcessibilidade = readFileSync(new URL("../../app/explorar/hooks/use-explorar-advanced-filters-dialog-accessibility.ts", import.meta.url), "utf8");
const opcoesColecao = readFileSync(new URL("../../app/explorar/components/explorar-collection-filter-options.tsx", import.meta.url), "utf8");
const opcoesClassificacao = readFileSync(new URL("../../app/explorar/components/explorar-adult-content-filter.tsx", import.meta.url), "utf8");
const opcoesOrdenacao = readFileSync(new URL("../../app/explorar/components/explorar-ordering-options.tsx", import.meta.url), "utf8");

test("ExplorarAdvancedFiltersShell preserva o envelope visual do modal", () => {
  assert.match(componente, /export function ExplorarAdvancedFiltersShell/);
  assert.match(componente, /isDesktop: boolean;/);
  assert.match(componente, /onFechar: \(\) => void;/);
  assert.match(componente, /children: ReactNode;/);
  assert.match(componente, /style=\{explorarModalOverlayStyle\}/);
  assert.match(componente, /onClick=\{onFechar\}/);
  assert.match(componente, /desktopExplorarModalSheetStyle/);
  assert.match(componente, /explorarModalSheetStyle/);
  assert.match(componente, /event\.stopPropagation\(\)/);
  assert.match(componente, /explorarModalHandleStyle/);
  assert.match(componente, /aria-hidden="true"/);
  assert.match(componente, /"EXPLORAR"/);
  assert.match(componente, /aria-label=\{traduzirTextoExplorar\("EXPLORAR", language\)\}/);
  assert.match(componente, /role="dialog"/);
  assert.match(componente, /aria-modal="true"/);
  assert.match(componente, /aria-labelledby="explorar-filtros-avancados-titulo"/);
  assert.match(componente, /id="explorar-filtros-avancados-titulo"/);
  assert.match(componente, /tabIndex=\{-1\}/);
  assert.match(componente, /onKeyDown=\{aoPressionarTeclaDialogo\}/);
  assert.match(componente, /\{children\}/);
});

test("painel reutiliza o lifecycle de foco dos diálogos e expõe seleções", () => {
  assert.match(hookAcessibilidade, /obterElementoComFocoAtual\(\)/);
  assert.match(hookAcessibilidade, /focarInicioDialogo\(dialogRef\.current\)/);
  assert.match(hookAcessibilidade, /manterFocoNoDialogo\(event, onFechar\)/);
  assert.match(hookAcessibilidade, /restaurarFocoAnterior\(focoAnterior\)/);
  assert.match(hookAcessibilidade, /window\.clearTimeout\(focoTimer\)/);
  assert.match(opcoesColecao, /aria-pressed=\{filtroColecao === valor\}/);
  assert.match(opcoesColecao, /data-dialog-initial-focus=\{filtroColecao === valor \? "true" : undefined\}/);
  assert.match(opcoesClassificacao, /aria-pressed=\{filtroClassificacao !== "18\+"\}/);
  assert.match(opcoesClassificacao, /aria-pressed=\{filtroClassificacao === "18\+"\}/);
  assert.match(opcoesOrdenacao, /aria-pressed=\{ordenacao === valor\}/);
});

test("Explorar mantém condição, fechamento e regras do modal na composição adiada", () => {
  assert.match(composicao, /import \{ ExplorarAdvancedFiltersShell \} from "\.\/explorar-advanced-filters-shell";/);
  assert.match(pagina, /\{mostrarFiltrosAvancados && \(/);
  assert.match(pagina, /<ExplorarAdvancedFiltersComposition/);
  assert.match(pagina, /onFechar=\{\(\) => \{\s*setMostrarFiltrosAvancados\(false\);\s*setMostrarConfirmacaoConteudo18\(false\);\s*setConfirmouIdadeConteudo18\(false\);\s*\}\}/);
  assert.match(pagina, /ACESSO_CONTEUDO_18_TEMPORARIAMENTE_BLOQUEADO/);
  assert.match(composicao, /<ExplorarOrderingOptions/);
  assert.match(pagina, /onSelecionarOrdenacao=\{selecionarOrdenacaoExplorar\}/);
  assert.match(pagina, /onLimparFiltros=\{limparFiltros\}/);
});
