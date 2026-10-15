"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase/client";
import { criarLoginHrefHome } from "../lib/home-route-utils";

export default function useHomeAuthSession() {
  const router = useRouter();
  const [usuarioLogado, setUsuarioLogado] = useState(false);
  const [usuarioIdLogado, setUsuarioIdLogado] = useState("");
  const [avisoLogin, setAvisoLogin] = useState("");

  useEffect(() => {
    let cancelado = false;

    async function carregarUsuarioHome() {
      try {
        const { data } = await supabase.auth.getUser();
        const logado = Boolean(data.user);

        if (!cancelado) {
          setUsuarioLogado(logado);
          setUsuarioIdLogado(data.user?.id || "");

          if (logado) {
            setAvisoLogin("");
          }
        }
      } catch {
        if (!cancelado) {
          setUsuarioLogado(false);
          setUsuarioIdLogado("");
        }
      }
    }

    void carregarUsuarioHome();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_evento, session) => {
      const logado = Boolean(session?.user);

      setUsuarioLogado(logado);
      setUsuarioIdLogado(session?.user.id || "");

      if (logado) {
        setAvisoLogin("");
      }
    });

    return () => {
      cancelado = true;
      subscription.unsubscribe();
    };
  }, []);

  async function exigirLoginHome(mensagem: string) {
    try {
      const { data } = await supabase.auth.getUser();
      const logado = Boolean(data.user);

      setUsuarioLogado(logado);
      setUsuarioIdLogado(data.user?.id || "");

      if (logado) {
        setAvisoLogin("");
        return true;
      }
    } catch {
      setUsuarioLogado(false);
      setUsuarioIdLogado("");
    }

    setAvisoLogin(mensagem);
    router.push(criarLoginHrefHome());
    return false;
  }

  return {
    usuarioLogado,
    usuarioIdLogado,
    avisoLogin,
    setAvisoLogin,
    exigirLoginHome,
  };
}
