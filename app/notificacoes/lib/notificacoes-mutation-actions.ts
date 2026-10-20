import { supabase } from "../../../lib/supabase/client";
import { idObraSupabaseValido } from "../../../lib/utils";
import {
  criarIdsNotificacoesRelacionadas,
  encontrarNotificacoesRelacionadasSolicitacaoSeguidor,
} from "./notificacoes-follow-request-utils";
import {
  atualizarEstadoLeituraNotificacao,
  marcarNotificacoesFiltradasComoLidasLocal,
  marcarTodasNotificacoesComoLidasLocal,
  removerNotificacaoLocal,
  separarNotificacoesLidasLocal,
} from "./notificacoes-local-actions-utils";
import { registrarNotificacoesApagadas } from "./notificacoes-local-state-utils";
import type { NotificacaoLocal } from "./notificacoes-models";
import {
  apagarNotificacaoSupabase,
  apagarNotificacoesSupabase,
  excluirNotificacoesLidasSupabase,
  sincronizarNotificacaoLidaSupabase,
  sincronizarNotificacoesLidasSupabase,
} from "./notificacoes-supabase-sync";

type CriarAcoesMutacaoNotificacoesParams = {
  notificacoes: NotificacaoLocal[];
  notificacoesFiltradas: NotificacaoLocal[];
  usuarioNotificacoesId: string;
  solicitacaoRespondendoId: string;
  atualizarNotificacoes: (notificacoes: NotificacaoLocal[]) => void;
  fecharMenuNotificacao: () => void;
  setSolicitacaoRespondendoId: (id: string) => void;
};

export function criarAcoesMutacaoNotificacoes({
  notificacoes,
  notificacoesFiltradas,
  usuarioNotificacoesId,
  solicitacaoRespondendoId,
  atualizarNotificacoes,
  fecharMenuNotificacao,
  setSolicitacaoRespondendoId,
}: CriarAcoesMutacaoNotificacoesParams) {
  function marcarComoLida(id: string) {
    const notificacaoAtual = notificacoes.find((notificacao) => notificacao.id === id);
    const novasNotificacoes = atualizarEstadoLeituraNotificacao(
      notificacoes,
      id,
      true,
    );

    atualizarNotificacoes(novasNotificacoes);

    if (notificacaoAtual) {
      void sincronizarNotificacaoLidaSupabase(notificacaoAtual, true, usuarioNotificacoesId);
    }
  }

  function marcarComoNaoLida(id: string) {
    const notificacaoAtual = notificacoes.find((notificacao) => notificacao.id === id);
    const novasNotificacoes = atualizarEstadoLeituraNotificacao(
      notificacoes,
      id,
      false,
    );

    atualizarNotificacoes(novasNotificacoes);

    if (notificacaoAtual) {
      void sincronizarNotificacaoLidaSupabase(notificacaoAtual, false, usuarioNotificacoesId);
    }
  }

  function abrirNotificacao(id: string) {
    marcarComoLida(id);
  }

  async function responderSolicitacaoSeguidorNotificacao(
    notificacao: NotificacaoLocal,
    aceitar: boolean
  ) {
    const solicitacaoId = notificacao.solicitacaoId?.trim() || "";

    if (
      !solicitacaoId ||
      !idObraSupabaseValido(solicitacaoId) ||
      solicitacaoRespondendoId
    ) {
      return;
    }

    setSolicitacaoRespondendoId(solicitacaoId);

    try {
      const { data, error } = await supabase.rpc(
        "responder_solicitacao_seguidor",
        {
          p_solicitacao_id: solicitacaoId,
          p_aceitar: aceitar,
        }
      );

      if (error || (data !== "aceita" && data !== "recusada")) {
        window.alert(
          error?.message || "Não foi possível responder esta solicitação."
        );
        return;
      }

      const notificacoesRelacionadas =
        encontrarNotificacoesRelacionadasSolicitacaoSeguidor(
          notificacoes,
          notificacao,
          solicitacaoId,
        );
      const idsRelacionados = criarIdsNotificacoesRelacionadas(
        notificacoesRelacionadas,
      );

      registrarNotificacoesApagadas(
        usuarioNotificacoesId,
        Array.from(idsRelacionados)
      );
      atualizarNotificacoes(
        notificacoes.filter(
          (notificacaoAtual) => !idsRelacionados.has(notificacaoAtual.id.trim())
        )
      );

      if (notificacoesRelacionadas.length > 0) {
        void apagarNotificacoesSupabase(
          notificacoesRelacionadas,
          usuarioNotificacoesId
        );
      }

      fecharMenuNotificacao();
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "Não foi possível responder esta solicitação."
      );
    } finally {
      setSolicitacaoRespondendoId("");
    }
  }

  function marcarTodasComoLidas() {
    const { notificacoesParaSincronizar, novasNotificacoes } =
      marcarTodasNotificacoesComoLidasLocal(notificacoes);

    atualizarNotificacoes(novasNotificacoes);
    void sincronizarNotificacoesLidasSupabase(
      notificacoesParaSincronizar,
      true,
      usuarioNotificacoesId
    );
  }

  function marcarFiltradasComoLidas() {
    const { notificacoesParaSincronizar, novasNotificacoes } =
      marcarNotificacoesFiltradasComoLidasLocal(
        notificacoes,
        notificacoesFiltradas,
      );

    atualizarNotificacoes(novasNotificacoes);
    void sincronizarNotificacoesLidasSupabase(
      notificacoesParaSincronizar,
      true,
      usuarioNotificacoesId
    );
  }

  function apagarNotificacao(id: string) {
    const notificacaoAtual = notificacoes.find((notificacao) => notificacao.id === id);
    const novasNotificacoes = removerNotificacaoLocal(notificacoes, id);

    if (notificacaoAtual) {
      registrarNotificacoesApagadas(usuarioNotificacoesId, [notificacaoAtual.id]);
    }

    atualizarNotificacoes(novasNotificacoes);

    if (notificacaoAtual) {
      void apagarNotificacaoSupabase(notificacaoAtual, usuarioNotificacoesId);
    }
  }

  function limparTodas() {
    const notificacoesParaApagar = [...notificacoes];

    registrarNotificacoesApagadas(
      usuarioNotificacoesId,
      notificacoesParaApagar.map((notificacao) => notificacao.id)
    );
    atualizarNotificacoes([]);
    void apagarNotificacoesSupabase(
      notificacoesParaApagar,
      usuarioNotificacoesId
    );
  }

  function limparLidas() {
    const { notificacoesLidas, novasNotificacoes } =
      separarNotificacoesLidasLocal(notificacoes);

    registrarNotificacoesApagadas(
      usuarioNotificacoesId,
      notificacoesLidas.map((notificacao) => notificacao.id)
    );
    atualizarNotificacoes(novasNotificacoes);
    void excluirNotificacoesLidasSupabase(usuarioNotificacoesId).then((excluiu) => {
      if (!excluiu) {
        void apagarNotificacoesSupabase(
          notificacoesLidas,
          usuarioNotificacoesId
        );
      }
    });
  }

  return {
    abrirNotificacao,
    apagarNotificacao,
    limparLidas,
    limparTodas,
    marcarComoLida,
    marcarComoNaoLida,
    marcarFiltradasComoLidas,
    marcarTodasComoLidas,
    responderSolicitacaoSeguidorNotificacao,
  };
}
