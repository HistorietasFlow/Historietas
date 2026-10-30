"use client";

import { useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import {
  obterRedirectToAceiteTermos,
  verificarAceiteTermosPublicacao,
} from "../../../lib/aceiteTermos";
import { supabase } from "../../../lib/supabase/client";

type AceitarTermosRouter = {
  replace: (href: string) => void;
};

type UseAceitarTermosInitialLoadParams = {
  router: AceitarTermosRouter;
  setRedirectTo: Dispatch<SetStateAction<string>>;
  setJaAceito: Dispatch<SetStateAction<boolean>>;
  setErro: Dispatch<SetStateAction<string>>;
  setCarregando: Dispatch<SetStateAction<boolean>>;
};

export function useAceitarTermosInitialLoad({
  router,
  setRedirectTo,
  setJaAceito,
  setErro,
  setCarregando,
}: UseAceitarTermosInitialLoadParams) {
  useEffect(() => {
    let ativo = true;

    async function carregar() {
      const params = new URLSearchParams(window.location.search);
      const destino = obterRedirectToAceiteTermos(params.get("redirectTo"), "/");

      if (ativo) {
        setRedirectTo(destino);
      }

      const { data, error } = await supabase.auth.getUser();

      if (!ativo) {
        return;
      }

      if (error || !data.user) {
        const paramsLogin = new URLSearchParams({
          redirectTo: `/aceitar-termos?${new URLSearchParams({ redirectTo: destino }).toString()}`,
        });
        router.replace(`/login?${paramsLogin.toString()}`);
        return;
      }

      const status = await verificarAceiteTermosPublicacao();

      if (!ativo) {
        return;
      }

      setJaAceito(status.aceito);
      setErro(status.erro && !status.aceito ? status.erro : "");
      setCarregando(false);
    }

    void carregar();

    return () => {
      ativo = false;
    };
  // Os setters de estado React são estáveis; o lifecycle original depende apenas do router.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);
}
