import type { HistorietasLanguage } from "../../../../lib/i18n";

type TraducaoTop5 = {
  en: string;
  es: string;
};

const TOP5_UI_TRANSLATIONS: Record<string, TraducaoTop5> = {
  "Seu TOP 5": { en: "Your TOP 5", es: "Tu TOP 5" },
  "Cancelar": { en: "Cancel", es: "Cancelar" },
  "Salvando...": { en: "Saving...", es: "Guardando..." },
  "Salvar": { en: "Save", es: "Guardar" },
  "Buscar obras": { en: "Search works", es: "Buscar obras" },
  "Pesquisar obra, autor, gênero ou tag": {
    en: "Search by work, author, genre, or tag",
    es: "Buscar por obra, autor, género o etiqueta",
  },
  "Entre para salvar seu TOP 5": {
    en: "Sign in to save your TOP 5",
    es: "Inicia sesión para guardar tu TOP 5",
  },
  "Você pode ver as obras, mas precisa estar logado para salvar suas escolhas.": {
    en: "You can view the works, but you need to be signed in to save your choices.",
    es: "Puedes ver las obras, pero debes iniciar sesión para guardar tus elecciones.",
  },
  "Entrar": { en: "Sign in", es: "Iniciar sesión" },
  "Lista de obras disponíveis": {
    en: "List of available works",
    es: "Lista de obras disponibles",
  },
  "Carregando obras...": { en: "Loading works...", es: "Cargando obras..." },
  "Nenhuma obra encontrada": {
    en: "No works found",
    es: "No se encontraron obras",
  },
  "Obras escolhidas para o TOP 5": {
    en: "Works selected for the TOP 5",
    es: "Obras elegidas para el TOP 5",
  },
  "Você já escolheu 5 obras. Remova uma para trocar.": {
    en: "You have already selected 5 works. Remove one to replace it.",
    es: "Ya elegiste 5 obras. Elimina una para reemplazarla.",
  },
  "Entre na sua conta para salvar seu TOP 5.": {
    en: "Sign in to save your TOP 5.",
    es: "Inicia sesión para guardar tu TOP 5.",
  },
  "Não foi possível gravar o TOP 5 no navegador.": {
    en: "The TOP 5 could not be saved in the browser.",
    es: "No se pudo guardar el TOP 5 en el navegador.",
  },
  "Não foi possível salvar agora. Tente novamente.": {
    en: "It could not be saved right now. Try again.",
    es: "No se pudo guardar ahora. Inténtalo de nuevo.",
  },
  "Capítulo sem título": { en: "Untitled chapter", es: "Capítulo sin título" },
  "Autor não informado": { en: "Author not provided", es: "Autor no informado" },
  "Não informado": { en: "Not provided", es: "No informado" },
  "Não informada": { en: "Not provided", es: "No informada" },
  "sem tags": { en: "no tags", es: "sin etiquetas" },
  "Usuário": { en: "User", es: "Usuario" },
};

export function traduzirTextoTop5(texto: string, idioma: HistorietasLanguage) {
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
  const traducaoExata = TOP5_UI_TRANSLATIONS[conteudo];

  if (traducaoExata) {
    return `${inicio}${traducaoExata[idioma]}${fim}`;
  }

  let correspondencia = /^Remover\s+(.+)\s+do TOP 5$/i.exec(conteudo);

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Remove ${correspondencia[1]} from the TOP 5${fim}`
      : `${inicio}Eliminar ${correspondencia[1]} del TOP 5${fim}`;
  }

  correspondencia = /^Adicionar\s+(.+)\s+ao TOP 5$/i.exec(conteudo);

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Add ${correspondencia[1]} to the TOP 5${fim}`
      : `${inicio}Añadir ${correspondencia[1]} al TOP 5${fim}`;
  }

  correspondencia = /^Subir\s+(.+)$/i.exec(conteudo);

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Move ${correspondencia[1]} up${fim}`
      : `${inicio}Subir ${correspondencia[1]}${fim}`;
  }

  correspondencia = /^Descer\s+(.+)$/i.exec(conteudo);

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Move ${correspondencia[1]} down${fim}`
      : `${inicio}Bajar ${correspondencia[1]}${fim}`;
  }

  correspondencia = /^Obra\s+(\d+)$/i.exec(conteudo);

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Work ${correspondencia[1]}${fim}`
      : `${inicio}Obra ${correspondencia[1]}${fim}`;
  }

  return texto;
}
