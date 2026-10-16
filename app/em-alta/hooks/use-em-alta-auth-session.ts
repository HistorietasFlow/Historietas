"use client";

import { useEffect } from "react";
import { supabase } from "../../../lib/supabase/client";

export function useEmAltaAuthSession({
  setUsuarioLogado,
  setUsuarioLogadoId,
}: {
  setUsuarioLogado: (usuarioLogado: boolean) => void;
  setUsuarioLogadoId: (usuarioLogadoId: string) => void;
}) {
  useEffect(() => {
    let ativo = true;

    async function verificarUsuarioLogado() {
      try {
        const { data } = await supabase.auth.getUser();

        window.setTimeout(() => {
          if (ativo) {
            setUsuarioLogado(Boolean(data.user));
            setUsuarioLogadoId(data.user?.id || "");
          }
        }, 0);
      } catch {
        window.setTimeout(() => {
          if (ativo) {
            setUsuarioLogado(false);
            setUsuarioLogadoId("");
          }
        }, 0);
      }
    }

    void verificarUsuarioLogado();

    return () => {
      ativo = false;
    };
  }, [setUsuarioLogado, setUsuarioLogadoId]);

  async function usuarioTemSessaoAtiva() {
    try {
      const { data } = await supabase.auth.getUser();
      const userId = data.user?.id || "";
      const logado = Boolean(userId);

      setUsuarioLogado(logado);
      setUsuarioLogadoId(userId);

      return logado;
    } catch {
      setUsuarioLogado(false);
      setUsuarioLogadoId("");

      return false;
    }
  }

  return { usuarioTemSessaoAtiva };
}
