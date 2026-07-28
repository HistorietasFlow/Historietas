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

const CONFIG_STORAGE_KEY = "historietas-configuracoes-conta";
const CONFIGURACOES_ATUALIZADAS_EVENT =
  "historietas:configuracoes-atualizadas";

function criarChaveConfiguracoesUsuario(userId: string) {
  const userIdLimpo = userId.trim();

  return userIdLimpo ? `${CONFIG_STORAGE_KEY}:${userIdLimpo}` : "";
}

function carregarReceberAvisos(userId: string) {
  const chave = criarChaveConfiguracoesUsuario(userId);

  if (typeof window === "undefined" || !chave) {
    return true;
  }

  try {
    const texto = localStorage.getItem(chave);

    if (!texto) {
      return true;
    }

    const valor: unknown = JSON.parse(texto);

    if (!valor || typeof valor !== "object" || Array.isArray(valor)) {
      return true;
    }

    const receberAvisos = (valor as Record<string, unknown>).receberAvisos;

    return typeof receberAvisos === "boolean" ? receberAvisos : true;
  } catch {
    return true;
  }
}

function normalizarTotalNotificacoes(total: number | null | undefined) {
  const totalNumerico = Number(total ?? 0);

  if (!Number.isFinite(totalNumerico)) {
    return 0;
  }

  return Math.max(0, Math.trunc(totalNumerico));
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
      console.warn("Não consegui buscar notificações não lidas:", error.message);
      return null;
    }

    return normalizarTotalNotificacoes(count);
  } catch (error) {
    console.warn("Não consegui buscar notificações não lidas:", error);
    return null;
  }
}

export function NotificacoesProvider({ children }: { children: ReactNode }) {
  const [usuarioId, setUsuarioId] = useState("");
  const [receberAvisos, setReceberAvisos] = useState(true);
  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState(0);
  const [carregandoNotificacoes, setCarregandoNotificacoes] = useState(true);
  const canalRef = useRef<RealtimeChannel | null>(null);
  const montadoRef = useRef(false);
  const usuarioIdRef = useRef("");
  const receberAvisosRef = useRef(true);
  const atualizarTimerRef = useRef<number | null>(null);
  const authTimerRef = useRef<number | null>(null);
  const requisicaoAtualRef = useRef(0);

  const limparAtualizacaoAgendada = useCallback(() => {
    if (atualizarTimerRef.current !== null) {
      window.clearTimeout(atualizarTimerRef.current);
      atualizarTimerRef.current = null;
    }
  }, []);

  const limparAtualizacaoAuth = useCallback(() => {
    if (authTimerRef.current !== null) {
      window.clearTimeout(authTimerRef.current);
      authTimerRef.current = null;
    }
  }, []);

  const limparCanal = useCallback(() => {
    if (canalRef.current) {
      const canalAtual = canalRef.current;
      canalRef.current = null;
      void supabase.removeChannel(canalAtual);
    }
  }, []);

  const aplicarReceberAvisos = useCallback(
    (ativo: boolean) => {
      const receber = Boolean(ativo);

      receberAvisosRef.current = receber;

      if (!montadoRef.current) {
        return;
      }

      setReceberAvisos(receber);

      if (!receber) {
        requisicaoAtualRef.current += 1;
        limparAtualizacaoAgendada();
        limparCanal();
        setNotificacoesNaoLidas(0);
        setCarregandoNotificacoes(false);
      }
    },
    [limparAtualizacaoAgendada, limparCanal],
  );

  const definirNotificacoesNaoLidas = useCallback((total: number) => {
    if (!montadoRef.current) {
      return;
    }

    if (!receberAvisosRef.current) {
      setNotificacoesNaoLidas(0);
      return;
    }

    setNotificacoesNaoLidas(normalizarTotalNotificacoes(total));
  }, []);

  const atualizarNotificacoesPorUsuario = useCallback(
    async (userId: string, mostrarCarregamento = false) => {
      const userIdSeguro = userId.trim();
      const requisicaoId = requisicaoAtualRef.current + 1;
      requisicaoAtualRef.current = requisicaoId;

      if (!receberAvisosRef.current) {
        if (montadoRef.current && usuarioIdRef.current === userIdSeguro) {
          setNotificacoesNaoLidas(0);
          setCarregandoNotificacoes(false);
        }

        return;
      }

      if (!idUsuarioSupabaseValido(userIdSeguro)) {
        if (montadoRef.current && usuarioIdRef.current === userIdSeguro) {
          setNotificacoesNaoLidas(0);
          setCarregandoNotificacoes(false);
        }

        return;
      }

      if (
        mostrarCarregamento &&
        montadoRef.current &&
        usuarioIdRef.current === userIdSeguro
      ) {
        setCarregandoNotificacoes(true);
      }

      const total = await buscarTotalNotificacoesNaoLidas(userIdSeguro);

      if (
        !montadoRef.current ||
        requisicaoAtualRef.current !== requisicaoId ||
        usuarioIdRef.current !== userIdSeguro
      ) {
        return;
      }

      if (total !== null) {
        setNotificacoesNaoLidas(total);
      }

      setCarregandoNotificacoes(false);
    },
    [],
  );

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
    [atualizarNotificacoesPorUsuario, limparAtualizacaoAgendada],
  );

  const atualizarNotificacoes = useCallback(async () => {
    const userIdSeguro = usuarioIdRef.current;
    await atualizarNotificacoesPorUsuario(userIdSeguro);
  }, [atualizarNotificacoesPorUsuario]);

  useEffect(() => {
    montadoRef.current = true;

    async function carregarUsuarioAtual() {
      const userId = await obterUsuarioIdAtualNotificacoes();

      if (!montadoRef.current) {
        return;
      }

      const avisosAtivos = carregarReceberAvisos(userId);

      usuarioIdRef.current = userId;
      receberAvisosRef.current = avisosAtivos;
      setUsuarioId(userId);
      setReceberAvisos(avisosAtivos);
      await atualizarNotificacoesPorUsuario(userId, true);
    }

    void carregarUsuarioAtual().catch((error) => {
      if (!erroEhSessaoAusente(error)) {
        console.warn("Não consegui iniciar notificações:", error);
      }

      if (montadoRef.current) {
        usuarioIdRef.current = "";
        receberAvisosRef.current = true;
        setUsuarioId("");
        setReceberAvisos(true);
        setNotificacoesNaoLidas(0);
        setCarregandoNotificacoes(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const userId = session?.user?.id || "";
      const userIdSeguro = idUsuarioSupabaseValido(userId) ? userId : "";

      limparAtualizacaoAuth();
      authTimerRef.current = window.setTimeout(() => {
        authTimerRef.current = null;

        if (!montadoRef.current) {
          return;
        }

        requisicaoAtualRef.current += 1;
        limparAtualizacaoAgendada();
        limparCanal();
        const avisosAtivos = userIdSeguro
          ? carregarReceberAvisos(userIdSeguro)
          : true;

        usuarioIdRef.current = userIdSeguro;
        receberAvisosRef.current = avisosAtivos;
        setUsuarioId(userIdSeguro);
        setReceberAvisos(avisosAtivos);
        void atualizarNotificacoesPorUsuario(userIdSeguro, true);
      }, 0);
    });

    return () => {
      montadoRef.current = false;
      requisicaoAtualRef.current += 1;
      limparAtualizacaoAgendada();
      limparAtualizacaoAuth();
      subscription.unsubscribe();
      limparCanal();
    };
  }, [
    atualizarNotificacoesPorUsuario,
    limparAtualizacaoAgendada,
    limparAtualizacaoAuth,
    limparCanal,
  ]);

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

    void atualizarNotificacoesPorUsuario(userIdSeguro);

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
    receberAvisos,
    usuarioId,
    atualizarNotificacoesPorUsuario,
  ]);

  useEffect(() => {
    function atualizarAoReceberEventoLocal() {
      const userIdSeguro = usuarioIdRef.current;

      if (
        receberAvisosRef.current &&
        idUsuarioSupabaseValido(userIdSeguro)
      ) {
        agendarAtualizacaoNotificacoes(userIdSeguro);
      }
    }

    function atualizarPreferenciaDeAvisos() {
      const userIdSeguro = usuarioIdRef.current;
      const avisosAtivos = userIdSeguro
        ? carregarReceberAvisos(userIdSeguro)
        : true;

      aplicarReceberAvisos(avisosAtivos);
    }

    function atualizarAoMudarStorage(event: StorageEvent) {
      const chaveEsperada = criarChaveConfiguracoesUsuario(
        usuarioIdRef.current,
      );

      if (chaveEsperada && event.key === chaveEsperada) {
        atualizarPreferenciaDeAvisos();
      }
    }

    function atualizarAoRetomarPagina() {
      if (document.visibilityState !== "visible") {
        return;
      }

      atualizarPreferenciaDeAvisos();
      atualizarAoReceberEventoLocal();
    }

    window.addEventListener(
      "historietas:notificacoes-atualizadas",
      atualizarAoReceberEventoLocal,
    );
    window.addEventListener(
      CONFIGURACOES_ATUALIZADAS_EVENT,
      atualizarPreferenciaDeAvisos,
    );
    window.addEventListener("storage", atualizarAoMudarStorage);
    window.addEventListener("focus", atualizarAoRetomarPagina);
    document.addEventListener("visibilitychange", atualizarAoRetomarPagina);

    return () => {
      window.removeEventListener(
        "historietas:notificacoes-atualizadas",
        atualizarAoReceberEventoLocal,
      );
      window.removeEventListener(
        CONFIGURACOES_ATUALIZADAS_EVENT,
        atualizarPreferenciaDeAvisos,
      );
      window.removeEventListener("storage", atualizarAoMudarStorage);
      window.removeEventListener("focus", atualizarAoRetomarPagina);
      document.removeEventListener("visibilitychange", atualizarAoRetomarPagina);
    };
  }, [agendarAtualizacaoNotificacoes, aplicarReceberAvisos]);

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