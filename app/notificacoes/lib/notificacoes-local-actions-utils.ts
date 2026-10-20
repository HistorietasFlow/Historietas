import type { NotificacaoLocal } from "./notificacoes-models";

export function atualizarEstadoLeituraNotificacao(
  notificacoes: NotificacaoLocal[],
  id: string,
  lida: boolean,
) {
  return notificacoes.map((notificacao) => {
    if (notificacao.id !== id) {
      return notificacao;
    }

    return {
      ...notificacao,
      lida,
    };
  });
}

export function marcarTodasNotificacoesComoLidasLocal(
  notificacoes: NotificacaoLocal[],
) {
  const notificacoesParaSincronizar = notificacoes.filter(
    (notificacao) => !notificacao.lida,
  );
  const novasNotificacoes = notificacoes.map((notificacao) => ({
    ...notificacao,
    lida: true,
  }));

  return {
    notificacoesParaSincronizar,
    novasNotificacoes,
  };
}

export function marcarNotificacoesFiltradasComoLidasLocal(
  notificacoes: NotificacaoLocal[],
  notificacoesFiltradas: NotificacaoLocal[],
) {
  const idsFiltrados = new Set(
    notificacoesFiltradas.map((notificacao) => notificacao.id),
  );
  const notificacoesParaSincronizar = notificacoes.filter((notificacao) => {
    return idsFiltrados.has(notificacao.id) && !notificacao.lida;
  });

  const novasNotificacoes = notificacoes.map((notificacao) => {
    if (!idsFiltrados.has(notificacao.id)) {
      return notificacao;
    }

    return {
      ...notificacao,
      lida: true,
    };
  });

  return {
    notificacoesParaSincronizar,
    novasNotificacoes,
  };
}

export function removerNotificacaoLocal(
  notificacoes: NotificacaoLocal[],
  id: string,
) {
  return notificacoes.filter((notificacao) => {
    return notificacao.id !== id;
  });
}

export function separarNotificacoesLidasLocal(
  notificacoes: NotificacaoLocal[],
) {
  const notificacoesLidas = notificacoes.filter(
    (notificacao) => notificacao.lida,
  );
  const novasNotificacoes = notificacoes.filter(
    (notificacao) => !notificacao.lida,
  );

  return {
    notificacoesLidas,
    novasNotificacoes,
  };
}
