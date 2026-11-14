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
  // Nome de exibição não é identidade: duas contas podem ter o mesmo nome.
  return notificacao.autorId?.trim() || "";
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

  return Boolean(
    (primeira.id.trim() && primeira.id.trim() === segunda.id.trim()) ||
    (primeiraChave && primeiraChave === segundaChave)
  );
}

function mesclarMesmoEvento(existente: NotificacaoLocal, nova: NotificacaoLocal) {
  const existenteSintetica = notificacaoSinteticaDeCapitulo(existente);
  const novaSintetica = notificacaoSinteticaDeCapitulo(nova);
  const existenteMaisRecente =
    dataNotificacao(existente) > dataNotificacao(nova);
  const preferida =
    existenteSintetica && !novaSintetica
      ? nova
      : !existenteSintetica && novaSintetica
        ? existente
        : existenteMaisRecente
          ? existente
          : nova;
  const secundaria = preferida === nova ? existente : nova;
  const mesmoId = existente.id.trim() === nova.id.trim();

  return {
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
      ? existente.lida || nova.lida
      : preferida.lida,
  };
}

export function mesclarNotificacoes(
  notificacoesLocais: NotificacaoLocal[],
  notificacoesSupabase: NotificacaoLocal[]
) {
  // Consolida primeiro a identidade estável, antes das chaves semânticas que
  // dependem de metadados eventualmente ausentes no cache.
  const porId = new Map<string, NotificacaoLocal>();
  [...notificacoesLocais, ...notificacoesSupabase].forEach((notificacao) => {
    const normalizada = normalizarNotificacao(notificacao, 0);
    const id = normalizada.id.trim();
    if (!id) return;
    const existente = porId.get(id);
    porId.set(
      id,
      existente ? mesclarMesmoEvento(existente, normalizada) : normalizada
    );
  });

  const mapa = new Map<string, NotificacaoLocal>();
  porId.forEach((notificacao) => {
    const chave = criarChaveMesclagemNotificacao(notificacao);
    const existente = mapa.get(chave);
    mapa.set(
      chave,
      existente ? mesclarMesmoEvento(existente, notificacao) : notificacao
    );
  });

  return Array.from(mapa.values()).sort(
    (a, b) => dataNotificacao(b) - dataNotificacao(a)
  );
}

export function preservarLeituraAlteradaDuranteCarga(
  mescladas: NotificacaoLocal[],
  iniciais: NotificacaoLocal[],
  atuais: NotificacaoLocal[]
) {
  // Capítulos têm duas representações conhecidas; eventos recorrentes de um
  // mesmo autor continuam distintos para não herdar a leitura do evento antigo.
  const chaveLeitura = (item: NotificacaoLocal) =>
    item.tipo === "novo-capitulo" && item.capituloId.trim()
      ? `novo-capitulo:${item.capituloId.trim()}`
      : item.id.trim();
  const leituraInicial = new Map(iniciais.map((item) => [chaveLeitura(item), item.lida]));
  const alteradas = new Map(
    atuais
      .filter((item) => leituraInicial.has(chaveLeitura(item)) &&
        leituraInicial.get(chaveLeitura(item)) !== item.lida)
      .map((item) => [chaveLeitura(item), item.lida])
  );
  return mescladas.map((item) => {
    const leitura = alteradas.get(chaveLeitura(item));
    return leitura === undefined ? item : { ...item, lida: leitura };
  });
}
