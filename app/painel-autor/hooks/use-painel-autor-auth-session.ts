"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase/client";

export function usePainelAutorAuthSession() {
  const [usuarioIdLogado, setUsuarioIdLogado] = useState("");
  const [verificandoUsuario, setVerificandoUsuario] = useState(true);

  useEffect(() => {
    let componenteAtivo = true;

    async function carregarUsuarioAtual() {
      try {
        const { data } = await supabase.auth.getUser();
        const usuario = data.user;

        if (!componenteAtivo) {
          return;
        }

        setUsuarioIdLogado(usuario?.id || "");
        setVerificandoUsuario(false);
      } catch {
        if (componenteAtivo) {
          setUsuarioIdLogado("");
          setVerificandoUsuario(false);
        }
      }
    }

    void carregarUsuarioAtual();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_evento, sessao) => {
        if (!componenteAtivo) {
          return;
        }

        setUsuarioIdLogado(sessao?.user?.id || "");
        setVerificandoUsuario(false);
      }
    );

    return () => {
      componenteAtivo = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return { usuarioIdLogado, verificandoUsuario };
}
