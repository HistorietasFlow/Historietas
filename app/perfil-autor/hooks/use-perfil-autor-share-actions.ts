import type {
  DadosCompartilhamentoPerfilAutor,
  NavegadorCompartilhamentoPerfilAutor,
} from "../types";
import {
  copiarTextoComFallbackPerfilAutor,
  criarUrlAbsolutaCompartilhamentoPerfilAutor,
  erroCompartilhamentoFoiCanceladoPerfilAutor,
} from "../lib/profile-sharing-utils";

export function usePerfilAutorShareActions({
  autorHandlePerfil,
  setMensagemAcao,
}: {
  autorHandlePerfil: string;
  setMensagemAcao: (mensagem: string) => void;
}) {
  async function compartilharLinkPerfilAutor({
    url,
    titulo,
    texto,
    mensagemCompartilhado,
    mensagemCopiado,
    mensagemErro,
  }: {
    url: string;
    titulo: string;
    texto: string;
    mensagemCompartilhado: string;
    mensagemCopiado: string;
    mensagemErro: string;
  }) {
    const urlFinal = criarUrlAbsolutaCompartilhamentoPerfilAutor(url);
    const dadosCompartilhamento: DadosCompartilhamentoPerfilAutor = {
      title: titulo,
      text: texto,
      url: urlFinal,
    };
    const navegadorCompartilhamento =
      navigator as NavegadorCompartilhamentoPerfilAutor;

    if (typeof navegadorCompartilhamento.share === "function") {
      try {
        if (
          !navegadorCompartilhamento.canShare ||
          navegadorCompartilhamento.canShare(dadosCompartilhamento)
        ) {
          await navegadorCompartilhamento.share(dadosCompartilhamento);
          setMensagemAcao(mensagemCompartilhado);
          return;
        }
      } catch (error) {
        if (erroCompartilhamentoFoiCanceladoPerfilAutor(error)) {
          return;
        }
      }
    }

    const linkCopiado = await copiarTextoComFallbackPerfilAutor(urlFinal);

    setMensagemAcao(linkCopiado ? mensagemCopiado : mensagemErro);
  }

  async function copiarUsernameCabecalho() {
    const usernameCompleto = autorHandlePerfil.startsWith("@")
      ? autorHandlePerfil
      : `@${autorHandlePerfil}`;
    const copiado = await copiarTextoComFallbackPerfilAutor(usernameCompleto);

    if (!copiado) {
      setMensagemAcao("Não foi possível copiar o username agora.");
    }
  }

  return { compartilharLinkPerfilAutor, copiarUsernameCabecalho };
}
