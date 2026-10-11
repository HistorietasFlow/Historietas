import type { TipoAlvoDenuncia } from "../../../components/DenunciaModal";
import { idObraSupabaseValido } from "../../../lib/utils";
import type { AlvoDenunciaConteudoPerfil } from "../types";
import { idAutorSupabaseValido } from "../lib/profile-formatters";

export function usePerfilAutorReportActions({
  podeEditarPerfil,
  perfilParaMostrar,
  setMensagemAcao,
  setMenuPerfilAberto,
  setDenunciaPerfilAberta,
  setObraMenuAbertoId,
  setAlvoDenunciaConteudoPerfil,
}: {
  podeEditarPerfil: boolean;
  perfilParaMostrar: { autorId: string } | null;
  setMensagemAcao: (mensagem: string) => void;
  setMenuPerfilAberto: (aberto: boolean) => void;
  setDenunciaPerfilAberta: (aberta: boolean) => void;
  setObraMenuAbertoId: (obraId: string) => void;
  setAlvoDenunciaConteudoPerfil: (
    alvo: AlvoDenunciaConteudoPerfil,
  ) => void;
}) {
  function abrirDenunciaPerfil() {
    if (podeEditarPerfil || !perfilParaMostrar) {
      return;
    }

    const perfilDenunciadoId = perfilParaMostrar.autorId.trim();

    if (!perfilDenunciadoId || !idAutorSupabaseValido(perfilDenunciadoId)) {
      setMensagemAcao("Não foi possível identificar este perfil.");
      return;
    }

    setMenuPerfilAberto(false);
    setMensagemAcao("");
    setDenunciaPerfilAberta(true);
  }

  function abrirDenunciaConteudoPerfil(
    alvoTipo: Extract<TipoAlvoDenuncia, "post" | "obra">,
    alvoId: string,
    alvoTitulo: string,
  ) {
    if (podeEditarPerfil) {
      return;
    }

    const alvoIdLimpo = alvoId.trim();

    if (!alvoIdLimpo || !idObraSupabaseValido(alvoIdLimpo)) {
      setMensagemAcao("Não foi possível identificar este conteúdo.");
      return;
    }

    setObraMenuAbertoId("");
    setMensagemAcao("");
    setAlvoDenunciaConteudoPerfil({
      alvoTipo,
      alvoId: alvoIdLimpo,
      alvoTitulo: alvoTitulo.trim() || "Conteúdo",
    });
  }

  return {
    abrirDenunciaPerfil,
    abrirDenunciaConteudoPerfil,
  };
}
