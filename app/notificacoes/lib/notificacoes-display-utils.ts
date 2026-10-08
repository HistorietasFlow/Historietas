import { normalizarTexto } from "../../../lib/utils";
import { notificacaoEhComunidade } from "./notificacoes-filter-utils";

type NotificacaoParaExibicao = {
  tipo: string;
  titulo: string;
  mensagem: string;
  lida: boolean;
  autorNome?: string;
};

function notificacaoEhDiario(notificacao: NotificacaoParaExibicao) {
  return (
    notificacao.tipo === "curtida-diario" ||
    notificacao.tipo === "comentario-diario" ||
    notificacao.tipo === "atividade-diario"
  );
}

function notificacaoEhInteracaoCapitulo(notificacao: NotificacaoParaExibicao) {
  return (
    notificacao.tipo === "comentario-capitulo" ||
    notificacao.tipo === "curtida-capitulo" ||
    notificacao.tipo === "curtida-comentario-capitulo"
  );
}

export function notificacaoUsaCardSocial(notificacao: NotificacaoParaExibicao) {
  return notificacaoEhComunidade(notificacao) || notificacaoEhInteracaoCapitulo(notificacao);
}

export function obterDetalheNotificacao<TNotificacao extends NotificacaoParaExibicao>(
  notificacao: TNotificacao
) {
  if (notificacao.tipo === "comentario-obra") {
    return "Comentário na obra";
  }

  if (notificacao.tipo === "curtida-obra") {
    return "Curtida na obra";
  }

  if (notificacao.tipo === "comentario-comunidade") {
    return "Comentário em publicação";
  }

  if (notificacao.tipo === "curtida-comunidade") {
    return "Curtida em publicação";
  }

  if (notificacao.tipo === "review-comunidade") {
    return "Review publicada";
  }

  if (notificacao.tipo === "curtida-diario") {
    return "Curtida no Diário";
  }

  if (notificacao.tipo === "comentario-diario") {
    return "Comentário no Diário";
  }

  if (notificacao.tipo === "atividade-diario") {
    return "Atividade do Diário";
  }

  if (notificacao.tipo === "novo-seguidor") {
    return "Novo seguidor";
  }

  if (notificacao.tipo === "solicitacao-seguidor") {
    return "Solicitação para seguir";
  }

  if (notificacao.tipo === "atividade-comunidade") {
    return "Atividade da comunidade";
  }

  if (notificacao.tipo === "denuncia-comunidade") {
    return "Denúncia analisada";
  }

  if (notificacao.tipo === "moderacao-comunidade") {
    return "Moderação";
  }

  if (notificacao.tipo === "problema-tecnico") {
    return "Suporte técnico";
  }

  if (notificacao.tipo === "comentario-capitulo") {
    return "Comentário em capítulo";
  }

  if (notificacao.tipo === "curtida-capitulo") {
    return "Curtida no capítulo";
  }

  if (notificacao.tipo === "curtida-comentario-capitulo") {
    return "Curtida no comentário";
  }

  return "Capítulo";
}

export function obterAcaoPrincipalNotificacao(notificacao: NotificacaoParaExibicao) {
  if (notificacao.tipo === "solicitacao-seguidor") {
    return "Responder solicitação";
  }

  if (notificacao.tipo === "novo-seguidor") {
    return "Ver perfil";
  }

  if (notificacao.tipo === "problema-tecnico") {
    return "Ver chamado";
  }

  if (
    notificacao.tipo === "comentario-obra" ||
    notificacao.tipo === "curtida-obra"
  ) {
    return "Ver obra";
  }

  if (notificacaoEhDiario(notificacao)) {
    return "Ver Diário";
  }

  if (notificacaoEhComunidade(notificacao)) {
    return "Ver comunidade";
  }

  return notificacao.tipo === "comentario-capitulo" ||
    notificacao.tipo === "curtida-comentario-capitulo"
    ? "Ver comentário"
    : "Ver capítulo";
}

export function obterIconeNotificacao(notificacao: NotificacaoParaExibicao, lida: boolean) {
  if (lida) {
    return "✓";
  }

  if (notificacaoPareceComentarioComunidade(notificacao)) {
    return "💬";
  }

  if (notificacao.tipo === "comentario-obra") {
    return "💬";
  }

  if (notificacao.tipo === "comentario-capitulo") {
    return "💬";
  }

  if (
    notificacaoPareceCurtidaComunidade(notificacao) ||
    notificacao.tipo === "curtida-obra" ||
    notificacao.tipo === "curtida-capitulo" ||
    notificacao.tipo === "curtida-comentario-capitulo"
  ) {
    return "❤️";
  }

  if (notificacao.tipo === "review-comunidade") {
    return "★";
  }

  if (notificacao.tipo === "curtida-diario") {
    return "❤️";
  }

  if (notificacao.tipo === "comentario-diario") {
    return "💬";
  }

  if (notificacao.tipo === "atividade-diario") {
    return "◉";
  }

  if (
    notificacao.tipo === "novo-seguidor" ||
    notificacao.tipo === "solicitacao-seguidor"
  ) {
    return "+";
  }

  if (
    notificacao.tipo === "denuncia-comunidade" ||
    notificacao.tipo === "moderacao-comunidade"
  ) {
    return "N";
  }

  if (notificacao.tipo === "problema-tecnico") {
    return "S";
  }

  return "!";
}

export function obterTituloExibicaoNotificacao(notificacao: NotificacaoParaExibicao) {
  if (notificacao.tipo === "novo-capitulo") {
    return "Novo capítulo publicado";
  }

  if (notificacao.tipo === "comentario-obra") {
    return "Comentário na sua obra";
  }

  if (notificacao.tipo === "curtida-obra") {
    return "Curtida na sua obra";
  }

  if (notificacao.tipo === "comentario-capitulo") {
    return "Novo comentário no capítulo";
  }

  if (notificacao.tipo === "curtida-capitulo") {
    return "Nova curtida no capítulo";
  }

  if (notificacao.tipo === "curtida-comentario-capitulo") {
    return "Nova curtida no seu comentário";
  }

  if (notificacao.tipo === "comentario-comunidade") {
    return "Novo comentário na Comunidade";
  }

  if (notificacao.tipo === "curtida-comunidade") {
    return "Nova curtida na Comunidade";
  }

  if (notificacao.tipo === "review-comunidade") {
    return "Nova review publicada";
  }

  if (notificacao.tipo === "curtida-diario") {
    return "Nova curtida no Diário";
  }

  if (notificacao.tipo === "comentario-diario") {
    return "Novo comentário no Diário";
  }

  if (notificacao.tipo === "novo-seguidor") {
    return "Novo seguidor";
  }

  if (notificacao.tipo === "solicitacao-seguidor") {
    return "Nova solicitação para seguir";
  }

  if (notificacao.tipo === "atividade-comunidade") {
    if (notificacaoPareceComentarioComunidade(notificacao)) {
      return "Novo comentário na Comunidade";
    }

    if (notificacaoPareceCurtidaComunidade(notificacao)) {
      return "Nova curtida na Comunidade";
    }
  }

  return notificacao.titulo;
}

function extrairAutorComentarioComunidade(notificacao: NotificacaoParaExibicao) {
  if (notificacao.autorNome?.trim()) {
    return notificacao.autorNome.trim();
  }

  if (notificacao.tipo !== "comentario-comunidade") {
    return "Comunidade";
  }

  const match = /^(.+?)\s+comentou\b/i.exec(notificacao.mensagem.trim());

  return match?.[1]?.trim() || "Leitor";
}

function notificacaoPareceComentarioComunidade(notificacao: NotificacaoParaExibicao) {
  const titulo = normalizarTexto(notificacao.titulo);
  const mensagem = normalizarTexto(notificacao.mensagem);

  return (
    notificacao.tipo === "comentario-comunidade" ||
    (notificacao.tipo === "atividade-comunidade" &&
      ((titulo.includes("comentario") && titulo.includes("comunidade")) ||
        (mensagem.includes("comentou") &&
          (mensagem.includes("publicacao") || mensagem.includes("comunidade")))))
  );
}

function notificacaoPareceCurtidaComunidade(notificacao: NotificacaoParaExibicao) {
  const titulo = normalizarTexto(notificacao.titulo);
  const mensagem = normalizarTexto(notificacao.mensagem);

  return (
    notificacao.tipo === "curtida-comunidade" ||
    (notificacao.tipo === "atividade-comunidade" &&
      ((titulo.includes("curtida") && titulo.includes("comunidade")) ||
        (mensagem.includes("curtiu") &&
          (mensagem.includes("publicacao") || mensagem.includes("comunidade")))))
  );
}

export function notificacaoTemAutorSocial(notificacao: NotificacaoParaExibicao) {
  return (
    notificacaoPareceComentarioComunidade(notificacao) ||
    notificacaoPareceCurtidaComunidade(notificacao) ||
    notificacao.tipo === "comentario-obra" ||
    notificacao.tipo === "curtida-obra" ||
    notificacao.tipo === "comentario-capitulo" ||
    notificacao.tipo === "curtida-capitulo" ||
    notificacao.tipo === "curtida-comentario-capitulo" ||
    notificacao.tipo === "comentario-diario" ||
    notificacao.tipo === "curtida-diario" ||
    notificacao.tipo === "novo-seguidor" ||
    notificacao.tipo === "solicitacao-seguidor"
  );
}

export function obterTituloBlocoSocialNotificacao(notificacao: NotificacaoParaExibicao) {
  const nomeAutor = obterNomeAutorNotificacao(notificacao);

  if (
    notificacaoPareceComentarioComunidade(notificacao) ||
    notificacao.tipo === "comentario-obra" ||
    notificacao.tipo === "comentario-capitulo" ||
    notificacao.tipo === "comentario-diario"
  ) {
    return `Comentário de ${nomeAutor}`;
  }

  if (
    notificacaoPareceCurtidaComunidade(notificacao) ||
    notificacao.tipo === "curtida-obra" ||
    notificacao.tipo === "curtida-capitulo" ||
    notificacao.tipo === "curtida-comentario-capitulo" ||
    notificacao.tipo === "curtida-diario"
  ) {
    return `Curtida de ${nomeAutor}`;
  }

  if (notificacao.tipo === "novo-seguidor") {
    return `Novo seguidor: ${nomeAutor}`;
  }

  if (notificacao.tipo === "solicitacao-seguidor") {
    return `Solicitação de ${nomeAutor}`;
  }

  return obterDetalheNotificacao(notificacao);
}

export function obterTextoBlocoSocialNotificacao(notificacao: NotificacaoParaExibicao) {
  if (
    notificacaoPareceComentarioComunidade(notificacao) ||
    notificacaoPareceCurtidaComunidade(notificacao) ||
    notificacao.tipo === "comentario-capitulo" ||
    notificacao.tipo === "curtida-capitulo" ||
    notificacao.tipo === "curtida-comentario-capitulo" ||
    notificacao.tipo === "novo-seguidor"
  ) {
    return "";
  }

  return notificacao.mensagem;
}

function extrairAutorMensagemNotificacao(notificacao: NotificacaoParaExibicao) {
  const mensagem = notificacao.mensagem.trim();
  const match = /^(.+?)\s+(comentou|curtiu|publicou|começou)\b/i.exec(mensagem);

  return match?.[1]?.trim() || "";
}

export function obterNomeAutorNotificacao(notificacao: NotificacaoParaExibicao) {
  return (
    notificacao.autorNome?.trim() ||
    (notificacaoPareceComentarioComunidade(notificacao)
      ? extrairAutorComentarioComunidade(notificacao)
      : extrairAutorMensagemNotificacao(notificacao)) ||
    "Usuário"
  );
}

export function obterInicialNotificacao(notificacao: NotificacaoParaExibicao) {
  const nome = obterNomeAutorNotificacao(notificacao);

  return nome.slice(0, 1).toUpperCase() || obterIconeNotificacao(notificacao, notificacao.lida);
}
