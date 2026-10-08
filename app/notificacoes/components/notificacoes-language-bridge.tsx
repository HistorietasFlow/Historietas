"use client";

import { useEffect } from "react";
import { useHistorietasLanguage } from "../../../components/HistorietasLanguageProvider";
import { normalizarTexto } from "../../../lib/utils";
import type { HistorietasLanguage } from "../../../lib/i18n";

type TraducaoNotificacoes = {
  en: string;
  es: string;
};

const NOTIFICACOES_UI_TRANSLATIONS: Record<string, TraducaoNotificacoes> = {
  "Carregando": { en: "Loading", es: "Cargando" },
  "Carregando notificações": { en: "Loading notifications", es: "Cargando notificaciones" },
  "Notificações": { en: "Notifications", es: "Notificaciones" },
  "Abrir opções das notificações": { en: "Open notification options", es: "Abrir opciones de notificaciones" },
  "Opções de notificações": { en: "Notification options", es: "Opciones de notificaciones" },
  "Abrir busca": { en: "Open search", es: "Abrir búsqueda" },
  "Fechar busca": { en: "Close search", es: "Cerrar búsqueda" },
  "Buscar notificações...": { en: "Search notifications...", es: "Buscar notificaciones..." },
  "Limpar busca e filtros": { en: "Clear search and filters", es: "Limpiar búsqueda y filtros" },
  "Mostrar": { en: "Show", es: "Mostrar" },
  "Todas": { en: "All", es: "Todas" },
  "Novas": { en: "New", es: "Nuevas" },
  "Lidas": { en: "Read", es: "Leídas" },
  "Capítulos": { en: "Chapters", es: "Capítulos" },
  "Comunidade": { en: "Community", es: "Comunidad" },
  "Classificar por": { en: "Sort by", es: "Ordenar por" },
  "Filtros": { en: "Filters", es: "Filtros" },
  "Mais recentes": { en: "Newest", es: "Más recientes" },
  "Mais antigas": { en: "Oldest", es: "Más antiguas" },
  "Ações": { en: "Actions", es: "Acciones" },
  "Marcar todas como lidas": { en: "Mark all as read", es: "Marcar todas como leídas" },
  "Marcar seleção": { en: "Mark selection as read", es: "Marcar selección como leída" },
  "Apagar lidas": { en: "Delete read notifications", es: "Eliminar leídas" },
  "Limpar todos": { en: "Clear all", es: "Borrar todas" },
  "Nenhuma notificação": { en: "No notifications", es: "No hay notificaciones" },
  "Nada encontrado": { en: "Nothing found", es: "No se encontró nada" },
  "Lista de notificações": { en: "Notification list", es: "Lista de notificaciones" },
  "AÇÕES DA NOTIFICAÇÃO": { en: "NOTIFICATION ACTIONS", es: "ACCIONES DE LA NOTIFICACIÓN" },
  "Abrir perfil": { en: "Open profile", es: "Abrir perfil" },
  "Marcar como nova": { en: "Mark as unread", es: "Marcar como nueva" },
  "Marcar como lida": { en: "Mark as read", es: "Marcar como leída" },
  "Abrir obra": { en: "Open work", es: "Abrir obra" },
  "Apagar": { en: "Delete", es: "Eliminar" },
  "Atualização": { en: "Update", es: "Actualización" },
  "Obra": { en: "Work", es: "Obra" },
  "Capítulo": { en: "Chapter", es: "Capítulo" },
  "DATA:": { en: "DATE:", es: "FECHA:" },
  "Nova notificação": { en: "New notification", es: "Nueva notificación" },
  "Uma obra recebeu uma atualização.": { en: "A work received an update.", es: "Una obra recibió una actualización." },
  "Você recebeu uma nova notificação.": { en: "You received a new notification.", es: "Recibiste una nueva notificación." },
  "Novo capítulo publicado": { en: "New chapter published", es: "Nuevo capítulo publicado" },
  "Novo comentário na Comunidade": { en: "New Community comment", es: "Nuevo comentario en la Comunidad" },
  "Novo comentário no capítulo": { en: "New chapter comment", es: "Nuevo comentario en el capítulo" },
  "Nova review publicada": { en: "New review published", es: "Nueva reseña publicada" },
  "Novo seguidor": { en: "New follower", es: "Nuevo seguidor" },
  "Nova solicitação para seguir": {
    en: "New follow request",
    es: "Nueva solicitud para seguir",
  },
  "Solicitação para seguir": {
    en: "Follow request",
    es: "Solicitud para seguir",
  },
  "Responder solicitação": {
    en: "Respond to request",
    es: "Responder solicitud",
  },
  "Aceitar": { en: "Accept", es: "Aceptar" },
  "Recusar": { en: "Decline", es: "Rechazar" },
  "Aceitando...": { en: "Accepting...", es: "Aceptando..." },
  "Recusando...": { en: "Declining...", es: "Rechazando..." },
  "Nova curtida no Diário": { en: "New Journal like", es: "Nuevo Me gusta en el Diario" },
  "Novo comentário no Diário": { en: "New Journal comment", es: "Nuevo comentario en el Diario" },
  "Comentário no Diário": { en: "Journal comment", es: "Comentario en el Diario" },
  "Nova curtida no capítulo": { en: "New chapter like", es: "Nuevo Me gusta en el capítulo" },
  "Nova curtida no seu comentário": { en: "New like on your comment", es: "Nuevo Me gusta en tu comentario" },
  "Nova curtida na Comunidade": { en: "New Community like", es: "Nuevo Me gusta en la Comunidad" },
  "Comentário na Comunidade": { en: "Community comment", es: "Comentario en la Comunidad" },
  "comentário na Comunidade": { en: "Community comment", es: "Comentario en la Comunidad" },
  "Nova curtida na obra": { en: "New like on the work", es: "Nuevo Me gusta en la obra" },
  "Novo comentário na obra": { en: "New comment on the work", es: "Nuevo comentario en la obra" },
  "Nova avaliação no Diário": { en: "New Journal rating", es: "Nueva valoración en el Diario" },
  "Obra concluída no Diário": { en: "Work completed in the Journal", es: "Obra completada en el Diario" },
  "Comentário na obra": { en: "Comment on the work", es: "Comentario en la obra" },
  "Curtida na obra": { en: "Like on the work", es: "Me gusta en la obra" },
  "Comentário em publicação": { en: "Comment on a post", es: "Comentario en una publicación" },
  "Curtida em publicação": { en: "Like on a post", es: "Me gusta en una publicación" },
  "Review publicada": { en: "Review published", es: "Reseña publicada" },
  "Curtida no Diário": { en: "Journal like", es: "Me gusta en el Diario" },
  "Atividade do Diário": { en: "Journal activity", es: "Actividad del Diario" },
  "Atividade da comunidade": { en: "Community activity", es: "Actividad de la comunidad" },
  "Denúncia analisada": { en: "Report reviewed", es: "Denuncia revisada" },
  "Moderação": { en: "Moderation", es: "Moderación" },
  "Suporte técnico": { en: "Technical support", es: "Soporte técnico" },
  "Problema técnico em análise": {
    en: "Technical issue under review",
    es: "Problema técnico en revisión",
  },
  "Problema técnico aguardando informações": {
    en: "Technical issue waiting for information",
    es: "Problema técnico esperando información",
  },
  "Problema técnico resolvido": {
    en: "Technical issue resolved",
    es: "Problema técnico resuelto",
  },
  "Problema técnico fechado": {
    en: "Technical issue closed",
    es: "Problema técnico cerrado",
  },
  "Comentário em capítulo": { en: "Comment on a chapter", es: "Comentario en un capítulo" },
  "Curtida no capítulo": { en: "Chapter like", es: "Me gusta en el capítulo" },
  "Curtida no comentário": { en: "Comment like", es: "Me gusta en el comentario" },
  "Comentário na sua obra": { en: "Comment on your work", es: "Comentario en tu obra" },
  "Curtida na sua obra": { en: "Like on your work", es: "Me gusta en tu obra" },
  "Ver perfil": { en: "View profile", es: "Ver perfil" },
  "Ver obra": { en: "View work", es: "Ver obra" },
  "Ver Diário": { en: "View Journal", es: "Ver Diario" },
  "Ver comunidade": { en: "View Community", es: "Ver comunidad" },
  "Ver comentário": { en: "View comment", es: "Ver comentario" },
  "Ver capítulo": { en: "View chapter", es: "Ver capítulo" },
  "Ver chamado": { en: "View ticket", es: "Ver solicitud" },
  "Obra não encontrada": { en: "Work not found", es: "Obra no encontrada" },
  "Capítulo não encontrado": { en: "Chapter not found", es: "Capítulo no encontrado" },
  "Obra sem título": { en: "Untitled work", es: "Obra sin título" },
  "Capítulo sem título": { en: "Untitled chapter", es: "Capítulo sin título" },
  "Autor não informado": { en: "Author not provided", es: "Autor no informado" },
  "Não informado": { en: "Not provided", es: "No informado" },
  "Não informada": { en: "Not provided", es: "No informada" },
  "Nenhuma sinopse informada.": { en: "No synopsis provided.", es: "No se proporcionó una sinopsis." },
  "Usuário": { en: "User", es: "Usuario" },
  "Leitor": { en: "Reader", es: "Lector" },
  "Alguém": { en: "Someone", es: "Alguien" },
  "Você": { en: "You", es: "Tú" },
  "Review": { en: "Review", es: "Reseña" },
  "Quero ler": { en: "Want to read", es: "Quiero leer" },
  "anotação": { en: "note", es: "anotación" },
  "avaliação": { en: "rating", es: "valoración" },
  "conteúdo": { en: "content", es: "contenido" },
  "em análise": { en: "under review", es: "en revisión" },
  "obra concluída": { en: "completed work", es: "obra completada" },
  "sem tags": { en: "no tags", es: "sin etiquetas" },
  "sua obra": { en: "your work", es: "tu obra" },
  "sua publicação": { en: "your post", es: "tu publicación" },
  "uma obra": { en: "a work", es: "una obra" },
  "uma publicação sua": { en: "one of your posts", es: "una publicación tuya" },
};

const NOTIFICACOES_UI_TRANSLATIONS_NORMALIZADAS = new Map(
  Object.entries(NOTIFICACOES_UI_TRANSLATIONS).map(([texto, traducao]) => [
    normalizarTexto(texto),
    traducao,
  ])
);

function traduzirStatusDenunciaNotificacoes(
  status: string,
  idioma: HistorietasLanguage
) {
  const statusNormalizado = normalizarTexto(status);

  if (idioma === "en") {
    if (statusNormalizado.includes("analise")) return "under review";
    if (statusNormalizado.includes("resolvida")) return "resolved";
    if (statusNormalizado.includes("rejeitada")) return "rejected";
    return status;
  }

  if (statusNormalizado.includes("analise")) return "en revisión";
  if (statusNormalizado.includes("resolvida")) return "resuelta";
  if (statusNormalizado.includes("rejeitada")) return "rechazada";

  return status;
}

function traduzirStatusProblemaTecnicoNotificacoes(
  status: string,
  idioma: HistorietasLanguage
) {
  const statusNormalizado = normalizarTexto(status);

  if (idioma === "en") {
    if (statusNormalizado.includes("analise")) return "under review";
    if (statusNormalizado.includes("aguardando")) return "waiting for information";
    if (statusNormalizado.includes("resolvido")) return "resolved";
    if (statusNormalizado.includes("fechado")) return "closed";
    return status;
  }

  if (statusNormalizado.includes("analise")) return "en revisión";
  if (statusNormalizado.includes("aguardando")) return "esperando información";
  if (statusNormalizado.includes("resolvido")) return "resuelto";
  if (statusNormalizado.includes("fechado")) return "cerrado";

  return status;
}

function traduzirDataNotificacoes(
  texto: string,
  idioma: HistorietasLanguage
) {
  const mesesPt: Record<string, { en: string; es: string }> = {
    janeiro: { en: "January", es: "enero" },
    fevereiro: { en: "February", es: "febrero" },
    março: { en: "March", es: "marzo" },
    abril: { en: "April", es: "abril" },
    maio: { en: "May", es: "mayo" },
    junho: { en: "June", es: "junio" },
    julho: { en: "July", es: "julio" },
    agosto: { en: "August", es: "agosto" },
    setembro: { en: "September", es: "septiembre" },
    outubro: { en: "October", es: "octubre" },
    novembro: { en: "November", es: "noviembre" },
    dezembro: { en: "December", es: "diciembre" },
  };

  const correspondencia = /^(\d{1,2}) de ([A-Za-zÀ-ÿ]+) de (\d{4})$/.exec(
    texto
  );

  if (!correspondencia) {
    return "";
  }

  const mes = mesesPt[correspondencia[2].toLowerCase()];

  if (!mes) {
    return "";
  }

  return idioma === "en"
    ? `${mes.en} ${correspondencia[1]}, ${correspondencia[3]}`
    : `${correspondencia[1]} de ${mes.es} de ${correspondencia[3]}`;
}

export function traduzirTextoNotificacoes(
  texto: string,
  idioma: HistorietasLanguage
) {
  if (idioma === "pt-BR" || !texto) {
    return texto;
  }

  const partes = /^(\s*)([\s\S]*?)(\s*)$/.exec(texto);

  if (!partes) {
    return texto;
  }

  const inicio = partes[1];
  const conteudo = partes[2];
  const fim = partes[3];
  const traducaoExata =
    NOTIFICACOES_UI_TRANSLATIONS[conteudo] ||
    NOTIFICACOES_UI_TRANSLATIONS_NORMALIZADAS.get(normalizarTexto(conteudo));

  if (traducaoExata) {
    return `${inicio}${traducaoExata[idioma]}${fim}`;
  }

  const dataTraduzida = traduzirDataNotificacoes(conteudo, idioma);

  if (dataTraduzida) {
    return `${inicio}${dataTraduzida}${fim}`;
  }

  let correspondencia = /^Abrir perfil de (.+)$/i.exec(conteudo);

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Open ${correspondencia[1]}'s profile${fim}`
      : `${inicio}Abrir el perfil de ${correspondencia[1]}${fim}`;
  }

  correspondencia = /^Abrir ações de (.+)$/i.exec(conteudo);

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Open actions for ${correspondencia[1]}${fim}`
      : `${inicio}Abrir acciones de ${correspondencia[1]}${fim}`;
  }

  correspondencia = /^Comentário de (.+)$/i.exec(conteudo);

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Comment from ${correspondencia[1]}${fim}`
      : `${inicio}Comentario de ${correspondencia[1]}${fim}`;
  }

  correspondencia = /^Curtida de (.+)$/i.exec(conteudo);

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Like from ${correspondencia[1]}${fim}`
      : `${inicio}Me gusta de ${correspondencia[1]}${fim}`;
  }

  correspondencia = /^Novo seguidor:\s*(.+)$/i.exec(conteudo);

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}New follower: ${correspondencia[1]}${fim}`
      : `${inicio}Nuevo seguidor: ${correspondencia[1]}${fim}`;
  }

  correspondencia = /^(.+?) começou a seguir seu perfil\.$/i.exec(conteudo);

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}${correspondencia[1]} started following your profile.${fim}`
      : `${inicio}${correspondencia[1]} empezó a seguir tu perfil.${fim}`;
  }

  correspondencia = /^Solicitação de (.+)$/i.exec(conteudo);

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Request from ${correspondencia[1]}${fim}`
      : `${inicio}Solicitud de ${correspondencia[1]}${fim}`;
  }

  correspondencia = /^(.+?) quer seguir seu perfil\.$/i.exec(conteudo);

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}${correspondencia[1]} wants to follow your profile.${fim}`
      : `${inicio}${correspondencia[1]} quiere seguir tu perfil.${fim}`;
  }

  correspondencia = /^(.+?) comentou em "(.+?)"(?::\s*(.+)|\.)$/i.exec(
    conteudo
  );

  if (correspondencia) {
    const complemento = correspondencia[3]
      ? `: ${correspondencia[3]}`
      : ".";

    return idioma === "en"
      ? `${inicio}${correspondencia[1]} commented on "${correspondencia[2]}"${complemento}${fim}`
      : `${inicio}${correspondencia[1]} comentó en "${correspondencia[2]}"${complemento}${fim}`;
  }

  correspondencia = /^(.+?) comentou em (.+?)(?::\s*(.+)|\.)$/i.exec(conteudo);

  if (correspondencia) {
    const complemento = correspondencia[3]
      ? `: ${correspondencia[3]}`
      : ".";

    return idioma === "en"
      ? `${inicio}${correspondencia[1]} commented on ${correspondencia[2]}${complemento}${fim}`
      : `${inicio}${correspondencia[1]} comentó en ${correspondencia[2]}${complemento}${fim}`;
  }

  correspondencia =
    /^(.+?) publicou uma review sobre (.+?)(?::\s*(.+)|\.)$/i.exec(conteudo);

  if (correspondencia) {
    const complemento = correspondencia[3]
      ? `: ${correspondencia[3]}`
      : ".";

    return idioma === "en"
      ? `${inicio}${correspondencia[1]} posted a review of ${correspondencia[2]}${complemento}${fim}`
      : `${inicio}${correspondencia[1]} publicó una reseña sobre ${correspondencia[2]}${complemento}${fim}`;
  }

  correspondencia = /^Denúncia\s+(.+)$/i.exec(conteudo);

  if (correspondencia) {
    const status = traduzirStatusDenunciaNotificacoes(
      correspondencia[1],
      idioma
    );

    return idioma === "en"
      ? `${inicio}Report ${status}${fim}`
      : `${inicio}Denuncia ${status}${fim}`;
  }

  correspondencia =
    /^A moderação atualizou sua denúncia:\s*(.+)$/i.exec(conteudo);

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Moderation updated your report: ${correspondencia[1]}${fim}`
      : `${inicio}Moderación actualizó tu denuncia: ${correspondencia[1]}${fim}`;
  }

  correspondencia =
    /^A moderação marcou sua denúncia como (.+)\.$/i.exec(conteudo);

  if (correspondencia) {
    const status = traduzirStatusDenunciaNotificacoes(
      correspondencia[1],
      idioma
    );

    return idioma === "en"
      ? `${inicio}Moderation marked your report as ${status}.${fim}`
      : `${inicio}Moderación marcó tu denuncia como ${status}.${fim}`;
  }

  correspondencia =
    /^Seu chamado técnico ["“](.+?)["”] foi atualizado para (.+)\.$/i.exec(
      conteudo
    );

  if (correspondencia) {
    const status = traduzirStatusProblemaTecnicoNotificacoes(
      correspondencia[2],
      idioma
    );

    return idioma === "en"
      ? `${inicio}Your technical ticket "${correspondencia[1]}" was updated to ${status}.${fim}`
      : `${inicio}Tu solicitud técnica "${correspondencia[1]}" fue actualizada a ${status}.${fim}`;
  }

  correspondencia =
    /^(.+?) curtiu sua (anotação|avaliação)(?: sobre (.+))?\.$/i.exec(
      conteudo
    );

  if (correspondencia) {
    const tipo =
      idioma === "en"
        ? correspondencia[2].toLowerCase() === "anotação"
          ? "note"
          : "rating"
        : correspondencia[2].toLowerCase() === "anotação"
          ? "anotación"
          : "valoración";
    const sobre = correspondencia[3]
      ? idioma === "en"
        ? ` about ${correspondencia[3]}`
        : ` sobre ${correspondencia[3]}`
      : "";

    return idioma === "en"
      ? `${inicio}${correspondencia[1]} liked your ${tipo}${sobre}.${fim}`
      : `${inicio}${correspondencia[1]} indicó Me gusta en tu ${tipo}${sobre}.${fim}`;
  }

  correspondencia =
    /^(.+?) comentou na sua (anotação|avaliação)(?: sobre (.+?))?(?::\s*(.+)|\.)$/i.exec(
      conteudo
    );

  if (correspondencia) {
    const tipo =
      idioma === "en"
        ? correspondencia[2].toLowerCase() === "anotação"
          ? "note"
          : "rating"
        : correspondencia[2].toLowerCase() === "anotação"
          ? "anotación"
          : "valoración";
    const sobre = correspondencia[3]
      ? idioma === "en"
        ? ` about ${correspondencia[3]}`
        : ` sobre ${correspondencia[3]}`
      : "";
    const complemento = correspondencia[4]
      ? `: ${correspondencia[4]}`
      : ".";

    return idioma === "en"
      ? `${inicio}${correspondencia[1]} commented on your ${tipo}${sobre}${complemento}${fim}`
      : `${inicio}${correspondencia[1]} comentó en tu ${tipo}${sobre}${complemento}${fim}`;
  }

  correspondencia =
    /^(.+?) avaliou (.+?)(?: com ([\d,.]+) estrelas)?\.$/i.exec(conteudo);

  if (correspondencia) {
    const nota = correspondencia[3]
      ? idioma === "en"
        ? ` with ${correspondencia[3].replace(",", ".")} stars`
        : ` con ${correspondencia[3]} estrellas`
      : "";

    return idioma === "en"
      ? `${inicio}${correspondencia[1]} rated ${correspondencia[2]}${nota}.${fim}`
      : `${inicio}${correspondencia[1]} valoró ${correspondencia[2]}${nota}.${fim}`;
  }

  correspondencia = /^(.+?) curtiu ["“](.+?)["”]\.?$/i.exec(conteudo);

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}${correspondencia[1]} liked "${correspondencia[2]}".${fim}`
      : `${inicio}A ${correspondencia[1]} le gustó "${correspondencia[2]}".${fim}`;
  }

  correspondencia = /^(.+?) curtiu (.+?)\.?$/i.exec(conteudo);

  if (correspondencia) {
    const alvoOriginal = correspondencia[2].replace(/[.!?]+$/g, "").trim();
    const alvoNormalizado = normalizarTexto(alvoOriginal);
    const alvoTraduzido =
      idioma === "en"
        ? alvoNormalizado === "sua obra"
          ? "your work"
          : alvoNormalizado === "seu capitulo"
            ? "your chapter"
            : alvoNormalizado === "seu comentario"
              ? "your comment"
              : alvoNormalizado === "sua publicacao"
                ? "your post"
                : alvoOriginal
        : alvoNormalizado === "sua obra"
          ? "tu obra"
          : alvoNormalizado === "seu capitulo"
            ? "tu capítulo"
            : alvoNormalizado === "seu comentario"
              ? "tu comentario"
              : alvoNormalizado === "sua publicacao"
                ? "tu publicación"
                : alvoOriginal;

    return idioma === "en"
      ? `${inicio}${correspondencia[1]} liked ${alvoTraduzido}.${fim}`
      : `${inicio}A ${correspondencia[1]} le gustó ${alvoTraduzido}.${fim}`;
  }

  correspondencia = /^(.+?) concluiu (.+)\.$/i.exec(conteudo);

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}${correspondencia[1]} completed ${correspondencia[2]}.${fim}`
      : `${inicio}${correspondencia[1]} completó ${correspondencia[2]}.${fim}`;
  }

  correspondencia = /^(.+?) chegou em (.+)\.$/i.exec(conteudo);

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}${correspondencia[1]} is now available in ${correspondencia[2]}.${fim}`
      : `${inicio}${correspondencia[1]} ya está disponible en ${correspondencia[2]}.${fim}`;
  }

  correspondencia = /^(.+?) foi adicionado em (.+)\.$/i.exec(conteudo);

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}${correspondencia[1]} was added to ${correspondencia[2]}.${fim}`
      : `${inicio}${correspondencia[1]} se añadió a ${correspondencia[2]}.${fim}`;
  }

  correspondencia = /^(.+?) foi atualizado em (.+)\.$/i.exec(conteudo);

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}${correspondencia[1]} was updated in ${correspondencia[2]}.${fim}`
      : `${inicio}${correspondencia[1]} se actualizó en ${correspondencia[2]}.${fim}`;
  }

  correspondencia = /^há\s+(\d+)\s+(segundo|segundos|minuto|minutos|hora|horas|dia|dias)$/i.exec(
    conteudo
  );

  if (correspondencia) {
    const quantidade = Number(correspondencia[1]);
    const unidade = correspondencia[2].toLowerCase();

    if (idioma === "en") {
      const unidadeTraduzida = unidade.startsWith("segundo")
        ? quantidade === 1
          ? "second"
          : "seconds"
        : unidade.startsWith("minuto")
          ? quantidade === 1
            ? "minute"
            : "minutes"
          : unidade.startsWith("hora")
            ? quantidade === 1
              ? "hour"
              : "hours"
            : quantidade === 1
              ? "day"
              : "days";

      return `${inicio}${quantidade} ${unidadeTraduzida} ago${fim}`;
    }

    const unidadeTraduzida = unidade.startsWith("segundo")
      ? quantidade === 1
        ? "segundo"
        : "segundos"
      : unidade.startsWith("minuto")
        ? quantidade === 1
          ? "minuto"
          : "minutos"
        : unidade.startsWith("hora")
          ? quantidade === 1
            ? "hora"
            : "horas"
          : quantidade === 1
            ? "día"
            : "días";

    return `${inicio}hace ${quantidade} ${unidadeTraduzida}${fim}`;
  }

  return texto;
}

export default function NotificacoesLanguageBridge() {
  const { language } = useHistorietasLanguage();

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const seletorRaiz =
      "[data-historietas-notificacoes-root='true'], [data-historietas-notificacoes-overlay='true']";

    type EstadoTraducaoNotificacoes = {
      original: string;
      traduzido: string;
    };

    const estadosTexto: WeakMap<Text, EstadoTraducaoNotificacoes> =
      new WeakMap();
    const estadosAtributos: WeakMap<
      Element,
      Map<string, EstadoTraducaoNotificacoes>
    > = new WeakMap();
    const textosAlterados = new Set<Text>();
    const atributosAlterados: Array<{ elemento: Element; atributo: string }> = [];
    const atributosTraduziveis = ["aria-label", "title", "placeholder", "alt"];
    let aplicando = false;

    function elementoEstaNaPagina(elemento: Element | null) {
      return Boolean(
        elemento?.matches(seletorRaiz) || elemento?.closest(seletorRaiz)
      );
    }

    function deveIgnorarElemento(elemento: Element | null) {
      if (!elemento || !elementoEstaNaPagina(elemento)) {
        return true;
      }

      if (elemento.closest("[data-historietas-i18n-ignore='true']")) {
        return true;
      }

      const tag = elemento.tagName.toLowerCase();

      return tag === "script" || tag === "style";
    }

    function aplicarTexto(no: Text) {
      const elementoPai = no.parentElement;

      if (
        deveIgnorarElemento(elementoPai) ||
        elementoPai?.tagName.toLowerCase() === "textarea"
      ) {
        return;
      }

      const atual = no.data;
      let estado = estadosTexto.get(no);

      if (!estado) {
        estado = { original: atual, traduzido: atual };
        estadosTexto.set(no, estado);
        textosAlterados.add(no);
      } else if (atual !== estado.traduzido && atual !== estado.original) {
        estado.original = atual;
      }

      const proximo = traduzirTextoNotificacoes(estado.original, language);
      estado.traduzido = proximo;

      if (no.data !== proximo) {
        no.data = proximo;
      }
    }

    function aplicarAtributo(elemento: Element, atributo: string) {
      if (deveIgnorarElemento(elemento) || !elemento.hasAttribute(atributo)) {
        return;
      }

      const atual = elemento.getAttribute(atributo) || "";
      let mapaElemento = estadosAtributos.get(elemento);

      if (!mapaElemento) {
        mapaElemento = new Map();
        estadosAtributos.set(elemento, mapaElemento);
      }

      let estado = mapaElemento.get(atributo);

      if (!estado) {
        estado = { original: atual, traduzido: atual };
        mapaElemento.set(atributo, estado);
        atributosAlterados.push({ elemento, atributo });
      } else if (atual !== estado.traduzido && atual !== estado.original) {
        estado.original = atual;
      }

      const proximo = traduzirTextoNotificacoes(estado.original, language);
      estado.traduzido = proximo;

      if (atual !== proximo) {
        elemento.setAttribute(atributo, proximo);
      }
    }

    function aplicarNo(no: Node) {
      if (no.nodeType === Node.TEXT_NODE) {
        aplicarTexto(no as Text);
        return;
      }

      if (!(no instanceof Element)) {
        return;
      }

      const raizes: Element[] = [];

      if (no.matches(seletorRaiz)) {
        raizes.push(no);
      } else if (no.closest(seletorRaiz)) {
        raizes.push(no);
      } else {
        no.querySelectorAll(seletorRaiz).forEach((raiz) => raizes.push(raiz));
      }

      raizes.forEach((raiz) => {
        if (deveIgnorarElemento(raiz)) {
          return;
        }

        atributosTraduziveis.forEach((atributo) =>
          aplicarAtributo(raiz, atributo)
        );

        const walker = document.createTreeWalker(
          raiz,
          NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT
        );
        let atual: Node | null = walker.nextNode();

        while (atual) {
          if (atual.nodeType === Node.TEXT_NODE) {
            aplicarTexto(atual as Text);
          } else if (atual instanceof Element && !deveIgnorarElemento(atual)) {
            atributosTraduziveis.forEach((atributo) =>
              aplicarAtributo(atual as Element, atributo)
            );
          }

          atual = walker.nextNode();
        }
      });
    }

    function aplicarTudo() {
      if (aplicando) {
        return;
      }

      aplicando = true;

      try {
        document
          .querySelectorAll(seletorRaiz)
          .forEach((raiz) => aplicarNo(raiz));
      } finally {
        aplicando = false;
      }
    }

    aplicarTudo();

    const observador = new MutationObserver((mutacoes) => {
      if (aplicando) {
        return;
      }

      aplicando = true;

      try {
        mutacoes.forEach((mutacao) => {
          if (mutacao.type === "characterData") {
            aplicarTexto(mutacao.target as Text);
            return;
          }

          if (
            mutacao.type === "attributes" &&
            mutacao.target instanceof Element
          ) {
            if (
              mutacao.attributeName &&
              atributosTraduziveis.includes(mutacao.attributeName)
            ) {
              aplicarAtributo(mutacao.target, mutacao.attributeName);
            }

            return;
          }

          mutacao.addedNodes.forEach((no) => aplicarNo(no));
        });
      } finally {
        aplicando = false;
      }
    });

    observador.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: atributosTraduziveis,
    });

    return () => {
      observador.disconnect();

      textosAlterados.forEach((no) => {
        const estado = estadosTexto.get(no);

        if (estado && no.isConnected && no.data === estado.traduzido) {
          no.data = estado.original;
        }
      });

      atributosAlterados.forEach((registro) => {
        const estado = estadosAtributos
          .get(registro.elemento)
          ?.get(registro.atributo);

        if (
          estado &&
          registro.elemento.isConnected &&
          registro.elemento.getAttribute(registro.atributo) ===
            estado.traduzido
        ) {
          registro.elemento.setAttribute(
            registro.atributo,
            estado.original
          );
        }
      });
    };
  }, [language]);

  return null;
}
