import { useLayoutEffect, useRef, type Dispatch, type SetStateAction } from "react";
import type { HistorietasLanguage } from "../../../../lib/i18n";
import { persistirArquivamentoDenunciaModeracao } from "../actions/arquivar-denuncia-moderacao";
import { persistirRemocaoDenunciaResolvidaModeracao } from "../actions/remover-denuncia-resolvida-moderacao";
import { removerConteudoDenunciadoModeracao } from "../actions/remover-conteudo-denunciado-moderacao";
import { persistirRestauracaoDenunciaModeracao } from "../actions/restaurar-denuncia-moderacao";
import { persistirStatusDenunciaModeracao } from "../actions/atualizar-status-denuncia-moderacao";
import { acaoModeracaoVigente, contextoModeracaoVigente, finalizarAcaoModeracao, iniciarAcaoModeracao, validarAcaoModeracao, type ControleModeracao } from "../lib/admin-comunidade-action-control";
import { ErroEscritaModeracao, mesmaDenunciaModeracao, type EstadoDenuncia } from "../lib/admin-comunidade-confirmed-write";
import { criarMensagemErro } from "../lib/admin-comunidade-error-utils";
import { rotuloSucessoRemocaoAlvo } from "../lib/admin-comunidade-report-label-utils";
import type { DenunciaComContexto } from "../lib/admin-comunidade-report-context-utils";
import { STATUS_DENUNCIAS, STATUS_LABEL, type StatusDenuncia } from "../lib/admin-comunidade-status-utils";
import { localeAdminComunidade, textoConfirmacaoRemocaoAdminComunidade } from "../lib/admin-comunidade-text-utils";

type UseAdminComunidadeContentReportActionsParams = {
  language: HistorietasLanguage;
  usuarioId: string;
  ehAdmin: boolean;
  acaoEmAndamento: string;
  controleModeracao: ControleModeracao;
  denuncias: DenunciaComContexto[];
  observacoes: Record<string, string>;
  setDenuncias: Dispatch<SetStateAction<DenunciaComContexto[]>>;
  setObservacoes: Dispatch<SetStateAction<Record<string, string>>>;
  setAcaoEmAndamento: Dispatch<SetStateAction<string>>;
  setErro: Dispatch<SetStateAction<string>>;
  setSucesso: Dispatch<SetStateAction<string>>;
  setMenuDenunciaAbertoId: Dispatch<SetStateAction<string>>;
};
type ResultadoLocal = {estados?: EstadoDenuncia[]; removida?: string; conteudoRemovido?: boolean; observacao?: string};
const chaveAlvo = (d: EstadoDenuncia) => `${d.alvoTipo}:${d.alvoId}`;

export function useAdminComunidadeContentReportActions({
  language, usuarioId, ehAdmin, acaoEmAndamento, controleModeracao, denuncias, observacoes,
  setDenuncias, setObservacoes, setAcaoEmAndamento, setErro, setSucesso, setMenuDenunciaAbertoId,
}: UseAdminComunidadeContentReportActionsParams) {
  const atuaisRef = useRef(denuncias);
  useLayoutEffect(() => {atuaisRef.current = denuncias;}, [denuncias]);

  async function executar(denunciaId: string, chaveAcao: string, permissao: string, prefixoErro: string,
    operacao: (esperada: DenunciaComContexto, vigente: () => boolean, carregadas: DenunciaComContexto[]) => Promise<ResultadoLocal>, sucesso: string,
    confirmar?: (esperada: DenunciaComContexto) => boolean) {
    if (controleModeracao.current?.usuarioId !== usuarioId) return;
    if (!usuarioId || !ehAdmin) {setErro(permissao); return;}
    if (acaoEmAndamento) return;
    const acao = iniciarAcaoModeracao(controleModeracao, usuarioId, ehAdmin);
    if (!acao) return;
    const vigente = () => acaoModeracaoVigente(controleModeracao, acao);
    // React pode executar o updater depois de finally liberar a trava.
    const contextoVigente = () => contextoModeracaoVigente(controleModeracao, acao.contexto);
    const esperadas = atuaisRef.current;
    const esperada = esperadas.find(d => d.id === denunciaId);
    const observacaoOriginal = observacoes[denunciaId];
    try {
      if (!esperada) throw new Error("A denúncia não está mais disponível. Reabra o painel.");
      if (acao.contexto.incertos.has(denunciaId) || acao.contexto.incertos.has(chaveAlvo(esperada))) {
        throw new Error("O resultado anterior não foi confirmado. Confira a denúncia antes de iniciar outra ação.");
      }
      if (confirmar && !confirmar(esperada)) return;
      setMenuDenunciaAbertoId(""); setAcaoEmAndamento(chaveAcao); setErro(""); setSucesso("");
      if (!await validarAcaoModeracao(controleModeracao, acao) || !vigente()) return;
      if (!mesmaDenunciaModeracao(atuaisRef.current.find(d => d.id === denunciaId), esperada)) throw new Error("A denúncia mudou durante a ação. Reabra o painel.");
      const resultado = await operacao(esperada, vigente, esperadas);
      if (!vigente()) return;
      const ids = resultado.removida ? [resultado.removida] : (resultado.estados || []).map(d => d.id);
      if (ids.some(id => !mesmaDenunciaModeracao(atuaisRef.current.find(d => d.id === id), esperadas.find(d => d.id === id)!))) {
        throw new Error("A ação terminou, mas a lista mudou durante a resposta. Reabra o painel para conferir o estado atual.");
      }
      const aplicar = (lista: DenunciaComContexto[]) => lista.filter(d => d.id !== resultado.removida || !mesmaDenunciaModeracao(d, esperadas.find(row => row.id === d.id))).map(d => {
        const estado = resultado.estados?.find(row => row.id === d.id);
        if (!estado || !mesmaDenunciaModeracao(d, esperadas.find(row => row.id === d.id)!)) return d;
        return {...d, ...estado, ...(resultado.conteudoRemovido ? {alvoResumo: `Conteúdo removido pela moderação. Registro anterior: ${d.alvoResumo}`} : {})};
      });
      atuaisRef.current = aplicar(atuaisRef.current);
      setDenuncias(lista => contextoVigente() ? aplicar(lista) : lista);
      if (resultado.removida) setObservacoes(valores => {
        if (!contextoVigente()) return valores;
        const proximos = {...valores}; delete proximos[denunciaId]; return proximos;
      });
      else if (resultado.observacao !== undefined) setObservacoes(valores =>
        contextoVigente() && valores[denunciaId] === observacaoOriginal ? {...valores, [denunciaId]: resultado.observacao!} : valores);
      setSucesso(sucesso);
    } catch (error) {
      if (!vigente()) return;
      if (error instanceof ErroEscritaModeracao && error.estado === "incerto" && esperada) acao.contexto.incertos.add(chaveAlvo(esperada));
      setSucesso("");
      setErro(criarMensagemErro(prefixoErro, error));
    } finally {
      if (finalizarAcaoModeracao(controleModeracao, acao)) setAcaoEmAndamento("");
    }
  }

  async function atualizarStatusDenuncia(denunciaId: string, novoStatus: StatusDenuncia) {
    if (!STATUS_DENUNCIAS.includes(novoStatus)) return;
    const observacaoAtual = observacoes[denunciaId]?.trim() || "";
    const analisadoEm = new Date().toISOString();
    return executar(denunciaId, `${denunciaId}-${novoStatus}`, "Apenas moderadores podem atualizar denúncias.", "Erro ao atualizar denúncia",
      async esperada => ({estados: [await persistirStatusDenunciaModeracao({denunciaId, novoStatus, observacaoAtual, usuarioId, analisadoEm, esperada})]}),
      `Denúncia marcada como ${STATUS_LABEL[novoStatus].toLowerCase()}.`);
  }

  async function removerConteudoDenunciado(denuncia: DenunciaComContexto) {
    const observacaoAtual = observacoes[denuncia.id]?.trim() || "";
    const observacaoFinal = observacaoAtual || `Conteúdo removido pela moderação em ${new Date().toLocaleDateString(localeAdminComunidade(language))}.`;
    return executar(denuncia.id, `${denuncia.id}-remover-conteudo`, "Apenas moderadores podem remover conteúdo denunciado.", "Erro ao remover conteúdo denunciado",
      async (esperada, vigente, carregadas) => {
        const {denuncias: estados} = await removerConteudoDenunciadoModeracao({
          alvoTipo: esperada.alvoTipo, alvoId: esperada.alvoId, observacaoFinal, usuarioId, esperada, vigente,
          denunciasIds: carregadas.filter(d => chaveAlvo(d) === chaveAlvo(esperada)).map(d => d.id),
        });
        return {estados, conteudoRemovido: true, observacao: observacaoFinal.slice(0, 800)};
      }, `${rotuloSucessoRemocaoAlvo(denuncia.alvoTipo)} e denúncia marcada como resolvida.`,
      esperada => {
        if (!mesmaDenunciaModeracao(esperada, denuncia) || esperada.arquivada || (esperada.status !== "pendente" && esperada.status !== "em_analise")) {
          throw new Error("Somente denúncias ativas e não arquivadas podem remover conteúdo.");
        }
        return window.confirm(textoConfirmacaoRemocaoAdminComunidade(esperada.alvoTipo, language));
      });
  }

  async function arquivarDenuncia(denunciaId: string) {
    return executar(denunciaId, `${denunciaId}-arquivar`, "Apenas moderadores podem arquivar denúncias.", "Erro ao arquivar denúncia",
      async esperada => ({estados: [await persistirArquivamentoDenunciaModeracao({denunciaId, esperada})]}),
      "Denúncia arquivada e ocultada do painel principal.");
  }

  async function restaurarDenunciaArquivada(denunciaId: string) {
    return executar(denunciaId, `${denunciaId}-restaurar`, "Apenas moderadores podem restaurar denúncias.", "Erro ao restaurar denúncia",
      async esperada => ({estados: [await persistirRestauracaoDenunciaModeracao({denunciaId, esperada})]}),
      "Denúncia restaurada para o painel principal.");
  }

  async function removerDenunciaResolvida(denunciaId: string) {
    return executar(denunciaId, `${denunciaId}-remover-denuncia`, "Apenas moderadores podem remover denúncias resolvidas.", "Erro ao remover denúncia resolvida",
      async esperada => {
        if (esperada.status !== "resolvida") throw new Error("Somente denúncias resolvidas podem ser removidas do painel.");
        await persistirRemocaoDenunciaResolvidaModeracao({denunciaId, esperada});
        return {removida: denunciaId};
      }, "Denúncia resolvida removida do painel.");
  }
  return {atualizarStatusDenuncia, removerConteudoDenunciado, arquivarDenuncia, restaurarDenunciaArquivada, removerDenunciaResolvida};
}
