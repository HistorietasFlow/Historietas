"use client";

import { useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";

type UseConfiguracoesSecurityModalBodyLockParams = {
  mostrarSeguranca: boolean;
  salvandoSenha: boolean;
  setMostrarSeguranca: Dispatch<SetStateAction<boolean>>;
  setSenhaAtual: Dispatch<SetStateAction<string>>;
  setNovaSenha: Dispatch<SetStateAction<string>>;
  setConfirmarNovaSenha: Dispatch<SetStateAction<string>>;
  setErroSenha: Dispatch<SetStateAction<string>>;
  setSenhaAlterada: Dispatch<SetStateAction<boolean>>;
};

export function useConfiguracoesSecurityModalBodyLock({
  mostrarSeguranca,
  salvandoSenha,
  setMostrarSeguranca,
  setSenhaAtual,
  setNovaSenha,
  setConfirmarNovaSenha,
  setErroSenha,
  setSenhaAlterada,
}: UseConfiguracoesSecurityModalBodyLockParams) {
  useEffect(() => {
    if (!mostrarSeguranca || typeof document === "undefined") {
      return;
    }

    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function fecharComEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !salvandoSenha) {
        setMostrarSeguranca(false);
        setSenhaAtual("");
        setNovaSenha("");
        setConfirmarNovaSenha("");
        setErroSenha("");
        setSenhaAlterada(false);
      }
    }

    window.addEventListener("keydown", fecharComEscape);

    return () => {
      document.body.style.overflow = overflowAnterior;
      window.removeEventListener("keydown", fecharComEscape);
    };
  }, [
    mostrarSeguranca,
    salvandoSenha,
    setMostrarSeguranca,
    setSenhaAtual,
    setNovaSenha,
    setConfirmarNovaSenha,
    setErroSenha,
    setSenhaAlterada,
  ]);
}
