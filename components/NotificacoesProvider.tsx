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
import { supabase } from "@/lib/supabase/client";
import { useNotificacoesAuthUserLifecycle } from "./hooks/use-notificacoes-auth-user-lifecycle";
import { useNotificacoesRealtimeLifecycle } from "./hooks/use-notificacoes-realtime-lifecycle";

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
  const montadoRef = useRef(false);
  const usuarioIdRef = useRef("");
  const receberAvisosRef = useRef(true);
  const requisicaoAtualRef = useRef(0);

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

  const {
    limparAtualizacaoAgendada,
    limparCanal,
    agendarAtualizacaoNotificacoes,
  } = useNotificacoesRealtimeLifecycle({
    usuarioId,
    receberAvisos,
    montadoRef,
    usuarioIdRef,
    receberAvisosRef,
    setNotificacoesNaoLidas,
    setCarregandoNotificacoes,
    atualizarNotificacoesPorUsuario,
    idUsuarioSupabaseValido,
  });

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

  const atualizarNotificacoes = useCallback(async () => {
    const userIdSeguro = usuarioIdRef.current;
    await atualizarNotificacoesPorUsuario(userIdSeguro);
  }, [atualizarNotificacoesPorUsuario]);

  useNotificacoesAuthUserLifecycle({
    montadoRef,
    usuarioIdRef,
    receberAvisosRef,
    requisicaoAtualRef,
    setUsuarioId,
    setReceberAvisos,
    setNotificacoesNaoLidas,
    setCarregandoNotificacoes,
    atualizarNotificacoesPorUsuario,
    limparAtualizacaoAgendada,
    limparCanal,
    carregarReceberAvisos,
    idUsuarioSupabaseValido,
    erroEhSessaoAusente,
  });

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
