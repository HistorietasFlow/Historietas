import type { Dispatch, SetStateAction } from "react";
import { registrarAceiteTermosPublicacao } from "../../../lib/aceiteTermos";
import { supabase } from "../../../lib/supabase/client";
import { execucaoAceiteEstaAtual, type ReferenciaExecucaoAceite } from "../lib/aceitar-termos-execution";
import type { ChaveTexto } from "../lib/aceitar-termos-translations";

type AceitarTermosRouter = {
  replace: (href: string) => void;
  refresh: () => void;
};

type UseAceitarTermosActionParams = {
  contextoRef: ReferenciaExecucaoAceite;
  router: AceitarTermosRouter;
  salvando: boolean;
  confirmouTermos: boolean;
  confirmouPrivacidade: boolean;
  redirectTo: string;
  t: (chave: ChaveTexto) => string;
  setErro: Dispatch<SetStateAction<string>>;
  setSalvando: Dispatch<SetStateAction<boolean>>;
};

export function useAceitarTermosAction({
  contextoRef,
  router,
  salvando,
  confirmouTermos,
  confirmouPrivacidade,
  redirectTo,
  t,
  setErro,
  setSalvando,
}: UseAceitarTermosActionParams) {
  const execucao = contextoRef.current;
  async function aceitar() {
    const atual = () => execucaoAceiteEstaAtual(contextoRef, execucao);
    if (!atual() || salvando || execucao.enviando || execucao.aceito) return;
    if (!execucao.pronto || !execucao.usuarioId) {
      setErro(t("erroLogin"));
      return;
    }
    if (!confirmouTermos || !confirmouPrivacidade) {
      setErro(t("erroMarcar"));
      return;
    }

    execucao.enviando = true;
    setSalvando(true);
    setErro("");
    try {
      const antes = await supabase.auth.getUser();
      if (!atual()) return;
      if (antes.error || antes.data.user?.id !== execucao.usuarioId) {
        execucao.pronto = false;
        setErro(t("erroLogin"));
        return;
      }
      const resultado = await registrarAceiteTermosPublicacao();
      if (!atual()) return;
      if (!resultado.aceito) {
        setErro(resultado.erro || t("erroSalvar"));
        return;
      }
      const depois = await supabase.auth.getUser();
      if (!atual()) return;
      if (depois.error || depois.data.user?.id !== execucao.usuarioId) {
        execucao.pronto = false;
        setErro(t("erroLogin"));
        return;
      }
      execucao.aceito = true;
      router.replace(redirectTo);
      router.refresh();
    } catch (error) {
      if (atual()) setErro(error instanceof Error ? error.message : t("erroSalvar"));
    } finally {
      execucao.enviando = false;
      if (atual()) setSalvando(false);
    }
  }

  return { aceitar };
}
