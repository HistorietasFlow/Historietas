import { normalizarTexto } from "../../../../lib/utils";

export function formatarGeneroObraPublica(genero: string) {
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

export function obterTextoPerfilObra(
  registro: Record<string, unknown>,
  chave: string,
) {
  const valor = registro[chave];

  return typeof valor === "string" && valor.trim() ? valor.trim() : "";
}

export function obterNomePerfilObra(
  profile: Record<string, unknown> | null,
  fallback: string,
) {
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

export function obterAvatarPerfilObra(
  profile: Record<string, unknown> | null,
) {
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

export function obterBioPerfilObra(
  profile: Record<string, unknown> | null,
) {
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

export function normalizarPerfilPublicoObra(
  profile: Record<string, unknown> | null,
  userIdFallback: string,
  nomeFallback: string
) {
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

export function obterSinopseObraExibida(
  obra: { sinopse: string } | null,
) {
  return obra && obra.sinopse.trim()
    ? obra.sinopse.trim()
    : "Nenhuma sinopse informada.";
}

export function obterNomeAutorObraExibido(
  perfilAutor: { nome?: string } | null,
  obra: { autor?: string } | null,
) {
  return perfilAutor?.nome || obra?.autor || "Autor não informado";
}

export function obterGeneroObraExibido(
  obra: { genero: string } | null,
) {
  return obra ? formatarGeneroObraPublica(obra.genero) : "Não informado";
}

export function obterTextosPainelClassificacaoObra(language: string) {
  return language === "en"
    ? {
        titulo: "Age rating",
        descricao: "This work is rated",
        avisos: "Content warnings",
        semAvisos: "No additional content warnings were provided.",
        fechar: "Close age rating",
        abrir: "View age rating",
      }
    : language === "es"
      ? {
          titulo: "Clasificación por edad",
          descricao: "Esta obra está clasificada como",
          avisos: "Advertencias de contenido",
          semAvisos: "No se indicaron advertencias de contenido adicionales.",
          fechar: "Cerrar clasificación por edad",
          abrir: "Ver clasificación por edad",
        }
      : {
          titulo: "Classificação indicativa",
          descricao: "Esta obra é classificada como",
          avisos: "Avisos de conteúdo",
          semAvisos: "Nenhum aviso adicional foi informado.",
          fechar: "Fechar classificação indicativa",
          abrir: "Ver classificação indicativa",
        };
}

export function obterClassificacaoIndicativaCompactaObra(
  classificacaoIndicativa: string,
) {
  const livre = normalizarTexto(classificacaoIndicativa) === "livre";

  return {
    livre,
    texto: livre ? "L" : classificacaoIndicativa,
  };
}

export type PerfilPublicoObra = {
  userId: string;
  nome: string;
  avatar: string;
  bio: string;
};

export type TraducaoObraDinamica = {
  en: string;
  es: string;
};

export const OBRA_DINAMICA_UI_TRANSLATIONS: Record<string, TraducaoObraDinamica> = {
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

export type EstadoTraducaoObraDinamica = {
  original: string;
  traduzido: string;
};
