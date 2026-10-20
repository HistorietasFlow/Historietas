import { normalizarTexto } from "../../../lib/utils";
import { dataNotificacao } from "./notificacoes-filter-utils";
import { normalizarNotificacao } from "./notificacoes-local-normalizers";
import type { NotificacaoLocal } from "./notificacoes-models";

function notificacaoSinteticaDeCapitulo(notificacao: NotificacaoLocal) {
  return (
    notificacao.tipo === "novo-capitulo" &&
    notificacao.id.startsWith("capitulo-")
  );
}

function obterAutorChaveNotificacao(notificacao: NotificacaoLocal) {
  const autorId = notificacao.autorId?.trim() || "";

  if (autorId) {
    return autorId;
  }

  const autorNome = normalizarTexto(notificacao.autorNome || "");

  return autorNome || "";
}

function criarChaveMesclagemNotificacao(notificacao: NotificacaoLocal) {
  const id = notificacao.id.trim();
  const autor = obterAutorChaveNotificacao(notificacao);
  const obraId = notificacao.obraId.trim();
  const capituloId = notificacao.capituloId.trim();
  const link = notificacao.link.trim();

  if (notificacao.tipo === "novo-capitulo" && capituloId) {
    return `novo-capitulo:${capituloId}`;
  }

  if (notificacao.tipo === "solicitacao-seguidor") {
    if (autor) {
      return `solicitacao-seguidor:${autor}`;
    }

    const solicitacaoId = notificacao.solicitacaoId?.trim() || "";

    if (solicitacaoId) {
      return `solicitacao-seguidor-id:${solicitacaoId}`;
    }
  }

  if (notificacao.tipo === "novo-seguidor" && autor) {
    return `novo-seguidor:${autor}`;
  }

  if (notificacao.tipo === "curtida-obra" && autor && (obraId || link)) {
    return `curtida-obra:${autor}:${obraId || link}`;
  }

  if (notificacao.tipo === "curtida-capitulo" && autor && capituloId) {
    return `curtida-capitulo:${autor}:${capituloId}`;
  }

  if (notificacao.tipo === "curtida-comunidade" && autor && link) {
    return `curtida-comunidade:${autor}:${link}`;
  }

  return id;
}

export function notificacoesRepresentamMesmoEvento(
  primeira: NotificacaoLocal,
  segunda: NotificacaoLocal
) {
  const primeiraChave = criarChaveMesclagemNotificacao(primeira);
  const segundaChave = criarChaveMesclagemNotificacao(segunda);

  return Boolean(primeiraChave && primeiraChave === segundaChave);
}

export function mesclarNotificacoes(
  notificacoesLocais: NotificacaoLocal[],
  notificacoesSupabase: NotificacaoLocal[]
) {
  const mapa = new Map<string, NotificacaoLocal>();

  [...notificacoesLocais, ...notificacoesSupabase].forEach((notificacao) => {
    const notificacaoNormalizada = normalizarNotificacao(notificacao, 0);
    const chave = criarChaveMesclagemNotificacao(notificacaoNormalizada);

    if (!chave) {
      return;
    }

    const existente = mapa.get(chave);

    if (!existente) {
      mapa.set(chave, notificacaoNormalizada);
      return;
    }

    const existenteSintetica = notificacaoSinteticaDeCapitulo(existente);
    const novaSintetica = notificacaoSinteticaDeCapitulo(
      notificacaoNormalizada
    );
    const existenteMaisRecente =
      dataNotificacao(existente) > dataNotificacao(notificacaoNormalizada);
    const preferida =
      existenteSintetica && !novaSintetica
        ? notificacaoNormalizada
        : !existenteSintetica && novaSintetica
          ? existente
          : existenteMaisRecente
            ? existente
            : notificacaoNormalizada;
    const secundaria =
      preferida === notificacaoNormalizada
        ? existente
        : notificacaoNormalizada;
    const mesmoId = existente.id.trim() === notificacaoNormalizada.id.trim();

    mapa.set(chave, {
      ...secundaria,
      ...preferida,
      obraId: preferida.obraId || secundaria.obraId,
      capituloId: preferida.capituloId || secundaria.capituloId,
      link: preferida.link || secundaria.link,
      autorId: preferida.autorId || secundaria.autorId,
      autorNome: preferida.autorNome || secundaria.autorNome,
      autorAvatar: preferida.autorAvatar || secundaria.autorAvatar,
      solicitacaoId: preferida.solicitacaoId || secundaria.solicitacaoId,
      lida: mesmoId
        ? existente.lida || notificacaoNormalizada.lida
        : preferida.lida,
    });
  });

  return Array.from(mapa.values()).sort(
    (a, b) => dataNotificacao(b) - dataNotificacao(a)
  );
}
