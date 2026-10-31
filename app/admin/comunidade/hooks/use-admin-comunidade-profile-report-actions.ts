import type { Dispatch, SetStateAction } from "react";
import { persistirRemocaoDenunciaPerfilResolvidaModeracao } from "../actions/remover-denuncia-perfil-resolvida-moderacao";
import { persistirStatusDenunciaPerfilModeracao } from "../actions/atualizar-status-denuncia-perfil-moderacao";
import { criarMensagemErro } from "../lib/admin-comunidade-error-utils";
import {
  STATUS_PERFIL_LABEL,
  type StatusDenunciaPerfil,
} from "../lib/admin-comunidade-status-utils";
import type { DenunciaPerfilComContexto } from "../loaders/carregar-denuncias-perfis-moderacao";

type UseAdminComunidadeProfileReportActionsParams = {
  usuarioId: string;
  ehAdmin: boolean;
  acaoEmAndamento: string;
  denunciasPerfis: DenunciaPerfilComContexto[];
  setDenunciasPerfis: Dispatch<SetStateAction<DenunciaPerfilComContexto[]>>;
  setAcaoEmAndamento: Dispatch<SetStateAction<string>>;
  setErro: Dispatch<SetStateAction<string>>;
  setSucesso: Dispatch<SetStateAction<string>>;
  setMenuDenunciaAbertoId: Dispatch<SetStateAction<string>>;
};

export function useAdminComunidadeProfileReportActions({
  usuarioId,
  ehAdmin,
  acaoEmAndamento,
  denunciasPerfis,
  setDenunciasPerfis,
  setAcaoEmAndamento,
  setErro,
  setSucesso,
  setMenuDenunciaAbertoId,
}: UseAdminComunidadeProfileReportActionsParams) {
  async function atualizarStatusDenunciaPerfil(
    denunciaId: string,
    novoStatus: StatusDenunciaPerfil
  ) {
    if (!usuarioId || !ehAdmin) {
      setErro("Apenas moderadores podem atualizar denúncias de perfis.");
      return;
    }

    const chaveAcao = `perfil-${denunciaId}-${novoStatus}`;

    if (acaoEmAndamento) {
      return;
    }

    setAcaoEmAndamento(chaveAcao);
    setErro("");
    setSucesso("");

    const atualizadoEm = new Date().toISOString();

    try {
      await persistirStatusDenunciaPerfilModeracao({
        denunciaId,
        novoStatus,
        atualizadoEm,
      });

      setDenunciasPerfis((denunciasAtuais) =>
        denunciasAtuais.map((denuncia) =>
          denuncia.id === denunciaId
            ? {
                ...denuncia,
                status: novoStatus,
                atualizadoEm,
              }
            : denuncia
        )
      );

      setSucesso(
        `Denúncia de perfil marcada como ${STATUS_PERFIL_LABEL[
          novoStatus
        ].toLowerCase()}.`
      );
    } catch (error) {
      setErro(criarMensagemErro("Erro ao atualizar denúncia de perfil", error));
    } finally {
      setAcaoEmAndamento("");
    }
  }

  async function removerDenunciaPerfilResolvida(denunciaId: string) {
    if (!usuarioId || !ehAdmin) {
      setErro("Apenas moderadores podem remover denúncias de perfis resolvidas.");
      return;
    }

    if (acaoEmAndamento) {
      return;
    }

    const denuncia = denunciasPerfis.find((item) => item.id === denunciaId);

    if (!denuncia || denuncia.status !== "resolvida") {
      setErro("Somente denúncias de perfis resolvidas podem ser removidas do painel.");
      return;
    }

    const chaveAcao = `perfil-${denunciaId}-remover-denuncia`;

    setMenuDenunciaAbertoId("");
    setAcaoEmAndamento(chaveAcao);
    setErro("");
    setSucesso("");

    try {
      await persistirRemocaoDenunciaPerfilResolvidaModeracao({
        denunciaId,
      });

      setDenunciasPerfis((denunciasAtuais) =>
        denunciasAtuais.filter((denunciaAtual) => denunciaAtual.id !== denunciaId)
      );

      setSucesso("Denúncia de perfil resolvida removida do painel.");
    } catch (error) {
      setErro(criarMensagemErro("Erro ao remover denúncia de perfil resolvida", error));
    } finally {
      setAcaoEmAndamento("");
    }
  }

  return {
    atualizarStatusDenunciaPerfil,
    removerDenunciaPerfilResolvida,
  };
}
