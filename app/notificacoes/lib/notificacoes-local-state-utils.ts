import { mesclarNotificacoes } from "./notificacoes-merge-utils";
import { normalizarNotificacao, normalizarObra } from "./notificacoes-local-normalizers";
import type { NotificacaoLocal, ObraLocal } from "./notificacoes-models";
import {
  CHAVE_NOTIFICACOES,
  CHAVE_NOTIFICACOES_APAGADAS,
  CHAVE_OBRAS,
  lerStorageUsuarioNotificacoes,
  salvarJsonStorageUsuarioNotificacoes,
} from "./notificacoes-storage-utils";

export function carregarObras(userId = ""): ObraLocal[] {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return [];
  }

  try {
    const dados = lerStorageUsuarioNotificacoes(CHAVE_OBRAS, userIdLimpo);
    const obras = dados ? JSON.parse(dados) : [];

    if (!Array.isArray(obras)) {
      salvarJsonStorageUsuarioNotificacoes(CHAVE_OBRAS, userIdLimpo, []);
      return [];
    }

    const obrasNormalizadas = obras.map((obra, index) =>
      normalizarObra(obra, index)
    );

    salvarJsonStorageUsuarioNotificacoes(
      CHAVE_OBRAS,
      userIdLimpo,
      obrasNormalizadas
    );

    return obrasNormalizadas;
  } catch {
    salvarJsonStorageUsuarioNotificacoes(CHAVE_OBRAS, userIdLimpo, []);
    return [];
  }
}

export function carregarNotificacoes(userId = ""): NotificacaoLocal[] {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return [];
  }

  try {
    const dados = lerStorageUsuarioNotificacoes(CHAVE_NOTIFICACOES, userIdLimpo);
    const notificacoes = dados ? JSON.parse(dados) : [];

    if (!Array.isArray(notificacoes)) {
      salvarJsonStorageUsuarioNotificacoes(CHAVE_NOTIFICACOES, userIdLimpo, []);
      return [];
    }

    const notificacoesNormalizadas = mesclarNotificacoes(
      [],
      notificacoes.map((notificacao, index) =>
        normalizarNotificacao(notificacao, index)
      )
    );

    salvarJsonStorageUsuarioNotificacoes(
      CHAVE_NOTIFICACOES,
      userIdLimpo,
      notificacoesNormalizadas
    );

    return notificacoesNormalizadas;
  } catch {
    salvarJsonStorageUsuarioNotificacoes(CHAVE_NOTIFICACOES, userIdLimpo, []);
    return [];
  }
}

export function salvarNotificacoes(
  notificacoes: NotificacaoLocal[],
  userId = ""
) {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo) {
    return;
  }

  salvarJsonStorageUsuarioNotificacoes(
    CHAVE_NOTIFICACOES,
    userIdLimpo,
    notificacoes
  );

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new Event("historietas:notificacoes-atualizadas")
    );
  }
}

export function carregarIdsNotificacoesApagadas(usuarioId: string) {
  const usuarioIdLimpo = usuarioId.trim();

  if (typeof window === "undefined" || !usuarioIdLimpo) {
    return new Set<string>();
  }

  try {
    const texto = lerStorageUsuarioNotificacoes(
      CHAVE_NOTIFICACOES_APAGADAS,
      usuarioIdLimpo
    );
    const json: unknown = texto ? JSON.parse(texto) : [];

    if (!Array.isArray(json)) {
      return new Set<string>();
    }

    return new Set(
      json.filter((id): id is string => typeof id === "string" && Boolean(id.trim()))
    );
  } catch {
    return new Set<string>();
  }
}

export function registrarNotificacoesApagadas(usuarioId: string, ids: string[]) {
  const usuarioIdLimpo = usuarioId.trim();

  if (typeof window === "undefined" || !usuarioIdLimpo || ids.length === 0) {
    return;
  }

  const idsAtuais = carregarIdsNotificacoesApagadas(usuarioIdLimpo);

  ids.forEach((id) => {
    if (id.trim()) {
      idsAtuais.add(id);
    }
  });

  salvarJsonStorageUsuarioNotificacoes(
    CHAVE_NOTIFICACOES_APAGADAS,
    usuarioIdLimpo,
    Array.from(idsAtuais).slice(-500)
  );
}

export function filtrarNotificacoesApagadas(
  notificacoesParaFiltrar: NotificacaoLocal[],
  idsApagados: Set<string>
) {
  if (idsApagados.size === 0) {
    return notificacoesParaFiltrar;
  }

  return notificacoesParaFiltrar.filter(
    (notificacao) => !idsApagados.has(notificacao.id)
  );
}

export function normalizarNotificacaoParaExibicao(
  notificacao: NotificacaoLocal
) {
  return normalizarNotificacao(notificacao, 0);
}

export function prepararNotificacaoTexto(notificacao: NotificacaoLocal) {
  return normalizarNotificacaoParaExibicao(notificacao);
}
