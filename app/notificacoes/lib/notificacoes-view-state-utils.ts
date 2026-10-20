import type {
  NotificacaoLocal,
  ObraLocal,
} from "./notificacoes-models";

export function criarObrasPorIdNotificacoes(obras: ObraLocal[]) {
  return new Map(obras.map((obra) => [obra.id, obra]));
}

export function contarNotificacoesNaoLidas(
  notificacoes: NotificacaoLocal[],
) {
  return notificacoes.filter((notificacao) => !notificacao.lida).length;
}

export function calcularTotalNotificacoesLidas(
  totalNotificacoes: number,
  totalNaoLidas: number,
) {
  return Math.max(totalNotificacoes - totalNaoLidas, 0);
}

export function encontrarObraNotificacao(
  obrasPorId: ReadonlyMap<string, ObraLocal>,
  obraId: string,
) {
  return obrasPorId.get(obraId) || null;
}

export function encontrarCapituloNotificacao(
  obrasPorId: ReadonlyMap<string, ObraLocal>,
  obraId: string,
  capituloId: string,
) {
  const obra = encontrarObraNotificacao(obrasPorId, obraId);

  if (!obra) {
    return null;
  }

  return obra.capitulos.find((capitulo) => capitulo.id === capituloId) || null;
}

export function obterNotificacaoMenuAberta(
  menuNotificacaoAbertoId: string,
  notificacoes: NotificacaoLocal[],
) {
  return menuNotificacaoAbertoId
    ? notificacoes.find(
        (notificacao) => notificacao.id === menuNotificacaoAbertoId,
      ) || null
    : null;
}
