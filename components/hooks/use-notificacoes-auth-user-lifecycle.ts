import {
  useEffect,
  useEffectEvent,
  useRef,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from "react";
import { supabase } from "../../lib/supabase/client";

type SetState<T> = Dispatch<SetStateAction<T>>;

type UseNotificacoesAuthUserLifecycleParams = {
  montadoRef: MutableRefObject<boolean>;
  usuarioIdRef: MutableRefObject<string>;
  receberAvisosRef: MutableRefObject<boolean>;
  requisicaoAtualRef: MutableRefObject<number>;
  setUsuarioId: SetState<string>;
  setReceberAvisos: SetState<boolean>;
  setNotificacoesNaoLidas: SetState<number>;
  setCarregandoNotificacoes: SetState<boolean>;
  atualizarNotificacoesPorUsuario: (
    userId: string,
    mostrarCarregamento?: boolean,
  ) => Promise<void>;
  limparAtualizacaoAgendada: () => void;
  limparCanal: () => void;
  carregarReceberAvisos: (userId: string) => boolean;
  idUsuarioSupabaseValido: (userId: string) => boolean;
  erroEhSessaoAusente: (error: unknown) => boolean;
};

export function useNotificacoesAuthUserLifecycle({
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
}: UseNotificacoesAuthUserLifecycleParams) {
  const authTimerRef = useRef<number | null>(null);
  const carregarReceberAvisosNoEfeito = useEffectEvent(carregarReceberAvisos);
  const idUsuarioSupabaseValidoNoEfeito = useEffectEvent(
    idUsuarioSupabaseValido,
  );
  const erroEhSessaoAusenteNoEfeito = useEffectEvent(erroEhSessaoAusente);

  useEffect(() => {
    montadoRef.current = true;

    function limparAtualizacaoAuth() {
      if (authTimerRef.current !== null) {
        window.clearTimeout(authTimerRef.current);
        authTimerRef.current = null;
      }
    }

    async function obterUsuarioIdAtualNotificacoes() {
      try {
        const { data, error } = await supabase.auth.getUser();

        if (error) {
          return "";
        }

        const userId = data.user?.id || "";

        return idUsuarioSupabaseValidoNoEfeito(userId) ? userId : "";
      } catch (error) {
        if (!erroEhSessaoAusenteNoEfeito(error)) {
          console.warn("Não consegui carregar usuário das notificações:", error);
        }

        return "";
      }
    }

    async function carregarUsuarioAtual() {
      const userId = await obterUsuarioIdAtualNotificacoes();

      if (!montadoRef.current) {
        return;
      }

      const avisosAtivos = carregarReceberAvisosNoEfeito(userId);

      usuarioIdRef.current = userId;
      receberAvisosRef.current = avisosAtivos;
      setUsuarioId(userId);
      setReceberAvisos(avisosAtivos);
      await atualizarNotificacoesPorUsuario(userId, true);
    }

    void carregarUsuarioAtual().catch((error) => {
      if (!erroEhSessaoAusenteNoEfeito(error)) {
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
      const userIdSeguro = idUsuarioSupabaseValidoNoEfeito(userId)
        ? userId
        : "";

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
          ? carregarReceberAvisosNoEfeito(userIdSeguro)
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
    limparCanal,
    montadoRef,
    receberAvisosRef,
    requisicaoAtualRef,
    setCarregandoNotificacoes,
    setNotificacoesNaoLidas,
    setReceberAvisos,
    setUsuarioId,
    usuarioIdRef,
  ]);
}
