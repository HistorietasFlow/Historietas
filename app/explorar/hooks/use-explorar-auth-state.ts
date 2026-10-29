"use client";

import {
  useEffect,
  type Dispatch,
  type SetStateAction,
} from "react";
import { supabase } from "../../../lib/supabase/client";
import type {
  FiltroColecaoExplorar,
} from "../lib/explorar-derived-utils";

type UseExplorarAuthStateParams = {
  setUsuarioLogado: Dispatch<SetStateAction<boolean>>;
  setMensagemLogin: Dispatch<SetStateAction<string>>;
  setFiltroColecao: Dispatch<SetStateAction<FiltroColecaoExplorar>>;
};

export function useExplorarAuthState({
  setUsuarioLogado,
  setMensagemLogin,
  setFiltroColecao,
}: UseExplorarAuthStateParams) {
  useEffect(() => {
    let componenteAtivo = true;

    async function verificarUsuarioLogado() {
      try {
        const { data } = await supabase.auth.getUser();

        if (componenteAtivo) {
          const userId = data.user?.id || "";

          setUsuarioLogado(Boolean(userId));
        }
      } catch {
        if (componenteAtivo) {
          setUsuarioLogado(false);
        }
      }
    }

    void verificarUsuarioLogado();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const userId = session?.user?.id || "";

      setUsuarioLogado(Boolean(userId));

      if (session?.user) {
        setMensagemLogin("");
        return;
      }

      setFiltroColecao("todos");
    });

    return () => {
      componenteAtivo = false;
      subscription.unsubscribe();
    };
  }, [
    setUsuarioLogado,
    setMensagemLogin,
    setFiltroColecao,
  ]);
}
