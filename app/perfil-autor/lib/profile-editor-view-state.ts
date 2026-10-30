import { BIO_MAX_LENGTH } from "../constants";
import {
  obterCaracteresRestantesPerfilAutor,
  obterInicialAvatarPerfilAutor,
  obterRotulosAcoesEditorPerfilAutor,
} from "./profile-display-utils";

export function obterEstadoVisualEditorPerfilAutor({
  avatarPerfilEditor,
  salvandoEditorPerfil,
  nomePerfilEditor,
  perfilNome,
  bioPerfilEditor,
}: {
  avatarPerfilEditor: string;
  salvandoEditorPerfil: boolean;
  nomePerfilEditor: string;
  perfilNome: string;
  bioPerfilEditor: string;
}) {
  const temAvatarPerfilEditor = Boolean(avatarPerfilEditor);
  const {
    rotuloAcaoAvatar,
    rotuloSalvarEditor,
  } = obterRotulosAcoesEditorPerfilAutor({
    temAvatar: temAvatarPerfilEditor,
    salvando: salvandoEditorPerfil,
  });
  const inicialAvatarPerfilEditor = obterInicialAvatarPerfilAutor(
    nomePerfilEditor,
    perfilNome,
  );
  const caracteresRestantesBioPerfil = obterCaracteresRestantesPerfilAutor(
    bioPerfilEditor,
    BIO_MAX_LENGTH,
  );

  return {
    temAvatarPerfilEditor,
    rotuloAcaoAvatar,
    rotuloSalvarEditor,
    inicialAvatarPerfilEditor,
    caracteresRestantesBioPerfil,
  };
}
