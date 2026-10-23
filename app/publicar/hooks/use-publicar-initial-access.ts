"use client";

import { useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import { supabase } from "../../../lib/supabase/client";
import {
  criarHrefAceiteTermos,
  verificarAceiteTermosPublicacao,
} from "../../../lib/aceiteTermos";
import {
  criarLoginHrefPublicar,
  obterNomeMetadataPublicar,
} from "../lib/publicar-auth-utils";
import { carregarNomePerfilPublicar } from "../lib/publicar-profile-loader";

type PublicarRouter = {
  replace: (href: string) => void;
};

type UsePublicarInitialAccessParams = {
  router: PublicarRouter;
  setAutor: Dispatch<SetStateAction<string>>;
  setVerificandoAutenticacao: Dispatch<SetStateAction<boolean>>;
};

export function usePublicarInitialAccess({
  router,
  setAutor,
  setVerificandoAutenticacao,
}: UsePublicarInitialAccessParams) {
  useEffect(() => {
    let cancelado = false;

    async function verificarAutenticacaoPublicacao() {
      try {
        const { data, error } = await supabase.auth.getUser();

        if (cancelado) {
          return;
        }

        if (error || !data.user) {
          router.replace(criarLoginHrefPublicar());
          return;
        }

        const statusAceite = await verificarAceiteTermosPublicacao();

        if (cancelado) {
          return;
        }

        if (!statusAceite.aceito) {
          router.replace(criarHrefAceiteTermos("/publicar"));
          return;
        }

        const nomeFallback = obterNomeMetadataPublicar({
          email: data.user.email || "",
          user_metadata: data.user.user_metadata || {},
        });
        const nomePerfil = await carregarNomePerfilPublicar(
          data.user.id,
          nomeFallback
        );

        if (cancelado) {
          return;
        }

        window.setTimeout(() => {
          if (!cancelado) {
            if (nomePerfil) {
              setAutor((autorAtual) =>
                autorAtual.trim() ? autorAtual : nomePerfil
              );
            }

            setVerificandoAutenticacao(false);
          }
        }, 0);
      } catch {
        if (!cancelado) {
          router.replace(criarLoginHrefPublicar());
        }
      }
    }

    void verificarAutenticacaoPublicacao();

    return () => {
      cancelado = true;
    };
  }, [router]);
}
