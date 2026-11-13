"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "../../../lib/supabase/client";

export type UsuarioAutenticadoListas = Awaited<
  ReturnType<typeof supabase.auth.getUser>
>["data"]["user"];

type ValidacaoListas = {
  chave: string;
  usuario: UsuarioAutenticadoListas;
  erro: string;
};

// Auth events invalidate the view; only getUser validates a new load.
export function useListasSessionScope(chaveRota: string) {
  const [versao, setVersao] = useState(0);
  const versaoRef = useRef(0);
  const usuarioObservadoRef = useRef<string | undefined>(undefined);
  const [validacao, setValidacao] = useState<ValidacaoListas | null>(null);
  const chave = JSON.stringify([chaveRota, versao]);

  useEffect(() => {
    let cancelado = false;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((evento, session) => {
      if (cancelado || evento === "INITIAL_SESSION") return;
      const id = session?.user.id || "";
      if (usuarioObservadoRef.current === id) return;
      usuarioObservadoRef.current = id;
      versaoRef.current += 1;
      setVersao(versaoRef.current);
    });
    return () => { cancelado = true; subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    let cancelado = false;
    const atual = () => !cancelado && versaoRef.current === versao;
    void (async () => {
      try {
        await Promise.resolve();
        if (!atual()) return;
        const { data, error } = await supabase.auth.getUser();
        if (!atual()) return;
        if (error && error.name !== "AuthSessionMissingError") throw error;
        const id = data.user?.id || "";
        if (usuarioObservadoRef.current !== undefined && usuarioObservadoRef.current !== id) {
          throw new Error("Identidade alterada durante o carregamento");
        }
        usuarioObservadoRef.current = id;
        setValidacao({ chave, usuario: data.user, erro: "" });
      } catch {
        if (atual()) setValidacao({ chave, usuario: null, erro: "Não foi possível carregar esta lista agora." });
      }
    })();
    return () => { cancelado = true; };
  }, [chave, versao]);

  // Route changes are hidden during render, before the old effect's cleanup.
  const dados = validacao?.chave === chave ? validacao : null;
  return { chave, carregando: !dados, erro: dados?.erro || "", usuario: dados?.usuario ?? null };
}
