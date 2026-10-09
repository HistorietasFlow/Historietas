import type { HistorietasLanguage } from "../../../lib/i18n";

export type PainelAutorTranslationEntry = {
  en: string;
  es: string;
};

export const PAINEL_AUTOR_UI_TRANSLATIONS: Record<
  string,
  PainelAutorTranslationEntry
> = {
  "Todas as obras": { en: "All works", es: "Todas las obras" },
  "Publicadas": { en: "Published", es: "Publicadas" },
  "Rascunhos": { en: "Drafts", es: "Borradores" },
  "Sem capítulos": { en: "Without chapters", es: "Sin capítulos" },
  "Na lista": { en: "In the list", es: "En la lista" },
  "Concluídas": { en: "Completed", es: "Completadas" },
  "Em leitura": { en: "Currently reading", es: "En lectura" },
  "Melhor desempenho": { en: "Best performance", es: "Mejor rendimiento" },
  "Mais recentes": { en: "Most recent", es: "Más recientes" },
  "Título": { en: "Title", es: "Título" },
  "Mais capítulos": { en: "Most chapters", es: "Más capítulos" },
  "Maior progresso": { en: "Most progress", es: "Mayor progreso" },
  "Publicado": { en: "Published", es: "Publicado" },
  "Sem conteúdo": { en: "No content", es: "Sin contenido" },
  "Rascunho": { en: "Draft", es: "Borrador" },
  "Não informado": { en: "Not provided", es: "No informado" },
  "Não informada": { en: "Not provided", es: "No informada" },
  "Nenhuma sinopse informada.": { en: "No synopsis provided.", es: "No se proporcionó una sinopsis." },
  "Obra sem título": { en: "Untitled work", es: "Obra sin título" },
  "Autor não informado": { en: "Author not provided", es: "Autor no informado" },
  "Capítulo sem título": { en: "Untitled chapter", es: "Capítulo sin título" },
  "sem tags": { en: "no tags", es: "sin etiquetas" },
  "Arquivo da obra": { en: "Work file", es: "Archivo de la obra" },
  "Carregando": { en: "Loading", es: "Cargando" },
  "Carregando Painel do Autor": { en: "Loading Author Dashboard", es: "Cargando el Panel del Autor" },
  "Abrir painel do autor": { en: "Open author dashboard", es: "Abrir el panel del autor" },
  "Painel do autor": { en: "Author dashboard", es: "Panel del autor" },
  "Buscar obra...": { en: "Search works...", es: "Buscar obras..." },
  "Fechar busca": { en: "Close search", es: "Cerrar búsqueda" },
  "Abrir busca": { en: "Open search", es: "Abrir búsqueda" },
  "obra": { en: "work", es: "obra" },
  "obras": { en: "works", es: "obras" },
  "publicada": { en: "published", es: "publicada" },
  "publicadas": { en: "published", es: "publicadas" },
  "rascunho": { en: "draft", es: "borrador" },
  "rascunhos": { en: "drafts", es: "borradores" },
  "capítulo": { en: "chapter", es: "capítulo" },
  "capítulos": { en: "chapters", es: "capítulos" },
  "curtida": { en: "like", es: "me gusta" },
  "curtidas": { en: "likes", es: "me gusta" },
  "comentário": { en: "comment", es: "comentario" },
  "comentários": { en: "comments", es: "comentarios" },
  "salvo": { en: "saved", es: "guardado" },
  "salvos": { en: "saved", es: "guardados" },
  "arquivo": { en: "file", es: "archivo" },
  "arquivos": { en: "files", es: "archivos" },
  "Limpar filtros": { en: "Clear filters", es: "Limpiar filtros" },
  "Filtros": { en: "Filters", es: "Filtros" },
  "MOSTRAR": { en: "SHOW", es: "MOSTRAR" },
  "ORDENAR": { en: "SORT", es: "ORDENAR" },
  "RESUMO": { en: "SUMMARY", es: "RESUMEN" },
  "Mostrar os 8 mini cards": { en: "Show the 8 summary cards", es: "Mostrar las 8 tarjetas de resumen" },
  "Não tem obra criada": { en: "No works have been created", es: "No hay obras creadas" },
  "Nenhuma obra encontrada": { en: "No works found", es: "No se encontraron obras" },
  "Ajuste a busca ou limpe os filtros para voltar a ver suas obras.": { en: "Adjust your search or clear the filters to see your works again.", es: "Ajusta la búsqueda o limpia los filtros para volver a ver tus obras." },
  "Por": { en: "By", es: "Por" },
  "Editar capítulo": { en: "Edit chapter", es: "Editar capítulo" },
  "Continuar leitura": { en: "Continue reading", es: "Continuar leyendo" },
  "Ler capítulo": { en: "Read chapter", es: "Leer capítulo" },
  "Editar obra": { en: "Edit work", es: "Editar obra" },
  "Adicionar capítulo": { en: "Add chapter", es: "Añadir capítulo" },
  "Ver arquivo": { en: "View file", es: "Ver archivo" },
  "Compartilhar": { en: "Share", es: "Compartir" },
  "Excluir": { en: "Delete", es: "Eliminar" },
  "Esta obra não possui arquivo disponível.": { en: "This work does not have an available file.", es: "Esta obra no tiene un archivo disponible." },
  "Não consegui criar um acesso temporário ao arquivo da obra.": { en: "I could not create temporary access to the work file.", es: "No se pudo crear un acceso temporal al archivo de la obra." },
  "Não consegui abrir o arquivo da obra agora.": { en: "I could not open the work file right now.", es: "No se pudo abrir el archivo de la obra en este momento." },
  "Você não tem permissão para excluir esta obra.": { en: "You do not have permission to delete this work.", es: "No tienes permiso para eliminar esta obra." },
  "A exclusão da obra não foi confirmada pelo banco de dados.": { en: "The database did not confirm that the work was deleted.", es: "La base de datos no confirmó la eliminación de la obra." },
  "Não consegui excluir a obra agora.": { en: "I could not delete the work right now.", es: "No se pudo eliminar la obra en este momento." },
  "Ação": { en: "Action", es: "Acción" },
  "Aventura": { en: "Adventure", es: "Aventura" },
  "Comédia": { en: "Comedy", es: "Comedia" },
  "Drama": { en: "Drama", es: "Drama" },
  "Fantasia": { en: "Fantasy", es: "Fantasía" },
  "Fantasia sombria": { en: "Dark fantasy", es: "Fantasía oscura" },
  "Ficção": { en: "Fiction", es: "Ficción" },
  "Mistério": { en: "Mystery", es: "Misterio" },
  "Romance": { en: "Romance", es: "Romance" },
  "Suspense": { en: "Thriller", es: "Suspenso" },
  "Terror": { en: "Horror", es: "Terror" },
  "Sobrenatural": { en: "Supernatural", es: "Sobrenatural" },
  "Histórico": { en: "Historical", es: "Histórico" },
  "Biografia": { en: "Biography", es: "Biografía" },
  "Sci-fi": { en: "Sci-fi", es: "Ciencia ficción" },
  "Webnovel": { en: "Web novel", es: "Novela web" },
  "Light novel": { en: "Light novel", es: "Novela ligera" },
  "Conto": { en: "Short story", es: "Cuento" },
  "Poesia": { en: "Poetry", es: "Poesía" },
  "HQ": { en: "Comic", es: "Cómic" },
  "Mangá": { en: "Manga", es: "Manga" },
  "Fanfic": { en: "Fanfiction", es: "Fanfic" },
  "Livre": { en: "All ages", es: "Todo público" },
};

export function traduzirTextoPainelAutor(
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
  const traducaoExata = PAINEL_AUTOR_UI_TRANSLATIONS[conteudo];

  if (traducaoExata) {
    return `${inicio}${traducaoExata[idioma]}${fim}`;
  }

  let correspondencia = /^Abrir opções de (.+)$/.exec(conteudo);
  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Open options for ${correspondencia[1]}${fim}`
      : `${inicio}Abrir opciones de ${correspondencia[1]}${fim}`;
  }

  correspondencia = /^Ações de (.+)$/.exec(conteudo);
  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Actions for ${correspondencia[1]}${fim}`
      : `${inicio}Acciones de ${correspondencia[1]}${fim}`;
  }

  correspondencia = /^Abrir (.+)$/.exec(conteudo);
  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Open ${correspondencia[1]}${fim}`
      : `${inicio}Abrir ${correspondencia[1]}${fim}`;
  }

  correspondencia = /^Capítulo (\d+)$/.exec(conteudo);
  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Chapter ${correspondencia[1]}${fim}`
      : `${inicio}Capítulo ${correspondencia[1]}${fim}`;
  }

  correspondencia = /^(\d+) comentários$/.exec(conteudo);
  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}${correspondencia[1]} comments${fim}`
      : `${inicio}${correspondencia[1]} comentarios${fim}`;
  }

  correspondencia = /^(.+) no HISTORIETAS$/.exec(conteudo);
  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}${correspondencia[1]} on HISTORIETAS${fim}`
      : `${inicio}${correspondencia[1]} en HISTORIETAS${fim}`;
  }

  correspondencia = /^Confira a obra (.+) de (.+) no HISTORIETAS\.$/.exec(conteudo);
  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Check out ${correspondencia[1]} by ${correspondencia[2]} on HISTORIETAS.${fim}`
      : `${inicio}Descubre la obra ${correspondencia[1]} de ${correspondencia[2]} en HISTORIETAS.${fim}`;
  }

  correspondencia = /^Tem certeza que deseja excluir a obra "([\s\S]+)"\? Todos os capítulos e registros dessa obra serão removidos\. Essa ação não pode ser desfeita\.$/.exec(conteudo);
  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Are you sure you want to delete the work "${correspondencia[1]}"? All chapters and records for this work will be removed. This action cannot be undone.${fim}`
      : `${inicio}¿Seguro que quieres eliminar la obra "${correspondencia[1]}"? Se eliminarán todos los capítulos y registros de esta obra. Esta acción no se puede deshacer.${fim}`;
  }

  correspondencia = /^Não consegui confirmar sua permissão para excluir esta obra: ([\s\S]+)$/.exec(conteudo);
  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}I could not confirm your permission to delete this work: ${correspondencia[1]}${fim}`
      : `${inicio}No se pudo confirmar tu permiso para eliminar esta obra: ${correspondencia[1]}${fim}`;
  }

  correspondencia = /^Não consegui excluir os capítulos da obra: ([\s\S]+)$/.exec(conteudo);
  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}I could not delete the work's chapters: ${correspondencia[1]}${fim}`
      : `${inicio}No se pudieron eliminar los capítulos de la obra: ${correspondencia[1]}${fim}`;
  }

  correspondencia = /^Não consegui concluir a exclusão da obra: ([\s\S]+)$/.exec(conteudo);
  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}I could not finish deleting the work: ${correspondencia[1]}${fim}`
      : `${inicio}No se pudo completar la eliminación de la obra: ${correspondencia[1]}${fim}`;
  }

  return texto;
}
