import type { AutorPerfil, PerfisAutoresSalvos } from "../types";
import {
  AUTHOR_PROFILE_STORAGE_KEY,
  AUTHOR_RATINGS_STORAGE_KEY,
} from "../constants";
import { obterChaveAvaliacaoAutor } from "./profile-formatters";
import {
  carregarJsonUsuarioPerfilAutor,
  salvarJsonUsuarioPerfilAutor,
} from "./profile-local-storage-utils";
import { normalizarPerfisAutores } from "./work-normalizers";

export function carregarAvaliacoesAutoresLocais(userId = "") {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const avaliacoesJson: unknown =
      carregarJsonUsuarioPerfilAutor(AUTHOR_RATINGS_STORAGE_KEY, userId) || {};

    if (
      !avaliacoesJson ||
      typeof avaliacoesJson !== "object" ||
      Array.isArray(avaliacoesJson)
    ) {
      return {};
    }

    return avaliacoesJson as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function obterAvaliacaoAutorLocal(
  perfil: Pick<AutorPerfil, "autorId" | "nome">,
  userId = "",
) {
  const chaveAvaliacao = obterChaveAvaliacaoAutor(perfil);
  const avaliacoesLocais = carregarAvaliacoesAutoresLocais(userId);
  const nota = Number(avaliacoesLocais[chaveAvaliacao]);

  return Number.isFinite(nota) && nota >= 0.5 && nota <= 5
    ? Math.round(nota * 2) / 2
    : 0;
}

export function salvarAvaliacaoAutorLocal(
  perfil: Pick<AutorPerfil, "autorId" | "nome">,
  nota: number,
  userId = "",
) {
  if (typeof window === "undefined" || !userId.trim()) {
    return;
  }

  try {
    const chaveAvaliacao = obterChaveAvaliacaoAutor(perfil);

    if (!chaveAvaliacao) {
      return;
    }

    const avaliacoesLocais = carregarAvaliacoesAutoresLocais(userId);

    if (nota <= 0) {
      delete avaliacoesLocais[chaveAvaliacao];
    } else {
      avaliacoesLocais[chaveAvaliacao] = nota;
    }

    salvarJsonUsuarioPerfilAutor(
      AUTHOR_RATINGS_STORAGE_KEY,
      userId,
      avaliacoesLocais,
    );
  } catch {
    // Avaliação local é fallback e não deve travar o perfil.
  }
}

export function carregarPerfisAutores(userId = ""): PerfisAutoresSalvos {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return {};
  }

  try {
    const perfis =
      carregarJsonUsuarioPerfilAutor(AUTHOR_PROFILE_STORAGE_KEY, userIdLimpo) ||
      {};
    const perfisNormalizados = normalizarPerfisAutores(perfis);

    salvarJsonUsuarioPerfilAutor(
      AUTHOR_PROFILE_STORAGE_KEY,
      userIdLimpo,
      perfisNormalizados,
    );

    return perfisNormalizados;
  } catch {
    salvarJsonUsuarioPerfilAutor(AUTHOR_PROFILE_STORAGE_KEY, userIdLimpo, {});
    return {};
  }
}
