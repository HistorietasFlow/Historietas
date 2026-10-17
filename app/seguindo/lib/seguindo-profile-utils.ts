import { normalizarTexto } from "../../../lib/utils";
import {
  obterTextoRegistro,
} from "./seguindo-record-utils";
import type { RegistroSupabaseGenerico } from "./seguindo-record-utils";

export function criarHandleUsuarioSeguindo(
  nome: string,
  handleSalvo = "",
  userId = "",
) {
  const handleLimpo = handleSalvo.trim().replace(/^@+/, "");

  if (handleLimpo) {
    return `@${handleLimpo}`;
  }

  const handleNome = normalizarTexto(nome)
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/\.+/g, ".")
    .replace(/^\.|\.$/g, "");

  if (handleNome) {
    return `@${handleNome}`;
  }

  return userId ? `@usuario.${userId.slice(0, 4)}` : "@usuario";
}

export function obterAvatarProfileSeguindo(
  profile: RegistroSupabaseGenerico | undefined,
) {
  if (!profile) {
    return "";
  }

  return (
    obterTextoRegistro(profile, "avatar_url") ||
    obterTextoRegistro(profile, "avatar") ||
    obterTextoRegistro(profile, "foto_url") ||
    obterTextoRegistro(profile, "imagem_url") ||
    obterTextoRegistro(profile, "photo_url")
  );
}

export function obterNomeProfileSeguindo(
  profile: RegistroSupabaseGenerico | undefined,
) {
  if (!profile) {
    return "";
  }

  return (
    obterTextoRegistro(profile, "nome") ||
    obterTextoRegistro(profile, "nome_usuario") ||
    obterTextoRegistro(profile, "username") ||
    obterTextoRegistro(profile, "display_name") ||
    obterTextoRegistro(profile, "apelido")
  );
}

export function obterBioProfileSeguindo(
  profile: RegistroSupabaseGenerico | undefined,
) {
  if (!profile) {
    return "";
  }

  return (
    obterTextoRegistro(profile, "bio") ||
    obterTextoRegistro(profile, "sobre_bio") ||
    obterTextoRegistro(profile, "sobre") ||
    obterTextoRegistro(profile, "descricao")
  );
}
