import type { ResumoLocal } from "./configuracoes-account-models";
import { carregarJsonArrayConfiguracoes } from "./configuracoes-json-array-utils";
import { criarStorageKeyUsuarioConfiguracoes } from "./configuracoes-storage-key-utils";
import { criarChaveItemResumo } from "./configuracoes-summary-item-utils";

export function lerStorageUsuarioConfiguracoes(chave: string, userId = "") {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return null;
  }

  try {
    const chaveStorage = criarStorageKeyUsuarioConfiguracoes(chave, userIdLimpo);

    return chaveStorage ? localStorage.getItem(chaveStorage) : null;
  } catch {
    return null;
  }
}

export function salvarJsonStorageUsuarioConfiguracoes(
  chave: string,
  userId: string,
  valor: unknown,
) {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return;
  }

  try {
    const chaveStorage = criarStorageKeyUsuarioConfiguracoes(chave, userIdLimpo);

    if (!chaveStorage) {
      return;
    }

    localStorage.setItem(chaveStorage, JSON.stringify(valor));
  } catch {
    // localStorage é fallback; as configurações continuam em memória.
  }
}

function carregarJsonArray(chave: string, userId = "") {
  return carregarJsonArrayConfiguracoes(
    chave,
    userId,
    lerStorageUsuarioConfiguracoes,
  );
}

function contarItens(chave: string, userId = "") {
  const itens = carregarJsonArray(chave, userId);

  return new Set(
    itens.map((item, index) => criarChaveItemResumo(item, index)),
  ).size;
}

export function criarResumoLocal(userId = ""): ResumoLocal {
  return {
    obras: contarItens("historietas-obras", userId),
    notificacoes: contarItens("historietas-notificacoes", userId),
    lancamentos: contarItens("historietas-lancamentos-salvos", userId),
    favoritas: contarItens("historietas-obras-favoritas", userId),
    concluidas: contarItens("historietas-obras-concluidas", userId),
    seguindoObras: contarItens("historietas-obras-seguidas", userId),
    seguindoAutores: contarItens("historietas-autores-seguidos", userId),
  };
}
