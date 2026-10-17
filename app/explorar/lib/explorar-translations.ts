import type { HistorietasLanguage } from "../../../lib/i18n";
import { normalizarTexto } from "../../../lib/utils";

type ExplorarTranslationEntry = {
  en: string;
  es: string;
};

const EXPLORAR_UI_TRANSLATIONS: Record<string, ExplorarTranslationEntry> = {
  "Carregando": { en: "Loading", es: "Cargando" },
  "Carregar mais": { en: "Load more", es: "Cargar más" },
  "Carregando Explorar": { en: "Loading Explore", es: "Cargando Explorar" },
  "Explorar": { en: "Explore", es: "Explorar" },
  "Abrir funções do Explorar": {
    en: "Open Explore options",
    es: "Abrir opciones de Explorar",
  },
  "Buscar autores...": { en: "Search authors...", es: "Buscar autores..." },
  "Buscar histórias...": { en: "Search stories...", es: "Buscar historias..." },
  "Fechar busca": { en: "Close search", es: "Cerrar búsqueda" },
  "Abrir busca": { en: "Open search", es: "Abrir búsqueda" },
  "Categorias": { en: "Categories", es: "Categorías" },
  "Filtros": { en: "Filters", es: "Filtros" },
  "Tudo": { en: "All", es: "Todo" },
  "Autores": { en: "Authors", es: "Autores" },
  "EXPLORAR": { en: "EXPLORE", es: "EXPLORAR" },
  "Mostrar": { en: "Show", es: "Mostrar" },
  "Todas": { en: "All", es: "Todas" },
  "Conteúdo 18+": { en: "18+ content", es: "Contenido 18+" },
  "Ocultar conteúdo 18+": {
    en: "Hide 18+ content",
    es: "Ocultar contenido 18+",
  },
  "Mostrar conteúdo 18+": {
    en: "Show 18+ content",
    es: "Mostrar contenido 18+",
  },
  "Confirmação de idade": {
    en: "Age confirmation",
    es: "Confirmación de edad",
  },
  "Conteúdo 18+ temporariamente indisponível": {
    en: "18+ content temporarily unavailable",
    es: "Contenido 18+ temporalmente no disponible",
  },
  "O acesso a obras 18+ está temporariamente indisponível enquanto o Historietas implementa uma verificação de idade adequada.": {
    en: "Access to 18+ works is temporarily unavailable while Historietas implements an appropriate age-verification system.",
    es: "El acceso a obras 18+ no está disponible temporalmente mientras Historietas implementa un sistema adecuado de verificación de edad.",
  },
  "O conteúdo 18+ fica oculto por padrão. Para exibi-lo, confirme que você tem 18 anos ou mais.": {
    en: "18+ content is hidden by default. To show it, confirm that you are 18 years old or older.",
    es: "El contenido 18+ está oculto de forma predeterminada. Para mostrarlo, confirma que tienes 18 años o más.",
  },
  "Confirmo que tenho 18 anos ou mais.": {
    en: "I confirm that I am 18 years old or older.",
    es: "Confirmo que tengo 18 años o más.",
  },
  "Ativar conteúdo 18+": {
    en: "Enable 18+ content",
    es: "Activar contenido 18+",
  },
  "Voltar": { en: "Back", es: "Volver" },
  "Lendo agora": { en: "Reading now", es: "Leyendo ahora" },
  "Na lista": { en: "In my list", es: "En mi lista" },
  "Concluídas": { en: "Completed", es: "Completadas" },
  "Sem leitura": { en: "Not started", es: "Sin comenzar" },
  "Ordenar": { en: "Sort", es: "Ordenar" },
  "Relevância": { en: "Relevance", es: "Relevancia" },
  "Mais curtidas": { en: "Most liked", es: "Más gustadas" },
  "Mais recentes": { en: "Most recent", es: "Más recientes" },
  "Limpar filtros": { en: "Clear filters", es: "Limpiar filtros" },
  "Entre na sua conta para usar filtros pessoais.": {
    en: "Sign in to use personal filters.",
    es: "Inicia sesión para usar filtros personales.",
  },
  "Recomendações para você": {
    en: "Recommendations for you",
    es: "Recomendaciones para ti",
  },
  "Publicações recentes": {
    en: "Recent publications",
    es: "Publicaciones recientes",
  },
  "Novos capítulos": { en: "New chapters", es: "Nuevos capítulos" },
  "Mais comentadas": { en: "Most commented", es: "Más comentadas" },
  "Para ler agora": { en: "Read now", es: "Para leer ahora" },
  "Autores para conhecer": {
    en: "Authors to discover",
    es: "Autores por descubrir",
  },
  "Autores em destaque": {
    en: "Featured authors",
    es: "Autores destacados",
  },
  "Mais bem avaliados": {
    en: "Top rated",
    es: "Mejor valorados",
  },
  "Resultados da busca": {
    en: "Search results",
    es: "Resultados de búsqueda",
  },
  "Autores encontrados": {
    en: "Authors found",
    es: "Autores encontrados",
  },
  "Nenhum autor encontrado": {
    en: "No authors found",
    es: "No se encontraron autores",
  },
  "Nenhuma obra encontrada": {
    en: "No works found",
    es: "No se encontraron obras",
  },
  "PUBLIQUE SUA HISTÓRIA": {
    en: "PUBLISH YOUR STORY",
    es: "PUBLICA TU HISTORIA",
  },
  "Ver perfil": { en: "View profile", es: "Ver perfil" },
  "obra publicada": { en: "published work", es: "obra publicada" },
  "obras publicadas": { en: "published works", es: "obras publicadas" },
  "avaliação": { en: "rating", es: "valoración" },
  "avaliações": { en: "ratings", es: "valoraciones" },
  "Autor ainda sem avaliações": {
    en: "Author has no ratings yet",
    es: "El autor aún no tiene valoraciones",
  },
  "Rolar carrossel para a esquerda": {
    en: "Scroll carousel left",
    es: "Desplazar el carrusel a la izquierda",
  },
  "Rolar carrossel para a direita": {
    en: "Scroll carousel right",
    es: "Desplazar el carrusel a la derecha",
  },
  "Por": { en: "By", es: "Por" },
  "Rascunho": { en: "Draft", es: "Borrador" },
  "Ver obra": { en: "View work", es: "Ver obra" },
  "Capítulo sem título": {
    en: "Untitled chapter",
    es: "Capítulo sin título",
  },
  "Obra sem título": { en: "Untitled work", es: "Obra sin título" },
  "Autor não informado": {
    en: "Author not provided",
    es: "Autor no informado",
  },
  "Não informado": { en: "Not provided", es: "No informado" },
  "Não informada": { en: "Not provided", es: "No informada" },
  "Nenhuma sinopse informada.": {
    en: "No synopsis provided.",
    es: "No se proporcionó una sinopsis.",
  },
  "sem tags": { en: "no tags", es: "sin etiquetas" },
  "Arquivo da obra": { en: "Work file", es: "Archivo de la obra" },

  "Ação do começo ao fim": {
    en: "Nonstop action",
    es: "Acción de principio a fin",
  },
  "Aventuras sem limites": {
    en: "Limitless adventures",
    es: "Aventuras sin límites",
  },
  "Para rir agora": { en: "A good laugh", es: "Para reír ahora" },
  "Histórias que deixam marcas": {
    en: "Stories that leave a mark",
    es: "Historias que dejan huella",
  },
  "Mundos além da imaginação": {
    en: "Worlds beyond imagination",
    es: "Mundos más allá de la imaginación",
  },
  "Além do que é possível": {
    en: "Beyond what is possible",
    es: "Más allá de lo posible",
  },
  "Mistérios para desvendar": {
    en: "Mysteries to uncover",
    es: "Misterios por descubrir",
  },
  "Amores que deixam marcas": {
    en: "Love stories that leave a mark",
    es: "Amores que dejan huella",
  },
  "Tensão até a última página": {
    en: "Tension to the final page",
    es: "Tensión hasta la última página",
  },
  "Histórias para perder o sono": {
    en: "Stories that will keep you awake",
    es: "Historias para perder el sueño",
  },
  "Entre este mundo e o outro": {
    en: "Between this world and the next",
    es: "Entre este mundo y el otro",
  },
  "Viagens por outros tempos": {
    en: "Journeys through other times",
    es: "Viajes por otros tiempos",
  },
  "Vidas que merecem ser contadas": {
    en: "Lives worth telling",
    es: "Vidas que merecen ser contadas",
  },
  "Descobertas fora do comum": {
    en: "Unusual discoveries",
    es: "Descubrimientos fuera de lo común",
  },
  "Histórias para descobrir": {
    en: "Stories to discover",
    es: "Historias por descubrir",
  },

  "Autores que aceleram o coração": {
    en: "Authors who make your heart race",
    es: "Autores que aceleran el corazón",
  },
  "Autores de grandes jornadas": {
    en: "Authors of great journeys",
    es: "Autores de grandes viajes",
  },
  "Autores para arrancar risadas": {
    en: "Authors who make you laugh",
    es: "Autores que provocan risas",
  },
  "Autores que tocam fundo": {
    en: "Authors who move you deeply",
    es: "Autores que llegan al corazón",
  },
  "Criadores de mundos impossíveis": {
    en: "Creators of impossible worlds",
    es: "Creadores de mundos imposibles",
  },
  "Autores que enxergam além": {
    en: "Authors who see beyond",
    es: "Autores que ven más allá",
  },
  "Mestres dos enigmas": {
    en: "Masters of mysteries",
    es: "Maestros de los enigmas",
  },
  "Autores que escrevem sentimentos": {
    en: "Authors who write emotions",
    es: "Autores que escriben sentimientos",
  },
  "Mestres da tensão": {
    en: "Masters of tension",
    es: "Maestros de la tensión",
  },
  "Autores que dominam o medo": {
    en: "Authors who master fear",
    es: "Autores que dominan el miedo",
  },
  "Vozes do desconhecido": {
    en: "Voices of the unknown",
    es: "Voces de lo desconocido",
  },
  "Autores que revivem o passado": {
    en: "Authors who bring the past to life",
    es: "Autores que reviven el pasado",
  },
  "Autores de vidas reais": {
    en: "Authors of real lives",
    es: "Autores de vidas reales",
  },
  "Novas vozes para descobrir": {
    en: "New voices to discover",
    es: "Nuevas voces por descubrir",
  },
  "Autores para descobrir": {
    en: "Authors to discover",
    es: "Autores por descubrir",
  },
};

const EXPLORAR_GENRE_TRANSLATIONS: Record<
  string,
  ExplorarTranslationEntry
> = {
  acao: { en: "Action", es: "Acción" },
  aventura: { en: "Adventure", es: "Aventura" },
  comedia: { en: "Comedy", es: "Comedia" },
  drama: { en: "Drama", es: "Drama" },
  fantasia: { en: "Fantasy", es: "Fantasía" },
  ficcao: { en: "Fiction", es: "Ficción" },
  misterio: { en: "Mystery", es: "Misterio" },
  romance: { en: "Romance", es: "Romance" },
  suspense: { en: "Thriller", es: "Suspenso" },
  terror: { en: "Horror", es: "Terror" },
  sobrenatural: { en: "Supernatural", es: "Sobrenatural" },
  historico: { en: "Historical", es: "Histórico" },
  biografia: { en: "Biography", es: "Biografía" },
  outros: { en: "Others", es: "Otros" },
};

const EXPLORAR_FORMAT_TRANSLATIONS: Record<
  string,
  ExplorarTranslationEntry
> = {
  webnovel: { en: "Web novel", es: "Novela web" },
  "web novel": { en: "Web novel", es: "Novela web" },
  "light novel": { en: "Light novel", es: "Novela ligera" },
  romance: { en: "Novel", es: "Novela" },
  conto: { en: "Short story", es: "Cuento" },
  poesia: { en: "Poetry", es: "Poesía" },
  hq: { en: "Comics", es: "Cómic" },
  manga: { en: "Manga", es: "Manga" },
  fanfic: { en: "Fanfiction", es: "Fanfic" },
  historia: { en: "Story", es: "Historia" },
};

const EXPLORAR_CLASSIFICATION_TRANSLATIONS: Record<
  string,
  ExplorarTranslationEntry
> = {
  livre: { en: "All ages", es: "Todo público" },
  leitores: { en: "Readers", es: "Lectores" },
  "nao informada": { en: "Not provided", es: "No informada" },
  "nao informado": { en: "Not provided", es: "No informado" },
};

export function obterLocaleExplorar(idioma: HistorietasLanguage): string {
  if (idioma === "en") {
    return "en-US";
  }

  if (idioma === "es") {
    return "es-ES";
  }

  return "pt-BR";
}

export function traduzirTextoExplorar(
  texto: string,
  idioma: HistorietasLanguage
): string {
  if (idioma === "pt-BR") {
    return texto;
  }

  const traducaoExata = EXPLORAR_UI_TRANSLATIONS[texto];

  if (traducaoExata) {
    return traducaoExata[idioma];
  }

  let correspondencia = texto.match(/^Explorar \((\d+)\)$/);

  if (correspondencia) {
    return idioma === "en"
      ? `Explore (${correspondencia[1]})`
      : `Explorar (${correspondencia[1]})`;
  }

  correspondencia = texto.match(/^Publicações em (.+)$/);

  if (correspondencia) {
    const genero = traduzirGeneroExplorar(correspondencia[1], idioma);

    return idioma === "en"
      ? `Publications in ${genero}`
      : `Publicaciones de ${genero}`;
  }

  correspondencia = texto.match(/^Autores de (.+)$/);

  if (correspondencia) {
    const genero = traduzirGeneroExplorar(correspondencia[1], idioma);

    return idioma === "en"
      ? `${genero} authors`
      : `Autores de ${genero}`;
  }

  correspondencia = texto.match(/^Capítulo (\d+)$/);

  if (correspondencia) {
    return idioma === "en"
      ? `Chapter ${correspondencia[1]}`
      : `Capítulo ${correspondencia[1]}`;
  }

  return texto;
}

export function traduzirGeneroExplorar(
  genero: string,
  idioma: HistorietasLanguage
): string {
  if (idioma === "pt-BR") {
    return genero;
  }

  const chave = normalizarTexto(genero);
  const traducao = EXPLORAR_GENRE_TRANSLATIONS[chave];

  return traducao?.[idioma] || traduzirTextoExplorar(genero, idioma);
}

export function traduzirFormatoExplorar(
  formato: string,
  idioma: HistorietasLanguage
): string {
  if (idioma === "pt-BR") {
    return formato;
  }

  const chave = normalizarTexto(formato);
  const traducao = EXPLORAR_FORMAT_TRANSLATIONS[chave];

  if (traducao) {
    return traducao[idioma];
  }

  return traduzirTextoExplorar(formato, idioma);
}

export function traduzirClassificacaoExplorar(
  classificacao: string,
  idioma: HistorietasLanguage
): string {
  if (idioma === "pt-BR") {
    return classificacao;
  }

  const chave = normalizarTexto(classificacao);
  const traducao = EXPLORAR_CLASSIFICATION_TRANSLATIONS[chave];

  return traducao?.[idioma] || classificacao;
}
