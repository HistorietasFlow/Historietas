import type {
  DadosCompartilhamentoPerfilAutor,
  NavegadorCompartilhamentoPerfilAutor,
  ObraLocal,
} from "../types";
import {
  copiarTextoComFallbackPerfilAutor,
  criarDadosCompartilhamentoObraPerfilAutor,
  criarDadosCompartilhamentoPerfilAutor,
  criarUrlAbsolutaCompartilhamentoPerfilAutor,
  erroCompartilhamentoFoiCanceladoPerfilAutor,
  normalizarUsernameCopiavelPerfilAutor,
} from "../lib/profile-sharing-utils";

export function usePerfilAutorShareActions({
  autorHandlePerfil,
  perfilParaMostrar,
  perfilUsuarioRemotoAtivo,
  setMensagemAcao,
  setMenuPerfilAberto,
  setObraMenuAbertoId,
}: {
  autorHandlePerfil: string;
  perfilParaMostrar: { nome: string } | null;
  perfilUsuarioRemotoAtivo: { username?: string | null } | null;
  setMensagemAcao: (mensagem: string) => void;
  setMenuPerfilAberto: (aberto: boolean) => void;
  setObraMenuAbertoId: (obraId: string) => void;
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

  async function compartilharObraPerfilAutor(obra: ObraLocal) {
    setObraMenuAbertoId("");

    const dadosObra = criarDadosCompartilhamentoObraPerfilAutor(obra);

    await compartilharLinkPerfilAutor({
      ...dadosObra,
      mensagemCompartilhado: "Compartilhamento da obra aberto.",
      mensagemCopiado: "Link da obra copiado.",
      mensagemErro: "Não consegui compartilhar nem copiar o link da obra neste navegador.",
    });
  }

  async function copiarLinkPerfil() {
    setMenuPerfilAberto(false);

    const dadosPerfil = criarDadosCompartilhamentoPerfilAutor(
      perfilParaMostrar?.nome,
      perfilUsuarioRemotoAtivo?.username,
    );

    await compartilharLinkPerfilAutor({
      url: window.location.href,
      ...dadosPerfil,
      mensagemCompartilhado: "Compartilhamento do perfil aberto.",
      mensagemCopiado: "",
      mensagemErro:
        "Não consegui compartilhar nem copiar o link do perfil neste navegador.",
    });
  }

  async function copiarUsernameCabecalho() {
    const usernameCompleto =
      normalizarUsernameCopiavelPerfilAutor(autorHandlePerfil);
    const copiado = await copiarTextoComFallbackPerfilAutor(usernameCompleto);

    if (!copiado) {
      setMensagemAcao("Não foi possível copiar o username agora.");
    }
  }

  return {
    compartilharLinkPerfilAutor,
    compartilharObraPerfilAutor,
    copiarLinkPerfil,
    copiarUsernameCabecalho,
  };
}
