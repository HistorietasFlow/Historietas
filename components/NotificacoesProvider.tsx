"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

type NotificacoesContextValue = {
  usuarioId: string;
  notificacoesNaoLidas: number;
  carregandoNotificacoes: boolean;
  atualizarNotificacoes: () => Promise<void>;
  definirNotificacoesNaoLidas: (total: number) => void;
};

const NotificacoesContext = createContext<NotificacoesContextValue | null>(null);

function normalizarTotalNotificacoes(total: number | null | undefined) {
  const totalNumerico = Number(total || 0);

  if (!Number.isFinite(totalNumerico)) {
    return 0;
  }

  return Math.max(0, totalNumerico);
}

function idUsuarioSupabaseValido(userId: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    userId.trim(),
  );
}

function erroEhSessaoAusente(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const erro = error as {
    name?: unknown;
    message?: unknown;
  };

  const nome = typeof erro.name === "string" ? erro.name : "";
  const mensagem = typeof erro.message === "string" ? erro.message : "";

  return (
    nome === "AuthSessionMissingError" ||
    mensagem.toLowerCase().includes("auth session missing")
  );
}

async function obterUsuarioIdAtualNotificacoes() {
  try {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      return "";
    }

    const userId = data.user?.id || "";

    return idUsuarioSupabaseValido(userId) ? userId : "";
  } catch (error) {
    if (!erroEhSessaoAusente(error)) {
      console.warn("Não consegui carregar usuário das notificações:", error);
    }

    return "";
  }
}

async function buscarTotalNotificacoesNaoLidas(userId: string) {
  const userIdSeguro = userId.trim();

  if (!idUsuarioSupabaseValido(userIdSeguro)) {
    return 0;
  }

  try {
    const { count, error } = await supabase
      .from("notificacoes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userIdSeguro)
      .eq("lida", false);

    if (error) {
      return 0;
    }

    return normalizarTotalNotificacoes(count);
  } catch (error) {
    console.warn("Não consegui buscar notificações não lidas:", error);
    return 0;
  }
}

export function NotificacoesProvider({ children }: { children: ReactNode }) {
  const [usuarioId, setUsuarioId] = useState("");
  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState(0);
  const [carregandoNotificacoes, setCarregandoNotificacoes] = useState(true);
  const canalRef = useRef<RealtimeChannel | null>(null);
  const montadoRef = useRef(true);
  const atualizarTimerRef = useRef<number | null>(null);

  const limparAtualizacaoAgendada = useCallback(() => {
    if (atualizarTimerRef.current !== null) {
      window.clearTimeout(atualizarTimerRef.current);
      atualizarTimerRef.current = null;
    }
  }, []);

  const limparCanal = useCallback(() => {
    if (canalRef.current) {
      void supabase.removeChannel(canalRef.current);
      canalRef.current = null;
    }
  }, []);

  const definirNotificacoesNaoLidas = useCallback((total: number) => {
    setNotificacoesNaoLidas(normalizarTotalNotificacoes(total));
  }, []);

  const atualizarNotificacoesPorUsuario = useCallback(async (userId: string) => {
    const userIdSeguro = userId.trim();

    if (!idUsuarioSupabaseValido(userIdSeguro)) {
      if (montadoRef.current) {
        setNotificacoesNaoLidas(0);
        setCarregandoNotificacoes(false);
      }

      return;
    }

    if (montadoRef.current) {
      setCarregandoNotificacoes(true);
    }

    const total = await buscarTotalNotificacoesNaoLidas(userIdSeguro);

    if (montadoRef.current) {
      setNotificacoesNaoLidas(total);
      setCarregandoNotificacoes(false);
    }
  }, []);

  const agendarAtualizacaoNotificacoes = useCallback(
    (userId: string) => {
      const userIdSeguro = userId.trim();

      if (!idUsuarioSupabaseValido(userIdSeguro)) {
        return;
      }

      limparAtualizacaoAgendada();

      atualizarTimerRef.current = window.setTimeout(() => {
        atualizarTimerRef.current = null;
        void atualizarNotificacoesPorUsuario(userIdSeguro);
      }, 250);
    },
    [atualizarNotificacoesPorUsuario, limparAtualizacaoAgendada],
  );

  const atualizarNotificacoes = useCallback(async () => {
    await atualizarNotificacoesPorUsuario(usuarioId);
  }, [atualizarNotificacoesPorUsuario, usuarioId]);

  useEffect(() => {
    montadoRef.current = true;

    async function carregarUsuarioAtual() {
      const userId = await obterUsuarioIdAtualNotificacoes();

      if (!montadoRef.current) {
        return;
      }

      setUsuarioId(userId);
      await atualizarNotificacoesPorUsuario(userId);
    }

    void carregarUsuarioAtual().catch((error) => {
      if (!erroEhSessaoAusente(error)) {
        console.warn("Não consegui iniciar notificações:", error);
      }

      if (montadoRef.current) {
        setUsuarioId("");
        setNotificacoesNaoLidas(0);
        setCarregandoNotificacoes(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const userId = session?.user?.id || "";
      const userIdSeguro = idUsuarioSupabaseValido(userId) ? userId : "";

      window.setTimeout(() => {
        if (!montadoRef.current) {
          return;
        }

        limparAtualizacaoAgendada();
        limparCanal();
        setUsuarioId(userIdSeguro);
        void atualizarNotificacoesPorUsuario(userIdSeguro);
      }, 0);
    });

    return () => {
      montadoRef.current = false;
      limparAtualizacaoAgendada();
      subscription.unsubscribe();
      limparCanal();
    };
  }, [
    atualizarNotificacoesPorUsuario,
    limparAtualizacaoAgendada,
    limparCanal,
  ]);

  useEffect(() => {
    limparAtualizacaoAgendada();
    limparCanal();

    const userIdSeguro = usuarioId.trim();

    if (!idUsuarioSupabaseValido(userIdSeguro)) {
      const resetNotificacoesTimer = window.setTimeout(() => {
        if (montadoRef.current) {
          setNotificacoesNaoLidas(0);
          setCarregandoNotificacoes(false);
        }
      }, 0);

      return () => {
        window.clearTimeout(resetNotificacoesTimer);
      };
    }

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
    usuarioId,
  ]);

  const valor = useMemo(
    () => ({
      usuarioId,
      notificacoesNaoLidas,
      carregandoNotificacoes,
      atualizarNotificacoes,
      definirNotificacoesNaoLidas,
    }),
    [
      usuarioId,
      notificacoesNaoLidas,
      carregandoNotificacoes,
      atualizarNotificacoes,
      definirNotificacoesNaoLidas,
    ],
  );

  return (
    <NotificacoesContext.Provider value={valor}>
      {children}
    </NotificacoesContext.Provider>
  );
}

export function useNotificacoes() {
  const contexto = useContext(NotificacoesContext);

  if (!contexto) {
    throw new Error(
      "useNotificacoes precisa ser usado dentro de NotificacoesProvider.",
    );
  }

  return contexto;
}