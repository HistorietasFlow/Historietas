"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase/client";
import {
  criarLoginHrefSeguindo,
  obterParametrosSociaisSeguindoUrl,
} from "../lib/seguindo-route-utils";

type AbaSeguimentoPagina = "seguidores" | "seguindo";
type AbaConteudoSeguindo = "seguidores" | "obras" | "pessoas";

type UseSeguindoAccessSyncParams = {
  setUsuarioLogadoId: (userId: string) => void;
  setAbaSeguimento: (aba: AbaSeguimentoPagina) => void;
  setAbaConteudo: (aba: AbaConteudoSeguindo) => void;
  setPerfilSocialId: (perfilId: string) => void;
  setPerfilSocialNome: (perfilNome: string) => void;
  setVerificandoAcesso: (verificando: boolean) => void;
};

export function useSeguindoAccessSync({
  setUsuarioLogadoId,
  setAbaSeguimento,
  setAbaConteudo,
  setPerfilSocialId,
  setPerfilSocialNome,
  setVerificandoAcesso,
}: UseSeguindoAccessSyncParams) {
  const router = useRouter();

  useEffect(() => {
    let cancelado = false;

    async function verificarAcesso() {
      try {
        const { data } = await supabase.auth.getUser();
        const userId = data.user?.id || "";

        if (!userId) {
          router.replace(criarLoginHrefSeguindo());
          return;
        }

        const parametrosSociais = obterParametrosSociaisSeguindoUrl(userId);

        window.setTimeout(() => {
          if (!cancelado) {
            setUsuarioLogadoId(userId);
            setAbaSeguimento(parametrosSociais.aba);
            setAbaConteudo(parametrosSociais.conteudo);
            setPerfilSocialId(parametrosSociais.perfilId);
            setPerfilSocialNome(parametrosSociais.perfilNome);
            setVerificandoAcesso(false);
          }
        }, 0);
      } catch {
        if (!cancelado) {
          router.replace(criarLoginHrefSeguindo());
        }
      }
    }

    void verificarAcesso();

    return () => {
      cancelado = true;
    };
  }, [
    router,
    setAbaConteudo,
    setAbaSeguimento,
    setPerfilSocialId,
    setPerfilSocialNome,
    setUsuarioLogadoId,
    setVerificandoAcesso,
  ]);
}
