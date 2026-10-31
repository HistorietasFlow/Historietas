import type { Dispatch, SetStateAction } from "react";
import { atualizarSolicitacaoExclusaoAdmin } from "../actions/atualizar-solicitacao-exclusao-admin";
import { recuperarOperacaoExclusaoAdmin } from "../actions/recuperar-operacao-exclusao-admin";
import {
  normalizarSolicitacao,
  type OperacaoRecuperavel,
  type SolicitacaoExclusao,
  type StatusSolicitacaoExclusao,
} from "../lib/admin-exclusoes-conta-normalization-utils";
import { criarLoginHrefAdminExclusoesConta } from "../lib/admin-exclusoes-conta-route-utils";
import type { TextoTraduzido } from "../lib/admin-exclusoes-conta-text-utils";

type UseAdminExclusoesContaActionsParams = {
  router: ReturnType<typeof import("next/navigation").useRouter>;
  t: (texto: TextoTraduzido) => string;
  statusRascunho: Record<string, StatusSolicitacaoExclusao>;
  observacoes: Record<string, string>;
  carregarOperacoesRecuperaveis: () => Promise<void>;
  setAcessoNegado: Dispatch<SetStateAction<boolean>>;
  setSolicitacoes: Dispatch<SetStateAction<SolicitacaoExclusao[]>>;
  setStatusRascunho: Dispatch<
    SetStateAction<Record<string, StatusSolicitacaoExclusao>>
  >;
  setObservacoes: Dispatch<SetStateAction<Record<string, string>>>;
  setAcaoEmAndamento: Dispatch<SetStateAction<string>>;
  setErro: Dispatch<SetStateAction<string>>;
  setSucesso: Dispatch<SetStateAction<string>>;
};

export function useAdminExclusoesContaActions({
  router,
  t,
  statusRascunho,
  observacoes,
  carregarOperacoesRecuperaveis,
  setAcessoNegado,
  setSolicitacoes,
  setStatusRascunho,
  setObservacoes,
  setAcaoEmAndamento,
  setErro,
  setSucesso,
}: UseAdminExclusoesContaActionsParams) {
  async function salvarSolicitacao(solicitacao: SolicitacaoExclusao) {
    const novoStatus = statusRascunho[solicitacao.id] || solicitacao.status;
    const observacaoInterna = observacoes[solicitacao.id] || "";

    if (observacaoInterna.length > 4000) {
      setErro(
        t({
          pt: "A observação interna pode ter no máximo 4000 caracteres.",
          en: "The internal note can have at most 4000 characters.",
          es: "La observación interna puede tener como máximo 4000 caracteres.",
        }),
      );
      return;
    }

    setAcaoEmAndamento(solicitacao.id);
    setErro("");
    setSucesso("");

    try {
      const { response, data } = await atualizarSolicitacaoExclusaoAdmin({
        id: solicitacao.id,
        status: novoStatus,
        observacaoInterna,
      });

      if (response.status === 401) {
        router.replace(criarLoginHrefAdminExclusoesConta());
        return;
      }

      if (response.status === 403) {
        setAcessoNegado(true);
        return;
      }

      if (!response.ok || !data?.ok) {
        throw new Error(
          data?.mensagem ||
            t({
              pt: "Não foi possível atualizar a solicitação.",
              en: "The request could not be updated.",
              es: "No se pudo actualizar la solicitud.",
            }),
        );
      }

      const atualizada = normalizarSolicitacao(data.solicitacao);

      if (!atualizada) {
        throw new Error(
          t({
            pt: "O servidor não retornou a solicitação atualizada.",
            en: "The server did not return the updated request.",
            es: "El servidor no devolvió la solicitud actualizada.",
          }),
        );
      }

      setSolicitacoes((atuais) =>
        atuais.map((item) => (item.id === atualizada.id ? atualizada : item)),
      );
      setStatusRascunho((atuais) => ({
        ...atuais,
        [atualizada.id]: atualizada.status,
      }));
      setObservacoes((atuais) => ({
        ...atuais,
        [atualizada.id]: atualizada.observacaoInterna,
      }));
      setSucesso(
        t({
          pt: "Solicitação atualizada com segurança.",
          en: "Request updated safely.",
          es: "Solicitud actualizada de forma segura.",
        }),
      );
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : t({
              pt: "Não foi possível atualizar a solicitação.",
              en: "The request could not be updated.",
              es: "No se pudo actualizar la solicitud.",
            }),
      );
    } finally {
      setAcaoEmAndamento("");
    }
  }

  async function recuperarOperacao(operacao: OperacaoRecuperavel) {
    const chaveAcao = `operacao:${operacao.id}`;
    setAcaoEmAndamento(chaveAcao);
    setErro("");
    setSucesso("");

    try {
      const { response, data } = await recuperarOperacaoExclusaoAdmin({
        id: operacao.id,
      });

      if (response.status === 401) {
        router.replace(criarLoginHrefAdminExclusoesConta());
        return;
      }

      if (response.status === 403) {
        setAcessoNegado(true);
        return;
      }

      if (!response.ok || !data?.ok) {
        throw new Error(
          data?.mensagem ||
            t({
              pt: "Não foi possível retomar esta exclusão.",
              en: "This deletion could not be resumed.",
              es: "No se pudo reanudar esta eliminación.",
            }),
        );
      }

      await carregarOperacoesRecuperaveis();

      setSucesso(
        data.exclusaoConcluida
          ? t({
              pt: "A recuperação foi concluída e a operação foi finalizada.",
              en: "Recovery completed and the operation was finalized.",
              es: "La recuperación se completó y la operación fue finalizada.",
            })
          : t({
              pt: "A recuperação foi executada, mas ainda há acompanhamento pendente.",
              en: "Recovery ran, but follow-up is still pending.",
              es: "La recuperación se ejecutó, pero aún requiere seguimiento.",
            }),
      );
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : t({
              pt: "Não foi possível retomar esta exclusão.",
              en: "This deletion could not be resumed.",
              es: "No se pudo reanudar esta eliminación.",
            }),
      );
    } finally {
      setAcaoEmAndamento("");
    }
  }

  return {
    salvarSolicitacao,
    recuperarOperacao,
  };
}
