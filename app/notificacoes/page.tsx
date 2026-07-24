"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { supabase } from "../../lib/supabase/client";
import { historietasThemeCss, useHistorietasTheme } from "../../lib/historietasTheme";
import { useNotificacoes } from "../../components/NotificacoesProvider";
import { criarSlugBase, formatarData, idObraSupabaseValido, normalizarTexto, obterNumeroSeguro } from "../../lib/utils";
import { useEffect, useMemo, useState } from "react";
import { useHistorietasLanguage } from "../../components/HistorietasLanguageProvider";
import type { HistorietasLanguage } from "../../lib/i18n";
import type { CSSProperties, ReactNode } from "react";

type CapituloLocal = {
  id: string;
  titulo: string;
  texto: string;
  curtiu: boolean;
  salvo: boolean;
  comentario: string;
  criadoEm: string;
  lido: boolean;
  lidoEm: string;
};

type ObraLocal = {
  id: string;
  titulo: string;
  autor: string;
  autorId?: string;
  genero: string;
  formato: string;
  classificacaoIndicativa: string;
  sinopse: string;
  tags: string[];
  capa: string;
  capaNome: string;
  publicado: boolean;
  capitulos: CapituloLocal[];
  criadaEm: string;
  ultimoCapituloLidoId: string;
  ultimaLeituraEm: string;
  progressoLeitura: number;
  slug: string;
  link: string;
};

type NotificacaoLocal = {
  id: string;
  obraId: string;
  capituloId: string;
  link: string;
  titulo: string;
  mensagem: string;
  tipo:
    | "novo-capitulo"
    | "comentario-obra"
    | "curtida-obra"
    | "comentario-capitulo"
    | "curtida-capitulo"
    | "curtida-comentario-capitulo"
    | "comentario-comunidade"
    | "curtida-comunidade"
    | "review-comunidade"
    | "atividade-comunidade"
    | "curtida-diario"
    | "comentario-diario"
    | "atividade-diario"
    | "novo-seguidor"
    | "denuncia-comunidade"
    | "moderacao-comunidade";
  lida: boolean;
  criadaEm: string;
  autorId?: string;
  autorNome?: string;
  autorAvatar?: string;
};

type FiltroNotificacao = "todas" | "nao-lidas" | "lidas" | "capitulos" | "comunidade";
type OrdenacaoNotificacao = "recentes" | "antigas" | "obra" | "capitulo";


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

function traduzirTextoNotificacoes(
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

function NotificacoesLanguageBridge() {
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

const CHAVE_OBRAS = "historietas-obras";
const CHAVE_NOTIFICACOES = "historietas-notificacoes";
const CHAVE_OBRAS_SEGUIDAS = "historietas-obras-seguidas";
const CHAVE_NOTIFICACOES_APAGADAS = "historietas-notificacoes-apagadas";

function NotificacoesOverlayPortal({ children }: { children: ReactNode }) {
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    const montarPortalTimer = window.setTimeout(() => {
      setMontado(true);
    }, 0);

    return () => {
      window.clearTimeout(montarPortalTimer);
    };
  }, []);

  if (!montado || typeof document === "undefined") {
    return null;
  }

  return createPortal(children, document.body);
}

function corrigirTextoQuebrado(texto: string) {
  let textoCorrigido = texto;

  for (let tentativa = 0; tentativa < 2; tentativa += 1) {
    if (!/[ÃÂâð�]/.test(textoCorrigido)) {
      break;
    }

    try {
      const bytes = new Uint8Array(
        Array.from(textoCorrigido, (caractere) => caractere.charCodeAt(0) & 255)
      );
      const decodificado = new TextDecoder("utf-8", { fatal: true }).decode(bytes);

      if (!decodificado || decodificado === textoCorrigido) {
        break;
      }

      textoCorrigido = decodificado;
    } catch {
      break;
    }
  }

  return textoCorrigido.replace(/�/g, "");
}

function limparTextoExibicao(valor: string) {
  return corrigirTextoQuebrado(valor).trim();
}

function criarStorageKeyUsuarioNotificacoes(chave: string, userId: string) {
  const userIdLimpo = userId.trim();

  return userIdLimpo ? `${chave}:${userIdLimpo}` : "";
}

function lerStorageUsuarioNotificacoes(chave: string, userId: string) {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return null;
  }

  try {
    const chaveStorage = criarStorageKeyUsuarioNotificacoes(chave, userIdLimpo);

    return chaveStorage ? localStorage.getItem(chaveStorage) : null;
  } catch {
    return null;
  }
}

function salvarJsonStorageUsuarioNotificacoes(
  chave: string,
  userId: string,
  valor: unknown
) {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return;
  }

  try {
    const chaveStorage = criarStorageKeyUsuarioNotificacoes(chave, userIdLimpo);

    if (!chaveStorage) {
      return;
    }

    localStorage.setItem(chaveStorage, JSON.stringify(valor));
  } catch {
    // localStorage é fallback; as notificações continuam em memória.
  }
}

function criarLoginHrefNotificacoes() {
  const params = new URLSearchParams({
    redirectTo: "/notificacoes",
  });

  return `/login?${params.toString()}`;
}

function criarHrefLeituraCapitulo(
  obra: Pick<ObraLocal, "id" | "slug" | "titulo" | "publicado">,
  capituloId: string,
  numeroCapitulo: number
) {
  const slugSeguro = obra.slug?.trim() || criarSlugBase(obra.titulo);

  if (
    obra.publicado &&
    idObraSupabaseValido(obra.id) &&
    slugSeguro &&
    Number.isInteger(numeroCapitulo) &&
    numeroCapitulo > 0
  ) {
    return `/obra/${encodeURIComponent(slugSeguro)}/capitulo/${numeroCapitulo}`;
  }

  return `/ler-capitulo?obraId=${encodeURIComponent(
    obra.id
  )}&capituloId=${encodeURIComponent(capituloId)}`;
}

function calcularProgressoLeitura(capitulos: CapituloLocal[]) {
  if (capitulos.length === 0) {
    return 0;
  }

  const capitulosLidos = capitulos.filter((capitulo) => capitulo.lido).length;

  return Math.round((capitulosLidos / capitulos.length) * 100);
}

function dataNotificacao(notificacao: NotificacaoLocal) {
  const data = new Date(notificacao.criadaEm).getTime();

  return Number.isNaN(data) ? 0 : data;
}

function normalizarCapitulo(
  capitulo: Partial<CapituloLocal>,
  index: number
): CapituloLocal {
  return {
    id:
      typeof capitulo.id === "string" && capitulo.id.trim()
        ? capitulo.id
        : `capitulo-${index + 1}`,
    titulo:
      typeof capitulo.titulo === "string" && capitulo.titulo.trim()
        ? limparTextoExibicao(capitulo.titulo)
        : "Capítulo sem título",
    texto: typeof capitulo.texto === "string" ? corrigirTextoQuebrado(capitulo.texto) : "",
    curtiu: Boolean(capitulo.curtiu),
    salvo: Boolean(capitulo.salvo),
    comentario:
      typeof capitulo.comentario === "string"
        ? corrigirTextoQuebrado(capitulo.comentario)
        : "",
    criadoEm: typeof capitulo.criadoEm === "string" ? capitulo.criadoEm : "",
    lido: Boolean(capitulo.lido),
    lidoEm: typeof capitulo.lidoEm === "string" ? capitulo.lidoEm : "",
  };
}

function normalizarObra(obra: Partial<ObraLocal>, index: number): ObraLocal {
  const capitulosNormalizados: CapituloLocal[] = Array.isArray(obra.capitulos)
    ? obra.capitulos.map((capitulo, capituloIndex) =>
        normalizarCapitulo(capitulo, capituloIndex)
      )
    : [];

  const tagsNormalizadas = Array.isArray(obra.tags)
    ? obra.tags
        .filter((tag): tag is string => typeof tag === "string" && Boolean(tag.trim()))
        .map((tag) => limparTextoExibicao(tag))
    : [];

  return {
    id:
      typeof obra.id === "string" && obra.id.trim()
        ? obra.id
        : `obra-${index + 1}`,
    titulo:
      typeof obra.titulo === "string" && obra.titulo.trim()
        ? limparTextoExibicao(obra.titulo)
        : "Obra sem título",
    autor:
      typeof obra.autor === "string" && obra.autor.trim()
        ? limparTextoExibicao(obra.autor)
        : "Autor não informado",
    autorId:
      typeof obra.autorId === "string" && obra.autorId.trim()
        ? obra.autorId
        : "",
    genero:
      typeof obra.genero === "string" && obra.genero.trim()
        ? limparTextoExibicao(obra.genero)
        : "Não informado",
    formato:
      typeof obra.formato === "string" && obra.formato.trim()
        ? limparTextoExibicao(obra.formato)
        : "Não informado",
    classificacaoIndicativa:
      typeof obra.classificacaoIndicativa === "string" &&
      obra.classificacaoIndicativa.trim()
        ? limparTextoExibicao(obra.classificacaoIndicativa)
        : "Não informada",
    sinopse:
      typeof obra.sinopse === "string" && obra.sinopse.trim()
        ? corrigirTextoQuebrado(obra.sinopse)
        : "Nenhuma sinopse informada.",
    tags: tagsNormalizadas.length > 0 ? tagsNormalizadas : ["sem tags"],
    capa: typeof obra.capa === "string" ? obra.capa : "",
    capaNome: typeof obra.capaNome === "string" ? obra.capaNome : "",
    publicado: Boolean(obra.publicado),
    capitulos: capitulosNormalizados,
    criadaEm: typeof obra.criadaEm === "string" ? obra.criadaEm : "",
    ultimoCapituloLidoId:
      typeof obra.ultimoCapituloLidoId === "string"
        ? obra.ultimoCapituloLidoId
        : "",
    ultimaLeituraEm:
      typeof obra.ultimaLeituraEm === "string" ? obra.ultimaLeituraEm : "",
    progressoLeitura: calcularProgressoLeitura(capitulosNormalizados),
    slug:
      typeof obra.slug === "string" && obra.slug.trim()
        ? obra.slug
        : criarSlugBase(
            typeof obra.titulo === "string" && obra.titulo.trim()
              ? obra.titulo
              : `obra-${index + 1}`
          ),
    link:
      typeof obra.link === "string" && obra.link.trim()
        ? obra.link
        : `/obra/${
            typeof obra.slug === "string" && obra.slug.trim()
              ? obra.slug
              : criarSlugBase(
                  typeof obra.titulo === "string" && obra.titulo.trim()
                    ? obra.titulo
                    : `obra-${index + 1}`
                )
          }`,
  };
}

function normalizarTipoNotificacao(valor: unknown): NotificacaoLocal["tipo"] {
  const tipoOriginal = typeof valor === "string" ? valor.trim() : "";
  const tipoAlias = tipoOriginal.toLowerCase().replace(/[ _]+/g, "-");

  const aliases: Record<string, NotificacaoLocal["tipo"]> = {
    "capitulo-novo": "novo-capitulo",
    "novo-capitulo-publicado": "novo-capitulo",
    "comunidade-curtida-post": "curtida-comunidade",
    "comunidade-post-curtida": "curtida-comunidade",
    "curtida-post-comunidade": "curtida-comunidade",
    "curtida-comunidade-post": "curtida-comunidade",
    "curtida-publicacao-comunidade": "curtida-comunidade",
    "curtida-publicacao": "curtida-comunidade",
    "comunidade-comentario-post": "comentario-comunidade",
    "comunidade-post-comentario": "comentario-comunidade",
    "comentario-post-comunidade": "comentario-comunidade",
    "comentario-comunidade-post": "comentario-comunidade",
    "comentario-publicacao-comunidade": "comentario-comunidade",
    "comentario-publicacao": "comentario-comunidade",
    "review": "review-comunidade",
    "avaliacao-comunidade": "review-comunidade",
  };

  const tipoPeloAlias = aliases[tipoAlias];

  if (tipoPeloAlias) {
    return tipoPeloAlias;
  }

  const tiposValidos = new Set<NotificacaoLocal["tipo"]>([
    "novo-capitulo",
    "comentario-obra",
    "curtida-obra",
    "comentario-capitulo",
    "curtida-capitulo",
    "curtida-comentario-capitulo",
    "comentario-comunidade",
    "curtida-comunidade",
    "review-comunidade",
    "atividade-comunidade",
    "curtida-diario",
    "comentario-diario",
    "atividade-diario",
    "novo-seguidor",
    "denuncia-comunidade",
    "moderacao-comunidade",
  ]);

  if (tiposValidos.has(tipoAlias as NotificacaoLocal["tipo"])) {
    return tipoAlias as NotificacaoLocal["tipo"];
  }

  return "atividade-comunidade";
}

function normalizarNotificacao(
  notificacao: Partial<NotificacaoLocal>,
  index: number
): NotificacaoLocal {
  const notificacaoBruta = notificacao as Partial<NotificacaoLocal> &
    Record<string, unknown>;

  return {
    id:
      typeof notificacao.id === "string" && notificacao.id.trim()
        ? notificacao.id
        : `notificacao-${index + 1}`,
    obraId: typeof notificacao.obraId === "string" ? notificacao.obraId : "",
    capituloId:
      typeof notificacao.capituloId === "string" ? notificacao.capituloId : "",
    link:
      typeof notificacao.link === "string" && notificacao.link.trim()
        ? notificacao.link.trim()
        : "",
    titulo:
      typeof notificacao.titulo === "string" && notificacao.titulo.trim()
        ? limparTextoExibicao(notificacao.titulo)
        : "Nova notificação",
    mensagem:
      typeof notificacao.mensagem === "string" && notificacao.mensagem.trim()
        ? corrigirTextoQuebrado(notificacao.mensagem)
        : "Uma obra recebeu uma atualização.",
    tipo: normalizarTipoNotificacao(notificacaoBruta.tipo),
    lida: notificacaoBruta.lida === true,
    criadaEm:
      typeof notificacao.criadaEm === "string" && notificacao.criadaEm.trim()
        ? notificacao.criadaEm
        : new Date().toISOString(),
    autorId:
      typeof notificacaoBruta.autorId === "string"
        ? notificacaoBruta.autorId.trim()
        : "",
    autorNome:
      typeof notificacaoBruta.autorNome === "string"
        ? limparTextoExibicao(notificacaoBruta.autorNome)
        : "",
    autorAvatar:
      typeof notificacaoBruta.autorAvatar === "string"
        ? notificacaoBruta.autorAvatar.trim()
        : "",
  };
}

function carregarObras(userId = ""): ObraLocal[] {
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

function carregarNotificacoes(userId = ""): NotificacaoLocal[] {
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

    const notificacoesNormalizadas = notificacoes
      .map((notificacao, index) => normalizarNotificacao(notificacao, index))
      .sort((a, b) => dataNotificacao(b) - dataNotificacao(a));

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

function salvarNotificacoes(notificacoes: NotificacaoLocal[], userId = "") {
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

function carregarIdsNotificacoesApagadas(usuarioId: string) {
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

function registrarNotificacoesApagadas(usuarioId: string, ids: string[]) {
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

function filtrarNotificacoesApagadas(
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

function linkDiretoValido(link: string) {
  const linkLimpo = link.trim();

  return (
    linkLimpo.startsWith("/") &&
    !linkLimpo.startsWith("//") &&
    !linkLimpo.includes("\\")
  );
}

function criarPerfilHrefNotificacao(userId: string, nomeUsuario: string) {
  const params = new URLSearchParams();
  const userIdLimpo = userId.trim();
  const nomeLimpo = nomeUsuario.trim();

  if (userIdLimpo) {
    params.set("userId", userIdLimpo);
    params.set("autorId", userIdLimpo);
  }

  if (nomeLimpo) {
    params.set("autor", nomeLimpo);
  }

  const query = params.toString();

  return query ? `/perfil-autor?${query}` : "/perfil-autor";
}

function criarDiarioPerfilHrefNotificacao(
  userId: string,
  nomeUsuario = ""
) {
  const params = new URLSearchParams();
  const userIdLimpo = userId.trim();
  const nomeLimpo = nomeUsuario.trim();

  if (userIdLimpo) {
    params.set("userId", userIdLimpo);
    params.set("autorId", userIdLimpo);
  }

  if (nomeLimpo) {
    params.set("autor", nomeLimpo);
  }

  params.set("aba", "diario");

  return `/perfil-autor?${params.toString()}`;
}

function notificacaoEhDiario(notificacao: NotificacaoLocal) {
  return (
    notificacao.tipo === "curtida-diario" ||
    notificacao.tipo === "comentario-diario" ||
    notificacao.tipo === "atividade-diario"
  );
}

function montarLinkNotificacao(
  notificacao: NotificacaoLocal,
  obra?: ObraLocal | null
) {
  if (notificacao.tipo === "novo-seguidor" && notificacao.autorId) {
    return criarPerfilHrefNotificacao(notificacao.autorId, notificacao.autorNome || "Usuário");
  }

  const linkDireto = notificacao.link.trim();

  if (linkDireto && linkDiretoValido(linkDireto)) {
    return linkDireto;
  }

  if (
    (notificacao.tipo === "comentario-obra" ||
      notificacao.tipo === "curtida-obra") &&
    obra
  ) {
    const slugObra = obra.slug?.trim() || criarSlugBase(obra.titulo);

    return obra.link?.trim() || `/obra/${encodeURIComponent(slugObra)}`;
  }

  if (
    notificacaoEhCapitulo(notificacao) &&
    obra &&
    notificacao.obraId &&
    notificacao.capituloId
  ) {
    const indiceCapitulo = obra.capitulos.findIndex(
      (capitulo) => capitulo.id === notificacao.capituloId
    );
    const numeroCapitulo = indiceCapitulo >= 0 ? indiceCapitulo + 1 : 1;

    return criarHrefLeituraCapitulo(
      obra,
      notificacao.capituloId,
      numeroCapitulo
    );
  }

  if (notificacao.obraId && notificacao.capituloId) {
    return `/ler-capitulo?obraId=${encodeURIComponent(
      notificacao.obraId
    )}&capituloId=${encodeURIComponent(notificacao.capituloId)}`;
  }

  return notificacaoEhCapitulo(notificacao) ? "/perfil-autor?aba=biblioteca" : "/comunidade";
}

function notificacaoEhCapitulo(notificacao: NotificacaoLocal) {
  return (
    notificacao.tipo === "novo-capitulo" ||
    notificacao.tipo === "comentario-capitulo" ||
    notificacao.tipo === "curtida-capitulo" ||
    notificacao.tipo === "curtida-comentario-capitulo"
  );
}

function notificacaoEhInteracaoCapitulo(notificacao: NotificacaoLocal) {
  return (
    notificacao.tipo === "comentario-capitulo" ||
    notificacao.tipo === "curtida-capitulo" ||
    notificacao.tipo === "curtida-comentario-capitulo"
  );
}

function notificacaoEhComunidade(notificacao: NotificacaoLocal) {
  return !notificacaoEhCapitulo(notificacao);
}

function notificacaoUsaCardSocial(notificacao: NotificacaoLocal) {
  return notificacaoEhComunidade(notificacao) || notificacaoEhInteracaoCapitulo(notificacao);
}

function normalizarNotificacaoParaExibicao(notificacao: NotificacaoLocal) {
  return normalizarNotificacao(notificacao, 0);
}

function obterDetalheNotificacao(notificacao: NotificacaoLocal) {
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

  if (notificacao.tipo === "atividade-comunidade") {
    return "Atividade da comunidade";
  }

  if (notificacao.tipo === "denuncia-comunidade") {
    return "Denúncia analisada";
  }

  if (notificacao.tipo === "moderacao-comunidade") {
    return "Moderação";
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

function obterAcaoPrincipalNotificacao(notificacao: NotificacaoLocal) {
  if (notificacao.tipo === "novo-seguidor") {
    return "Ver perfil";
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

function obterIconeNotificacao(notificacao: NotificacaoLocal, lida: boolean) {
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

  if (notificacao.tipo === "novo-seguidor") {
    return "+";
  }

  if (
    notificacao.tipo === "denuncia-comunidade" ||
    notificacao.tipo === "moderacao-comunidade"
  ) {
    return "N";
  }

  return "!";
}

function obterTituloExibicaoNotificacao(notificacao: NotificacaoLocal) {
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

function extrairAutorComentarioComunidade(notificacao: NotificacaoLocal) {
  if (notificacao.autorNome?.trim()) {
    return notificacao.autorNome.trim();
  }

  if (notificacao.tipo !== "comentario-comunidade") {
    return "Comunidade";
  }

  const match = /^(.+?)\s+comentou\b/i.exec(notificacao.mensagem.trim());

  return match?.[1]?.trim() || "Leitor";
}

function notificacaoPareceComentarioComunidade(notificacao: NotificacaoLocal) {
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

function notificacaoPareceCurtidaComunidade(notificacao: NotificacaoLocal) {
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

function notificacaoTemAutorSocial(notificacao: NotificacaoLocal) {
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
    notificacao.tipo === "novo-seguidor"
  );
}

function obterTituloBlocoSocialNotificacao(notificacao: NotificacaoLocal) {
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

  return obterDetalheNotificacao(notificacao);
}

function obterTextoBlocoSocialNotificacao(notificacao: NotificacaoLocal) {
  if (
    notificacaoPareceComentarioComunidade(notificacao) ||
    notificacaoPareceCurtidaComunidade(notificacao) ||
    notificacao.tipo === "comentario-capitulo" ||
    notificacao.tipo === "curtida-capitulo" ||
    notificacao.tipo === "curtida-comentario-capitulo"
  ) {
    return "";
  }

  return notificacao.mensagem;
}

function prepararNotificacaoTexto(notificacao: NotificacaoLocal) {
  return normalizarNotificacaoParaExibicao(notificacao);
}

function extrairAutorMensagemNotificacao(notificacao: NotificacaoLocal) {
  const mensagem = notificacao.mensagem.trim();
  const match = /^(.+?)\s+(comentou|curtiu|publicou|começou)\b/i.exec(mensagem);

  return match?.[1]?.trim() || "";
}

function obterNomeAutorNotificacao(notificacao: NotificacaoLocal) {
  return (
    notificacao.autorNome?.trim() ||
    (notificacaoPareceComentarioComunidade(notificacao)
      ? extrairAutorComentarioComunidade(notificacao)
      : extrairAutorMensagemNotificacao(notificacao)) ||
    "Usuário"
  );
}

function obterInicialNotificacao(notificacao: NotificacaoLocal) {
  const nome = obterNomeAutorNotificacao(notificacao);

  return nome.slice(0, 1).toUpperCase() || obterIconeNotificacao(notificacao, notificacao.lida);
}

function criarAvatarNotificacaoStyle(
  notificacao: NotificacaoLocal,
  fallbackStyle: CSSProperties
): CSSProperties {
  const avatar = notificacao.autorAvatar?.trim() || "";

  if (!avatar) {
    return fallbackStyle;
  }

  return {
    ...fallbackStyle,
    backgroundImage: `url(${avatar})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    color: "transparent",
    textDecoration: "none",
    overflow: "hidden",
  };
}


type SupabaseObraRow = Record<string, unknown>;
type SupabaseCapituloRow = Record<string, unknown>;

type EstadoSupabaseNotificacoes = {
  userId: string;
  obrasSeguidasIds: string[];
  notificacoesLidasIds: string[];
  notificacoesDiretas: NotificacaoLocal[];
};

function pegarTexto(valor: unknown, fallback = "") {
  const texto = typeof valor === "string" && valor.trim() ? valor.trim() : fallback;

  return limparTextoExibicao(texto);
}

function pegarBooleano(valor: unknown, fallback = false) {
  return typeof valor === "boolean" ? valor : fallback;
}

type PerfilNotificacao = {
  userId: string;
  nome: string;
  avatar: string;
};

function normalizarPerfilNotificacao(
  row: Record<string, unknown>,
  userIdFallback: string,
  nomeFallback: string
): PerfilNotificacao {
  const userId =
    pegarTexto(row.user_id) || pegarTexto(row.id) || userIdFallback.trim();
  const nome =
    pegarTexto(row.nome) ||
    pegarTexto(row.nome_usuario) ||
    pegarTexto(row.username) ||
    pegarTexto(row.display_name) ||
    pegarTexto(row.apelido) ||
    nomeFallback.trim() ||
    "Usuário";
  const avatar =
    pegarTexto(row.avatar_url) ||
    pegarTexto(row.avatar) ||
    pegarTexto(row.foto_url) ||
    pegarTexto(row.imagem_url) ||
    pegarTexto(row.photo_url);

  return {
    userId,
    nome: nome.slice(0, 80),
    avatar,
  };
}

async function carregarPerfisNotificacoes(userIds: string[]) {
  const ids = Array.from(
    new Set(
      userIds
        .map((id) => id.trim())
        .filter((id) => idObraSupabaseValido(id))
    )
  );
  const perfis = new Map<string, PerfilNotificacao>();

  if (ids.length === 0) {
    return perfis;
  }

  const selecoesProfiles = [
    "id,user_id,nome,avatar_url",
    "id,user_id,nome_usuario,avatar_url",
    "id,user_id,username,avatar_url",
    "id,user_id,display_name,avatar_url",
    "id,user_id,apelido,avatar_url",
  ] as const;

  async function carregarPorColuna(
    coluna: "user_id" | "id",
    idsBusca: string[]
  ) {
    if (idsBusca.length === 0) {
      return;
    }

    for (const campos of selecoesProfiles) {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select(campos)
          .in(coluna, idsBusca)
          .limit(1000);

        if (error || !Array.isArray(data)) {
          continue;
        }

        data.forEach((item) => {
          const row = item as Record<string, unknown>;
          const perfil = normalizarPerfilNotificacao(row, "", "Usuário");

          if (perfil.userId && idObraSupabaseValido(perfil.userId)) {
            perfis.set(perfil.userId, perfil);
          }
        });

        return;
      } catch {
        // Tenta uma seleção menor ou outra coluna.
      }
    }
  }

  await carregarPorColuna("user_id", ids);

  const idsFaltantes = ids.filter((id) => !perfis.has(id));

  await carregarPorColuna("id", idsFaltantes);

  return perfis;
}

function obterPerfilNotificacao(
  perfis: Map<string, PerfilNotificacao>,
  userId: string,
  nomeFallback: string
) {
  const userIdLimpo = userId.trim();
  const perfil = userIdLimpo ? perfis.get(userIdLimpo) : null;

  return (
    perfil || {
      userId: userIdLimpo,
      nome: nomeFallback.trim() || "Usuário",
      avatar: "",
    }
  );
}

function pegarTagsSupabase(valor: unknown): string[] {
  if (Array.isArray(valor)) {
    const tags = valor
      .filter((tag): tag is string => typeof tag === "string" && Boolean(tag.trim()))
      .map((tag) => limparTextoExibicao(tag));

    return tags.length > 0 ? tags : ["sem tags"];
  }

  if (typeof valor === "string" && valor.trim()) {
    const tags = valor
      .split(",")
      .map((tag) => limparTextoExibicao(tag))
      .filter(Boolean);

    return tags.length > 0 ? tags : ["sem tags"];
  }

  return ["sem tags"];
}

function normalizarObraSupabase(row: SupabaseObraRow, index: number): ObraLocal {
  const titulo = pegarTexto(row.titulo, `Obra ${index + 1}`);
  const slug = pegarTexto(row.slug, criarSlugBase(titulo));

  return {
    id: pegarTexto(row.id, `supabase-${index + 1}`),
    titulo,
    autor: pegarTexto(row.autor ?? row.nome_autor ?? row.autor_nome, "Autor não informado"),
    autorId: pegarTexto(row.user_id ?? row.userId ?? row.autor_id ?? row.autorId, ""),
    genero: pegarTexto(row.genero, "Não informado"),
    formato: pegarTexto(row.formato, "Não informado"),
    classificacaoIndicativa: pegarTexto(
      row.classificacao_indicativa ?? row.classificacaoIndicativa,
      "Não informada"
    ),
    sinopse: pegarTexto(row.sinopse, "Nenhuma sinopse informada."),
    tags: pegarTagsSupabase(row.tags),
    capa: pegarTexto(row.capa_url ?? row.capaUrl ?? row.capa, ""),
    capaNome: pegarTexto(row.capa_nome ?? row.capaNome, ""),
    publicado: pegarBooleano(row.publicado, false),
    capitulos: [],
    criadaEm: pegarTexto(row.created_at ?? row.criada_em ?? row.criadaEm, ""),
    ultimoCapituloLidoId: "",
    ultimaLeituraEm: "",
    progressoLeitura: 0,
    slug,
    link: pegarTexto(row.link ?? row.href, `/obra/${slug}`),
  };
}

function normalizarCapituloSupabase(
  row: SupabaseCapituloRow,
  index: number
): CapituloLocal & { obraId: string } {
  return {
    id: pegarTexto(row.id, `capitulo-supabase-${index + 1}`),
    titulo: pegarTexto(row.titulo, `Capítulo ${index + 1}`),
    texto: pegarTexto(row.texto ?? row.conteudo, ""),
    curtiu: false,
    salvo: false,
    comentario: "",
    criadoEm: pegarTexto(row.created_at ?? row.criado_em ?? row.criadoEm, ""),
    lido: false,
    lidoEm: "",
    obraId: pegarTexto(row.obra_id ?? row.obraId, ""),
  };
}

function mesclarObrasPorIdSlug(obrasBase: ObraLocal[], obrasNovas: ObraLocal[]) {
  const obrasMescladas: ObraLocal[] = [];

  function obterIdentificadores(obra: ObraLocal) {
    return new Set(
      [
        obra.id,
        obra.slug,
        criarSlugBase(obra.titulo),
        normalizarTexto(obra.titulo),
      ]
        .map((valor) => valor.trim())
        .filter(Boolean)
    );
  }

  [...obrasBase, ...obrasNovas].forEach((obra) => {
    const identificadoresObra = obterIdentificadores(obra);
    const indiceExistente = obrasMescladas.findIndex((obraExistente) => {
      const identificadoresExistentes = obterIdentificadores(obraExistente);

      return Array.from(identificadoresObra).some((identificador) =>
        identificadoresExistentes.has(identificador)
      );
    });

    if (indiceExistente < 0) {
      obrasMescladas.push(obra);
      return;
    }

    const existente = obrasMescladas[indiceExistente];
    const capitulosPorId = new Map<string, CapituloLocal>();

    [...existente.capitulos, ...obra.capitulos].forEach((capitulo) => {
      const capituloExistente = capitulosPorId.get(capitulo.id);

      capitulosPorId.set(
        capitulo.id,
        capituloExistente
          ? {
              ...capituloExistente,
              ...capitulo,
              curtiu: capituloExistente.curtiu || capitulo.curtiu,
              salvo: capituloExistente.salvo || capitulo.salvo,
              comentario: capitulo.comentario || capituloExistente.comentario,
              lido: capituloExistente.lido || capitulo.lido,
              lidoEm: capitulo.lidoEm || capituloExistente.lidoEm,
            }
          : capitulo
      );
    });

    const capitulos = Array.from(capitulosPorId.values());

    obrasMescladas[indiceExistente] = {
      ...existente,
      ...obra,
      autorId: obra.autorId || existente.autorId || "",
      capitulos,
      capa: obra.capa || existente.capa,
      capaNome: obra.capaNome || existente.capaNome,
      link: obra.link || existente.link,
      ultimoCapituloLidoId:
        obra.ultimoCapituloLidoId || existente.ultimoCapituloLidoId,
      ultimaLeituraEm: obra.ultimaLeituraEm || existente.ultimaLeituraEm,
      progressoLeitura: calcularProgressoLeitura(capitulos),
    };
  });

  return obrasMescladas;
}

function notificacaoSinteticaDeCapitulo(notificacao: NotificacaoLocal) {
  return (
    notificacao.tipo === "novo-capitulo" &&
    notificacao.id.startsWith("capitulo-")
  );
}

function criarChaveMesclagemNotificacao(notificacao: NotificacaoLocal) {
  if (notificacao.tipo === "novo-capitulo" && notificacao.capituloId.trim()) {
    return `novo-capitulo:${notificacao.capituloId.trim()}`;
  }

  return notificacao.id.trim();
}

function mesclarNotificacoes(
  notificacoesLocais: NotificacaoLocal[],
  notificacoesSupabase: NotificacaoLocal[]
) {
  const mapa = new Map<string, NotificacaoLocal>();

  [...notificacoesLocais, ...notificacoesSupabase].forEach((notificacao) => {
    const notificacaoNormalizada =
      normalizarNotificacaoParaExibicao(notificacao);
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
    const preferida =
      existenteSintetica && !novaSintetica
        ? notificacaoNormalizada
        : !existenteSintetica && novaSintetica
          ? existente
          : notificacaoNormalizada;
    const secundaria = preferida === notificacaoNormalizada
      ? existente
      : notificacaoNormalizada;

    mapa.set(chave, {
      ...secundaria,
      ...preferida,
      obraId: preferida.obraId || secundaria.obraId,
      capituloId: preferida.capituloId || secundaria.capituloId,
      link: preferida.link || secundaria.link,
      autorId: preferida.autorId || secundaria.autorId,
      autorNome: preferida.autorNome || secundaria.autorNome,
      autorAvatar: preferida.autorAvatar || secundaria.autorAvatar,
      lida: existente.lida || notificacaoNormalizada.lida,
    });
  });

  return Array.from(mapa.values()).sort(
    (a, b) => dataNotificacao(b) - dataNotificacao(a)
  );
}

function lerIdsLocalStorage(chave: string, userId = ""): string[] {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return [];
  }

  try {
    const texto = lerStorageUsuarioNotificacoes(chave, userIdLimpo);
    const json = texto ? JSON.parse(texto) : [];

    return Array.isArray(json)
      ? json.filter((id): id is string => typeof id === "string" && Boolean(id.trim()))
      : [];
  } catch {
    return [];
  }
}

async function carregarObrasPublicadasSupabase() {
  try {
    const { data: obrasData, error: obrasError } = await supabase
      .from("obras")
      .select(
        "id,titulo,autor,user_id,genero,formato,classificacao_indicativa,sinopse,tags,capa_url,capa_nome,slug,link,publicado,criada_em"
      )
      .eq("publicado", true)
      .order("criada_em", { ascending: false })
      .limit(120);

    if (obrasError || !Array.isArray(obrasData)) {
      return [];
    }

    const obrasSupabase = obrasData.map((obra, index) =>
      normalizarObraSupabase(obra as unknown as SupabaseObraRow, index)
    );

    const idsObras = obrasSupabase.map((obra) => obra.id).filter(Boolean);

    if (idsObras.length === 0) {
      return obrasSupabase;
    }

    const { data: capitulosData, error: capitulosError } = await supabase
      .from("capitulos")
      .select("id,obra_id,titulo,ordem,publicado,criado_em")
      .in("obra_id", idsObras)
      .eq("publicado", true)
      .order("ordem", { ascending: true })
      .limit(1000);

    if (capitulosError || !Array.isArray(capitulosData)) {
      return obrasSupabase;
    }

    const capitulosPorObra = new Map<string, CapituloLocal[]>();

    capitulosData.forEach((capitulo, index) => {
      const capituloNormalizado = normalizarCapituloSupabase(
        capitulo as unknown as SupabaseCapituloRow,
        index
      );

      if (!capituloNormalizado.obraId) {
        return;
      }

      const capitulosAtuais =
        capitulosPorObra.get(capituloNormalizado.obraId) || [];
      const { obraId: _obraId, ...capituloSemObraId } = capituloNormalizado;
      void _obraId;

      capitulosPorObra.set(capituloNormalizado.obraId, [
        ...capitulosAtuais,
        capituloSemObraId,
      ]);
    });

    return obrasSupabase.map((obra) => {
      const capitulos = capitulosPorObra.get(obra.id) || [];

      return {
        ...obra,
        capitulos,
        progressoLeitura: calcularProgressoLeitura(capitulos),
      };
    });
  } catch {
    return [];
  }
}

async function carregarIdsTabelaUsuario(
  tabela: string,
  colunaId: string,
  userId: string
): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from(tabela)
      .select(colunaId)
      .eq("user_id", userId)
      .limit(1000);

    if (error || !Array.isArray(data)) {
      return [];
    }

    const ids: string[] = [];

    data.forEach((item: unknown) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return;
      }

      const registro = item as Record<string, unknown>;
      const id = pegarTexto(registro[colunaId]);

      if (id) {
        ids.push(id);
      }
    });

    return ids;
  } catch {
    return [];
  }
}

function normalizarNotificacaoSupabase(
  registro: Record<string, unknown>,
  index: number
): NotificacaoLocal | null {
  const metadata =
    registro.metadata &&
    typeof registro.metadata === "object" &&
    !Array.isArray(registro.metadata)
      ? (registro.metadata as Record<string, unknown>)
      : {};

  const id =
    pegarTexto(registro.notificacao_id) ||
    pegarTexto(metadata.notificacao_id) ||
    pegarTexto(registro.id) ||
    `notificacao-supabase-${index + 1}`;

  if (!id.trim()) {
    return null;
  }

  const criadaEm =
    pegarTexto(
      registro.criado_em ??
        registro.criada_em ??
        registro.created_at ??
        registro.atualizado_em ??
        registro.updated_at
    ) || new Date().toISOString();
  const tipo = normalizarTipoNotificacao(
    registro.tipo ?? metadata.tipo
  );
  const titulo = pegarTexto(
    registro.titulo ?? metadata.titulo,
    obterDetalheNotificacao({
      id,
      obraId: "",
      capituloId: "",
      link: "",
      titulo: "Nova notificação",
      mensagem: "Você recebeu uma nova notificação.",
      tipo,
      lida: false,
      criadaEm,
    })
  );
  const mensagem = pegarTexto(
    registro.mensagem ??
      registro.texto ??
      registro.descricao ??
      metadata.mensagem ??
      metadata.texto,
    "Você recebeu uma nova notificação."
  );

  return normalizarNotificacao(
    {
      id,
      obraId: pegarTexto(
        registro.obra_id ?? registro.obraId ?? metadata.obra_id
      ),
      capituloId: pegarTexto(
        registro.capitulo_id ??
          registro.capituloId ??
          metadata.capitulo_id
      ),
      link: pegarTexto(
        registro.link ??
          registro.href ??
          metadata.link ??
          metadata.href
      ),
      titulo,
      mensagem,
      tipo,
      lida: registro.lida === true || registro.lida === "true",
      criadaEm,
      autorId: pegarTexto(
        registro.autor_id ??
          registro.autorId ??
          registro.remetente_id ??
          registro.ator_id ??
          metadata.autor_id ??
          metadata.remetente_id ??
          metadata.ator_id
      ),
      autorNome: pegarTexto(
        registro.autor_nome ??
          registro.autorNome ??
          registro.remetente_nome ??
          metadata.autor_nome ??
          metadata.remetente_nome ??
          metadata.ator_nome
      ),
      autorAvatar: pegarTexto(
        registro.autor_avatar ??
          registro.autorAvatar ??
          registro.remetente_avatar ??
          metadata.autor_avatar ??
          metadata.remetente_avatar
      ),
    },
    index
  );
}

async function carregarNotificacoesDiretasSupabase(
  userId: string
): Promise<NotificacaoLocal[]> {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("notificacoes")
      .select("*")
      .eq("user_id", userIdLimpo)
      .limit(300);

    if (error || !Array.isArray(data)) {
      return [];
    }

    const notificacoesNormalizadas = data
      .map((item, index) => {
        if (!item || typeof item !== "object" || Array.isArray(item)) {
          return null;
        }

        return normalizarNotificacaoSupabase(
          item as Record<string, unknown>,
          index
        );
      })
      .filter(
        (notificacao): notificacao is NotificacaoLocal => Boolean(notificacao)
      );

    const perfis = await carregarPerfisNotificacoes(
      notificacoesNormalizadas
        .map((notificacao) => notificacao.autorId || "")
        .filter(Boolean)
    );

    return notificacoesNormalizadas
      .map((notificacao) => {
        const perfil = notificacao.autorId
          ? perfis.get(notificacao.autorId)
          : null;

        return {
          ...notificacao,
          autorNome:
            notificacao.autorNome || perfil?.nome || "",
          autorAvatar:
            notificacao.autorAvatar || perfil?.avatar || "",
        };
      })
      .sort((a, b) => dataNotificacao(b) - dataNotificacao(a));
  } catch {
    return [];
  }
}

function extrairSlugObraDeLinkNotificacao(link: string) {
  const match = /\/obra\/([^/?#]+)(?:\/|$)/i.exec(link.trim());
  const slugCodificado = match?.[1] || "";

  if (!slugCodificado) {
    return "";
  }

  try {
    return decodeURIComponent(slugCodificado);
  } catch {
    return slugCodificado;
  }
}

function formatarTituloSlugNotificacao(slug: string) {
  const texto = slug
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!texto) {
    return "Obra";
  }

  return texto
    .split(" ")
    .map((parte) => parte.slice(0, 1).toUpperCase() + parte.slice(1))
    .join(" ");
}

function extrairTituloObraDeMensagemNotificacao(notificacao: NotificacaoLocal) {
  const mensagem = notificacao.mensagem.trim();
  const match = /\bem\s+(.+?)\.?$/i.exec(mensagem);
  const titulo = match?.[1]?.trim() || "";

  if (!titulo || /^sua obra$/i.test(titulo)) {
    return "";
  }

  return titulo.replace(/[.!?]+$/g, "").trim();
}

function extrairTituloCapituloDeMensagemNotificacao(notificacao: NotificacaoLocal) {
  const mensagem = notificacao.mensagem.trim();
  const match = /^(.+?)\s+foi\s+adicionado/i.exec(mensagem);

  return match?.[1]?.trim() || "Capítulo";
}

function criarObraFallbackNotificacaoDireta(notificacao: NotificacaoLocal): ObraLocal | null {
  const obraId = notificacao.obraId.trim();

  if (!obraId) {
    return null;
  }

  const slugLink = extrairSlugObraDeLinkNotificacao(notificacao.link);
  const tituloMensagem = extrairTituloObraDeMensagemNotificacao(notificacao);
  const slug = slugLink || criarSlugBase(tituloMensagem || obraId);
  const titulo = tituloMensagem || formatarTituloSlugNotificacao(slug);
  const capitulos: CapituloLocal[] = notificacao.capituloId
    ? [
        {
          id: notificacao.capituloId,
          titulo: extrairTituloCapituloDeMensagemNotificacao(notificacao),
          texto: "",
          curtiu: false,
          salvo: false,
          comentario: "",
          criadoEm: notificacao.criadaEm,
          lido: false,
          lidoEm: "",
        },
      ]
    : [];

  return {
    id: obraId,
    titulo,
    autor: "Autor não informado",
    autorId: notificacao.autorId || "",
    genero: "Não informado",
    formato: "Não informado",
    classificacaoIndicativa: "Não informada",
    sinopse: "Nenhuma sinopse informada.",
    tags: ["sem tags"],
    capa: "",
    capaNome: "",
    publicado: true,
    capitulos,
    criadaEm: notificacao.criadaEm,
    ultimoCapituloLidoId: "",
    ultimaLeituraEm: "",
    progressoLeitura: calcularProgressoLeitura(capitulos),
    slug,
    link: slug ? `/obra/${slug}` : notificacao.link,
  };
}

async function carregarObrasDasNotificacoesDiretasSupabase(
  notificacoesDiretas: NotificacaoLocal[]
): Promise<ObraLocal[]> {
  const obraIds = Array.from(
    new Set(
      notificacoesDiretas
        .map((notificacao) => notificacao.obraId.trim())
        .filter(Boolean)
    )
  );
  const capituloIds = Array.from(
    new Set(
      notificacoesDiretas
        .map((notificacao) => notificacao.capituloId.trim())
        .filter(Boolean)
    )
  );

  if (obraIds.length === 0 && capituloIds.length === 0) {
    return [];
  }

  const obrasPorId = new Map<string, ObraLocal>();
  const capitulosPorObra = new Map<string, CapituloLocal[]>();

  if (obraIds.length > 0) {
    const selecoesObras = [
      "id,titulo,autor,user_id,genero,formato,classificacao_indicativa,sinopse,tags,capa_url,capa_nome,slug,publicado,criada_em",
      "id,titulo,autor,user_id,slug,publicado,criada_em",
      "id,titulo,slug,publicado,user_id",
      "id,titulo,slug,publicado",
      "id,titulo,slug",
    ];

    for (const campos of selecoesObras) {
      try {
        const { data: obrasData, error: obrasError } = await supabase
          .from("obras")
          .select(campos)
          .in("id", obraIds)
          .limit(obraIds.length);

        if (obrasError || !Array.isArray(obrasData)) {
          continue;
        }

        obrasData.forEach((obra, index) => {
          const obraNormalizada = normalizarObraSupabase(
            obra as unknown as SupabaseObraRow,
            index
          );

          if (obraNormalizada.id) {
            obrasPorId.set(obraNormalizada.id, obraNormalizada);
          }
        });

        break;
      } catch {
        // Tenta uma seleção menor abaixo.
      }
    }
  }

  if (capituloIds.length > 0) {
    const selecoesCapitulos = [
      "id,obra_id,titulo,ordem,numero,publicado,criado_em",
      "id,obra_id,titulo,numero,publicado,criado_em",
      "id,obra_id,titulo,ordem,publicado,criado_em",
      "id,obra_id,titulo,publicado,criado_em",
      "id,obra_id,titulo",
    ];

    for (const campos of selecoesCapitulos) {
      try {
        const { data: capitulosData, error: capitulosError } = await supabase
          .from("capitulos")
          .select(campos)
          .in("id", capituloIds)
          .limit(capituloIds.length);

        if (capitulosError || !Array.isArray(capitulosData)) {
          continue;
        }

        capitulosData.forEach((capitulo, index) => {
          const capituloNormalizado = normalizarCapituloSupabase(
            capitulo as unknown as SupabaseCapituloRow,
            index
          );

          if (!capituloNormalizado.obraId) {
            return;
          }

          const capitulosAtuais = capitulosPorObra.get(capituloNormalizado.obraId) || [];
          const { obraId: _obraId, ...capituloSemObraId } = capituloNormalizado;
          void _obraId;

          if (
            !capitulosAtuais.some(
              (capituloAtual) => capituloAtual.id === capituloSemObraId.id
            )
          ) {
            capitulosPorObra.set(capituloNormalizado.obraId, [
              ...capitulosAtuais,
              capituloSemObraId,
            ]);
          }
        });

        break;
      } catch {
        // Tenta uma seleção menor abaixo.
      }
    }
  }

  notificacoesDiretas.forEach((notificacao) => {
    if (!notificacao.obraId || obrasPorId.has(notificacao.obraId)) {
      return;
    }

    const obraFallback = criarObraFallbackNotificacaoDireta(notificacao);

    if (obraFallback) {
      obrasPorId.set(obraFallback.id, obraFallback);
    }
  });

  return Array.from(obrasPorId.values()).map((obra) => {
    const capitulosDiretos = capitulosPorObra.get(obra.id) || [];
    const capitulos = [...obra.capitulos];

    capitulosDiretos.forEach((capituloDireto) => {
      if (!capitulos.some((capitulo) => capitulo.id === capituloDireto.id)) {
        capitulos.push(capituloDireto);
      }
    });

    notificacoesDiretas
      .filter((notificacao) => notificacao.obraId === obra.id && notificacao.capituloId)
      .forEach((notificacao) => {
        if (capitulos.some((capitulo) => capitulo.id === notificacao.capituloId)) {
          return;
        }

        capitulos.push({
          id: notificacao.capituloId,
          titulo: extrairTituloCapituloDeMensagemNotificacao(notificacao),
          texto: "",
          curtiu: false,
          salvo: false,
          comentario: "",
          criadoEm: notificacao.criadaEm,
          lido: false,
          lidoEm: "",
        });
      });

    return {
      ...obra,
      capitulos,
      progressoLeitura: calcularProgressoLeitura(capitulos),
    };
  });
}

async function carregarNotificacoesLidasSupabase(userId: string): Promise<string[]> {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("notificacoes")
      .select("*")
      .eq("user_id", userIdLimpo)
      .eq("lida", true)
      .limit(2000);

    if (error || !Array.isArray(data)) {
      return [];
    }

    const ids = new Set<string>();

    data.forEach((item: unknown) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return;
      }

      const registro = item as Record<string, unknown>;
      const metadata =
        registro.metadata &&
        typeof registro.metadata === "object" &&
        !Array.isArray(registro.metadata)
          ? (registro.metadata as Record<string, unknown>)
          : {};
      const id =
        pegarTexto(registro.notificacao_id) ||
        pegarTexto(metadata.notificacao_id) ||
        pegarTexto(registro.id);

      if (id) {
        ids.add(id);
      }
    });

    return Array.from(ids);
  } catch {
    return [];
  }
}

async function carregarEstadoSupabaseNotificacoes(): Promise<EstadoSupabaseNotificacoes | null> {
  try {
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id || "";

    if (!userId) {
      return null;
    }

    const [
      obrasSeguidasIds,
      notificacoesLidasIds,
      notificacoesDiretas,
    ] = await Promise.all([
      carregarIdsTabelaUsuario("seguindo_obras", "obra_id", userId),
      carregarNotificacoesLidasSupabase(userId),
      carregarNotificacoesDiretasSupabase(userId),
    ]);

    return {
      userId,
      obrasSeguidasIds,
      notificacoesLidasIds,
      notificacoesDiretas,
    };
  } catch {
    return null;
  }
}

function criarChavesObraParaNotificacao(obra: ObraLocal) {
  return Array.from(
    new Set(
      [
        obra.id,
        obra.slug,
        criarSlugBase(obra.titulo),
        normalizarTexto(obra.titulo),
      ].filter((chave) => Boolean(chave.trim()))
    )
  );
}

function obraEstaNaListaSeguida(obra: ObraLocal, idsSeguidos: Set<string>) {
  if (idsSeguidos.size === 0) {
    return false;
  }

  return criarChavesObraParaNotificacao(obra).some((chave) =>
    idsSeguidos.has(chave)
  );
}

function notificacaoCapituloPertenceAObraSeguida(
  notificacao: NotificacaoLocal,
  obrasPorId: Map<string, ObraLocal>,
  idsSeguidos: Set<string>,
  usuarioAtualId: string
) {
  if (!notificacaoEhCapitulo(notificacao)) {
    return true;
  }

  if (idsSeguidos.size === 0) {
    return false;
  }

  const obra = obrasPorId.get(notificacao.obraId) || null;

  if (!obra) {
    return idsSeguidos.has(notificacao.obraId);
  }

  if (usuarioAtualId && obra.autorId && obra.autorId === usuarioAtualId) {
    return false;
  }

  return obraEstaNaListaSeguida(obra, idsSeguidos);
}

function criarNotificacoesDeCapitulos(
  obrasParaCriar: ObraLocal[],
  obrasSeguidasIds: string[],
  notificacoesLidasIds: string[],
  usuarioAtualId: string
) {
  const idsSeguidos = new Set(
    obrasSeguidasIds
      .filter((id) => Boolean(id.trim()))
      .map((id) => id.trim())
  );
  const idsLidos = new Set(notificacoesLidasIds);
  const notificacoesCriadas: NotificacaoLocal[] = [];

  obrasParaCriar.forEach((obra) => {
    if (!obraEstaNaListaSeguida(obra, idsSeguidos)) {
      return;
    }

    if (usuarioAtualId && obra.autorId && obra.autorId === usuarioAtualId) {
      return;
    }

    const indiceCapitulo = obra.capitulos.length - 1;
    const capitulo = indiceCapitulo >= 0 ? obra.capitulos[indiceCapitulo] : null;

    if (!capitulo) {
      return;
    }

    const id = `capitulo-${obra.id}-${capitulo.id}`;
    const idCanonico = `novo-capitulo:${capitulo.id}`;

    notificacoesCriadas.push({
      id,
      obraId: obra.id,
      capituloId: capitulo.id,
      link: criarHrefLeituraCapitulo(obra, capitulo.id, indiceCapitulo + 1),
      titulo: "Novo capítulo publicado",
      mensagem: `${capitulo.titulo} chegou em ${obra.titulo}.`,
      tipo: "novo-capitulo",
      lida: idsLidos.has(id) || idsLidos.has(idCanonico),
      criadaEm: capitulo.criadoEm || obra.criadaEm || new Date().toISOString(),
      autorId: obra.autorId || "",
      autorNome: obra.autor,
      autorAvatar: "",
    });
  });

  return notificacoesCriadas.sort(
    (a, b) => dataNotificacao(b) - dataNotificacao(a)
  );
}

async function carregarNotificacoesComunidadeSupabase(
  userId: string,
  notificacoesLidasIds: string[]
): Promise<NotificacaoLocal[]> {
  const idsLidos = new Set(notificacoesLidasIds);
  const notificacoesSociais: NotificacaoLocal[] = [];
  const userIdsParaProfiles = new Set<string>();
  const postsPorId = new Map<string, { texto: string; autorNome: string }>();
  const comentariosComunidade: Record<string, unknown>[] = [];
  const denunciasComunidade: Record<string, unknown>[] = [];
  const seguidoresPerfil: Record<string, unknown>[] = [];
  const comentariosCapitulos: Record<string, unknown>[] = [];
  const reviewsComunidade: Record<string, unknown>[] = [];
  const obrasAutor = new Map<
    string,
    Pick<ObraLocal, "id" | "titulo" | "slug" | "publicado">
  >();
  const capitulosAutor = new Map<
    string,
    {
      id: string;
      titulo: string;
      obraId: string;
      obraTitulo: string;
      obraSlug: string;
      obraPublicada: boolean;
      numero: number;
    }
  >();

  try {
    const { data: postsData } = await supabase
      .from("comunidade_posts")
      .select("id, texto, autor_id, autor_nome, criado_em")
      .eq("autor_id", userId)
      .limit(120);

    const posts = Array.isArray(postsData) ? postsData : [];
    const postIds = posts
      .map((post) => pegarTexto((post as Record<string, unknown>).id))
      .filter(Boolean);

    posts.forEach((post) => {
      const registro = post as Record<string, unknown>;
      const postId = pegarTexto(registro.id);

      if (!postId) {
        return;
      }

      postsPorId.set(postId, {
        texto: pegarTexto(registro.texto, "sua publicação"),
        autorNome: pegarTexto(registro.autor_nome, "Você"),
      });
    });

    if (postIds.length > 0) {
      const { data: comentariosData } = await supabase
        .from("comunidade_comentarios")
        .select("id, post_id, autor_id, autor_nome, texto, criado_em")
        .in("post_id", postIds)
        .neq("autor_id", userId)
        .order("criado_em", { ascending: false })
        .limit(160);

      if (Array.isArray(comentariosData)) {
        comentariosData.forEach((comentario) => {
          const registro = comentario as Record<string, unknown>;
          const autorId = pegarTexto(registro.autor_id);

          comentariosComunidade.push(registro);

          if (autorId) {
            userIdsParaProfiles.add(autorId);
          }
        });
      }
    }
  } catch {
    // A página continua com notificações locais e de capítulos se a Comunidade falhar.
  }

  try {
    const { data: denunciasData } = await supabase
      .from("comunidade_denuncias")
      .select(
        "id, alvo_tipo, alvo_id, status, observacao_admin, analisado_em, criado_em"
      )
      .eq("denunciante_id", userId)
      .in("status", ["em_analise", "resolvida", "rejeitada"])
      .order("criado_em", { ascending: false })
      .limit(80);

    if (Array.isArray(denunciasData)) {
      denunciasData.forEach((denuncia) => {
        denunciasComunidade.push(denuncia as Record<string, unknown>);
      });
    }
  } catch {
    // Denúncias continuam opcionais para não bloquear as notificações.
  }

  try {
    const { data: seguidoresData } = await supabase
      .from("seguindo_usuarios")
      .select("id, seguidor_id, seguido_id, criado_em")
      .eq("seguido_id", userId)
      .order("criado_em", { ascending: false })
      .limit(60);

    if (Array.isArray(seguidoresData)) {
      seguidoresData.forEach((seguidor) => {
        const registro = seguidor as Record<string, unknown>;
        const seguidorId = pegarTexto(registro.seguidor_id);

        seguidoresPerfil.push(registro);

        if (seguidorId) {
          userIdsParaProfiles.add(seguidorId);
        }
      });
    }
  } catch {
    // Seguir usuário é social; se falhar, as outras notificações continuam.
  }

  try {
    const { data: obrasAutorData } = await supabase
      .from("obras")
      .select("id, titulo, slug, publicado, user_id")
      .eq("user_id", userId)
      .limit(80);

    const obrasAutorRows = Array.isArray(obrasAutorData)
      ? (obrasAutorData as Record<string, unknown>[])
      : [];

    obrasAutorRows.forEach((obra, index) => {
      const obraId = pegarTexto(obra.id, `obra-autor-${index + 1}`);
      const titulo = pegarTexto(obra.titulo, "Obra sem título");
      const slug = pegarTexto(obra.slug, criarSlugBase(titulo));

      if (!obraId) {
        return;
      }

      obrasAutor.set(obraId, {
        id: obraId,
        titulo,
        slug,
        publicado: pegarBooleano(obra.publicado, true),
      });
    });

    const obraIds = Array.from(obrasAutor.keys());

    if (obraIds.length > 0) {
      const { data: capitulosData } = await supabase
        .from("capitulos")
        .select("id, obra_id, titulo, ordem, publicado, criado_em")
        .in("obra_id", obraIds)
        .eq("publicado", true)
        .order("ordem", { ascending: true })
        .limit(600);

      if (Array.isArray(capitulosData)) {
        capitulosData.forEach((capitulo, index) => {
          const registro = capitulo as Record<string, unknown>;
          const capituloId = pegarTexto(registro.id);
          const obraId = pegarTexto(registro.obra_id);
          const obra = obrasAutor.get(obraId);

          if (!capituloId || !obra) {
            return;
          }

          capitulosAutor.set(capituloId, {
            id: capituloId,
            titulo: pegarTexto(registro.titulo, `Capítulo ${index + 1}`),
            obraId,
            obraTitulo: obra.titulo,
            obraSlug: obra.slug,
            obraPublicada: obra.publicado,
            numero: obterNumeroSeguro(registro.ordem, index + 1),
          });
        });
      }

      const capituloIds = Array.from(capitulosAutor.keys());

      if (capituloIds.length > 0) {
        const { data: comentariosCapitulosData } = await supabase
          .from("comentarios_capitulos")
          .select("id,capitulo_id,user_id,comentario,texto,criado_em,atualizado_em")
          .in("capitulo_id", capituloIds)
          .neq("user_id", userId)
          .order("atualizado_em", { ascending: false })
          .limit(200);

        if (Array.isArray(comentariosCapitulosData)) {
          comentariosCapitulosData.forEach((comentario) => {
            const registro = comentario as Record<string, unknown>;
            const autorId = pegarTexto(registro.user_id);

            comentariosCapitulos.push(registro);

            if (autorId) {
              userIdsParaProfiles.add(autorId);
            }
          });
        }
      }

      const { data: reviewsData } = await supabase
        .from("comunidade_posts")
        .select("id, autor_id, autor_nome, texto, obra_relacionada, tipo_publicacao, criado_em")
        .eq("tipo_publicacao", "Review")
        .neq("autor_id", userId)
        .order("criado_em", { ascending: false })
        .limit(80);

      if (Array.isArray(reviewsData)) {
        reviewsData.forEach((review) => {
          const registro = review as Record<string, unknown>;
          const obraRelacionada = normalizarTexto(
            pegarTexto(registro.obra_relacionada)
          );
          const pertenceAoAutor = Array.from(obrasAutor.values()).some((obra) => {
            const tituloNormalizado = normalizarTexto(obra.titulo);

            return (
              obraRelacionada &&
              tituloNormalizado &&
              (obraRelacionada === tituloNormalizado ||
                obraRelacionada.includes(tituloNormalizado) ||
                tituloNormalizado.includes(obraRelacionada))
            );
          });

          if (!pertenceAoAutor) {
            return;
          }

          const autorId = pegarTexto(registro.autor_id);
          reviewsComunidade.push(registro);

          if (autorId) {
            userIdsParaProfiles.add(autorId);
          }
        });
      }
    }
  } catch {
    // Comentários de capítulo/reviews são extras; não bloqueiam a página.
  }

  const perfis = await carregarPerfisNotificacoes(Array.from(userIdsParaProfiles));

  comentariosComunidade.forEach((registro) => {
    const comentarioId = pegarTexto(registro.id);
    const postId = pegarTexto(registro.post_id);

    if (!comentarioId || !postId) {
      return;
    }

    const autorId = pegarTexto(registro.autor_id);
    const perfilAutor = obterPerfilNotificacao(
      perfis,
      autorId,
      pegarTexto(registro.autor_nome, "Alguém")
    );
    const id = `comunidade-comentario-${comentarioId}`;
    const textoComentario = pegarTexto(registro.texto);
    const post = postsPorId.get(postId);
    const trechoPost = post?.texto
      ? post.texto.slice(0, 90)
      : "uma publicação sua";

    notificacoesSociais.push({
      id,
      obraId: "",
      capituloId: "",
      link: `/comunidade?post=${encodeURIComponent(postId)}`,
      titulo: "Novo comentário na Comunidade",
      mensagem: `${perfilAutor.nome} comentou em "${trechoPost}${
        trechoPost.length >= 90 ? "..." : ""
      }"${textoComentario ? `: ${textoComentario.slice(0, 90)}` : "."}`,
      tipo: "comentario-comunidade",
      lida: idsLidos.has(id),
      criadaEm: pegarTexto(registro.criado_em, new Date().toISOString()),
      autorId,
      autorNome: perfilAutor.nome,
      autorAvatar: perfilAutor.avatar,
    });
  });

  seguidoresPerfil.forEach((registro) => {
    const seguidorId = pegarTexto(registro.seguidor_id);

    if (!seguidorId) {
      return;
    }

    const perfilSeguidor = obterPerfilNotificacao(perfis, seguidorId, "Usuário");
    const id = `novo-seguidor-${pegarTexto(registro.id, seguidorId)}`;

    notificacoesSociais.push({
      id,
      obraId: "",
      capituloId: "",
      link: criarPerfilHrefNotificacao(seguidorId, perfilSeguidor.nome),
      titulo: "Novo seguidor",
      mensagem: `${perfilSeguidor.nome} começou a seguir seu perfil.`,
      tipo: "novo-seguidor",
      lida: idsLidos.has(id),
      criadaEm: pegarTexto(registro.criado_em, new Date().toISOString()),
      autorId: seguidorId,
      autorNome: perfilSeguidor.nome,
      autorAvatar: perfilSeguidor.avatar,
    });
  });

  comentariosCapitulos.forEach((registro) => {
    const capituloId = pegarTexto(registro.capitulo_id);
    const capitulo = capitulosAutor.get(capituloId);

    if (!capitulo) {
      return;
    }

    const autorId = pegarTexto(registro.user_id);
    const perfilAutor = obterPerfilNotificacao(perfis, autorId, "Leitor");
    const comentarioId =
      pegarTexto(registro.id) ||
      `${capituloId}-${autorId}-${pegarTexto(registro.atualizado_em ?? registro.criado_em)}`;
    const id = `capitulo-comentario-${comentarioId}`;
    const textoComentario = pegarTexto(registro.comentario ?? registro.texto);

    notificacoesSociais.push({
      id,
      obraId: capitulo.obraId,
      capituloId,
      link: criarHrefLeituraCapitulo(
        {
          id: capitulo.obraId,
          slug: capitulo.obraSlug,
          titulo: capitulo.obraTitulo,
          publicado: capitulo.obraPublicada,
        },
        capituloId,
        capitulo.numero
      ),
      titulo: "Novo comentário no capítulo",
      mensagem: `${perfilAutor.nome} comentou em ${capitulo.titulo}${
        textoComentario ? `: ${textoComentario.slice(0, 90)}` : "."
      }`,
      tipo: "comentario-capitulo",
      lida: idsLidos.has(id),
      criadaEm: pegarTexto(
        registro.criado_em ?? registro.atualizado_em,
        new Date().toISOString()
      ),
      autorId,
      autorNome: perfilAutor.nome,
      autorAvatar: perfilAutor.avatar,
    });
  });

  reviewsComunidade.forEach((registro) => {
    const postId = pegarTexto(registro.id);

    if (!postId) {
      return;
    }

    const autorId = pegarTexto(registro.autor_id);
    const perfilAutor = obterPerfilNotificacao(
      perfis,
      autorId,
      pegarTexto(registro.autor_nome, "Leitor")
    );
    const obraRelacionada = pegarTexto(registro.obra_relacionada, "sua obra");
    const textoReview = pegarTexto(registro.texto);
    const id = `comunidade-review-${postId}`;

    notificacoesSociais.push({
      id,
      obraId: "",
      capituloId: "",
      link: `/comunidade?post=${encodeURIComponent(postId)}`,
      titulo: "Nova review publicada",
      mensagem: `${perfilAutor.nome} publicou uma review sobre ${obraRelacionada}${
        textoReview ? `: ${textoReview.slice(0, 90)}` : "."
      }`,
      tipo: "review-comunidade",
      lida: idsLidos.has(id),
      criadaEm: pegarTexto(registro.criado_em, new Date().toISOString()),
      autorId,
      autorNome: perfilAutor.nome,
      autorAvatar: perfilAutor.avatar,
    });
  });

  denunciasComunidade.forEach((registro) => {
    const denunciaId = pegarTexto(registro.id);
    const status = pegarTexto(registro.status, "em_analise");

    if (!denunciaId) {
      return;
    }

    const id = `comunidade-denuncia-${denunciaId}-${status}`;
    const statusTexto =
      status === "resolvida"
        ? "resolvida"
        : status === "rejeitada"
          ? "rejeitada"
          : "em análise";
    const alvoTipo = pegarTexto(registro.alvo_tipo, "conteúdo");
    const alvoId = pegarTexto(registro.alvo_id);
    const observacaoAdmin = pegarTexto(registro.observacao_admin);
    const link =
      alvoTipo === "post" && alvoId
        ? `/comunidade?post=${encodeURIComponent(alvoId)}`
        : "/comunidade";

    notificacoesSociais.push({
      id,
      obraId: "",
      capituloId: "",
      link,
      titulo: `Denúncia ${statusTexto}`,
      mensagem: observacaoAdmin
        ? `A moderação atualizou sua denúncia: ${observacaoAdmin}`
        : `A moderação marcou sua denúncia como ${statusTexto}.`,
      tipo: "denuncia-comunidade",
      lida: idsLidos.has(id),
      criadaEm: pegarTexto(
        registro.analisado_em ?? registro.criado_em,
        new Date().toISOString()
      ),
      autorId: "",
      autorNome: "Moderação",
      autorAvatar: "",
    });
  });

  return notificacoesSociais.sort(
    (a, b) => dataNotificacao(b) - dataNotificacao(a)
  );
}


function obterRotuloTipoAnotacaoDiarioNotificacao(tipo: string) {
  if (tipo === "lendo") {
    return "leitura";
  }

  if (tipo === "quero_ler") {
    return "Quero ler";
  }

  if (tipo === "favorita") {
    return "favorita";
  }

  if (tipo === "concluida") {
    return "obra concluída";
  }

  if (tipo === "avaliacao") {
    return "avaliação";
  }

  if (tipo === "review") {
    return "review";
  }

  return "anotação";
}

function obterMetadataNotificacaoDiario(registro: Record<string, unknown>) {
  const metadata = registro.metadata;

  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {} as Record<string, unknown>;
  }

  return metadata as Record<string, unknown>;
}

async function carregarNotificacoesDiarioSupabase(
  userId: string,
  notificacoesLidasIds: string[]
): Promise<NotificacaoLocal[]> {
  if (!userId) {
    return [];
  }

  const idsLidos = new Set(notificacoesLidasIds);
  const notificacoesDiario: NotificacaoLocal[] = [];
  const anotacoesDoUsuario: Record<string, unknown>[] = [];
  const curtidasAnotacoes: Record<string, unknown>[] = [];
  const comentariosAnotacoes: Record<string, unknown>[] = [];
  const atividadesSeguidos: Record<string, unknown>[] = [];
  const usuariosParaPerfil = new Set<string>();
  const obrasIds = new Set<string>();

  try {
    const { data: anotacoesData } = await supabase
      .from("diario_anotacoes")
      .select("id, user_id, obra_id, tipo, texto, visibilidade, criado_em, atualizado_em")
      .eq("user_id", userId)
      .order("atualizado_em", { ascending: false })
      .limit(120);

    if (Array.isArray(anotacoesData)) {
      anotacoesData.forEach((item) => {
        if (!item || typeof item !== "object" || Array.isArray(item)) {
          return;
        }

        const registro = item as Record<string, unknown>;
        const anotacaoId = pegarTexto(registro.id);
        const obraId = pegarTexto(registro.obra_id);

        if (!anotacaoId) {
          return;
        }

        anotacoesDoUsuario.push(registro);

        if (obraId) {
          obrasIds.add(obraId);
        }
      });
    }
  } catch {
    // O Diário continua sem notificações de interação se a consulta falhar.
  }

  const anotacoesPorId = new Map(
    anotacoesDoUsuario
      .map((anotacao) => [pegarTexto(anotacao.id), anotacao] as const)
      .filter(([anotacaoId]) => Boolean(anotacaoId))
  );
  const anotacaoIds = Array.from(anotacoesPorId.keys());

  if (anotacaoIds.length > 0) {
    try {
      const [curtidasResposta, comentariosResposta] = await Promise.all([
        supabase
          .from("diario_anotacao_curtidas")
          .select("id, anotacao_id, user_id, criado_em")
          .in("anotacao_id", anotacaoIds)
          .neq("user_id", userId)
          .order("criado_em", { ascending: false })
          .limit(160),
        supabase
          .from("diario_anotacao_comentarios")
          .select("id, anotacao_id, user_id, texto, criado_em, atualizado_em")
          .in("anotacao_id", anotacaoIds)
          .neq("user_id", userId)
          .order("criado_em", { ascending: false })
          .limit(160),
      ]);

      if (Array.isArray(curtidasResposta.data)) {
        curtidasResposta.data.forEach((item) => {
          if (!item || typeof item !== "object" || Array.isArray(item)) {
            return;
          }

          const registro = item as Record<string, unknown>;
          const autorId = pegarTexto(registro.user_id);

          curtidasAnotacoes.push(registro);

          if (autorId) {
            usuariosParaPerfil.add(autorId);
          }
        });
      }

      if (Array.isArray(comentariosResposta.data)) {
        comentariosResposta.data.forEach((item) => {
          if (!item || typeof item !== "object" || Array.isArray(item)) {
            return;
          }

          const registro = item as Record<string, unknown>;
          const autorId = pegarTexto(registro.user_id);

          comentariosAnotacoes.push(registro);

          if (autorId) {
            usuariosParaPerfil.add(autorId);
          }
        });
      }
    } catch {
      // Interações do Diário são complementares às demais notificações.
    }
  }

  try {
    const { data: seguindoData } = await supabase
      .from("seguindo_usuarios")
      .select("seguido_id")
      .eq("seguidor_id", userId)
      .limit(120);

    const usuariosSeguidos = Array.isArray(seguindoData)
      ? seguindoData
          .map((item) =>
            item && typeof item === "object" && !Array.isArray(item)
              ? pegarTexto((item as Record<string, unknown>).seguido_id)
              : ""
          )
          .filter(Boolean)
      : [];

    usuariosSeguidos.forEach((seguidoId) => usuariosParaPerfil.add(seguidoId));

    if (usuariosSeguidos.length > 0) {
      const { data: atividadesData } = await supabase
        .from("diario_atividades")
        .select(
          "id, user_id, tipo, obra_id, capitulo_id, texto, nota, visibilidade, metadata, criado_em, atualizado_em"
        )
        .in("user_id", usuariosSeguidos)
        .eq("visibilidade", "publico")
        .in("tipo", ["concluiu_obra", "avaliou_obra"])
        .order("criado_em", { ascending: false })
        .limit(100);

      if (Array.isArray(atividadesData)) {
        atividadesData.forEach((item) => {
          if (!item || typeof item !== "object" || Array.isArray(item)) {
            return;
          }

          const registro = item as Record<string, unknown>;
          const autorId = pegarTexto(registro.user_id);
          const obraId = pegarTexto(registro.obra_id);

          atividadesSeguidos.push(registro);

          if (autorId) {
            usuariosParaPerfil.add(autorId);
          }

          if (obraId) {
            obrasIds.add(obraId);
          }
        });
      }
    }
  } catch {
    // Atividades públicas de perfis seguidos não bloqueiam as demais notificações.
  }

  const obrasPorId = new Map<
    string,
    { id: string; titulo: string; slug: string; publicado: boolean }
  >();

  if (obrasIds.size > 0) {
    try {
      const { data: obrasData } = await supabase
        .from("obras")
        .select("id, titulo, slug, publicado")
        .in("id", Array.from(obrasIds))
        .limit(200);

      if (Array.isArray(obrasData)) {
        obrasData.forEach((item, index) => {
          if (!item || typeof item !== "object" || Array.isArray(item)) {
            return;
          }

          const registro = item as Record<string, unknown>;
          const obraId = pegarTexto(registro.id);

          if (!obraId) {
            return;
          }

          const titulo = pegarTexto(registro.titulo, `Obra ${index + 1}`);

          obrasPorId.set(obraId, {
            id: obraId,
            titulo,
            slug: pegarTexto(registro.slug, criarSlugBase(titulo)),
            publicado: pegarBooleano(registro.publicado, true),
          });
        });
      }
    } catch {
      // O texto da anotação continua permitindo identificar a notificação.
    }
  }

  const perfis = await carregarPerfisNotificacoes(
    Array.from(usuariosParaPerfil)
  );
  const linkDiarioProprio = criarDiarioPerfilHrefNotificacao(userId);

  curtidasAnotacoes.forEach((registro) => {
    const curtidaId = pegarTexto(registro.id);
    const anotacaoId = pegarTexto(registro.anotacao_id);
    const anotacao = anotacoesPorId.get(anotacaoId);

    if (!curtidaId || !anotacao) {
      return;
    }

    const autorId = pegarTexto(registro.user_id);
    const perfilAutor = obterPerfilNotificacao(perfis, autorId, "Leitor");
    const obraId = pegarTexto(anotacao.obra_id);
    const obra = obrasPorId.get(obraId);
    const tipoAnotacao = obterRotuloTipoAnotacaoDiarioNotificacao(
      pegarTexto(anotacao.tipo)
    );
    const id = `diario-curtida-${curtidaId}`;

    notificacoesDiario.push({
      id,
      obraId,
      capituloId: "",
      link: linkDiarioProprio,
      titulo: "Nova curtida no Diário",
      mensagem: `${perfilAutor.nome} curtiu sua ${tipoAnotacao}${
        obra?.titulo ? ` sobre ${obra.titulo}` : ""
      }.`,
      tipo: "curtida-diario",
      lida: idsLidos.has(id),
      criadaEm: pegarTexto(registro.criado_em, new Date().toISOString()),
      autorId,
      autorNome: perfilAutor.nome,
      autorAvatar: perfilAutor.avatar,
    });
  });

  comentariosAnotacoes.forEach((registro) => {
    const comentarioId = pegarTexto(registro.id);
    const anotacaoId = pegarTexto(registro.anotacao_id);
    const anotacao = anotacoesPorId.get(anotacaoId);

    if (!comentarioId || !anotacao) {
      return;
    }

    const autorId = pegarTexto(registro.user_id);
    const perfilAutor = obterPerfilNotificacao(perfis, autorId, "Leitor");
    const obraId = pegarTexto(anotacao.obra_id);
    const obra = obrasPorId.get(obraId);
    const comentario = pegarTexto(registro.texto);
    const tipoAnotacao = obterRotuloTipoAnotacaoDiarioNotificacao(
      pegarTexto(anotacao.tipo)
    );
    const id = `diario-comentario-${comentarioId}`;

    notificacoesDiario.push({
      id,
      obraId,
      capituloId: "",
      link: linkDiarioProprio,
      titulo: "Novo comentário no Diário",
      mensagem: `${perfilAutor.nome} comentou na sua ${tipoAnotacao}${
        obra?.titulo ? ` sobre ${obra.titulo}` : ""
      }${comentario ? `: ${comentario.slice(0, 120)}` : "."}`,
      tipo: "comentario-diario",
      lida: idsLidos.has(id),
      criadaEm: pegarTexto(
        registro.criado_em ?? registro.atualizado_em,
        new Date().toISOString()
      ),
      autorId,
      autorNome: perfilAutor.nome,
      autorAvatar: perfilAutor.avatar,
    });
  });

  atividadesSeguidos.forEach((registro) => {
    const atividadeId = pegarTexto(registro.id);

    if (!atividadeId) {
      return;
    }

    const autorId = pegarTexto(registro.user_id);
    const perfilAutor = obterPerfilNotificacao(perfis, autorId, "Usuário");
    const tipoAtividade = pegarTexto(registro.tipo);
    const obraId = pegarTexto(registro.obra_id);
    const obra = obrasPorId.get(obraId);
    const metadata = obterMetadataNotificacaoDiario(registro);
    const tituloObra =
      obra?.titulo ||
      pegarTexto(metadata.obra_titulo ?? metadata.titulo, "uma obra");
    const nota = obterNumeroSeguro(registro.nota, 0);
    const id = `diario-atividade-${atividadeId}`;
    const mensagem =
      tipoAtividade === "avaliou_obra"
        ? `${perfilAutor.nome} avaliou ${tituloObra}${
            nota > 0 ? ` com ${nota.toFixed(1).replace(".", ",")} estrelas` : ""
          }.`
        : `${perfilAutor.nome} concluiu ${tituloObra}.`;

    notificacoesDiario.push({
      id,
      obraId,
      capituloId: "",
      link: criarDiarioPerfilHrefNotificacao(autorId, perfilAutor.nome),
      titulo:
        tipoAtividade === "avaliou_obra"
          ? "Nova avaliação no Diário"
          : "Obra concluída no Diário",
      mensagem,
      tipo: "atividade-diario",
      lida: idsLidos.has(id),
      criadaEm: pegarTexto(
        registro.criado_em ?? registro.atualizado_em,
        new Date().toISOString()
      ),
      autorId,
      autorNome: perfilAutor.nome,
      autorAvatar: perfilAutor.avatar,
    });
  });

  return notificacoesDiario.sort(
    (a, b) => dataNotificacao(b) - dataNotificacao(a)
  );
}

async function obterUserIdAtualNotificacoes(fallbackUserId = "") {
  const fallbackLimpo = fallbackUserId.trim();

  if (fallbackLimpo && fallbackLimpo !== "anon") {
    return fallbackLimpo;
  }

  try {
    const { data } = await supabase.auth.getUser();

    return data.user?.id || "";
  } catch {
    return "";
  }
}

async function sincronizarNotificacoesLidasSupabase(
  notificacoesParaSincronizar: NotificacaoLocal[],
  lida: boolean,
  userIdAtual = ""
) {
  const idsNotificacoes = Array.from(
    new Set(
      notificacoesParaSincronizar
        .map((notificacao) => notificacao.id.trim())
        .filter(Boolean)
    )
  );

  if (idsNotificacoes.length === 0) {
    return;
  }

  try {
    const userId = await obterUserIdAtualNotificacoes(userIdAtual);

    if (!userId) {
      return;
    }

    const { error: erroRpc } = await supabase.rpc("marcar_notificacoes_lidas", {
      notificacao_ids: idsNotificacoes,
      novo_estado: lida,
    });

    if (!erroRpc) {
      return;
    }

    const { error: erroPorNotificacaoId } = await supabase
      .from("notificacoes")
      .update({ lida })
      .eq("user_id", userId)
      .in("notificacao_id", idsNotificacoes);

    if (!erroPorNotificacaoId) {
      return;
    }

    const idsUuid = idsNotificacoes.filter((id) =>
      idObraSupabaseValido(id)
    );

    if (idsUuid.length > 0) {
      await supabase
        .from("notificacoes")
        .update({ lida })
        .eq("user_id", userId)
        .in("id", idsUuid);
    }
  } catch {
    // O estado local continua funcionando se a sincronização remota falhar.
  }
}

async function sincronizarNotificacaoLidaSupabase(
  notificacao: NotificacaoLocal,
  lida: boolean,
  userIdAtual = ""
) {
  await sincronizarNotificacoesLidasSupabase([notificacao], lida, userIdAtual);
}

async function apagarNotificacoesSupabase(
  notificacoesParaApagar: NotificacaoLocal[],
  userIdAtual = ""
) {
  const ids = Array.from(
    new Set(
      notificacoesParaApagar
        .map((notificacao) => notificacao.id.trim())
        .filter(Boolean)
    )
  );

  if (ids.length === 0) {
    return;
  }

  try {
    const userId = await obterUserIdAtualNotificacoes(userIdAtual);

    if (!userId) {
      return;
    }

    await supabase
      .from("notificacoes")
      .delete()
      .eq("user_id", userId)
      .in("notificacao_id", ids);

    const idsUuid = ids.filter((id) => idObraSupabaseValido(id));

    if (idsUuid.length > 0) {
      await supabase
        .from("notificacoes")
        .delete()
        .eq("user_id", userId)
        .in("id", idsUuid);
    }
  } catch {
    // A remoção local continua funcionando se o Supabase falhar.
  }
}

async function apagarNotificacaoSupabase(
  notificacao: NotificacaoLocal,
  userIdAtual = ""
) {
  await apagarNotificacoesSupabase([notificacao], userIdAtual);
}

async function excluirNotificacoesLidasSupabase(userIdAtual = "") {
  try {
    const userId = await obterUserIdAtualNotificacoes(userIdAtual);

    if (!userId) {
      return false;
    }

    const { error } = await supabase.rpc("excluir_notificacoes_lidas");

    return !error;
  } catch {
    return false;
  }
}
function LoadingSpinner({ label = "Carregando" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      style={loadingPageStyle}
    >
      <span
        className="historietas-loading-spinner"
        style={loadingSpinnerStyle}
        aria-hidden="true"
      />
    </div>
  );
}

export default function NotificacoesPage() {
  const router = useRouter();
  const [obras, setObras] = useState<ObraLocal[]>([]);
  const [notificacoes, setNotificacoes] = useState<NotificacaoLocal[]>([]);
  const [busca, setBusca] = useState("");
  const [buscaTopoAberta, setBuscaTopoAberta] = useState(false);
  const [filtro, setFiltro] = useState<FiltroNotificacao>("todas");
  const [ordenacao, setOrdenacao] = useState<OrdenacaoNotificacao>("recentes");
  const [isDesktop, setIsDesktop] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [usuarioNotificacoesId, setUsuarioNotificacoesId] = useState("");
  const [menuNotificacaoAbertoId, setMenuNotificacaoAbertoId] = useState("");
  const [mostrarPainelOrdenacao, setMostrarPainelOrdenacao] = useState(false);
  const { definirNotificacoesNaoLidas } = useNotificacoes();
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");

    const atualizarModoDesktop = () => {
      setIsDesktop(mediaQuery.matches);
    };

    atualizarModoDesktop();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", atualizarModoDesktop);

      return () => {
        mediaQuery.removeEventListener("change", atualizarModoDesktop);
      };
    }

    mediaQuery.addListener(atualizarModoDesktop);

    return () => {
      mediaQuery.removeListener(atualizarModoDesktop);
    };
  }, []);

  useEffect(() => {
    let componenteAtivo = true;

    async function carregarDados() {
      let manterCarregando = false;
      let usuarioAutenticado = false;
      let usuarioAtualId = "";

      try {
        const { data: dadosUsuario, error: erroUsuario } =
          await supabase.auth.getUser();

        if (!componenteAtivo) {
          return;
        }

        if (erroUsuario || !dadosUsuario.user) {
          manterCarregando = true;
          router.replace(criarLoginHrefNotificacoes());
          return;
        }

        usuarioAtualId = dadosUsuario.user.id;
        usuarioAutenticado = true;
        const obrasLocais = carregarObras(usuarioAtualId);
        const notificacoesLocais = carregarNotificacoes(usuarioAtualId);
        const obrasSupabase = await carregarObrasPublicadasSupabase();
        const estadoSupabase = await carregarEstadoSupabaseNotificacoes();
        const notificacoesDiretasSupabase = estadoSupabase?.notificacoesDiretas || [];
        const obrasDiretasSupabase =
          await carregarObrasDasNotificacoesDiretasSupabase(
            notificacoesDiretasSupabase
          );
        const idsNotificacoesApagadas =
          carregarIdsNotificacoesApagadas(usuarioAtualId);
        const obrasMescladas = mesclarObrasPorIdSlug(obrasLocais, [
          ...obrasSupabase,
          ...obrasDiretasSupabase,
        ]);
        const obrasSeguidasLocais = lerIdsLocalStorage(
          CHAVE_OBRAS_SEGUIDAS,
          usuarioAtualId
        );
        const obrasSeguidasIds = Array.from(
          new Set([
            ...obrasSeguidasLocais,
            ...(estadoSupabase?.obrasSeguidasIds || []),
          ])
        );
        const idsSeguidos = new Set(
          obrasSeguidasIds
            .map((id) => id.trim())
            .filter((id) => Boolean(id))
        );
        const obrasPorIdMescladas = new Map(
          obrasMescladas.map((obra) => [obra.id, obra])
        );
        const notificacoesLocaisFiltradas = notificacoesLocais.filter(
          (notificacao) =>
            !notificacaoEhCapitulo(notificacao) ||
            notificacaoCapituloPertenceAObraSeguida(
              notificacao,
              obrasPorIdMescladas,
              idsSeguidos,
              usuarioAtualId
            )
        );
        const notificacoesLidasIds = estadoSupabase?.notificacoesLidasIds || [];
        const notificacoesCapitulosSupabase = criarNotificacoesDeCapitulos(
          obrasMescladas,
          obrasSeguidasIds,
          notificacoesLidasIds,
          usuarioAtualId
        );
        const [
          notificacoesComunidadeSupabase,
          notificacoesDiarioSupabase,
        ] = await Promise.all([
          carregarNotificacoesComunidadeSupabase(
            usuarioAtualId,
            notificacoesLidasIds
          ),
          carregarNotificacoesDiarioSupabase(
            usuarioAtualId,
            notificacoesLidasIds
          ),
        ]);
        const notificacoesMescladas = filtrarNotificacoesApagadas(
          mesclarNotificacoes(notificacoesLocaisFiltradas, [
            ...notificacoesCapitulosSupabase,
            ...notificacoesDiretasSupabase,
            ...notificacoesComunidadeSupabase,
            ...notificacoesDiarioSupabase,
          ]),
          idsNotificacoesApagadas
        ).map((notificacao) => prepararNotificacaoTexto(notificacao));

        try {
          salvarJsonStorageUsuarioNotificacoes(
            CHAVE_OBRAS,
            usuarioAtualId,
            obrasMescladas
          );
          salvarNotificacoes(notificacoesMescladas, usuarioAtualId);
        } catch {
          // Se o navegador bloquear localStorage, a página continua com o estado em memória.
        }

        if (!componenteAtivo) {
          return;
        }

        setUsuarioNotificacoesId(usuarioAtualId);
        setObras(obrasMescladas);
        setNotificacoes(notificacoesMescladas);
        definirNotificacoesNaoLidas(
          notificacoesMescladas.filter((notificacao) => !notificacao.lida).length
        );
      } catch {
        if (!componenteAtivo) {
          return;
        }

        if (!usuarioAutenticado || !usuarioAtualId) {
          manterCarregando = true;
          router.replace(criarLoginHrefNotificacoes());
          return;
        }

        const obrasLocais = carregarObras(usuarioAtualId);
        const notificacoesLocais = carregarNotificacoes(usuarioAtualId);

        setUsuarioNotificacoesId(usuarioAtualId);
        setObras(obrasLocais);
        setNotificacoes(notificacoesLocais);
        definirNotificacoesNaoLidas(
          notificacoesLocais.filter((notificacao) => !notificacao.lida).length
        );
      } finally {
        if (componenteAtivo && !manterCarregando) {
          setCarregando(false);
        }
      }
    }

    void carregarDados();

    return () => {
      componenteAtivo = false;
    };
  }, [router, definirNotificacoesNaoLidas]);


  const obrasPorId = useMemo(() => {
    return new Map(obras.map((obra) => [obra.id, obra]));
  }, [obras]);

  const totalNotificacoes = notificacoes.length;

  const totalNaoLidas = useMemo(() => {
    return notificacoes.filter((notificacao) => !notificacao.lida).length;
  }, [notificacoes]);

  const totalLidas = Math.max(totalNotificacoes - totalNaoLidas, 0);
  const termoBusca = normalizarTexto(busca);

  const notificacoesFiltradas = useMemo(() => {
    const filtradas = notificacoes.filter((notificacao) => {
      const obra = obrasPorId.get(notificacao.obraId) || null;
      const capitulo =
        obra?.capitulos.find((item) => item.id === notificacao.capituloId) ||
        null;

      const passaFiltro =
        filtro === "todas" ||
        (filtro === "nao-lidas" && !notificacao.lida) ||
        (filtro === "lidas" && notificacao.lida) ||
        (filtro === "capitulos" && notificacaoEhCapitulo(notificacao)) ||
        (filtro === "comunidade" && notificacaoEhComunidade(notificacao));

      const textoBusca = normalizarTexto(
        [
          notificacao.titulo,
          notificacao.mensagem,
          notificacao.tipo,
          notificacao.link,
          notificacao.autorNome || "",
          obra?.titulo || "",
          obra?.autor || "",
          obra?.genero || "",
          obra?.formato || "",
          obra?.classificacaoIndicativa || "",
          capitulo?.titulo || "",
          formatarData(notificacao.criadaEm),
        ].join(" ")
      );

      const passaBusca = termoBusca ? textoBusca.includes(termoBusca) : true;

      return passaFiltro && passaBusca;
    });

    return [...filtradas].sort((notificacaoA, notificacaoB) => {
      const obraA = obrasPorId.get(notificacaoA.obraId) || null;
      const obraB = obrasPorId.get(notificacaoB.obraId) || null;
      const capituloA =
        obraA?.capitulos.find(
          (capitulo) => capitulo.id === notificacaoA.capituloId
        ) || null;
      const capituloB =
        obraB?.capitulos.find(
          (capitulo) => capitulo.id === notificacaoB.capituloId
        ) || null;

      if (ordenacao === "antigas") {
        return dataNotificacao(notificacaoA) - dataNotificacao(notificacaoB);
      }

      if (ordenacao === "obra") {
        return (obraA?.titulo || "zzz").localeCompare(obraB?.titulo || "zzz");
      }

      if (ordenacao === "capitulo") {
        return (capituloA?.titulo || "zzz").localeCompare(
          capituloB?.titulo || "zzz"
        );
      }

      return dataNotificacao(notificacaoB) - dataNotificacao(notificacaoA);
    });
  }, [notificacoes, obrasPorId, termoBusca, filtro, ordenacao]);

  const filtrosAtivos = Boolean(
    busca.trim() || filtro !== "todas" || ordenacao !== "recentes"
  );

  const opcoesFiltro: Array<{ valor: FiltroNotificacao; rotulo: string }> = [
    { valor: "todas", rotulo: "Todas" },
    { valor: "nao-lidas", rotulo: "Novas" },
    { valor: "lidas", rotulo: "Lidas" },
    { valor: "capitulos", rotulo: "Capítulos" },
    { valor: "comunidade", rotulo: "Comunidade" },
  ];

  const opcoesOrdenacao: Array<{ valor: OrdenacaoNotificacao; rotulo: string }> = [
    { valor: "recentes", rotulo: "Mais recentes" },
    { valor: "antigas", rotulo: "Mais antigas" },
  ];

  function encontrarObra(obraId: string) {
    return obrasPorId.get(obraId) || null;
  }

  function encontrarCapitulo(obraId: string, capituloId: string) {
    const obra = encontrarObra(obraId);

    if (!obra) {
      return null;
    }

    return obra.capitulos.find((capitulo) => capitulo.id === capituloId) || null;
  }

  function atualizarNotificacoes(novasNotificacoes: NotificacaoLocal[]) {
    const notificacoesNormalizadas = novasNotificacoes.map((notificacao) =>
      prepararNotificacaoTexto(notificacao)
    );

    setNotificacoes(notificacoesNormalizadas);
    definirNotificacoesNaoLidas(
      notificacoesNormalizadas.filter((notificacao) => !notificacao.lida).length
    );
    salvarNotificacoes(notificacoesNormalizadas, usuarioNotificacoesId);
  }

  function marcarComoLida(id: string) {
    const notificacaoAtual = notificacoes.find((notificacao) => notificacao.id === id);
    const novasNotificacoes = notificacoes.map((notificacao) => {
      if (notificacao.id !== id) {
        return notificacao;
      }

      return {
        ...notificacao,
        lida: true,
      };
    });

    atualizarNotificacoes(novasNotificacoes);

    if (notificacaoAtual) {
      void sincronizarNotificacaoLidaSupabase(notificacaoAtual, true, usuarioNotificacoesId);
    }
  }

  function marcarComoNaoLida(id: string) {
    const notificacaoAtual = notificacoes.find((notificacao) => notificacao.id === id);
    const novasNotificacoes = notificacoes.map((notificacao) => {
      if (notificacao.id !== id) {
        return notificacao;
      }

      return {
        ...notificacao,
        lida: false,
      };
    });

    atualizarNotificacoes(novasNotificacoes);

    if (notificacaoAtual) {
      void sincronizarNotificacaoLidaSupabase(notificacaoAtual, false, usuarioNotificacoesId);
    }
  }

  function abrirNotificacao(id: string) {
    marcarComoLida(id);
  }

  function marcarTodasComoLidas() {
    const notificacoesParaSincronizar = notificacoes.filter(
      (notificacao) => !notificacao.lida
    );
    const novasNotificacoes = notificacoes.map((notificacao) => ({
      ...notificacao,
      lida: true,
    }));

    atualizarNotificacoes(novasNotificacoes);
    void sincronizarNotificacoesLidasSupabase(
      notificacoesParaSincronizar,
      true,
      usuarioNotificacoesId
    );
  }

  function marcarFiltradasComoLidas() {
    const idsFiltrados = new Set(
      notificacoesFiltradas.map((notificacao) => notificacao.id)
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

    atualizarNotificacoes(novasNotificacoes);
    void sincronizarNotificacoesLidasSupabase(
      notificacoesParaSincronizar,
      true,
      usuarioNotificacoesId
    );
  }

  function apagarNotificacao(id: string) {
    const notificacaoAtual = notificacoes.find((notificacao) => notificacao.id === id);
    const novasNotificacoes = notificacoes.filter((notificacao) => {
      return notificacao.id !== id;
    });

    if (notificacaoAtual) {
      registrarNotificacoesApagadas(usuarioNotificacoesId, [notificacaoAtual.id]);
    }

    atualizarNotificacoes(novasNotificacoes);

    if (notificacaoAtual) {
      void apagarNotificacaoSupabase(notificacaoAtual, usuarioNotificacoesId);
    }
  }

  function limparTodas() {
    const notificacoesParaApagar = [...notificacoes];

    registrarNotificacoesApagadas(
      usuarioNotificacoesId,
      notificacoesParaApagar.map((notificacao) => notificacao.id)
    );
    atualizarNotificacoes([]);
    void apagarNotificacoesSupabase(
      notificacoesParaApagar,
      usuarioNotificacoesId
    );
  }

  function limparLidas() {
    const notificacoesLidas = notificacoes.filter((notificacao) => notificacao.lida);
    const novasNotificacoes = notificacoes.filter(
      (notificacao) => !notificacao.lida
    );

    registrarNotificacoesApagadas(
      usuarioNotificacoesId,
      notificacoesLidas.map((notificacao) => notificacao.id)
    );
    atualizarNotificacoes(novasNotificacoes);
    void excluirNotificacoesLidasSupabase(usuarioNotificacoesId).then((excluiu) => {
      if (!excluiu) {
        void apagarNotificacoesSupabase(
          notificacoesLidas,
          usuarioNotificacoesId
        );
      }
    });
  }

  function alternarMenuNotificacao(id: string) {
    setMostrarPainelOrdenacao(false);
    setMenuNotificacaoAbertoId((idAtual) => (idAtual === id ? "" : id));
  }

  function fecharMenuNotificacao() {
    setMenuNotificacaoAbertoId("");
  }

  function fecharMenusNotificacoes() {
    setMenuNotificacaoAbertoId("");
    setMostrarPainelOrdenacao(false);
  }

  function limparFiltros() {
    fecharMenusNotificacoes();
    setBusca("");
    setBuscaTopoAberta(false);
    setFiltro("todas");
    setOrdenacao("recentes");
  }

  const notificacaoMenuAberta = menuNotificacaoAbertoId
    ? notificacoes.find((notificacao) => notificacao.id === menuNotificacaoAbertoId) || null
    : null;

  const menuOverlayAberto = Boolean(
    mostrarPainelOrdenacao || notificacaoMenuAberta
  );

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const raiz = document.documentElement;
    const corpo = document.body;

    if (!menuOverlayAberto) {
      raiz.removeAttribute("data-historietas-notificacoes-overlay-aberto");
      corpo.removeAttribute("data-historietas-notificacoes-overlay-aberto");
      return;
    }

    const overflowAnterior = corpo.style.overflow;
    const htmlOverflowAnterior = raiz.style.overflow;

    raiz.setAttribute("data-historietas-notificacoes-overlay-aberto", "true");
    corpo.setAttribute("data-historietas-notificacoes-overlay-aberto", "true");
    raiz.style.overflow = "hidden";
    corpo.style.overflow = "hidden";

    return () => {
      raiz.removeAttribute("data-historietas-notificacoes-overlay-aberto");
      corpo.removeAttribute("data-historietas-notificacoes-overlay-aberto");
      raiz.style.overflow = htmlOverflowAnterior;
      corpo.style.overflow = overflowAnterior;
    };
  }, [menuOverlayAberto]);

  if (carregando) {
    return (
      <main data-historietas-notificacoes-root="true" style={pageThemeStyle}>
        <style>{`${historietasThemeCss}${notificacoesPageCss}`}</style>
        <NotificacoesLanguageBridge />

        {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
        {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}

        <LoadingSpinner label="Carregando notificações" />
      </main>
    );
  }

  return (
    <main data-historietas-notificacoes-root="true" style={pageThemeStyle}>
      <style>{`${historietasThemeCss}${notificacoesPageCss}`}</style>
      <NotificacoesLanguageBridge />

      {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
      {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}

      <section style={isDesktop ? desktopContainerStyle : containerStyle}>
        <section style={notificacoesTopFilterBoxStyle}>
          <div style={isDesktop ? desktopTitleHeaderStyle : titleHeaderStyle}>
            <button
              type="button"
              onClick={() => {
                fecharMenusNotificacoes();
                setMostrarPainelOrdenacao((aberto) => !aberto);
              }}
              style={
                isDesktop
                  ? desktopNotificacoesHeaderFilterButtonStyle
                  : notificacoesHeaderFilterButtonStyle
              }
              aria-label="Abrir opções das notificações"
              aria-expanded={mostrarPainelOrdenacao}
            >
              <span>Notificações</span>
              <span style={notificacoesHeaderFilterIconStyle} aria-hidden="true">
                +
              </span>
            </button>

            {buscaTopoAberta || Boolean(busca.trim()) ? (
              <>
                <label
                  style={
                    isDesktop
                      ? desktopNotificationSearchShellStyle
                      : notificationSearchShellStyle
                  }
                >
                  <input
                    value={busca}
                    onChange={(event) => {
                      fecharMenusNotificacoes();
                      setBusca(event.target.value);
                    }}
                    className="notificacoes-search-input"
                    placeholder="Buscar notificações..."
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    maxLength={90}
                    style={notificationSearchInputStyle}
                    type="text"
                    autoFocus
                  />
                </label>

                <button
                  type="button"
                  onClick={() => {
                    fecharMenusNotificacoes();
                    setBusca("");
                    setBuscaTopoAberta(false);
                  }}
                  aria-label="Fechar busca"
                  aria-expanded="true"
                  style={mobileSearchToggleStyle}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <circle
                      cx="10.85"
                      cy="10.85"
                      r="6.65"
                      stroke="currentColor"
                      strokeWidth="2.15"
                    />
                    <path
                      d="M16.05 16.05L20.25 20.25"
                      stroke="currentColor"
                      strokeWidth="2.15"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  fecharMenusNotificacoes();
                  setBuscaTopoAberta(true);
                }}
                aria-label="Abrir busca"
                aria-expanded="false"
                style={mobileSearchToggleStyle}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <circle
                    cx="10.85"
                    cy="10.85"
                    r="6.65"
                    stroke="currentColor"
                    strokeWidth="2.15"
                  />
                  <path
                    d="M16.05 16.05L20.25 20.25"
                    stroke="currentColor"
                    strokeWidth="2.15"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            )}
          </div>
        </section>

        {totalNotificacoes > 0 && filtrosAtivos && (
          <section
            style={
              isDesktop
                ? desktopNotificationsControlsStyle
                : notificationsControlsStyle
            }
          >
            <button
              type="button"
              onClick={limparFiltros}
              style={notificationClearButtonStyle}
            >
              Limpar busca e filtros
            </button>
          </section>
        )}

        {mostrarPainelOrdenacao && (
              <NotificacoesOverlayPortal>
                <div
                data-historietas-notificacoes-overlay="true"
                style={notificationSortingBackdropStyle}
                onClick={() => setMostrarPainelOrdenacao(false)}
              >
                <div
                  style={isDesktop ? desktopNotificationSortingSheetStyle : notificationSortingSheetStyle}
                  onClick={(event) => event.stopPropagation()}
                >
                  <span style={notificationSortingHandleStyle} />

                  <strong style={notificationSortingTitleStyle}>Opções de notificações</strong>

                  <div style={notificationSortingOptionsListStyle}>
                    <span style={notificationSortingSectionLabelStyle}>Mostrar</span>

                    {opcoesFiltro.map((opcao) => {
                      const ativo = filtro === opcao.valor;

                      return (
                        <button
                          key={opcao.valor}
                          type="button"
                          onClick={() => {
                            setFiltro(opcao.valor);
                            setMostrarPainelOrdenacao(false);
                          }}
                          style={
                            ativo
                              ? notificationSortingOptionActiveStyle
                              : notificationSortingOptionStyle
                          }
                        >
                          <span>{opcao.rotulo}</span>

                          <span
                            style={
                              ativo
                                ? notificationSortingOptionRadioActiveStyle
                                : notificationSortingOptionRadioStyle
                            }
                          >
                            {ativo ? "✓" : ""}
                          </span>
                        </button>
                      );
                    })}

                    <span style={notificationSortingSectionLabelStyle}>Classificar por</span>

                    {opcoesOrdenacao.map((opcao) => {
                      const ativo = ordenacao === opcao.valor;

                      return (
                        <button
                          key={opcao.valor}
                          type="button"
                          onClick={() => {
                            setOrdenacao(opcao.valor);
                            setMostrarPainelOrdenacao(false);
                          }}
                          style={
                            ativo
                              ? notificationSortingOptionActiveStyle
                              : notificationSortingOptionStyle
                          }
                        >
                          <span>{opcao.rotulo}</span>

                          <span
                            style={
                              ativo
                                ? notificationSortingOptionRadioActiveStyle
                                : notificationSortingOptionRadioStyle
                            }
                          >
                            {ativo ? "✓" : ""}
                          </span>
                        </button>
                      );
                    })}

                    <span style={notificationSortingSectionLabelStyle}>Ações</span>

                    <button
                      type="button"
                      onClick={() => {
                        marcarTodasComoLidas();
                        setMostrarPainelOrdenacao(false);
                      }}
                      style={
                        notificacoes.length === 0
                          ? notificationActionsOptionDisabledStyle
                          : notificationActionsOptionStyle
                      }
                      disabled={notificacoes.length === 0}
                    >
                      Marcar todas como lidas
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        marcarFiltradasComoLidas();
                        setMostrarPainelOrdenacao(false);
                      }}
                      style={
                        notificacoesFiltradas.length === 0
                          ? notificationActionsOptionDisabledStyle
                          : notificationActionsOptionStyle
                      }
                      disabled={notificacoesFiltradas.length === 0}
                    >
                      Marcar seleção
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        limparLidas();
                        setMostrarPainelOrdenacao(false);
                      }}
                      style={
                        totalLidas === 0
                          ? notificationActionsOptionDisabledStyle
                          : notificationActionsOptionStyle
                      }
                      disabled={totalLidas === 0}
                    >
                      Apagar lidas
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        limparTodas();
                        setMostrarPainelOrdenacao(false);
                      }}
                      style={
                        notificacoes.length === 0
                          ? notificationActionsDangerOptionDisabledStyle
                          : notificationActionsDangerOptionStyle
                      }
                      disabled={notificacoes.length === 0}
                    >
                      Limpar todos
                    </button>
                  </div>
                </div>
              </div>
              </NotificacoesOverlayPortal>
        )}

        {notificacoes.length === 0 ? (
          <p
            style={{
              margin: "10px 0 0",
              color: "#FFFFFF",
              fontSize: "12px",
              fontWeight: 800,
              textAlign: "center",
            }}
          >
            Nenhuma notificação
          </p>
        ) : notificacoesFiltradas.length === 0 ? (
          <p
            style={{
              margin: "10px 0 0",
              color: "#FFFFFF",
              fontSize: "12px",
              fontWeight: 800,
              textAlign: "center",
            }}
          >
            Nada encontrado
          </p>
        ) : (
          <section style={isDesktop ? desktopListStyle : listStyle} aria-label="Lista de notificações">
            {notificacoesFiltradas.map((notificacaoOriginal, notificacaoIndex) => {
              const notificacao = prepararNotificacaoTexto(notificacaoOriginal);
              const obra = encontrarObra(notificacao.obraId);
              const capitulo = encontrarCapitulo(
                notificacao.obraId,
                notificacao.capituloId
              );

              const usaCardSocial = notificacaoUsaCardSocial(notificacao);
              const tituloObra = obra?.titulo || "Obra não encontrada";
              const tituloCapitulo = capitulo?.titulo || "Capítulo não encontrado";
              const tituloExibicao = obterTituloExibicaoNotificacao(notificacao);
              const tituloBlocoSocial = obterTituloBlocoSocialNotificacao(notificacao);
              const textoBlocoSocial = obterTextoBlocoSocialNotificacao(notificacao);
              const autorNotificacaoNome = obterNomeAutorNotificacao(notificacao);
              const autorNotificacaoHref = criarPerfilHrefNotificacao(
                notificacao.autorId || "",
                autorNotificacaoNome
              );

              const menuEstaAberto = menuNotificacaoAbertoId === notificacao.id;

              const cardVisualStyle = notificacao.lida
                ? usaCardSocial
                  ? isDesktop
                    ? desktopReadCommunityCardStyle
                    : readCommunityCardStyle
                  : isDesktop
                    ? desktopReadCardStyle
                    : readCardStyle
                : usaCardSocial
                  ? isDesktop
                    ? desktopCommunityCardStyle
                    : communityCardStyle
                  : isDesktop
                    ? desktopCardStyle
                    : cardStyle;

              const iconVisualStyle = notificacao.lida
                ? readNotificationIconStyle
                : usaCardSocial
                  ? communityNotificationIconStyle
                  : unreadNotificationIconStyle;
              const avatarVisualStyle = criarAvatarNotificacaoStyle(
                notificacao,
                iconVisualStyle
              );
              const cardSeparadorStyle: CSSProperties =
                notificacaoIndex < notificacoesFiltradas.length - 1
                  ? {}
                  : { borderBottom: "0" };

              return (
                <article
                  key={notificacao.id}
                  style={{ ...cardVisualStyle, ...cardSeparadorStyle }}
                >
                  <div style={cardHeaderStyle}>
                    {notificacao.autorId ? (
                      <Link
                        href={autorNotificacaoHref}
                        aria-label={`Abrir perfil de ${autorNotificacaoNome}`}
                        style={avatarVisualStyle}
                      >
                        {notificacao.autorAvatar?.trim()
                          ? ""
                          : obterInicialNotificacao(notificacao)}
                      </Link>
                    ) : (
                      <div style={iconVisualStyle} aria-hidden="true">
                        {obterIconeNotificacao(notificacao, notificacao.lida)}
                      </div>
                    )}

                    <div style={cardHeaderTextStyle}>
                      <div style={notificationTitleRowStyle}>
                        <h2 style={notificationTitleStyle}>
                          {tituloExibicao}
                        </h2>

                        <div style={cardMenuWrapperStyle}>
                          <button
                            type="button"
                            aria-label={`Abrir ações de ${tituloExibicao}`}
                            aria-expanded={menuEstaAberto}
                            onClick={() => alternarMenuNotificacao(notificacao.id)}
                            style={cardMenuButtonStyle}
                          >
                            ⋮
                          </button>

                                                  </div>
                      </div>

                      <span style={communityDateTextStyle}>
                        DATA: {formatarData(notificacao.criadaEm)}
                      </span>

                      {!usaCardSocial && (
                        <p style={notificationMessageStyle}>
                          {notificacao.mensagem}
                        </p>
                      )}
                    </div>
                  </div>

                  <div
                    style={
                      usaCardSocial
                        ? isDesktop
                          ? desktopCommunityMetaGridStyle
                          : communityMetaGridStyle
                        : isDesktop
                          ? desktopMetaGridStyle
                          : metaGridStyle
                    }
                  >
                    {usaCardSocial ? (
                      <div
                        style={
                          notificacao.tipo === "comentario-comunidade" ||
                          notificacao.tipo === "comentario-obra" ||
                          notificacao.tipo === "comentario-capitulo" ||
                          notificacao.tipo === "comentario-diario"
                            ? communityCommentBoxStyle
                            : communityUpdateBoxStyle
                        }
                      >
                        {notificacaoTemAutorSocial(notificacao) ? (
                          notificacao.autorId ? (
                            <Link
                              href={autorNotificacaoHref}
                              style={notificationAuthorInlineLinkStyle}
                            >
                              {tituloBlocoSocial}
                            </Link>
                          ) : (
                            <span style={notificationAuthorInlineLinkStyle}>
                              {tituloBlocoSocial}
                            </span>
                          )
                        ) : (
                          <span style={communityInlineStatusStyle}>
                            <span>Atualização</span>
                            <span style={communityInlineStatusDotStyle}>•</span>
                            <span>{obterDetalheNotificacao(notificacao)}</span>
                          </span>
                        )}

                        {textoBlocoSocial.trim() ? (
                          <p style={communityCommentTextStyle}>
                            {textoBlocoSocial}
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      <>
                        <div style={metaBoxStyle}>
                          <span style={metaLabelStyle}>Obra</span>
                          <strong data-historietas-i18n-ignore="true" style={metaValueStyle}>{tituloObra}</strong>
                        </div>

                        <div style={metaBoxStyle}>
                          <span style={metaLabelStyle}>Capítulo</span>
                          <strong data-historietas-i18n-ignore="true" style={metaValueStyle}>{tituloCapitulo}</strong>
                        </div>
                      </>
                    )}
                  </div>

                </article>
              );
            })}
          </section>
        )}

        {notificacaoMenuAberta && (
          <NotificacoesOverlayPortal>
            {(() => {
              const notificacao = prepararNotificacaoTexto(notificacaoMenuAberta);
              const obra = encontrarObra(notificacao.obraId);
              const ehComunidade = notificacaoEhComunidade(notificacao);
              const autorNotificacaoNome = obterNomeAutorNotificacao(notificacao);
              const autorNotificacaoHref = criarPerfilHrefNotificacao(
                notificacao.autorId || "",
                autorNotificacaoNome
              );
              const linkNotificacao = montarLinkNotificacao(notificacao, obra);
              const labelAcaoPrincipal = obterAcaoPrincipalNotificacao(notificacao);

              return (
                <div
                  data-historietas-notificacoes-overlay="true"
                  style={notificationSortingBackdropStyle}
                  onClick={fecharMenuNotificacao}
                >
                  <div
                    style={isDesktop ? desktopNotificationActionsSheetStyle : notificationActionsSheetStyle}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <span style={notificationSortingHandleStyle} />

                    <h2 style={notificationSortingTitleStyle}>AÇÕES DA NOTIFICAÇÃO</h2>

                    <div style={notificationSortingOptionsListStyle}>
                      <Link
                        href={linkNotificacao}
                        style={notificationActionsOptionLinkStyle}
                        onClick={() => {
                          abrirNotificacao(notificacao.id);
                          fecharMenuNotificacao();
                        }}
                      >
                        {labelAcaoPrincipal}
                      </Link>

                      {notificacao.autorId && (
                        <Link
                          href={autorNotificacaoHref}
                          style={notificationActionsOptionLinkStyle}
                          onClick={fecharMenuNotificacao}
                        >
                          Abrir perfil
                        </Link>
                      )}

                      {notificacao.lida ? (
                        <button
                          type="button"
                          onClick={() => {
                            marcarComoNaoLida(notificacao.id);
                            fecharMenuNotificacao();
                          }}
                          style={notificationActionsOptionStyle}
                        >
                          Marcar como nova
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            marcarComoLida(notificacao.id);
                            fecharMenuNotificacao();
                          }}
                          style={notificationActionsOptionStyle}
                        >
                          Marcar como lida
                        </button>
                      )}

                      {obra && !ehComunidade && (
                        <Link
                          href={`/obra/${obra.slug || criarSlugBase(obra.titulo)}`}
                          style={notificationActionsOptionLinkStyle}
                          onClick={fecharMenuNotificacao}
                        >
                          Abrir obra
                        </Link>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          apagarNotificacao(notificacao.id);
                          fecharMenuNotificacao();
                        }}
                        style={notificationActionsDangerOptionStyle}
                      >
                        Apagar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </NotificacoesOverlayPortal>
        )}
      </section>
    </main>
  );
}

const notificacoesPageCss = `
  @keyframes historietas-loading-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .historietas-loading-spinner {
      animation-duration: 1.4s !important;
    }
  }

  html {
    --historietas-notificacoes-bg-page: #070212;
    --historietas-notificacoes-bg-deep: #04000A;
    --historietas-notificacoes-surface: #08030F;
    --historietas-notificacoes-bg-end: #020006;
    --historietas-notificacoes-purple-text: #DDD6FE;
    --historietas-notificacoes-purple-soft: #A78BFA;
    --historietas-notificacoes-accent: #F97316;
    --historietas-notificacoes-danger-text: #FCA5A5;
    --historietas-notificacoes-purple-border: rgba(59, 7, 100, 0.58);
    --historietas-notificacoes-danger-border: rgba(239,68,68,0.18);
    --historietas-notificacoes-danger-bg: rgba(239,68,68,0.075);
    --historietas-notificacoes-danger-surface: rgba(127,29,29,0.24);
    --historietas-notificacoes-danger-strong: rgba(248,113,113,0.36);
    --historietas-notificacoes-success-bg: rgba(34,197,94,0.12);
    --historietas-notificacoes-success-border: rgba(34,197,94,0.18);
    --historietas-notificacoes-accent-bg: rgba(249,115,22,0.12);
    --historietas-notificacoes-accent-border: rgba(249,115,22,0.20);
    --historietas-notificacoes-secondary-bg: rgba(124,58,237,0.16);
    --historietas-notificacoes-secondary-border: rgba(124,58,237,0.26);
  }

  html[data-historietas-tema-visual="foco"] {
    --historietas-notificacoes-bg-page: #000000;
    --historietas-notificacoes-bg-deep: #000000;
    --historietas-notificacoes-surface: #050505;
    --historietas-notificacoes-bg-end: #000000;
    --historietas-notificacoes-purple-text: #FFFFFF;
    --historietas-notificacoes-purple-soft: #FFFFFF;
    --historietas-notificacoes-accent: #FFFFFF;
    --historietas-notificacoes-danger-text: #FFFFFF;
    --historietas-notificacoes-purple-border: rgba(255,255,255,0.18);
    --historietas-notificacoes-danger-border: rgba(255,255,255,0.18);
    --historietas-notificacoes-danger-bg: rgba(255,255,255,0.06);
    --historietas-notificacoes-danger-surface: rgba(255,255,255,0.08);
    --historietas-notificacoes-danger-strong: rgba(255,255,255,0.24);
    --historietas-notificacoes-success-bg: rgba(255,255,255,0.06);
    --historietas-notificacoes-success-border: rgba(255,255,255,0.18);
    --historietas-notificacoes-accent-bg: rgba(255,255,255,0.06);
    --historietas-notificacoes-accent-border: rgba(255,255,255,0.18);
    --historietas-notificacoes-secondary-bg: rgba(255,255,255,0.06);
    --historietas-notificacoes-secondary-border: rgba(255,255,255,0.18);
  }

  html[data-historietas-tema-visual="original"] body,
  html[data-historietas-tema-visual="original"] main {
    background: #070212 !important;
  }

  html[data-historietas-tema-visual="foco"] body,
  html[data-historietas-tema-visual="foco"] main {
    background: #000000 !important;
    color: #FFFFFF !important;
  }

  html[data-historietas-tema-visual] main > div[aria-hidden="true"] {
    background: transparent !important;
    opacity: 0 !important;
  }

  html[data-historietas-notificacoes-overlay-aberto="true"] body {
    overflow: hidden !important;
  }

  html[data-historietas-notificacoes-overlay-aberto="true"] nav,
  html[data-historietas-notificacoes-overlay-aberto="true"] [data-bottom-nav],
  html[data-historietas-notificacoes-overlay-aberto="true"] [data-mobile-nav],
  html[data-historietas-notificacoes-overlay-aberto="true"] nav:has(a[href="/publicar"]),
  html[data-historietas-notificacoes-overlay-aberto="true"] div:has(> a[href="/publicar"]):has(> a[href="/perfil-autor?aba=biblioteca"]) {
    z-index: 1 !important;
    pointer-events: none !important;
  }

  html[data-historietas-tema-visual] nav,
  html[data-historietas-tema-visual] [data-bottom-nav],
  html[data-historietas-tema-visual] [data-mobile-nav] {
    background: var(--historietas-bottom-nav-bg, #04000A) !important;
  }

  html[data-historietas-tema-visual] nav a[href="/notificacoes"],
  html[data-historietas-tema-visual] [data-bottom-nav] a[href="/notificacoes"],
  html[data-historietas-tema-visual] [data-mobile-nav] a[href="/notificacoes"] {
    background: var(
      --historietas-bottom-nav-active-bg,
      rgba(59, 7, 100, 0.54)
    ) !important;
    border-color: var(
      --historietas-bottom-nav-active-border,
      rgba(109, 40, 217, 0.48)
    ) !important;
    color: #FFFFFF !important;
  }

  html[data-historietas-tema-visual] nav a[href="/notificacoes"] .historietas-bottom-nav-icon,
  html[data-historietas-tema-visual] [data-bottom-nav] a[href="/notificacoes"] .historietas-bottom-nav-icon,
  html[data-historietas-tema-visual] [data-mobile-nav] a[href="/notificacoes"] .historietas-bottom-nav-icon {
    color: #FFFFFF !important;
    background: var(
      --historietas-bottom-nav-active-icon-bg,
      #3B0764
    ) !important;
    border-color: var(
      --historietas-bottom-nav-active-icon-border,
      rgba(167, 139, 250, 0.46)
    ) !important;
  }

  html[data-historietas-tema-visual="foco"] nav a[href="/notificacoes"],
  html[data-historietas-tema-visual="foco"] [data-bottom-nav] a[href="/notificacoes"],
  html[data-historietas-tema-visual="foco"] [data-mobile-nav] a[href="/notificacoes"] {
    background: #050505 !important;
    border-color: #FFFFFF !important;
    color: #FFFFFF !important;
    box-shadow: none !important;
  }

  html[data-historietas-tema-visual="foco"] nav a[href="/notificacoes"] .historietas-bottom-nav-icon,
  html[data-historietas-tema-visual="foco"] [data-bottom-nav] a[href="/notificacoes"] .historietas-bottom-nav-icon,
  html[data-historietas-tema-visual="foco"] [data-mobile-nav] a[href="/notificacoes"] .historietas-bottom-nav-icon {
    background: #000000 !important;
    border-color: rgba(255,255,255,0.24) !important;
    color: #FFFFFF !important;
  }

  html[data-historietas-tema-visual] nav a[href="/publicar"]:not([aria-current="page"]):not(.historietas-bottom-nav-item-active),
  html[data-historietas-tema-visual] [data-bottom-nav] a[href="/publicar"]:not([aria-current="page"]):not(.historietas-bottom-nav-item-active),
  html[data-historietas-tema-visual] [data-mobile-nav] a[href="/publicar"]:not([aria-current="page"]):not(.historietas-bottom-nav-item-active) {
    background: transparent !important;
    border-color: transparent !important;
    color: var(--historietas-bottom-nav-text, #9980D8) !important;
    box-shadow: none !important;
  }

  html[data-historietas-tema-visual] .notificacoes-search-input::placeholder {
    color: #FFFFFF !important;
    opacity: 1 !important;
  }

  html[data-historietas-tema-visual] input::placeholder {
    color: rgba(212,212,216,0.68) !important;
  }

  html[data-historietas-tema-visual] input,
  html[data-historietas-tema-visual] textarea,
  html[data-historietas-tema-visual] select {
    color: #FFFFFF !important;
  }
`;

const safeTextStyle: CSSProperties = {
  minWidth: 0,
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};


const mobileTopWaterFadeStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: "min(340px, 48vh)",
  pointerEvents: "none",
  zIndex: 0,
  background: "transparent",
  opacity: 0,
};

const desktopTopWaterFadeStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: "min(620px, 68vh)",
  pointerEvents: "none",
  zIndex: 0,
  background: "transparent",
  opacity: 0,
};

const loadingPageStyle: CSSProperties = {
  position: "relative",
  zIndex: 2,
  width: "100%",
  minHeight: "100dvh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
};

const loadingSpinnerStyle: CSSProperties = {
  width: "30px",
  height: "30px",
  borderRadius: "999px",
  border: "3px solid rgba(255,255,255,0.20)",
  borderTopColor: "#FFFFFF",
  boxSizing: "border-box",
  animation: "historietas-loading-spin 0.78s linear infinite",
  flex: "0 0 auto",
};

const pageStyle: CSSProperties = {
  position: "relative",
  minHeight: "100vh",
  width: "100%",
  maxWidth: "100vw",
  overflowX: "hidden",
  boxSizing: "border-box",
  background: "var(--historietas-notificacoes-bg-page, #070212)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontFamily: "Inter, Poppins, Manrope, Arial, Helvetica, sans-serif",
};

const containerStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: "min(900px, calc(100% - 28px))",
  maxWidth: "100%",
  margin: "0 auto",
  padding: "8px 0 calc(14px + env(safe-area-inset-bottom))",
  boxSizing: "border-box",
  minWidth: 0,
};

const topStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  marginBottom: "14px",
  padding: "2px 0",
  minWidth: 0,
};

const mobileTopStyle: CSSProperties = {
  ...topStyle,
  marginBottom: "9px",
  padding: "0",
};

const logoStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  fontSize: "25px",
  fontWeight: 950,
  letterSpacing: "-0.06em",
  display: "flex",
  alignItems: "center",
  gap: "4px",
  minWidth: 0,
  maxWidth: "calc(100% - 118px)",
  overflow: "hidden",
  ...safeTextStyle,
};

const logoMarkStyle: CSSProperties = {
  width: "36px",
  height: "36px",
  borderRadius: "14px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--historietas-notificacoes-bg-deep, #04000A)",
  color: "#FFFFFF",
  fontSize: "17px",
  fontWeight: 950,
  letterSpacing: "-0.04em",
  border: "1px solid var(--historietas-notificacoes-purple-border, rgba(59, 7, 100, 0.58))",
  boxShadow: "none",
  flex: "0 0 auto",
};

const logoTextStyle: CSSProperties = {
  marginLeft: "-1px",
  background:
    "linear-gradient(135deg, #FFFFFF 0%, var(--historietas-notificacoes-purple-text, #DDD6FE) 44%, var(--historietas-notificacoes-purple-soft, #A78BFA) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  textShadow: "none",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const notificacoesTopFilterBoxStyle: CSSProperties = {
  marginTop: "0",
  display: "grid",
  gap: "3px",
  padding: "0",
  borderRadius: 0,
  background: "transparent",
  border: "none",
  boxShadow: "none",
  minWidth: 0,
  overflow: "visible",
  backdropFilter: "none",
  WebkitBackdropFilter: "none",
};

const titleHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  flexWrap: "nowrap",
  marginBottom: "3px",
  width: "100%",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const desktopTitleHeaderStyle: CSSProperties = {
  ...titleHeaderStyle,
};

const mobileSearchToggleStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  width: "34px",
  height: "34px",
  border: "none",
  background: "transparent",
  color: "#FFFFFF",
  fontFamily: "inherit",
  fontSize: "24px",
  lineHeight: 1,
  fontWeight: 950,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  padding: 0,
  boxShadow: "none",
  flex: "0 0 auto",
  outline: "none",
  WebkitTapHighlightColor: "transparent",
};

const notificacoesHeaderFilterButtonStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  border: "none",
  background: "transparent",
  color: "#FFFFFF",
  padding: 0,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: "8px",
  minWidth: "max-content",
  maxWidth: "none",
  flex: "0 0 auto",
  fontSize: "16px",
  lineHeight: 1.15,
  fontWeight: 950,
  fontFamily: "inherit",
  cursor: "pointer",
  textAlign: "left",
  letterSpacing: "-0.04em",
  boxShadow: "none",
  outline: "none",
  whiteSpace: "nowrap",
  WebkitTapHighlightColor: "transparent",
  ...safeTextStyle,
};

const desktopNotificacoesHeaderFilterButtonStyle: CSSProperties = {
  ...notificacoesHeaderFilterButtonStyle,
};

const notificacoesHeaderFilterIconStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "21px",
  lineHeight: 1,
  fontWeight: 700,
  flex: "0 0 auto",
};

const topActionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: "8px",
  flex: "0 0 auto",
};

const desktopTopActionsStyle: CSSProperties = {
  ...topActionsStyle,
  gap: "10px",
};

const soonTopButtonStyle: CSSProperties = {
  minHeight: "38px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0 13px",
  borderRadius: "999px",
  background: "var(--historietas-notificacoes-bg-deep, #04000A)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "var(--historietas-notificacoes-purple-text, #DDD6FE)",
  textDecoration: "none",
  fontSize: "12px",
  fontWeight: 950,
  textAlign: "center",
  boxShadow: "none",
  whiteSpace: "nowrap",
  ...safeTextStyle,
};

const desktopSoonTopButtonStyle: CSSProperties = {
  ...soonTopButtonStyle,
  minHeight: "42px",
  padding: "0 18px",
};

const heroStyle: CSSProperties = {
  position: "relative",
  borderRadius: "30px",
  border: "1px solid rgba(255,255,255,0.06)",
  background: "linear-gradient(135deg, var(--historietas-notificacoes-bg-page, #070212) 0%, var(--historietas-notificacoes-bg-deep, #04000A) 58%, var(--historietas-notificacoes-bg-end, #020006) 100%)",
  padding: "18px",
  boxShadow: "none",
  minWidth: 0,
  overflow: "hidden",
};

const mobileHeroStyle: CSSProperties = {
  ...heroStyle,
  borderRadius: "28px",
};

const heroDecorationLayerStyle: CSSProperties = {
  display: "none",
};

const heroSparkTopStyle: CSSProperties = {
  display: "none",
};

const heroSparkMiddleStyle: CSSProperties = {
  display: "none",
};

const heroSparkBottomStyle: CSSProperties = {
  display: "none",
};

const titleStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  margin: "8px auto 0",
  fontSize: "clamp(34px, 10vw, 60px)",
  lineHeight: 0.92,
  fontWeight: 950,
  letterSpacing: "-0.085em",
  maxWidth: "100%",
  textAlign: "center",
  color: "var(--historietas-accent, var(--historietas-notificacoes-accent, #F97316))",
  textShadow: "none",
  ...safeTextStyle,
};

const descriptionStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  margin: "10px auto 0",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "13px",
  lineHeight: 1.55,
  fontWeight: 720,
  maxWidth: "680px",
  textAlign: "center",
  ...safeTextStyle,
};











const notificationsControlsStyle: CSSProperties = {
  position: "relative",
  marginTop: "12px",
  display: "grid",
  gap: "8px",
  padding: "0",
  background: "transparent",
  border: "none",
  boxShadow: "none",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "visible",
  boxSizing: "border-box",
};

const desktopNotificationsControlsStyle: CSSProperties = {
  ...notificationsControlsStyle,
  maxWidth: "760px",
  marginLeft: "auto",
  marginRight: "auto",
};

const notificationSearchShellStyle: CSSProperties = {
  flex: "1 1 auto",
  minWidth: 0,
  maxWidth: "calc(100% - 104px)",
  height: "36px",
  marginLeft: "auto",
  marginRight: "-6px",
  borderRadius: "999px",
  border: "none",
  background: "#000000",
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  overflow: "hidden",
  padding: "0 0 0 13px",
  boxSizing: "border-box",
  boxShadow: "none",
  transformOrigin: "right center",
};

const desktopNotificationSearchShellStyle: CSSProperties = {
  ...notificationSearchShellStyle,
};

const notificationSearchInputStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  flex: "1 1 auto",
  width: "100%",
  minWidth: 0,
  height: "34px",
  border: "none",
  background: "transparent",
  color: "#FFFFFF",
  outline: "none",
  fontFamily: "inherit",
  fontSize: "14px",
  fontWeight: 800,
  letterSpacing: "-0.025em",
  boxSizing: "border-box",
};

const notificationClearButtonStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  width: "fit-content",
  justifySelf: "center",
  minHeight: "34px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.06)",
  color: "rgba(244,244,245,0.88)",
  fontFamily: "inherit",
  fontSize: "12px",
  fontWeight: 900,
  padding: "0 13px",
  cursor: "pointer",
  boxShadow: "none",
};

const notificationSortingBackdropStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  height: "100dvh",
  zIndex: 2147483646,
  background: "rgba(0,0,0,0.68)",
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
  padding: 0,
  boxSizing: "border-box",
  overflow: "hidden",
  overscrollBehavior: "none",
  touchAction: "none",
};

const notificationSortingSheetStyle: CSSProperties = {
  position: "fixed",
  left: "50%",
  bottom: 0,
  transform: "translateX(-50%)",
  zIndex: 2147483647,
  width: "min(820px, 100%)",
  maxHeight: "calc(100dvh - 116px)",
  display: "grid",
  gap: 0,
  padding: "8px 0 calc(18px + env(safe-area-inset-bottom))",
  borderRadius: "24px 24px 0 0",
  background: "var(--historietas-bg-start, var(--historietas-notificacoes-bg-page, #070212))",
  border: "none",
  borderBottom: "0",
  overflowY: "auto",
  overflowX: "hidden",
  overscrollBehavior: "none",
  boxShadow: "0 -18px 50px rgba(0,0,0,0.38)",
  boxSizing: "border-box",
  touchAction: "none",
};

const desktopNotificationSortingSheetStyle: CSSProperties = {
  ...notificationSortingSheetStyle,
  left: "50%",
  right: "auto",
  bottom: "24px",
  width: "min(560px, calc(100vw - 24px))",
  maxWidth: "560px",
  maxHeight: "82vh",
  transform: "translateX(-50%)",
  borderRadius: "24px",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
  margin: 0,
  paddingBottom: "18px",
};

const notificationSortingHandleStyle: CSSProperties = {
  display: "block",
  justifySelf: "center",
  width: "72px",
  height: "5px",
  borderRadius: "999px",
  background: "rgba(244,244,245,0.62)",
  margin: "0 auto 14px",
};

const notificationSortingTitleStyle: CSSProperties = {
  display: "block",
  margin: "0 0 12px",
  padding: 0,
  color: "#FFFFFF",
  fontSize: "21px",
  lineHeight: 1.1,
  fontWeight: 950,
  letterSpacing: "-0.04em",
  textAlign: "center",
  ...safeTextStyle,
};

const notificationSortingOptionsListStyle: CSSProperties = {
  display: "grid",
  gap: 0,
};

const notificationSortingSectionLabelStyle: CSSProperties = {
  margin: 0,
  display: "block",
  padding: "11px 30px 5px",
  borderTop: "none",
  color: "rgba(244,244,245,0.56)",
  fontSize: "11px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  ...safeTextStyle,
};

const notificationSortingOptionStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  width: "100%",
  minHeight: "44px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "16px",
  border: "none",
  background: "transparent",
  color: "#FFFFFF",
  fontFamily: "inherit",
  fontSize: "18px",
  lineHeight: 1,
  fontWeight: 650,
  letterSpacing: "-0.035em",
  textAlign: "left",
  padding: "0 30px",
  cursor: "pointer",
  boxSizing: "border-box",
  ...safeTextStyle,
};

const notificationSortingOptionActiveStyle: CSSProperties = {
  ...notificationSortingOptionStyle,
  fontWeight: 900,
};

const notificationSortingOptionRadioStyle: CSSProperties = {
  flex: "0 0 auto",
  width: "23px",
  height: "23px",
  borderRadius: "999px",
  border: "2.5px solid rgba(161,161,170,0.72)",
  background: "transparent",
  color: "transparent",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  fontSize: "15px",
  lineHeight: 1,
  fontWeight: 900,
};

const notificationSortingOptionRadioActiveStyle: CSSProperties = {
  ...notificationSortingOptionRadioStyle,
  border: "2px solid #FFFFFF",
  background: "#FFFFFF",
  color: "#111111",
};

const notificationActionsSheetStyle: CSSProperties = {
  ...notificationSortingSheetStyle,
  maxHeight: "calc(100dvh - 116px)",
};

const desktopNotificationActionsSheetStyle: CSSProperties = {
  ...desktopNotificationSortingSheetStyle,
  maxHeight: "82vh",
};

const notificationActionsOptionStyle: CSSProperties = {
  ...notificationSortingOptionStyle,
  justifyContent: "flex-start",
  fontWeight: 900,
};

const notificationActionsOptionLinkStyle: CSSProperties = {
  ...notificationActionsOptionStyle,
  textDecoration: "none",
};

const notificationActionsOptionDisabledStyle: CSSProperties = {
  ...notificationActionsOptionStyle,
  opacity: 0.45,
  cursor: "not-allowed",
};

const notificationActionsDangerOptionStyle: CSSProperties = {
  ...notificationActionsOptionStyle,
  color: "var(--historietas-notificacoes-danger-text, #FCA5A5)",
};

const notificationActionsDangerOptionDisabledStyle: CSSProperties = {
  ...notificationActionsDangerOptionStyle,
  opacity: 0.45,
  cursor: "not-allowed",
};

const filterBoxStyle: CSSProperties = {
  position: "relative",
  marginTop: "12px",
  display: "grid",
  gap: "10px",
  padding: "12px",
  borderRadius: "22px",
  background: "rgba(4, 0, 10, 0.72)",
  border: "1px solid rgba(255,255,255,0.06)",
  boxShadow: "none",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "visible",
  boxSizing: "border-box",
};

const filterHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  flexWrap: "wrap",
  minWidth: 0,
  padding: "0 58px",
};

const filterHeaderTitleBoxStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  display: "grid",
  justifyItems: "center",
  textAlign: "center",
};

const desktopFilterHeaderTitleBoxStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  display: "grid",
  justifyItems: "center",
  textAlign: "center",
};

const miniTitleStyle: CSSProperties = {
  color: "var(--historietas-accent, var(--historietas-notificacoes-accent, #F97316))",
  fontSize: "10px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "0.09em",
  textTransform: "uppercase",
  textAlign: "center",
  ...safeTextStyle,
};

const filterTitleStyle: CSSProperties = {
  display: "none",
};

const filterResultBadgeStyle: CSSProperties = {
  position: "absolute",
  top: "12px",
  left: "12px",
  width: "fit-content",
  maxWidth: "calc(100% - 24px)",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "0",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "10px",
  fontWeight: 950,
  boxShadow: "none",
  ...safeTextStyle,
};

const searchInputStyle: CSSProperties = {
  width: "100%",
  minHeight: "42px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "var(--historietas-notificacoes-bg-deep, #04000A)",
  color: "#FFFFFF",
  padding: "0 13px",
  outline: "none",
  fontSize: "12px",
  fontWeight: 750,
  fontFamily: "inherit",
  textAlign: "center",
  boxSizing: "border-box",
  minWidth: 0,
  boxShadow: "none",
};





const filterFooterStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
  minWidth: 0,
};

const selectStyle: CSSProperties = {
  width: "100%",
  minHeight: "42px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "var(--historietas-notificacoes-bg-deep, #04000A)",
  color: "#FFFFFF",
  padding: "0 13px",
  outline: "none",
  fontSize: "12px",
  fontWeight: 850,
  fontFamily: "inherit",
  boxSizing: "border-box",
  minWidth: 0,
  textAlign: "center",
  boxShadow: "none",
};

const actionBarStyle: CSSProperties = {
  marginTop: "12px",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 168px), 1fr))",
  gap: "8px",
  minWidth: 0,
  maxWidth: "100%",
};

const buttonBaseStyle: CSSProperties = {
  minHeight: "34px",
  borderRadius: "999px",
  padding: "0 6px",
  color: "#FFFFFF",
  fontWeight: 900,
  fontSize: "10.5px",
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "center",
  boxSizing: "border-box",
  maxWidth: "100%",
  WebkitTapHighlightColor: "transparent",
  boxShadow: "none",
  ...safeTextStyle,
};

const primaryButtonStyle: CSSProperties = {
  ...buttonBaseStyle,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "var(--historietas-notificacoes-surface, #08030F)",
  boxShadow: "none",
};

const secondaryButtonStyle: CSSProperties = {
  ...buttonBaseStyle,
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "var(--historietas-text-secondary, #D4D4D8)",
};

const secondaryLinkButtonStyle: CSSProperties = {
  ...secondaryButtonStyle,
  textDecoration: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const fullWidthSecondaryLinkButtonStyle: CSSProperties = {
  ...secondaryLinkButtonStyle,
  gridColumn: "1 / -1",
  minHeight: "32px",
};

const dangerButtonStyle: CSSProperties = {
  ...buttonBaseStyle,
  border: "1px solid var(--historietas-notificacoes-danger-border, rgba(239,68,68,0.18))",
  background: "var(--historietas-notificacoes-danger-bg, rgba(239,68,68,0.075))",
  color: "var(--historietas-notificacoes-danger-text, #FCA5A5)",
};

const listStyle: CSSProperties = {
  marginTop: "9px",
  display: "grid",
  gap: 0,
  minWidth: 0,
  maxWidth: "100%",
};

const cardStyle: CSSProperties = {
  position: "relative",
  borderRadius: 0,
  padding: "8px 0",
  background: "transparent",
  border: "0",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "none",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "visible",
  boxSizing: "border-box",
};

const readCardStyle: CSSProperties = {
  ...cardStyle,
  background: "transparent",
  border: "0",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
  opacity: 0.78,
  boxShadow: "none",
};

const communityCardStyle: CSSProperties = {
  ...cardStyle,
  background: "transparent",
  border: "0",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "none",
};

const readCommunityCardStyle: CSSProperties = {
  ...communityCardStyle,
  background: "transparent",
  border: "0",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
  opacity: 0.78,
  boxShadow: "none",
};

const cardHeaderStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "38px minmax(0, 1fr)",
  alignItems: "start",
  gap: "6px",
  minWidth: 0,
  maxWidth: "100%",
};

const notificationIconStyle: CSSProperties = {
  width: "38px",
  height: "38px",
  borderRadius: "14px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--historietas-notificacoes-surface, #08030F)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#FFFFFF",
  fontSize: "18px",
  fontWeight: 950,
  lineHeight: 1,
  textDecoration: "none",
  boxShadow: "none",
  flex: "0 0 auto",
  transform: "translateY(-2px)",
};

const unreadNotificationIconStyle: CSSProperties = {
  ...notificationIconStyle,
  background: "var(--historietas-notificacoes-danger-surface, rgba(127,29,29,0.24))",
  border: "1px solid var(--historietas-notificacoes-danger-strong, rgba(248,113,113,0.36))",
  color: "#FFFFFF",
  boxShadow: "none",
};

const readNotificationIconStyle: CSSProperties = {
  ...notificationIconStyle,
  background: "var(--historietas-notificacoes-success-bg, rgba(34,197,94,0.12))",
  border: "1px solid var(--historietas-notificacoes-success-border, rgba(34,197,94,0.18))",
  color: "#FFFFFF",
  boxShadow: "none",
};

const communityNotificationIconStyle: CSSProperties = {
  ...notificationIconStyle,
  background: "var(--historietas-notificacoes-surface, #08030F)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#FFFFFF",
};

const cardHeaderTextStyle: CSSProperties = {
  display: "grid",
  gap: "1px",
  paddingTop: "0",
  minWidth: 0,
  maxWidth: "100%",
  textAlign: "left",
  justifyItems: "stretch",
};

const notificationOriginRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  flexWrap: "wrap",
  minWidth: 0,
};

const chapterOriginBadgeStyle: CSSProperties = {
  minHeight: "22px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0 8px",
  borderRadius: "999px",
  background: "var(--historietas-notificacoes-accent-bg, rgba(249,115,22,0.12))",
  border: "1px solid var(--historietas-notificacoes-accent-border, rgba(249,115,22,0.20))",
  color: "var(--historietas-accent, var(--historietas-notificacoes-accent, #F97316))",
  fontSize: "9px",
  fontWeight: 950,
  textTransform: "uppercase",
  letterSpacing: "0.055em",
};

const communityOriginBadgeStyle: CSSProperties = {
  ...chapterOriginBadgeStyle,
  background: "var(--historietas-notificacoes-secondary-bg, rgba(124,58,237,0.16))",
  border: "1px solid var(--historietas-notificacoes-secondary-border, rgba(124,58,237,0.26))",
  color: "var(--historietas-notificacoes-purple-text, #DDD6FE)",
};

const notificationKindBadgeStyle: CSSProperties = {
  minHeight: "22px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0 8px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.045)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "9px",
  fontWeight: 900,
  ...safeTextStyle,
};

const notificationTitleStyle: CSSProperties = {
  margin: 0,
  color: "#FFFFFF",
  fontSize: "16px",
  lineHeight: 1.02,
  fontWeight: 950,
  letterSpacing: "-0.055em",
  ...safeTextStyle,
};

const notificationTitleRowStyle: CSSProperties = {
  position: "relative",
  display: "block",
  paddingRight: "28px",
  minWidth: 0,
  maxWidth: "100%",
};

const cardMenuWrapperStyle: CSSProperties = {
  position: "absolute",
  top: "-3px",
  right: 0,
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "flex-end",
  minWidth: 0,
  zIndex: 20,
};

const cardMenuButtonStyle: CSSProperties = {
  width: "22px",
  height: "22px",
  borderRadius: "999px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "transparent",
  border: "none",
  color: "#FFFFFF",
  fontSize: "22px",
  lineHeight: 1,
  fontWeight: 950,
  cursor: "pointer",
  fontFamily: "inherit",
  boxShadow: "none",
  WebkitTapHighlightColor: "transparent",
};








const communityDateTextStyle: CSSProperties = {
  display: "block",
  width: "100%",
  margin: "0",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "9.5px",
  lineHeight: 1.12,
  fontWeight: 850,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  textAlign: "left",
  justifySelf: "stretch",
  ...safeTextStyle,
};

const notificationMessageStyle: CSSProperties = {
  width: "100%",
  margin: "1px 0 0",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11px",
  lineHeight: 1.28,
  fontWeight: 700,
  textAlign: "left",
  justifySelf: "stretch",
  ...safeTextStyle,
};

const metaGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: 0,
  marginTop: "3px",
  minWidth: 0,
  maxWidth: "100%",
};

const communityMetaGridStyle: CSSProperties = {
  ...metaGridStyle,
  gridTemplateColumns: "1fr",
};

const metaBoxStyle: CSSProperties = {
  display: "grid",
  gap: "2px",
  borderRadius: 0,
  padding: "4px 0",
  background: "transparent",
  border: "0",
  borderTop: "0",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
  boxSizing: "border-box",
};

const metaLabelStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "9px",
  fontWeight: 950,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  ...safeTextStyle,
};

const notificationAuthorInlineLinkStyle: CSSProperties = {
  ...metaLabelStyle,
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
};

const metaValueStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "12px",
  fontWeight: 900,
  ...safeTextStyle,
};

const communityCommentBoxStyle: CSSProperties = {
  display: "grid",
  gap: "3px",
  borderRadius: 0,
  padding: "4px 0 0",
  background: "transparent",
  border: "0",
  borderTop: "0",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
  boxSizing: "border-box",
  textAlign: "left",
};

const communityUpdateBoxStyle: CSSProperties = {
  display: "grid",
  gap: "3px",
  padding: "4px 0 0",
  background: "transparent",
  border: "0",
  borderTop: "0",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
  boxSizing: "border-box",
  textAlign: "left",
};

const communityInlineStatusStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: "6px",
  color: "#FFFFFF",
  fontSize: "11px",
  fontWeight: 900,
  lineHeight: 1.2,
  textAlign: "left",
  whiteSpace: "nowrap",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const communityInlineStatusDotStyle: CSSProperties = {
  color: "rgba(255,255,255,0.62)",
  fontSize: "10px",
  lineHeight: 1,
  flex: "0 0 auto",
};

const communityCommentTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11px",
  lineHeight: 1.3,
  fontWeight: 720,
  textAlign: "left",
  ...safeTextStyle,
};

const cardActionsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "5px",
  marginTop: "3px",
  minWidth: 0,
  maxWidth: "100%",
};

const communityCardActionsStyle: CSSProperties = {
  ...cardActionsStyle,
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
};

const openChapterLinkStyle: CSSProperties = {
  minHeight: "34px",
  borderRadius: "999px",
  background: "var(--historietas-notificacoes-surface, #08030F)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "10.5px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 6px",
  boxSizing: "border-box",
  boxShadow: "none",
  ...safeTextStyle,
};

const emptyStyle: CSSProperties = {
  marginTop: "12px",
  borderRadius: "24px",
  padding: "24px 18px",
  background: "rgba(4, 0, 10, 0.72)",
  border: "1px solid rgba(255,255,255,0.06)",
  textAlign: "center",
  display: "grid",
  justifyItems: "center",
  gap: "9px",
  minWidth: 0,
  overflow: "hidden",
  boxShadow: "none",
};

const desktopContainerStyle: CSSProperties = {
  ...containerStyle,
  width: "min(1220px, calc(100% - 64px))",
  padding: "14px 0 40px",
};

const desktopTopStyle: CSSProperties = {
  ...topStyle,
  marginBottom: "13px",
};

const desktopHeroStyle: CSSProperties = {
  ...heroStyle,
  padding: "20px 28px",
  borderRadius: "32px",
  minHeight: "138px",
  display: "grid",
  alignContent: "center",
};

const desktopTitleStyle: CSSProperties = {
  ...titleStyle,
  margin: "0 auto",
  fontSize: "clamp(46px, 4.7vw, 72px)",
  lineHeight: 0.94,
  maxWidth: "760px",
};

const desktopDescriptionStyle: CSSProperties = {
  ...descriptionStyle,
  margin: "10px auto 0",
  fontSize: "15px",
  lineHeight: 1.62,
  maxWidth: "680px",
};


const desktopFilterBoxStyle: CSSProperties = {
  ...filterBoxStyle,
  padding: "16px",
  borderRadius: "24px",
  gap: "12px",
};

const desktopFilterHeaderStyle: CSSProperties = {
  ...filterHeaderStyle,
  flexWrap: "nowrap",
};

const desktopSearchInputStyle: CSSProperties = {
  ...searchInputStyle,
  minHeight: "44px",
  fontSize: "13px",
};


const desktopFilterFooterStyle: CSSProperties = {
  ...filterFooterStyle,
  gridTemplateColumns: "minmax(220px, 280px) auto",
  alignItems: "center",
  justifyContent: "start",
  gap: "10px",
};

const desktopActionBarStyle: CSSProperties = {
  ...actionBarStyle,
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "10px",
};

const desktopListStyle: CSSProperties = {
  ...listStyle,
  gridTemplateColumns: "1fr",
  gap: 0,
  alignItems: "stretch",
};

const desktopCardStyle: CSSProperties = {
  ...cardStyle,
  padding: "10px 0",
  borderRadius: 0,
};

const desktopReadCardStyle: CSSProperties = {
  ...readCardStyle,
  padding: "10px 0",
  borderRadius: 0,
};

const desktopCommunityCardStyle: CSSProperties = {
  ...communityCardStyle,
  padding: "10px 0",
  borderRadius: 0,
};

const desktopReadCommunityCardStyle: CSSProperties = {
  ...readCommunityCardStyle,
  padding: "10px 0",
  borderRadius: 0,
};

const desktopMetaGridStyle: CSSProperties = {
  ...metaGridStyle,
  gridTemplateColumns: "1fr",
  gap: 0,
};

const desktopCommunityMetaGridStyle: CSSProperties = {
  ...communityMetaGridStyle,
  gridTemplateColumns: "1fr",
  gap: 0,
};

const desktopCardActionsStyle: CSSProperties = {
  ...cardActionsStyle,
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "6px",
};

const desktopCommunityCardActionsStyle: CSSProperties = {
  ...desktopCardActionsStyle,
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
};

const desktopEmptyStyle: CSSProperties = {
  ...emptyStyle,
  minHeight: "360px",
  padding: "34px",
};