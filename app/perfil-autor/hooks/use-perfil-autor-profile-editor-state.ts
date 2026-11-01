"use client";

import { useState } from "react";

export function usePerfilAutorProfileEditorState() {
  const [editorPerfilAberto, setEditorPerfilAberto] = useState(false);
  const [nomePerfilEditor, setNomePerfilEditor] = useState("");
  const [usernamePerfilEditor, setUsernamePerfilEditor] = useState("");
  const [bioPerfilEditor, setBioPerfilEditor] = useState("");
  const [avatarPerfilEditor, setAvatarPerfilEditor] = useState("");
  const [avatarNomePerfilEditor, setAvatarNomePerfilEditor] = useState("");
  const [avatarArquivoPerfilEditor, setAvatarArquivoPerfilEditor] =
    useState<File | null>(null);
  const [avatarErro, setAvatarErro] = useState("");
  const [salvandoEditorPerfil, setSalvandoEditorPerfil] = useState(false);

  return {
    editorPerfilAberto,
    setEditorPerfilAberto,
    nomePerfilEditor,
    setNomePerfilEditor,
    usernamePerfilEditor,
    setUsernamePerfilEditor,
    bioPerfilEditor,
    setBioPerfilEditor,
    avatarPerfilEditor,
    setAvatarPerfilEditor,
    avatarNomePerfilEditor,
    setAvatarNomePerfilEditor,
    avatarArquivoPerfilEditor,
    setAvatarArquivoPerfilEditor,
    avatarErro,
    setAvatarErro,
    salvandoEditorPerfil,
    setSalvandoEditorPerfil,
  };
}
