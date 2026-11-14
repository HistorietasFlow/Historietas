import { useLayoutEffect, useRef, type Dispatch, type SetStateAction } from "react";
import { persistirRemocaoDenunciaPerfilResolvidaModeracao } from "../actions/remover-denuncia-perfil-resolvida-moderacao";
import { persistirStatusDenunciaPerfilModeracao } from "../actions/atualizar-status-denuncia-perfil-moderacao";
import { criarMensagemErro } from "../lib/admin-comunidade-error-utils";
import { acaoModeracaoVigente, contextoModeracaoVigente, finalizarAcaoModeracao, iniciarAcaoModeracao, validarAcaoModeracao, type ControleModeracao } from "../lib/admin-comunidade-action-control";
import { ErroEscritaModeracao } from "../lib/admin-comunidade-confirmed-write";
import { STATUS_PERFIL_LABEL, STATUS_DENUNCIAS_PERFIS, type StatusDenunciaPerfil } from "../lib/admin-comunidade-status-utils";
import type { DenunciaPerfilComContexto } from "../loaders/carregar-denuncias-perfis-moderacao";
type UseAdminComunidadeProfileReportActionsParams = {
  usuarioId: string; ehAdmin: boolean; acaoEmAndamento: string; controleModeracao: ControleModeracao;
  denunciasPerfis: DenunciaPerfilComContexto[];
  setDenunciasPerfis: Dispatch<SetStateAction<DenunciaPerfilComContexto[]>>;
  setAcaoEmAndamento: Dispatch<SetStateAction<string>>;
  setErro: Dispatch<SetStateAction<string>>; setSucesso: Dispatch<SetStateAction<string>>;
  setMenuDenunciaAbertoId: Dispatch<SetStateAction<string>>;
};
export function useAdminComunidadeProfileReportActions({usuarioId, ehAdmin, acaoEmAndamento, controleModeracao, denunciasPerfis,
  setDenunciasPerfis, setAcaoEmAndamento, setErro, setSucesso, setMenuDenunciaAbertoId}: UseAdminComunidadeProfileReportActionsParams) {
  const atuaisRef = useRef(denunciasPerfis);
  useLayoutEffect(() => {atuaisRef.current = denunciasPerfis;}, [denunciasPerfis]);
  async function executar(denunciaId: string, novoStatus?: StatusDenunciaPerfil) {
    if (controleModeracao.current?.usuarioId !== usuarioId) return;
    if (!usuarioId || !ehAdmin) {setErro(novoStatus ? "Apenas moderadores podem atualizar denúncias de perfis." : "Apenas moderadores podem remover denúncias de perfis resolvidas."); return;}
    if (acaoEmAndamento) return;
    const acao = iniciarAcaoModeracao(controleModeracao, usuarioId, ehAdmin);
    if (!acao) return;
    const vigente = () => acaoModeracaoVigente(controleModeracao, acao);
    // React pode executar o updater depois de finally liberar a trava.
    const contextoVigente = () => contextoModeracaoVigente(controleModeracao, acao.contexto);
    const chaveAcao = `perfil-${denunciaId}-${novoStatus || "remover-denuncia"}`;
    const esperada = atuaisRef.current.find(d => d.id === denunciaId);
    const corresponde = (d: DenunciaPerfilComContexto | undefined) => !!d && !!esperada && d.id === esperada.id && d.status === esperada.status && d.atualizadoEm === esperada.atualizadoEm;
    try {
      if (!esperada || (!novoStatus && esperada.status !== "resolvida")) throw new Error("Somente denúncias de perfis resolvidas podem ser removidas do painel.");
      if (acao.contexto.incertos.has(`perfil:${denunciaId}`)) throw new Error("O resultado anterior não foi confirmado. Confira a denúncia de perfil.");
      setMenuDenunciaAbertoId(""); setAcaoEmAndamento(chaveAcao); setErro(""); setSucesso("");
      if (!await validarAcaoModeracao(controleModeracao, acao) || !vigente()) return;
      if (!corresponde(atuaisRef.current.find(d => d.id === denunciaId))) throw new Error("A denúncia de perfil mudou durante a ação.");
      const confirmado = novoStatus ? await persistirStatusDenunciaPerfilModeracao({denunciaId, novoStatus, atualizadoEm: new Date().toISOString(), esperada})
        : await persistirRemocaoDenunciaPerfilResolvidaModeracao({denunciaId, esperada});
      if (!vigente()) return;
      if (!corresponde(atuaisRef.current.find(d => d.id === denunciaId))) throw new Error("A lista mudou durante a resposta. Reabra o painel.");
      const aplicar = (lista: DenunciaPerfilComContexto[]) => novoStatus ? lista.map(d => corresponde(d) ? {...d, ...confirmado} : d) : lista.filter(d => d.id !== denunciaId || !corresponde(d));
      atuaisRef.current = aplicar(atuaisRef.current);
      setDenunciasPerfis(lista => contextoVigente() ? aplicar(lista) : lista);
      setSucesso(novoStatus ? `Denúncia de perfil marcada como ${STATUS_PERFIL_LABEL[novoStatus].toLowerCase()}.` : "Denúncia de perfil resolvida removida do painel.");
    } catch (error) {
      if (!vigente()) return;
      if (error instanceof ErroEscritaModeracao && error.estado === "incerto") acao.contexto.incertos.add(`perfil:${denunciaId}`);
      setSucesso("");
      setErro(criarMensagemErro(novoStatus ? "Erro ao atualizar denúncia de perfil" : "Erro ao remover denúncia de perfil resolvida", error));
    } finally {if (finalizarAcaoModeracao(controleModeracao, acao)) setAcaoEmAndamento("");}
  }
  async function atualizarStatusDenunciaPerfil(denunciaId: string, novoStatus: StatusDenunciaPerfil) {
    if (STATUS_DENUNCIAS_PERFIS.includes(novoStatus)) return executar(denunciaId, novoStatus);
  }
  async function removerDenunciaPerfilResolvida(denunciaId: string) {return executar(denunciaId);}
  return {atualizarStatusDenunciaPerfil, removerDenunciaPerfilResolvida};
}
