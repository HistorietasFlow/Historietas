import { supabase } from "../../../lib/supabase/client";

import {
  criarLoginHrefLeitor,
} from "./ler-capitulo-login-route";
import {
  execucaoIdentidadeLeitorEstaAtual,
  type IdentidadeAutenticadaLeitor,
} from "./ler-capitulo-auth-identity";

type RouterLeitor = {
  push: (href: string) => void;
};

type CriarAcoesAutenticacaoLeitorProps = {
  obraId: string;
  capituloId: string;
  router: RouterLeitor;
  identidadeDadosAplicada: IdentidadeAutenticadaLeitor | null;
  identidadeAutenticadaLeitorRef: {
    current: IdentidadeAutenticadaLeitor;
  };
  setMensagemAcao: (valor: string) => void;
};

export function criarAcoesAutenticacaoLeitor({
  obraId,
  capituloId,
  router,
  identidadeDadosAplicada,
  identidadeAutenticadaLeitorRef,
  setMensagemAcao,
}: CriarAcoesAutenticacaoLeitorProps) {
  function execucaoIdentidadeAcaoEstaAtual() {
    return Boolean(
      identidadeDadosAplicada &&
      execucaoIdentidadeLeitorEstaAtual({
        cancelada: false,
        identidadeEsperada: identidadeDadosAplicada,
        identidadeAtual: identidadeAutenticadaLeitorRef.current,
      }),
    );
  }

  async function obterUsuarioLogadoIdAtual() {
    if (!execucaoIdentidadeAcaoEstaAtual()) {
      return "";
    }

    try {
      const { data } =
        await supabase.auth.getUser();

      if (!execucaoIdentidadeAcaoEstaAtual()) {
        return "";
      }

      const userId =
        data.user?.id || "";

      return userId === identidadeDadosAplicada?.usuarioId ? userId : "";
    } catch {
      return "";
    }
  }

  async function exigirLogin(
    mensagem: string,
  ) {
    const userId =
      await obterUsuarioLogadoIdAtual();

    if (userId) {
      setMensagemAcao("");
      return true;
    }

    setMensagemAcao(mensagem);

    router.push(
      criarLoginHrefLeitor(
        obraId,
        capituloId,
      ),
    );

    return false;
  }

  return {
    obterUsuarioLogadoIdAtual,
    exigirLogin,
    execucaoIdentidadeAcaoEstaAtual,
  };
}
