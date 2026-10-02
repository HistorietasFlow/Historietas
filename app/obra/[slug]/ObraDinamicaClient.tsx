"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useHistorietasLanguage } from "../../../components/HistorietasLanguageProvider";
import type { HistorietasLanguage } from "../../../lib/i18n";
import { createPortal } from "react-dom";
import { useParams, useRouter } from "next/navigation";
import type {
  CSSProperties,
  FormEvent,
  MouseEvent,
  TouchEvent,
} from "react";
import { supabase } from "../../../lib/supabase/client";
import type { TablesInsert } from "../../../lib/supabase/database.types";
import DenunciaModal from "../../../components/DenunciaModal";
import AdultContentGate from "../../../components/AdultContentGate";
import { historietasThemeCss, useHistorietasTheme } from "../../../lib/historietasTheme";
import { criarSlugBase, formatarData, formatarNumeroCompacto, formatarTamanhoArquivo, idObraSupabaseValido, normalizarTexto } from "../../../lib/utils";
import {
  ACESSO_CONTEUDO_18_TEMPORARIAMENTE_BLOQUEADO,
  acessoConteudo18Confirmado,
  ehClassificacao18,
  traduzirAvisoConteudo18,
} from "../../../lib/historietasAdultContent";
import { carregarMetricasConteudos } from "../../../lib/metricas";
import { solicitarUrlTemporariaArquivoObra } from "../../../lib/arquivosObras";
import {
  carregarTodasPaginasPorLotesSupabase,
  carregarTodasPaginasSupabase,
} from "../../../lib/supabase/paginacao.mjs";
import {
  atualizarIdentidadeAutenticadaObra,
  execucaoAutenticacaoObraEstaAtual,
  execucaoIdentidadeObraEstaAtual,
  type IdentidadeAutenticadaObra,
} from "./lib/obra-auth-identity";
import {
  focarInicioDialogo,
  manterFocoNoDialogo,
  obterElementoComFocoAtual,
  restaurarFocoAnterior,
} from "./lib/obra-dialog-focus";
import {
  carregarListaLocalObraPublica,
  lerStorageUsuarioObraPublica,
  salvarStorageUsuarioObraPublica,
} from "./lib/obra-user-storage";
import {
  avaliacaoObraVazia,
  calcularProximaAvaliacao,
  formatarMediaAvaliacao,
  formatarTotalAvaliacoes,
  NOTAS_AVALIACAO_OBRA,
  obterChaveAvaliacaoObra,
  obterPreenchimentoEstrela,
  obterProximaNotaAvaliacao,
  type AvaliacaoLocalObra,
  type AvaliacaoObraPublica,
} from "./lib/obra-rating-utils";
import { criarMetricasBaseObra, incrementarVisualizacaoObraPublicaSupabase, metricasComunidadeObraVazias, metricasObraVazias, normalizarContadorObraPublica, type MetricasComunidadeObra, type MetricasObraPublica } from "./lib/obra-metric-utils";
import { normalizarPerfilPublicoObra, obterClassificacaoIndicativaCompactaObra, obterGeneroObraExibido, obterNomeAutorObraExibido, obterSinopseObraExibida, obterTextoPerfilObra, obterTextosPainelClassificacaoObra, type EstadoTraducaoObraDinamica, type PerfilPublicoObra, type TraducaoObraDinamica } from "./lib/obra-text-utils";
import { criarLinkComunidadeObra, criarLinkPerfilAutor, criarLoginHrefObraPublica } from "./lib/obra-navigation-utils";
import { capaObraPodeSerOtimizada, obterIniciaisCapaObra } from "./lib/obra-cover-utils";
import { calcularProgressoLeitura, encontrarCapituloParaContinuarObraPublica, obterCapitulosObraPublica, obterIndicadorConteudoObraPublica, obterObraDisponivelExibida, obterTextoDisponibilidadeCapitulosObra, type CapituloDinamico, type SupabaseCapituloRow } from "./lib/obra-reading-utils";
import { obraEstaEmListaLocalObraPublica, salvarListaLocalObraPublica } from "./lib/obra-interaction-utils";
import { criarComentarioObraId, criarEstruturaComentariosObra, formatarTempoRelativoComentarioObra, obterIdsComentarioComRespostas, obterObraIdComentarios, type ComentarioObraPublico, type OrdenacaoComentariosObra, type PaginaComentariosObra, type RespostaComentarioObra, type SupabaseComentarioObraRow } from "./lib/obra-comment-utils";
import { copiarTextoComFallback } from "./lib/obra-share-utils";
import { normalizarArquivoObra, obterCaminhoStorageArquivoObra, obterChavesBackupObra, type ArquivoObraLocal, type ArquivosObrasBackup } from "./lib/obra-file-utils";
import type { AlvoDenunciaObraDinamica } from "./lib/obra-report-utils";
import { converterObraLocalParaDinamica, normalizarObraLocal, normalizarObraSupabase, restaurarArquivoObraComBackup, type ObraDinamica, type ObraLocal, type ResultadoCarregamentoObraPublica } from "./lib/obra-data-utils";
import type { DiarioAtividadeObraTipo, DiarioAtividadeObraVisibilidade } from "./lib/obra-activity-utils";
import LoadingSpinner from "./ObraLoadingSpinner";
import CommunityItem from "./ObraCommunityItem";
import MetricCard from "./ObraMetricCard";
import { chapterCardStyle, chapterContentStyle, chapterCountBadgeStyle, chaptersListStyle, chaptersSectionStyle, communityGridStyle, desktopTopWaterFadeStyle, heroTitleOutlineStyle, homeMainMetaTypographyStyle, homeMainStatsTypographyStyle, homeMainTitleTypographyStyle, mobileTopWaterFadeStyle, ratingNumberStyle, ratingStarsStyle, ratingSummaryStyle, ratingTopStarBaseStyle, ratingTopStarFillStyle, ratingTopStarVisualStyle, ratingTotalStyle, safeTextStyle, sectionHeaderStyle, synopsisCardStyle, synopsisSectionStyle, synopsisTextStyle } from "./lib/obra-style-utils";

const FOLLOWED_WORKS_STORAGE_KEY = "historietas-obras-seguidas";
const LIKED_WORKS_STORAGE_KEY = "historietas-obras-curtidas";
const RATED_WORKS_STORAGE_KEY = "historietas-obras-avaliacoes";
const FAVORITES_STORAGE_KEY = "historietas-obras-favoritas";
const COMPLETED_STORAGE_KEY = "historietas-obras-concluidas";
const LOCAL_WORKS_STORAGE_KEY = "historietas-obras";
const FILE_BACKUP_STORAGE_KEY = "historietas-arquivos-obras-backup";
const DURACAO_UTIL_URL_ARQUIVO_OBRA_MS = 9 * 60 * 1000;
const WORK_COMMENTS_STORAGE_KEY = "historietas-comentarios-obras";
const WORK_COMMENT_LIKES_TABLE = "comentarios_obras_curtidas";
const WORK_COMMENTS_PAGE_SIZE = 20;
const OBRA_DINAMICA_UI_TRANSLATIONS: Record<string, TraducaoObraDinamica> = {
  "Carregando": { en: "Loading", es: "Cargando" },
  "Carregando obra": { en: "Loading work", es: "Cargando obra" },
  "Começar a ler": { en: "Start reading", es: "Empezar a leer" },
  "Continuar leitura": { en: "Continue reading", es: "Continuar leyendo" },
  "Obra não encontrada": { en: "Work not found", es: "Obra no encontrada" },
  "Não foi possível carregar a obra agora.": {
    en: "The work could not be loaded right now.",
    es: "No se pudo cargar la obra en este momento.",
  },
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
  "Denunciar": { en: "Report", es: "Denunciar" },
  "Link copiado!": { en: "Link copied!", es: "¡Enlace copiado!" },
  "Sinopse": { en: "Synopsis", es: "Sinopsis" },
  "SINOPSE": { en: "SYNOPSIS", es: "SINOPSIS" },
  "Capítulos": { en: "Chapters", es: "Capítulos" },
  "Mostrar sinopse": { en: "Show synopsis", es: "Mostrar sinopsis" },
  "Mostrar capítulos": { en: "Show chapters", es: "Mostrar capítulos" },
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
    if (
      ACESSO_CONTEUDO_18_TEMPORARIAMENTE_BLOQUEADO &&
      ehClassificacao18(obraLocal.classificacaoIndicativa)
    ) {
      return false;
    }

    return obraLocal.publicado && obraLocal.capitulos.length > 0;
  });

  sincronizarBackupArquivosObras(obrasNormalizadas, userIdLimpo);

  return obrasPublicasLocais;
}

async function aplicarMetricasObraPublica(
  obrasParaAtualizar: ObraLocal[],
  userId: string,
) {
  const obraIds = Array.from(
    new Set(obrasParaAtualizar.map((obra) => obra.id.trim()).filter(Boolean)),
  );
  const capituloIds = Array.from(
    new Set(
      obrasParaAtualizar.flatMap((obra) =>
        obra.capitulos.map((capitulo) => capitulo.id.trim()).filter(Boolean),
      ),
    ),
  );

  if (obraIds.length === 0 && capituloIds.length === 0) {
    return obrasParaAtualizar;
  }

  const metricas = await carregarMetricasConteudos({ obraIds, capituloIds });

  if (!metricas.carregado) {
    return obrasParaAtualizar;
  }

  const aplicarProgresso = Boolean(userId.trim());

  return obrasParaAtualizar.map((obra) => {
    const metricaObra = metricas.obras.get(obra.id);
    let ultimoCapituloLidoId = aplicarProgresso
      ? ""
      : obra.ultimoCapituloLidoId;
    let ultimaLeituraEm = aplicarProgresso ? "" : obra.ultimaLeituraEm;

    const capitulos = obra.capitulos.map((capitulo) => {
      const metrica = metricas.capitulos.get(capitulo.id);
      const progressoRemotoDisponivel = aplicarProgresso && Boolean(metrica);
      const lido = progressoRemotoDisponivel
        ? Boolean(metrica?.usuario.leu)
        : capitulo.lido;
      const lidoEm = progressoRemotoDisponivel && lido
        ? metrica?.usuario.lidoEm || ""
        : capitulo.lidoEm;

      if (lido) {
        const tempoAtual = new Date(lidoEm).getTime();
        const tempoUltimo = new Date(ultimaLeituraEm).getTime();
        const tempoAtualSeguro = Number.isNaN(tempoAtual) ? 0 : tempoAtual;
        const tempoUltimoSeguro = Number.isNaN(tempoUltimo) ? 0 : tempoUltimo;

        if (!ultimoCapituloLidoId || tempoAtualSeguro >= tempoUltimoSeguro) {
          ultimoCapituloLidoId = capitulo.id;
          ultimaLeituraEm = lidoEm;
        }
      }

      return {
        ...capitulo,
        curtiu: Boolean(capitulo.curtiu || metrica?.usuario.curtiu),
        salvo: Boolean(capitulo.salvo || metrica?.usuario.salvou),
        lido,
        lidoEm,
        totalCurtidas:
          metrica?.interacoes.curtidas ??
          normalizarContadorObraPublica(capitulo.totalCurtidas),
        totalComentarios:
          metrica?.interacoes.comentarios ??
          normalizarContadorObraPublica(capitulo.totalComentarios),
        totalSalvos:
          metrica?.interacoes.salvos ??
          normalizarContadorObraPublica(capitulo.totalSalvos),
        // Progresso de leitura é privado; o contrato fornece apenas o estado
        // do usuário atual, não um contador público de leitores.
        totalLidos: normalizarContadorObraPublica(capitulo.totalLidos),
      };
    });

    return {
      ...obra,
      capitulos,
      ultimoCapituloLidoId,
      ultimaLeituraEm,
      progressoLeitura: calcularProgressoLeitura(capitulos),
      visualizacoes:
        metricaObra?.visualizacoes ??
        normalizarContadorObraPublica(obra.visualizacoes),
      totalCurtidas:
        metricaObra?.interacoesDiretas.curtidas ??
        normalizarContadorObraPublica(obra.totalCurtidas),
      totalComentarios:
        metricaObra?.interacoesDiretas.comentarios ??
        normalizarContadorObraPublica(obra.totalComentarios),
      totalFavoritos:
        metricaObra?.interacoesDiretas.favoritos ??
        normalizarContadorObraPublica(obra.totalFavoritos),
      totalConcluidas:
        metricaObra?.interacoesDiretas.concluidas ??
        normalizarContadorObraPublica(obra.totalConcluidas),
    };
  });
}
async function carregarObraSupabasePorSlug(
  slugBusca: string,
  obrasLocais: ObraLocal[],
  userId = "",
  operacaoAindaAtual?: () => boolean,
) {
  const slugLimpo = slugBusca.trim();
  const execucaoAtual = () => !operacaoAindaAtual || operacaoAindaAtual();

  async function aplicarMetricasSeAtual(obrasBase: ObraLocal[]) {
    if (!execucaoAtual()) {
      return obrasBase;
    }

    const obrasComMetricas = await aplicarMetricasObraPublica(
      obrasBase,
      userId,
    );

    return execucaoAtual() ? obrasComMetricas : obrasBase;
  }

  if (!slugLimpo) {
    return {
      obras: obrasLocais,
      status: "nao_encontrada",
    } satisfies ResultadoCarregamentoObraPublica;
  }

  if (!execucaoAtual()) {
    return {
      obras: obrasLocais,
      status: "cancelada",
    } satisfies ResultadoCarregamentoObraPublica;
  }

  try {
    const { data: obrasBanco, error: erroObra } = await supabase
      .from("obras")
      .select(
        "id,user_id,titulo,autor,genero,formato,classificacao_indicativa,avisos_conteudo,sinopse,tags,capa_url,capa_nome,arquivo_url,arquivo_nome,arquivo_tipo,arquivo_tamanho,arquivo_categoria,visualizacoes,publicado,slug,link,criada_em,atualizado_em"
      )
      .eq("slug", slugLimpo)
      .eq("publicado", true)
      .limit(1);

    if (!execucaoAtual()) {
      return {
        obras: obrasLocais,
        status: "cancelada",
      } satisfies ResultadoCarregamentoObraPublica;
    }

    if (erroObra) {
      console.warn(
        "Não consegui carregar a obra pública no Supabase:",
        erroObra.message
      );
      return {
        obras: await aplicarMetricasSeAtual(obrasLocais),
        status: "erro",
      } satisfies ResultadoCarregamentoObraPublica;
    }

    const obraBanco = (obrasBanco || [])[0] || null;

    if (!obraBanco) {
      const obrasSemCacheObsoleto = obrasLocais.filter((obraLocalAtual) => {
        const slugsLocais = new Set(
          [
            obraLocalAtual.slug?.trim() || "",
            criarSlugBase(obraLocalAtual.titulo),
          ].filter(Boolean),
        );

        return !slugsLocais.has(slugLimpo);
      });

      return {
        obras: obrasSemCacheObsoleto,
        status: "nao_encontrada",
      } satisfies ResultadoCarregamentoObraPublica;
    }

    let capitulosBanco: SupabaseCapituloRow[] = [];

    try {
      capitulosBanco =
        await carregarTodasPaginasSupabase<SupabaseCapituloRow>({
          nomeColecao: "capítulos da obra pública",
          buscarPagina: async (inicio, fim) =>
            supabase
              .from("capitulos")
              .select("id,obra_id,user_id,titulo,ordem,publicado,criado_em,atualizado_em")
              .eq("obra_id", obraBanco.id)
              .eq("publicado", true)
              .order("ordem", { ascending: true })
              .order("id", { ascending: true })
              .range(inicio, fim),
        });
    } catch (error) {
      console.warn(
        "Não consegui carregar capítulos da obra pública no Supabase:",
        error,
      );
    }

    if (!execucaoAtual()) {
      return {
        obras: obrasLocais,
        status: "cancelada",
      } satisfies ResultadoCarregamentoObraPublica;
    }

    const obraLocal = obrasLocais.find((obraLocalAtual) => {
      const slugLocal = obraLocalAtual.slug || criarSlugBase(obraLocalAtual.titulo);

      return obraLocalAtual.id === obraBanco.id || slugLocal === slugLimpo;
    });

    const obraNormalizadaSemTotais = normalizarObraSupabase(
      obraBanco,
      capitulosBanco,
      obraLocal,
      0
    );
    const [obraNormalizada] = await aplicarMetricasSeAtual([
      obraNormalizadaSemTotais,
    ]);

    if (!execucaoAtual()) {
      return {
        obras: obrasLocais,
        status: "cancelada",
      } satisfies ResultadoCarregamentoObraPublica;
    }

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

    if (!execucaoAtual()) {
      return {
        obras: obrasLocais,
        status: "cancelada",
      } satisfies ResultadoCarregamentoObraPublica;
    }

    sincronizarBackupArquivosObras(obrasAtualizadas, userId);

    return {
      obras: obrasAtualizadas,
      status: "carregada",
    } satisfies ResultadoCarregamentoObraPublica;
  } catch (error) {
    if (!execucaoAtual()) {
      return {
        obras: obrasLocais,
        status: "cancelada",
      } satisfies ResultadoCarregamentoObraPublica;
    }

    console.warn("Não consegui acessar o Supabase agora:", error);
    return {
      obras: await aplicarMetricasSeAtual(obrasLocais),
      status: "erro",
    } satisfies ResultadoCarregamentoObraPublica;
  }
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
        .from("profiles_publicos")
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
          .from("profiles_publicos")
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

async function salvarRegistroObraPublicaSupabase(
  tabela: "favoritos" | "concluidas",
  userId: string,
  obraId: string,
  ativo: boolean
) {
  if (!userId || !obraId || !idObraSupabaseValido(obraId)) {
    return;
  }

  if (!ativo) {
    const { error: erroDelete } = await supabase
      .from(tabela)
      .delete()
      .eq("user_id", userId)
      .eq("obra_id", obraId);

    if (erroDelete) {
      throw erroDelete;
    }

    return;
  }

  const { error: erroUpsert } = await supabase.from(tabela).upsert(
    {
      user_id: userId,
      obra_id: obraId,
      visibilidade: "publico",
    },
    {
      onConflict: "user_id,obra_id",
      ignoreDuplicates: true,
    },
  );

  if (erroUpsert) {
    throw erroUpsert;
  }
}

async function salvarCurtidaObraPublicaSupabase(
  userId: string,
  obraId: string,
  ativo: boolean,
  execucaoAtual: () => boolean = () => true,
) {
  if (
    !userId ||
    !obraId ||
    !idObraSupabaseValido(obraId) ||
    !execucaoAtual()
  ) {
    return;
  }

  if (!ativo) {
    const { error: erroDelete } = await supabase
      .from("obra_curtidas")
      .delete()
      .eq("obra_id", obraId)
      .eq("user_id", userId);

    if (erroDelete) {
      throw erroDelete;
    }

    return;
  }

  const tentativas: Array<TablesInsert<"obra_curtidas">> = [
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
    if (!execucaoAtual()) {
      return;
    }

    const { error } = await supabase.from("obra_curtidas").upsert(payload, {
      onConflict: "user_id,obra_id",
      ignoreDuplicates: true,
    });

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

function obterAvaliacaoLocalDetalhada(
  obra: ObraDinamica,
  userId = ""
): AvaliacaoLocalObra {
  const chaveAvaliacao = obterChaveAvaliacaoObra(obra);
  const avaliacoesLocais = carregarAvaliacoesLocais(userId);
  const encontrada = Object.prototype.hasOwnProperty.call(
    avaliacoesLocais,
    chaveAvaliacao
  );
  const nota = Number(avaliacoesLocais[chaveAvaliacao]);

  return {
    encontrada,
    nota:
      Number.isFinite(nota) && nota >= 0.5 && nota <= 5
        ? Math.round(nota * 2) / 2
        : 0,
  };
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
    avaliacoesLocais[chaveAvaliacao] =
      nota <= 0 ? 0 : Math.round(nota * 2) / 2;

    salvarStorageUsuarioObraPublica(
      RATED_WORKS_STORAGE_KEY,
      userIdLimpo,
      avaliacoesLocais
    );
  } catch {
    // Avaliação local é fallback e não deve travar a página.
  }
}

async function salvarAvaliacaoRemotaObra({
  obraId,
  userId,
  nota,
}: {
  obraId: string;
  userId: string;
  nota: number;
}) {
  if (!obraId.trim() || !userId.trim()) {
    return;
  }

  if (nota <= 0) {
    const { error: erroRemocao } = await supabase
      .from("obra_avaliacoes")
      .delete()
      .eq("obra_id", obraId)
      .eq("user_id", userId);

    if (erroRemocao) {
      throw erroRemocao;
    }

    return;
  }

  const { error: erroSalvar } = await supabase
    .from("obra_avaliacoes")
    .upsert(
      {
        obra_id: obraId,
        user_id: userId,
        nota,
      },
      {
        onConflict: "obra_id,user_id",
      },
    );

  if (erroSalvar) {
    throw erroSalvar;
  }
}

async function removerAtividadeDiarioObra({
  userId,
  obra,
  tipo,
  execucaoAtual = () => true,
}: {
  userId: string;
  obra: ObraDinamica;
  tipo: DiarioAtividadeObraTipo;
  execucaoAtual?: () => boolean;
}) {
  if (
    !userId ||
    !obra.id ||
    !idObraSupabaseValido(obra.id) ||
    !execucaoAtual()
  ) {
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
  execucaoAtual = () => true,
}: {
  userId: string;
  obra: ObraDinamica;
  tipo: DiarioAtividadeObraTipo;
  nota?: number;
  texto?: string;
  visibilidade: DiarioAtividadeObraVisibilidade;
  execucaoAtual?: () => boolean;
}) {
  if (
    !userId ||
    !obra.id ||
    !idObraSupabaseValido(obra.id) ||
    !execucaoAtual()
  ) {
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
      execucaoAtual,
    });

    if (!execucaoAtual()) {
      return;
    }

    const { error } = await supabase.from("diario_atividades").insert({
      ...payloadBase,
      nota: notaNormalizada,
    });

    if (!error || !execucaoAtual()) {
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
      const curtidas = await carregarTodasPaginasPorLotesSupabase<
        { comentario_id: string; usuario_id: string },
        string
      >({
        nomeColecao: "curtidas dos comentários da obra",
        itens: comentariosIds,
        buscarPaginaLote: async (comentarioIdsLote, inicio, fim) =>
          supabase
            .from(WORK_COMMENT_LIKES_TABLE)
            .select("comentario_id,usuario_id")
            .in("comentario_id", comentarioIdsLote)
            .order("comentario_id", { ascending: true })
            .order("usuario_id", { ascending: true })
            .range(inicio, fim),
      });

      curtidas.forEach(
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

async function carregarPaginaComentariosObraSupabase(
  obraId: string,
  offset: number,
): Promise<PaginaComentariosObra> {
  const inicio = Math.max(0, offset);
  const fim = inicio + WORK_COMMENTS_PAGE_SIZE;
  const { data: comentariosRaizData, error: erroComentariosRaiz } =
    await supabase
      .from("comentarios_obras")
      .select("id,obra_id,user_id,comentario,comentario_pai_id,criado_em")
      .eq("obra_id", obraId)
      .is("comentario_pai_id", null)
      .order("criado_em", { ascending: false })
      .order("id", { ascending: false })
      .range(inicio, fim);

  if (erroComentariosRaiz) {
    throw erroComentariosRaiz;
  }

  const comentariosRaizTodos = Array.isArray(comentariosRaizData)
    ? (comentariosRaizData as SupabaseComentarioObraRow[])
    : [];
  const temMais = comentariosRaizTodos.length > WORK_COMMENTS_PAGE_SIZE;
  const comentariosRaiz = comentariosRaizTodos.slice(
    0,
    WORK_COMMENTS_PAGE_SIZE,
  );
  const idsConhecidos = new Set(
    comentariosRaiz
      .map((comentario) => comentario.id?.trim() || "")
      .filter(Boolean),
  );

  async function carregarDescendentes(
    idsPais: string[],
  ): Promise<SupabaseComentarioObraRow[]> {
    if (idsPais.length === 0) {
      return [];
    }

    const respostas = await carregarTodasPaginasPorLotesSupabase<
      SupabaseComentarioObraRow,
      string
    >({
      nomeColecao: "respostas dos comentários da obra",
      itens: idsPais,
      buscarPaginaLote: async (comentariosPaisLote, paginaInicio, paginaFim) =>
        supabase
          .from("comentarios_obras")
          .select(
            "id,obra_id,user_id,comentario,comentario_pai_id,criado_em",
          )
          .eq("obra_id", obraId)
          .in("comentario_pai_id", comentariosPaisLote)
          .order("criado_em", { ascending: true })
          .order("id", { ascending: true })
          .range(paginaInicio, paginaFim),
    });
    const respostasNovas: SupabaseComentarioObraRow[] = [];
    const proximosIdsPais: string[] = [];

    respostas.forEach((resposta) => {
      const respostaId = resposta.id?.trim() || "";

      if (!respostaId || idsConhecidos.has(respostaId)) {
        return;
      }

      idsConhecidos.add(respostaId);
      respostasNovas.push(resposta);
      proximosIdsPais.push(respostaId);
    });

    return [
      ...respostasNovas,
      ...(await carregarDescendentes(proximosIdsPais)),
    ];
  }

  const comentariosDescendentes = await carregarDescendentes(
    Array.from(idsConhecidos),
  );
  const comentarios = await normalizarComentariosObraSupabase([
    ...comentariosRaiz,
    ...comentariosDescendentes,
  ]);

  return {
    comentarios,
    temMais,
    proximoOffset: inicio + comentariosRaiz.length,
  };
}


export default function ObraDinamicaPage() {
  const router = useRouter();
  const { language } = useHistorietasLanguage();
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
  const [erroCarregamentoObra, setErroCarregamentoObra] = useState(false);
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
  const [denunciaAlvo, setDenunciaAlvo] =
    useState<AlvoDenunciaObraDinamica | null>(null);
  const [sinopseAberta, setSinopseAberta] = useState(false);
  const [painelClassificacaoAberto, setPainelClassificacaoAberto] =
    useState(false);
  const [comentariosObra, setComentariosObra] = useState<ComentarioObraPublico[]>([]);
  const [totalComentariosObra, setTotalComentariosObra] = useState(0);
  const [comentariosCarregando, setComentariosCarregando] = useState(false);
  const [comentariosCarregandoMais, setComentariosCarregandoMais] =
    useState(false);
  const [comentariosTemMais, setComentariosTemMais] = useState(false);
  const [comentariosProximoOffset, setComentariosProximoOffset] = useState(0);
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
  const [autenticacaoCarregada, setAutenticacaoCarregada] = useState(false);
  const [controleAcesso18, setControleAcesso18] = useState<{
    obraId: string;
    status: "verificando" | "permitido" | "bloqueado";
  }>({ obraId: "", status: "verificando" });
  const [perfilUsuarioLogado, setPerfilUsuarioLogado] =
    useState<PerfilPublicoObra | null>(null);
  const comentarioInputRef = useRef<HTMLTextAreaElement | null>(null);
  const comentariosSheetRef = useRef<HTMLElement | null>(null);
  const classificacaoDialogRef = useRef<HTMLElement | null>(null);
  const acoesObraDialogRef = useRef<HTMLElement | null>(null);
  const focoAntesComentariosRef = useRef<HTMLElement | null>(null);
  const focoAntesClassificacaoRef = useRef<HTMLElement | null>(null);
  const focoAntesAcoesObraRef = useRef<HTMLElement | null>(null);
  const comentariosDragStartYRef = useRef(0);
  const comentariosDragOffsetYRef = useRef(0);
  const comentariosDragIgnorarCliqueRef = useRef(false);
  const comentariosDragResetTimerRef = useRef<number | null>(null);
  const comentariosConsultaVersaoRef = useRef(0);
  const [isDesktop, setIsDesktop] = useState(false);
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);
  const visualizacaoObraRegistradaRef = useRef("");
  const avaliacaoVersaoRef = useRef(0);
  const identidadeAutenticadaObraRef =
    useRef<IdentidadeAutenticadaObra>({
      usuarioId: "",
      versao: 0,
    });
  const versaoConsultaAutenticacaoObraRef = useRef(0);

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
    let componenteAtivo = true;

    function limparEstadoContaAnterior() {
      setObrasLocais([]);
      setCarregandoObras(true);
      setObraSeguida(false);
      setObraFavoritada(false);
      setObraConcluida(false);
      setMetricasObra(metricasObraVazias);
      setAvaliacaoObra(avaliacaoObraVazia);
      setPerfilUsuarioLogado(null);
      setComentariosObra([]);
      setTotalComentariosObra(0);
      setComentarioTexto("");
      setComentarioStatus("");
      setComentarioEnviando(false);
      setComentarioRemovendoId("");
      setComentarioCurtindoId("");
      setRespostaComentario(null);
      setRespostasVisiveisPorComentario({});
      setMensagemAcao("");
      avaliacaoVersaoRef.current += 1;
    }

    function aplicarIdentidadeAutenticada(usuarioId: string) {
      const resultado = atualizarIdentidadeAutenticadaObra(
        identidadeAutenticadaObraRef.current,
        usuarioId,
      );

      if (resultado.mudou) {
        identidadeAutenticadaObraRef.current = resultado.identidade;
        limparEstadoContaAnterior();
        setUsuarioIdLogado(resultado.identidade.usuarioId);
      }

      setAutenticacaoCarregada(true);
    }

    async function carregarUsuarioLogado() {
      const versaoConsulta = versaoConsultaAutenticacaoObraRef.current + 1;
      versaoConsultaAutenticacaoObraRef.current = versaoConsulta;

      try {
        const { data } = await supabase.auth.getUser();
        const userId = data.user?.id || "";

        if (
          execucaoAutenticacaoObraEstaAtual({
            cancelada: !componenteAtivo,
            versaoEsperada: versaoConsulta,
            versaoAtual: versaoConsultaAutenticacaoObraRef.current,
          })
        ) {
          aplicarIdentidadeAutenticada(userId);
        }
      } catch {
        if (
          execucaoAutenticacaoObraEstaAtual({
            cancelada: !componenteAtivo,
            versaoEsperada: versaoConsulta,
            versaoAtual: versaoConsultaAutenticacaoObraRef.current,
          })
        ) {
          aplicarIdentidadeAutenticada("");
        }
      }
    }

    void carregarUsuarioLogado();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (componenteAtivo) {
        versaoConsultaAutenticacaoObraRef.current += 1;
        aplicarIdentidadeAutenticada(session?.user?.id || "");
      }
    });

    return () => {
      componenteAtivo = false;
      versaoConsultaAutenticacaoObraRef.current += 1;
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
    if (!comentariosAbertos) {
      return;
    }

    const focoTimer = window.setTimeout(() => {
      focarInicioDialogo(comentariosSheetRef.current);
    }, 0);

    return () => {
      window.clearTimeout(focoTimer);
    };
  }, [comentariosAbertos]);

  useEffect(() => {
    if (!painelClassificacaoAberto) {
      return;
    }

    const focoTimer = window.setTimeout(() => {
      focarInicioDialogo(classificacaoDialogRef.current);
    }, 0);

    return () => {
      window.clearTimeout(focoTimer);
    };
  }, [painelClassificacaoAberto]);

  useEffect(() => {
    if (!acoesObraAbertas) {
      return;
    }

    const focoTimer = window.setTimeout(() => {
      focarInicioDialogo(acoesObraDialogRef.current);
    }, 0);

    return () => {
      window.clearTimeout(focoTimer);
    };
  }, [acoesObraAbertas]);


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
    if (!autenticacaoCarregada) {
      return;
    }

    let cancelado = false;
    const identidadeEsperada = identidadeAutenticadaObraRef.current;

    if (identidadeEsperada.usuarioId !== usuarioIdLogado.trim()) {
      return;
    }

    function execucaoCarregamentoEstaAtual() {
      return execucaoIdentidadeObraEstaAtual({
        cancelada: cancelado,
        identidadeEsperada,
        identidadeAtual: identidadeAutenticadaObraRef.current,
      });
    }

    async function carregarObraPublica() {
      window.setTimeout(() => {
        if (execucaoCarregamentoEstaAtual()) {
          setCarregandoObras(true);
          setErroCarregamentoObra(false);
        }
      }, 0);

      try {
        const obrasNormalizadas = carregarObrasLocaisComBackup(
          identidadeEsperada.usuarioId,
        );

        if (!execucaoCarregamentoEstaAtual()) {
          return;
        }

        window.setTimeout(() => {
          if (execucaoCarregamentoEstaAtual()) {
            setObrasLocais(obrasNormalizadas);
          }
        }, 0);

        const resultadoSupabase = await carregarObraSupabasePorSlug(
          slug,
          obrasNormalizadas,
          identidadeEsperada.usuarioId,
          execucaoCarregamentoEstaAtual,
        );

        if (!execucaoCarregamentoEstaAtual()) {
          return;
        }

        window.setTimeout(() => {
          if (execucaoCarregamentoEstaAtual()) {
            setObrasLocais(resultadoSupabase.obras);
            setErroCarregamentoObra(resultadoSupabase.status === "erro");
          }
        }, 0);
      } catch {
        if (!execucaoCarregamentoEstaAtual()) {
          return;
        }

        window.setTimeout(() => {
          if (execucaoCarregamentoEstaAtual()) {
            setErroCarregamentoObra(true);
          }
        }, 0);
      } finally {
        if (!execucaoCarregamentoEstaAtual()) {
          return;
        }

        window.setTimeout(() => {
          if (execucaoCarregamentoEstaAtual()) {
            setCarregandoObras(false);
          }
        }, 0);
      }
    }

    void carregarObraPublica();

    return () => {
      cancelado = true;
    };
  }, [autenticacaoCarregada, slug, usuarioIdLogado]);

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
    const fecharPaineisTimer = window.setTimeout(() => {
      setSinopseAberta(false);
      setPainelClassificacaoAberto(false);
    }, 0);

    return () => {
      window.clearTimeout(fecharPaineisTimer);
    };
  }, [obra?.id]);

  const statusAcesso18 =
    obra && controleAcesso18.obraId === obra.id
      ? controleAcesso18.status
      : "verificando";

  useEffect(() => {
    const atualizarAcessoTimer = window.setTimeout(() => {
      if (!obra) {
        setControleAcesso18({ obraId: "", status: "verificando" });
        return;
      }

      const proximoStatus = !ehClassificacao18(obra.classificacaoIndicativa)
        ? "permitido"
        : acessoConteudo18Confirmado()
          ? "permitido"
          : "bloqueado";

      setControleAcesso18((controleAtual) => {
        if (
          controleAtual.obraId === obra.id &&
          controleAtual.status === proximoStatus
        ) {
          return controleAtual;
        }

        return { obraId: obra.id, status: proximoStatus };
      });
    }, 0);

    return () => {
      window.clearTimeout(atualizarAcessoTimer);
    };
  }, [obra]);

  useEffect(() => {
    if (
      !obra ||
      statusAcesso18 !== "permitido" ||
      !idObraSupabaseValido(obra.id)
    ) {
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
  }, [obra, statusAcesso18]);

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
  const generoObraFormatado = obterGeneroObraExibido(obra);
  const autorObraNome = obterNomeAutorObraExibido(perfilAutorObra, obra);
  const autorObraId = perfilAutorObra?.userId || obra?.autorId || "";
  const usuarioEhAutorDaObra = Boolean(
    usuarioIdLogado &&
      autorObraId &&
      usuarioIdLogado === autorObraId
  );
  const obraDisponivel = obterObraDisponivelExibida(obra);
  const sinopseObraExibida = obterSinopseObraExibida(obra);
  const textosPainelClassificacao = obterTextosPainelClassificacaoObra(language);

  const capitulosDaObra = useMemo<CapituloDinamico[]>(
    () => obterCapitulosObraPublica(obra),
    [obra]
  );

  const {
    icone: indicadorConteudoIcone,
    valor: indicadorConteudoValor,
  } = obterIndicadorConteudoObraPublica({
    capitulos: capitulosDaObra,
    arquivoObra: obra?.arquivoObra,
  });
  const obraIdComentarios = obterObraIdComentarios(obra);


  useEffect(() => {
    const versaoConsulta = comentariosConsultaVersaoRef.current + 1;
    comentariosConsultaVersaoRef.current = versaoConsulta;

    if (!comentariosAbertos) {
      return;
    }

    let cancelado = false;
    const execucaoAtual = () =>
      !cancelado && comentariosConsultaVersaoRef.current === versaoConsulta;

    async function carregarComentariosObra() {
      setComentarioStatus("");
      setComentariosCarregandoMais(false);
      setComentariosTemMais(false);
      setComentariosProximoOffset(0);

      if (!obraIdComentarios) {
        setComentariosObra([]);
        setTotalComentariosObra(0);
        setComentariosCarregando(false);
        return;
      }

      const comentariosLocais = usuarioIdLogado
        ? carregarComentariosObraLocais(usuarioIdLogado, obraIdComentarios)
        : [];

      if (!idObraSupabaseValido(obraIdComentarios)) {
        setComentariosObra(comentariosLocais);
        setTotalComentariosObra(comentariosLocais.length);
        setComentariosCarregando(false);
        return;
      }

      setComentariosCarregando(true);
      setComentariosObra([]);

      try {
        const pagina = await carregarPaginaComentariosObraSupabase(
          obraIdComentarios,
          0,
        );

        if (!execucaoAtual()) {
          return;
        }

        setComentariosObra(pagina.comentarios);
        setComentariosTemMais(pagina.temMais);
        setComentariosProximoOffset(pagina.proximoOffset);
        setTotalComentariosObra((totalAtual) =>
          Math.max(totalAtual, pagina.comentarios.length),
        );

        if (usuarioIdLogado) {
          salvarComentariosObraLocais(
            usuarioIdLogado,
            obraIdComentarios,
            pagina.comentarios,
          );
        }
      } catch {
        if (execucaoAtual()) {
          setComentariosObra(comentariosLocais);
          setTotalComentariosObra((totalAtual) =>
            Math.max(totalAtual, comentariosLocais.length),
          );
          setComentarioStatus(
            "Não foi possível carregar os comentários agora.",
          );
        }
      } finally {
        if (execucaoAtual()) {
          setComentariosCarregando(false);
        }
      }
    }

    void carregarComentariosObra();

    return () => {
      cancelado = true;
    };
  }, [comentariosAbertos, obraIdComentarios, usuarioIdLogado]);

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
      setObraFavoritada(estadoFavoritadaLocal);
      setObraConcluida(estadoConcluidaLocal);
    }, 0);

    return () => {
      window.clearTimeout(aplicarEstadoColecoesTimer);
    };
  }, [obra, obraNormalizada, usuarioIdLogado]);

  useEffect(() => {
    if (!obra) {
      const resetMetricasTimer = window.setTimeout(() => {
        setMetricasObra(metricasObraVazias);
        setTotalComentariosObra(0);
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
      setMetricasComunidadeObra({
        ...metricasComunidadeObraVazias,
        carregado: true,
      });
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
      setTotalComentariosObra(metricasBase.comentarios);
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
        const contrato = await carregarMetricasConteudos({
          obraIds: [obraId],
        });
        const metrica = contrato.obras.get(obraId);

        if (!contrato.carregado || !metrica) {
          throw new Error("Métricas da obra indisponíveis.");
        }

        const curtidaAtiva = metrica.usuario.curtiu;
        const seguindoAtivo = metrica.usuario.seguiu;
        const favoritadaAtiva = metrica.usuario.favoritou;
        const concluidaAtiva = metrica.usuario.concluiu;

        if (cancelado) {
          return;
        }

        if (usuarioIdLogado) {
          const obrasCurtidas = carregarListaLocalObraPublica(
            LIKED_WORKS_STORAGE_KEY,
            usuarioIdLogado,
          );
          const novasObrasCurtidas = curtidaAtiva
            ? Array.from(new Set([...obrasCurtidas, obraNormalizada]))
            : obrasCurtidas.filter((titulo) => titulo !== obraNormalizada);

          salvarStorageUsuarioObraPublica(
            LIKED_WORKS_STORAGE_KEY,
            usuarioIdLogado,
            novasObrasCurtidas,
          );

          const obrasSeguidas = carregarListaLocalObraPublica(
            FOLLOWED_WORKS_STORAGE_KEY,
            usuarioIdLogado,
          );
          const chavesObraAtual = Array.from(
            new Set(
              [
                obraNormalizada,
                obraAtual.id || "",
                obraAtual.slug || "",
                obraAtual.link || "",
              ].filter((chave) => Boolean(chave.trim())),
            ),
          );
          const novasObrasSeguidas = seguindoAtivo
            ? Array.from(new Set([...obrasSeguidas, ...chavesObraAtual]))
            : obrasSeguidas.filter(
                (chave) => !chavesObraAtual.includes(chave),
              );

          salvarStorageUsuarioObraPublica(
            FOLLOWED_WORKS_STORAGE_KEY,
            usuarioIdLogado,
            novasObrasSeguidas,
          );
          salvarListaLocalObraPublica(
            obraAtual,
            FAVORITES_STORAGE_KEY,
            favoritadaAtiva,
            usuarioIdLogado,
          );
          salvarListaLocalObraPublica(
            obraAtual,
            COMPLETED_STORAGE_KEY,
            concluidaAtiva,
            usuarioIdLogado,
          );
        }

        setObraSeguida(seguindoAtivo);
        setObraFavoritada(favoritadaAtiva);
        setObraConcluida(concluidaAtiva);
        setMetricasObra({
          visualizacoes: metrica.visualizacoes,
          curtidas: metrica.interacoesDiretas.curtidas,
          comentarios: metrica.interacoesDiretas.comentarios,
          seguidores: metrica.interacoesDiretas.seguidores,
          curtidaAtiva,
          carregado: true,
        });
        setTotalComentariosObra(metrica.interacoesDiretas.comentarios);
        setMetricasComunidadeObra({
          teorias: metrica.comunidade.teorias,
          reviews: metrica.comunidade.reviews,
          posts: metrica.comunidade.posts,
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
      const resetAvaliacaoTimer = window.setTimeout(() => {
        setAvaliacaoObra(avaliacaoObraVazia);
      }, 0);

      return () => {
        window.clearTimeout(resetAvaliacaoTimer);
      };
    }

    const obraAtual = obra;
    const versaoAoIniciar = avaliacaoVersaoRef.current;
    const usuarioLogadoEhAutorInicial = Boolean(
      usuarioIdLogado &&
        obraAtual.autorId &&
        usuarioIdLogado === obraAtual.autorId
    );
    const avaliacaoLocalInicial = usuarioLogadoEhAutorInicial
      ? { encontrada: false, nota: 0 }
      : obterAvaliacaoLocalDetalhada(obraAtual, usuarioIdLogado);

    const aplicarAvaliacaoLocalTimer = window.setTimeout(() => {
      if (avaliacaoVersaoRef.current !== versaoAoIniciar) {
        return;
      }

      setAvaliacaoObra({
        media: avaliacaoLocalInicial.nota > 0 ? avaliacaoLocalInicial.nota : 0,
        total: avaliacaoLocalInicial.nota > 0 ? 1 : 0,
        minhaNota: avaliacaoLocalInicial.nota,
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
        const userId = usuarioData.user?.id || usuarioIdLogado || "";
        const autorIdObraAtual = obraAtual.autorId?.trim() || "";
        const usuarioEhAutorDaObraAtual = Boolean(
          userId &&
            autorIdObraAtual &&
            userId === autorIdObraAtual
        );
        const contrato = await carregarMetricasConteudos({
          obraIds: [obraAtual.id],
        });
        const metrica = contrato.obras.get(obraAtual.id);

        if (!contrato.carregado || !metrica) {
          return;
        }

        const minhaNotaRemota =
          userId && !usuarioEhAutorDaObraAtual
            ? metrica.avaliacao.minhaNota
            : 0;
        const minhaNota = usuarioEhAutorDaObraAtual ? 0 : minhaNotaRemota;
        const total = metrica.avaliacao.total;
        const media = metrica.avaliacao.media;

        if (
          cancelado ||
          avaliacaoVersaoRef.current !== versaoAoIniciar
        ) {
          return;
        }

        if (userId && !usuarioEhAutorDaObraAtual) {
          salvarAvaliacaoLocal(obraAtual, minhaNotaRemota, userId);
        }

        setAvaliacaoObra({
          media,
          total,
          minhaNota,
          carregado: true,
          salvando: false,
        });
      } catch (error) {
        console.warn("Não consegui carregar a avaliação da obra:", error);

        if (
          !cancelado &&
          avaliacaoVersaoRef.current === versaoAoIniciar
        ) {
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
  }, [
    obra,
    obraNormalizada,
    usuarioIdLogado,
  ]);

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

  async function obterIdentidadeLogadaParaAcao(mensagem: string) {
    const identidadeEsperada = identidadeAutenticadaObraRef.current;
    const execucaoAtual = () =>
      execucaoIdentidadeObraEstaAtual({
        cancelada: false,
        identidadeEsperada,
        identidadeAtual: identidadeAutenticadaObraRef.current,
      });

    try {
      const { data } = await supabase.auth.getUser();

      if (!execucaoAtual()) {
        return null;
      }

      const userId = data.user?.id || "";

      if (userId && userId === identidadeEsperada.usuarioId) {
        return identidadeEsperada;
      }

      if (!userId && !identidadeEsperada.usuarioId) {
        const loginHref = await criarLoginHrefObraPublica();

        if (execucaoAtual()) {
          setMensagemAcao(mensagem);
          router.push(loginHref);
        }
      }

      return null;
    } catch {
      if (!execucaoAtual()) {
        return null;
      }

      const loginHref = await criarLoginHrefObraPublica();

      if (execucaoAtual()) {
        setMensagemAcao(mensagem);
        router.push(loginHref);
      }

      return null;
    }
  }

  function criarGuardIdentidadeAcao(
    identidadeEsperada: IdentidadeAutenticadaObra,
  ) {
    return () =>
      execucaoIdentidadeObraEstaAtual({
        cancelada: false,
        identidadeEsperada,
        identidadeAtual: identidadeAutenticadaObraRef.current,
      });
  }

  async function alternarSeguirObra() {
    if (!obraNormalizada) {
      return;
    }

    const identidadeAcao = await obterIdentidadeLogadaParaAcao(
      "Entre na sua conta para seguir esta obra."
    );

    if (!identidadeAcao) {
      return;
    }

    const userId = identidadeAcao.usuarioId;
    const execucaoAcaoEstaAtual = criarGuardIdentidadeAcao(identidadeAcao);

    if (!execucaoAcaoEstaAtual()) {
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

      if (!execucaoAcaoEstaAtual()) {
        return;
      }

      if (seguindo) {
        const inserirResposta = await supabase.from("seguindo_obras").upsert(
          {
            obra_id: obraId,
            user_id: userId,
            visibilidade: "publico",
          },
          {
            onConflict: "user_id,obra_id",
            ignoreDuplicates: true,
          },
        );

        if (inserirResposta.error) {
          throw inserirResposta.error;
        }
      } else {
        const removerResposta = await supabase
          .from("seguindo_obras")
          .delete()
          .eq("obra_id", obraId)
          .eq("user_id", userId);

        if (removerResposta.error) {
          throw removerResposta.error;
        }
      }

      if (!execucaoAcaoEstaAtual()) {
        return;
      }

      if (seguindo) {
        await registrarAtividadeDiarioObra({
          userId,
          obra: obraAtual,
          tipo: "salvou_obra",
          visibilidade: "publico",
          texto: `Adicionou ${obraAtual.titulo} para acompanhar.`,
          execucaoAtual: execucaoAcaoEstaAtual,
        });
      } else {
        await removerAtividadeDiarioObra({
          userId,
          obra: obraAtual,
          tipo: "salvou_obra",
          execucaoAtual: execucaoAcaoEstaAtual,
        });
      }
    } catch (error) {
      console.warn("Não consegui salvar seguimento da obra no Supabase:", error);

      if (!execucaoAcaoEstaAtual()) {
        return;
      }

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

    const identidadeAcao = await obterIdentidadeLogadaParaAcao(
      "Entre na sua conta para curtir esta obra."
    );

    if (!identidadeAcao) {
      return;
    }

    const userId = identidadeAcao.usuarioId;
    const execucaoAcaoEstaAtual = criarGuardIdentidadeAcao(identidadeAcao);

    if (!execucaoAcaoEstaAtual()) {
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
        userId
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
        if (!execucaoAcaoEstaAtual()) {
          return;
        }

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
        proximaCurtidaAtiva,
        execucaoAcaoEstaAtual,
      );

      if (execucaoAcaoEstaAtual()) {
        setMensagemAcao("");
      }
    } catch {
      if (!execucaoAcaoEstaAtual()) {
        return;
      }

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

    const identidadeAcao = await obterIdentidadeLogadaParaAcao(
      respostaComentario
        ? "Entre na sua conta para responder este comentário."
        : "Entre na sua conta para comentar esta obra."
    );

    if (!identidadeAcao) {
      return;
    }

    const userId = identidadeAcao.usuarioId;
    const execucaoAcaoEstaAtual = criarGuardIdentidadeAcao(identidadeAcao);
    const respostaAnterior = respostaComentario;
    const textoFinal = textoDigitado.slice(0, 600);
    const perfil = await carregarPerfilPublicoObra(userId, "Você");

    if (!execucaoAcaoEstaAtual()) {
      return;
    }

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

    setComentariosObra((comentariosAtuais) => [
      comentarioTemporario,
      ...comentariosAtuais,
    ]);
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

      if (!execucaoAcaoEstaAtual()) {
        return;
      }

      const [comentarioSincronizado] = await normalizarComentariosObraSupabase([
        data,
      ]);

      if (!execucaoAcaoEstaAtual()) {
        return;
      }

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

      if (!comentarioSincronizado.comentarioPaiId) {
        setComentariosProximoOffset((offsetAtual) => offsetAtual + 1);
      }

      setComentarioStatus("");
    } catch {
      if (!execucaoAcaoEstaAtual()) {
        return;
      }

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
      if (execucaoAcaoEstaAtual()) {
        setComentarioEnviando(false);
      }
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

      if (!comentario.comentarioPaiId) {
        setComentariosProximoOffset((offsetAtual) =>
          Math.max(0, offsetAtual - 1),
        );
      }

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

    const identidadeAcao = await obterIdentidadeLogadaParaAcao(
      "Entre na sua conta para salvar esta obra."
    );

    if (!identidadeAcao) {
      return;
    }

    const userId = identidadeAcao.usuarioId;
    const execucaoAcaoEstaAtual = criarGuardIdentidadeAcao(identidadeAcao);

    if (!execucaoAcaoEstaAtual()) {
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

      if (!execucaoAcaoEstaAtual()) {
        return;
      }

      if (proximoFavorito) {
        await registrarAtividadeDiarioObra({
          userId,
          obra,
          tipo: "favoritou_obra",
          visibilidade: "parcial",
          texto: `Adicionou ${obra.titulo} à lista.`,
          execucaoAtual: execucaoAcaoEstaAtual,
        });
      } else {
        await removerAtividadeDiarioObra({
          userId,
          obra,
          tipo: "favoritou_obra",
          execucaoAtual: execucaoAcaoEstaAtual,
        });
      }

      if (!execucaoAcaoEstaAtual()) {
        return;
      }

      setMensagemAcao(
        proximoFavorito ? "" : "Obra removida da lista."
      );
    } catch (error) {
      console.warn("Não consegui salvar favorito da obra:", error);

      if (!execucaoAcaoEstaAtual()) {
        return;
      }

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

    const identidadeAcao = await obterIdentidadeLogadaParaAcao(
      "Entre na sua conta para marcar esta obra como concluída."
    );

    if (!identidadeAcao) {
      return;
    }

    const userId = identidadeAcao.usuarioId;
    const execucaoAcaoEstaAtual = criarGuardIdentidadeAcao(identidadeAcao);

    if (!execucaoAcaoEstaAtual()) {
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

      if (!execucaoAcaoEstaAtual()) {
        return;
      }

      if (proximaConcluida) {
        await registrarAtividadeDiarioObra({
          userId,
          obra,
          tipo: "concluiu_obra",
          visibilidade: "parcial",
          texto: `Concluiu ${obra.titulo}.`,
          execucaoAtual: execucaoAcaoEstaAtual,
        });
      } else {
        await removerAtividadeDiarioObra({
          userId,
          obra,
          tipo: "concluiu_obra",
          execucaoAtual: execucaoAcaoEstaAtual,
        });
      }

      if (!execucaoAcaoEstaAtual()) {
        return;
      }

      setMensagemAcao(
        proximaConcluida ? "Obra marcada como concluída." : "Obra removida das concluídas."
      );
    } catch (error) {
      console.warn("Não consegui salvar conclusão da obra:", error);

      if (!execucaoAcaoEstaAtual()) {
        return;
      }

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

    if (autorObraId && userId === autorObraId) {
      return;
    }

    const notaNormalizada = nota <= 0 ? 0 : Math.round(nota * 2) / 2;
    const avaliacaoAnterior = avaliacaoObra;
    const versaoAvaliacao = avaliacaoVersaoRef.current + 1;
    avaliacaoVersaoRef.current = versaoAvaliacao;

    const proximaAvaliacao = calcularProximaAvaliacao(
      avaliacaoAnterior,
      notaNormalizada
    );

    setAvaliacaoObra(proximaAvaliacao);
    setMensagemAcao("");
    salvarAvaliacaoLocal(obra, notaNormalizada, userId);

    if (!obra.id || !idObraSupabaseValido(obra.id)) {
      if (avaliacaoVersaoRef.current === versaoAvaliacao) {
        setAvaliacaoObra((avaliacaoAtual) => ({
          ...avaliacaoAtual,
          salvando: false,
        }));
      }
      return;
    }

    try {
      await salvarAvaliacaoRemotaObra({
        obraId: obra.id,
        userId,
        nota: notaNormalizada,
      });
    } catch (error) {
      console.warn("Não consegui salvar a avaliação da obra:", error);

      if (avaliacaoVersaoRef.current !== versaoAvaliacao) {
        return;
      }

      salvarAvaliacaoLocal(
        obra,
        avaliacaoAnterior.minhaNota,
        userId,
      );
      setAvaliacaoObra({
        ...avaliacaoAnterior,
        carregado: true,
        salvando: false,
      });
      setMensagemAcao("Não foi possível salvar a avaliação agora.");
      return;
    }

    if (avaliacaoVersaoRef.current !== versaoAvaliacao) {
      return;
    }

    setMensagemAcao("");

    try {
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
    } catch (error) {
      console.warn(
        "A avaliação foi salva, mas não consegui sincronizar o Diário:",
        error,
      );
    }

    if (avaliacaoVersaoRef.current !== versaoAvaliacao) {
      return;
    }

    setAvaliacaoObra((avaliacaoAtual) => ({
      ...avaliacaoAtual,
      salvando: false,
    }));
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

  const capituloPrincipalObra = obra
    ? encontrarCapituloParaContinuarObraPublica(obra)
    : null;
  const obraTemLeituraIniciada = Boolean(
    obra &&
      (obra.ultimoCapituloLidoId ||
        obra.progressoLeitura > 0 ||
        obra.capitulos.some((capitulo) => capitulo.lido)),
  );
  const rotuloLeituraPrincipal = obraTemLeituraIniciada
    ? "Continuar leitura"
    : "Começar a ler";
  const hrefPrincipalObra = obra
    ? capituloPrincipalObra?.href || obra.link || `/obra/${obra.slug}`
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


  function abrirPainelClassificacaoObra() {
    focoAntesClassificacaoRef.current = obterElementoComFocoAtual();
    setPainelClassificacaoAberto(true);
  }

  function fecharPainelClassificacaoObra() {
    const focoAnterior = focoAntesClassificacaoRef.current;
    focoAntesClassificacaoRef.current = null;
    setPainelClassificacaoAberto(false);
    restaurarFocoAnterior(focoAnterior);
  }

  function abrirAcoesObra() {
    focoAntesAcoesObraRef.current = obterElementoComFocoAtual();
    setAcoesObraAbertas(true);
  }

  function fecharAcoesObra(restaurarFoco = true) {
    const focoAnterior = focoAntesAcoesObraRef.current;
    focoAntesAcoesObraRef.current = null;
    setAcoesObraAbertas(false);

    if (restaurarFoco) {
      restaurarFocoAnterior(focoAnterior);
    }
  }

  function alternarAcoesObra() {
    if (acoesObraAbertas) {
      fecharAcoesObra();
      return;
    }

    abrirAcoesObra();
  }

  function abrirComentariosObra() {
    focoAntesComentariosRef.current = obterElementoComFocoAtual();
    setComentariosSheetExpandido(false);
    setMenuOrdenacaoComentariosAberto(false);
    setComentariosAbertos(true);
  }

  function fecharComentariosObra() {
    const focoAnterior = focoAntesComentariosRef.current;
    focoAntesComentariosRef.current = null;
    setComentariosAbertos(false);
    setComentariosSheetExpandido(false);
    setMenuOrdenacaoComentariosAberto(false);
    setRespostaComentario(null);
    comentariosDragOffsetYRef.current = 0;
    restaurarFocoAnterior(focoAnterior);
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

  function abrirDenunciaObraAtual() {
    if (!obra) {
      return;
    }

    fecharAcoesObra(false);
    setDenunciaAlvo({
      alvoTipo: "obra",
      alvoId: obra.id,
      alvoTitulo: obra.titulo,
    });
  }

  function abrirDenunciaComentarioObra(
    comentario: ComentarioObraPublico
  ) {
    setDenunciaAlvo({
      alvoTipo: "comentario_obra",
      alvoId: comentario.id,
      alvoTitulo: `Comentário de ${comentario.nome}`,
    });
  }

  async function carregarMaisComentariosObra() {
    if (
      !comentariosAbertos ||
      comentariosCarregando ||
      comentariosCarregandoMais ||
      !comentariosTemMais ||
      !obraIdComentarios ||
      !idObraSupabaseValido(obraIdComentarios)
    ) {
      return;
    }

    const versaoConsulta = comentariosConsultaVersaoRef.current;
    const identidadeEsperada = identidadeAutenticadaObraRef.current;
    const execucaoAtual = () =>
      comentariosConsultaVersaoRef.current === versaoConsulta &&
      execucaoIdentidadeObraEstaAtual({
        cancelada: false,
        identidadeEsperada,
        identidadeAtual: identidadeAutenticadaObraRef.current,
      });

    setComentariosCarregandoMais(true);
    setComentarioStatus("");

    try {
      const pagina = await carregarPaginaComentariosObraSupabase(
        obraIdComentarios,
        comentariosProximoOffset,
      );

      if (!execucaoAtual()) {
        return;
      }

      setComentariosObra((comentariosAtuais) => {
        const comentariosPorId = new Map(
          comentariosAtuais.map((comentario) => [comentario.id, comentario]),
        );

        pagina.comentarios.forEach((comentario) => {
          comentariosPorId.set(comentario.id, comentario);
        });

        return Array.from(comentariosPorId.values());
      });
      setComentariosTemMais(pagina.temMais);
      setComentariosProximoOffset(pagina.proximoOffset);
      setTotalComentariosObra((totalAtual) =>
        Math.max(totalAtual, pagina.proximoOffset),
      );
    } catch {
      if (execucaoAtual()) {
        setComentarioStatus(
          "Não foi possível carregar mais comentários agora.",
        );
      }
    } finally {
      if (execucaoAtual()) {
        setComentariosCarregandoMais(false);
      }
    }
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
            ) : !comentario.local ? (
              <button
                type="button"
                onClick={() => abrirDenunciaComentarioObra(comentario)}
                style={commentSheetRemoveButtonStyle}
              >
                Denunciar
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
                fill={usuarioCurtiu ? "var(--historietas-obra-heart, #FFFFFF)" : "none"}
                stroke={
                  usuarioCurtiu
                    ? "var(--historietas-obra-heart, #FFFFFF)"
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
              tabIndex={-1}
              onKeyDown={(event) =>
                manterFocoNoDialogo(event, fecharComentariosObra)
              }
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
                data-dialog-initial-focus="true"
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
                        role="menuitemradio"
                        aria-checked={ordenacaoComentarios === "relevantes"}
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
                        role="menuitemradio"
                        aria-checked={ordenacaoComentarios === "recentes"}
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
                  <>
                    {estruturaComentariosObra.comentariosRaiz.map((comentario) => {
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
                    })}
                    {comentariosTemMais ? (
                      <button
                        type="button"
                        onClick={() => void carregarMaisComentariosObra()}
                        disabled={comentariosCarregandoMais}
                        style={{
                          ...commentsLoadMoreStyle,
                          opacity: comentariosCarregandoMais ? 0.62 : 1,
                          cursor: comentariosCarregandoMais
                            ? "not-allowed"
                            : "pointer",
                        }}
                      >
                        {comentariosCarregandoMais
                          ? "Carregando..."
                          : "Carregar mais comentários"}
                      </button>
                    ) : null}
                  </>
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
                    aria-label={
                      usuarioIdLogado
                        ? "Adicionar comentário..."
                        : "Entre para comentar."
                    }
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

  const painelClassificacao =
    obra && painelClassificacaoAberto && typeof document !== "undefined"
      ? createPortal(
          <section
            data-historietas-obra-classificacao-root="true"
            style={classificationPanelOverlayStyle}
            aria-label={textosPainelClassificacao.titulo}
          >
            <button
              type="button"
              aria-label={textosPainelClassificacao.fechar}
              onClick={fecharPainelClassificacaoObra}
              style={classificationPanelBackdropStyle}
            />

            <article
              ref={classificacaoDialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="historietas-classificacao-title"
              tabIndex={-1}
              onKeyDown={(event) =>
                manterFocoNoDialogo(event, fecharPainelClassificacaoObra)
              }
              style={classificationPanelStyle}
            >
              <header style={classificationPanelHeaderStyle}>
                <span
                  data-historietas-i18n-ignore="true"
                  style={{
                    ...classificationPanelBadgeStyle,
                    ...(ehClassificacao18(obra.classificacaoIndicativa)
                      ? classificationPanelBadgeAdultStyle
                      : {}),
                  }}
                >
                  {obra.classificacaoIndicativa}
                </span>

                <button
                  type="button"
                  data-dialog-initial-focus="true"
                  onClick={fecharPainelClassificacaoObra}
                  aria-label={textosPainelClassificacao.fechar}
                  style={classificationPanelCloseStyle}
                >
                  ×
                </button>
              </header>

              <div style={classificationPanelContentStyle}>
                <div style={classificationPanelIntroStyle}>
                  <strong
                    id="historietas-classificacao-title"
                    style={classificationPanelTitleStyle}
                  >
                    {textosPainelClassificacao.titulo}
                  </strong>

                  <p style={classificationPanelDescriptionStyle}>
                    {textosPainelClassificacao.descricao}{" "}
                    <strong data-historietas-i18n-ignore="true">
                      {obra.classificacaoIndicativa}
                    </strong>
                    .
                  </p>
                </div>

                {ehClassificacao18(obra.classificacaoIndicativa) ? (
                  <section style={classificationWarningsStyle}>
                    <span style={classificationWarningsTitleStyle}>
                      {textosPainelClassificacao.avisos}
                    </span>

                    {obra.avisosConteudo.length > 0 ? (
                      <div style={classificationWarningsGridStyle}>
                        {obra.avisosConteudo.map((aviso) => (
                          <div key={aviso} style={classificationWarningItemStyle}>
                            <span
                              style={classificationWarningDotStyle}
                              aria-hidden="true"
                            />
                            <span>{traduzirAvisoConteudo18(aviso, language)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={classificationNoWarningsStyle}>
                        {textosPainelClassificacao.semAvisos}
                      </p>
                    )}
                  </section>
                ) : null}
              </div>
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
            {erroCarregamentoObra
              ? "Não foi possível carregar a obra agora."
              : "Obra não encontrada"}
          </p>
        </section>
      </main>
    );
  }

  if (
    ehClassificacao18(obra.classificacaoIndicativa) &&
    statusAcesso18 === "verificando"
  ) {
    return (
      <main data-historietas-obra-dinamica-root="true" style={pageThemeStyle} aria-busy="true">
        <style>{`${historietasThemeCss}${obraPageCss}`}</style>
        <LoadingSpinner label="Verificando acesso" />
      </main>
    );
  }

  if (
    ehClassificacao18(obra.classificacaoIndicativa) &&
    statusAcesso18 === "bloqueado"
  ) {
    return (
      <AdultContentGate
        titulo={obra.titulo}
        avisos={obra.avisosConteudo}
        language={language}
        onConfirmar={() =>
          setControleAcesso18({ obraId: obra.id, status: "permitido" })
        }
        onVoltar={() => {
          if (window.history.length > 1) {
            router.back();
          } else {
            router.replace("/explorar");
          }
        }}
      />
    );
  }

  const classificacaoIndicativaCompacta =
    obterClassificacaoIndicativaCompactaObra(obra.classificacaoIndicativa);

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
            <button
              type="button"
              onClick={abrirPainelClassificacaoObra}
              aria-label={`${textosPainelClassificacao.abrir}: ${obra.classificacaoIndicativa}`}
              title={`${textosPainelClassificacao.abrir}: ${obra.classificacaoIndicativa}`}
              style={{
                ...classificationTriggerStyle,
                ...(ehClassificacao18(obra.classificacaoIndicativa)
                  ? classificationTriggerAdultStyle
                  : {}),
              }}
            >
              <span
                data-historietas-i18n-ignore="true"
                style={
                  classificacaoIndicativaCompacta.livre
                    ? classificationTriggerTextLivreStyle
                    : classificationTriggerTextStyle
                }
              >
                {classificacaoIndicativaCompacta.texto}
              </span>
            </button>

            {isDesktop ? (
              <div style={desktopHeaderRightStyle}>
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
              aria-label={
                capituloPrincipalObra
                  ? `${rotuloLeituraPrincipal}: ${obra.titulo}`
                  : `Abrir ${obra.titulo}`
              }
            >
              <div
                style={isDesktop ? desktopCoverArtStyle : coverArtStyle}
                aria-hidden="true"
              >
                {obra.capa ? (
                  <Image
                    src={obra.capa}
                    alt=""
                    fill
                    sizes="(min-width: 1300px) 650px, (min-width: 1024px) 50vw, 100vw"
                    preload
                    unoptimized={!capaObraPodeSerOtimizada(obra.capa)}
                    style={{
                      objectFit: "cover",
                      objectPosition: isDesktop ? "center" : "center top",
                    }}
                  />
                ) : (
                  <strong style={coverTitleStyle}>
                    {obterIniciaisCapaObra(obra.titulo)}
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
              {isDesktop ? (
                <span style={desktopHeroKickerStyle}>Obra em destaque</span>
              ) : null}

              <h1
                data-historietas-i18n-ignore="true"
                className="historietas-theme-title"
                style={isDesktop ? desktopTitleStyle : titleStyle}
              >
                {obra.titulo}
              </h1>

              {isDesktop ? (
                <>
                  <div style={desktopHeroMetaStyle}>
                    <Link
                      href={criarLinkPerfilAutor(autorObraNome, autorObraId)}
                      style={desktopHeroAuthorStyle}
                      aria-label={`Abrir perfil do autor ${autorObraNome}`}
                      title={perfilAutorObra?.bio || undefined}
                    >
                      Por{" "}
                      <span data-historietas-i18n-ignore="true">
                        {autorObraNome}
                      </span>
                    </Link>

                    <span style={desktopHeroMetaDividerStyle} aria-hidden="true" />

                    <span style={desktopHeroMetaTextStyle}>
                      {generoObraFormatado}
                    </span>

                    <span style={desktopHeroMetaDividerStyle} aria-hidden="true" />

                    <span style={desktopHeroMetaTextStyle}>
                      {obra.classificacaoIndicativa}
                    </span>
                  </div>

                  <p
                    data-historietas-i18n-ignore="true"
                    style={desktopDescriptionStyle}
                  >
                    {obra.sinopse || "Nenhuma sinopse informada."}
                  </p>
                </>
              ) : null}

              <div
                style={
                  isDesktop ? desktopHeroBottomMetaBarStyle : heroBottomMetaBarStyle
                }
              >
                {!isDesktop ? (
                  <Link
                    href={criarLinkPerfilAutor(autorObraNome, autorObraId)}
                    style={heroBottomAuthorLinkStyle}
                    aria-label={`Abrir perfil do autor ${autorObraNome}`}
                    title={perfilAutorObra?.bio || undefined}
                  >
                    Por{" "}
                    <span data-historietas-i18n-ignore="true">
                      {autorObraNome}
                    </span>
                  </Link>
                ) : null}

                <div
                  style={isDesktop ? desktopHeroStatsStyle : heroBottomMetricsStyle}
                >
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
                {capituloPrincipalObra ? (
                  <Link
                    href={capituloPrincipalObra.href}
                    style={
                      isDesktop
                        ? desktopPrimaryReadingButtonStyle
                        : primaryReadingButtonStyle
                    }
                    aria-label={`${rotuloLeituraPrincipal}: ${obra.titulo}`}
                  >
                    {rotuloLeituraPrincipal}
                  </Link>
                ) : null}

                <button
                  type="button"
                  onClick={alternarSeguirObra}
                  style={
                    isDesktop
                      ? obraSeguida
                        ? desktopFollowedButtonStyle
                        : desktopSecondaryFollowButtonStyle
                      : obraSeguida
                        ? followedButtonStyle
                        : secondaryButtonStyle
                  }
                >
                  {obraSeguida ? "✓ Seguindo" : "Seguir obra"}
                </button>

                <button
                  type="button"
                  onClick={alternarAcoesObra}
                  style={isDesktop ? desktopObraAddButtonStyle : obraAddButtonStyle}
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
            onClick={() => fecharAcoesObra()}
          >
            <section
              ref={acoesObraDialogRef}
              style={isDesktop ? desktopObraActionsMenuStyle : obraActionsMenuStyle}
              role="dialog"
              aria-modal="true"
              aria-label={`Ações da obra ${obra.titulo}`}
              tabIndex={-1}
              onKeyDown={(event) =>
                manterFocoNoDialogo(event, () => fecharAcoesObra())
              }
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
                  data-dialog-initial-focus="true"
                  onClick={() => {
                    fecharAcoesObra();
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
                    fecharAcoesObra();
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

                {!(
                  usuarioIdLogado &&
                  autorObraId &&
                  usuarioIdLogado === autorObraId
                ) ? (
                  <button
                    type="button"
                    onClick={abrirDenunciaObraAtual}
                    style={obraMenuItemButtonStyle}
                  >
                    <span>Denunciar</span>
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={() => {
                    fecharAcoesObra();
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

              </div>
            </section>
          </div>
        )}

        {autenticacaoCarregada && !usuarioEhAutorDaObra ? (
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
        ) : null}

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
            numero={formatarNumeroCompacto(metricasObra.seguidores)}
            rotulo="seguidores"
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
            numero={
              <span
                aria-hidden="true"
                style={{
                  ...synopsisToggleIconStyle,
                  transform: sinopseAberta ? "rotate(180deg)" : "rotate(0deg)",
                }}
              >
                ⌄
              </span>
            }
            rotulo={sinopseAberta ? "Capítulos" : "Sinopse"}
            onClick={() => setSinopseAberta((aberta) => !aberta)}
            ariaLabel={sinopseAberta ? "Mostrar capítulos" : "Mostrar sinopse"}
            ariaExpanded={sinopseAberta}
          />
        </section>

        {sinopseAberta ? (
          <section id="sinopse" style={synopsisSectionStyle}>
            <div style={sectionHeaderStyle}>
              <h2 style={accentSectionTitleStyle}>SINOPSE</h2>
            </div>

            <div style={synopsisCardStyle}>
              <p
                data-historietas-i18n-ignore="true"
                style={synopsisTextStyle}
              >
                {sinopseObraExibida}
              </p>
            </div>
          </section>
        ) : (
          capitulosDaObra.length > 0 && (
            <section id="capitulos" style={chaptersSectionStyle}>
              <div style={sectionHeaderStyle}>
                <h2 style={accentSectionTitleStyle}>CAPÍTULOS</h2>

                <span style={chapterCountBadgeStyle}>
                  {obterTextoDisponibilidadeCapitulosObra(
                    capitulosDaObra.length,
                    obraDisponivel,
                  )}
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
          )
        )}


        {obra.arquivoObra && (
          <ArquivoObraPublico
            obraId={obra.id}
            arquivo={obra.arquivoObra}
            tituloObra={obra.titulo}
            isDesktop={isDesktop}
          />
        )}


      </section>
      </main>

      {painelComentariosObra}
      {painelClassificacao}

      <DenunciaModal
        aberto={Boolean(denunciaAlvo)}
        alvoTipo={denunciaAlvo?.alvoTipo || "obra"}
        alvoId={denunciaAlvo?.alvoId || ""}
        alvoTitulo={denunciaAlvo?.alvoTitulo || ""}
        onFechar={() => setDenunciaAlvo(null)}
      />
    </>
  );
}

function ArquivoObraPublico({
  obraId,
  arquivo,
  tituloObra,
  isDesktop,
}: {
  obraId: string;
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
    expiraEm: 0,
  });

  useEffect(() => {
    if (!caminhoStorageArquivo || arquivo.categoria !== "imagem") {
      return;
    }

    let cancelado = false;
    const controlador = new AbortController();

    async function prepararArquivoPrivado() {
      try {
        const url = await solicitarUrlTemporariaArquivoObra(
          obraId,
          controlador.signal,
        );

        if (!cancelado) {
          setArquivoAssinado({
            caminho: caminhoStorageArquivo,
            url,
            erro: "",
            expiraEm: Date.now() + DURACAO_UTIL_URL_ARQUIVO_OBRA_MS,
          });
        }
      } catch {
        if (!cancelado) {
          setArquivoAssinado({
            caminho: caminhoStorageArquivo,
            url: "",
            erro: "Não foi possível liberar este arquivo agora.",
            expiraEm: 0,
          });
        }
      }
    }

    void prepararArquivoPrivado();

    return () => {
      cancelado = true;
      controlador.abort();
    };
  }, [arquivo.categoria, caminhoStorageArquivo, obraId]);

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
    caminhoStorageArquivo &&
      arquivo.categoria === "imagem" &&
      !assinaturaAtual,
  );
  const podeTentarNovamente = Boolean(
    caminhoStorageArquivo && !arquivoCarregando && !arquivoHref,
  );
  const arquivoIndisponivel = Boolean(
    !arquivoHref && !podeTentarNovamente,
  );
  const arquivoHrefInterativo =
    arquivoHref || (podeTentarNovamente ? "#" : undefined);

  async function obterUrlArquivoAtual() {
    if (!caminhoStorageArquivo) {
      return arquivoConteudo;
    }

    if (
      assinaturaAtual &&
      arquivoAssinado.url &&
      arquivoAssinado.expiraEm > Date.now()
    ) {
      return arquivoAssinado.url;
    }

    try {
      const url = await solicitarUrlTemporariaArquivoObra(obraId);

      setArquivoAssinado({
        caminho: caminhoStorageArquivo,
        url,
        erro: "",
        expiraEm: Date.now() + DURACAO_UTIL_URL_ARQUIVO_OBRA_MS,
      });

      return url;
    } catch (error) {
      setArquivoAssinado({
        caminho: caminhoStorageArquivo,
        url: "",
        erro: "Não foi possível liberar este arquivo agora.",
        expiraEm: 0,
      });

      throw error;
    }
  }

  async function abrirArquivo(event: MouseEvent<HTMLAnchorElement>) {
    if (!caminhoStorageArquivo) {
      if (arquivoIndisponivel) {
        event.preventDefault();
      }

      return;
    }

    const assinaturaAindaValida = Boolean(
      assinaturaAtual &&
        arquivoAssinado.url &&
        arquivoAssinado.expiraEm > Date.now(),
    );

    if (assinaturaAindaValida) {
      return;
    }

    event.preventDefault();
    const novaJanela = window.open("about:blank", "_blank");

    if (novaJanela) {
      novaJanela.opener = null;
    }

    try {
      const url = await obterUrlArquivoAtual();

      if (novaJanela) {
        novaJanela.location.replace(url);
      } else {
        window.location.assign(url);
      }
    } catch {
      novaJanela?.close();
    }
  }

  async function baixarArquivo() {
    if (arquivoIndisponivel) {
      return;
    }

    const urlArquivo = await obterUrlArquivoAtual().catch(() => "");

    if (!urlArquivo) {
      return;
    }

    try {
      const resposta = await fetch(urlArquivo);

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

      linkDownload.href = urlArquivo;
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
          href={arquivoHrefInterativo}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            ...filePreviewLinkStyle,
            opacity: arquivoIndisponivel ? 0.56 : 1,
            pointerEvents: arquivoIndisponivel ? "none" : "auto",
          }}
          aria-label={`Abrir arquivo ${arquivo.nome}`}
          aria-disabled={arquivoIndisponivel}
          onClick={abrirArquivo}
        >
          {arquivo.categoria === "imagem" && arquivoHref ? (
            <Image
              src={arquivoHref}
              alt={`Prévia do arquivo ${arquivo.nome}`}
              width={74}
              height={74}
              unoptimized
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
                color: "var(--historietas-obra-danger, #FFFFFF)",
              }}
            >
              {arquivoErro}
            </span>
          ) : null}

          <div style={isDesktop ? desktopFileActionsStyle : fileActionsStyle}>
            <a
              href={arquivoHrefInterativo}
              target="_blank"
              rel="noopener noreferrer"
              aria-disabled={arquivoIndisponivel}
              onClick={abrirArquivo}
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
                "Tentar novamente"
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

const classificationPanelOverlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 1300,
  display: "grid",
  placeItems: "center",
  padding: "20px",
};

const classificationPanelBackdropStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  border: 0,
  background: "rgba(2, 0, 6, 0.72)",
  backdropFilter: "blur(4px)",
  WebkitBackdropFilter: "blur(4px)",
  cursor: "pointer",
};

const classificationPanelStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: "min(100%, 360px)",
  overflow: "hidden",
  borderRadius: "22px",
  border: "1px solid var(--historietas-obra-secondary-42, rgba(124, 58, 237, 0.42))",
  background: "var(--historietas-obra-bg-deep-98, rgba(4, 0, 10, 0.98))",
  boxShadow:
    "0 24px 70px rgba(0, 0, 0, 0.62), 0 0 24px var(--historietas-obra-secondary-12, rgba(124, 58, 237, 0.12))",
  color: "var(--historietas-text-primary, #FFFFFF)",
};

const classificationPanelHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  padding: "14px 14px 0",
};

const classificationPanelBadgeStyle: CSSProperties = {
  minWidth: "40px",
  height: "34px",
  padding: "0 10px",
  borderRadius: "12px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: "1px solid var(--historietas-obra-secondary-72, rgba(124, 58, 237, 0.72))",
  background: "var(--historietas-obra-bg-deep-96, rgba(4, 0, 10, 0.96))",
  color: "#FFFFFF",
  fontSize: "13px",
  fontWeight: 950,
  lineHeight: 1,
  boxSizing: "border-box",
};

const classificationPanelBadgeAdultStyle: CSSProperties = {
  borderColor: "rgba(248, 86, 110, 0.9)",
  background: "rgba(34, 3, 10, 0.96)",
  color: "#FFF5F6",
  boxShadow:
    "0 0 0 1px rgba(120, 15, 32, 0.55), 0 0 18px rgba(244, 63, 94, 0.38)",
};

const classificationPanelCloseStyle: CSSProperties = {
  width: "34px",
  height: "34px",
  borderRadius: "12px",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  background: "rgba(255, 255, 255, 0.035)",
  color: "#FFFFFF",
  display: "grid",
  placeItems: "center",
  fontFamily: "inherit",
  fontSize: "24px",
  lineHeight: 1,
  cursor: "pointer",
};

const classificationPanelContentStyle: CSSProperties = {
  display: "grid",
  gap: "14px",
  padding: "14px 16px 18px",
};

const classificationPanelIntroStyle: CSSProperties = {
  display: "grid",
  gap: "6px",
};

const classificationPanelTitleStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "17px",
  fontWeight: 950,
  letterSpacing: "-0.02em",
};

const classificationPanelDescriptionStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "12px",
  fontWeight: 700,
  lineHeight: 1.55,
};

const classificationWarningsStyle: CSSProperties = {
  display: "grid",
  gap: "9px",
  paddingTop: "12px",
  borderTop: "1px solid rgba(255, 255, 255, 0.08)",
};

const classificationWarningsTitleStyle: CSSProperties = {
  color: "var(--historietas-obra-logo-mid, #FFFFFF)",
  fontSize: "10px",
  fontWeight: 950,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const classificationWarningsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(138px, 1fr))",
  gap: "7px",
};

const classificationWarningItemStyle: CSSProperties = {
  minWidth: 0,
  display: "flex",
  alignItems: "flex-start",
  gap: "8px",
  padding: "9px 10px",
  borderRadius: "13px",
  border: "1px solid rgba(255, 255, 255, 0.07)",
  background: "rgba(255, 255, 255, 0.035)",
  color: "#F5F3F7",
  fontSize: "11px",
  fontWeight: 750,
  lineHeight: 1.35,
};

const classificationWarningDotStyle: CSSProperties = {
  width: "6px",
  height: "6px",
  marginTop: "4px",
  borderRadius: "50%",
  background: "#FFFFFF",
  boxShadow: "0 0 8px rgba(244, 63, 94, 0.55)",
  flex: "0 0 auto",
};

const classificationNoWarningsStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11px",
  fontWeight: 700,
  lineHeight: 1.5,
};

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

  @keyframes historietas-synopsis-reveal {
    from {
      opacity: 0;
      transform: translateY(6px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  html {
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





`;

const pageStyle: CSSProperties = {
  position: "relative",
  minHeight: "100vh",
  width: "100%",
  maxWidth: "100vw",
  overflowX: "clip",
  boxSizing: "border-box",
  background: "var(--historietas-bg-start, #000000)",
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

const classificationTriggerStyle: CSSProperties = {
  width: "34px",
  minWidth: "34px",
  height: "34px",
  padding: 0,
  borderRadius: "12px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  transform: "translate(4px, -5px)",
  border: "1px solid var(--historietas-obra-secondary-72, rgba(124, 58, 237, 0.72))",
  background: "var(--historietas-obra-bg-deep-96, rgba(4, 0, 10, 0.96))",
  color: "#FFFFFF",
  fontFamily: "inherit",
  fontWeight: 950,
  lineHeight: 1,
  flex: "0 0 auto",
  boxSizing: "border-box",
  cursor: "pointer",
  overflow: "hidden",
  boxShadow:
    "0 0 0 1px var(--historietas-obra-purple-48, rgba(59, 7, 100, 0.48)), 0 0 14px var(--historietas-obra-secondary-22, rgba(124, 58, 237, 0.22))",
  ...safeTextStyle,
};

const classificationTriggerTextStyle: CSSProperties = {
  fontSize: "11px",
  fontWeight: 950,
  lineHeight: 1,
  letterSpacing: "-0.03em",
};

const classificationTriggerTextLivreStyle: CSSProperties = {
  ...classificationTriggerTextStyle,
  fontSize: "19px",
  letterSpacing: 0,
};

const classificationTriggerAdultStyle: CSSProperties = {
  borderColor: "rgba(248, 86, 110, 0.92)",
  background: "rgba(34, 3, 10, 0.96)",
  color: "#FFF5F6",
  boxShadow:
    "0 0 0 1px rgba(120, 15, 32, 0.62), 0 0 16px rgba(244, 63, 94, 0.44)",
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
  backgroundImage: "linear-gradient(145deg, var(--historietas-obra-surface, #050505) 0%, var(--historietas-obra-bg-deep, #000000) 58%, var(--historietas-obra-bg-deeper, #000000) 100%)",
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
  ...homeMainTitleTypographyStyle,
  ...heroTitleOutlineStyle,
  ...safeTextStyle,
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "clamp(36px, 9.6vw, 58px)",
  lineHeight: 0.94,
  ...homeMainTitleTypographyStyle,
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
  ...homeMainMetaTypographyStyle,
  lineHeight: 1.35,
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
  gap: "10px 12px",
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
  ...homeMainMetaTypographyStyle,
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
  ...homeMainStatsTypographyStyle,
  whiteSpace: "nowrap",
  textShadow: "0 1px 0 rgba(0,0,0,0.28)",
  ...safeTextStyle,
};


const primaryReadingButtonStyle: CSSProperties = {
  minHeight: "50px",
  gridColumn: "1 / -1",
  borderRadius: "999px",
  border: "1px solid #FFFFFF",
  background: "#FFFFFF",
  color: "#08080A",
  textDecoration: "none",
  fontSize: "14px",
  fontWeight: 900,
  fontFamily: "inherit",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 22px",
  boxSizing: "border-box",
  boxShadow: "0 10px 28px rgba(0,0,0,0.28)",
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
  background: "var(--historietas-obra-bg-deep, #000000)",
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
  background: "var(--historietas-surface-strong, #0A0A0A)",
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
  background: "#000000",
  border: "none",
  boxShadow: "0 -18px 50px rgba(0,0,0,0.38)",
  padding: "8px 0 calc(12px + env(safe-area-inset-bottom))",
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

const synopsisToggleIconStyle: CSSProperties = {
  display: "inline-block",
  fontSize: "clamp(22px, 5.6vw, 28px)",
  lineHeight: 0.72,
  transformOrigin: "center",
  transition: "transform 220ms ease",
};


const statsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "6px",
  marginTop: "8px",
  minWidth: 0,
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
  background: "var(--historietas-obra-bg-deep, #000000)",
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
  outlineOffset: "3px",
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

const commentsLoadMoreStyle: CSSProperties = {
  width: "fit-content",
  minHeight: "36px",
  justifySelf: "center",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.14))",
  borderRadius: "999px",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.06))",
  color: "var(--historietas-text-primary, #FFFFFF)",
  padding: "7px 14px",
  fontSize: "11px",
  fontWeight: 900,
  fontFamily: "inherit",
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
  background: "var(--historietas-obra-bg-deep, #000000)",
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
  color: "var(--historietas-danger-button-text, #FFFFFF)",
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
  background: "var(--historietas-obra-bg-deep, #000000)",
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
  background: "var(--historietas-obra-bg-deep, #000000)",
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
    "linear-gradient(135deg, var(--historietas-obra-surface, #050505) 0%, var(--historietas-obra-bg-deep, #000000) 58%, var(--historietas-obra-bg-deeper, #000000) 100%)",
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
    "linear-gradient(135deg, var(--historietas-accent, #FFFFFF) 0%, var(--historietas-secondary, #A1A1AA) 100%)",
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
  color: "var(--historietas-obra-rating, #FFFFFF)",
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
  color: "var(--historietas-obra-rating, #FFFFFF)",
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
  margin: "-4px 0 0",
  overflow: "visible",
  borderRadius: 0,
  border: "none",
  background: "transparent",
  boxShadow: "none",
};

const desktopHeroContentStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: "100%",
  display: "grid",
  gridTemplateColumns: "minmax(340px, 1.03fr) minmax(0, 0.97fr)",
  alignItems: "center",
  gap: "clamp(34px, 4.5vw, 78px)",
  minHeight: "clamp(440px, 40vw, 590px)",
  padding: "clamp(18px, 2vw, 32px) 0",
  overflow: "visible",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const desktopCoverArtStyle: CSSProperties = {
  ...coverArtStyle,
  width: "100%",
  height: "100%",
  minHeight: 0,
  borderRadius: "22px",
  backgroundPosition: "center",
  border: "1px solid rgba(255,255,255,0.06)",
  boxShadow: "none",
};

const desktopHeroCoverLinkStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  gridColumn: "1",
  width: "100%",
  maxWidth: "650px",
  height: "clamp(400px, 35vw, 530px)",
  minHeight: "400px",
  justifySelf: "start",
  display: "block",
  padding: "5px",
  borderRadius: "28px",
  overflow: "hidden",
  border: "1px solid rgba(255,255,255,0.08)",
  background:
    "linear-gradient(145deg, #050505 0%, #000000 58%, #000000 100%)",
  boxShadow:
    "0 24px 64px rgba(0,0,0,0.26), inset 0 0 0 1px rgba(255,255,255,0.025)",
  color: "inherit",
  textDecoration: "none",
  boxSizing: "border-box",
};

const desktopHeroOverlayContentStyle: CSSProperties = {
  position: "relative",
  zIndex: 3,
  gridColumn: "2",
  width: "100%",
  maxWidth: "650px",
  minWidth: 0,
  justifySelf: "center",
  alignSelf: "stretch",
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  justifyContent: "center",
  gap: "15px",
  padding: "clamp(8px, 1vw, 18px) clamp(12px, 1.5vw, 28px)",
  textAlign: "left",
  background: "transparent",
  boxSizing: "border-box",
};

const desktopHeroBottomMetaBarStyle: CSSProperties = {
  position: "relative",
  zIndex: 3,
  order: 6,
  width: "100%",
  maxWidth: "100%",
  marginTop: "3px",
  padding: 0,
  borderRadius: 0,
  border: "none",
  background: "transparent",
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: "22px",
  minWidth: 0,
  boxSizing: "border-box",
  transform: "none",
};

const desktopTitleStyle: CSSProperties = {
  ...titleStyle,
  width: "100%",
  maxWidth: "700px",
  margin: 0,
  fontSize: "clamp(46px, 5.2vw, 78px)",
  lineHeight: 0.98,
  textAlign: "left",
  color: "#FFFFFF",
  textShadow:
    "0 2px 0 rgba(0,0,0,0.40), 0 8px 28px rgba(0,0,0,0.62)",
  transform: "none",
};

const desktopDescriptionStyle: CSSProperties = {
  ...descriptionStyle,
  width: "100%",
  maxWidth: "620px",
  minHeight: 0,
  margin: 0,
  color: "#D5D5D8",
  WebkitTextFillColor: "#D5D5D8",
  fontSize: "15.5px",
  lineHeight: 1.58,
  display: "-webkit-box",
  WebkitLineClamp: 4,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  overflowWrap: "anywhere",
  wordBreak: "break-word",
  textAlign: "left",
  textShadow: "0 2px 14px rgba(0,0,0,0.74)",
  transform: "none",
};

const desktopHeroKickerStyle: CSSProperties = {
  color: "#D7D7DA",
  fontSize: "12px",
  fontWeight: 800,
  lineHeight: 1,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  textShadow: "0 2px 12px rgba(0,0,0,0.70)",
};

const desktopHeroMetaStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  flexWrap: "wrap",
  maxWidth: "100%",
  minWidth: 0,
  color: "#D2D2D5",
  fontSize: "13.5px",
  fontWeight: 650,
  lineHeight: 1.25,
};

const desktopHeroAuthorStyle: CSSProperties = {
  color: "#FFFFFF",
  fontWeight: 750,
  textDecoration: "none",
  textShadow: "0 2px 12px rgba(0,0,0,0.62)",
  ...safeTextStyle,
};

const desktopHeroMetaDividerStyle: CSSProperties = {
  width: "4px",
  height: "4px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.50)",
  flex: "0 0 auto",
};

const desktopHeroMetaTextStyle: CSSProperties = {
  color: "#D2D2D5",
  fontSize: "13.5px",
  fontWeight: 650,
  lineHeight: 1.25,
  textShadow: "0 2px 12px rgba(0,0,0,0.62)",
  ...safeTextStyle,
};

const desktopHeroStatsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: "22px",
  color: "#E4E4E7",
  fontSize: "12.5px",
  fontWeight: 750,
  width: "auto",
  maxWidth: "100%",
  minWidth: 0,
  flexWrap: "wrap",
};

const desktopPrimaryReadingButtonStyle: CSSProperties = {
  minWidth: "176px",
  minHeight: "50px",
  padding: "0 22px",
  borderRadius: "10px",
  border: "1px solid #FFFFFF",
  background: "#FFFFFF",
  color: "#08080A",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: "inherit",
  fontSize: "14px",
  fontWeight: 900,
  lineHeight: 1.1,
  textAlign: "center",
  boxSizing: "border-box",
  boxShadow: "0 10px 28px rgba(0,0,0,0.28)",
  cursor: "pointer",
  ...safeTextStyle,
};

const desktopSecondaryFollowButtonStyle: CSSProperties = {
  minWidth: "154px",
  minHeight: "50px",
  padding: "0 22px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.34)",
  background: "rgba(10,10,12,0.74)",
  color: "#FFFFFF",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: "inherit",
  fontSize: "14px",
  fontWeight: 850,
  lineHeight: 1.1,
  textAlign: "center",
  boxSizing: "border-box",
  boxShadow: "none",
  cursor: "pointer",
  ...safeTextStyle,
};

const desktopFollowedButtonStyle: CSSProperties = {
  ...desktopSecondaryFollowButtonStyle,
};

const desktopObraAddButtonStyle: CSSProperties = {
  ...desktopFollowedButtonStyle,
  minWidth: "50px",
  width: "50px",
  height: "50px",
  padding: 0,
  fontSize: "26px",
  lineHeight: 1,
};

const desktopHeroActionsStyle: CSSProperties = {
  order: 5,
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: "10px",
  width: "auto",
  maxWidth: "100%",
  minWidth: 0,
  marginTop: "5px",
  boxSizing: "border-box",
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
