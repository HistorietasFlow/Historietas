import { supabase } from "../../../lib/supabase/client";

import {
  criarLoginHrefLeitor,
} from "./ler-capitulo-login-route";

type RouterLeitor = {
  push: (href: string) => void;
};

type CriarAcoesAutenticacaoLeitorProps = {
  usuarioIdLogado: string;
  obraId: string;
  capituloId: string;
  router: RouterLeitor;
  setUsuarioIdLogado: (valor: string) => void;
  setMensagemAcao: (valor: string) => void;
};

export function criarAcoesAutenticacaoLeitor({
  usuarioIdLogado,
  obraId,
  capituloId,
  router,
  setUsuarioIdLogado,
  setMensagemAcao,
}: CriarAcoesAutenticacaoLeitorProps) {
  async function obterUsuarioLogadoIdAtual() {
    if (usuarioIdLogado) {
      return usuarioIdLogado;
    }

    try {
      const { data } =
        await supabase.auth.getUser();

      const userId =
        data.user?.id || "";

      setUsuarioIdLogado(userId);

      return userId;
    } catch {
      setUsuarioIdLogado("");
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
  };
}
