import { useEffect, useRef } from "react";
import type { Dispatch, SetStateAction } from "react";
import { supabase } from "../../../lib/supabase/client";
import {
  criarContextoRecuperacao,
  invalidarContextoRecuperacao,
  obterSessaoRecuperacao,
  type ContextoRecuperacao,
  type EstadoLink,
} from "../lib/redefinir-senha-recovery-utils";

export function useRedefinirSenhaRecoveryValidation(
  setEstadoLink: Dispatch<SetStateAction<EstadoLink>>,
  aoInvalidar?: () => void,
) {
  const contextoRecuperacaoRef = useRef(criarContextoRecuperacao());
  useEffect(() => {
    let ativo = true;
    let revogado = false;
    let contextoValidado: ContextoRecuperacao | null = null;
    function invalidar() {
      invalidarContextoRecuperacao(contextoRecuperacaoRef);
      if (ativo) {
        setEstadoLink("invalido");
        aoInvalidar?.();
      }
    }
    async function validarRecuperacao() {
      if (!ativo) return;
      const query = window.location.search;
      const contexto = criarContextoRecuperacao(query);
      contextoRecuperacaoRef.current = contexto;
      setEstadoLink("verificando");
      aoInvalidar?.();
      const params = new URLSearchParams(query);
      const retornoConfirmado = params.get("recuperacao") === "1";
      const erroNoLink = params.get("erro") === "link-invalido";
      if (revogado || contextoValidado?.consumido || contextoValidado?.emAlteracao || !retornoConfirmado || erroNoLink) { invalidar(); return; }
      const sessao = await obterSessaoRecuperacao();
      if (!ativo || contextoRecuperacaoRef.current !== contexto) return;
      if (window.location.search !== query || !sessao) { invalidar(); return; }
      const anterior = contextoValidado?.sessao;
      if (anterior && (anterior.usuarioId !== sessao.usuarioId || anterior.sessaoId !== sessao.sessaoId)) {
        revogado = true;
        invalidar();
        return;
      }
      contexto.sessao = sessao;
      contexto.estado = "valido";
      contextoValidado = contexto;
      setEstadoLink("valido");
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((evento, session) => {
      if (!ativo) return;
      const contexto = contextoRecuperacaoRef.current;
      if (evento === "SIGNED_OUT" && contexto.logoutSolicitado && !session) {
        return;
      }
      if (evento === "INITIAL_SESSION" && contexto.estado === "verificando") return;
      if (session && session.access_token === contexto.sessao?.accessToken &&
        session.user.id === contexto.sessao.usuarioId && evento !== "PASSWORD_RECOVERY") return;
      if (evento === "PASSWORD_RECOVERY") {
        revogado = false;
        contextoValidado = null;
      } else if (evento !== "TOKEN_REFRESHED") {
        revogado = true;
      }
      invalidar();
      // Não chamar Auth dentro do callback: ele executa sob lock do SDK.
      if (evento === "PASSWORD_RECOVERY" || evento === "TOKEN_REFRESHED") void Promise.resolve().then(validarRecuperacao);
    });
    const validarNavegacao = () => { invalidar(); void validarRecuperacao(); };
    window.addEventListener("popstate", validarNavegacao);
    void validarRecuperacao();
    return () => {
      ativo = false;
      invalidarContextoRecuperacao(contextoRecuperacaoRef);
      subscription.unsubscribe();
      window.removeEventListener("popstate", validarNavegacao);
    };
  }, [setEstadoLink, aoInvalidar]);
  return contextoRecuperacaoRef;
}
