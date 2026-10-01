import { normalizarTexto } from "../../../../lib/utils";

export function formatarGeneroObraPublica(genero: string) {
  const generoLimpo = genero.trim();
  const generoNormalizado = normalizarTexto(generoLimpo);

  if (generoNormalizado === "fantasia sombria") {
    return "Fantasia";
  }

  if (generoNormalizado === "sci-fi" || generoNormalizado === "sci fi") {
    return "Ficção";
  }

  return generoLimpo || "Não informado";
}

export function obterTextoPerfilObra(
  registro: Record<string, unknown>,
  chave: string,
) {
  const valor = registro[chave];

  return typeof valor === "string" && valor.trim() ? valor.trim() : "";
}

export function obterNomePerfilObra(
  profile: Record<string, unknown> | null,
  fallback: string,
) {
  if (!profile) {
    return fallback.trim() || "Autor não informado";
  }

  return (
    obterTextoPerfilObra(profile, "nome") ||
    obterTextoPerfilObra(profile, "nome_usuario") ||
    obterTextoPerfilObra(profile, "username") ||
    obterTextoPerfilObra(profile, "display_name") ||
    obterTextoPerfilObra(profile, "apelido") ||
    fallback.trim() ||
    "Autor não informado"
  );
}

export function obterAvatarPerfilObra(
  profile: Record<string, unknown> | null,
) {
  if (!profile) {
    return "";
  }

  return (
    obterTextoPerfilObra(profile, "avatar_url") ||
    obterTextoPerfilObra(profile, "avatar") ||
    obterTextoPerfilObra(profile, "foto_url") ||
    obterTextoPerfilObra(profile, "imagem_url") ||
    obterTextoPerfilObra(profile, "photo_url")
  );
}

export function obterBioPerfilObra(
  profile: Record<string, unknown> | null,
) {
  if (!profile) {
    return "";
  }

  return (
    obterTextoPerfilObra(profile, "bio") ||
    obterTextoPerfilObra(profile, "sobre_bio") ||
    obterTextoPerfilObra(profile, "sobre") ||
    obterTextoPerfilObra(profile, "descricao")
  );
}

export function normalizarPerfilPublicoObra(
  profile: Record<string, unknown> | null,
  userIdFallback: string,
  nomeFallback: string
) {
  return {
    userId:
      obterTextoPerfilObra(profile || {}, "user_id") ||
      obterTextoPerfilObra(profile || {}, "id") ||
      userIdFallback.trim(),
    nome: obterNomePerfilObra(profile, nomeFallback).slice(0, 80),
    avatar: obterAvatarPerfilObra(profile),
    bio: obterBioPerfilObra(profile).slice(0, 160),
  };
}

export function obterSinopseObraExibida(
  obra: { sinopse: string } | null,
) {
  return obra && obra.sinopse.trim()
    ? obra.sinopse.trim()
    : "Nenhuma sinopse informada.";
}

export function obterNomeAutorObraExibido(
  perfilAutor: { nome?: string } | null,
  obra: { autor?: string } | null,
) {
  return perfilAutor?.nome || obra?.autor || "Autor não informado";
}
export function obterGeneroObraExibido(
  obra: { genero: string } | null,
) {
  return obra ? formatarGeneroObraPublica(obra.genero) : "Não informado";
}
