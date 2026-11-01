import {
  useCallback,
  useEffect,
  useRef,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase/client";

type SetState<T> = Dispatch<SetStateAction<T>>;

type UseNotificacoesRealtimeLifecycleParams = {
  usuarioId: string;
  receberAvisos: boolean;
  montadoRef: MutableRefObject<boolean>;
  usuarioIdRef: MutableRefObject<string>;
  receberAvisosRef: MutableRefObject<boolean>;
  setNotificacoesNaoLidas: SetState<number>;
  setCarregandoNotificacoes: SetState<boolean>;
  atualizarNotificacoesPorUsuario: (
    userId: string,
    mostrarCarregamento?: boolean,
  ) => Promise<void>;
  idUsuarioSupabaseValido: (userId: string) => boolean;
};

export function useNotificacoesRealtimeLifecycle({
  usuarioId,
  receberAvisos,
  montadoRef,
  usuarioIdRef,
  receberAvisosRef,
  setNotificacoesNaoLidas,
  setCarregandoNotificacoes,
  atualizarNotificacoesPorUsuario,
  idUsuarioSupabaseValido,
}: UseNotificacoesRealtimeLifecycleParams) {
  const canalRef = useRef<RealtimeChannel | null>(null);
  const atualizarTimerRef = useRef<number | null>(null);

  const limparAtualizacaoAgendada = useCallback(() => {
    if (atualizarTimerRef.current !== null) {
      window.clearTimeout(atualizarTimerRef.current);
      atualizarTimerRef.current = null;
    }
  }, []);

  const limparCanal = useCallback(() => {
    if (canalRef.current) {
      const canalAtual = canalRef.current;
      canalRef.current = null;
      void supabase.removeChannel(canalAtual);
    }
  }, []);

  const agendarAtualizacaoNotificacoes = useCallback(
    (userId: string) => {
      const userIdSeguro = userId.trim();

      if (
        !receberAvisosRef.current ||
        !idUsuarioSupabaseValido(userIdSeguro) ||
        usuarioIdRef.current !== userIdSeguro
      ) {
        return;
      }

      limparAtualizacaoAgendada();

      atualizarTimerRef.current = window.setTimeout(() => {
        atualizarTimerRef.current = null;
        void atualizarNotificacoesPorUsuario(userIdSeguro);
      }, 250);
    },
    [
      atualizarNotificacoesPorUsuario,
      idUsuarioSupabaseValido,
      limparAtualizacaoAgendada,
      receberAvisosRef,
      usuarioIdRef,
    ],
  );

  useEffect(() => {
    limparAtualizacaoAgendada();
    limparCanal();

    const userIdSeguro = usuarioId.trim();

    if (!receberAvisos || !idUsuarioSupabaseValido(userIdSeguro)) {
      const resetNotificacoesTimer = window.setTimeout(() => {
        if (montadoRef.current && usuarioIdRef.current === userIdSeguro) {
          setNotificacoesNaoLidas(0);
          setCarregandoNotificacoes(false);
        }
      }, 0);

      return () => {
        window.clearTimeout(resetNotificacoesTimer);
      };
    }

    const atualizacaoInicialTimer = window.setTimeout(() => {
      void atualizarNotificacoesPorUsuario(userIdSeguro);
    }, 0);

    const canal = supabase
      .channel(`notificacoes-provider-${userIdSeguro}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notificacoes",
          filter: `user_id=eq.${userIdSeguro}`,
        },
        () => {
          agendarAtualizacaoNotificacoes(userIdSeguro);
        },
      )
      .subscribe();

    canalRef.current = canal;

    return () => {
      window.clearTimeout(atualizacaoInicialTimer);
      limparAtualizacaoAgendada();

      if (canalRef.current === canal) {
        canalRef.current = null;
      }

      void supabase.removeChannel(canal);
    };
  }, [
    agendarAtualizacaoNotificacoes,
    limparAtualizacaoAgendada,
    limparCanal,
    receberAvisos,
    usuarioId,
    atualizarNotificacoesPorUsuario,
    idUsuarioSupabaseValido,
    montadoRef,
    setCarregandoNotificacoes,
    setNotificacoesNaoLidas,
    usuarioIdRef,
  ]);

  return {
    limparAtualizacaoAgendada,
    limparCanal,
    agendarAtualizacaoNotificacoes,
  };
}
