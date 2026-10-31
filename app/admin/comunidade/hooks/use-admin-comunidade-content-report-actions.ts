import type { Dispatch, SetStateAction } from "react";
import type { HistorietasLanguage } from "../../../../lib/i18n";
import { persistirArquivamentoDenunciaModeracao } from "../actions/arquivar-denuncia-moderacao";
import { persistirRemocaoDenunciaResolvidaModeracao } from "../actions/remover-denuncia-resolvida-moderacao";
import { removerConteudoDenunciadoModeracao } from "../actions/remover-conteudo-denunciado-moderacao";
import { persistirRestauracaoDenunciaModeracao } from "../actions/restaurar-denuncia-moderacao";
import { persistirStatusDenunciaModeracao } from "../actions/atualizar-status-denuncia-moderacao";
import { criarMensagemErro } from "../lib/admin-comunidade-error-utils";
import { rotuloSucessoRemocaoAlvo } from "../lib/admin-comunidade-report-label-utils";
import type { DenunciaComContexto } from "../lib/admin-comunidade-report-context-utils";
import {
  STATUS_LABEL,
  type StatusDenuncia,
} from "../lib/admin-comunidade-status-utils";
import {
  localeAdminComunidade,
  textoConfirmacaoRemocaoAdminComunidade,
} from "../lib/admin-comunidade-text-utils";

type UseAdminComunidadeContentReportActionsParams = {
  language: HistorietasLanguage;
  usuarioId: string;
  ehAdmin: boolean;
  acaoEmAndamento: string;
  denuncias: DenunciaComContexto[];
  observacoes: Record<string, string>;
  setDenuncias: Dispatch<SetStateAction<DenunciaComContexto[]>>;
  setObservacoes: Dispatch<SetStateAction<Record<string, string>>>;
  setAcaoEmAndamento: Dispatch<SetStateAction<string>>;
  setErro: Dispatch<SetStateAction<string>>;
  setSucesso: Dispatch<SetStateAction<string>>;
  setMenuDenunciaAbertoId: Dispatch<SetStateAction<string>>;
};

export function useAdminComunidadeContentReportActions({
  language,
  usuarioId,
  ehAdmin,
  acaoEmAndamento,
  denuncias,
  observacoes,
  setDenuncias,
  setObservacoes,
  setAcaoEmAndamento,
  setErro,
  setSucesso,
  setMenuDenunciaAbertoId,
}: UseAdminComunidadeContentReportActionsParams) {
  async function atualizarStatusDenuncia(
    denunciaId: string,
    novoStatus: StatusDenuncia
  ) {
    if (!usuarioId || !ehAdmin) {
      setErro("Apenas moderadores podem atualizar denúncias.");
      return;
    }

    const chaveAcao = `${denunciaId}-${novoStatus}`;

    if (acaoEmAndamento) {
      return;
    }

    setAcaoEmAndamento(chaveAcao);
    setErro("");
    setSucesso("");

    const observacaoAtual = observacoes[denunciaId]?.trim() || "";
    const analisadoEm = new Date().toISOString();

    try {
      await persistirStatusDenunciaModeracao({
        denunciaId,
        novoStatus,
        observacaoAtual,
        usuarioId,
        analisadoEm,
      });

      setDenuncias((denunciasAtuais) =>
        denunciasAtuais.map((denuncia) =>
          denuncia.id === denunciaId
            ? {
                ...denuncia,
                status: novoStatus,
                observacaoAdmin: observacaoAtual.slice(0, 800),
                analisadoPor: usuarioId,
                analisadoEm,
              }
            : denuncia
        )
      );

      setSucesso(`Denúncia marcada como ${STATUS_LABEL[novoStatus].toLowerCase()}.`);
    } catch (error) {
      setErro(criarMensagemErro("Erro ao atualizar denúncia", error));
    } finally {
      setAcaoEmAndamento("");
    }
  }

  async function removerConteudoDenunciado(denuncia: DenunciaComContexto) {
    if (!usuarioId || !ehAdmin) {
      setErro("Apenas moderadores podem remover conteúdo denunciado.");
      return;
    }

    if (
      denuncia.arquivada ||
      (denuncia.status !== "pendente" && denuncia.status !== "em_analise")
    ) {
      setErro(
        "Somente den\u00fancias ativas e n\u00e3o arquivadas podem remover conte\u00fado."
      );
      return;
    }
    if (acaoEmAndamento) {
      return;
    }

    if (
      !window.confirm(
        textoConfirmacaoRemocaoAdminComunidade(denuncia.alvoTipo, language)
      )
    ) {
      return;
    }

    const chaveAcao = `${denuncia.id}-remover-conteudo`;
    const observacaoAtual = observacoes[denuncia.id]?.trim() || "";
    const observacaoFinal =
      observacaoAtual ||
      `Conteúdo removido pela moderação em ${new Date().toLocaleDateString(
        localeAdminComunidade(language)
      )}.`;
    const analisadoEm = new Date().toISOString();

    setAcaoEmAndamento(chaveAcao);
    setErro("");
    setSucesso("");

    try {
      await removerConteudoDenunciadoModeracao({
        alvoTipo: denuncia.alvoTipo,
        alvoId: denuncia.alvoId,
        observacaoFinal,
      });
    } catch (error) {
      setErro(criarMensagemErro("Erro ao remover conteúdo denunciado", error));
      return;
    } finally {
      setAcaoEmAndamento("");
    }

    setDenuncias((denunciasAtuais) =>
      denunciasAtuais.map((denunciaAtual) =>
        denunciaAtual.alvoTipo === denuncia.alvoTipo &&
        denunciaAtual.alvoId === denuncia.alvoId
          ? {
              ...denunciaAtual,
              status: "resolvida",
              observacaoAdmin: observacaoFinal.slice(0, 800),
              analisadoPor: usuarioId,
              analisadoEm,
              alvoResumo: `Conteúdo removido pela moderação. Registro anterior: ${denunciaAtual.alvoResumo}`,
            }
          : denunciaAtual
      )
    );

    setObservacoes((observacoesAtuais) => ({
      ...observacoesAtuais,
      [denuncia.id]: observacaoFinal.slice(0, 800),
    }));

    setSucesso(
      `${rotuloSucessoRemocaoAlvo(
        denuncia.alvoTipo
      )} e denúncia marcada como resolvida.`
    );
  }

  async function arquivarDenuncia(denunciaId: string) {
    if (!usuarioId || !ehAdmin) {
      setErro("Apenas moderadores podem arquivar denúncias.");
      return;
    }

    if (acaoEmAndamento) {
      return;
    }

    const chaveAcao = `${denunciaId}-arquivar`;

    setMenuDenunciaAbertoId("");
    setAcaoEmAndamento(chaveAcao);
    setErro("");
    setSucesso("");

    try {
      await persistirArquivamentoDenunciaModeracao({
        denunciaId,
      });

      setDenuncias((denunciasAtuais) =>
        denunciasAtuais.map((denuncia) =>
          denuncia.id === denunciaId
            ? {
                ...denuncia,
                arquivada: true,
              }
            : denuncia
        )
      );

      setSucesso("Denúncia arquivada e ocultada do painel principal.");
    } catch (error) {
      setErro(criarMensagemErro("Erro ao arquivar denúncia", error));
    } finally {
      setAcaoEmAndamento("");
    }
  }

  async function restaurarDenunciaArquivada(denunciaId: string) {
    if (!usuarioId || !ehAdmin) {
      setErro("Apenas moderadores podem restaurar denúncias.");
      return;
    }

    if (acaoEmAndamento) {
      return;
    }

    const chaveAcao = `${denunciaId}-restaurar`;

    setMenuDenunciaAbertoId("");
    setAcaoEmAndamento(chaveAcao);
    setErro("");
    setSucesso("");

    try {
      await persistirRestauracaoDenunciaModeracao({
        denunciaId,
      });

      setDenuncias((denunciasAtuais) =>
        denunciasAtuais.map((denuncia) =>
          denuncia.id === denunciaId
            ? {
                ...denuncia,
                arquivada: false,
              }
            : denuncia
        )
      );

      setSucesso("Denúncia restaurada para o painel principal.");
    } catch (error) {
      setErro(criarMensagemErro("Erro ao restaurar denúncia", error));
    } finally {
      setAcaoEmAndamento("");
    }
  }

  async function removerDenunciaResolvida(denunciaId: string) {
    if (!usuarioId || !ehAdmin) {
      setErro("Apenas moderadores podem remover denúncias resolvidas.");
      return;
    }

    if (acaoEmAndamento) {
      return;
    }

    const denuncia = denuncias.find((item) => item.id === denunciaId);

    if (!denuncia || denuncia.status !== "resolvida") {
      setErro("Somente denúncias resolvidas podem ser removidas do painel.");
      return;
    }

    const chaveAcao = `${denunciaId}-remover-denuncia`;

    setMenuDenunciaAbertoId("");
    setAcaoEmAndamento(chaveAcao);
    setErro("");
    setSucesso("");

    try {
      await persistirRemocaoDenunciaResolvidaModeracao({
        denunciaId,
      });

      setDenuncias((denunciasAtuais) =>
        denunciasAtuais.filter((denunciaAtual) => denunciaAtual.id !== denunciaId)
      );
      setObservacoes((observacoesAtuais) => {
        const proximasObservacoes = { ...observacoesAtuais };
        delete proximasObservacoes[denunciaId];
        return proximasObservacoes;
      });
      setSucesso("Denúncia resolvida removida do painel.");
    } catch (error) {
      setErro(criarMensagemErro("Erro ao remover denúncia resolvida", error));
    } finally {
      setAcaoEmAndamento("");
    }
  }

  return {
    atualizarStatusDenuncia,
    removerConteudoDenunciado,
    arquivarDenuncia,
    restaurarDenunciaArquivada,
    removerDenunciaResolvida,
  };
}
