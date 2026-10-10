import { obterTipoMimeUploadStorage } from "../../../lib/storageUploads";
import { AVATAR_MAX_SIZE } from "../constants";
import type { ChangeEvent, RefObject } from "react";

export function usePerfilAutorAvatarEditorActions({
  avatarInputRef,
  setAvatarErro,
  setAvatarPerfilEditor,
  setAvatarNomePerfilEditor,
  setAvatarArquivoPerfilEditor,
}: {
  avatarInputRef: RefObject<HTMLInputElement | null>;
  setAvatarErro: (valor: string) => void;
  setAvatarPerfilEditor: (valor: string) => void;
  setAvatarNomePerfilEditor: (valor: string) => void;
  setAvatarArquivoPerfilEditor: (valor: File | null) => void;
}) {
  function selecionarAvatarAutor(event: ChangeEvent<HTMLInputElement>) {
    const arquivo = event.target.files?.[0];

    setAvatarErro("");

    if (!arquivo) {
      return;
    }

    if (!obterTipoMimeUploadStorage("avatars", arquivo)) {
      setAvatarErro("Escolha PNG, JPG, WEBP ou GIF.");
      event.target.value = "";
      return;
    }

    if (arquivo.size > AVATAR_MAX_SIZE) {
      setAvatarErro("A imagem precisa ter no máximo 1 MB.");
      event.target.value = "";
      return;
    }

    const leitor = new FileReader();

    leitor.onload = () => {
      const resultado = typeof leitor.result === "string" ? leitor.result : "";

      if (!resultado) {
        setAvatarErro("Não consegui carregar essa imagem.");
        return;
      }

      setAvatarPerfilEditor(resultado);
      setAvatarNomePerfilEditor(arquivo.name);
      setAvatarArquivoPerfilEditor(arquivo);
      setAvatarErro("");
    };

    leitor.onerror = () => {
      setAvatarErro("Não consegui carregar essa imagem.");
    };

    leitor.readAsDataURL(arquivo);
  }

  function removerAvatarAutor() {
    setAvatarPerfilEditor("");
    setAvatarNomePerfilEditor("");
    setAvatarArquivoPerfilEditor(null);
    setAvatarErro("");

    if (avatarInputRef.current) {
      avatarInputRef.current.value = "";
    }
  }

  return {
    selecionarAvatarAutor,
    removerAvatarAutor,
  };
}
