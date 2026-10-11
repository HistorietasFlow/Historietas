import { useEffect, type Dispatch, type SetStateAction } from "react";
import { supabase } from "../../../lib/supabase/client";
import { idAutorSupabaseValido } from "../lib/profile-formatters";

export function usePerfilAutorNotificationCountSync({
  usuarioNotificacoesId,
  usuarioIdLogado,
  setNotificacoesNaoLidasPerfil,
}: {
  usuarioNotificacoesId: string;
  usuarioIdLogado: string;
  setNotificacoesNaoLidasPerfil: Dispatch<SetStateAction<number | null>>;
}) {
  useEffect(() => {
    const userIdSeguro = (
      usuarioNotificacoesId || usuarioIdLogado
    ).trim();

    if (!idAutorSupabaseValido(userIdSeguro)) {
      const limparContadorTimer = window.setTimeout(() => {
        setNotificacoesNaoLidasPerfil(null);
      }, 0);

      return () => {
        window.clearTimeout(limparContadorTimer);
      };
    }

    let cancelado = false;
    let timerAtualizacao: number | null = null;

    function limparTimerAtualizacao() {
      if (timerAtualizacao !== null) {
        window.clearTimeout(timerAtualizacao);
        timerAtualizacao = null;
      }
    }

    async function carregarContadorNotificacoesPerfil() {
      const [
        {
          data: notificacoesData,
          count: notificacoesCount,
          error: notificacoesError,
        },
        { data: solicitacoesData, error: solicitacoesError },
      ] = await Promise.all([
        supabase
          .from("notificacoes")
          .select("notificacao_id", { count: "exact" })
          .eq("user_id", userIdSeguro)
          .eq("lida", false)
          .limit(1000),
        supabase
          .from("solicitacoes_seguidores")
          .select("solicitante_id")
          .eq("destinatario_id", userIdSeguro)
          .limit(1000),
      ]);

      if (cancelado) {
        return;
      }

      if (notificacoesError) {
        console.warn(
          "Não consegui atualizar o contador de notificações do perfil:",
          notificacoesError.message,
        );
        setNotificacoesNaoLidasPerfil(null);
        return;
      }

      const idsNotificacoesDiretas = new Set(
        (Array.isArray(notificacoesData) ? notificacoesData : [])
          .map((registro) => {
            const notificacaoId = (
              registro as { notificacao_id?: unknown }
            ).notificacao_id;

            return typeof notificacaoId === "string"
              ? notificacaoId.trim()
              : "";
          })
          .filter(Boolean),
      );

      let solicitacoesPendentesSemNotificacao = 0;

      if (!solicitacoesError && Array.isArray(solicitacoesData)) {
        const solicitantesPendentes = new Set(
          solicitacoesData
            .map((registro) => {
              const solicitanteId = (
                registro as { solicitante_id?: unknown }
              ).solicitante_id;

              return typeof solicitanteId === "string"
                ? solicitanteId.trim()
                : "";
            })
            .filter(Boolean),
        );

        solicitantesPendentes.forEach((solicitanteId) => {
          const notificacaoIdEsperado =
            `solicitacao-seguidor:${solicitanteId}:${userIdSeguro}`;

          if (!idsNotificacoesDiretas.has(notificacaoIdEsperado)) {
            solicitacoesPendentesSemNotificacao += 1;
          }
        });
      }

      const totalDiretas = Number(
        notificacoesCount ??
          (Array.isArray(notificacoesData) ? notificacoesData.length : 0),
      );
      const totalSeguro = Number.isFinite(totalDiretas)
        ? Math.max(
            0,
            Math.trunc(totalDiretas) + solicitacoesPendentesSemNotificacao,
          )
        : solicitacoesPendentesSemNotificacao;

      setNotificacoesNaoLidasPerfil(totalSeguro);
    }

    function agendarAtualizacaoContador() {
      limparTimerAtualizacao();

      timerAtualizacao = window.setTimeout(() => {
        timerAtualizacao = null;
        void carregarContadorNotificacoesPerfil();
      }, 180);
    }

    function atualizarAoRetomarPerfil() {
      if (document.visibilityState === "visible") {
        agendarAtualizacaoContador();
      }
    }

    void carregarContadorNotificacoesPerfil();

    const canalContador = supabase
      .channel(`perfil-autor-contador-notificacoes-${userIdSeguro}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notificacoes",
          filter: `user_id=eq.${userIdSeguro}`,
        },
        agendarAtualizacaoContador,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "solicitacoes_seguidores",
          filter: `destinatario_id=eq.${userIdSeguro}`,
        },
        agendarAtualizacaoContador,
      )
      .subscribe();

    const intervaloAtualizacao = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        agendarAtualizacaoContador();
      }
    }, 20000);

    window.addEventListener(
      "historietas:notificacoes-atualizadas",
      agendarAtualizacaoContador,
    );
    window.addEventListener("focus", agendarAtualizacaoContador);
    document.addEventListener(
      "visibilitychange",
      atualizarAoRetomarPerfil,
    );

    return () => {
      cancelado = true;
      limparTimerAtualizacao();
      window.clearInterval(intervaloAtualizacao);
      window.removeEventListener(
        "historietas:notificacoes-atualizadas",
        agendarAtualizacaoContador,
      );
      window.removeEventListener("focus", agendarAtualizacaoContador);
      document.removeEventListener(
        "visibilitychange",
        atualizarAoRetomarPerfil,
      );
      void supabase.removeChannel(canalContador);
    };
  }, [
    usuarioIdLogado,
    usuarioNotificacoesId,
    setNotificacoesNaoLidasPerfil,
  ]);
}
