import { normalizarTexto } from "../../../lib/utils";
import { normalizarListaIdsEmAlta } from "./em-alta-ranking-list-utils";

export const FAVORITES_STORAGE_KEY = "historietas-obras-favoritas";
export const COMPLETED_STORAGE_KEY = "historietas-obras-concluidas";
export const VIEWED_WORKS_STORAGE_KEY = "historietas-obras-visualizacoes";
export const RATED_WORKS_STORAGE_KEY = "historietas-obras-avaliacoes";
export const AUTHOR_PROFILE_STORAGE_KEY = "historietas-perfis-autores";

export function criarStorageKeyUsuarioEmAlta(chave: string, userId: string) {
  const userIdLimpo = userId.trim();

  return userIdLimpo ? `${chave}:${userIdLimpo}` : "";
}

export function normalizarChaveAutorEmAlta(valor: string) {
  return valor.trim().replace(/\s+/g, " ").toLowerCase();
}

export function adicionarAvatarAutorLocalEmAlta(
  avataresPorAutor: Map<string, string>,
  chave: string,
  avatar: unknown,
) {
  const chaveLimpa = normalizarChaveAutorEmAlta(chave);
  const avatarLimpo = typeof avatar === "string" ? avatar.trim() : "";

  if (!chaveLimpa || !avatarLimpo) {
    return;
  }

  avataresPorAutor.set(chaveLimpa, avatarLimpo);
}

export function carregarAvataresAutoresLocaisEmAlta(userIds: string[]) {
  const avataresPorAutor = new Map<string, string>();

  if (typeof window === "undefined") {
    return avataresPorAutor;
  }

  const chavesParaLer = Array.from(
    new Set(
      userIds
        .map((userId) => userId.trim())
        .filter(Boolean)
        .map((userId) =>
          criarStorageKeyUsuarioEmAlta(AUTHOR_PROFILE_STORAGE_KEY, userId),
        ),
    ),
  );

  chavesParaLer.forEach((chaveStorage) => {
    if (!chaveStorage) {
      return;
    }

    try {
      const texto = localStorage.getItem(chaveStorage);
      const perfis = texto ? JSON.parse(texto) : null;

      if (!perfis || typeof perfis !== "object" || Array.isArray(perfis)) {
        return;
      }

      Object.entries(perfis as Record<string, unknown>).forEach(
        ([chaveAutor, perfil]) => {
          if (!perfil || typeof perfil !== "object" || Array.isArray(perfil)) {
            return;
          }

          const registro = perfil as Record<string, unknown>;

          adicionarAvatarAutorLocalEmAlta(
            avataresPorAutor,
            chaveAutor,
            registro.avatar ??
              registro.avatar_url ??
              registro.foto_url ??
              registro.imagem_url ??
              registro.photo_url,
          );

          adicionarAvatarAutorLocalEmAlta(
            avataresPorAutor,
            typeof registro.nome === "string" ? registro.nome : "",
            registro.avatar ??
              registro.avatar_url ??
              registro.foto_url ??
              registro.imagem_url ??
              registro.photo_url,
          );
        },
      );
    } catch {
      // Avatar local é só fallback para os cards de autores.
    }
  });

  return avataresPorAutor;
}

export function obterAvatarAutorLocalEmAlta(
  avataresPorAutor: Map<string, string>,
  nomeAutor: string,
  autorId: string,
) {
  const chaves = [autorId, nomeAutor, normalizarTexto(nomeAutor)]
    .map((chave) => normalizarChaveAutorEmAlta(chave))
    .filter(Boolean);

  for (const chave of chaves) {
    const avatar = avataresPorAutor.get(chave);

    if (avatar) {
      return avatar;
    }
  }

  return "";
}

export function carregarListaIdsLocalEmAlta(chave: string, userId: string) {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return [];
  }

  try {
    const chaveStorage = criarStorageKeyUsuarioEmAlta(chave, userIdLimpo);

    if (!chaveStorage) {
      return [];
    }

    const textoLista = localStorage.getItem(chaveStorage);
    const jsonLista: unknown = textoLista ? JSON.parse(textoLista) : [];

    return normalizarListaIdsEmAlta(jsonLista);
  } catch {
    return [];
  }
}

export function salvarListaIdsLocalEmAlta(
  chave: string,
  userId: string,
  lista: string[],
) {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return;
  }

  try {
    const chaveStorage = criarStorageKeyUsuarioEmAlta(chave, userIdLimpo);

    if (!chaveStorage) {
      return;
    }

    const listaNormalizada = normalizarListaIdsEmAlta(lista);

    localStorage.setItem(chaveStorage, JSON.stringify(listaNormalizada));
  } catch {
    // localStorage é fallback; o ranking continua com estado em memória.
  }
}
