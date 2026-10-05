import {
  lerStorageUsuarioObraPublica,
  salvarStorageUsuarioObraPublica,
} from "./obra-user-storage";
import {
  obterChaveAvaliacaoObra,
  type AvaliacaoLocalObra,
} from "./obra-rating-utils";
import type { ObraDinamica } from "./obra-data-utils";

export const RATED_WORKS_STORAGE_KEY = "historietas-obras-avaliacoes";

export function carregarAvaliacoesLocais(userId = "") {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo) {
    return {};
  }

  try {
    const avaliacoesTexto = lerStorageUsuarioObraPublica(
      RATED_WORKS_STORAGE_KEY,
      userIdLimpo
    );
    const avaliacoesJson: unknown = avaliacoesTexto
      ? JSON.parse(avaliacoesTexto)
      : {};

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

export function obterAvaliacaoLocalDetalhada(
  obra: ObraDinamica,
  userId = ""
): AvaliacaoLocalObra {
  const chaveAvaliacao = obterChaveAvaliacaoObra(obra);
  const avaliacoesLocais = carregarAvaliacoesLocais(userId);
  const encontrada = Object.prototype.hasOwnProperty.call(
    avaliacoesLocais,
    chaveAvaliacao
  );
  const nota = Number(avaliacoesLocais[chaveAvaliacao]);

  return {
    encontrada,
    nota:
      Number.isFinite(nota) && nota >= 0.5 && nota <= 5
        ? Math.round(nota * 2) / 2
        : 0,
  };
}

export function salvarAvaliacaoLocal(obra: ObraDinamica, nota: number, userId = "") {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo) {
    return;
  }

  try {
    const chaveAvaliacao = obterChaveAvaliacaoObra(obra);

    if (!chaveAvaliacao) {
      return;
    }

    const avaliacoesLocais = carregarAvaliacoesLocais(userIdLimpo);
    avaliacoesLocais[chaveAvaliacao] =
      nota <= 0 ? 0 : Math.round(nota * 2) / 2;

    salvarStorageUsuarioObraPublica(
      RATED_WORKS_STORAGE_KEY,
      userIdLimpo,
      avaliacoesLocais
    );
  } catch {
    // Avaliação local é fallback e não deve travar a página.
  }
}
