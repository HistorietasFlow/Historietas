import type { RefObject } from "react";

export function usePerfilAutorProfileEditorActions({
  podeEditarPerfil,
  perfilParaMostrar,
  perfilUsuarioRemotoAtivo,
  bioAutorPersonalizada,
  avatarAutor,
  avatarNomePerfil,
  salvandoEditorPerfil,
  avatarInputRef,
  setNomePerfilEditor,
  setUsernamePerfilEditor,
  setBioPerfilEditor,
  setAvatarPerfilEditor,
  setAvatarNomePerfilEditor,
  setAvatarArquivoPerfilEditor,
  setAvatarErro,
  setMenuPerfilAberto,
  setEditorPerfilAberto,
}: {
  podeEditarPerfil: boolean;
  perfilParaMostrar: { nome: string } | null;
  perfilUsuarioRemotoAtivo: {
    nome?: string | null;
    username?: string | null;
  } | null;
  bioAutorPersonalizada: string;
  avatarAutor: string;
  avatarNomePerfil: string;
  salvandoEditorPerfil: boolean;
  avatarInputRef: RefObject<HTMLInputElement | null>;
  setNomePerfilEditor: (valor: string) => void;
  setUsernamePerfilEditor: (valor: string) => void;
  setBioPerfilEditor: (valor: string) => void;
  setAvatarPerfilEditor: (valor: string) => void;
  setAvatarNomePerfilEditor: (valor: string) => void;
  setAvatarArquivoPerfilEditor: (valor: File | null) => void;
  setAvatarErro: (valor: string) => void;
  setMenuPerfilAberto: (aberto: boolean) => void;
  setEditorPerfilAberto: (aberto: boolean) => void;
}) {
  function abrirEditorPerfil() {
    if (!podeEditarPerfil || !perfilParaMostrar) {
      return;
    }

    setNomePerfilEditor(
      perfilUsuarioRemotoAtivo?.nome || perfilParaMostrar.nome || "",
    );
    setUsernamePerfilEditor(perfilUsuarioRemotoAtivo?.username || "");
    setBioPerfilEditor(bioAutorPersonalizada);
    setAvatarPerfilEditor(avatarAutor);
    setAvatarNomePerfilEditor(avatarNomePerfil);
    setAvatarArquivoPerfilEditor(null);
    setAvatarErro("");
    setMenuPerfilAberto(false);
    setEditorPerfilAberto(true);
  }

  function fecharEditorPerfil() {
    if (salvandoEditorPerfil) {
      return;
    }

    setEditorPerfilAberto(false);
    setAvatarErro("");

    if (avatarInputRef.current) {
      avatarInputRef.current.value = "";
    }
  }

  return {
    abrirEditorPerfil,
    fecharEditorPerfil,
  };
}
