import type { HistorietasLanguage } from "../../../lib/i18n";

type TraducaoEmAlta = {
  en: string;
  es: string;
};

const EM_ALTA_UI_TRANSLATIONS: Record<string, TraducaoEmAlta> = {
  "Carregando": { en: "Loading", es: "Cargando" },
  "Carregando Em Alta": { en: "Loading Trending", es: "Cargando Tendencias" },
  "Voltar para a Home": { en: "Back to Home", es: "Volver al inicio" },
  "Notificações": { en: "Notifications", es: "Notificaciones" },
  "ISTORIETAS": { en: "ISTORIETAS", es: "ISTORIETAS" },
  "ISTORIETAS POPULARES": { en: "ISTORIETAS — POPULAR", es: "ISTORIETAS POPULARES" },
  "ISTORIETAS PUBLICADAS": { en: "ISTORIETAS — PUBLISHED", es: "ISTORIETAS PUBLICADAS" },
  "Ranking Mestre": { en: "Master Ranking", es: "Ranking Maestro" },
  "Alcance Dominante": { en: "Dominant Reach", es: "Alcance Dominante" },
  "Preferidas do Público": { en: "Readers' Favorites", es: "Favoritas del Público" },
  "Mais Comentadas": { en: "Most Commented", es: "Más Comentadas" },
  "Mais Seguidas": { en: "Most Followed", es: "Más Seguidas" },
  "Novas Promessas": { en: "Rising Stars", es: "Nuevas Promesas" },
  "Grandes Jornadas": { en: "Epic Journeys", es: "Grandes Aventuras" },
  "Autores em Alta": { en: "Trending Authors", es: "Autores en Tendencia" },
  "Catálogo em formação": { en: "Catalog in progress", es: "Catálogo en formación" },
  "Obras publicadas": { en: "Published works", es: "Obras publicadas" },
  "Ainda não há obras publicadas": { en: "There are no published works yet", es: "Todavía no hay obras publicadas" },
  "Nada para mostrar neste ranking": { en: "Nothing to show in this ranking", es: "Nada que mostrar en este ranking" },
  "As histórias que mais chamaram atenção dos leitores.": { en: "The stories that attracted the most reader attention.", es: "Las historias que más llamaron la atención de los lectores." },
  "As obras que mais receberam curtidas e reações positivas.": { en: "The works with the most likes and positive reactions.", es: "Las obras que más recibieron Me gusta y reacciones positivas." },
  "As histórias que mais puxaram conversa entre os leitores.": { en: "The stories that sparked the most reader discussion.", es: "Las historias que más conversación generaron entre los lectores." },
  "Obras que mais leitores decidiram acompanhar.": { en: "Works that the most readers chose to follow.", es: "Obras que más lectores decidieron seguir." },
  "Publicações recentes começando a aparecer no radar.": { en: "Recent publications starting to gain attention.", es: "Publicaciones recientes que empiezan a destacar." },
  "Histórias com mais capítulos e conteúdo publicado.": { en: "Stories with the most chapters and published content.", es: "Historias con más capítulos y contenido publicado." },
  "Catálogo inicial com obras publicadas no HISTORIETAS.": { en: "Initial catalog of works published on HISTORIETAS.", es: "Catálogo inicial de obras publicadas en HISTORIETAS." },
  "Obra Publicada": { en: "Published Work", es: "Obra Publicada" },
  "Obras Publicadas": { en: "Published Works", es: "Obras Publicadas" },
  "Por": { en: "By", es: "Por" },
  "História": { en: "Story", es: "Historia" },
  "Publicado": { en: "Published", es: "Publicado" },
  "Sem data": { en: "No date", es: "Sin fecha" },
  "Não informado": { en: "Not provided", es: "No informado" },
  "Não informada": { en: "Not provided", es: "No informada" },
  "Obra sem título": { en: "Untitled work", es: "Obra sin título" },
  "Autor não informado": { en: "Author not provided", es: "Autor no informado" },
  "Arquivo da obra": { en: "Work file", es: "Archivo de la obra" },
  "Capítulo": { en: "Chapter", es: "Capítulo" },
  "Capítulos": { en: "Chapters", es: "Capítulos" },
  "Alcance": { en: "Reach", es: "Alcance" },
  "Reação": { en: "Reaction", es: "Reacción" },
  "Discussão": { en: "Discussion", es: "Discusión" },
  "Seguidores": { en: "Followers", es: "Seguidores" },
  "Novidade": { en: "New", es: "Novedad" },
  "Conteúdo": { en: "Content", es: "Contenido" },
  "Diamante": { en: "Diamond", es: "Diamante" },
  "Rubi": { en: "Ruby", es: "Rubí" },
  "Ouro": { en: "Gold", es: "Oro" },
  "Prata": { en: "Silver", es: "Plata" },
  "Bronze": { en: "Bronze", es: "Bronce" },
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
  "Conto": { en: "Short story", es: "Cuento" },
  "Poesia": { en: "Poetry", es: "Poesía" },
  "Mangá": { en: "Manga", es: "Manga" },
  "HQ": { en: "Comics", es: "Cómic" },
  "Livre": { en: "All ages", es: "Todo público" },
};

function traduzirDataEmAlta(texto: string, idioma: HistorietasLanguage) {
  const correspondencia = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(texto);

  if (!correspondencia || idioma !== "en") {
    return "";
  }

  return `${correspondencia[2]}/${correspondencia[1]}/${correspondencia[3]}`;
}

export function traduzirTextoEmAlta(
  texto: string,
  idioma: HistorietasLanguage
): string {
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
  const traducaoExata = EM_ALTA_UI_TRANSLATIONS[conteudo];

  if (traducaoExata) {
    return `${inicio}${traducaoExata[idioma]}${fim}`;
  }

  const dataTraduzida = traduzirDataEmAlta(conteudo, idioma);

  if (dataTraduzida) {
    return `${inicio}${dataTraduzida}${fim}`;
  }

  let correspondencia = /^Notificações:\s*(\d+)\s*não lidas$/i.exec(conteudo);

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Notifications: ${correspondencia[1]} unread${fim}`
      : `${inicio}Notificaciones: ${correspondencia[1]} sin leer${fim}`;
  }

  correspondencia = /^Abrir perfil de (.+)$/i.exec(conteudo);

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Open ${correspondencia[1]}'s profile${fim}`
      : `${inicio}Abrir el perfil de ${correspondencia[1]}${fim}`;
  }

  correspondencia = /^Abrir página da obra (.+)$/i.exec(conteudo);

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Open the page for ${correspondencia[1]}${fim}`
      : `${inicio}Abrir la página de ${correspondencia[1]}${fim}`;
  }

  correspondencia = /^(Voltar|Avançar) carrossel (.+)$/i.exec(conteudo);

  if (correspondencia) {
    const titulo = traduzirTextoEmAlta(correspondencia[2], idioma).trim();

    if (idioma === "en") {
      return `${inicio}${correspondencia[1].toLowerCase() === "voltar" ? "Previous" : "Next"} ${titulo} carousel${fim}`;
    }

    return `${inicio}${correspondencia[1].toLowerCase() === "voltar" ? "Retroceder" : "Avanzar"} carrusel de ${titulo}${fim}`;
  }

  correspondencia = /^(.+) em carrossel$/i.exec(conteudo);

  if (correspondencia) {
    const titulo = traduzirTextoEmAlta(correspondencia[1], idioma).trim();

    return idioma === "en"
      ? `${inicio}${titulo} carousel${fim}`
      : `${inicio}Carrusel de ${titulo}${fim}`;
  }

  correspondencia = /^Posição\s+(\d+)º\s+—\s+(.+)$/i.exec(conteudo);

  if (correspondencia) {
    const nivel = traduzirTextoEmAlta(correspondencia[2], idioma).trim();

    return idioma === "en"
      ? `${inicio}Position ${correspondencia[1]} — ${nivel}${fim}`
      : `${inicio}Posición ${correspondencia[1]} — ${nivel}${fim}`;
  }

  correspondencia = /^([\d.,]+)\s+(Obra Publicada|Obras Publicadas)$/i.exec(conteudo);

  if (correspondencia) {
    const quantidade = correspondencia[1];
    const singular = correspondencia[2].toLowerCase() === "obra publicada";

    return idioma === "en"
      ? `${inicio}${quantidade} ${singular ? "Published Work" : "Published Works"}${fim}`
      : `${inicio}${quantidade} ${singular ? "Obra Publicada" : "Obras Publicadas"}${fim}`;
  }

  correspondencia = /^([\d.,]+)\s+(visualização|visualizações|curtida|curtidas|comentário|comentários|seguidor|seguidores|capítulo|capítulos)$/i.exec(conteudo);

  if (correspondencia) {
    const quantidade = correspondencia[1];
    const unidade = correspondencia[2].toLowerCase();
    const singular = !unidade.endsWith("s") && unidade !== "visualizações";

    if (idioma === "en") {
      const traducao = unidade.startsWith("visualiza")
        ? singular ? "view" : "views"
        : unidade.startsWith("curtida")
          ? singular ? "like" : "likes"
          : unidade.startsWith("coment")
            ? singular ? "comment" : "comments"
            : unidade.startsWith("seguidor")
              ? singular ? "follower" : "followers"
              : singular ? "chapter" : "chapters";

      return `${inicio}${quantidade} ${traducao}${fim}`;
    }

    const traducao = unidade.startsWith("visualiza")
      ? singular ? "visualización" : "visualizaciones"
      : unidade.startsWith("curtida")
        ? singular ? "Me gusta" : "Me gusta"
        : unidade.startsWith("coment")
          ? singular ? "comentario" : "comentarios"
          : unidade.startsWith("seguidor")
            ? singular ? "seguidor" : "seguidores"
            : singular ? "capítulo" : "capítulos";

    return `${inicio}${quantidade} ${traducao}${fim}`;
  }

  return texto;
}
