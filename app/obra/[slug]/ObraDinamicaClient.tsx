"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useHistorietasLanguage } from "../../../components/HistorietasLanguageProvider";
import type { HistorietasLanguage } from "../../../lib/i18n";
import { createPortal } from "react-dom";
import { useParams, useRouter } from "next/navigation";
import type { CSSProperties, FormEvent, TouchEvent } from "react";
import { supabase } from "../../../lib/supabase/client";
import { useNotificacoes } from "../../../components/NotificacoesProvider";
import { historietasThemeCss, useHistorietasTheme } from "../../../lib/historietasTheme";
import { criarSlugBase, formatarData, formatarNumeroCompacto, formatarTamanhoArquivo, idObraSupabaseValido, normalizarTexto, obterNumeroSeguro } from "../../../lib/utils";

const FOLLOWED_WORKS_STORAGE_KEY = "historietas-obras-seguidas";
const LIKED_WORKS_STORAGE_KEY = "historietas-obras-curtidas";
const RATED_WORKS_STORAGE_KEY = "historietas-obras-avaliacoes";
const FAVORITES_STORAGE_KEY = "historietas-obras-favoritas";
const COMPLETED_STORAGE_KEY = "historietas-obras-concluidas";
const LOCAL_WORKS_STORAGE_KEY = "historietas-obras";
const FILE_BACKUP_STORAGE_KEY = "historietas-arquivos-obras-backup";
const PRIVATE_WORK_FILES_BUCKET = "arquivos-obras";
const PRIVATE_WORK_FILE_SIGNED_URL_TTL_SECONDS = 60 * 60 * 6;
const WORK_COMMENTS_STORAGE_KEY = "historietas-comentarios-obras";
const WORK_COMMENT_LIKES_TABLE = "comentarios_obras_curtidas";
const VERSAO_INTERACOES_OBRA_PUBLICA = "fix-interacoes-obra-2026-06-16-0022";

type TraducaoObraDinamica = {
  en: string;
  es: string;
};

const OBRA_DINAMICA_UI_TRANSLATIONS: Record<string, TraducaoObraDinamica> = {
  "Carregando": { en: "Loading", es: "Cargando" },
  "Carregando obra": { en: "Loading work", es: "Cargando obra" },
  "Obra não encontrada": { en: "Work not found", es: "Obra no encontrada" },
  "Obra sem título": { en: "Untitled work", es: "Obra sin título" },
  "Capítulo sem título": { en: "Untitled chapter", es: "Capítulo sin título" },
  "Autor não informado": { en: "Author not provided", es: "Autor no informado" },
  "Não informado": { en: "Not provided", es: "No informado" },
  "Não informada": { en: "Not provided", es: "No informada" },
  "Nenhuma sinopse informada.": { en: "No synopsis provided.", es: "No se proporcionó una sinopsis." },
  "nenhuma sinopse informada": { en: "no synopsis provided", es: "sin sinopsis" },
  "sem tags": { en: "no tags", es: "sin etiquetas" },
  "Usuário": { en: "User", es: "Usuario" },
  "Você": { en: "You", es: "Tú" },
  "Por": { en: "By", es: "Por" },
  "Publicado": { en: "Published", es: "Publicado" },
  "Rascunho": { en: "Draft", es: "Borrador" },
  "Notificações": { en: "Notifications", es: "Notificaciones" },
  "Seguir obra": { en: "Follow work", es: "Seguir obra" },
  "✓ Seguindo": { en: "✓ Following", es: "✓ Siguiendo" },
  "Abrir ações da obra": { en: "Open work actions", es: "Abrir acciones de la obra" },
  "Ações": { en: "Actions", es: "Acciones" },
  "Arquivo anexado": { en: "Attached file", es: "Archivo adjunto" },
  "Salvar": { en: "Save", es: "Guardar" },
  "Salvo": { en: "Saved", es: "Guardado" },
  "Concluída": { en: "Completed", es: "Completada" },
  "Concluir": { en: "Mark as completed", es: "Marcar como completada" },
  "Compartilhar": { en: "Share", es: "Compartir" },
  "Link copiado!": { en: "Link copied!", es: "¡Enlace copiado!" },
  "Sinopse": { en: "Synopsis", es: "Sinopsis" },
  "AVALIE ESTA OBRA": { en: "RATE THIS WORK", es: "VALORA ESTA OBRA" },
  "COMUNIDADE": { en: "COMMUNITY", es: "COMUNIDAD" },
  "CAPÍTULOS": { en: "CHAPTERS", es: "CAPÍTULOS" },
  "Teoria": { en: "Theory", es: "Teoría" },
  "Review": { en: "Review", es: "Reseña" },
  "teorias": { en: "theories", es: "teorías" },
  "reviews": { en: "reviews", es: "reseñas" },
  "posts": { en: "posts", es: "publicaciones" },
  "visualizações": { en: "views", es: "visualizaciones" },
  "curtidas": { en: "likes", es: "me gusta" },
  "comentários": { en: "comments", es: "comentarios" },
  "seguidores": { en: "followers", es: "seguidores" },
  "disponíveis": { en: "available", es: "disponibles" },
  "em breve": { en: "coming soon", es: "próximamente" },
  "Responder": { en: "Reply", es: "Responder" },
  "Removendo...": { en: "Removing...", es: "Eliminando..." },
  "Remover": { en: "Remove", es: "Eliminar" },
  "Remover curtida do comentário": { en: "Unlike comment", es: "Quitar Me gusta del comentario" },
  "Curtir comentário": { en: "Like comment", es: "Dar Me gusta al comentario" },
  "Fechar comentários": { en: "Close comments", es: "Cerrar comentarios" },
  "Recolher comentários": { en: "Collapse comments", es: "Contraer comentarios" },
  "Expandir comentários": { en: "Expand comments", es: "Expandir comentarios" },
  "1 comentário": { en: "1 comment", es: "1 comentario" },
  "Ordenar comentários": { en: "Sort comments", es: "Ordenar comentarios" },
  "Relevantes": { en: "Relevant", es: "Relevantes" },
  "Recentes": { en: "Recent", es: "Recientes" },
  "Ocultar respostas": { en: "Hide replies", es: "Ocultar respuestas" },
  "Carregando comentários": { en: "Loading comments", es: "Cargando comentarios" },
  "Sem comentários ainda": { en: "No comments yet", es: "Aún no hay comentarios" },
  "Adicionar comentário...": { en: "Add a comment...", es: "Añadir un comentario..." },
  "Entre para comentar.": { en: "Sign in to comment.", es: "Inicia sesión para comentar." },
  "Adicionar menção": { en: "Add mention", es: "Añadir mención" },
  "Enviar comentário": { en: "Send comment", es: "Enviar comentario" },
  "Enviando comentário": { en: "Sending comment", es: "Enviando comentario" },
  "Remover curtida": { en: "Unlike", es: "Quitar Me gusta" },
  "Curtir": { en: "Like", es: "Me gusta" },
  "Arquivo da obra": { en: "Work file", es: "Archivo de la obra" },
  "Preparando arquivo": { en: "Preparing file", es: "Preparando archivo" },
  "Preparando download": { en: "Preparing download", es: "Preparando descarga" },
  "Arquivo indisponível": { en: "File unavailable", es: "Archivo no disponible" },
  "Abrir arquivo": { en: "Open file", es: "Abrir archivo" },
  "Baixar arquivo": { en: "Download file", es: "Descargar archivo" },
  "Não foi possível liberar este arquivo agora.": { en: "This file could not be made available right now.", es: "No se pudo habilitar este archivo ahora." },
  "Não foi possível baixar o arquivo.": { en: "The file could not be downloaded.", es: "No se pudo descargar el archivo." },
  "Caminho do arquivo ausente.": { en: "File path is missing.", es: "Falta la ruta del archivo." },
  "Não foi possível criar a URL do arquivo.": { en: "The file URL could not be created.", es: "No se pudo crear la URL del archivo." },
  "Entre na sua conta para seguir esta obra.": { en: "Sign in to follow this work.", es: "Inicia sesión para seguir esta obra." },
  "Obra salva no navegador. Verifique o Supabase/RLS se não sincronizar online.": { en: "Work saved in the browser. Check Supabase/RLS if it does not sync online.", es: "Obra guardada en el navegador. Revisa Supabase/RLS si no se sincroniza en línea." },
  "Obra removida da lista no navegador. Verifique o Supabase/RLS se voltar depois.": { en: "Work removed from the browser list. Check Supabase/RLS if it appears again.", es: "Obra eliminada de la lista del navegador. Revisa Supabase/RLS si vuelve a aparecer." },
  "Entre na sua conta para curtir esta obra.": { en: "Sign in to like this work.", es: "Inicia sesión para dar Me gusta a esta obra." },
  "Não foi possível salvar a curtida da obra.": { en: "The work like could not be saved.", es: "No se pudo guardar el Me gusta de la obra." },
  "Não foi possível salvar a curtida agora.": { en: "The like could not be saved right now.", es: "No se pudo guardar el Me gusta ahora." },
  "Escreva um comentário antes de enviar.": { en: "Write a comment before sending.", es: "Escribe un comentario antes de enviarlo." },
  "Entre na sua conta para responder este comentário.": { en: "Sign in to reply to this comment.", es: "Inicia sesión para responder a este comentario." },
  "Entre na sua conta para comentar esta obra.": { en: "Sign in to comment on this work.", es: "Inicia sesión para comentar esta obra." },
  "Resposta salva neste aparelho.": { en: "Reply saved on this device.", es: "Respuesta guardada en este dispositivo." },
  "Comentário salvo neste aparelho.": { en: "Comment saved on this device.", es: "Comentario guardado en este dispositivo." },
  "Comentário não retornado pelo Supabase.": { en: "The comment was not returned by Supabase.", es: "Supabase no devolvió el comentario." },
  "Comentário inválido retornado pelo Supabase.": { en: "Supabase returned an invalid comment.", es: "Supabase devolvió un comentario no válido." },
  "Comentários inválidos retornados pelo Supabase.": { en: "Supabase returned invalid comments.", es: "Supabase devolvió comentarios no válidos." },
  "Não foi possível carregar os comentários agora.": { en: "Comments could not be loaded right now.", es: "No se pudieron cargar los comentarios ahora." },
  "Não foi possível enviar a resposta agora.": { en: "The reply could not be sent right now.", es: "No se pudo enviar la respuesta ahora." },
  "Não foi possível enviar o comentário agora.": { en: "The comment could not be sent right now.", es: "No se pudo enviar el comentario ahora." },
  "Entre na sua conta para remover este comentário.": { en: "Sign in to remove this comment.", es: "Inicia sesión para eliminar este comentario." },
  "Não foi possível remover o comentário agora.": { en: "The comment could not be removed right now.", es: "No se pudo eliminar el comentario ahora." },
  "Entre na sua conta para curtir comentários.": { en: "Sign in to like comments.", es: "Inicia sesión para dar Me gusta a los comentarios." },
  "Não foi possível atualizar a curtida do comentário agora.": { en: "The comment like could not be updated right now.", es: "No se pudo actualizar el Me gusta del comentario ahora." },
  "Entre na sua conta para salvar esta obra.": { en: "Sign in to save this work.", es: "Inicia sesión para guardar esta obra." },
  "Obra removida da lista.": { en: "Work removed from the list.", es: "Obra eliminada de la lista." },
  "Não foi possível salvar na lista agora.": { en: "The work could not be saved to the list right now.", es: "No se pudo guardar la obra en la lista ahora." },
  "Entre na sua conta para marcar esta obra como concluída.": { en: "Sign in to mark this work as completed.", es: "Inicia sesión para marcar esta obra como completada." },
  "Obra marcada como concluída.": { en: "Work marked as completed.", es: "Obra marcada como completada." },
  "Obra removida das concluídas.": { en: "Work removed from completed works.", es: "Obra eliminada de las completadas." },
  "Não foi possível marcar como concluída agora.": { en: "The work could not be marked as completed right now.", es: "No se pudo marcar la obra como completada ahora." },
  "Entre na sua conta para avaliar esta obra.": { en: "Sign in to rate this work.", es: "Inicia sesión para valorar esta obra." },
  "Compartilhamento da obra aberto.": { en: "Work sharing opened.", es: "Se abrió la opción de compartir la obra." },
  "Não foi possível copiar o link.": { en: "The link could not be copied.", es: "No se pudo copiar el enlace." },
  "Não consegui compartilhar nem copiar o link da obra neste navegador.": { en: "The work could not be shared or its link copied in this browser.", es: "No se pudo compartir la obra ni copiar su enlace en este navegador." },
  "agora": { en: "now", es: "ahora" },
  "Fantasia": { en: "Fantasy", es: "Fantasía" },
  "Terror": { en: "Horror", es: "Terror" },
  "Ficção": { en: "Fiction", es: "Ficción" },
  "Romance": { en: "Romance", es: "Romance" },
  "Drama": { en: "Drama", es: "Drama" },
  "Ação": { en: "Action", es: "Acción" },
  "Mistério": { en: "Mystery", es: "Misterio" },
  "Suspense": { en: "Thriller", es: "Suspenso" },
  "Aventura": { en: "Adventure", es: "Aventura" },
  "Comédia": { en: "Comedy", es: "Comedia" },
  "Webnovel": { en: "Web novel", es: "Novela web" },
  "Light novel": { en: "Light novel", es: "Novela ligera" },
  "Conto": { en: "Short story", es: "Cuento" },
  "Poesia": { en: "Poetry", es: "Poesía" },
  "HQ": { en: "Comic", es: "Cómic" },
  "Mangá": { en: "Manga", es: "Manga" },
  "Fanfic": { en: "Fanfiction", es: "Fanfic" },
  "Livre": { en: "All ages", es: "Todo público" },
  "Sombria": { en: "Dark", es: "Oscura" },
  "Psicológico": { en: "Psychological", es: "Psicológico" },
  "Sci-fi": { en: "Sci-fi", es: "Ciencia ficción" },
  "Cyberpunk": { en: "Cyberpunk", es: "Cyberpunk" },
  "Espacial": { en: "Space", es: "Espacial" },
  "Isekai": { en: "Isekai", es: "Isekai" },
  "Distopia": { en: "Dystopia", es: "Distopía" },
  "Apocalipse": { en: "Apocalypse", es: "Apocalipsis" },
  "Escolar": { en: "School", es: "Escolar" },
  "Máfia": { en: "Mafia", es: "Mafia" },
  "Investigação": { en: "Investigation", es: "Investigación" },
  "Religioso": { en: "Religious", es: "Religioso" },
  "Mitologia": { en: "Mythology", es: "Mitología" },
  "Folclore": { en: "Folklore", es: "Folclore" },
  "Vampiro": { en: "Vampire", es: "Vampiro" },
  "Lobisomem": { en: "Werewolf", es: "Hombre lobo" },
  "Zumbi": { en: "Zombie", es: "Zombi" },
  "Super-herói": { en: "Superhero", es: "Superhéroe" },
  "Magia": { en: "Magic", es: "Magia" },
  "Guerra": { en: "War", es: "Guerra" },
  "Família": { en: "Family", es: "Familia" },
  "Amizade": { en: "Friendship", es: "Amistad" },
  "Traição": { en: "Betrayal", es: "Traición" },
  "Vingança": { en: "Revenge", es: "Venganza" },
  "Sobrevivência": { en: "Survival", es: "Supervivencia" },
};

function traduzirTextoObraDinamica(
  texto: string,
  idioma: HistorietasLanguage,
) {
  if (idioma === "pt-BR" || !texto) {
    return texto;
  }

  const partes = /^(\s*)([\s\S]*?)(\s*)$/.exec(texto);
  const inicio = partes?.[1] || "";
  const conteudo = partes?.[2] || texto;
  const fim = partes?.[3] || "";
  const traducaoExata = OBRA_DINAMICA_UI_TRANSLATIONS[conteudo];

  if (traducaoExata) {
    return `${inicio}${idioma === "en" ? traducaoExata.en : traducaoExata.es}${fim}`;
  }

  let correspondencia = /^Notificações:\s*(\d+)\s*não lidas$/i.exec(conteudo);

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Notifications: ${correspondencia[1]} unread${fim}`
      : `${inicio}Notificaciones: ${correspondencia[1]} sin leer${fim}`;
  }

  correspondencia = /^Por\s+(.+)$/i.exec(conteudo);

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}By ${correspondencia[1]}${fim}`
      : `${inicio}Por ${correspondencia[1]}${fim}`;
  }

  correspondencia = /^Comentários de\s+(.+)$/i.exec(conteudo);

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Comments on ${correspondencia[1]}${fim}`
      : `${inicio}Comentarios de ${correspondencia[1]}${fim}`;
  }

  correspondencia = /^Abrir perfil do autor\s+(.+)$/i.exec(conteudo);

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Open author profile for ${correspondencia[1]}${fim}`
      : `${inicio}Abrir perfil del autor ${correspondencia[1]}${fim}`;
  }

  correspondencia = /^Abrir perfil de\s+(.+)$/i.exec(conteudo);

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Open ${correspondencia[1]}'s profile${fim}`
      : `${inicio}Abrir perfil de ${correspondencia[1]}${fim}`;
  }

  correspondencia = /^Ações da obra\s+(.+)$/i.exec(conteudo);

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Actions for ${correspondencia[1]}${fim}`
      : `${inicio}Acciones de la obra ${correspondencia[1]}${fim}`;
  }

  correspondencia = /^(\d+)\s+comentários$/i.exec(conteudo);

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}${correspondencia[1]} comments${fim}`
      : `${inicio}${correspondencia[1]} comentarios${fim}`;
  }

  correspondencia = /^(\d+)\s+avaliações$/i.exec(conteudo);

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}${correspondencia[1]} ratings${fim}`
      : `${inicio}${correspondencia[1]} valoraciones${fim}`;
  }

  correspondencia = /^(\d+)\s+(disponíveis|em breve)$/i.exec(conteudo);

  if (correspondencia) {
    const quantidade = correspondencia[1];
    const disponivel = correspondencia[2].toLowerCase() === "disponíveis";

    return idioma === "en"
      ? `${inicio}${quantidade} ${disponivel ? "available" : "coming soon"}${fim}`
      : `${inicio}${quantidade} ${disponivel ? "disponibles" : "próximamente"}${fim}`;
  }

  correspondencia = /^Ver\s+(\d+)\s+(resposta|respostas)$/i.exec(conteudo);

  if (correspondencia) {
    const quantidade = Number(correspondencia[1]);

    return idioma === "en"
      ? `${inicio}View ${quantidade} ${quantidade === 1 ? "reply" : "replies"}${fim}`
      : `${inicio}Ver ${quantidade} ${quantidade === 1 ? "respuesta" : "respuestas"}${fim}`;
  }

  correspondencia = /^Adicionar\s+(.+)\s+ao comentário$/i.exec(conteudo);

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Add ${correspondencia[1]} to comment${fim}`
      : `${inicio}Añadir ${correspondencia[1]} al comentario${fim}`;
  }

  correspondencia = /^Avaliar com\s+([\d,.]+)\s+estrela(s)?$/i.exec(conteudo);

  if (correspondencia) {
    const plural = Boolean(correspondencia[2]);

    return idioma === "en"
      ? `${inicio}Rate ${correspondencia[1]} ${plural ? "stars" : "star"}${fim}`
      : `${inicio}Valorar con ${correspondencia[1]} ${plural ? "estrellas" : "estrella"}${fim}`;
  }

  correspondencia = /^Média\s+(.+)\s+de\s+5$/i.exec(conteudo);

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Average ${correspondencia[1]} out of 5${fim}`
      : `${inicio}Media de ${correspondencia[1]} sobre 5${fim}`;
  }

  correspondencia = /^há\s+(\d+)\s+(segundo|segundos|minuto|minutos|hora|horas|dia|dias)$/i.exec(conteudo);

  if (correspondencia) {
    const quantidade = Number(correspondencia[1]);
    const unidade = correspondencia[2].toLowerCase();
    const singular = quantidade === 1;
    const unidadesEn: Record<string, string> = {
      segundo: "second",
      segundos: "seconds",
      minuto: "minute",
      minutos: "minutes",
      hora: "hour",
      horas: "hours",
      dia: "day",
      dias: "days",
    };
    const unidadesEs: Record<string, string> = {
      segundo: "segundo",
      segundos: "segundos",
      minuto: "minuto",
      minutos: "minutos",
      hora: "hora",
      horas: "horas",
      dia: "día",
      dias: "días",
    };
    const unidadeTraduzida =
      idioma === "en" ? unidadesEn[unidade] : unidadesEs[unidade];

    return idioma === "en"
      ? `${inicio}${quantidade} ${unidadeTraduzida} ago${fim}`
      : `${inicio}hace ${quantidade} ${unidadeTraduzida}${fim}`;
  }

  correspondencia = /^Abrir arquivo\s+(.+)$/i.exec(conteudo);

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Open file ${correspondencia[1]}${fim}`
      : `${inicio}Abrir archivo ${correspondencia[1]}${fim}`;
  }

  correspondencia = /^Prévia do arquivo\s+(.+)$/i.exec(conteudo);

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Preview of file ${correspondencia[1]}${fim}`
      : `${inicio}Vista previa del archivo ${correspondencia[1]}${fim}`;
  }

  correspondencia = /^Abrir\s+(.+)\.\s+Total:\s+(.+)$/i.exec(conteudo);

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Open ${correspondencia[1]}. Total: ${correspondencia[2]}${fim}`
      : `${inicio}Abrir ${correspondencia[1]}. Total: ${correspondencia[2]}${fim}`;
  }

  correspondencia = /^Abrir\s+(.+)\s+desta obra na Comunidade$/i.exec(conteudo);

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Open this work's ${correspondencia[1]} in Community${fim}`
      : `${inicio}Abrir ${correspondencia[1]} de esta obra en la Comunidad${fim}`;
  }

  correspondencia = /^(Remover curtida|Curtir)\.\s+(.+)\s+curtidas$/i.exec(conteudo);

  if (correspondencia) {
    const remover = correspondencia[1].toLowerCase().startsWith("remover");

    return idioma === "en"
      ? `${inicio}${remover ? "Unlike" : "Like"}. ${correspondencia[2]} likes${fim}`
      : `${inicio}${remover ? "Quitar Me gusta" : "Me gusta"}. ${correspondencia[2]} Me gusta${fim}`;
  }

  correspondencia = /^Adicionou\s+(.+)\s+à lista\.$/i.exec(conteudo);

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Added ${correspondencia[1]} to the list.${fim}`
      : `${inicio}Añadió ${correspondencia[1]} a la lista.${fim}`;
  }

  correspondencia = /^Concluiu\s+(.+)\.$/i.exec(conteudo);

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Completed ${correspondencia[1]}.${fim}`
      : `${inicio}Completó ${correspondencia[1]}.${fim}`;
  }

  correspondencia = /^Avaliou\s+(.+)\s+com\s+([\d,.]+)\s+estrelas\.$/i.exec(conteudo);

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Rated ${correspondencia[1]} ${correspondencia[2]} stars.${fim}`
      : `${inicio}Valoró ${correspondencia[1]} con ${correspondencia[2]} estrellas.${fim}`;
  }

  correspondencia = /^([\d.,]+)\s+mil$/i.exec(conteudo);

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}${correspondencia[1].replace(",", ".")}K${fim}`
      : `${inicio}${correspondencia[1]} mil${fim}`;
  }

  correspondencia = /^Abrir\s+(.+)$/i.exec(conteudo);

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Open ${correspondencia[1]}${fim}`
      : `${inicio}Abrir ${correspondencia[1]}${fim}`;
  }

  return texto;
}

function ObraDinamicaLanguageBridge() {
  const { language } = useHistorietasLanguage();

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const seletorRaiz =
      "[data-historietas-obra-dinamica-root='true'], [data-historietas-obra-comments-root='true']";

    type EstadoTraducaoObraDinamica = {
      original: string;
      traduzido: string;
    };

    const estadosTexto: WeakMap<Text, EstadoTraducaoObraDinamica> = new WeakMap();
    const estadosAtributos: WeakMap<
      Element,
      Map<string, EstadoTraducaoObraDinamica>
    > = new WeakMap();
    const textosAlterados = new Set<Text>();
    const atributosAlterados: Array<{ elemento: Element; atributo: string }> = [];
    const atributosTraduziveis = ["aria-label", "title", "placeholder", "alt"];
    let aplicando = false;

    function elementoEstaNaPagina(elemento: Element | null) {
      return Boolean(
        elemento?.matches(seletorRaiz) || elemento?.closest(seletorRaiz),
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

      const proximo = traduzirTextoObraDinamica(estado.original, language);
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

      const proximo = traduzirTextoObraDinamica(estado.original, language);
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
          aplicarAtributo(raiz, atributo),
        );

        const walker = document.createTreeWalker(
          raiz,
          NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
        );
        let atual: Node | null = walker.nextNode();

        while (atual) {
          if (atual.nodeType === Node.TEXT_NODE) {
            aplicarTexto(atual as Text);
          } else if (atual instanceof Element && !deveIgnorarElemento(atual)) {
            atributosTraduziveis.forEach((atributo) =>
              aplicarAtributo(atual as Element, atributo),
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
        document.querySelectorAll(seletorRaiz).forEach((raiz) => aplicarNo(raiz));
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

          if (mutacao.type === "attributes" && mutacao.target instanceof Element) {
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
          registro.elemento.getAttribute(registro.atributo) === estado.traduzido
        ) {
          registro.elemento.setAttribute(registro.atributo, estado.original);
        }
      });
    };
  }, [language]);

  return null;
}


function criarStorageKeyUsuarioObraPublica(chave: string, userId: string) {
  const userIdLimpo = userId.trim();

  return userIdLimpo ? `${chave}:${userIdLimpo}` : "";
}

function lerStorageUsuarioObraPublica(chave: string, userId: string) {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return null;
  }

  try {
    const chaveStorage = criarStorageKeyUsuarioObraPublica(chave, userIdLimpo);

    return chaveStorage ? localStorage.getItem(chaveStorage) : null;
  } catch {
    return null;
  }
}

function salvarStorageUsuarioObraPublica(
  chave: string,
  userId: string,
  valor: unknown
) {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return;
  }

  try {
    const chaveStorage = criarStorageKeyUsuarioObraPublica(chave, userIdLimpo);

    if (!chaveStorage) {
      return;
    }

    localStorage.setItem(chaveStorage, JSON.stringify(valor));
  } catch {
    // localStorage é fallback; a página continua com o estado em memória.
  }
}

type CapituloLocal = {
  id: string;
  titulo: string;
  texto: string;
  publicado?: boolean;
  curtiu: boolean;
  salvo: boolean;
  comentario: string;
  criadoEm: string;
  lido: boolean;
  lidoEm: string;
  totalCurtidas?: number;
  totalComentarios?: number;
  totalSalvos?: number;
  totalLidos?: number;
};

type ArquivoObraLocal = {
  nome: string;
  tipo: string;
  tamanho: number;
  conteudo: string;
  categoria: "texto" | "documento" | "imagem" | "outro";
  criadoEm: string;
};

type ArquivosObrasBackup = Record<string, ArquivoObraLocal>;

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
  arquivoObra?: ArquivoObraLocal | null;
  publicado: boolean;
  capitulos: CapituloLocal[];
  criadaEm: string;
  ultimoCapituloLidoId: string;
  ultimaLeituraEm: string;
  progressoLeitura: number;
  visualizacoes?: number;
  totalCurtidas?: number;
  totalComentarios?: number;
  totalFavoritos?: number;
  totalConcluidas?: number;
  slug: string;
  link: string;
};

type SupabaseObraRow = {
  id: string;
  user_id: string | null;
  titulo: string | null;
  autor: string | null;
  genero: string | null;
  formato: string | null;
  classificacao_indicativa: string | null;
  sinopse: string | null;
  tags: string[] | null;
  capa_url: string | null;
  capa_nome: string | null;
  arquivo_url: string | null;
  arquivo_nome: string | null;
  arquivo_tipo: string | null;
  arquivo_tamanho: number | null;
  arquivo_categoria: string | null;
  visualizacoes: number | null;
  views?: number | null;
  total_visualizacoes?: number | null;
  publicado: boolean | null;
  slug: string | null;
  link: string | null;
  criada_em: string | null;
  atualizado_em: string | null;
};

type SupabaseCapituloRow = {
  id: string;
  obra_id: string;
  user_id: string;
  titulo: string | null;
  texto?: string | null;
  ordem: number | null;
  publicado: boolean | null;
  criado_em: string | null;
  atualizado_em: string | null;
};

type SupabaseComunidadePostRow = {
  id: string;
  tipo_publicacao: string | null;
  obra_relacionada: string | null;
};

type SupabaseProgressoLeituraObraPublicaRow = {
  obra_id: string | null;
  capitulo_id: string | null;
  lido: boolean | null;
  atualizado_em: string | null;
};

type CapituloDinamico = {
  id: string;
  numero: string;
  titulo: string;
  descricao: string;
  href: string;
  disponivel: boolean;
  lido: boolean;
  lidoEm: string;
};

type ObraDinamica = {
  id: string;
  origem: "local";
  titulo: string;
  autor: string;
  autorId?: string;
  genero: string;
  formato: string;
  classificacaoIndicativa: string;
  status: string;
  views: string;
  likes: string;
  comentarios: string;
  disponivel: boolean;
  slug: string;
  link: string;
  sinopse: string;
  tags: string[];
  capa: string;
  arquivoObra: ArquivoObraLocal | null;
  capitulos: CapituloDinamico[];
  ultimoCapituloLidoId: string;
  ultimaLeituraEm: string;
  progressoLeitura: number;
};

type PerfilPublicoObra = {
  userId: string;
  nome: string;
  avatar: string;
  bio: string;
};

type ComentarioObraPublico = {
  id: string;
  obraId: string;
  userId: string;
  nome: string;
  avatar: string;
  texto: string;
  criadoEm: string;
  comentarioPaiId: string;
  local: boolean;
  curtidas: string[];
};

type SupabaseComentarioObraRow = {
  id: string;
  obra_id: string;
  user_id: string;
  comentario: string | null;
  comentario_pai_id: string | null;
  criado_em: string | null;
};

type RespostaComentarioObra = {
  comentarioPaiId: string;
  autorId: string;
  autorNome: string;
};

type OrdenacaoComentariosObra = "relevantes" | "recentes";

type SupabaseCurtidaComentarioObraRow = {
  comentario_id: string | null;
  usuario_id: string | null;
};

type MetricasObraPublica = {
  visualizacoes: number;
  curtidas: number;
  comentarios: number;
  seguidores: number;
  curtidaAtiva: boolean;
  carregado: boolean;
};

type MetricasComunidadeObra = {
  teorias: number;
  reviews: number;
  posts: number;
  carregado: boolean;
};

type AvaliacaoObraPublica = {
  media: number;
  total: number;
  minhaNota: number;
  carregado: boolean;
  salvando: boolean;
};

const NOTAS_AVALIACAO_OBRA = [1, 2, 3, 4, 5] as const;

const metricasObraVazias: MetricasObraPublica = {
  visualizacoes: 0,
  curtidas: 0,
  comentarios: 0,
  seguidores: 0,
  curtidaAtiva: false,
  carregado: false,
};

const metricasComunidadeObraVazias: MetricasComunidadeObra = {
  teorias: 0,
  reviews: 0,
  posts: 0,
  carregado: false,
};

const avaliacaoObraVazia: AvaliacaoObraPublica = {
  media: 0,
  total: 0,
  minhaNota: 0,
  carregado: false,
  salvando: false,
};


async function criarLoginHrefObraPublica() {
  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.pathname}${window.location.search}`
      : "/obra";
  const destinoSeguro =
    redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : "/obra";
  const params = new URLSearchParams({
    redirectTo: destinoSeguro,
  });

  return `/login?${params.toString()}`;
}

function formatarGeneroObraPublica(genero: string) {
  const generoLimpo = genero.trim();
  const generoNormalizado = normalizarTexto(generoLimpo);

  if (generoNormalizado === "fantasia sombria") {
    return "Fantasia";
  }

  if (generoNormalizado === "sci-fi" || generoNormalizado === "sci fi") {
    return "Ficção";
  }

  return generoLimpo || "Não informado";
}

function calcularProgressoLeitura(capitulos: CapituloLocal[]) {
  if (capitulos.length === 0) {
    return 0;
  }

  const capitulosLidos = capitulos.filter((capitulo) => capitulo.lido).length;

  return Math.round((capitulosLidos / capitulos.length) * 100);
}

function normalizarArquivoObra(valor: unknown): ArquivoObraLocal | null {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) {
    return null;
  }

  const arquivo = valor as Partial<ArquivoObraLocal>;

  if (
    typeof arquivo.nome !== "string" ||
    !arquivo.nome.trim() ||
    typeof arquivo.conteudo !== "string" ||
    !arquivo.conteudo.trim()
  ) {
    return null;
  }

  let categoria: ArquivoObraLocal["categoria"] = "outro";

  if (
    arquivo.categoria === "texto" ||
    arquivo.categoria === "documento" ||
    arquivo.categoria === "imagem" ||
    arquivo.categoria === "outro"
  ) {
    categoria = arquivo.categoria;
  }

  return {
    nome: arquivo.nome,
    tipo: typeof arquivo.tipo === "string" ? arquivo.tipo : "",
    tamanho:
      typeof arquivo.tamanho === "number" && Number.isFinite(arquivo.tamanho)
        ? arquivo.tamanho
        : 0,
    conteudo: arquivo.conteudo,
    categoria,
    criadoEm: typeof arquivo.criadoEm === "string" ? arquivo.criadoEm : "",
  };
}

function carregarBackupArquivosObras(userId = ""): ArquivosObrasBackup {
  if (typeof window === "undefined" || !userId.trim()) {
    return {};
  }

  try {
    const backupTexto = lerStorageUsuarioObraPublica(FILE_BACKUP_STORAGE_KEY, userId);
    const backupJson: unknown = backupTexto ? JSON.parse(backupTexto) : {};

    if (!backupJson || typeof backupJson !== "object" || Array.isArray(backupJson)) {
      return {};
    }

    const backupNormalizado: ArquivosObrasBackup = {};

    Object.entries(backupJson as Record<string, unknown>).forEach(([chave, arquivo]) => {
      const arquivoNormalizado = normalizarArquivoObra(arquivo);

      if (chave.trim() && arquivoNormalizado) {
        backupNormalizado[chave] = arquivoNormalizado;
      }
    });

    salvarStorageUsuarioObraPublica(
      FILE_BACKUP_STORAGE_KEY,
      userId,
      backupNormalizado
    );

    return backupNormalizado;
  } catch {
    return {};
  }
}

function obterChavesBackupObra(obra: Pick<ObraLocal, "id" | "slug" | "titulo">) {
  return Array.from(
    new Set(
      [obra.id, obra.slug, criarSlugBase(obra.titulo)].filter((chave) =>
        Boolean(chave.trim())
      )
    )
  );
}

function sincronizarBackupArquivosObras(obrasLocais: ObraLocal[], userId = "") {
  if (typeof window === "undefined" || !userId.trim()) {
    return;
  }

  try {
    const backupAtual = carregarBackupArquivosObras(userId);

    obrasLocais.forEach((obraLocal) => {
      if (!obraLocal.arquivoObra) {
        return;
      }

      obterChavesBackupObra(obraLocal).forEach((chave) => {
        backupAtual[chave] = obraLocal.arquivoObra as ArquivoObraLocal;
      });
    });

    salvarStorageUsuarioObraPublica(FILE_BACKUP_STORAGE_KEY, userId, backupAtual);
  } catch {
    // Backup é apenas proteção extra. Não deve travar a página pública.
  }
}

function restaurarArquivoObraComBackup(
  obraLocal: ObraLocal,
  backup: ArquivosObrasBackup
): ObraLocal {
  if (obraLocal.arquivoObra) {
    return obraLocal;
  }

  const arquivoBackup = obterChavesBackupObra(obraLocal)
    .map((chave) => normalizarArquivoObra(backup[chave]))
    .find((arquivo): arquivo is ArquivoObraLocal => Boolean(arquivo));

  if (!arquivoBackup) {
    return obraLocal;
  }

  return {
    ...obraLocal,
    arquivoObra: arquivoBackup,
  };
}

function normalizarCapituloLocal(
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
        ? capitulo.titulo
        : "Capítulo sem título",
    texto: typeof capitulo.texto === "string" ? capitulo.texto : "",
    publicado: capitulo.publicado !== false,
    curtiu: Boolean(capitulo.curtiu),
    salvo: Boolean(capitulo.salvo),
    comentario:
      typeof capitulo.comentario === "string" ? capitulo.comentario : "",
    criadoEm: typeof capitulo.criadoEm === "string" ? capitulo.criadoEm : "",
    lido: Boolean(capitulo.lido),
    lidoEm: typeof capitulo.lidoEm === "string" ? capitulo.lidoEm : "",
    totalCurtidas: normalizarContadorObraPublica(
      (capitulo as Record<string, unknown>).totalCurtidas ??
        (capitulo as Record<string, unknown>).total_curtidas
    ),
    totalComentarios: normalizarContadorObraPublica(
      (capitulo as Record<string, unknown>).totalComentarios ??
        (capitulo as Record<string, unknown>).total_comentarios
    ),
    totalSalvos: normalizarContadorObraPublica(
      (capitulo as Record<string, unknown>).totalSalvos ??
        (capitulo as Record<string, unknown>).total_salvos
    ),
    totalLidos: normalizarContadorObraPublica(
      (capitulo as Record<string, unknown>).totalLidos ??
        (capitulo as Record<string, unknown>).total_lidos
    ),
  };
}

function normalizarObraLocal(
  obra: Partial<ObraLocal> & Record<string, unknown>,
  index: number
): ObraLocal {
  const capitulosNormalizadosTodos: CapituloLocal[] = Array.isArray(obra.capitulos)
    ? obra.capitulos.map((capitulo, capituloIndex) =>
        normalizarCapituloLocal(
          capitulo as Partial<CapituloLocal>,
          capituloIndex
        )
      )
    : [];
  const capitulosNormalizados = capitulosNormalizadosTodos.filter(
    (capitulo) => capitulo.publicado !== false
  );

  const titulo =
    typeof obra.titulo === "string" && obra.titulo.trim()
      ? obra.titulo.trim()
      : "Obra sem título";

  const slug =
    typeof obra.slug === "string" && obra.slug.trim()
      ? obra.slug.trim()
      : criarSlugBase(titulo || `obra-${index + 1}`);

  const tagsNormalizadas = Array.isArray(obra.tags)
    ? obra.tags
        .filter((tag): tag is string => typeof tag === "string" && Boolean(tag.trim()))
        .map((tag) => tag.trim())
    : [];

  return {
    id:
      typeof obra.id === "string" && obra.id.trim()
        ? obra.id
        : `obra-${index + 1}`,
    titulo,
    autor:
      typeof obra.autor === "string" && obra.autor.trim()
        ? obra.autor
        : "Autor não informado",
    autorId:
      typeof obra.autorId === "string" && obra.autorId.trim()
        ? obra.autorId.trim()
        : typeof obra.user_id === "string" && obra.user_id.trim()
          ? obra.user_id.trim()
          : typeof obra.userId === "string" && obra.userId.trim()
            ? obra.userId.trim()
            : "",
    genero:
      typeof obra.genero === "string" && obra.genero.trim()
        ? obra.genero
        : "Não informado",
    formato:
      typeof obra.formato === "string" && obra.formato.trim()
        ? obra.formato
        : "Não informado",
    classificacaoIndicativa:
      typeof obra.classificacaoIndicativa === "string" &&
      obra.classificacaoIndicativa.trim()
        ? obra.classificacaoIndicativa
        : "Não informada",
    sinopse:
      typeof obra.sinopse === "string" && obra.sinopse.trim()
        ? obra.sinopse
        : "Nenhuma sinopse informada.",
    tags: tagsNormalizadas.length > 0 ? tagsNormalizadas : ["sem tags"],
    capa: typeof obra.capa === "string" ? obra.capa : "",
    capaNome: typeof obra.capaNome === "string" ? obra.capaNome : "",
    arquivoObra: normalizarArquivoObra(obra.arquivoObra),
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
    visualizacoes: normalizarContadorObraPublica(
      obra.visualizacoes ??
        obra.views ??
        obra.visualizacoesTotal ??
        obra.totalVisualizacoes ??
        obra.total_visualizacoes
    ),
    totalCurtidas: normalizarContadorObraPublica(
      obra.totalCurtidas ?? obra.total_curtidas
    ),
    totalComentarios: normalizarContadorObraPublica(
      obra.totalComentarios ?? obra.total_comentarios
    ),
    totalFavoritos: normalizarContadorObraPublica(
      obra.totalFavoritos ?? obra.total_favoritos
    ),
    totalConcluidas: normalizarContadorObraPublica(
      obra.totalConcluidas ?? obra.total_concluidas
    ),
    slug,
    link:
      typeof obra.link === "string" && obra.link.trim()
        ? obra.link
        : `/obra/${slug}`,
  };
}

function carregarObrasLocaisComBackup(userId = "") {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo) {
    return [];
  }

  const obrasLocaisTexto = lerStorageUsuarioObraPublica(
    LOCAL_WORKS_STORAGE_KEY,
    userIdLimpo
  );
  const obrasLocaisJson: unknown = obrasLocaisTexto
    ? JSON.parse(obrasLocaisTexto)
    : [];

  const backupArquivosObras = carregarBackupArquivosObras(userIdLimpo);

  const obrasNormalizadas = Array.isArray(obrasLocaisJson)
    ? obrasLocaisJson
        .map((obra, index) =>
          normalizarObraLocal(
            obra as Partial<ObraLocal> & Record<string, unknown>,
            index
          )
        )
        .map((obraLocal) =>
          restaurarArquivoObraComBackup(obraLocal, backupArquivosObras)
        )
    : [];

  const obrasPublicasLocais = obrasNormalizadas.filter((obraLocal) => {
    return obraLocal.publicado && obraLocal.capitulos.length > 0;
  });

  sincronizarBackupArquivosObras(obrasNormalizadas, userIdLimpo);

  return obrasPublicasLocais;
}

function normalizarCategoriaArquivoSupabase(
  categoria: string | null
): ArquivoObraLocal["categoria"] {
  if (
    categoria === "texto" ||
    categoria === "documento" ||
    categoria === "imagem" ||
    categoria === "outro"
  ) {
    return categoria;
  }

  return "outro";
}


function decodificarCaminhoArquivoObra(caminho: string) {
  try {
    return decodeURIComponent(caminho);
  } catch {
    return caminho;
  }
}

function normalizarCaminhoStorageArquivoObra(caminho: string) {
  const caminhoSemBusca = caminho.split("?")[0]?.split("#")[0] || "";
  const caminhoDecodificado = decodificarCaminhoArquivoObra(caminhoSemBusca)
    .replace(/^\/+/, "")
    .trim();
  const prefixos = [
    "storage/v1/object/sign/arquivos-obras/",
    "storage/v1/object/public/arquivos-obras/",
    "storage/v1/object/authenticated/arquivos-obras/",
    "storage/v1/object/arquivos-obras/",
    "arquivos-obras/",
  ];

  let caminhoObjeto = caminhoDecodificado;

  for (const prefixo of prefixos) {
    const indicePrefixo = caminhoDecodificado.indexOf(prefixo);

    if (indicePrefixo >= 0) {
      caminhoObjeto = caminhoDecodificado.slice(
        indicePrefixo + prefixo.length
      );
      break;
    }
  }

  const caminhoLimpo = caminhoObjeto.replace(/^\/+/, "").trim();
  const pastaProprietario = caminhoLimpo.split("/")[0] || "";

  return idObraSupabaseValido(pastaProprietario) ? caminhoLimpo : "";
}

function obterCaminhoStorageArquivoObra(conteudo: string) {
  const valor = conteudo.trim();

  if (!valor || /^(?:data|blob):/i.test(valor)) {
    return "";
  }

  try {
    const url = new URL(valor);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return "";
    }

    return normalizarCaminhoStorageArquivoObra(url.pathname);
  } catch {
    return normalizarCaminhoStorageArquivoObra(valor);
  }
}

async function criarUrlAssinadaArquivoObra(caminho: string) {
  const caminhoLimpo = caminho.trim();

  if (!caminhoLimpo) {
    throw new Error("Caminho do arquivo ausente.");
  }

  const { data, error } = await supabase.storage
    .from(PRIVATE_WORK_FILES_BUCKET)
    .createSignedUrl(
      caminhoLimpo,
      PRIVATE_WORK_FILE_SIGNED_URL_TTL_SECONDS
    );

  const urlAssinada = data?.signedUrl?.trim() || "";

  if (error || !urlAssinada) {
    throw error || new Error("Não foi possível criar a URL do arquivo.");
  }

  return urlAssinada;
}

function normalizarObraSupabase(
  obra: SupabaseObraRow,
  capitulosSupabase: SupabaseCapituloRow[],
  obraLocal: ObraLocal | undefined,
  index: number
): ObraLocal {
  const capitulosLocaisPorId = new Map(
    (obraLocal?.capitulos || []).map((capitulo) => [capitulo.id, capitulo])
  );

  const capitulosRemotos = capitulosSupabase.map((capitulo, capituloIndex) => {
    const capituloLocal = capitulosLocaisPorId.get(capitulo.id);

    return {
      id: capitulo.id,
      titulo:
        capitulo.titulo?.trim() ||
        capituloLocal?.titulo ||
        `Capítulo ${capituloIndex + 1}`,
      texto: "",
      curtiu: Boolean(capituloLocal?.curtiu),
      salvo: Boolean(capituloLocal?.salvo),
      comentario: capituloLocal?.comentario || "",
      criadoEm: capitulo.criado_em || capituloLocal?.criadoEm || "",
      lido: Boolean(capituloLocal?.lido),
      lidoEm: capituloLocal?.lidoEm || "",
      publicado: true,
      totalCurtidas: normalizarContadorObraPublica(capituloLocal?.totalCurtidas),
      totalComentarios: normalizarContadorObraPublica(capituloLocal?.totalComentarios),
      totalSalvos: normalizarContadorObraPublica(capituloLocal?.totalSalvos),
      totalLidos: normalizarContadorObraPublica(capituloLocal?.totalLidos),
    } satisfies CapituloLocal;
  });

  const capitulosMesclados = capitulosRemotos;
  const tituloObra = obra.titulo?.trim() || obraLocal?.titulo || "Obra sem título";
  const slugObra =
    obra.slug?.trim() ||
    obraLocal?.slug ||
    criarSlugBase(tituloObra || `obra-${index + 1}`);
  const arquivoUrl = obra.arquivo_url?.trim() || "";
  const arquivoCategoria = normalizarCategoriaArquivoSupabase(
    obra.arquivo_categoria
  );
  const arquivoTipo =
    obra.arquivo_tipo?.trim() ||
    obraLocal?.arquivoObra?.tipo ||
    (arquivoCategoria === "documento"
      ? "application/pdf"
      : arquivoCategoria === "imagem"
      ? "image/*"
      : arquivoCategoria === "texto"
      ? "text/plain"
      : "");

  return {
    id: obra.id || obraLocal?.id || `obra-${index + 1}`,
    titulo: tituloObra,
    autor: obra.autor?.trim() || obraLocal?.autor || "Autor não informado",
    autorId: obra.user_id?.trim() || obraLocal?.autorId || "",
    genero: obra.genero?.trim() || obraLocal?.genero || "Não informado",
    formato: obra.formato?.trim() || obraLocal?.formato || "Não informado",
    classificacaoIndicativa:
      obra.classificacao_indicativa?.trim() ||
      obraLocal?.classificacaoIndicativa ||
      "Não informada",
    sinopse:
      obra.sinopse?.trim() ||
      obraLocal?.sinopse ||
      "Nenhuma sinopse informada.",
    tags:
      Array.isArray(obra.tags) && obra.tags.length > 0
        ? obra.tags.filter((tag) => typeof tag === "string" && Boolean(tag.trim()))
        : obraLocal?.tags || ["sem tags"],
    capa: obra.capa_url?.trim() || obraLocal?.capa || "",
    capaNome: obra.capa_nome?.trim() || obraLocal?.capaNome || "",
    arquivoObra: arquivoUrl
      ? {
          nome:
            obra.arquivo_nome?.trim() ||
            obraLocal?.arquivoObra?.nome ||
            "Arquivo da obra",
          tipo: arquivoTipo,
          tamanho:
            typeof obra.arquivo_tamanho === "number" &&
            Number.isFinite(obra.arquivo_tamanho)
              ? obra.arquivo_tamanho
              : obraLocal?.arquivoObra?.tamanho || 0,
          conteudo: arquivoUrl,
          categoria: arquivoCategoria,
          criadoEm: obra.criada_em || obraLocal?.arquivoObra?.criadoEm || "",
        }
      : obraLocal?.arquivoObra || null,
    publicado: Boolean(obra.publicado),
    capitulos: capitulosMesclados,
    criadaEm: obra.criada_em || obraLocal?.criadaEm || "",
    ultimoCapituloLidoId: obraLocal?.ultimoCapituloLidoId || "",
    ultimaLeituraEm: obraLocal?.ultimaLeituraEm || "",
    progressoLeitura: calcularProgressoLeitura(capitulosMesclados),
    visualizacoes: normalizarContadorObraPublica(
      obra.visualizacoes ?? obra.views ?? obra.total_visualizacoes ?? obraLocal?.visualizacoes
    ),
    totalCurtidas: normalizarContadorObraPublica(obraLocal?.totalCurtidas),
    totalComentarios: normalizarContadorObraPublica(
      obraLocal?.totalComentarios
    ),
    totalFavoritos: normalizarContadorObraPublica(obraLocal?.totalFavoritos),
    totalConcluidas: normalizarContadorObraPublica(obraLocal?.totalConcluidas),
    slug: slugObra,
    link: obra.link?.trim() || obraLocal?.link || `/obra/${slugObra}`,
  };
}

async function aplicarProgressoUsuarioObraPublica(
  obrasParaAtualizar: ObraLocal[],
  userId: string
) {
  const userIdLimpo = userId.trim();
  const obraIdPorCapitulo = new Map<string, string>();

  obrasParaAtualizar.forEach((obra) => {
    obra.capitulos.forEach((capitulo) => {
      const obraId = obra.id.trim();
      const capituloId = capitulo.id.trim();

      if (obraId && capituloId) {
        obraIdPorCapitulo.set(capituloId, obraId);
      }
    });
  });

  const obraIds = Array.from(
    new Set(Array.from(obraIdPorCapitulo.values()))
  );
  const capituloIds = Array.from(obraIdPorCapitulo.keys());

  if (!userIdLimpo || obraIds.length === 0 || capituloIds.length === 0) {
    return obrasParaAtualizar;
  }

  try {
    const { data, error } = await supabase
      .from("progresso_leitura")
      .select("obra_id,capitulo_id,lido,atualizado_em")
      .eq("user_id", userIdLimpo)
      .in("obra_id", obraIds)
      .in("capitulo_id", capituloIds)
      .order("atualizado_em", { ascending: false })
      .limit(5000);

    if (error || !Array.isArray(data)) {
      return obrasParaAtualizar;
    }

    const progressoPorCapitulo =
      new Map<string, SupabaseProgressoLeituraObraPublicaRow>();

    (data as unknown as SupabaseProgressoLeituraObraPublicaRow[]).forEach(
      (registro) => {
        const obraId = registro.obra_id?.trim() || "";
        const capituloId = registro.capitulo_id?.trim() || "";
        const obraDoCapitulo = obraIdPorCapitulo.get(capituloId) || "";

        if (
          obraId &&
          capituloId &&
          obraDoCapitulo === obraId &&
          !progressoPorCapitulo.has(capituloId)
        ) {
          progressoPorCapitulo.set(capituloId, registro);
        }
      }
    );

    return obrasParaAtualizar.map((obra) => {
      let ultimoCapituloLidoId = "";
      let ultimaLeituraEm = "";

      const capitulos = obra.capitulos.map((capitulo) => {
        const registro = progressoPorCapitulo.get(capitulo.id);
        const lido = registro?.lido === true;
        const lidoEm =
          lido && typeof registro?.atualizado_em === "string"
            ? registro.atualizado_em
            : "";

        if (lido) {
          const tempoAtual = new Date(lidoEm).getTime();
          const tempoUltimo = new Date(ultimaLeituraEm).getTime();
          const tempoAtualSeguro = Number.isNaN(tempoAtual) ? 0 : tempoAtual;
          const tempoUltimoSeguro = Number.isNaN(tempoUltimo) ? 0 : tempoUltimo;

          if (
            !ultimoCapituloLidoId ||
            tempoAtualSeguro >= tempoUltimoSeguro
          ) {
            ultimoCapituloLidoId = capitulo.id;
            ultimaLeituraEm = lidoEm;
          }
        }

        return {
          ...capitulo,
          lido,
          lidoEm,
        };
      });

      return {
        ...obra,
        capitulos,
        ultimoCapituloLidoId,
        ultimaLeituraEm,
        progressoLeitura: calcularProgressoLeitura(capitulos),
      };
    });
  } catch {
    return obrasParaAtualizar;
  }
}

async function carregarObraSupabasePorSlug(
  slugBusca: string,
  obrasLocais: ObraLocal[],
  userId = ""
) {
  const slugLimpo = slugBusca.trim();

  if (!slugLimpo) {
    return aplicarProgressoUsuarioObraPublica(obrasLocais, userId);
  }

  try {
    const { data: obrasBanco, error: erroObra } = await supabase
      .from("obras")
      .select(
        "id,user_id,titulo,autor,genero,formato,classificacao_indicativa,sinopse,tags,capa_url,capa_nome,arquivo_url,arquivo_nome,arquivo_tipo,arquivo_tamanho,arquivo_categoria,visualizacoes,publicado,slug,link,criada_em,atualizado_em"
      )
      .eq("slug", slugLimpo)
      .eq("publicado", true)
      .limit(1);

    if (erroObra) {
      console.warn(
        "Não consegui carregar a obra pública no Supabase:",
        erroObra.message
      );
      return aplicarProgressoUsuarioObraPublica(obrasLocais, userId);
    }

    const obraBanco = ((obrasBanco || []) as unknown as SupabaseObraRow[])[0] || null;

    if (!obraBanco) {
      return aplicarProgressoUsuarioObraPublica(obrasLocais, userId);
    }

    const { data: capitulosBanco, error: erroCapitulos } = await supabase
      .from("capitulos")
      .select("id,obra_id,user_id,titulo,ordem,publicado,criado_em,atualizado_em")
      .eq("obra_id", obraBanco.id)
      .eq("publicado", true)
      .order("ordem", { ascending: true })
      .limit(200);

    if (erroCapitulos) {
      console.warn(
        "Não consegui carregar capítulos da obra pública no Supabase:",
        erroCapitulos.message
      );
    }

    const obraLocal = obrasLocais.find((obraLocalAtual) => {
      const slugLocal = obraLocalAtual.slug || criarSlugBase(obraLocalAtual.titulo);

      return obraLocalAtual.id === obraBanco.id || slugLocal === slugLimpo;
    });

    const obraNormalizadaSemTotais = normalizarObraSupabase(
      obraBanco,
      erroCapitulos ? [] : ((capitulosBanco || []) as unknown as SupabaseCapituloRow[]),
      obraLocal,
      0
    );
    const [obraComTotais] = await aplicarTotaisReaisObraPublica([
      obraNormalizadaSemTotais,
    ]);
    const [obraNormalizada] = await aplicarProgressoUsuarioObraPublica(
      [obraComTotais],
      userId
    );

    const obraJaExiste = obrasLocais.some(
      (obraLocalAtual) => obraLocalAtual.id === obraNormalizada.id
    );

    const obrasAtualizadas = obraJaExiste
      ? obrasLocais.map((obraLocalAtual) =>
          obraLocalAtual.id === obraNormalizada.id
            ? obraNormalizada
            : obraLocalAtual
        )
      : [obraNormalizada, ...obrasLocais];

    sincronizarBackupArquivosObras(obrasAtualizadas, userId);

    return obrasAtualizadas;
  } catch (error) {
    console.warn("Não consegui acessar o Supabase agora:", error);
    return aplicarProgressoUsuarioObraPublica(obrasLocais, userId);
  }
}


function normalizarContadorObraPublica(valor: unknown) {
  if (typeof valor === "number" && Number.isFinite(valor)) {
    return Math.max(0, Math.round(valor));
  }

  if (typeof valor === "string" && valor.trim()) {
    const numero = Number(valor.replace(/\./g, "").replace(",", "."));

    if (Number.isFinite(numero)) {
      return Math.max(0, Math.round(numero));
    }
  }

  return 0;
}

function adicionarUsuarioUnicoObraPublica(
  usuariosPorRegistro: Map<string, Set<string>>,
  chave: string,
  userId: string,
) {
  const chaveLimpa = chave.trim();
  const userIdLimpo = userId.trim();

  if (!chaveLimpa || !userIdLimpo) {
    return;
  }

  const usuariosAtuais =
    usuariosPorRegistro.get(chaveLimpa) || new Set<string>();

  usuariosAtuais.add(userIdLimpo);
  usuariosPorRegistro.set(chaveLimpa, usuariosAtuais);
}

async function carregarUsuariosUnicosPorColunaObraPublica(
  tabela: string,
  coluna: string,
  ids: string[],
  colunaUsuario = "user_id",
  somenteLidos = false,
) {
  const idsUnicos = Array.from(
    new Set(ids.map((id) => id.trim()).filter(Boolean)),
  );
  const usuariosPorRegistro = new Map<string, Set<string>>();
  const tamanhoPagina = 1000;

  if (idsUnicos.length === 0) {
    return usuariosPorRegistro;
  }

  for (let inicioIds = 0; inicioIds < idsUnicos.length; inicioIds += 80) {
    const loteIds = idsUnicos.slice(inicioIds, inicioIds + 80);
    let inicio = 0;

    while (true) {
      try {
        let consulta = supabase
          .from(tabela)
          .select(`${coluna},${colunaUsuario}`)
          .in(coluna, loteIds)
          .range(inicio, inicio + tamanhoPagina - 1);

        if (somenteLidos) {
          consulta = consulta.eq("lido", true);
        }

        const { data, error } = await consulta;

        if (error || !Array.isArray(data) || data.length === 0) {
          break;
        }

        data.forEach((registro) => {
          if (
            !registro ||
            typeof registro !== "object" ||
            Array.isArray(registro)
          ) {
            return;
          }

          const registroNormalizado = registro as Record<string, unknown>;
          const chave = registroNormalizado[coluna];
          const userId = registroNormalizado[colunaUsuario];

          if (typeof chave === "string" && typeof userId === "string") {
            adicionarUsuarioUnicoObraPublica(
              usuariosPorRegistro,
              chave,
              userId,
            );
          }
        });

        if (data.length < tamanhoPagina) {
          break;
        }

        inicio += tamanhoPagina;
      } catch {
        break;
      }
    }
  }

  return usuariosPorRegistro;
}

function totalUsuariosUnicosObraPublica(
  usuariosPorRegistro: Map<string, Set<string>>,
  chave: string,
) {
  const chaveLimpa = chave.trim();

  return chaveLimpa ? usuariosPorRegistro.get(chaveLimpa)?.size || 0 : 0;
}

async function carregarTotaisPorColunaObraPublica(
  tabela: string,
  coluna: string,
  ids: string[],
  somenteLidos = false,
) {
  const idsUnicos = Array.from(
    new Set(ids.map((id) => id.trim()).filter(Boolean)),
  );
  const totaisPorRegistro = new Map<string, number>();
  const tamanhoPagina = 1000;

  if (idsUnicos.length === 0) {
    return totaisPorRegistro;
  }

  for (let inicioIds = 0; inicioIds < idsUnicos.length; inicioIds += 80) {
    const loteIds = idsUnicos.slice(inicioIds, inicioIds + 80);
    let inicio = 0;

    while (true) {
      try {
        let consulta = supabase
          .from(tabela)
          .select(coluna)
          .in(coluna, loteIds)
          .range(inicio, inicio + tamanhoPagina - 1);

        if (somenteLidos) {
          consulta = consulta.eq("lido", true);
        }

        const { data, error } = await consulta;

        if (error || !Array.isArray(data) || data.length === 0) {
          break;
        }

        data.forEach((registro) => {
          if (
            !registro ||
            typeof registro !== "object" ||
            Array.isArray(registro)
          ) {
            return;
          }

          const chave = (registro as Record<string, unknown>)[coluna];

          if (typeof chave !== "string" || !chave.trim()) {
            return;
          }

          const chaveLimpa = chave.trim();
          totaisPorRegistro.set(
            chaveLimpa,
            (totaisPorRegistro.get(chaveLimpa) || 0) + 1,
          );
        });

        if (data.length < tamanhoPagina) {
          break;
        }

        inicio += tamanhoPagina;
      } catch {
        break;
      }
    }
  }

  return totaisPorRegistro;
}

function totalRegistrosObraPublica(
  totaisPorRegistro: Map<string, number>,
  chave: string,
) {
  const chaveLimpa = chave.trim();

  return chaveLimpa ? totaisPorRegistro.get(chaveLimpa) || 0 : 0;
}

function totalCurtidasObraPublica(obra: ObraLocal) {
  return normalizarContadorObraPublica(obra.totalCurtidas);
}

function totalComentariosObraPublica(obra: ObraLocal) {
  return normalizarContadorObraPublica(obra.totalComentarios);
}

function totalVisualizacoesObraPublica(obra: ObraLocal) {
  return normalizarContadorObraPublica(obra.visualizacoes);
}

async function aplicarTotaisReaisObraPublica(obrasParaAtualizar: ObraLocal[]) {
  const capituloIds = Array.from(
    new Set(
      obrasParaAtualizar.flatMap((obra) =>
        obra.capitulos.map((capitulo) => capitulo.id.trim()).filter(Boolean),
      ),
    ),
  );
  const obraIds = Array.from(
    new Set(obrasParaAtualizar.map((obra) => obra.id.trim()).filter(Boolean)),
  );

  if (capituloIds.length === 0 && obraIds.length === 0) {
    return obrasParaAtualizar;
  }

  const [
    curtidasPorCapitulo,
    comentariosPorCapitulo,
    salvosPorCapitulo,
    lidosPorCapitulo,
    curtidasPorObra,
    comentariosPorObra,
    favoritosPorObra,
    concluidasPorObra,
  ] = await Promise.all([
    carregarUsuariosUnicosPorColunaObraPublica(
      "curtidas_capitulos",
      "capitulo_id",
      capituloIds,
    ),
    carregarTotaisPorColunaObraPublica(
      "comentarios_capitulos",
      "capitulo_id",
      capituloIds,
    ),
    carregarUsuariosUnicosPorColunaObraPublica(
      "salvos_capitulos",
      "capitulo_id",
      capituloIds,
    ),
    carregarUsuariosUnicosPorColunaObraPublica(
      "progresso_leitura",
      "capitulo_id",
      capituloIds,
      "user_id",
      true,
    ),
    carregarUsuariosUnicosPorColunaObraPublica(
      "obra_curtidas",
      "obra_id",
      obraIds,
    ),
    carregarTotaisPorColunaObraPublica(
      "comentarios_obras",
      "obra_id",
      obraIds,
    ),
    carregarUsuariosUnicosPorColunaObraPublica(
      "favoritos",
      "obra_id",
      obraIds,
    ),
    carregarUsuariosUnicosPorColunaObraPublica(
      "concluidas",
      "obra_id",
      obraIds,
    ),
  ]);

  return obrasParaAtualizar.map((obra) => ({
    ...obra,
    totalCurtidas: totalUsuariosUnicosObraPublica(
      curtidasPorObra,
      obra.id,
    ),
    totalComentarios: totalRegistrosObraPublica(
      comentariosPorObra,
      obra.id,
    ),
    totalFavoritos: totalUsuariosUnicosObraPublica(
      favoritosPorObra,
      obra.id,
    ),
    totalConcluidas: totalUsuariosUnicosObraPublica(
      concluidasPorObra,
      obra.id,
    ),
    capitulos: obra.capitulos.map((capitulo) => ({
      ...capitulo,
      totalCurtidas: totalUsuariosUnicosObraPublica(
        curtidasPorCapitulo,
        capitulo.id,
      ),
      totalComentarios: totalRegistrosObraPublica(
        comentariosPorCapitulo,
        capitulo.id,
      ),
      totalSalvos: totalUsuariosUnicosObraPublica(
        salvosPorCapitulo,
        capitulo.id,
      ),
      totalLidos: totalUsuariosUnicosObraPublica(
        lidosPorCapitulo,
        capitulo.id,
      ),
    })),
  }));
}


function converterObraLocalParaDinamica(obra: ObraLocal): ObraDinamica {
  const obraDisponivel = obra.publicado && (obra.capitulos.length > 0 || Boolean(obra.arquivoObra));

  return {
    id: obra.id,
    origem: "local",
    titulo: obra.titulo,
    autor: obra.autor,
    autorId: obra.autorId || "",
    genero: obra.genero,
    formato: obra.formato,
    classificacaoIndicativa: obra.classificacaoIndicativa,
    status: obra.publicado ? "Publicado" : "Rascunho",
    views: String(totalVisualizacoesObraPublica(obra)),
    likes: String(totalCurtidasObraPublica(obra)),
    comentarios: String(totalComentariosObraPublica(obra)),
    disponivel: obraDisponivel,
    slug: obra.slug,
    link: obra.link || `/obra/${obra.slug || criarSlugBase(obra.titulo)}`,
    sinopse: obra.sinopse,
    tags: obra.tags,
    capa: obra.capa,
    arquivoObra: obra.arquivoObra || null,
    capitulos: obra.capitulos.map((capitulo, index) => ({
      id: capitulo.id,
      numero: String(index + 1).padStart(2, "0"),
      titulo: capitulo.titulo,
      descricao: "",
      href: `/obra/${encodeURIComponent(
        obra.slug || criarSlugBase(obra.titulo)
      )}/capitulo/${index + 1}`,
      disponivel: obraDisponivel,
      lido: capitulo.lido,
      lidoEm: capitulo.lidoEm,
    })),
    ultimoCapituloLidoId: obra.ultimoCapituloLidoId,
    ultimaLeituraEm: obra.ultimaLeituraEm,
    progressoLeitura: calcularProgressoLeitura(obra.capitulos),
  };
}

function encontrarCapituloParaContinuarObraPublica(obra: ObraDinamica) {
  const capitulosDisponiveis = obra.capitulos.filter(
    (capitulo) => capitulo.disponivel
  );

  if (capitulosDisponiveis.length === 0) {
    return null;
  }

  const indiceUltimoCapituloLido = obra.ultimoCapituloLidoId
    ? capitulosDisponiveis.findIndex(
        (capitulo) => capitulo.id === obra.ultimoCapituloLidoId
      )
    : -1;

  if (indiceUltimoCapituloLido >= 0) {
    const proximoCapituloNaoLido = capitulosDisponiveis
      .slice(indiceUltimoCapituloLido + 1)
      .find((capitulo) => !capitulo.lido);

    if (proximoCapituloNaoLido) {
      return proximoCapituloNaoLido;
    }
  }

  return (
    capitulosDisponiveis.find((capitulo) => !capitulo.lido) ||
    capitulosDisponiveis[capitulosDisponiveis.length - 1]
  );
}

function criarCoverArtStyle(capa: string): CSSProperties {
  if (!capa) {
    return coverArtStyle;
  }

  return {
    ...coverArtStyle,
    backgroundImage: `url(${capa})`,
    backgroundSize: "cover",
    backgroundPosition: "center top",
  };
}

function criarDesktopCoverArtStyle(capa: string): CSSProperties {
  if (!capa) {
    return desktopCoverArtStyle;
  }

  return {
    ...desktopCoverArtStyle,
    backgroundImage: `url(${capa})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}


function criarLinkPerfilAutor(autor: string, autorId?: string) {
  const params = new URLSearchParams();
  const autorLimpo = autor.trim() || "Autor não informado";
  const autorIdLimpo = autorId?.trim() || "";

  params.set("autor", autorLimpo);

  if (autorIdLimpo) {
    params.set("autorId", autorIdLimpo);
    params.set("userId", autorIdLimpo);
  }

  return `/perfil-autor?${params.toString()}`;
}

function obterTextoPerfilObra(registro: Record<string, unknown>, chave: string) {
  const valor = registro[chave];

  return typeof valor === "string" && valor.trim() ? valor.trim() : "";
}

function obterNomePerfilObra(profile: Record<string, unknown> | null, fallback: string) {
  if (!profile) {
    return fallback.trim() || "Autor não informado";
  }

  return (
    obterTextoPerfilObra(profile, "nome") ||
    obterTextoPerfilObra(profile, "nome_usuario") ||
    obterTextoPerfilObra(profile, "username") ||
    obterTextoPerfilObra(profile, "display_name") ||
    obterTextoPerfilObra(profile, "apelido") ||
    fallback.trim() ||
    "Autor não informado"
  );
}

function obterAvatarPerfilObra(profile: Record<string, unknown> | null) {
  if (!profile) {
    return "";
  }

  return (
    obterTextoPerfilObra(profile, "avatar_url") ||
    obterTextoPerfilObra(profile, "avatar") ||
    obterTextoPerfilObra(profile, "foto_url") ||
    obterTextoPerfilObra(profile, "imagem_url") ||
    obterTextoPerfilObra(profile, "photo_url")
  );
}

function obterBioPerfilObra(profile: Record<string, unknown> | null) {
  if (!profile) {
    return "";
  }

  return (
    obterTextoPerfilObra(profile, "bio") ||
    obterTextoPerfilObra(profile, "sobre_bio") ||
    obterTextoPerfilObra(profile, "sobre") ||
    obterTextoPerfilObra(profile, "descricao")
  );
}

function normalizarPerfilPublicoObra(
  profile: Record<string, unknown> | null,
  userIdFallback: string,
  nomeFallback: string
): PerfilPublicoObra {
  return {
    userId:
      obterTextoPerfilObra(profile || {}, "user_id") ||
      obterTextoPerfilObra(profile || {}, "id") ||
      userIdFallback.trim(),
    nome: obterNomePerfilObra(profile, nomeFallback).slice(0, 80),
    avatar: obterAvatarPerfilObra(profile),
    bio: obterBioPerfilObra(profile).slice(0, 160),
  };
}

async function carregarPerfisPublicosObra(userIds: string[]) {
  const ids = Array.from(
    new Set(
      userIds
        .map((userId) => userId.trim())
        .filter((userId) => idObraSupabaseValido(userId))
    )
  );
  const perfis = new Map<string, PerfilPublicoObra>();

  if (ids.length === 0) {
    return perfis;
  }

  const selecoesPerfis = [
    "id,user_id,nome,avatar_url,bio",
    "id,user_id,nome,avatar_url",
    "id,user_id,nome",
  ];

  for (const campos of selecoesPerfis) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(campos)
        .in("user_id", ids)
        .limit(1000);

      if (error || !Array.isArray(data)) {
        continue;
      }

      (data as unknown as Record<string, unknown>[]).forEach((profile) => {
        const userId =
          obterTextoPerfilObra(profile, "user_id") ||
          obterTextoPerfilObra(profile, "id");

        if (userId) {
          perfis.set(
            userId,
            normalizarPerfilPublicoObra(profile, userId, "Usuário")
          );
        }
      });
      break;
    } catch {
      // Tenta uma seleção menor abaixo.
    }
  }

  const idsFaltantes = ids.filter((userId) => !perfis.has(userId));

  if (idsFaltantes.length > 0) {
    for (const campos of selecoesPerfis) {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select(campos)
          .in("id", idsFaltantes)
          .limit(1000);

        if (error || !Array.isArray(data)) {
          continue;
        }

        (data as unknown as Record<string, unknown>[]).forEach((profile) => {
          const userId =
            obterTextoPerfilObra(profile, "user_id") ||
            obterTextoPerfilObra(profile, "id");

          if (userId) {
            perfis.set(
              userId,
              normalizarPerfilPublicoObra(profile, userId, "Usuário")
            );
          }
        });
        break;
      } catch {
        // Tenta uma seleção menor abaixo.
      }
    }
  }

  return perfis;
}

async function carregarPerfilPublicoObra(
  userId: string,
  nomeFallback: string
): Promise<PerfilPublicoObra | null> {
  const userIdLimpo = userId.trim();

  if (!idObraSupabaseValido(userIdLimpo)) {
    return null;
  }

  const perfis = await carregarPerfisPublicosObra([userIdLimpo]);
  const perfil = perfis.get(userIdLimpo);

  if (perfil) {
    return perfil;
  }

  try {
    const { data } = await supabase.auth.getUser();
    const usuario = data.user;

    if (usuario?.id === userIdLimpo) {
      const metadata =
        usuario.user_metadata && typeof usuario.user_metadata === "object"
          ? (usuario.user_metadata as Record<string, unknown>)
          : {};
      const nomeMetadata =
        obterTextoPerfilObra(metadata, "nome") ||
        obterTextoPerfilObra(metadata, "name") ||
        obterTextoPerfilObra(metadata, "full_name") ||
        usuario.email?.split("@")[0]?.trim() ||
        nomeFallback;
      const avatarMetadata =
        obterTextoPerfilObra(metadata, "avatar_url") ||
        obterTextoPerfilObra(metadata, "avatar") ||
        obterTextoPerfilObra(metadata, "picture");

      return {
        userId: userIdLimpo,
        nome: (nomeMetadata || "Usuário").slice(0, 80),
        avatar: avatarMetadata,
        bio: "",
      };
    }
  } catch {
    // O fallback de autenticação não deve bloquear o perfil.
  }

  return normalizarPerfilPublicoObra(null, userIdLimpo, nomeFallback || "Usuário");
}

function criarLinkComunidadeObra(
  titulo: string,
  filtro?: "Teoria" | "Review" | "posts"
) {
  const params = new URLSearchParams();

  params.set("obra", titulo);

  if (filtro === "posts") {
    params.set("grupo", "posts");
  } else if (filtro) {
    params.set("tipo", filtro);
  }

  return `/comunidade?${params.toString()}`;
}

function postComunidadePertenceAObra(post: SupabaseComunidadePostRow, titulo: string) {
  return post.obra_relacionada === titulo;
}

function obterNumeroMetrica(valor: string) {
  const valorNormalizado = valor.trim().toLowerCase().replace(",", ".");

  if (!valorNormalizado) {
    return 0;
  }

  const multiplicador = valorNormalizado.endsWith("k") ? 1000 : 1;
  const numero = Number.parseFloat(valorNormalizado.replace(/[^0-9.]/g, ""));

  return Number.isFinite(numero) ? Math.round(numero * multiplicador) : 0;
}

function criarMetricasBaseObra(obra: ObraDinamica | null): MetricasObraPublica {
  if (!obra) {
    return metricasObraVazias;
  }

  return {
    visualizacoes: obterNumeroMetrica(obra.views),
    curtidas: obterNumeroMetrica(obra.likes),
    comentarios: obterNumeroMetrica(obra.comentarios),
    seguidores: 0,
    curtidaAtiva: false,
    carregado: false,
  };
}

function obterChaveAvaliacaoObra(obra: ObraDinamica) {
  return obra.id || obra.slug || normalizarTexto(obra.titulo);
}

function obterChavesInteracaoObraPublica(obra: ObraDinamica) {
  return Array.from(
    new Set(
      [
        obra.id,
        obra.slug,
        obra.link,
        criarSlugBase(obra.titulo),
        normalizarTexto(obra.titulo),
      ]
        .map((chave) => chave.trim())
        .filter(Boolean)
    )
  );
}

function carregarListaLocalObraPublica(chaveStorage: string, userId = "") {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo) {
    return [] as string[];
  }

  try {
    const texto = lerStorageUsuarioObraPublica(chaveStorage, userIdLimpo);
    const json: unknown = texto ? JSON.parse(texto) : [];

    return Array.isArray(json)
      ? json.filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
      : [];
  } catch {
    return [] as string[];
  }
}

function obraEstaEmListaLocalObraPublica(
  obra: ObraDinamica,
  chaveStorage: string,
  userId = ""
) {
  const chavesObra = new Set(obterChavesInteracaoObraPublica(obra));

  return carregarListaLocalObraPublica(chaveStorage, userId).some((item) =>
    chavesObra.has(item.trim())
  );
}

function salvarListaLocalObraPublica(
  obra: ObraDinamica,
  chaveStorage: string,
  ativo: boolean,
  userId = ""
) {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo) {
    return [] as string[];
  }

  const listaAtual = carregarListaLocalObraPublica(chaveStorage, userIdLimpo);
  const chavesObra = obterChavesInteracaoObraPublica(obra);
  const chavesSet = new Set(chavesObra);
  const listaSemObra = listaAtual.filter((item) => !chavesSet.has(item.trim()));
  const proximaLista = ativo
    ? Array.from(new Set([...listaSemObra, ...chavesObra]))
    : listaSemObra;

  salvarStorageUsuarioObraPublica(chaveStorage, userIdLimpo, proximaLista);

  return proximaLista;
}

async function salvarRegistroObraPublicaSupabase(
  tabela: "favoritos" | "concluidas",
  userId: string,
  obraId: string,
  ativo: boolean
) {
  if (!userId || !obraId || !idObraSupabaseValido(obraId)) {
    return;
  }

  const { error: erroDelete } = await supabase
    .from(tabela)
    .delete()
    .eq("user_id", userId)
    .eq("obra_id", obraId);

  if (erroDelete) {
    throw erroDelete;
  }

  if (!ativo) {
    return;
  }

  const { error: erroInsert } = await supabase.from(tabela).insert({
    user_id: userId,
    obra_id: obraId,
    visibilidade: "publico",
  });

  if (erroInsert) {
    throw erroInsert;
  }
}

async function salvarCurtidaObraPublicaSupabase(
  userId: string,
  obraId: string,
  ativo: boolean
) {
  if (!userId || !obraId || !idObraSupabaseValido(obraId)) {
    return;
  }

  const { error: erroDelete } = await supabase
    .from("obra_curtidas")
    .delete()
    .eq("obra_id", obraId)
    .eq("user_id", userId);

  if (erroDelete) {
    throw erroDelete;
  }

  if (!ativo) {
    return;
  }

  const tentativas: Array<Record<string, string>> = [
    {
      obra_id: obraId,
      user_id: userId,
      visibilidade: "publico",
    },
    {
      obra_id: obraId,
      user_id: userId,
    },
  ];

  let ultimoErro: unknown = null;

  for (const payload of tentativas) {
    const { error } = await supabase.from("obra_curtidas").insert(payload);

    if (!error) {
      return;
    }

    ultimoErro = error;
  }

  throw ultimoErro || new Error("Não foi possível salvar a curtida da obra.");
}

function carregarAvaliacoesLocais(userId = "") {
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

function obterAvaliacaoLocal(obra: ObraDinamica, userId = "") {
  const chaveAvaliacao = obterChaveAvaliacaoObra(obra);
  const avaliacoesLocais = carregarAvaliacoesLocais(userId);
  const nota = Number(avaliacoesLocais[chaveAvaliacao]);

  return Number.isFinite(nota) && nota >= 0.5 && nota <= 5
    ? Math.round(nota * 2) / 2
    : 0;
}

function salvarAvaliacaoLocal(obra: ObraDinamica, nota: number, userId = "") {
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

    if (nota <= 0) {
      delete avaliacoesLocais[chaveAvaliacao];
    } else {
      avaliacoesLocais[chaveAvaliacao] = nota;
    }

    salvarStorageUsuarioObraPublica(
      RATED_WORKS_STORAGE_KEY,
      userIdLimpo,
      avaliacoesLocais
    );
  } catch {
    // Avaliação local é fallback e não deve travar a página.
  }
}

function formatarMediaAvaliacao(media: number) {
  if (!Number.isFinite(media) || media <= 0) {
    return "0.0";
  }

  return media.toFixed(1);
}

function formatarTotalAvaliacoes(total: number) {
  if (total <= 0) {
    return "avaliações";
  }

  return total === 1 ? "1 avaliação" : `${total} avaliações`;
}

function obterProximaNotaAvaliacao(estrela: number, notaAtual: number) {
  const meiaNota = estrela - 0.5;
  const notaNormalizada = Math.round(notaAtual * 2) / 2;

  if (notaNormalizada === meiaNota) {
    return estrela;
  }

  if (notaNormalizada === estrela) {
    return 0;
  }

  return meiaNota;
}

function obterPreenchimentoEstrela(estrela: number, notaAtual: number) {
  const notaNormalizada = Math.max(0, Math.min(5, Math.round(notaAtual * 2) / 2));

  if (notaNormalizada >= estrela) {
    return "100%";
  }

  if (notaNormalizada >= estrela - 0.5) {
    return "50%";
  }

  return "0%";
}

function calcularProximaAvaliacao(
  avaliacaoAtual: AvaliacaoObraPublica,
  novaNota: number
): AvaliacaoObraPublica {
  const notaAnterior = avaliacaoAtual.minhaNota;
  const totalAtual = avaliacaoAtual.total;
  const somaAtual = avaliacaoAtual.media * totalAtual;

  if (novaNota <= 0) {
    const totalNovo = notaAnterior > 0 ? Math.max(0, totalAtual - 1) : totalAtual;
    const somaNova = notaAnterior > 0 ? somaAtual - notaAnterior : somaAtual;

    return {
      ...avaliacaoAtual,
      media: totalNovo > 0 ? somaNova / totalNovo : 0,
      total: totalNovo,
      minhaNota: 0,
      carregado: true,
      salvando: false,
    };
  }

  const totalNovo = notaAnterior > 0 ? totalAtual : totalAtual + 1;
  const somaNova =
    notaAnterior > 0 ? somaAtual - notaAnterior + novaNota : somaAtual + novaNota;

  return {
    ...avaliacaoAtual,
    media: totalNovo > 0 ? somaNova / totalNovo : 0,
    total: totalNovo,
    minhaNota: novaNota,
    carregado: true,
    salvando: false,
  };
}

type DiarioAtividadeObraTipo =
  | "salvou_obra"
  | "favoritou_obra"
  | "concluiu_obra"
  | "avaliou_obra";

type DiarioAtividadeObraVisibilidade = "publico" | "parcial" | "privado";

async function removerAtividadeDiarioObra({
  userId,
  obra,
  tipo,
}: {
  userId: string;
  obra: ObraDinamica;
  tipo: DiarioAtividadeObraTipo;
}) {
  if (!userId || !obra.id || !idObraSupabaseValido(obra.id)) {
    return;
  }

  try {
    const { error } = await supabase
      .from("diario_atividades")
      .delete()
      .eq("user_id", userId)
      .eq("obra_id", obra.id)
      .eq("tipo", tipo);

    if (error) {
      console.warn("Não consegui remover atividade do Diário da obra:", error.message);
    }
  } catch (error) {
    console.warn("Não consegui acessar diario_atividades na obra:", error);
  }
}

async function registrarAtividadeDiarioObra({
  userId,
  obra,
  tipo,
  nota,
  texto,
  visibilidade,
}: {
  userId: string;
  obra: ObraDinamica;
  tipo: DiarioAtividadeObraTipo;
  nota?: number;
  texto?: string;
  visibilidade: DiarioAtividadeObraVisibilidade;
}) {
  if (!userId || !obra.id || !idObraSupabaseValido(obra.id)) {
    return;
  }

  const notaNormalizada =
    typeof nota === "number" && Number.isFinite(nota) && nota > 0
      ? Math.round(nota * 2) / 2
      : null;
  const payloadBase = {
    user_id: userId,
    tipo,
    obra_id: obra.id,
    texto: texto?.trim() || null,
    visibilidade,
    metadata: {
      origem: "obra_publica",
      titulo: obra.titulo,
      slug: obra.slug,
      autor: obra.autor,
      genero: obra.genero,
      formato: obra.formato,
    },
  };

  try {
    await removerAtividadeDiarioObra({
      userId,
      obra,
      tipo,
    });

    const { error } = await supabase.from("diario_atividades").insert({
      ...payloadBase,
      nota: notaNormalizada,
    });

    if (!error) {
      return;
    }

    const { error: erroFallback } = await supabase
      .from("diario_atividades")
      .insert(payloadBase);

    if (erroFallback) {
      console.warn("Não consegui registrar atividade do Diário da obra:", erroFallback.message);
    }
  } catch (error) {
    console.warn("Não consegui acessar diario_atividades na obra:", error);
  }
}


function criarComentarioObraId() {
  const cryptoGlobal =
    typeof globalThis !== "undefined" && "crypto" in globalThis
      ? globalThis.crypto
      : null;

  if (cryptoGlobal && typeof cryptoGlobal.randomUUID === "function") {
    return cryptoGlobal.randomUUID();
  }

  return `comentario-obra-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function carregarComentariosObraLocais(userId: string, obraId: string) {
  const userIdLimpo = userId.trim();
  const obraIdLimpo = obraId.trim();

  if (!userIdLimpo || !obraIdLimpo) {
    return [] as ComentarioObraPublico[];
  }

  try {
    const textoComentarios = lerStorageUsuarioObraPublica(
      WORK_COMMENTS_STORAGE_KEY,
      userIdLimpo
    );
    const json: unknown = textoComentarios ? JSON.parse(textoComentarios) : {};
    const comentariosPorObra =
      json && typeof json === "object" && !Array.isArray(json)
        ? (json as Record<string, unknown>)
        : {};
    const comentarios = comentariosPorObra[obraIdLimpo];

    if (!Array.isArray(comentarios)) {
      return [] as ComentarioObraPublico[];
    }

    return comentarios
      .map((comentario): ComentarioObraPublico | null => {
        if (
          !comentario ||
          typeof comentario !== "object" ||
          Array.isArray(comentario)
        ) {
          return null;
        }

        const registro = comentario as Partial<ComentarioObraPublico> &
          Record<string, unknown>;
        const id = typeof registro.id === "string" ? registro.id.trim() : "";
        const texto =
          typeof registro.texto === "string" ? registro.texto.trim() : "";

        if (!id || !texto) {
          return null;
        }

        return {
          id,
          obraId: obraIdLimpo,
          userId:
            typeof registro.userId === "string"
              ? registro.userId.trim()
              : userIdLimpo,
          nome:
            typeof registro.nome === "string" && registro.nome.trim()
              ? registro.nome.trim()
              : "Você",
          avatar:
            typeof registro.avatar === "string" ? registro.avatar.trim() : "",
          texto,
          criadoEm:
            typeof registro.criadoEm === "string" && registro.criadoEm.trim()
              ? registro.criadoEm
              : new Date().toISOString(),
          comentarioPaiId:
            typeof registro.comentarioPaiId === "string"
              ? registro.comentarioPaiId.trim()
              : typeof registro.comentario_pai_id === "string"
                ? registro.comentario_pai_id.trim()
                : "",
          local: true,
          curtidas: Array.isArray(registro.curtidas)
            ? Array.from(
                new Set(
                  registro.curtidas
                    .filter((id): id is string => typeof id === "string")
                    .map((id) => id.trim())
                    .filter(Boolean)
                )
              )
            : [],
        };
      })
      .filter(
        (comentario): comentario is ComentarioObraPublico => Boolean(comentario)
      );
  } catch {
    return [] as ComentarioObraPublico[];
  }
}

function salvarComentariosObraLocais(
  userId: string,
  obraId: string,
  comentarios: ComentarioObraPublico[]
) {
  const userIdLimpo = userId.trim();
  const obraIdLimpo = obraId.trim();

  if (!userIdLimpo || !obraIdLimpo) {
    return;
  }

  try {
    const textoComentarios = lerStorageUsuarioObraPublica(
      WORK_COMMENTS_STORAGE_KEY,
      userIdLimpo
    );
    const json: unknown = textoComentarios ? JSON.parse(textoComentarios) : {};
    const comentariosPorObra =
      json && typeof json === "object" && !Array.isArray(json)
        ? (json as Record<string, unknown>)
        : {};
    const comentariosLocais = comentarios
      .filter((comentario) => comentario.local)
      .slice(0, 120);

    salvarStorageUsuarioObraPublica(WORK_COMMENTS_STORAGE_KEY, userIdLimpo, {
      ...comentariosPorObra,
      [obraIdLimpo]: comentariosLocais,
    });
  } catch {
    salvarStorageUsuarioObraPublica(WORK_COMMENTS_STORAGE_KEY, userIdLimpo, {
      [obraIdLimpo]: comentarios
        .filter((comentario) => comentario.local)
        .slice(0, 120),
    });
  }
}

async function normalizarComentariosObraSupabase(
  comentarios: SupabaseComentarioObraRow[]
) {
  const usuariosIds = Array.from(
    new Set(
      comentarios
        .map((comentario) => comentario.user_id?.trim() || "")
        .filter(Boolean)
    )
  );
  const comentariosIds = Array.from(
    new Set(
      comentarios
        .map((comentario) => comentario.id?.trim() || "")
        .filter(Boolean)
    )
  );
  const perfisPorUsuario = await carregarPerfisPublicosObra(usuariosIds);
  const curtidasPorComentario = new Map<string, string[]>();

  if (comentariosIds.length > 0) {
    try {
      const { data, error } = await supabase
        .from(WORK_COMMENT_LIKES_TABLE)
        .select("comentario_id,usuario_id")
        .in("comentario_id", comentariosIds)
        .limit(5000);

      if (!error && Array.isArray(data)) {
        (data as unknown as SupabaseCurtidaComentarioObraRow[]).forEach(
          (curtida) => {
            const comentarioId = curtida.comentario_id?.trim() || "";
            const usuarioId = curtida.usuario_id?.trim() || "";

            if (!comentarioId || !usuarioId) {
              return;
            }

            const usuarios = curtidasPorComentario.get(comentarioId) || [];

            if (!usuarios.includes(usuarioId)) {
              curtidasPorComentario.set(comentarioId, [...usuarios, usuarioId]);
            }
          }
        );
      }
    } catch {
      // Curtidas são complementares; os comentários continuam visíveis.
    }
  }

  return comentarios
    .map((comentario): ComentarioObraPublico | null => {
      const id = comentario.id?.trim() || "";
      const obraId = comentario.obra_id?.trim() || "";
      const userId = comentario.user_id?.trim() || "";
      const texto = comentario.comentario?.trim() || "";

      if (!id || !obraId || !userId || !texto) {
        return null;
      }

      const perfil = perfisPorUsuario.get(userId) || null;

      return {
        id,
        obraId,
        userId,
        nome: perfil?.nome || "Usuário",
        avatar: perfil?.avatar || "",
        texto,
        criadoEm: comentario.criado_em || new Date().toISOString(),
        comentarioPaiId: comentario.comentario_pai_id?.trim() || "",
        local: false,
        curtidas: curtidasPorComentario.get(id) || [],
      };
    })
    .filter(
      (comentario): comentario is ComentarioObraPublico => Boolean(comentario)
    );
}

function dataComentarioObra(comentario: ComentarioObraPublico) {
  const data = new Date(comentario.criadoEm).getTime();

  return Number.isNaN(data) ? 0 : data;
}

function formatarTempoRelativoComentarioObra(
  criadaEm: string,
  agora = Date.now()
) {
  const dataComentario = new Date(criadaEm).getTime();

  if (Number.isNaN(dataComentario)) {
    return "agora";
  }

  const segundos = Math.max(0, Math.floor((agora - dataComentario) / 1000));

  if (segundos < 5) {
    return "agora";
  }

  if (segundos < 60) {
    return `há ${segundos} ${segundos === 1 ? "segundo" : "segundos"}`;
  }

  const minutos = Math.floor(segundos / 60);

  if (minutos < 60) {
    return `há ${minutos} ${minutos === 1 ? "minuto" : "minutos"}`;
  }

  const horas = Math.floor(minutos / 60);

  if (horas < 24) {
    return `há ${horas} ${horas === 1 ? "hora" : "horas"}`;
  }

  const dias = Math.floor(horas / 24);

  return `há ${dias} ${dias === 1 ? "dia" : "dias"}`;
}

function criarEstruturaComentariosObra(
  comentarios: ComentarioObraPublico[],
  ordenacao: OrdenacaoComentariosObra
) {
  const comentariosPorId = new Map(
    comentarios.map((comentario) => [comentario.id, comentario])
  );
  const respostasPorRaiz = new Map<string, ComentarioObraPublico[]>();
  const comentariosRaiz: ComentarioObraPublico[] = [];

  function obterRaiz(comentario: ComentarioObraPublico) {
    let atual = comentario;
    const visitados = new Set<string>([comentario.id]);

    while (atual.comentarioPaiId) {
      const pai = comentariosPorId.get(atual.comentarioPaiId);

      if (!pai || visitados.has(pai.id)) {
        break;
      }

      visitados.add(pai.id);
      atual = pai;
    }

    return atual;
  }

  comentarios.forEach((comentario) => {
    const paiExiste = Boolean(
      comentario.comentarioPaiId &&
        comentariosPorId.has(comentario.comentarioPaiId)
    );

    if (!paiExiste) {
      comentariosRaiz.push(comentario);
      return;
    }

    const raiz = obterRaiz(comentario);
    const respostasAtuais = respostasPorRaiz.get(raiz.id) || [];

    respostasPorRaiz.set(raiz.id, [...respostasAtuais, comentario]);
  });

  respostasPorRaiz.forEach((respostas, raizId) => {
    respostasPorRaiz.set(
      raizId,
      [...respostas].sort(
        (a, b) => dataComentarioObra(a) - dataComentarioObra(b)
      )
    );
  });

  comentariosRaiz.sort((a, b) => {
    if (ordenacao === "recentes") {
      return dataComentarioObra(b) - dataComentarioObra(a);
    }

    const relevanciaA =
      a.curtidas.length * 3 + (respostasPorRaiz.get(a.id)?.length || 0);
    const relevanciaB =
      b.curtidas.length * 3 + (respostasPorRaiz.get(b.id)?.length || 0);

    return relevanciaB - relevanciaA || dataComentarioObra(b) - dataComentarioObra(a);
  });

  return {
    comentariosRaiz,
    respostasPorRaiz,
  };
}

function obterIdsComentarioComRespostas(
  comentarios: ComentarioObraPublico[],
  comentarioId: string
) {
  const ids = new Set<string>([comentarioId]);
  let encontrouNovos = true;

  while (encontrouNovos) {
    encontrouNovos = false;

    comentarios.forEach((comentario) => {
      if (
        comentario.comentarioPaiId &&
        ids.has(comentario.comentarioPaiId) &&
        !ids.has(comentario.id)
      ) {
        ids.add(comentario.id);
        encontrouNovos = true;
      }
    });
  }

  return ids;
}

async function incrementarVisualizacaoObraPublicaSupabase(
  obraId: string
): Promise<number | null> {
  const obraIdLimpo = obraId.trim();

  if (!idObraSupabaseValido(obraIdLimpo)) {
    return null;
  }

  try {
    const { data, error } = await supabase.rpc("incrementar_visualizacao_obra", {
      obra_id_param: obraIdLimpo,
    });

    if (error) {
      console.warn(
        "Não consegui registrar a visualização protegida da obra:",
        error.message
      );
      return null;
    }

    return Math.max(0, obterNumeroSeguro(data, 0));
  } catch {
    // A página da obra continua funcionando mesmo se a contagem falhar.
    return null;
  }
}

function LoadingSpinner({
  label = "Carregando",
  compacto = false,
}: {
  label?: string;
  compacto?: boolean;
}) {
  if (compacto) {
    return (
      <span
        role="status"
        aria-live="polite"
        aria-label={label}
        style={loadingInlineStyle}
      >
        <span
          className="historietas-loading-spinner"
          style={loadingSpinnerCompactStyle}
          aria-hidden="true"
        />
      </span>
    );
  }

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

export default function ObraDinamicaPage() {
  const router = useRouter();
  const params = useParams<{ slug?: string | string[] }>();

  const slug = useMemo(() => {
    const parametro = params?.slug;

    if (Array.isArray(parametro)) {
      return parametro[0] || "";
    }

    return parametro || "";
  }, [params]);

  const [obrasLocais, setObrasLocais] = useState<ObraLocal[]>([]);
  const [carregandoObras, setCarregandoObras] = useState(true);
  const [obraSeguida, setObraSeguida] = useState(false);
  const [obraFavoritada, setObraFavoritada] = useState(false);
  const [obraConcluida, setObraConcluida] = useState(false);
  const [metricasObra, setMetricasObra] =
    useState<MetricasObraPublica>(metricasObraVazias);
  const [metricasComunidadeObra, setMetricasComunidadeObra] =
    useState<MetricasComunidadeObra>(metricasComunidadeObraVazias);
  const [avaliacaoObra, setAvaliacaoObra] =
    useState<AvaliacaoObraPublica>(avaliacaoObraVazia);
  const [perfilAutorObra, setPerfilAutorObra] =
    useState<PerfilPublicoObra | null>(null);
  const [mensagemAcao, setMensagemAcao] = useState("");
  const [linkCopiado, setLinkCopiado] = useState(false);
  const [acoesObraAbertas, setAcoesObraAbertas] = useState(false);
  const [comentariosObra, setComentariosObra] = useState<ComentarioObraPublico[]>([]);
  const [totalComentariosObra, setTotalComentariosObra] = useState(0);
  const [comentariosCarregando, setComentariosCarregando] = useState(false);
  const [comentariosAbertos, setComentariosAbertos] = useState(false);
  const [comentariosSheetExpandido, setComentariosSheetExpandido] = useState(false);
  const [comentarioTexto, setComentarioTexto] = useState("");
  const [comentarioStatus, setComentarioStatus] = useState("");
  const [comentarioEnviando, setComentarioEnviando] = useState(false);
  const [comentarioRemovendoId, setComentarioRemovendoId] = useState("");
  const [comentarioCurtindoId, setComentarioCurtindoId] = useState("");
  const [respostaComentario, setRespostaComentario] =
    useState<RespostaComentarioObra | null>(null);
  const [respostasVisiveisPorComentario, setRespostasVisiveisPorComentario] =
    useState<Record<string, number>>({});
  const [ordenacaoComentarios, setOrdenacaoComentarios] =
    useState<OrdenacaoComentariosObra>("relevantes");
  const [menuOrdenacaoComentariosAberto, setMenuOrdenacaoComentariosAberto] =
    useState(false);
  const [agoraComentarios, setAgoraComentarios] = useState(() => Date.now());
  const [usuarioIdLogado, setUsuarioIdLogado] = useState("");
  const [perfilUsuarioLogado, setPerfilUsuarioLogado] =
    useState<PerfilPublicoObra | null>(null);
  const comentarioInputRef = useRef<HTMLTextAreaElement | null>(null);
  const comentariosSheetRef = useRef<HTMLElement | null>(null);
  const comentariosDragStartYRef = useRef(0);
  const comentariosDragOffsetYRef = useRef(0);
  const comentariosDragIgnorarCliqueRef = useRef(false);
  const comentariosDragResetTimerRef = useRef<number | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);
  const { notificacoesNaoLidas } = useNotificacoes();
  const visualizacaoObraRegistradaRef = useRef("");

  useEffect(() => {
    if (!mensagemAcao) {
      return;
    }

    const timerMensagemAcao = window.setTimeout(() => {
      setMensagemAcao("");
    }, 3000);

    return () => {
      window.clearTimeout(timerMensagemAcao);
    };
  }, [mensagemAcao]);

  useEffect(() => {
    let cancelado = false;

    async function carregarUsuarioLogado() {
      try {
        const { data } = await supabase.auth.getUser();

        if (!cancelado) {
          setUsuarioIdLogado(data.user?.id || "");
        }
      } catch {
        if (!cancelado) {
          setUsuarioIdLogado("");
        }
      }
    }

    void carregarUsuarioLogado();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!cancelado) {
        setUsuarioIdLogado(session?.user?.id || "");
      }
    });

    return () => {
      cancelado = true;
      subscription.unsubscribe();
    };
  }, []);


  useEffect(() => {
    let cancelado = false;

    async function carregarPerfilUsuarioAtual() {
      if (!usuarioIdLogado) {
        setPerfilUsuarioLogado(null);
        return;
      }

      const perfil = await carregarPerfilPublicoObra(
        usuarioIdLogado,
        "Você"
      );

      if (!cancelado) {
        setPerfilUsuarioLogado(perfil);
      }
    }

    void carregarPerfilUsuarioAtual();

    return () => {
      cancelado = true;
    };
  }, [usuarioIdLogado]);


  useEffect(() => {
    if (!comentariosAbertos) {
      return;
    }

    const overflowAnterior = document.body.style.overflow;
    const overscrollAnterior = document.body.style.overscrollBehavior;

    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";

    return () => {
      document.body.style.overflow = overflowAnterior;
      document.body.style.overscrollBehavior = overscrollAnterior;

      if (comentariosDragResetTimerRef.current !== null) {
        window.clearTimeout(comentariosDragResetTimerRef.current);
        comentariosDragResetTimerRef.current = null;
      }
    };
  }, [comentariosAbertos]);


  useEffect(() => {
    if (!comentariosAbertos) {
      return;
    }

    const inicioRelogioComentarios = window.setTimeout(() => {
      setAgoraComentarios(Date.now());
    }, 0);

    const relogioComentarios = window.setInterval(() => {
      setAgoraComentarios(Date.now());
    }, 1000);

    return () => {
      window.clearTimeout(inicioRelogioComentarios);
      window.clearInterval(relogioComentarios);
    };
  }, [comentariosAbertos]);


  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");

    const atualizarModoDesktop = () => {
      setIsDesktop(mediaQuery.matches);
    };

    const atualizarModoDesktopTimer = window.setTimeout(
      atualizarModoDesktop,
      0
    );

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", atualizarModoDesktop);

      return () => {
        window.clearTimeout(atualizarModoDesktopTimer);
        mediaQuery.removeEventListener("change", atualizarModoDesktop);
      };
    }

    mediaQuery.addListener(atualizarModoDesktop);

    return () => {
      window.clearTimeout(atualizarModoDesktopTimer);
      mediaQuery.removeListener(atualizarModoDesktop);
    };
  }, []);

  useEffect(() => {
    let cancelado = false;

    async function carregarObraPublica() {
      window.setTimeout(() => {
        if (!cancelado) {
          setCarregandoObras(true);
        }
      }, 0);

      try {
        const obrasNormalizadas = carregarObrasLocaisComBackup(usuarioIdLogado);

        window.setTimeout(() => {
          if (!cancelado) {
            setObrasLocais(obrasNormalizadas);
          }
        }, 0);

        const obrasComSupabase = await carregarObraSupabasePorSlug(
          slug,
          obrasNormalizadas,
          usuarioIdLogado
        );

        window.setTimeout(() => {
          if (!cancelado) {
            setObrasLocais(obrasComSupabase);
          }
        }, 0);
      } catch {
        window.setTimeout(() => {
          if (!cancelado) {
            setObrasLocais([]);
          }
        }, 0);
      } finally {
        window.setTimeout(() => {
          if (!cancelado) {
            setCarregandoObras(false);
          }
        }, 0);
      }
    }

    void carregarObraPublica();

    return () => {
      cancelado = true;
    };
  }, [slug, usuarioIdLogado]);

  const obra = useMemo<ObraDinamica | null>(() => {
    const obraLocal = obrasLocais.find((item) => {
      return item.slug === slug || criarSlugBase(item.titulo) === slug;
    });

    if (obraLocal) {
      return converterObraLocalParaDinamica(obraLocal);
    }

    return null;
  }, [slug, obrasLocais]);

  useEffect(() => {
    if (!obra || !idObraSupabaseValido(obra.id)) {
      return;
    }

    const obraIdAtual = obra.id;

    if (visualizacaoObraRegistradaRef.current === obraIdAtual) {
      return;
    }

    visualizacaoObraRegistradaRef.current = obraIdAtual;

    async function registrarVisualizacaoObraAtual() {
      const totalVisualizacoes =
        await incrementarVisualizacaoObraPublicaSupabase(obraIdAtual);

      if (totalVisualizacoes === null) {
        return;
      }

      setMetricasObra((metricasAtuais) => ({
        ...metricasAtuais,
        visualizacoes: Math.max(
          metricasAtuais.visualizacoes,
          totalVisualizacoes
        ),
      }));
    }

    void registrarVisualizacaoObraAtual();
  }, [obra?.id]);

  useEffect(() => {
    let cancelado = false;

    async function carregarPerfilAutorDaObra() {
      if (!obra?.autorId) {
        window.setTimeout(() => {
          if (!cancelado) {
            setPerfilAutorObra(null);
          }
        }, 0);
        return;
      }

      const perfilAutor = await carregarPerfilPublicoObra(
        obra.autorId,
        obra.autor
      );

      window.setTimeout(() => {
        if (!cancelado) {
          setPerfilAutorObra(perfilAutor);
        }
      }, 0);
    }

    void carregarPerfilAutorDaObra();

    return () => {
      cancelado = true;
    };
  }, [obra?.autorId, obra?.autor]);

  const obraNormalizada = obra ? normalizarTexto(obra.titulo) : ""; 
  const generoObraFormatado = obra
    ? formatarGeneroObraPublica(obra.genero)
    : "Não informado";
  const autorObraNome = perfilAutorObra?.nome || obra?.autor || "Autor não informado";
  const autorObraId = perfilAutorObra?.userId || obra?.autorId || "";
  const obraDisponivel = Boolean(obra?.disponivel);
  const sinopseObraMenu =
    obra &&
    obra.sinopse.trim() &&
    normalizarTexto(obra.sinopse) !== "nenhuma sinopse informada"
      ? obra.sinopse.trim()
      : "";

  const capitulosDaObra = useMemo<CapituloDinamico[]>(() => {
    if (!obra) {
      return [];
    }

    if (obra.capitulos.length > 0) {
      return obra.capitulos;
    }

    return [];
  }, [obra]);

  const obraTemCapitulos = capitulosDaObra.length > 0;
  const indicadorConteudoIcone = obraTemCapitulos
    ? "📚"
    : obra?.arquivoObra
      ? "📄"
      : "📚";
  const indicadorConteudoValor = obraTemCapitulos
    ? capitulosDaObra.length
    : obra?.arquivoObra
      ? 1
      : 0;


  useEffect(() => {
    let cancelado = false;

    async function carregarComentariosObra() {
      const obraId = obra?.id?.trim() || "";

      setComentarioStatus("");

      if (!obraId) {
        setComentariosObra([]);
        setTotalComentariosObra(0);
        setComentariosCarregando(false);
        return;
      }

      const comentariosLocais = usuarioIdLogado
        ? carregarComentariosObraLocais(usuarioIdLogado, obraId)
        : [];

      if (!idObraSupabaseValido(obraId)) {
        setComentariosObra(comentariosLocais);
        setTotalComentariosObra(comentariosLocais.length);
        setComentariosCarregando(false);
        return;
      }

      setComentariosCarregando(true);
      setComentariosObra([]);

      try {
        const { data, error, count } = await supabase
          .from("comentarios_obras")
          .select("id,obra_id,user_id,comentario,comentario_pai_id,criado_em", {
            count: "exact",
          })
          .eq("obra_id", obraId)
          .order("criado_em", { ascending: false })
          .limit(120);

        if (error || !Array.isArray(data)) {
          throw error || new Error("Comentários inválidos retornados pelo Supabase.");
        }

        const comentariosRemotos = await normalizarComentariosObraSupabase(
          data as unknown as SupabaseComentarioObraRow[]
        );

        if (cancelado) {
          return;
        }

        setComentariosObra(comentariosRemotos);
        setTotalComentariosObra(
          Math.max(comentariosRemotos.length, count ?? 0)
        );

        if (usuarioIdLogado) {
          salvarComentariosObraLocais(
            usuarioIdLogado,
            obraId,
            comentariosRemotos
          );
        }
      } catch {
        if (!cancelado) {
          setComentariosObra(comentariosLocais);
          setTotalComentariosObra(comentariosLocais.length);
          setComentarioStatus(
            "Não foi possível carregar os comentários agora."
          );
        }
      } finally {
        if (!cancelado) {
          setComentariosCarregando(false);
        }
      }
    }

    void carregarComentariosObra();

    return () => {
      cancelado = true;
    };
  }, [obra?.id, usuarioIdLogado]);

  useEffect(() => {
    if (!obraNormalizada) {
      return;
    }

    try {
      const obrasSeguidasTexto = lerStorageUsuarioObraPublica(
        FOLLOWED_WORKS_STORAGE_KEY,
        usuarioIdLogado
      );
      const obrasSeguidasJson: unknown = obrasSeguidasTexto
        ? JSON.parse(obrasSeguidasTexto)
        : [];

      const obrasSeguidas = Array.isArray(obrasSeguidasJson)
        ? obrasSeguidasJson.filter(
            (titulo): titulo is string =>
              typeof titulo === "string" && Boolean(titulo.trim())
          )
        : [];
      const seguida = obrasSeguidas.includes(obraNormalizada);

      window.setTimeout(() => {
        setObraSeguida(seguida);
      }, 0);
    } catch {
      window.setTimeout(() => {
        setObraSeguida(false);
      }, 0);
    }
  }, [obraNormalizada, usuarioIdLogado]);

  useEffect(() => {
    if (!obra) {
      const resetColecoesTimer = window.setTimeout(() => {
        setObraFavoritada(false);
        setObraConcluida(false);
      }, 0);

      return () => {
        window.clearTimeout(resetColecoesTimer);
      };
    }

    let cancelado = false;
    const obraAtual = obra;
    const estadoFavoritadaLocal = obraEstaEmListaLocalObraPublica(
      obraAtual,
      FAVORITES_STORAGE_KEY,
      usuarioIdLogado
    );
    const estadoConcluidaLocal = obraEstaEmListaLocalObraPublica(
      obraAtual,
      COMPLETED_STORAGE_KEY,
      usuarioIdLogado
    );

    const aplicarEstadoColecoesTimer = window.setTimeout(() => {
      if (!cancelado) {
        setObraFavoritada(estadoFavoritadaLocal);
        setObraConcluida(estadoConcluidaLocal);
      }
    }, 0);

    if (!obraAtual.id || !idObraSupabaseValido(obraAtual.id)) {
      return () => {
        cancelado = true;
        window.clearTimeout(aplicarEstadoColecoesTimer);
      };
    }

    async function carregarEstadoSocialObra() {
      try {
        const { data: usuarioData } = await supabase.auth.getUser();
        const userId = usuarioData.user?.id || "";

        if (!userId) {
          return;
        }

        const [{ data: favoritoData }, { data: concluidaData }] = await Promise.all([
          supabase
            .from("favoritos")
            .select("obra_id")
            .eq("user_id", userId)
            .eq("obra_id", obraAtual.id)
            .limit(1)
            .maybeSingle(),
          supabase
            .from("concluidas")
            .select("obra_id")
            .eq("user_id", userId)
            .eq("obra_id", obraAtual.id)
            .limit(1)
            .maybeSingle(),
        ]);

        if (cancelado) {
          return;
        }

        setObraFavoritada(Boolean(favoritoData));
        setObraConcluida(Boolean(concluidaData));
      } catch {
        // Mantém o estado local como fallback.
      }
    }

    void carregarEstadoSocialObra();

    return () => {
      cancelado = true;
      window.clearTimeout(aplicarEstadoColecoesTimer);
    };
  }, [obra?.id, obra?.slug, obraNormalizada, usuarioIdLogado]);

  useEffect(() => {
    if (!obra) {
      const resetMetricasTimer = window.setTimeout(() => {
        setMetricasObra(metricasObraVazias);
      }, 0);

      return () => {
        window.clearTimeout(resetMetricasTimer);
      };
    }

    const obraAtual = obra;
    const obraId = obraAtual.id;
    const metricasBase = criarMetricasBaseObra(obraAtual);
    let curtidaLocalAtiva = false;
    let seguindoLocalAtivo = false;

    try {
      const curtidasTexto = lerStorageUsuarioObraPublica(
        LIKED_WORKS_STORAGE_KEY,
        usuarioIdLogado
      );
      const curtidasJson: unknown = curtidasTexto
        ? JSON.parse(curtidasTexto)
        : [];
      const obrasCurtidas = Array.isArray(curtidasJson)
        ? curtidasJson.filter(
            (titulo): titulo is string =>
              typeof titulo === "string" && Boolean(titulo.trim())
          )
        : [];

      curtidaLocalAtiva = obrasCurtidas.includes(obraNormalizada);
    } catch {
      curtidaLocalAtiva = false;
    }

    try {
      const seguidasTexto = lerStorageUsuarioObraPublica(
        FOLLOWED_WORKS_STORAGE_KEY,
        usuarioIdLogado
      );
      const seguidasJson: unknown = seguidasTexto
        ? JSON.parse(seguidasTexto)
        : [];
      const obrasSeguidas = Array.isArray(seguidasJson)
        ? seguidasJson.filter(
            (titulo): titulo is string =>
              typeof titulo === "string" && Boolean(titulo.trim())
          )
        : [];

      seguindoLocalAtivo = obrasSeguidas.includes(obraNormalizada);
    } catch {
      seguindoLocalAtivo = false;
    }

    const aplicarMetricasLocaisTimer = window.setTimeout(() => {
      setObraSeguida(seguindoLocalAtivo);
      setMetricasObra({
        ...metricasBase,
        curtidaAtiva: curtidaLocalAtiva,
        curtidas: Math.max(
          metricasBase.curtidas,
          curtidaLocalAtiva ? 1 : 0
        ),
        seguidores: Math.max(
          metricasBase.seguidores,
          seguindoLocalAtivo ? 1 : 0
        ),
        carregado: true,
      });
    }, 0);

    if (
      obraAtual.origem !== "local" ||
      !obraId ||
      !idObraSupabaseValido(obraId)
    ) {
      return () => {
        window.clearTimeout(aplicarMetricasLocaisTimer);
      };
    }

    let cancelado = false;

    async function carregarMetricasReaisObra() {
      try {
        const { data: usuarioData } = await supabase.auth.getUser();
        const userId = usuarioData.user?.id || "";

        const [
          { data: obraMetricas },
          curtidasUsuarios,
          seguidoresUsuarios,
          comentariosTotais,
        ] = await Promise.all([
          supabase
            .from("obras")
            .select("visualizacoes")
            .eq("id", obraId)
            .limit(1)
            .maybeSingle(),
          carregarUsuariosUnicosPorColunaObraPublica(
            "obra_curtidas",
            "obra_id",
            [obraId],
          ),
          carregarUsuariosUnicosPorColunaObraPublica(
            "seguindo_obras",
            "obra_id",
            [obraId],
          ),
          carregarTotaisPorColunaObraPublica(
            "comentarios_obras",
            "obra_id",
            [obraId],
          ),
        ]);

        const visualizacoes = obterNumeroSeguro(
          (obraMetricas as { visualizacoes?: number } | null)?.visualizacoes,
          metricasBase.visualizacoes
        );
        const totalCurtidas = totalUsuariosUnicosObraPublica(
          curtidasUsuarios,
          obraId,
        );
        const totalSeguidores = totalUsuariosUnicosObraPublica(
          seguidoresUsuarios,
          obraId,
        );
        const totalComentarios = totalRegistrosObraPublica(
          comentariosTotais,
          obraId,
        );

        let curtidaAtiva = curtidaLocalAtiva;
        let seguindoAtivo = seguindoLocalAtivo;

        if (userId) {
          const [{ data: curtidaUsuario }, { data: seguidorUsuario }] =
            await Promise.all([
              supabase
                .from("obra_curtidas")
                .select("id")
                .eq("obra_id", obraId)
                .eq("user_id", userId)
                .limit(1)
                .maybeSingle(),
              supabase
                .from("seguindo_obras")
                .select("id")
                .eq("obra_id", obraId)
                .eq("user_id", userId)
                .limit(1)
                .maybeSingle(),
            ]);

          curtidaAtiva = Boolean(curtidaUsuario) || curtidaAtiva;
          seguindoAtivo = Boolean(seguidorUsuario) || seguindoAtivo;
        }

        if (cancelado) {
          return;
        }

        setObraSeguida(seguindoAtivo);
        setMetricasObra({
          visualizacoes,
          curtidas: totalCurtidas,
          comentarios: totalComentarios,
          seguidores: totalSeguidores,
          curtidaAtiva,
          carregado: true,
        });
      } catch {
        if (!cancelado) {
          setMetricasObra((metricasAtuais) => ({
            ...metricasAtuais,
            carregado: true,
          }));
        }
      }
    }

    void carregarMetricasReaisObra();

    return () => {
      cancelado = true;
      window.clearTimeout(aplicarMetricasLocaisTimer);
    };
  }, [obra, obraNormalizada, usuarioIdLogado]);

  useEffect(() => {
    if (!obra) {
      const resetComunidadeTimer = window.setTimeout(() => {
        setMetricasComunidadeObra(metricasComunidadeObraVazias);
      }, 0);

      return () => {
        window.clearTimeout(resetComunidadeTimer);
      };
    }

    let cancelado = false;
    const tituloObra = obra.titulo;
    const iniciarCarregamentoTimer = window.setTimeout(() => {
      if (!cancelado) {
        setMetricasComunidadeObra(metricasComunidadeObraVazias);
      }
    }, 0);

    async function carregarMetricasComunidadeObra() {
      try {
        const tamanhoPagina = 1000;
        const postsRelacionados: SupabaseComunidadePostRow[] = [];
        let inicio = 0;

        while (true) {
          const { data: postsData, error: erroPosts } = await supabase
            .from("comunidade_posts")
            .select("id, tipo_publicacao, obra_relacionada")
            .eq("obra_relacionada", tituloObra)
            .order("id", { ascending: true })
            .range(inicio, inicio + tamanhoPagina - 1);

          if (erroPosts || !Array.isArray(postsData)) {
            throw erroPosts;
          }

          const lotePosts = postsData as unknown as SupabaseComunidadePostRow[];

          postsRelacionados.push(
            ...lotePosts.filter((post) =>
              postComunidadePertenceAObra(post, tituloObra)
            )
          );

          if (lotePosts.length < tamanhoPagina) {
            break;
          }

          inicio += tamanhoPagina;
        }

        if (cancelado) {
          return;
        }

        setMetricasComunidadeObra({
          teorias: postsRelacionados.filter(
            (post) => post.tipo_publicacao === "Teoria"
          ).length,
          reviews: postsRelacionados.filter(
            (post) => post.tipo_publicacao === "Review"
          ).length,
          posts: postsRelacionados.filter(
            (post) =>
              post.tipo_publicacao !== "Teoria" &&
              post.tipo_publicacao !== "Review"
          ).length,
          carregado: true,
        });
      } catch {
        if (!cancelado) {
          setMetricasComunidadeObra({
            ...metricasComunidadeObraVazias,
            carregado: true,
          });
        }
      }
    }

    void carregarMetricasComunidadeObra();

    return () => {
      cancelado = true;
      window.clearTimeout(iniciarCarregamentoTimer);
    };
  }, [obra?.titulo]);

  useEffect(() => {
    if (!obra) {
      const resetAvaliacaoTimer = window.setTimeout(() => {
        setAvaliacaoObra(avaliacaoObraVazia);
      }, 0);

      return () => {
        window.clearTimeout(resetAvaliacaoTimer);
      };
    }

    const obraAtual = obra;
    const notaLocal = obterAvaliacaoLocal(obraAtual, usuarioIdLogado);

    const aplicarAvaliacaoLocalTimer = window.setTimeout(() => {
      setAvaliacaoObra({
        media: notaLocal > 0 ? notaLocal : 0,
        total: notaLocal > 0 ? 1 : 0,
        minhaNota: notaLocal,
        carregado: true,
        salvando: false,
      });
    }, 0);

    if (!obraAtual.id || !idObraSupabaseValido(obraAtual.id)) {
      return () => {
        window.clearTimeout(aplicarAvaliacaoLocalTimer);
      };
    }

    let cancelado = false;

    async function carregarAvaliacaoRealObra() {
      try {
        const { data: usuarioData } = await supabase.auth.getUser();
        const userId = usuarioData.user?.id || "";

        const { data: avaliacoesData, error: erroAvaliacoes } = await supabase
          .from("obra_avaliacoes")
          .select("nota")
          .eq("obra_id", obraAtual.id)
          .limit(1000);

        if (erroAvaliacoes || !Array.isArray(avaliacoesData)) {
          return;
        }

        const notas = avaliacoesData
          .map((avaliacao) => Number((avaliacao as { nota?: unknown }).nota))
          .filter((nota) => Number.isFinite(nota) && nota >= 0.5 && nota <= 5);
        const total = notas.length;
        const media =
          total > 0
            ? notas.reduce((soma, nota) => soma + nota, 0) / total
            : 0;
        let minhaNota = notaLocal;

        if (userId) {
          const { data: minhaAvaliacao } = await supabase
            .from("obra_avaliacoes")
            .select("nota")
            .eq("obra_id", obraAtual.id)
            .eq("user_id", userId)
            .limit(1)
            .maybeSingle();

          const notaUsuario = Number(
            (minhaAvaliacao as { nota?: unknown } | null)?.nota
          );

          if (Number.isFinite(notaUsuario) && notaUsuario >= 0.5 && notaUsuario <= 5) {
            minhaNota = Math.round(notaUsuario * 2) / 2;
          }
        }

        if (cancelado) {
          return;
        }

        setAvaliacaoObra({
          media,
          total,
          minhaNota,
          carregado: true,
          salvando: false,
        });
      } catch {
        if (!cancelado) {
          setAvaliacaoObra((avaliacaoAtual) => ({
            ...avaliacaoAtual,
            carregado: true,
            salvando: false,
          }));
        }
      }
    }

    void carregarAvaliacaoRealObra();

    return () => {
      cancelado = true;
      window.clearTimeout(aplicarAvaliacaoLocalTimer);
    };
  }, [obra?.id, obra?.slug, obraNormalizada, usuarioIdLogado]);

  async function obterUsuarioLogadoParaAcao(mensagem: string) {
    try {
      const { data } = await supabase.auth.getUser();
      const userId = data.user?.id || "";

      if (!userId) {
        setMensagemAcao(mensagem);
        router.push(await criarLoginHrefObraPublica());
        return "";
      }

      return userId;
    } catch {
      setMensagemAcao(mensagem);
      router.push(await criarLoginHrefObraPublica());
      return "";
    }
  }

  async function alternarSeguirObra() {
    if (!obraNormalizada) {
      return;
    }

    const userId = await obterUsuarioLogadoParaAcao(
      "Entre na sua conta para seguir esta obra."
    );

    if (!userId) {
      return;
    }

    const seguindo = !obraSeguida;
    const obraAtual = obra;
    const seguidoresDelta = seguindo ? 1 : -1;

    try {
      const obrasSeguidasTexto = lerStorageUsuarioObraPublica(
        FOLLOWED_WORKS_STORAGE_KEY,
        userId
      );
      const obrasSeguidasJson: unknown = obrasSeguidasTexto
        ? JSON.parse(obrasSeguidasTexto)
        : [];

      const obrasSeguidas = Array.isArray(obrasSeguidasJson)
        ? obrasSeguidasJson.filter(
            (titulo): titulo is string =>
              typeof titulo === "string" && Boolean(titulo.trim())
          )
        : [];

      const chavesObraAtual = Array.from(
        new Set(
          [
            obraNormalizada,
            obraAtual?.id || "",
            obraAtual?.slug || "",
            obraAtual?.link || "",
          ].filter((chave) => Boolean(chave.trim()))
        )
      );

      const novasObrasSeguidas = seguindo
        ? Array.from(new Set([...obrasSeguidas, ...chavesObraAtual]))
        : obrasSeguidas.filter((titulo) => !chavesObraAtual.includes(titulo));

      salvarStorageUsuarioObraPublica(
        FOLLOWED_WORKS_STORAGE_KEY,
        userId,
        novasObrasSeguidas
      );

      setObraSeguida(seguindo);
      setMetricasObra((metricasAtuais) => ({
        ...metricasAtuais,
        seguidores: Math.max(0, metricasAtuais.seguidores + seguidoresDelta),
      }));
      setMensagemAcao("");

      if (
        !obraAtual ||
        obraAtual.origem !== "local" ||
        !obraAtual.id ||
        !idObraSupabaseValido(obraAtual.id)
      ) {
        return;
      }

      const obraId = obraAtual.id;

      const removerResposta = await supabase
        .from("seguindo_obras")
        .delete()
        .eq("obra_id", obraId)
        .eq("user_id", userId);

      if (removerResposta.error) {
        throw removerResposta.error;
      }

      if (seguindo) {
        const inserirResposta = await supabase.from("seguindo_obras").insert({
          obra_id: obraId,
          user_id: userId,
          visibilidade: "publico",
        });

        if (inserirResposta.error) {
          throw inserirResposta.error;
        }

        await registrarAtividadeDiarioObra({
          userId,
          obra: obraAtual,
          tipo: "salvou_obra",
          visibilidade: "publico",
          texto: `Adicionou ${obraAtual.titulo} para acompanhar.`,
        });
      } else {
        await removerAtividadeDiarioObra({
          userId,
          obra: obraAtual,
          tipo: "salvou_obra",
        });
      }
    } catch (error) {
      console.warn("Não consegui salvar seguimento da obra no Supabase:", error);
      setMensagemAcao(
        seguindo
          ? "Obra salva no navegador. Verifique o Supabase/RLS se não sincronizar online."
          : "Obra removida da lista no navegador. Verifique o Supabase/RLS se voltar depois."
      );
    }
  }

  async function alternarCurtidaObra() {
    if (!obraNormalizada) {
      return;
    }

    const userId = await obterUsuarioLogadoParaAcao(
      "Entre na sua conta para curtir esta obra."
    );

    if (!userId) {
      return;
    }

    const proximaCurtidaAtiva = !metricasObra.curtidaAtiva;

    setMetricasObra((metricasAtuais) => ({
      ...metricasAtuais,
      curtidaAtiva: proximaCurtidaAtiva,
      curtidas: Math.max(
        0,
        metricasAtuais.curtidas + (proximaCurtidaAtiva ? 1 : -1)
      ),
    }));
    setMensagemAcao("");

    if (!obra || obra.origem !== "local" || !obra.id || !idObraSupabaseValido(obra.id)) {
      try {
        const curtidasTexto = lerStorageUsuarioObraPublica(
        LIKED_WORKS_STORAGE_KEY,
        usuarioIdLogado
      );
        const curtidasJson: unknown = curtidasTexto ? JSON.parse(curtidasTexto) : [];
        const obrasCurtidas = Array.isArray(curtidasJson)
          ? curtidasJson.filter(
              (titulo): titulo is string =>
                typeof titulo === "string" && Boolean(titulo.trim())
            )
          : [];

        const novasObrasCurtidas = proximaCurtidaAtiva
          ? Array.from(new Set([...obrasCurtidas, obraNormalizada]))
          : obrasCurtidas.filter((titulo) => titulo !== obraNormalizada);

        salvarStorageUsuarioObraPublica(
          LIKED_WORKS_STORAGE_KEY,
          userId,
          novasObrasCurtidas
        );
      } catch {
        setMetricasObra((metricasAtuais) => ({
          ...metricasAtuais,
          curtidaAtiva: !proximaCurtidaAtiva,
          curtidas: Math.max(
            0,
            metricasAtuais.curtidas + (proximaCurtidaAtiva ? -1 : 1)
          ),
        }));
        setMensagemAcao("Não foi possível salvar a curtida agora.");
      }

      return;
    }

    const obraId = obra.id;

    try {
      await salvarCurtidaObraPublicaSupabase(
        userId,
        obraId,
        proximaCurtidaAtiva
      );

      setMensagemAcao("");
    } catch {
      setMetricasObra((metricasAtuais) => ({
        ...metricasAtuais,
        curtidaAtiva: !proximaCurtidaAtiva,
        curtidas: Math.max(
          0,
          metricasAtuais.curtidas + (proximaCurtidaAtiva ? -1 : 1)
        ),
      }));
      setMensagemAcao("Não foi possível salvar a curtida agora.");
    }
  }


  async function enviarComentarioObra(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!obra || comentarioEnviando) {
      return;
    }

    const textoDigitado = comentarioTexto.replace(/\s+/g, " ").trim();

    if (textoDigitado.length < 2) {
      setComentarioStatus("Escreva um comentário antes de enviar.");
      return;
    }

    const userId = await obterUsuarioLogadoParaAcao(
      respostaComentario
        ? "Entre na sua conta para responder este comentário."
        : "Entre na sua conta para comentar esta obra."
    );

    if (!userId) {
      return;
    }

    const respostaAnterior = respostaComentario;
    const textoFinal = textoDigitado.slice(0, 600);
    const perfil = await carregarPerfilPublicoObra(userId, "Você");
    const comentarioTemporario: ComentarioObraPublico = {
      id: criarComentarioObraId(),
      obraId: obra.id,
      userId,
      nome: perfil?.nome || "Você",
      avatar: perfil?.avatar || "",
      texto: textoFinal,
      criadoEm: new Date().toISOString(),
      comentarioPaiId: respostaAnterior?.comentarioPaiId || "",
      local: true,
      curtidas: [],
    };

    setComentarioEnviando(true);
    setComentarioStatus("");
    setComentarioTexto("");
    setRespostaComentario(null);

    if (comentarioTemporario.comentarioPaiId) {
      setRespostasVisiveisPorComentario((estadoAtual) => ({
        ...estadoAtual,
        [comentarioTemporario.comentarioPaiId]: Math.max(
          5,
          estadoAtual[comentarioTemporario.comentarioPaiId] || 0
        ),
      }));
    }

    setComentariosObra((comentariosAtuais) =>
      [comentarioTemporario, ...comentariosAtuais].slice(0, 120)
    );
    setTotalComentariosObra((totalAtual) => totalAtual + 1);

    if (!idObraSupabaseValido(obra.id)) {
      const comentariosLocais = [
        comentarioTemporario,
        ...comentariosObra,
      ].slice(0, 120);

      salvarComentariosObraLocais(userId, obra.id, comentariosLocais);
      setComentarioStatus(
        respostaAnterior
          ? "Resposta salva neste aparelho."
          : "Comentário salvo neste aparelho."
      );
      setComentarioEnviando(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("comentarios_obras")
        .insert({
          obra_id: obra.id,
          user_id: userId,
          comentario: comentarioTemporario.texto,
          comentario_pai_id: comentarioTemporario.comentarioPaiId || null,
        })
        .select(
          "id,obra_id,user_id,comentario,comentario_pai_id,criado_em"
        )
        .single();

      if (error || !data) {
        throw error || new Error("Comentário não retornado pelo Supabase.");
      }

      const [comentarioSincronizado] = await normalizarComentariosObraSupabase([
        data as unknown as SupabaseComentarioObraRow,
      ]);

      if (!comentarioSincronizado) {
        throw new Error("Comentário inválido retornado pelo Supabase.");
      }

      setComentariosObra((comentariosAtuais) => {
        const proximosComentarios = comentariosAtuais.map((comentario) =>
          comentario.id === comentarioTemporario.id
            ? comentarioSincronizado
            : comentario
        );

        salvarComentariosObraLocais(userId, obra.id, proximosComentarios);
        return proximosComentarios;
      });
      setComentarioStatus("");
    } catch {
      setComentariosObra((comentariosAtuais) =>
        comentariosAtuais.filter(
          (comentario) => comentario.id !== comentarioTemporario.id
        )
      );
      setTotalComentariosObra((totalAtual) =>
        Math.max(0, totalAtual - 1)
      );
      setComentarioTexto(textoDigitado);
      setRespostaComentario(respostaAnterior);
      setComentarioStatus(
        respostaAnterior
          ? "Não foi possível enviar a resposta agora."
          : "Não foi possível enviar o comentário agora."
      );
    } finally {
      setComentarioEnviando(false);
    }
  }

  function inserirNoComentarioObra(valor: string) {
    setComentarioTexto((textoAtual) => `${textoAtual}${valor}`.slice(0, 600));
    setComentarioStatus("");
  }

  function responderComentarioObra(
    comentario: ComentarioObraPublico,
    comentarioRaizId: string
  ) {
    const nomeLimpo = comentario.nome.replace(/\s+/g, " ").trim();
    const raizIdLimpo = comentarioRaizId.trim();

    if (!nomeLimpo || !raizIdLimpo) {
      return;
    }

    setRespostaComentario({
      comentarioPaiId: raizIdLimpo,
      autorId: comentario.userId,
      autorNome: nomeLimpo,
    });
    setComentarioTexto(`@${nomeLimpo} `);
    setComentarioStatus("");

    window.setTimeout(() => {
      comentarioInputRef.current?.focus();
    }, 0);
  }

  async function removerComentarioObra(comentario: ComentarioObraPublico) {
    if (!obra || comentarioRemovendoId) {
      return;
    }

    const userId = await obterUsuarioLogadoParaAcao(
      "Entre na sua conta para remover este comentário."
    );

    if (!userId || comentario.userId !== userId) {
      return;
    }

    const idsParaRemover = obterIdsComentarioComRespostas(
      comentariosObra,
      comentario.id
    );

    setComentarioRemovendoId(comentario.id);
    setComentarioStatus("");

    try {
      if (!comentario.local && idObraSupabaseValido(obra.id)) {
        const { error } = await supabase
          .from("comentarios_obras")
          .delete()
          .eq("id", comentario.id)
          .eq("obra_id", obra.id)
          .eq("user_id", userId);

        if (error) {
          throw error;
        }
      }

      setComentariosObra((comentariosAtuais) => {
        const proximosComentarios = comentariosAtuais.filter(
          (comentarioAtual) => !idsParaRemover.has(comentarioAtual.id)
        );

        salvarComentariosObraLocais(userId, obra.id, proximosComentarios);

        return proximosComentarios;
      });

      setTotalComentariosObra((totalAtual) =>
        Math.max(0, totalAtual - idsParaRemover.size)
      );

      if (
        respostaComentario &&
        (idsParaRemover.has(respostaComentario.comentarioPaiId) ||
          idsParaRemover.has(comentario.id))
      ) {
        setRespostaComentario(null);
      }
    } catch {
      setComentarioStatus("Não foi possível remover o comentário agora.");
    } finally {
      setComentarioRemovendoId("");
    }
  }

  async function alternarCurtidaComentarioObra(
    comentario: ComentarioObraPublico
  ) {
    if (!obra || comentarioCurtindoId) {
      return;
    }

    const userId = await obterUsuarioLogadoParaAcao(
      "Entre na sua conta para curtir comentários."
    );

    if (!userId) {
      return;
    }

    const jaCurtiu = comentario.curtidas.includes(userId);

    setComentarioCurtindoId(comentario.id);
    setComentarioStatus("");
    setComentariosObra((comentariosAtuais) =>
      comentariosAtuais.map((comentarioAtual) =>
        comentarioAtual.id === comentario.id
          ? {
              ...comentarioAtual,
              curtidas: jaCurtiu
                ? comentarioAtual.curtidas.filter(
                    (usuarioCurtidaId) => usuarioCurtidaId !== userId
                  )
                : Array.from(
                    new Set([...comentarioAtual.curtidas, userId])
                  ),
            }
          : comentarioAtual
      )
    );

    if (comentario.local || !idObraSupabaseValido(obra.id)) {
      setComentariosObra((comentariosAtuais) => {
        salvarComentariosObraLocais(userId, obra.id, comentariosAtuais);
        return comentariosAtuais;
      });
      setComentarioCurtindoId("");
      return;
    }

    try {
      const { error: erroRemoverCurtida } = await supabase
        .from(WORK_COMMENT_LIKES_TABLE)
        .delete()
        .eq("comentario_id", comentario.id)
        .eq("usuario_id", userId);

      if (erroRemoverCurtida) {
        throw erroRemoverCurtida;
      }

      if (!jaCurtiu) {
        const { error: erroInserirCurtida } = await supabase
          .from(WORK_COMMENT_LIKES_TABLE)
          .insert({
            comentario_id: comentario.id,
            usuario_id: userId,
          });

        if (erroInserirCurtida) {
          throw erroInserirCurtida;
        }
      }
    } catch {
      setComentariosObra((comentariosAtuais) =>
        comentariosAtuais.map((comentarioAtual) =>
          comentarioAtual.id === comentario.id
            ? {
                ...comentarioAtual,
                curtidas: jaCurtiu
                  ? Array.from(
                      new Set([...comentarioAtual.curtidas, userId])
                    )
                  : comentarioAtual.curtidas.filter(
                      (usuarioCurtidaId) => usuarioCurtidaId !== userId
                    ),
              }
            : comentarioAtual
        )
      );
      setComentarioStatus(
        "Não foi possível atualizar a curtida do comentário agora."
      );
    } finally {
      setComentarioCurtindoId("");
    }
  }

  async function alternarFavoritoObra() {
    if (!obra) {
      return;
    }

    const userId = await obterUsuarioLogadoParaAcao(
      "Entre na sua conta para salvar esta obra."
    );

    if (!userId) {
      return;
    }

    const proximoFavorito = !obraFavoritada;
    const favoritoAnterior = obraFavoritada;

    setObraFavoritada(proximoFavorito);
    salvarListaLocalObraPublica(
      obra,
      FAVORITES_STORAGE_KEY,
      proximoFavorito,
      userId
    );
    setMensagemAcao("");

    try {
      if (obra.id && idObraSupabaseValido(obra.id)) {
        await salvarRegistroObraPublicaSupabase(
          "favoritos",
          userId,
          obra.id,
          proximoFavorito
        );
      }

      if (proximoFavorito) {
        await registrarAtividadeDiarioObra({
          userId,
          obra,
          tipo: "favoritou_obra",
          visibilidade: "parcial",
          texto: `Adicionou ${obra.titulo} à lista.`,
        });
      } else {
        await removerAtividadeDiarioObra({
          userId,
          obra,
          tipo: "favoritou_obra",
        });
      }

      setMensagemAcao(
        proximoFavorito ? "" : "Obra removida da lista."
      );
    } catch (error) {
      console.warn("Não consegui salvar favorito da obra:", error);
      setObraFavoritada(favoritoAnterior);
      salvarListaLocalObraPublica(
        obra,
        FAVORITES_STORAGE_KEY,
        favoritoAnterior,
        userId
      );
      setMensagemAcao("Não foi possível salvar na lista agora.");
    }
  }

  async function alternarConcluirObra() {
    if (!obra) {
      return;
    }

    const userId = await obterUsuarioLogadoParaAcao(
      "Entre na sua conta para marcar esta obra como concluída."
    );

    if (!userId) {
      return;
    }

    const proximaConcluida = !obraConcluida;
    const concluidaAnterior = obraConcluida;

    setObraConcluida(proximaConcluida);
    salvarListaLocalObraPublica(
      obra,
      COMPLETED_STORAGE_KEY,
      proximaConcluida,
      userId
    );
    setMensagemAcao("");

    try {
      if (obra.id && idObraSupabaseValido(obra.id)) {
        await salvarRegistroObraPublicaSupabase(
          "concluidas",
          userId,
          obra.id,
          proximaConcluida
        );
      }

      if (proximaConcluida) {
        await registrarAtividadeDiarioObra({
          userId,
          obra,
          tipo: "concluiu_obra",
          visibilidade: "parcial",
          texto: `Concluiu ${obra.titulo}.`,
        });
      } else {
        await removerAtividadeDiarioObra({
          userId,
          obra,
          tipo: "concluiu_obra",
        });
      }

      setMensagemAcao(
        proximaConcluida ? "Obra marcada como concluída." : "Obra removida das concluídas."
      );
    } catch (error) {
      console.warn("Não consegui salvar conclusão da obra:", error);
      setObraConcluida(concluidaAnterior);
      salvarListaLocalObraPublica(
        obra,
        COMPLETED_STORAGE_KEY,
        concluidaAnterior,
        userId
      );
      setMensagemAcao("Não foi possível marcar como concluída agora.");
    }
  }

  async function avaliarObra(nota: number) {
    if (!obra || nota < 0 || nota > 5) {
      return;
    }

    const userId = await obterUsuarioLogadoParaAcao(
      "Entre na sua conta para avaliar esta obra."
    );

    if (!userId) {
      return;
    }

    const notaNormalizada = nota <= 0 ? 0 : Math.round(nota * 2) / 2;

    const proximaAvaliacao = calcularProximaAvaliacao(
      avaliacaoObra,
      notaNormalizada
    );

    setAvaliacaoObra(proximaAvaliacao);
    setMensagemAcao("");
    salvarAvaliacaoLocal(obra, notaNormalizada, userId);

    if (!obra.id || !idObraSupabaseValido(obra.id)) {
      setAvaliacaoObra((avaliacaoAtual) => ({
        ...avaliacaoAtual,
        salvando: false,
      }));
      return;
    }

    try {
      const resposta =
        notaNormalizada > 0
          ? await supabase.from("obra_avaliacoes").upsert(
              {
                obra_id: obra.id,
                user_id: userId,
                nota: notaNormalizada,
                atualizado_em: new Date().toISOString(),
              },
              { onConflict: "obra_id,user_id" }
            )
          : await supabase
              .from("obra_avaliacoes")
              .delete()
              .eq("obra_id", obra.id)
              .eq("user_id", userId);

      if (resposta.error) {
        throw resposta.error;
      }

      if (notaNormalizada > 0) {
        await registrarAtividadeDiarioObra({
          userId,
          obra,
          tipo: "avaliou_obra",
          nota: notaNormalizada,
          visibilidade: "publico",
          texto: `Avaliou ${obra.titulo} com ${notaNormalizada.toFixed(1).replace(".", ",")} estrelas.`,
        });
      } else {
        await removerAtividadeDiarioObra({
          userId,
          obra,
          tipo: "avaliou_obra",
        });
      }

      setAvaliacaoObra((avaliacaoAtual) => ({
        ...avaliacaoAtual,
        salvando: false,
      }));
      setMensagemAcao("");
    } catch {
      setAvaliacaoObra((avaliacaoAtual) => ({
        ...avaliacaoAtual,
        carregado: true,
        salvando: false,
      }));
      setMensagemAcao("");
    }
  }

  async function compartilharObraAtual() {
    if (!obra) {
      return;
    }

    const linkAtual = window.location.href;
    const dadosCompartilhamento: ShareData = {
      title: `${obra.titulo} no HISTORIETAS`,
      text: `Confira a obra ${obra.titulo} de ${obra.autor} no HISTORIETAS.`,
      url: linkAtual,
    };

    if (typeof navigator.share === "function") {
      try {
        const compartilhamento = navigator.share(dadosCompartilhamento);

        setAcoesObraAbertas(false);
        await compartilhamento;
        setMensagemAcao("Compartilhamento da obra aberto.");
        return;
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }
      }
    }

    setAcoesObraAbertas(false);

    try {
      let linkFoiCopiado = false;

      if (
        window.isSecureContext &&
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === "function"
      ) {
        try {
          await navigator.clipboard.writeText(linkAtual);
          linkFoiCopiado = true;
        } catch {
          linkFoiCopiado = copiarTextoComFallback(linkAtual);
        }
      } else {
        linkFoiCopiado = copiarTextoComFallback(linkAtual);
      }

      if (!linkFoiCopiado) {
        throw new Error("Não foi possível copiar o link.");
      }

      setLinkCopiado(true);
      setMensagemAcao("");

      window.setTimeout(() => {
        setLinkCopiado(false);
      }, 1800);
    } catch {
      setLinkCopiado(false);
      setMensagemAcao(
        "Não consegui compartilhar nem copiar o link da obra neste navegador.",
      );
    }
  }

  function copiarTextoComFallback(texto: string) {
    const campoTemporario = document.createElement("textarea");

    campoTemporario.value = texto;
    campoTemporario.setAttribute("readonly", "true");
    campoTemporario.style.position = "fixed";
    campoTemporario.style.left = "-9999px";
    document.body.appendChild(campoTemporario);
    campoTemporario.select();

    let copiado = false;

    try {
      copiado = document.execCommand("copy");
    } catch {
      copiado = false;
    }

    document.body.removeChild(campoTemporario);

    return copiado;
  }

  const hrefPrincipalObra = obra
    ? encontrarCapituloParaContinuarObraPublica(obra)?.href ||
      obra.link ||
      `/obra/${obra.slug}`
    : "/explorar";

  const resumoAvaliacaoCabecalho = (
    <div style={ratingSummaryStyle}>
      <strong style={ratingNumberStyle}>
        {formatarMediaAvaliacao(avaliacaoObra.media)}
      </strong>
      <span
        style={ratingStarsStyle}
        aria-label={`Média ${formatarMediaAvaliacao(
          avaliacaoObra.media
        )} de 5`}
      >
        {NOTAS_AVALIACAO_OBRA.map((estrela) => (
          <span
            key={`media-obra-${estrela}`}
            style={ratingTopStarVisualStyle}
            aria-hidden="true"
          >
            <span style={ratingTopStarBaseStyle}>★</span>
            <span
              style={{
                ...ratingTopStarFillStyle,
                width: obterPreenchimentoEstrela(
                  estrela,
                  avaliacaoObra.media
                ),
              }}
            >
              ★
            </span>
          </span>
        ))}
      </span>
      <span style={ratingTotalStyle}>
        {formatarTotalAvaliacoes(avaliacaoObra.total)}
      </span>
    </div>
  );


  function abrirComentariosObra() {
    setComentariosSheetExpandido(false);
    setMenuOrdenacaoComentariosAberto(false);
    setComentariosAbertos(true);
  }

  function fecharComentariosObra() {
    setComentariosAbertos(false);
    setComentariosSheetExpandido(false);
    setMenuOrdenacaoComentariosAberto(false);
    setRespostaComentario(null);
    comentariosDragOffsetYRef.current = 0;
  }

  function iniciarArrasteComentariosObra(
    event: TouchEvent<HTMLDivElement>
  ) {
    if (isDesktop) {
      return;
    }

    comentariosDragStartYRef.current = event.touches[0]?.clientY || 0;
    comentariosDragOffsetYRef.current = 0;
    comentariosDragIgnorarCliqueRef.current = false;

    if (comentariosDragResetTimerRef.current !== null) {
      window.clearTimeout(comentariosDragResetTimerRef.current);
      comentariosDragResetTimerRef.current = null;
    }

    if (comentariosSheetRef.current) {
      comentariosSheetRef.current.style.transition = "none";
    }
  }

  function moverArrasteComentariosObra(
    event: TouchEvent<HTMLDivElement>
  ) {
    if (isDesktop) {
      return;
    }

    const posicaoAtual =
      event.touches[0]?.clientY || comentariosDragStartYRef.current;
    const limiteSuperior = comentariosSheetExpandido ? -46 : -58;
    const limiteInferior = comentariosSheetExpandido ? 112 : 132;
    const deslocamento = Math.max(
      limiteSuperior,
      Math.min(
        limiteInferior,
        posicaoAtual - comentariosDragStartYRef.current
      )
    );

    comentariosDragOffsetYRef.current = deslocamento;

    if (Math.abs(deslocamento) > 6) {
      comentariosDragIgnorarCliqueRef.current = true;
    }

    if (comentariosSheetRef.current) {
      const handle = comentariosSheetRef.current.querySelector(
        "[data-comments-sheet-handle='true']"
      ) as HTMLElement | null;

      if (handle) {
        handle.style.transform = `translate3d(0, ${deslocamento}px, 0)`;
      }
    }
  }

  function finalizarArrasteComentariosObra() {
    if (isDesktop) {
      return;
    }

    const deslocamento = comentariosDragOffsetYRef.current;

    if (comentariosSheetRef.current) {
      comentariosSheetRef.current.style.transition = "height 220ms ease";

      const handle = comentariosSheetRef.current.querySelector(
        "[data-comments-sheet-handle='true']"
      ) as HTMLElement | null;

      if (handle) {
        handle.style.transition = "transform 160ms ease";
        handle.style.transform = "";
      }
    }

    if (comentariosDragIgnorarCliqueRef.current) {
      comentariosDragResetTimerRef.current = window.setTimeout(() => {
        comentariosDragIgnorarCliqueRef.current = false;
        comentariosDragResetTimerRef.current = null;
      }, 350);
    }

    if (deslocamento < -34) {
      setComentariosSheetExpandido(true);
      return;
    }

    if (deslocamento > 52 && comentariosSheetExpandido) {
      setComentariosSheetExpandido(false);
      return;
    }

    if (deslocamento > 118 && !comentariosSheetExpandido) {
      fecharComentariosObra();
    }
  }

  function alternarExpansaoComentariosObra() {
    if (isDesktop || comentariosDragIgnorarCliqueRef.current) {
      return;
    }

    setComentariosSheetExpandido((expandidoAtual) => !expandidoAtual);
  }


  const estruturaComentariosObra = useMemo(
    () => criarEstruturaComentariosObra(comentariosObra, ordenacaoComentarios),
    [comentariosObra, ordenacaoComentarios]
  );

  function renderizarComentarioObra(
    comentario: ComentarioObraPublico,
    comentarioRaizId: string,
    resposta = false
  ) {
    const podeRemover = Boolean(
      usuarioIdLogado && comentario.userId === usuarioIdLogado
    );
    const removendo = comentarioRemovendoId === comentario.id;
    const curtindo = comentarioCurtindoId === comentario.id;
    const usuarioCurtiu = Boolean(
      usuarioIdLogado && comentario.curtidas.includes(usuarioIdLogado)
    );
    const avatarStyle = comentario.avatar
      ? {
          ...(resposta
            ? commentSheetReplyAvatarLinkStyle
            : commentSheetAvatarLinkStyle),
          backgroundImage: `url(${comentario.avatar})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }
      : resposta
        ? commentSheetReplyAvatarLinkStyle
        : commentSheetAvatarLinkStyle;

    return (
      <article
        key={comentario.id}
        style={
          resposta ? commentSheetReplyItemStyle : commentSheetItemStyle
        }
      >
        <Link
          href={criarLinkPerfilAutor(comentario.nome, comentario.userId)}
          aria-label={`Abrir perfil de ${comentario.nome}`}
          style={avatarStyle}
        >
          {!comentario.avatar
            ? comentario.nome.slice(0, 1).toUpperCase() || "U"
            : null}
        </Link>

        <div style={commentSheetContentStyle}>
          <div style={commentSheetTopLineStyle}>
            <Link
              href={criarLinkPerfilAutor(comentario.nome, comentario.userId)}
              data-historietas-i18n-ignore="true"
              style={commentSheetAuthorLinkStyle}
            >
              {comentario.nome}
            </Link>

            <span style={commentSheetTimeStyle}>
              {formatarTempoRelativoComentarioObra(
                comentario.criadoEm,
                agoraComentarios
              )}
            </span>
          </div>

          <p data-historietas-i18n-ignore="true" style={commentSheetTextStyle}>{comentario.texto}</p>

          <div style={commentSheetActionsRowStyle}>
            <button
              type="button"
              onClick={() =>
                responderComentarioObra(comentario, comentarioRaizId)
              }
              style={commentSheetReplyButtonStyle}
            >
              Responder
            </button>

            {podeRemover ? (
              <button
                type="button"
                onClick={() => void removerComentarioObra(comentario)}
                disabled={removendo}
                style={{
                  ...commentSheetRemoveButtonStyle,
                  opacity: removendo ? 0.58 : 1,
                  cursor: removendo ? "not-allowed" : "pointer",
                }}
              >
                {removendo ? "Removendo..." : "Remover"}
              </button>
            ) : null}
          </div>
        </div>

        <div style={commentSheetLikeWrapStyle}>
          <button
            type="button"
            aria-label={
              usuarioCurtiu
                ? "Remover curtida do comentário"
                : "Curtir comentário"
            }
            onClick={() => void alternarCurtidaComentarioObra(comentario)}
            disabled={curtindo}
            style={{
              ...commentSheetLikeButtonStyle,
              opacity: curtindo ? 0.58 : 1,
              cursor: curtindo ? "not-allowed" : "pointer",
            }}
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              style={commentSheetHeartIconStyle}
            >
              <path
                d="M20.7 5.3c-1.8-1.9-4.7-1.9-6.5 0L12 7.6 9.8 5.3c-1.8-1.9-4.7-1.9-6.5 0-1.8 1.9-1.8 5 0 6.9L12 21l8.7-8.8c1.8-1.9 1.8-5 0-6.9Z"
                fill={usuarioCurtiu ? "var(--historietas-obra-heart, #F43F5E)" : "none"}
                stroke={
                  usuarioCurtiu
                    ? "var(--historietas-obra-heart, #F43F5E)"
                    : "var(--historietas-text-secondary, #D4D4D8)"
                }
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <span style={commentSheetLikeCountStyle}>
            {comentario.curtidas.length}
          </span>
        </div>
      </article>
    );
  }


  const painelComentariosObra =
    obra && comentariosAbertos && typeof document !== "undefined"
      ? createPortal(
          <section
            data-historietas-obra-comments-root="true"
            style={commentsSheetOverlayStyle}
            aria-label={`Comentários de ${obra.titulo}`}
          >
            <button
              type="button"
              aria-label="Fechar comentários"
              onClick={fecharComentariosObra}
              style={commentsSheetBackdropStyle}
            />

            <article
              ref={comentariosSheetRef}
              role="dialog"
              aria-modal="true"
              aria-label={`Comentários de ${obra.titulo}`}
              style={
                isDesktop
                  ? desktopCommentsSheetStyle
                  : {
                      ...commentsSheetStyle,
                      ...(comentariosSheetExpandido
                        ? commentsSheetExpandedStyle
                        : commentsSheetCompactStyle),
                    }
              }
            >
              <div
                data-comments-sheet-handle="true"
                style={commentsSheetHandleWrapStyle}
                onClick={alternarExpansaoComentariosObra}
                onTouchStart={iniciarArrasteComentariosObra}
                onTouchMove={moverArrasteComentariosObra}
                onTouchEnd={finalizarArrasteComentariosObra}
                onTouchCancel={finalizarArrasteComentariosObra}
                role="button"
                tabIndex={0}
                aria-label={
                  comentariosSheetExpandido
                    ? "Recolher comentários"
                    : "Expandir comentários"
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    alternarExpansaoComentariosObra();
                  }
                }}
              >
                <div style={commentsSheetHandleStyle} />
              </div>

              <header style={commentsSheetHeaderStyle}>
                <span style={commentsSheetHeaderSpacerStyle} aria-hidden="true" />

                <strong style={commentsSheetTitleStyle}>
                  {totalComentariosObra === 1
                    ? "1 comentário"
                    : `${totalComentariosObra} comentários`}
                </strong>

                <div style={commentsSortMenuWrapStyle}>
                  <button
                    type="button"
                    onClick={() =>
                      setMenuOrdenacaoComentariosAberto((aberto) => !aberto)
                    }
                    style={commentsSortMenuTriggerStyle}
                    aria-label="Ordenar comentários"
                    aria-haspopup="menu"
                    aria-expanded={menuOrdenacaoComentariosAberto}
                  >
                    +
                  </button>

                  {menuOrdenacaoComentariosAberto ? (
                    <div style={commentsSortMenuStyle} role="menu">
                      <button
                        type="button"
                        onClick={() => {
                          setOrdenacaoComentarios("relevantes");
                          setMenuOrdenacaoComentariosAberto(false);
                        }}
                        style={
                          ordenacaoComentarios === "relevantes"
                            ? commentsSortMenuItemActiveStyle
                            : commentsSortMenuItemStyle
                        }
                        role="menuitem"
                        aria-pressed={ordenacaoComentarios === "relevantes"}
                      >
                        Relevantes
                      </button>

                      <div style={commentsSortMenuDividerStyle} aria-hidden="true" />

                      <button
                        type="button"
                        onClick={() => {
                          setOrdenacaoComentarios("recentes");
                          setMenuOrdenacaoComentariosAberto(false);
                        }}
                        style={
                          ordenacaoComentarios === "recentes"
                            ? commentsSortMenuItemActiveStyle
                            : commentsSortMenuItemStyle
                        }
                        role="menuitem"
                        aria-pressed={ordenacaoComentarios === "recentes"}
                      >
                        Recentes
                      </button>
                    </div>
                  ) : null}
                </div>
              </header>

              <section style={commentsSheetListStyle}>
                {comentariosCarregando ? (
                  <div style={commentsLoadingStyle}>
                    <LoadingSpinner
                      compacto
                      label="Carregando comentários"
                    />
                  </div>
                ) : estruturaComentariosObra.comentariosRaiz.length > 0 ? (
                  estruturaComentariosObra.comentariosRaiz.map((comentario) => {
                    const respostas =
                      estruturaComentariosObra.respostasPorRaiz.get(
                        comentario.id
                      ) || [];
                    const quantidadeVisivel = Math.min(
                      respostas.length,
                      respostasVisiveisPorComentario[comentario.id] || 0
                    );
                    const respostasVisiveis = respostas.slice(
                      0,
                      quantidadeVisivel
                    );
                    const respostasOcultas = Math.max(
                      0,
                      respostas.length - quantidadeVisivel
                    );
                    const respostasExpandidas = quantidadeVisivel > 0;

                    return (
                      <section key={comentario.id} style={commentThreadStyle}>
                        {renderizarComentarioObra(
                          comentario,
                          comentario.id
                        )}

                        {respostasVisiveis.length > 0 ? (
                          <div style={commentRepliesListStyle}>
                            {respostasVisiveis.map((resposta) =>
                              renderizarComentarioObra(
                                resposta,
                                comentario.id,
                                true
                              )
                            )}
                          </div>
                        ) : null}

                        {respostas.length > 0 && !respostasExpandidas ? (
                          <button
                            type="button"
                            onClick={() =>
                              setRespostasVisiveisPorComentario(
                                (estadoAtual) => ({
                                  ...estadoAtual,
                                  [comentario.id]: Math.min(5, respostas.length),
                                })
                              )
                            }
                            style={commentRepliesToggleStyle}
                          >
                            <span style={commentRepliesLineStyle} />
                            {`Ver ${respostas.length} ${
                              respostas.length === 1 ? "resposta" : "respostas"
                            }`}
                          </button>
                        ) : null}

                        {respostasExpandidas ? (
                          <div style={commentRepliesControlsStyle}>
                            {respostasOcultas > 0 ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setRespostasVisiveisPorComentario(
                                    (estadoAtual) => ({
                                      ...estadoAtual,
                                      [comentario.id]: Math.min(
                                        respostas.length,
                                        (estadoAtual[comentario.id] || 0) + 5
                                      ),
                                    })
                                  )
                                }
                                style={commentRepliesToggleStyle}
                              >
                                <span style={commentRepliesLineStyle} />
                                {`Ver mais ${respostasOcultas} ${
                                  respostasOcultas === 1
                                    ? "resposta"
                                    : "respostas"
                                }`}
                              </button>
                            ) : null}

                            <button
                              type="button"
                              onClick={() =>
                                setRespostasVisiveisPorComentario(
                                  (estadoAtual) => ({
                                    ...estadoAtual,
                                    [comentario.id]: 0,
                                  })
                                )
                              }
                              style={commentRepliesHideButtonStyle}
                            >
                              Ocultar respostas
                            </button>
                          </div>
                        ) : null}
                      </section>
                    );
                  })
                ) : (
                  <p style={emptyCommentsStyle}>Sem comentários ainda</p>
                )}
              </section>

              <section style={commentsToolsStyle}>
                <div style={commentsQuickReactionsStyle}>
                  {["💜", "🔥", "😂", "😮", "😭", "👏"].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => inserirNoComentarioObra(emoji)}
                      style={commentsQuickReactionButtonStyle}
                      aria-label={`Adicionar ${emoji} ao comentário`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </section>

              <form
                onSubmit={enviarComentarioObra}
                style={commentsSheetFormStyle}
              >
                <div
                  style={
                    perfilUsuarioLogado?.avatar
                      ? {
                          ...commentsInputAvatarStyle,
                          backgroundImage: `url(${perfilUsuarioLogado.avatar})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }
                      : commentsInputAvatarStyle
                  }
                >
                  {!perfilUsuarioLogado?.avatar
                    ? usuarioIdLogado
                      ? perfilUsuarioLogado?.nome.slice(0, 1).toUpperCase() || "V"
                      : "H"
                    : null}
                </div>

                <div style={commentsInputBoxStyle}>
                  <textarea
                    ref={comentarioInputRef}
                    value={comentarioTexto}
                    onChange={(event) => {
                      setComentarioTexto(event.target.value.slice(0, 600));
                      setComentarioStatus("");
                    }}
                    style={commentsSheetInputStyle}
                    placeholder={
                      usuarioIdLogado
                        ? "Adicionar comentário..."
                        : "Entre para comentar."
                    }
                    maxLength={600}
                    rows={1}
                    disabled={comentarioEnviando}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => inserirNoComentarioObra("@")}
                  disabled={comentarioEnviando}
                  style={commentsInputIconButtonStyle}
                  aria-label="Adicionar menção"
                >
                  @
                </button>

                <button
                  type="submit"
                  aria-label="Enviar comentário"
                  disabled={comentarioEnviando}
                  style={{
                    ...commentsSheetSendStyle,
                    opacity: comentarioEnviando ? 0.58 : 1,
                    cursor: comentarioEnviando ? "not-allowed" : "pointer",
                  }}
                >
                  {comentarioEnviando ? (
                    <LoadingSpinner
                      compacto
                      label="Enviando comentário"
                    />
                  ) : (
                    "↑"
                  )}
                </button>
              </form>

              {comentarioStatus ? (
                <span style={commentStatusStyle}>{comentarioStatus}</span>
              ) : null}
            </article>
          </section>,
          document.body
        )
      : null;

  if (carregandoObras && !obra) {
    return (
      <main data-historietas-obra-dinamica-root="true" style={pageThemeStyle} aria-busy="true">
        <style>{`${historietasThemeCss}${obraPageCss}`}</style>

        <ObraDinamicaLanguageBridge />

        {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
        {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}

        <LoadingSpinner label="Carregando obra" />
      </main>
    );
  }

  if (!obra) {
    return (
      <main data-historietas-obra-dinamica-root="true" style={pageThemeStyle}>
        <style>{`${historietasThemeCss}${obraPageCss}`}</style>

        <ObraDinamicaLanguageBridge />

        {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
        {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}

        <section style={isDesktop ? desktopContainerStyle : containerStyle}>
          <p
            style={{
              margin: "10px 0 0",
              color: "#FFFFFF",
              fontSize: "12px",
              fontWeight: 800,
              textAlign: "center",
            }}
          >
            Obra não encontrada
          </p>
        </section>
      </main>
    );
  }

  if (!obraDisponivel) {
    return (
      <main data-historietas-obra-dinamica-root="true" style={pageThemeStyle}>
        <style>{`${historietasThemeCss}${obraPageCss}`}</style>

        <ObraDinamicaLanguageBridge />

        {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
        {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}
      </main>
    );
  }

  return (
    <>
      <main data-historietas-obra-dinamica-root="true" style={pageThemeStyle}>
      <style>{`${historietasThemeCss}${obraPageCss}`}</style>

        <ObraDinamicaLanguageBridge />

      {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
      {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}

      {mensagemAcao ? (
        <div
          style={obraActionToastStyle}
          role="status"
          aria-live="polite"
        >
          {mensagemAcao}
        </div>
      ) : null}

      <section style={isDesktop ? desktopContainerStyle : containerStyle}>
        <section style={isDesktop ? desktopHeroStyle : heroStyle}>
          <header
            style={isDesktop ? desktopHeroTopOverlayStyle : heroTopOverlayStyle}
          >
            <Link href="/" style={heroLogoStyle} aria-label="Historietas">
              <span style={logoMarkStyle}>H</span>
            </Link>

            {isDesktop ? (
              <div style={desktopHeaderRightStyle}>
                <Link
                  href="/notificacoes"
                  style={desktopNotificationButtonStyle}
                  aria-label={
                    notificacoesNaoLidas > 0
                      ? `Notificações: ${notificacoesNaoLidas} não lidas`
                      : "Notificações"
                  }
                >
                  N

                  {notificacoesNaoLidas > 0 ? (
                    <span style={desktopNotificationBadgeStyle}>
                      {notificacoesNaoLidas > 99
                        ? "99+"
                        : notificacoesNaoLidas}
                    </span>
                  ) : null}
                </Link>

                {resumoAvaliacaoCabecalho}
              </div>
            ) : (
              resumoAvaliacaoCabecalho
            )}
          </header>

          <div style={heroGlowStyle} />

          <div style={isDesktop ? desktopHeroContentStyle : heroContentStyle}>
            <Link
              href={hrefPrincipalObra}
              style={isDesktop ? desktopHeroCoverLinkStyle : heroCoverLinkStyle}
              aria-label={`Abrir ${obra.titulo}`}
            >
              <div
                style={
                  isDesktop
                    ? criarDesktopCoverArtStyle(obra.capa)
                    : criarCoverArtStyle(obra.capa)
                }
                aria-hidden="true"
              >
                {!obra.capa && (
                  <strong style={coverTitleStyle}>
                    {obra.titulo
                      .split(" ")
                      .map((parte) => parte[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </strong>
                )}
              </div>
            </Link>

            <div
              style={
                isDesktop
                  ? desktopHeroOverlayContentStyle
                  : heroOverlayContentStyle
              }
            >
              <h1
                data-historietas-i18n-ignore="true"
                className="historietas-theme-title"
                style={isDesktop ? desktopTitleStyle : titleStyle}
              >
                {obra.titulo}
              </h1>


              <div
                style={
                  isDesktop ? desktopHeroBottomMetaBarStyle : heroBottomMetaBarStyle
                }
              >
                <Link
                  href={criarLinkPerfilAutor(autorObraNome, autorObraId)}
                  style={heroBottomAuthorLinkStyle}
                  aria-label={`Abrir perfil do autor ${autorObraNome}`}
                  title={perfilAutorObra?.bio || undefined}
                >
                  Por <span data-historietas-i18n-ignore="true">{autorObraNome}</span>
                </Link>

                <div style={heroBottomMetricsStyle}>
                  <span style={heroBottomMetricStyle}>
                    <span style={metricInlineContentStyle}>
                      <span style={metricEmojiIconStyle}>👁</span>
                      <span style={metricWhiteNumberStyle}>
                        {formatarNumeroCompacto(metricasObra.visualizacoes)}
                      </span>
                    </span>
                  </span>

                  <span style={heroBottomMetricStyle}>
                    <span style={metricInlineContentStyle}>
                      <span style={metricEmojiIconStyle}>❤️</span>
                      <span style={metricWhiteNumberStyle}>
                        {formatarNumeroCompacto(metricasObra.curtidas)}
                      </span>
                    </span>
                  </span>

                  <span style={heroBottomMetricStyle}>
                    <span style={metricInlineContentStyle}>
                      <span style={metricEmojiIconStyle}>💬</span>
                      <span style={metricWhiteNumberStyle}>
                        {formatarNumeroCompacto(totalComentariosObra)}
                      </span>
                    </span>
                  </span>

                </div>
              </div>

              <div style={isDesktop ? desktopHeroActionsStyle : heroActionsStyle}>
                <button
                  type="button"
                  onClick={alternarSeguirObra}
                  style={obraSeguida ? followedButtonStyle : secondaryButtonStyle}
                >
                  {obraSeguida ? "✓ Seguindo" : "Seguir obra"}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setAcoesObraAbertas((menuAberto) => !menuAberto)
                  }
                  style={obraAddButtonStyle}
                  aria-label="Abrir ações da obra"
                  aria-expanded={acoesObraAbertas}
                  aria-haspopup="dialog"
                >
                  +
                </button>
              </div>
            </div>
          </div>

        </section>

        {acoesObraAbertas && (
          <div
            style={obraActionSheetOverlayStyle}
            role="presentation"
            onClick={() => setAcoesObraAbertas(false)}
          >
            <section
              style={isDesktop ? desktopObraActionsMenuStyle : obraActionsMenuStyle}
              role="dialog"
              aria-label={`Ações da obra ${obra.titulo}`}
              onClick={(event) => event.stopPropagation()}
            >
              <div style={obraActionSheetHandleStyle} aria-hidden="true" />

              <div style={obraMenuHeaderStyle}>
                <strong data-historietas-i18n-ignore="true" style={obraMenuTitleStyle}>{obra.titulo}</strong>

                <div style={obraMenuAuthorMetricsRowStyle}>
                  <Link
                    href={criarLinkPerfilAutor(autorObraNome, autorObraId)}
                    style={obraMenuAuthorLinkStyle}
                    aria-label={`Abrir perfil do autor ${autorObraNome}`}
                    title={perfilAutorObra?.bio || undefined}
                  >
                    Por <span data-historietas-i18n-ignore="true">{autorObraNome}</span>
                  </Link>
                </div>

                <div style={obraMenuTagsStyle}>
                  {[
                    obra.formato,
                    generoObraFormatado,
                    ...obra.tags,
                    obra.classificacaoIndicativa,
                    obra.arquivoObra ? "Arquivo anexado" : "",
                  ]
                    .filter((tag) => tag.trim())
                    .slice(0, 10)
                    .map((tag, index) => (
                      <span
                        key={`${obra.id}-menu-tag-${tag}-${index}`}
                        style={obraMenuTagStyle}
                      >
                        {index > 0 ? (
                          <span style={obraMenuTagSeparatorStyle}>•</span>
                        ) : null}
                        {tag}
                      </span>
                    ))}
                </div>

                <div style={obraMenuMetricsStyle}>
                  <span style={obraMenuMetricStyle}>
                    <span style={metricInlineContentStyle}>
                      <span style={metricEmojiIconStyle}>👁</span>
                      <span style={metricWhiteNumberStyle}>
                        {formatarNumeroCompacto(metricasObra.visualizacoes)}
                      </span>
                    </span>
                  </span>

                  <span style={obraMenuMetricStyle}>
                    <span style={metricInlineContentStyle}>
                      <span style={metricEmojiIconStyle}>❤️</span>
                      <span style={metricWhiteNumberStyle}>
                        {formatarNumeroCompacto(metricasObra.curtidas)}
                      </span>
                    </span>
                  </span>

                  <span style={obraMenuMetricStyle}>
                    <span style={metricInlineContentStyle}>
                      <span style={metricEmojiIconStyle}>💬</span>
                      <span style={metricWhiteNumberStyle}>
                        {formatarNumeroCompacto(totalComentariosObra)}
                      </span>
                    </span>
                  </span>

                  <span style={obraMenuMetricStyle}>
                    <span style={metricInlineContentStyle}>
                      <span style={metricEmojiIconStyle}>🔖</span>
                      <span style={metricWhiteNumberStyle}>
                        {formatarNumeroCompacto(metricasObra.seguidores)}
                      </span>
                    </span>
                  </span>

                  <span style={obraMenuMetricStyle}>
                    <span style={metricInlineContentStyle}>
                      <span style={metricEmojiIconStyle}>
                        {indicadorConteudoIcone}
                      </span>
                      <span style={metricWhiteNumberStyle}>
                        {indicadorConteudoValor}
                      </span>
                    </span>
                  </span>
                </div>
              </div>

              <span style={obraMenuSectionLabelStyle}>Ações</span>

              <div style={obraMenuActionsStyle}>
                <button
                  type="button"
                  onClick={() => {
                    setAcoesObraAbertas(false);
                    void alternarFavoritoObra();
                  }}
                  style={
                    obraFavoritada
                      ? obraMenuItemActiveStyle
                      : obraMenuItemButtonStyle
                  }
                >
                  <span>{obraFavoritada ? "Salvo" : "Salvar"}</span>
                  <span
                    style={
                      obraFavoritada
                        ? obraMenuItemDotActiveStyle
                        : obraMenuItemDotStyle
                    }
                  >
                    {obraFavoritada ? "✓" : ""}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAcoesObraAbertas(false);
                    void alternarConcluirObra();
                  }}
                  style={
                    obraConcluida
                      ? obraMenuItemActiveStyle
                      : obraMenuItemButtonStyle
                  }
                >
                  <span>{obraConcluida ? "Concluída" : "Concluir"}</span>
                  <span
                    style={
                      obraConcluida
                        ? obraMenuItemDotActiveStyle
                        : obraMenuItemDotStyle
                    }
                  >
                    {obraConcluida ? "✓" : ""}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    void compartilharObraAtual();
                  }}
                  style={
                    linkCopiado
                      ? obraMenuItemCopiedStyle
                      : obraMenuItemButtonStyle
                  }
                >
                  <span>{linkCopiado ? "Link copiado!" : "Compartilhar"}</span>
                </button>

                {sinopseObraMenu ? (
                  <div style={obraMenuSynopsisStyle}>
                    <span style={obraMenuSynopsisLabelStyle}>Sinopse</span>
                    <p data-historietas-i18n-ignore="true" style={obraMenuSynopsisTextStyle}>{sinopseObraMenu}</p>
                  </div>
                ) : null}
              </div>
            </section>
          </div>
        )}

        <section style={isDesktop ? desktopWorkRatingBoxStyle : workRatingBoxStyle}>
          <div style={workRatingHeaderStyle}>
            <span style={workRatingTitleStyle}>AVALIE ESTA OBRA</span>
          </div>

          <div style={workRatingStarsRowStyle}>
            {NOTAS_AVALIACAO_OBRA.map((estrela) => {
              const preenchimentoEstrela = obterPreenchimentoEstrela(
                estrela,
                avaliacaoObra.minhaNota
              );
              const proximaNota = obterProximaNotaAvaliacao(
                estrela,
                avaliacaoObra.minhaNota
              );

              return (
                <button
                  key={`avaliacao-obra-${estrela}`}
                  type="button"
                  onClick={() => void avaliarObra(proximaNota)}
                  disabled={avaliacaoObra.salvando}
                  style={
                    preenchimentoEstrela === "0%"
                      ? workRatingStarButtonStyle
                      : workRatingStarActiveStyle
                  }
                  aria-label={`Avaliar com ${proximaNota
                    .toString()
                    .replace(".", ",")} estrela${proximaNota === 1 ? "" : "s"}`}
                >
                  <span style={workRatingStarVisualStyle} aria-hidden="true">
                    <span style={workRatingStarBaseStyle}>★</span>
                    <span
                      style={{
                        ...workRatingStarFillStyle,
                        width: preenchimentoEstrela,
                      }}
                    >
                      ★
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section style={isDesktop ? desktopCommunityBoxStyle : communityBoxStyle}>
          <div style={communityHeaderStyle}>
            <h2 style={communityTitleStyle}>COMUNIDADE</h2>

          </div>

          <div style={communityGridStyle}>
            <CommunityItem
              numero={
                metricasComunidadeObra.carregado
                  ? formatarNumeroCompacto(metricasComunidadeObra.teorias)
                  : "—"
              }
              rotulo="teorias"
              href={criarLinkComunidadeObra(obra.titulo, "Teoria")}
            />
            <CommunityItem
              numero={
                metricasComunidadeObra.carregado
                  ? formatarNumeroCompacto(metricasComunidadeObra.reviews)
                  : "—"
              }
              rotulo="reviews"
              href={criarLinkComunidadeObra(obra.titulo, "Review")}
            />
            <CommunityItem
              numero={
                metricasComunidadeObra.carregado
                  ? formatarNumeroCompacto(metricasComunidadeObra.posts)
                  : "—"
              }
              rotulo="posts"
              href={criarLinkComunidadeObra(obra.titulo, "posts")}
            />
          </div>
        </section>

        <section style={isDesktop ? desktopStatsGridStyle : statsGridStyle}>
          <MetricCard
            numero={formatarNumeroCompacto(metricasObra.visualizacoes)}
            rotulo="visualizações"
          />
          <MetricCard
            numero={formatarNumeroCompacto(metricasObra.curtidas)}
            rotulo="curtidas"
            ativo={metricasObra.curtidaAtiva}
            mostrarCoracao
            onClick={alternarCurtidaObra}
          />
          <MetricCard
            numero={formatarNumeroCompacto(totalComentariosObra)}
            rotulo="comentários"
            onClick={abrirComentariosObra}
          />
          <MetricCard
            numero={formatarNumeroCompacto(metricasObra.seguidores)}
            rotulo="seguidores"
          />
        </section>

        {capitulosDaObra.length > 0 && (
          <section id="capitulos" style={chaptersSectionStyle}>
            <div style={sectionHeaderStyle}>
              <h2 style={accentSectionTitleStyle}>CAPÍTULOS</h2>

              <span style={chapterCountBadgeStyle}>
                {obraDisponivel
                  ? `${capitulosDaObra.length} disponíveis`
                  : `${capitulosDaObra.length} em breve`}
              </span>
            </div>

            <div style={isDesktop ? desktopChaptersListStyle : chaptersListStyle}>
              {capitulosDaObra.map((capitulo) => (
                <Link
                  key={capitulo.id || capitulo.numero}
                  href={capitulo.href}
                  style={isDesktop ? desktopChapterCardStyle : chapterCardStyle}
                  aria-label={`Abrir ${capitulo.titulo}`}
                >
                  <div style={chapterNumberStyle}>{capitulo.numero}</div>

                  <div style={chapterContentStyle}>
                    <h3 data-historietas-i18n-ignore="true" style={chapterTitleStyle}>{capitulo.titulo}</h3>

                    {capitulo.descricao ? (
                      <p style={chapterMetaStyle}>{capitulo.descricao}</p>
                    ) : null}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}


        {obra.arquivoObra && (
          <ArquivoObraPublico
            arquivo={obra.arquivoObra}
            tituloObra={obra.titulo}
            isDesktop={isDesktop}
          />
        )}


      </section>
      </main>

      {painelComentariosObra}
    </>
  );
}

function ArquivoObraPublico({
  arquivo,
  tituloObra,
  isDesktop,
}: {
  arquivo: ArquivoObraLocal;
  tituloObra: string;
  isDesktop: boolean;
}) {
  const tamanhoArquivo = formatarTamanhoArquivo(arquivo.tamanho);
  const dataArquivo = formatarData(arquivo.criadoEm);
  const arquivoConteudo = arquivo.conteudo.trim();
  const caminhoStorageArquivo =
    obterCaminhoStorageArquivoObra(arquivoConteudo);
  const nomeArquivoDownload =
    arquivo.nome?.trim() || "arquivo-da-obra";
  const [arquivoAssinado, setArquivoAssinado] = useState({
    caminho: "",
    url: "",
    erro: "",
  });

  useEffect(() => {
    if (!caminhoStorageArquivo) {
      return;
    }

    let cancelado = false;

    async function prepararArquivoPrivado() {
      try {
        const url = await criarUrlAssinadaArquivoObra(
          caminhoStorageArquivo
        );

        if (!cancelado) {
          setArquivoAssinado({
            caminho: caminhoStorageArquivo,
            url,
            erro: "",
          });
        }
      } catch {
        if (!cancelado) {
          setArquivoAssinado({
            caminho: caminhoStorageArquivo,
            url: "",
            erro: "Não foi possível liberar este arquivo agora.",
          });
        }
      }
    }

    void prepararArquivoPrivado();

    return () => {
      cancelado = true;
    };
  }, [caminhoStorageArquivo]);

  const assinaturaAtual =
    arquivoAssinado.caminho === caminhoStorageArquivo;
  const arquivoHref = caminhoStorageArquivo
    ? assinaturaAtual
      ? arquivoAssinado.url
      : ""
    : arquivoConteudo;
  const arquivoErro =
    caminhoStorageArquivo && assinaturaAtual
      ? arquivoAssinado.erro
      : "";
  const arquivoCarregando = Boolean(
    caminhoStorageArquivo && !assinaturaAtual
  );
  const arquivoIndisponivel = !arquivoHref;

  async function baixarArquivo() {
    if (!arquivoHref) {
      return;
    }

    try {
      const resposta = await fetch(arquivoHref);

      if (!resposta.ok) {
        throw new Error("Não foi possível baixar o arquivo.");
      }

      const arquivoBlob = await resposta.blob();
      const arquivoUrlTemporaria =
        window.URL.createObjectURL(arquivoBlob);
      const linkDownload = document.createElement("a");

      linkDownload.href = arquivoUrlTemporaria;
      linkDownload.download = nomeArquivoDownload;
      document.body.appendChild(linkDownload);
      linkDownload.click();
      linkDownload.remove();

      window.setTimeout(() => {
        window.URL.revokeObjectURL(arquivoUrlTemporaria);
      }, 1000);
    } catch {
      const linkDownload = document.createElement("a");

      linkDownload.href = arquivoHref;
      linkDownload.download = nomeArquivoDownload;
      linkDownload.rel = "noopener noreferrer";
      document.body.appendChild(linkDownload);
      linkDownload.click();
      linkDownload.remove();
    }
  }

  return (
    <section style={isDesktop ? desktopFileBoxStyle : fileBoxStyle}>
      <div style={isDesktop ? desktopFileInfoCardStyle : fileInfoCardStyle}>
        <a
          href={arquivoHref || undefined}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            ...filePreviewLinkStyle,
            opacity: arquivoIndisponivel ? 0.56 : 1,
            pointerEvents: arquivoIndisponivel ? "none" : "auto",
          }}
          aria-label={`Abrir arquivo ${arquivo.nome}`}
          aria-disabled={arquivoIndisponivel}
          onClick={(event) => {
            if (arquivoIndisponivel) {
              event.preventDefault();
            }
          }}
        >
          {arquivo.categoria === "imagem" && arquivoHref ? (
            <img
              src={arquivoHref}
              alt={`Prévia do arquivo ${arquivo.nome}`}
              style={fileImagePreviewStyle}
            />
          ) : (
            <span style={fileIconBoxStyle}>
              {arquivo.categoria === "documento"
                ? "PDF"
                : arquivo.categoria === "texto"
                  ? "TXT"
                  : "ARQ"}
            </span>
          )}
        </a>

        <div style={fileInfoTextStyle}>
          <span style={fileMetaStyle}>
            {tituloObra} • {tamanhoArquivo} • {dataArquivo}
          </span>

          {arquivoErro ? (
            <span
              style={{
                ...fileMetaStyle,
                color: "var(--historietas-obra-danger, #EF4444)",
              }}
            >
              {arquivoErro}
            </span>
          ) : null}

          <div style={isDesktop ? desktopFileActionsStyle : fileActionsStyle}>
            <a
              href={arquivoHref || undefined}
              target="_blank"
              rel="noopener noreferrer"
              aria-disabled={arquivoIndisponivel}
              onClick={(event) => {
                if (arquivoIndisponivel) {
                  event.preventDefault();
                }
              }}
              style={{
                ...filePrimaryButtonStyle,
                opacity: arquivoIndisponivel ? 0.58 : 1,
                pointerEvents: arquivoIndisponivel ? "none" : "auto",
              }}
            >
              {arquivoCarregando ? (
                <LoadingSpinner
                  compacto
                  label="Preparando arquivo"
                />
              ) : arquivoErro ? (
                "Arquivo indisponível"
              ) : (
                "Abrir arquivo"
              )}
            </a>

            <button
              type="button"
              onClick={baixarArquivo}
              disabled={arquivoIndisponivel}
              style={{
                ...fileSecondaryButtonStyle,
                opacity: arquivoIndisponivel ? 0.58 : 1,
                cursor: arquivoIndisponivel
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              {arquivoCarregando ? (
                <LoadingSpinner
                  compacto
                  label="Preparando download"
                />
              ) : (
                "Baixar arquivo"
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function MetricCard({
  numero,
  rotulo,
  ativo = false,
  mostrarCoracao = false,
  onClick,
}: {
  numero: string;
  rotulo: string;
  ativo?: boolean;
  mostrarCoracao?: boolean;
  onClick?: () => void;
}) {
  const cardStyle = ativo ? activeStatCardStyle : statCardStyle;
  const conteudoNumero = (
    <div style={statNumberRowStyle}>
      {mostrarCoracao ? (
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          style={{
            ...statHeartIconStyle,
            animation: ativo
              ? "historietas-stat-heart-pop 260ms ease-out"
              : "none",
          }}
        >
          <path
            d="M20.7 5.3c-1.8-1.9-4.7-1.9-6.5 0L12 7.6 9.8 5.3c-1.8-1.9-4.7-1.9-6.5 0-1.8 1.9-1.8 5 0 6.9L12 21l8.7-8.8c1.8-1.9 1.8-5 0-6.9Z"
            fill={ativo ? "var(--historietas-obra-danger, #EF4444)" : "none"}
            stroke={ativo ? "var(--historietas-obra-danger, #EF4444)" : "#FFFFFF"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : null}

      <strong style={statNumberStyle}>{numero}</strong>
    </div>
  );

  if (!onClick) {
    return (
      <div style={cardStyle}>
        {conteudoNumero}
        <span style={statLabelStyle}>{rotulo}</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      style={ativo ? activeStatButtonStyle : statButtonStyle}
      aria-pressed={mostrarCoracao ? ativo : undefined}
      aria-label={
        mostrarCoracao
          ? `${ativo ? "Remover curtida" : "Curtir"}. ${numero} curtidas`
          : `Abrir ${rotulo}. Total: ${numero}`
      }
    >
      {conteudoNumero}
      <span style={statLabelStyle}>{rotulo}</span>
    </button>
  );
}

function CommunityItem({
  numero,
  rotulo,
  href,
}: {
  numero: string;
  rotulo: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      style={communityItemStyle}
      aria-label={`Abrir ${rotulo} desta obra na Comunidade`}
    >
      <strong style={communityNumberStyle}>{numero}</strong>
      <span style={communityLabelStyle}>{rotulo}</span>
    </Link>
  );
}

const obraPageCss = `
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

  @keyframes historietas-stat-heart-pop {
    0% { transform: scale(1); }
    45% { transform: scale(1.28); }
    100% { transform: scale(1); }
  }

  html {
    --historietas-obra-bg-deep: #04000A;
    --historietas-obra-bg-deeper: #020006;
    --historietas-obra-surface: #08030F;
    --historietas-obra-bg-deep-96: rgba(4, 0, 10, 0.96);
    --historietas-obra-bg-deep-72: rgba(4, 0, 10, 0.72);
    --historietas-obra-bg-shadow-42: rgba(3, 2, 8, 0.42);
    --historietas-obra-menu-98: rgba(18, 9, 35, 0.98);
    --historietas-obra-rating: #FBBF24;
    --historietas-obra-rating-strong: #FF9C2B;
    --historietas-obra-rating-muted: rgba(251, 191, 36, 0.34);
    --historietas-obra-danger: #EF4444;
    --historietas-obra-heart: #F43F5E;
    --historietas-obra-logo-mid: #DDD6FE;
    --historietas-obra-logo-end: #A78BFA;
    --historietas-obra-purple-48: rgba(59, 7, 100, 0.48);
    --historietas-obra-purple-58: rgba(59, 7, 100, 0.58);
    --historietas-obra-purple-72: rgba(59, 7, 100, 0.72);
    --historietas-obra-secondary-22: rgba(124, 58, 237, 0.22);
    --historietas-obra-secondary-72: rgba(124, 58, 237, 0.72);
    --historietas-obra-secondary-soft-34: rgba(167, 139, 250, 0.34);
  }

  html[data-historietas-tema-visual="original"] body,
  html[data-historietas-tema-visual="original"] main {
    background: #070212 !important;
  }

  html[data-historietas-tema-visual="original"] main > div[aria-hidden="true"] {
    background: transparent !important;
    opacity: 0 !important;
  }

  html[data-historietas-tema-visual="foco"] {
    --historietas-obra-bg-deep: #000000;
    --historietas-obra-bg-deeper: #000000;
    --historietas-obra-surface: #050505;
    --historietas-obra-bg-deep-96: rgba(0, 0, 0, 0.96);
    --historietas-obra-bg-deep-72: rgba(0, 0, 0, 0.72);
    --historietas-obra-bg-shadow-42: rgba(0, 0, 0, 0.42);
    --historietas-obra-menu-98: rgba(0, 0, 0, 0.98);
    --historietas-obra-rating: #FFFFFF;
    --historietas-obra-rating-strong: #FFFFFF;
    --historietas-obra-rating-muted: rgba(255, 255, 255, 0.32);
    --historietas-obra-danger: #FFFFFF;
    --historietas-obra-heart: #FFFFFF;
    --historietas-obra-logo-mid: #FFFFFF;
    --historietas-obra-logo-end: #D4D4D8;
    --historietas-obra-purple-48: rgba(255, 255, 255, 0.12);
    --historietas-obra-purple-58: rgba(255, 255, 255, 0.16);
    --historietas-obra-purple-72: rgba(255, 255, 255, 0.20);
    --historietas-obra-secondary-22: rgba(255, 255, 255, 0.08);
    --historietas-obra-secondary-72: rgba(255, 255, 255, 0.24);
    --historietas-obra-secondary-soft-34: rgba(255, 255, 255, 0.18);
  }

  html[data-historietas-tema-visual="foco"] body,
  html[data-historietas-tema-visual="foco"] main {
    background: #000000 !important;
    color: #FFFFFF !important;
  }

  html[data-historietas-tema-visual="foco"] main > div[aria-hidden="true"] {
    background: transparent !important;
    opacity: 0 !important;
  }
`;

const safeTextStyle: CSSProperties = {
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

const heroTitleOutlineStyle: CSSProperties = {
  textShadow:
    "-1px -1px 0 rgba(0,0,0,0.86), 1px -1px 0 rgba(0,0,0,0.86), -1px 1px 0 rgba(0,0,0,0.86), 1px 1px 0 rgba(0,0,0,0.86)",
};

const heroTextOutlineStyle: CSSProperties = {
  textShadow:
    "-1px -1px 0 rgba(0,0,0,0.78), 1px -1px 0 rgba(0,0,0,0.78), -1px 1px 0 rgba(0,0,0,0.78), 1px 1px 0 rgba(0,0,0,0.78)",
};

const heroSmallTextOutlineStyle: CSSProperties = {
  textShadow:
    "-1px -1px 0 rgba(0,0,0,0.74), 1px -1px 0 rgba(0,0,0,0.74), -1px 1px 0 rgba(0,0,0,0.74), 1px 1px 0 rgba(0,0,0,0.74)",
};

const heroIconOutlineStyle: CSSProperties = {
  textShadow:
    "-1px -1px 0 rgba(0,0,0,0.72), 1px -1px 0 rgba(0,0,0,0.72), -1px 1px 0 rgba(0,0,0,0.72), 1px 1px 0 rgba(0,0,0,0.72)",
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

const loadingInlineStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "18px",
  height: "18px",
  lineHeight: 1,
  verticalAlign: "middle",
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

const loadingSpinnerCompactStyle: CSSProperties = {
  ...loadingSpinnerStyle,
  width: "18px",
  height: "18px",
  borderWidth: "2px",
};

const pageStyle: CSSProperties = {
  position: "relative",
  minHeight: "100vh",
  width: "100%",
  maxWidth: "100vw",
  overflowX: "clip",
  boxSizing: "border-box",
  background: "var(--historietas-bg-start, #070212)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontFamily: "Inter, Poppins, Manrope, Arial, Helvetica, sans-serif",
};

const containerStyle: CSSProperties = {
  position: "relative",
  width: "min(860px, calc(100% - 24px))",
  maxWidth: "100%",
  margin: "0 auto",
  padding: "0 0 calc(52px + env(safe-area-inset-bottom))",
  boxSizing: "border-box",
  minWidth: 0,
};

const desktopContainerStyle: CSSProperties = {
  ...containerStyle,
  width: "min(1180px, calc(100% - 64px))",
  padding: "22px 0 24px",
};


const heroTopOverlayStyle: CSSProperties = {
  position: "absolute",
  top: "16px",
  left: "18px",
  right: "18px",
  zIndex: 4,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  minWidth: 0,
  maxWidth: "calc(100vw - 36px)",
  marginBottom: 0,
  pointerEvents: "auto",
};

const desktopHeroTopOverlayStyle: CSSProperties = {
  ...heroTopOverlayStyle,
  top: "22px",
  left: "24px",
  right: "24px",
  maxWidth: "calc(100% - 48px)",
};

const desktopHeaderRightStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: "12px",
  flex: "0 0 auto",
  minWidth: 0,
};

const desktopNotificationButtonStyle: CSSProperties = {
  position: "relative",
  width: "34px",
  height: "34px",
  borderRadius: "999px",
  border:
    "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  background: "var(--historietas-surface-strong, var(--historietas-obra-bg-deep, #04000A))",
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flex: "0 0 auto",
  fontSize: "14px",
  lineHeight: 1,
  fontWeight: 950,
  boxShadow: "none",
  zIndex: 2,
};

const desktopNotificationBadgeStyle: CSSProperties = {
  position: "absolute",
  top: "-7px",
  right: "-9px",
  minWidth: "18px",
  height: "18px",
  padding: "0 4px",
  borderRadius: "999px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: "2px solid var(--historietas-bg-start, #070212)",
  background: "var(--historietas-obra-danger, #EF4444)",
  color: "#FFFFFF",
  fontSize: "9px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.03em",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.38)",
  pointerEvents: "none",
};

const logoStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  fontSize: "25px",
  fontWeight: 950,
  letterSpacing: 0,
  display: "flex",
  alignItems: "center",
  gap: 0,
  minWidth: 0,
  maxWidth: "fit-content",
  ...safeTextStyle,
};

const heroLogoStyle: CSSProperties = {
  ...logoStyle,
  transform: "translate(4px, -5px)",
};

const logoMarkStyle: CSSProperties = {
  width: "34px",
  height: "34px",
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--historietas-obra-bg-deep-96, rgba(4, 0, 10, 0.96))",
  color: "#FFFFFF",
  fontSize: "19px",
  fontWeight: 950,
  letterSpacing: 0,
  flex: "0 0 auto",
  border: "1px solid var(--historietas-obra-secondary-72, rgba(124, 58, 237, 0.72))",
  boxShadow:
    "0 0 0 1px var(--historietas-obra-purple-48, rgba(59, 7, 100, 0.48)), 0 0 14px var(--historietas-obra-secondary-22, rgba(124, 58, 237, 0.22))",
};

const logoTextStyle: CSSProperties = {
  marginLeft: "-1px",
  background:
    "linear-gradient(135deg, #FFFFFF 0%, var(--historietas-obra-logo-mid, #DDD6FE) 44%, var(--historietas-obra-logo-end, #A78BFA) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  textShadow: "none",
};


const heroStyle: CSSProperties = {
  position: "relative",
  overflow: "hidden",
  width: "100vw",
  marginLeft: "calc(50% - 50vw)",
  marginRight: "calc(50% - 50vw)",
  borderRadius: 0,
  border: "none",
  background: "transparent",
  boxShadow: "none",
  minWidth: 0,
  maxWidth: "100vw",
  boxSizing: "border-box",
};

const heroGlowStyle: CSSProperties = {
  display: "none",
};

const heroContentStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  minHeight: "min(460px, 68vh)",
  display: "block",
  padding: 0,
  overflow: "hidden",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  borderBottomLeftRadius: "28px",
  borderBottomRightRadius: "28px",
};

const coverArtStyle: CSSProperties = {
  width: "100%",
  minHeight: "min(460px, 68vh)",
  height: "100%",
  borderRadius: "0 0 28px 28px",
  position: "relative",
  overflow: "hidden",
  backgroundImage: "linear-gradient(145deg, var(--historietas-obra-surface, #08030F) 0%, var(--historietas-obra-bg-deep, #04000A) 58%, var(--historietas-obra-bg-deeper, #020006) 100%)",
  backgroundSize: "cover",
  backgroundPosition: "center top",
  border: "none",
  boxShadow: "none",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const heroCoverLinkStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  zIndex: 1,
  display: "block",
  color: "inherit",
  textDecoration: "none",
  minWidth: 0,
  borderRadius: "0 0 28px 28px",
  overflow: "hidden",
};

const heroOverlayContentStyle: CSSProperties = {
  position: "absolute",
  left: 0,
  right: 0,
  bottom: "0px",
  zIndex: 2,
  padding: "0 16px 4px",
  display: "grid",
  justifyItems: "center",
  gap: "8px",
  background: "transparent",
  minWidth: 0,
  boxSizing: "border-box",
  textAlign: "center",
};

const coverTitleStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#FFFFFF",
  fontSize: "68px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.12em",
  ...heroTitleOutlineStyle,
  ...safeTextStyle,
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "clamp(36px, 9.6vw, 58px)",
  lineHeight: 0.94,
  fontWeight: 950,
  letterSpacing: "-0.085em",
  maxWidth: "100%",
  textAlign: "center",
  background: "none",
  WebkitBackgroundClip: "initial",
  backgroundClip: "initial",
  color: "#FFFFFF",
  WebkitTextFillColor: "#FFFFFF",
  textShadow:
    "0 1px 0 rgba(0,0,0,0.34), 0 2px 12px rgba(0,0,0,0.34)",
  transform: "translateY(6px)",
  ...safeTextStyle,
};

const descriptionStyle: CSSProperties = {
  margin: 0,
  color: "#FFFFFF",
  WebkitTextFillColor: "#FFFFFF",
  fontSize: "15.4px",
  lineHeight: 1.35,
  fontWeight: 850,
  maxWidth: "620px",
  textAlign: "center",
  display: "block",
  overflow: "visible",
  opacity: 1,
  textShadow:
    "0 1px 0 rgba(0,0,0,0.32), 0 2px 10px rgba(0,0,0,0.30)",
  transform: "translateY(6px)",
  ...safeTextStyle,
};

const heroActionsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) 50px",
  gap: "12px",
  marginTop: "10px",
  minWidth: 0,
  width: "100%",
  maxWidth: "428px",
};

const metricInlineContentStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "4px",
  minWidth: 0,
  whiteSpace: "nowrap",
};

const metricEmojiIconStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flex: "0 0 auto",
  fontSize: "1em",
  lineHeight: 1,
};

const metricWhiteNumberStyle: CSSProperties = {
  color: "#FFFFFF",
  WebkitTextFillColor: "#FFFFFF",
  lineHeight: 1,
};

const metricStarIconStyle: CSSProperties = {
  color: "var(--historietas-obra-rating, #FBBF24)",
};

const metricStarValueStyle: CSSProperties = {
  color: "var(--historietas-obra-rating, #FBBF24)",
};

const heroBottomMetaBarStyle: CSSProperties = {
  position: "relative",
  zIndex: 3,
  width: "100%",
  maxWidth: "380px",
  marginTop: "6px",
  padding: 0,
  borderRadius: 0,
  border: "none",
  background: "transparent",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  minWidth: 0,
  boxSizing: "border-box",
  transform: "translateY(6px)",
};

const heroBottomAuthorLinkStyle: CSSProperties = {
  minWidth: 0,
  color: "rgba(255,255,255,0.95)",
  textDecoration: "none",
  fontSize: "14.1px",
  lineHeight: 1.15,
  fontWeight: 950,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  textShadow: "0 1px 0 rgba(0,0,0,0.28)",
  ...safeTextStyle,
};

const heroBottomMetricsStyle: CSSProperties = {
  flex: "0 0 auto",
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: "11px",
  minWidth: 0,
};

const heroBottomMetricStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "13.5px",
  lineHeight: 1.15,
  fontWeight: 950,
  whiteSpace: "nowrap",
  textShadow: "0 1px 0 rgba(0,0,0,0.28)",
  ...safeTextStyle,
};

const primaryButtonStyle: CSSProperties = {
  gridColumn: "1 / -1",
  minHeight: "34px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "var(--historietas-accent, #F97316)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "10.5px",
  fontWeight: 950,
  cursor: "pointer",
  fontFamily: "inherit",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 8px",
  boxShadow: "none",
  boxSizing: "border-box",
  ...safeTextStyle,
};

const secondaryButtonStyle: CSSProperties = {
  minHeight: "50px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(0, 0, 0, 0.54)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "14px",
  fontWeight: 900,
  cursor: "pointer",
  fontFamily: "inherit",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 22px",
  boxShadow: "none",
  boxSizing: "border-box",
  textShadow: "none",
  filter: "none",
  backdropFilter: "none",
  WebkitBackdropFilter: "none",
  ...safeTextStyle,
};


const copyLinkButtonStyle: CSSProperties = {
  minHeight: "42px",
  borderRadius: "999px",
  background: "var(--historietas-obra-bg-deep, #04000A)",
  border: "1px solid rgba(255,255,255,0.28)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "11px",
  fontWeight: 900,
  cursor: "pointer",
  fontFamily: "inherit",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 8px",
  boxShadow: "none",
  boxSizing: "border-box",
  textShadow: "none",
  filter: "none",
  backdropFilter: "none",
  WebkitBackdropFilter: "none",
  ...safeTextStyle,
};

const followedButtonStyle: CSSProperties = {
  ...secondaryButtonStyle,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(0, 0, 0, 0.54)",
  color: "#FFFFFF",
  boxShadow: "none",
};

const obraAddButtonStyle: CSSProperties = {
  ...copyLinkButtonStyle,
  width: "50px",
  minHeight: "50px",
  height: "50px",
  padding: 0,
  borderRadius: "999px",
  background: "rgba(0, 0, 0, 0.54)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#FFFFFF",
  fontSize: "26px",
  lineHeight: 1,
  fontWeight: 900,
};

const obraActionSheetOverlayStyle: CSSProperties = {
  position: "fixed",
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
  height: "100dvh",
  zIndex: 9998,
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
  background: "rgba(0,0,0,0.68)",
  padding: 0,
  boxSizing: "border-box",
  overscrollBehavior: "none",
  touchAction: "none",
};

const obraActionSheetHandleStyle: CSSProperties = {
  width: "72px",
  height: "5px",
  borderRadius: "999px",
  background: "rgba(244,244,245,0.62)",
  justifySelf: "center",
  margin: "0 auto 14px",
};

const obraMenuActionsStyle: CSSProperties = {
  display: "grid",
  gap: 0,
  borderRadius: 0,
  border: "none",
  borderTop: "none",
  background: "transparent",
  overflow: "hidden",
};


const obraActionToastStyle: CSSProperties = {
  position: "fixed",
  left: "50%",
  bottom: "calc(92px + env(safe-area-inset-bottom))",
  transform: "translateX(-50%)",
  zIndex: 12000,
  width: "max-content",
  maxWidth: "calc(100vw - 32px)",
  minHeight: "38px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.14))",
  background: "var(--historietas-surface-strong, #120822)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  boxShadow: "0 14px 34px rgba(0,0,0,0.38)",
  padding: "9px 14px",
  fontSize: "11px",
  lineHeight: 1.3,
  fontWeight: 900,
  textAlign: "center",
  pointerEvents: "none",
};

const obraActionsMenuStyle: CSSProperties = {
  position: "fixed",
  left: "50%",
  bottom: 0,
  transform: "translateX(-50%)",
  width: "min(820px, 100%)",
  maxHeight: "calc(100dvh - 116px)",
  overflowX: "hidden",
  overflowY: "auto",
  overscrollBehavior: "none",
  borderRadius: "24px 24px 0 0",
  background: "#070212",
  border: "none",
  boxShadow: "0 -18px 50px rgba(0,0,0,0.38)",
  padding: "8px 0 calc(104px + env(safe-area-inset-bottom))",
  display: "grid",
  gap: 0,
  boxSizing: "border-box",
  touchAction: "none",
  zIndex: 9999,
};

const obraMenuHeaderStyle: CSSProperties = {
  display: "grid",
  justifyItems: "stretch",
  gap: "8px",
  minWidth: 0,
  padding: "0 30px 10px",
  boxSizing: "border-box",
  borderBottom: "none",
};

const obraMenuTitleStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "21px",
  lineHeight: 1.1,
  fontWeight: 950,
  letterSpacing: "-0.04em",
  textAlign: "center",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  maxWidth: "100%",
  ...safeTextStyle,
};

const obraMenuAuthorMetricsRowStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "6px",
};

const obraMenuAuthorLinkStyle: CSSProperties = {
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  color: "#FFFFFF",
  WebkitTextFillColor: "#FFFFFF",
  textDecoration: "none",
  textAlign: "center",
  fontSize: "12px",
  lineHeight: 1.15,
  fontWeight: 850,
  ...safeTextStyle,
};

const obraMenuMetricsStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexWrap: "wrap",
  gap: "7px",
  color: "#FFFFFF",
  fontSize: "10.5px",
  lineHeight: 1.1,
  fontWeight: 900,
  whiteSpace: "nowrap",
  ...safeTextStyle,
};

const obraMenuMetricStyle: CSSProperties = {
  color: "#FFFFFF",
};

const obraMenuStarMetricStyle: CSSProperties = {
  ...obraMenuMetricStyle,
  color: "#FFFFFF",
};

const obraMenuTagsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "nowrap",
  justifyContent: "center",
  gap: 0,
  minWidth: 0,
  maxWidth: "100%",
  color: "#FFFFFF",
  overflowX: "auto",
  overflowY: "hidden",
  whiteSpace: "nowrap",
  scrollbarWidth: "none",
};

const obraMenuTagStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "none",
  flex: "0 0 auto",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
  color: "#FFFFFF",
  WebkitTextFillColor: "#FFFFFF",
  fontSize: "10px",
  fontWeight: 800,
  lineHeight: 1.2,
  whiteSpace: "nowrap",
  ...safeTextStyle,
};

const obraMenuTagSeparatorStyle: CSSProperties = {
  display: "inline-block",
  margin: "0 4px",
  color: "rgba(255,255,255,0.34)",
};

const obraMenuSectionLabelStyle: CSSProperties = {
  display: "block",
  padding: "11px 30px 5px",
  color: "rgba(244,244,245,0.56)",
  fontSize: "11px",
  lineHeight: 1,
  fontWeight: 950,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  ...safeTextStyle,
};

const obraMenuItemButtonStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  width: "100%",
  minHeight: "44px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "16px",
  border: "none",
  borderBottom: "none",
  borderRadius: 0,
  background: "transparent",
  color: "#FFFFFF",
  textDecoration: "none",
  padding: "0 30px",
  fontSize: "18px",
  fontWeight: 650,
  lineHeight: 1,
  letterSpacing: "-0.035em",
  fontFamily: "inherit",
  textAlign: "left",
  cursor: "pointer",
  boxSizing: "border-box",
  whiteSpace: "nowrap",
  ...safeTextStyle,
};

const obraMenuItemActiveStyle: CSSProperties = {
  ...obraMenuItemButtonStyle,
  fontWeight: 900,
  background: "transparent",
  color: "#FFFFFF",
};

const obraMenuItemCopiedStyle: CSSProperties = {
  ...obraMenuItemButtonStyle,
  fontWeight: 900,
  background: "transparent",
  color: "#FFFFFF",
};

const obraMenuItemDotStyle: CSSProperties = {
  width: "20px",
  height: "20px",
  borderRadius: "999px",
  border: "2.25px solid rgba(161,161,170,0.72)",
  background: "transparent",
  color: "transparent",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flex: "0 0 auto",
  boxSizing: "border-box",
  fontSize: "13px",
  lineHeight: 1,
  fontWeight: 900,
};

const obraMenuItemDotActiveStyle: CSSProperties = {
  ...obraMenuItemDotStyle,
  border: "2px solid #FFFFFF",
  background: "#FFFFFF",
  color: "#111111",
};

const obraMenuSynopsisStyle: CSSProperties = {
  width: "100%",
  display: "grid",
  gap: "5px",
  padding: "4px 30px 11px",
  boxSizing: "border-box",
  color: "#FFFFFF",
  textAlign: "left",
  ...safeTextStyle,
};

const obraMenuSynopsisLabelStyle: CSSProperties = {
  color: "rgba(244,244,245,0.58)",
  fontSize: "10.5px",
  lineHeight: 1,
  fontWeight: 950,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  ...safeTextStyle,
};

const obraMenuSynopsisTextStyle: CSSProperties = {
  margin: 0,
  maxHeight: "96px",
  overflowX: "hidden",
  overflowY: "auto",
  overscrollBehavior: "contain",
  paddingRight: "4px",
  color: "rgba(255,255,255,0.82)",
  fontSize: "12px",
  lineHeight: 1.38,
  fontWeight: 650,
  whiteSpace: "normal",
  wordBreak: "break-word",
  scrollbarWidth: "thin",
  WebkitOverflowScrolling: "touch",
  ...safeTextStyle,
};

const actionMessageStyle: CSSProperties = {
  gridColumn: "1 / -1",
  justifySelf: "center",
  color: "#FFFFFF",
  fontSize: "10.5px",
  fontWeight: 850,
  ...heroSmallTextOutlineStyle,
  ...safeTextStyle,
};

const statsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "6px",
  marginTop: "8px",
  minWidth: 0,
};

const statCardStyle: CSSProperties = {
  borderRadius: "14px",
  background: "var(--historietas-obra-bg-deep, #04000A)",
  border: "1px solid rgba(255,255,255,0.08)",
  padding: "7px 5px",
  display: "grid",
  gap: "3px",
  minWidth: 0,
  overflow: "hidden",
  boxShadow: "none",
  textAlign: "center",
  filter: "none",
  backdropFilter: "none",
  WebkitBackdropFilter: "none",
};

const activeStatCardStyle: CSSProperties = {
  ...statCardStyle,
  background: "var(--historietas-obra-bg-deep, #04000A)",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "none",
  filter: "none",
  backdropFilter: "none",
  WebkitBackdropFilter: "none",
};

const statButtonStyle: CSSProperties = {
  ...statCardStyle,
  cursor: "pointer",
  fontFamily: "inherit",
  color: "inherit",
};

const activeStatButtonStyle: CSSProperties = {
  ...activeStatCardStyle,
  cursor: "pointer",
  fontFamily: "inherit",
  color: "inherit",
};

const statNumberStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "clamp(16px, 4.6vw, 21px)",
  fontWeight: 950,
  lineHeight: 1,
  ...safeTextStyle,
};

const statNumberRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "5px",
  minWidth: 0,
};

const statHeartIconStyle: CSSProperties = {
  width: "18px",
  height: "18px",
  display: "block",
  flex: "0 0 auto",
  transformOrigin: "center",
};

const statLabelStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "7.8px",
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: "0.025em",
  lineHeight: 1.1,
  whiteSpace: "nowrap",
  ...safeTextStyle,
};


const commentsSheetOverlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 2147483647,
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
  pointerEvents: "none",
  isolation: "isolate",
};

const commentsSheetBackdropStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  zIndex: 0,
  border: "none",
  background: "var(--historietas-obra-bg-shadow-42, rgba(3, 2, 8, 0.42))",
  backdropFilter: "blur(4px)",
  WebkitBackdropFilter: "blur(4px)",
  pointerEvents: "auto",
  cursor: "pointer",
  padding: 0,
};

const commentsSheetStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: "min(720px, 100%)",
  maxHeight: "calc(100dvh - env(safe-area-inset-top) - 10px)",
  display: "grid",
  gridTemplateRows: "auto auto minmax(0, 1fr) auto auto auto",
  gap: "7px",
  padding: "5px 12px calc(10px + env(safe-area-inset-bottom))",
  borderRadius: "28px 28px 0 0",
  background: "var(--historietas-obra-bg-deep, #070212)",
  border: "none",
  borderBottom: "none",
  boxShadow: "0 -24px 70px rgba(0,0,0,0.72)",
  pointerEvents: "auto",
  overflow: "hidden",
  boxSizing: "border-box",
  willChange: "height",
  transition: "height 220ms ease",
};

const commentsSheetCompactStyle: CSSProperties = {
  height: "min(64dvh, 540px)",
};

const commentsSheetExpandedStyle: CSSProperties = {
  height: "min(90dvh, 760px)",
};

const desktopCommentsSheetStyle: CSSProperties = {
  ...commentsSheetStyle,
  width: "min(800px, calc(100% - 40px))",
  height: "min(76dvh, 720px)",
};

const commentsSheetHandleWrapStyle: CSSProperties = {
  minHeight: "24px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  touchAction: "none",
  cursor: "grab",
  willChange: "transform",
  outline: "none",
};

const commentsSheetHandleStyle: CSSProperties = {
  width: "44px",
  height: "5px",
  borderRadius: "999px",
  background: "var(--historietas-border-soft, rgba(255,255,255,0.34))",
};

const commentsSheetHeaderStyle: CSSProperties = {
  minHeight: "32px",
  display: "grid",
  gridTemplateColumns: "40px minmax(0, 1fr) 40px",
  alignItems: "center",
  gap: "6px",
  minWidth: 0,
};

const commentsSheetHeaderSpacerStyle: CSSProperties = {
  width: "40px",
  height: "1px",
};

const commentsSheetTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "14.5px",
  fontWeight: 950,
  textAlign: "center",
  letterSpacing: "-0.02em",
};

const commentsSortMenuWrapStyle: CSSProperties = {
  position: "relative",
  width: "40px",
  height: "34px",
  justifySelf: "end",
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
};

const commentsSortMenuTriggerStyle: CSSProperties = {
  width: "34px",
  height: "34px",
  borderRadius: "999px",
  border: "none",
  background: "transparent",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "27px",
  lineHeight: 1,
  fontWeight: 500,
  fontFamily: "inherit",
  padding: "0 0 2px",
  cursor: "pointer",
};

const commentsSortMenuStyle: CSSProperties = {
  position: "absolute",
  top: "calc(100% + 6px)",
  right: 0,
  zIndex: 12,
  width: "132px",
  maxWidth: "calc(100vw - 24px)",
  display: "grid",
  gap: 0,
  padding: "4px 8px",
  boxSizing: "border-box",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "var(--historietas-obra-menu-98, rgba(18, 9, 35, 0.98))",
  boxShadow: "0 16px 36px rgba(0,0,0,0.48)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
};

const commentsSortMenuItemStyle: CSSProperties = {
  width: "100%",
  minHeight: "36px",
  border: "none",
  borderRadius: 0,
  background: "transparent",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  padding: "0 4px",
  textAlign: "center",
  fontSize: "11.5px",
  fontWeight: 850,
  fontFamily: "inherit",
  cursor: "pointer",
};

const commentsSortMenuItemActiveStyle: CSSProperties = {
  ...commentsSortMenuItemStyle,
  color: "#FFFFFF",
};

const commentsSortMenuDividerStyle: CSSProperties = {
  width: "100%",
  height: "1px",
  background: "rgba(255,255,255,0.12)",
};

const commentsSheetListStyle: CSSProperties = {
  display: "grid",
  alignContent: "start",
  gap: "12px",
  minHeight: 0,
  overflowY: "auto",
  padding: "6px 2px 9px",
  WebkitOverflowScrolling: "touch",
};

const commentSheetItemStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "34px minmax(0, 1fr) 28px",
  gap: "10px",
  alignItems: "start",
  minWidth: 0,
};

const commentThreadStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  minWidth: 0,
};

const commentRepliesListStyle: CSSProperties = {
  display: "grid",
  gap: "9px",
  marginLeft: "34px",
  paddingLeft: "10px",
  borderLeft: "1px solid rgba(255,255,255,0.08)",
  minWidth: 0,
};

const commentSheetReplyItemStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "28px minmax(0, 1fr) 28px",
  gap: "8px",
  alignItems: "start",
  minWidth: 0,
};

const commentRepliesToggleStyle: CSSProperties = {
  width: "fit-content",
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  marginLeft: "44px",
  border: "none",
  background: "transparent",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "10px",
  fontWeight: 900,
  fontFamily: "inherit",
  padding: "1px 0",
  cursor: "pointer",
};

const commentRepliesControlsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  flexWrap: "wrap",
  minWidth: 0,
};

const commentRepliesHideButtonStyle: CSSProperties = {
  width: "fit-content",
  marginLeft: "44px",
  border: "none",
  background: "transparent",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "10px",
  fontWeight: 900,
  fontFamily: "inherit",
  padding: "1px 0",
  cursor: "pointer",
};

const commentRepliesLineStyle: CSSProperties = {
  width: "22px",
  height: "1px",
  background: "rgba(255,255,255,0.22)",
};

const commentSheetAvatarLinkStyle: CSSProperties = {
  width: "34px",
  height: "34px",
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--historietas-obra-bg-deep, #04000A)",
  color: "#FFFFFF",
  fontSize: "12.5px",
  fontWeight: 950,
  textDecoration: "none",
  border: "1px solid var(--historietas-obra-purple-58, rgba(59, 7, 100, 0.58))",
  overflow: "hidden",
  boxSizing: "border-box",
};

const commentSheetReplyAvatarLinkStyle: CSSProperties = {
  ...commentSheetAvatarLinkStyle,
  width: "28px",
  height: "28px",
  borderRadius: "10px",
  fontSize: "10.5px",
};

const commentSheetContentStyle: CSSProperties = {
  position: "relative",
  display: "grid",
  gap: "3px",
  minWidth: 0,
};

const commentSheetTopLineStyle: CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  gap: "6px",
  minWidth: 0,
};

const commentSheetAuthorLinkStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "12px",
  fontWeight: 950,
  textDecoration: "none",
  ...safeTextStyle,
};

const commentSheetTimeStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "10.5px",
  fontWeight: 750,
  whiteSpace: "nowrap",
};

const commentSheetTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "12.5px",
  lineHeight: 1.38,
  fontWeight: 750,
  whiteSpace: "pre-wrap",
  ...safeTextStyle,
};

const commentSheetActionsRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  flexWrap: "wrap",
};

const commentSheetReplyButtonStyle: CSSProperties = {
  width: "fit-content",
  border: "none",
  background: "transparent",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "10.5px",
  fontWeight: 900,
  fontFamily: "inherit",
  padding: "1px 0 0",
  cursor: "pointer",
};

const commentSheetRemoveButtonStyle: CSSProperties = {
  width: "fit-content",
  border: "none",
  background: "transparent",
  color: "var(--historietas-danger-button-text, #FCA5A5)",
  fontSize: "10.5px",
  fontWeight: 900,
  fontFamily: "inherit",
  padding: "1px 0 0",
  cursor: "pointer",
};


const commentSheetLikeWrapStyle: CSSProperties = {
  minWidth: "28px",
  display: "grid",
  justifyItems: "center",
  alignContent: "start",
  gap: "2px",
};

const commentSheetLikeButtonStyle: CSSProperties = {
  width: "28px",
  height: "28px",
  border: "none",
  borderRadius: "999px",
  background: "transparent",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
  cursor: "pointer",
};

const commentSheetLikeCountStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "10px",
  fontWeight: 900,
  lineHeight: 1,
  minHeight: "10px",
  textAlign: "center",
};

const commentSheetHeartIconStyle: CSSProperties = {
  width: "19px",
  height: "19px",
  display: "block",
};

const commentsLoadingStyle: CSSProperties = {
  width: "100%",
  minHeight: "58px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
};

const emptyCommentsStyle: CSSProperties = {
  margin: "10px 0 0",
  color: "#FFFFFF",
  fontSize: "12px",
  fontWeight: 800,
  textAlign: "center",
};

const commentsToolsStyle: CSSProperties = {
  display: "grid",
  gap: "6px",
  padding: "5px 0 0",
};

const commentsQuickReactionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "6px",
  width: "100%",
  overflowX: "auto",
  padding: "0 1px",
  scrollbarWidth: "none",
  WebkitOverflowScrolling: "touch",
};

const commentsQuickReactionButtonStyle: CSSProperties = {
  width: "30px",
  height: "28px",
  border: "none",
  borderRadius: "999px",
  background: "transparent",
  fontSize: "18px",
  lineHeight: 1,
  padding: 0,
  cursor: "pointer",
  flex: "0 0 auto",
};

const commentsSheetFormStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "30px minmax(0, 1fr) 28px 38px",
  alignItems: "center",
  gap: "7px",
  padding: "7px 0 0",
  minWidth: 0,
};

const commentsInputAvatarStyle: CSSProperties = {
  width: "30px",
  height: "30px",
  borderRadius: "11px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--historietas-obra-bg-deep, #04000A)",
  border: "1px solid var(--historietas-obra-purple-58, rgba(59, 7, 100, 0.58))",
  color: "#FFFFFF",
  fontSize: "11.5px",
  fontWeight: 950,
  overflow: "hidden",
};

const commentsInputBoxStyle: CSSProperties = {
  minWidth: 0,
  minHeight: "38px",
  display: "flex",
  alignItems: "center",
};

const commentsSheetInputStyle: CSSProperties = {
  width: "100%",
  minHeight: "38px",
  maxHeight: "82px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "var(--historietas-obra-bg-deep, #04000A)",
  color: "#FFFFFF",
  padding: "9px 12px",
  outline: "none",
  fontSize: "12.5px",
  lineHeight: 1.32,
  fontWeight: 650,
  resize: "none",
  overflowY: "auto",
  fontFamily: "inherit",
  boxSizing: "border-box",
};

const commentsInputIconButtonStyle: CSSProperties = {
  width: "26px",
  height: "30px",
  border: "none",
  background: "transparent",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "16px",
  fontWeight: 950,
  fontFamily: "inherit",
  padding: 0,
  cursor: "pointer",
};

const commentsSheetSendStyle: CSSProperties = {
  width: "36px",
  height: "36px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-bottom-nav-publish-border, var(--historietas-obra-secondary-soft-34, rgba(167, 139, 250, 0.34)))",
  background: "var(--historietas-bottom-nav-publish-bg, var(--historietas-obra-purple-72, rgba(59, 7, 100, 0.72)))",
  color: "#FFFFFF",
  fontSize: "18px",
  lineHeight: 1,
  fontWeight: 950,
  fontFamily: "inherit",
  padding: 0,
};

const commentStatusStyle: CSSProperties = {
  display: "block",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "10.5px",
  lineHeight: 1.35,
  fontWeight: 800,
  textAlign: "center",
  ...safeTextStyle,
};


const sectionTitleStyle: CSSProperties = {
  margin: 0,
  color: "#FFFFFF",
  fontSize: "clamp(24px, 4vw, 30px)",
  lineHeight: 1.05,
  fontWeight: 950,
  letterSpacing: "-0.03em",
  maxWidth: "100%",
  textAlign: "center",
  ...safeTextStyle,
};

const accentSectionTitleStyle: CSSProperties = {
  ...sectionTitleStyle,
  color: "#FFFFFF",
  textTransform: "uppercase",
};


const fileBoxStyle: CSSProperties = {
  marginTop: "12px",
  padding: "15px",
  borderRadius: "22px",
  background:
    "linear-gradient(135deg, var(--historietas-obra-surface, #08030F) 0%, var(--historietas-obra-bg-deep, #04000A) 58%, var(--historietas-obra-bg-deeper, #020006) 100%)",
  border: "1px solid rgba(255,255,255,0.08)",
  display: "grid",
  gap: "11px",
  minWidth: 0,
  overflow: "hidden",
  boxShadow: "none",
};

const fileInfoCardStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "74px minmax(0, 1fr)",
  gap: "12px",
  alignItems: "center",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
};

const filePreviewLinkStyle: CSSProperties = {
  width: "74px",
  height: "74px",
  borderRadius: "18px",
  background: "rgba(0,0,0,0.24)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  overflow: "hidden",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
  flex: "0 0 auto",
};

const fileImagePreviewStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
};

const fileIconBoxStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  borderRadius: "18px",
  background:
    "linear-gradient(135deg, var(--historietas-accent, #F97316) 0%, var(--historietas-secondary, #7C3AED) 100%)",
  color: "#FFFFFF",
  fontSize: "12px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "none",
};

const fileInfoTextStyle: CSSProperties = {
  display: "grid",
  alignContent: "center",
  gap: "8px",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
};

const fileMetaStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "11px",
  lineHeight: 1.35,
  fontWeight: 900,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

const fileActionsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "8px",
  minWidth: 0,
  maxWidth: "100%",
};

const filePrimaryButtonStyle: CSSProperties = {
  minHeight: "42px",
  borderRadius: "999px",
  background: "var(--historietas-obra-bg-deep-72, rgba(4, 0, 10, 0.72))",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "12px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 10px",
  boxShadow: "none",
  cursor: "pointer",
  fontFamily: "inherit",
  WebkitAppearance: "none",
  appearance: "none",
  WebkitTapHighlightColor: "transparent",
  ...safeTextStyle,
};

const fileSecondaryButtonStyle: CSSProperties = {
  ...filePrimaryButtonStyle,
  color: "#FFFFFF",
};

const workRatingBoxStyle: CSSProperties = {
  marginTop: "10px",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
  display: "grid",
  gap: "8px",
  minWidth: 0,
  boxSizing: "border-box",
};

const desktopWorkRatingBoxStyle: CSSProperties = {
  ...workRatingBoxStyle,
  marginTop: "12px",
};

const workRatingHeaderStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  gap: "4px",
  minWidth: 0,
  textAlign: "center",
};

const workRatingTitleStyle: CSSProperties = {
  margin: 0,
  width: "100%",
  color: "#FFFFFF",
  WebkitTextFillColor: "#FFFFFF",
  fontSize: "clamp(22px, 6.5vw, 31px)",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.045em",
  textTransform: "uppercase",
  maxWidth: "100%",
  textAlign: "center",
  ...safeTextStyle,
};

const workRatingStarsRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
  gap: "6px",
  minWidth: 0,
};

const workRatingStarButtonStyle: CSSProperties = {
  minHeight: "34px",
  borderRadius: "999px",
  border: "none",
  background: "transparent",
  color: "var(--historietas-obra-rating-muted, rgba(251, 191, 36, 0.34))",
  fontSize: "22px",
  fontWeight: 950,
  lineHeight: 1,
  cursor: "pointer",
  fontFamily: "inherit",
  boxShadow: "none",
  filter: "none",
  backdropFilter: "none",
  WebkitBackdropFilter: "none",
  padding: 0,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const workRatingStarActiveStyle: CSSProperties = {
  ...workRatingStarButtonStyle,
  border: "none",
  background: "transparent",
  color: "var(--historietas-obra-rating, #FBBF24)",
  boxShadow: "none",
  filter: "none",
  backdropFilter: "none",
  WebkitBackdropFilter: "none",
};

const workRatingStarVisualStyle: CSSProperties = {
  position: "relative",
  width: "1em",
  height: "1em",
  display: "inline-block",
  lineHeight: 1,
};

const workRatingStarBaseStyle: CSSProperties = {
  color: "var(--historietas-obra-rating-muted, rgba(251, 191, 36, 0.34))",
  position: "absolute",
  inset: 0,
  lineHeight: 1,
};

const workRatingStarFillStyle: CSSProperties = {
  color: "var(--historietas-obra-rating, #FBBF24)",
  position: "absolute",
  inset: 0,
  overflow: "hidden",
  whiteSpace: "nowrap",
  lineHeight: 1,
};

const communityBoxStyle: CSSProperties = {
  marginTop: "8px",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
  display: "grid",
  gap: "8px",
  minWidth: 0,
  overflow: "visible",
  boxShadow: "none",
};

const communityHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  minWidth: 0,
  maxWidth: "100%",
  textAlign: "center",
};

const communityTitleStyle: CSSProperties = {
  margin: 0,
  width: "100%",
  color: "#FFFFFF",
  WebkitTextFillColor: "#FFFFFF",
  fontSize: "clamp(22px, 6.5vw, 31px)",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.045em",
  textTransform: "uppercase",
  textAlign: "center",
  ...safeTextStyle,
};


const communityGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "6px",
  minWidth: 0,
};

const communityItemStyle: CSSProperties = {
  padding: "8px 6px",
  borderRadius: "14px",
  background: "var(--historietas-obra-bg-deep, #04000A)",
  border: "1px solid rgba(255,255,255,0.08)",
  display: "grid",
  gap: "3px",
  justifyItems: "center",
  textAlign: "center",
  minWidth: 0,
  color: "inherit",
  textDecoration: "none",
  cursor: "pointer",
  boxShadow: "none",
  filter: "none",
  backdropFilter: "none",
  WebkitBackdropFilter: "none",
};

const communityNumberStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "18px",
  lineHeight: 1,
  fontWeight: 950,
  ...safeTextStyle,
};

const communityLabelStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "8.5px",
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: "0.035em",
  ...safeTextStyle,
};

const reviewBoxStyle: CSSProperties = {
  marginTop: "12px",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
  display: "grid",
  gap: "10px",
  minWidth: 0,
  overflow: "visible",
  boxShadow: "none",
};

const reviewTopStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "10px",
  flexWrap: "wrap",
  minWidth: 0,
  textAlign: "center",
};

const ratingSummaryStyle: CSSProperties = {
  flex: "0 0 auto",
  width: "fit-content",
  maxWidth: "132px",
  display: "grid",
  justifyItems: "center",
  alignContent: "center",
  rowGap: "1px",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
  boxShadow: "none",
  boxSizing: "border-box",
  textAlign: "center",
};

const ratingNumberStyle: CSSProperties = {
  color: "var(--historietas-obra-rating-strong, #FF9C2B)",
  fontSize: "28px",
  lineHeight: 1,
  fontWeight: 950,
  textShadow: "0 1px 0 rgba(0,0,0,0.28), 0 2px 10px rgba(0,0,0,0.22)",
  ...safeTextStyle,
};

const ratingStarsStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "1px",
  color: "var(--historietas-obra-rating, #FBBF24)",
  fontSize: "12px",
  lineHeight: 1,
  letterSpacing: "-0.02em",
  marginTop: "-4px",
  marginBottom: "1px",
  textShadow: "0 1px 0 rgba(0,0,0,0.28), 0 2px 8px rgba(0,0,0,0.2)",
  ...safeTextStyle,
};

const ratingTopStarVisualStyle: CSSProperties = {
  position: "relative",
  width: "1em",
  height: "1em",
  display: "inline-block",
  lineHeight: 1,
  flex: "0 0 auto",
};

const ratingTopStarBaseStyle: CSSProperties = {
  color: "var(--historietas-obra-rating-muted, rgba(251, 191, 36, 0.34))",
  position: "absolute",
  inset: 0,
  lineHeight: 1,
};

const ratingTopStarFillStyle: CSSProperties = {
  color: "var(--historietas-obra-rating, #FBBF24)",
  position: "absolute",
  inset: 0,
  overflow: "hidden",
  whiteSpace: "nowrap",
  lineHeight: 1,
};

const ratingTotalStyle: CSSProperties = {
  color: "rgba(255,255,255,0.95)",
  fontSize: "10px",
  lineHeight: 1.1,
  fontWeight: 900,
  textTransform: "uppercase",
  textAlign: "center",
  textShadow: "0 1px 0 rgba(0,0,0,0.28), 0 2px 8px rgba(0,0,0,0.2)",
  ...safeTextStyle,
};


const commentsGridStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
  minWidth: 0,
};

const commentCardStyle: CSSProperties = {
  padding: "9px",
  borderRadius: "15px",
  background: "rgba(255,255,255,0.045)",
  border: "1px solid rgba(255,255,255,0.07)",
  display: "grid",
  gap: "5px",
  minWidth: 0,
  boxShadow: "none",
};

const commentAuthorStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "12px",
  fontWeight: 950,
  ...safeTextStyle,
};

const commentTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "12px",
  lineHeight: 1.5,
  fontWeight: 650,
  ...safeTextStyle,
};

const chaptersSectionStyle: CSSProperties = {
  marginTop: "14px",
  minWidth: 0,
};

const sectionHeaderStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  alignItems: "center",
  justifyItems: "center",
  textAlign: "center",
  minWidth: 0,
  marginBottom: "9px",
};

const chapterCountBadgeStyle: CSSProperties = {
  width: "fit-content",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "10px",
  fontWeight: 950,
  textAlign: "center",
  ...safeTextStyle,
};

const chaptersListStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  minWidth: 0,
};

const chapterCardStyle: CSSProperties = {
  padding: "9px",
  borderRadius: "17px",
  background:
    "linear-gradient(135deg, var(--historietas-obra-surface, #08030F) 0%, var(--historietas-obra-bg-deep, #04000A) 100%)",
  border: "1px solid rgba(255,255,255,0.07)",
  display: "grid",
  gridTemplateColumns: "38px minmax(0, 1fr)",
  gap: "8px",
  alignItems: "center",
  minWidth: 0,
  overflow: "hidden",
  boxShadow: "none",
  color: "inherit",
  textDecoration: "none",
  cursor: "pointer",
};

const chapterNumberStyle: CSSProperties = {
  width: "38px",
  height: "38px",
  borderRadius: "13px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#FFFFFF",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "15px",
  fontWeight: 950,
  boxShadow: "none",
  ...safeTextStyle,
};

const chapterContentStyle: CSSProperties = {
  display: "grid",
  gap: "6px",
  minWidth: 0,
};

const chapterTopLineStyle: CSSProperties = {
  display: "flex",
  gap: "6px",
  flexWrap: "wrap",
  minWidth: 0,
};

const chapterOrderBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "9px",
  fontWeight: 950,
  ...safeTextStyle,
};

const chapterStatusBadgeStyle: CSSProperties = {
  ...chapterOrderBadgeStyle,
  background: "transparent",
  border: "none",
  color: "var(--historietas-text-secondary, #D4D4D8)",
};

const chapterTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "17px",
  lineHeight: 1.12,
  fontWeight: 950,
  letterSpacing: "-0.045em",
  ...safeTextStyle,
};

const chapterMetaStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11.5px",
  lineHeight: 1.42,
  fontWeight: 650,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

const desktopHeroStyle: CSSProperties = {
  ...heroStyle,
  width: "100%",
  maxWidth: "100%",
  marginLeft: 0,
  marginRight: 0,
  borderRadius: "30px",
  border: "1px solid rgba(255,255,255,0.06)",
  background: "var(--historietas-obra-bg-deep, #04000A)",
};

const desktopHeroContentStyle: CSSProperties = {
  ...heroContentStyle,
  minHeight: "560px",
};

const desktopCoverArtStyle: CSSProperties = {
  ...coverArtStyle,
  minHeight: "560px",
  height: "100%",
  borderRadius: "26px",
  backgroundPosition: "center",
};

const desktopHeroCoverLinkStyle: CSSProperties = {
  ...heroCoverLinkStyle,
  inset: "8px",
  borderRadius: "26px",
};

const desktopHeroOverlayContentStyle: CSSProperties = {
  ...heroOverlayContentStyle,
  bottom: "8px",
  alignItems: "end",
  justifyItems: "start",
  padding: "0 30px 10px",
  gap: "10px",
  textAlign: "left",
};

const desktopHeroBottomMetaBarStyle: CSSProperties = {
  ...heroBottomMetaBarStyle,
  maxWidth: "320px",
  padding: 0,
  borderRadius: 0,
};

const desktopTitleStyle: CSSProperties = {
  ...titleStyle,
  fontSize: "clamp(48px, 6vw, 82px)",
  lineHeight: 0.92,
  letterSpacing: "-0.085em",
  textAlign: "left",
  maxWidth: "900px",
};

const desktopDescriptionStyle: CSSProperties = {
  ...descriptionStyle,
  maxWidth: "760px",
  fontSize: "15px",
  lineHeight: 1.55,
  textAlign: "left",
};

const desktopHeroActionsStyle: CSSProperties = {
  ...heroActionsStyle,
  gridTemplateColumns: "minmax(0, 280px) 50px",
  maxWidth: "364px",
};

const desktopObraActionsMenuStyle: CSSProperties = {
  ...obraActionsMenuStyle,
  width: "min(820px, calc(100% - 24px))",
};

const desktopStatsGridStyle: CSSProperties = {
  ...statsGridStyle,
  gap: "10px",
  marginTop: "14px",
};


const desktopFileBoxStyle: CSSProperties = {
  ...fileBoxStyle,
  padding: "20px",
  borderRadius: "26px",
  marginTop: "18px",
};

const desktopFileInfoCardStyle: CSSProperties = {
  ...fileInfoCardStyle,
  gridTemplateColumns: "96px minmax(0, 1fr)",
  padding: "14px",
};

const desktopFileActionsStyle: CSSProperties = {
  ...fileActionsStyle,
  gridTemplateColumns: "180px 180px",
  justifyContent: "start",
};

const desktopCommunityBoxStyle: CSSProperties = {
  ...communityBoxStyle,
  marginTop: "12px",
  padding: 0,
  borderRadius: 0,
  gap: "10px",
};

const desktopReviewBoxStyle: CSSProperties = {
  ...reviewBoxStyle,
  marginTop: "14px",
  padding: 0,
  borderRadius: 0,
  gap: "12px",
};

const desktopCommentsGridStyle: CSSProperties = {
  ...commentsGridStyle,
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "8px",
};

const desktopChaptersListStyle: CSSProperties = {
  ...chaptersListStyle,
  gap: "9px",
};

const desktopChapterCardStyle: CSSProperties = {
  ...chapterCardStyle,
  gridTemplateColumns: "50px minmax(0, 1fr) 126px",
  padding: "10px",
  gap: "10px",
};

const emptyTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-accent, #F97316)",
  fontSize: "clamp(34px, 10vw, 58px)",
  lineHeight: 0.95,
  fontWeight: 950,
  letterSpacing: "-0.08em",
  ...safeTextStyle,
};