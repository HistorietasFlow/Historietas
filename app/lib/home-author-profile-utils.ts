import { formatarGeneroHome } from "./home-metadata-utils";
import { normalizarTexto } from "../../lib/utils";

export type PerfilSupabaseHome = {
  userId: string;
  nome: string;
  avatar: string;
  bio: string;
};

export type PerfilSupabaseHomeRow = {
  id: string | null;
  user_id: string | null;
  nome: string | null;
  avatar_url: string | null;
  bio: string | null;
  sobre_bio: string | null;
};

export type PerfilAutorSalvo = {
  avatar: string;
  avatarNome: string;
  bio: string;
};

export type PerfisAutoresSalvos = Record<string, PerfilAutorSalvo>;

export function normalizarChaveAutor(nome: string) {
  return normalizarTexto(nome).replace(/\s+/g, " ").trim();
}

export function criarIniciaisAutor(nome: string) {
  const partes = nome
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (partes.length === 0) {
    return "H";
  }

  return partes
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase();
}

export function normalizarPerfilAutorSalvo(valor: unknown): PerfilAutorSalvo | null {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) {
    return null;
  }

  const perfil = valor as Record<string, unknown>;

  return {
    avatar: typeof perfil.avatar === "string" ? perfil.avatar : "",
    avatarNome: typeof perfil.avatarNome === "string" ? perfil.avatarNome : "",
    bio: typeof perfil.bio === "string" ? perfil.bio : "",
  };
}

export function normalizarPerfisAutoresSalvos(valor: unknown): PerfisAutoresSalvos {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) {
    return {};
  }

  const perfis = valor as Record<string, unknown>;

  return Object.entries(perfis).reduce<PerfisAutoresSalvos>(
    (perfisNormalizados, [chave, perfil]) => {
      const perfilNormalizado = normalizarPerfilAutorSalvo(perfil);

      if (perfilNormalizado) {
        perfisNormalizados[chave] = perfilNormalizado;
      }

      return perfisNormalizados;
    },
    {}
  );
}

export function encontrarPerfilAutor(
  perfisAutores: PerfisAutoresSalvos,
  nomeAutor: string
) {
  const chaveNormalizada = normalizarChaveAutor(nomeAutor);
  const chaveSimples = nomeAutor.trim().replace(/\s+/g, " ").toLowerCase();

  return (
    perfisAutores[chaveNormalizada] ||
    perfisAutores[chaveSimples] ||
    perfisAutores[nomeAutor] ||
    Object.entries(perfisAutores).find(([chave]) => {
      return normalizarChaveAutor(chave) === chaveNormalizada;
    })?.[1] ||
    null
  );
}

export function criarBioAutorPadrao(generos: string[]) {
  const generoPrincipal = formatarGeneroHome(generos[0] || "histórias");

  return `Autor de ${generoPrincipal.toLowerCase()} na Historietas.`;
}

export function obterValorTextoPerfilHome(...valores: Array<string | null | undefined>) {
  return (
    valores
      .find((valor) => typeof valor === "string" && Boolean(valor.trim()))
      ?.trim() || ""
  );
}

export function normalizarPerfilSupabaseHome(
  perfil: PerfilSupabaseHomeRow
): PerfilSupabaseHome | null {
  const userId = obterValorTextoPerfilHome(perfil.user_id, perfil.id);
  const nome = obterValorTextoPerfilHome(perfil.nome);

  if (!userId || !nome) {
    return null;
  }

  return {
    userId,
    nome,
    avatar: obterValorTextoPerfilHome(perfil.avatar_url),
    bio: obterValorTextoPerfilHome(perfil.bio, perfil.sobre_bio),
  };
}
