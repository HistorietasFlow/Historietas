import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import { supabase } from "../../../../lib/supabase/client";
import {
  execucaoIdentidadeObraEstaAtual,
  type IdentidadeAutenticadaObra,
} from "../lib/obra-auth-identity";
import { criarLoginHrefObraPublica } from "../lib/obra-navigation-utils";

type UseObraActionAuthGuardsParams = {
  identidadeAutenticadaObraRef: MutableRefObject<IdentidadeAutenticadaObra>;
  setMensagemAcao: Dispatch<SetStateAction<string>>;
  redirecionarParaLogin: (href: string) => void;
};

export function useObraActionAuthGuards({
  identidadeAutenticadaObraRef,
  setMensagemAcao,
  redirecionarParaLogin,
}: UseObraActionAuthGuardsParams) {
  async function obterIdentidadeLogadaParaAcao(mensagem: string) {
    const identidadeEsperada = identidadeAutenticadaObraRef.current;
    const execucaoAtual = () =>
      execucaoIdentidadeObraEstaAtual({
        cancelada: false,
        identidadeEsperada,
        identidadeAtual: identidadeAutenticadaObraRef.current,
      });

    try {
      const { data } = await supabase.auth.getUser();

      if (!execucaoAtual()) {
        return null;
      }

      const userId = data.user?.id || "";

      if (userId && userId === identidadeEsperada.usuarioId) {
        return identidadeEsperada;
      }

      if (!userId && !identidadeEsperada.usuarioId) {
        const loginHref = await criarLoginHrefObraPublica();

        if (execucaoAtual()) {
          setMensagemAcao(mensagem);
          redirecionarParaLogin(loginHref);
        }
      }

      return null;
    } catch {
      if (!execucaoAtual()) {
        return null;
      }

      const loginHref = await criarLoginHrefObraPublica();

      if (execucaoAtual()) {
        setMensagemAcao(mensagem);
        redirecionarParaLogin(loginHref);
      }

      return null;
    }
  }

  function criarGuardIdentidadeAcao(
    identidadeEsperada: IdentidadeAutenticadaObra,
  ) {
    return () =>
      execucaoIdentidadeObraEstaAtual({
        cancelada: false,
        identidadeEsperada,
        identidadeAtual: identidadeAutenticadaObraRef.current,
      });
  }

  return {
    obterIdentidadeLogadaParaAcao,
    criarGuardIdentidadeAcao,
  };
}
