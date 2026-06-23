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
  if (!Number.isFinite(total || 0)) {
    return 0;
  }

  return Math.max(0, Number(total || 0));
}

async function buscarTotalNotificacoesNaoLidas(userId: string) {
  if (!userId.trim()) {
    return 0;
  }

  const { count, error } = await supabase
    .from("notificacoes")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("lida", false);

  if (error) {
    return 0;
  }

  return normalizarTotalNotificacoes(count);
}

export function NotificacoesProvider({ children }: { children: ReactNode }) {
  const [usuarioId, setUsuarioId] = useState("");
  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState(0);
  const [carregandoNotificacoes, setCarregandoNotificacoes] = useState(true);
  const canalRef = useRef<RealtimeChannel | null>(null);
  const montadoRef = useRef(true);

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
    if (!userId.trim()) {
      if (montadoRef.current) {
        setNotificacoesNaoLidas(0);
        setCarregandoNotificacoes(false);
      }

      return;
    }

    if (montadoRef.current) {
      setCarregandoNotificacoes(true);
    }

    const total = await buscarTotalNotificacoesNaoLidas(userId);

    if (montadoRef.current) {
      setNotificacoesNaoLidas(total);
      setCarregandoNotificacoes(false);
    }
  }, []);

  const atualizarNotificacoes = useCallback(async () => {
    await atualizarNotificacoesPorUsuario(usuarioId);
  }, [atualizarNotificacoesPorUsuario, usuarioId]);

  useEffect(() => {
    montadoRef.current = true;

    async function carregarUsuarioAtual() {
      const { data } = await supabase.auth.getUser();
      const userId = data.user?.id || "";

      if (!montadoRef.current) {
        return;
      }

      setUsuarioId(userId);
      await atualizarNotificacoesPorUsuario(userId);
    }

    void carregarUsuarioAtual();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const userId = session?.user?.id || "";

      window.setTimeout(() => {
        if (!montadoRef.current) {
          return;
        }

        limparCanal();
        setUsuarioId(userId);
        void atualizarNotificacoesPorUsuario(userId);
      }, 0);
    });

    return () => {
      montadoRef.current = false;
      subscription.unsubscribe();
      limparCanal();
    };
  }, [atualizarNotificacoesPorUsuario, limparCanal]);

  useEffect(() => {
    limparCanal();

    if (!usuarioId.trim()) {
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
      .channel(`notificacoes-provider-${usuarioId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notificacoes",
          filter: `user_id=eq.${usuarioId}`,
        },
        () => {
          void atualizarNotificacoesPorUsuario(usuarioId);
        }
      )
      .subscribe();

    canalRef.current = canal;

    return () => {
      if (canalRef.current === canal) {
        canalRef.current = null;
      }

      void supabase.removeChannel(canal);
    };
  }, [atualizarNotificacoesPorUsuario, limparCanal, usuarioId]);

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
    ]
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
      "useNotificacoes precisa ser usado dentro de NotificacoesProvider."
    );
  }

  return contexto;
}
