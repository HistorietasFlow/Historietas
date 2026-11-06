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
  setUsuarioIdExplorar: Dispatch<SetStateAction<string>>;
  setUsuarioLogado: Dispatch<SetStateAction<boolean>>;
  setMensagemLogin: Dispatch<SetStateAction<string>>;
  setFiltroColecao: Dispatch<SetStateAction<FiltroColecaoExplorar>>;
};

export function useExplorarAuthState({
  setUsuarioIdExplorar,
  setUsuarioLogado,
  setMensagemLogin,
  setFiltroColecao,
}: UseExplorarAuthStateParams) {
  useEffect(() => {
    let componenteAtivo = true;
    let versaoIdentidade = 0;

    async function verificarUsuarioLogado() {
      const versaoConsulta = versaoIdentidade;

      try {
        const { data } = await supabase.auth.getUser();

        if (
          componenteAtivo &&
          versaoIdentidade === versaoConsulta
        ) {
          const userId = data.user?.id || "";

          setUsuarioIdExplorar(userId);
          setUsuarioLogado(Boolean(userId));
        }
      } catch {
        if (
          componenteAtivo &&
          versaoIdentidade === versaoConsulta
        ) {
          setUsuarioIdExplorar("");
          setUsuarioLogado(false);
        }
      }
    }

    void verificarUsuarioLogado();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      versaoIdentidade += 1;
      const userId = session?.user?.id || "";

      setUsuarioIdExplorar(userId);
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
    setUsuarioIdExplorar,
    setUsuarioLogado,
    setMensagemLogin,
    setFiltroColecao,
  ]);
}
