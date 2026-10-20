import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hook = readFileSync(
  new URL(
    "../../app/notificacoes/hooks/use-notificacoes-page-view-state.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/notificacoes/page.tsx", import.meta.url),
  "utf8",
);

test("estado derivado da página preserva filtros, totais e buscas de Notificações", () => {
  for (const contrato of [
    '"use client"',
    "export function useNotificacoesPageViewState",
    "criarObrasPorIdNotificacoes(obras)",
    "contarNotificacoesNaoLidas(notificacoes)",
    "calcularTotalNotificacoesLidas(",
    "normalizarTexto(busca)",
    "acessoConteudo18Confirmado()",
    "filtrarEOrdenarNotificacoes({",
    "filtrosNotificacoesEstaoAtivos(",
    "criarOpcoesFiltroNotificacoes()",
    "criarOpcoesOrdenacaoNotificacoes()",
    "encontrarObraNotificacao(obrasPorId, obraId)",
    "encontrarCapituloNotificacao(obrasPorId, obraId, capituloId)",
    "obterNotificacaoMenuAberta(",
  ]) {
    assert.ok(hook.includes(contrato), "contrato ausente: " + contrato);
  }

  assert.match(pagina, /from "\.\/hooks\/use-notificacoes-page-view-state"/);
  assert.match(pagina, /} = useNotificacoesPageViewState\(\{/);
  for (const declaracao of [
    "const obrasPorId = useMemo",
    "const totalNaoLidas = useMemo",
    "const notificacoesFiltradas = useMemo",
    "function encontrarObra(",
    "function encontrarCapitulo(",
  ]) {
    assert.doesNotMatch(
      pagina,
      new RegExp(declaracao.replace(/[()]/g, "\\$&")),
    );
  }
  assert.doesNotMatch(hook, /supabase|localStorage|JSX/);
});
