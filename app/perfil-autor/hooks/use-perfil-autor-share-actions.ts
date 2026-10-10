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
  perfilParaMostrar,
  perfilUsuarioRemotoAtivo,
  setMensagemAcao,
  setMenuPerfilAberto,
}: {
  autorHandlePerfil: string;
  perfilParaMostrar: { nome: string } | null;
  perfilUsuarioRemotoAtivo: { username?: string | null } | null;
  setMensagemAcao: (mensagem: string) => void;
  setMenuPerfilAberto: (aberto: boolean) => void;
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

  async function copiarLinkPerfil() {
    setMenuPerfilAberto(false);

    const nomePerfil = perfilParaMostrar?.nome || "este autor";
    const usernamePerfil = perfilUsuarioRemotoAtivo?.username
      ? ` (@${perfilUsuarioRemotoAtivo.username})`
      : "";

    await compartilharLinkPerfilAutor({
      url: window.location.href,
      titulo: `${nomePerfil} no HISTORIETAS`,
      texto: `Confira o perfil de ${nomePerfil}${usernamePerfil} no HISTORIETAS.`,
      mensagemCompartilhado: "Compartilhamento do perfil aberto.",
      mensagemCopiado: "",
      mensagemErro:
        "Não consegui compartilhar nem copiar o link do perfil neste navegador.",
    });
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

  return {
    compartilharLinkPerfilAutor,
    copiarLinkPerfil,
    copiarUsernameCabecalho,
  };
}
