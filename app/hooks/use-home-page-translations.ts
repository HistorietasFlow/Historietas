"use client";

import { useEffect } from "react";
import type { HistorietasLanguage } from "../../lib/i18n";

type HomeTranslationEntry = {
  en: string;
  es: string;
};

type HomeTranslatedNodeState = {
  original: string;
  translated: string;
};

const HOME_UI_TRANSLATIONS: Record<string, HomeTranslationEntry> = {
  "DESCUBRA NOVAS HISTÓRIAS": {
    en: "DISCOVER NEW STORIES",
    es: "DESCUBRE NUEVAS HISTORIAS",
  },
  "Catálogo em formação": {
    en: "Catalog in progress",
    es: "Catálogo en formación",
  },
  "Leitores": {
    en: "Readers",
    es: "Lectores",
  },
  "O HISTORIETAS está formando seu catálogo inicial. Explore obras publicadas, acompanhe autores e publique sua história quando quiser.": {
    en: "HISTORIETAS is building its first catalog. Explore published works, follow authors, and publish your story whenever you are ready.",
    es: "HISTORIETAS está formando su catálogo inicial. Explora obras publicadas, sigue a autores y publica tu historia cuando quieras.",
  },
  "Catálogo aberto": {
    en: "Open catalog",
    es: "Catálogo abierto",
  },
  "Leitura online": {
    en: "Online reading",
    es: "Lectura en línea",
  },
  "histórias": {
    en: "stories",
    es: "historias",
  },
  "Ficção": {
    en: "Fiction",
    es: "Ficción",
  },
  "Não informado": {
    en: "Not provided",
    es: "No informado",
  },
  "Não informada": {
    en: "Not provided",
    es: "No informada",
  },
  "Nenhuma sinopse informada.": {
    en: "No synopsis provided.",
    es: "No se proporcionó una sinopsis.",
  },
  "Em andamento": {
    en: "Ongoing",
    es: "En curso",
  },
  "Publicado": {
    en: "Published",
    es: "Publicado",
  },
  "História": {
    en: "Story",
    es: "Historia",
  },
  "Autor não informado": {
    en: "Author not provided",
    es: "Autor no informado",
  },
  "Capítulo sem título": {
    en: "Untitled chapter",
    es: "Capítulo sin título",
  },
  "Obra sem título": {
    en: "Untitled work",
    es: "Obra sin título",
  },
  "sem tags": {
    en: "no tags",
    es: "sin etiquetas",
  },
  "Arquivo da obra": {
    en: "Work file",
    es: "Archivo de la obra",
  },
  "Carregando": {
    en: "Loading",
    es: "Cargando",
  },
  "Carregando página inicial": {
    en: "Loading home page",
    es: "Cargando la página de inicio",
  },
  "Buscar...": {
    en: "Search...",
    es: "Buscar...",
  },
  "Configurações": {
    en: "Settings",
    es: "Configuración",
  },
  "Notificações": {
    en: "Notifications",
    es: "Notificaciones",
  },
  "Abrir busca": {
    en: "Open search",
    es: "Abrir búsqueda",
  },
  "Fechar busca": {
    en: "Close search",
    es: "Cerrar búsqueda",
  },
  "Navegação principal": {
    en: "Main navigation",
    es: "Navegación principal",
  },
  "Início": {
    en: "Home",
    es: "Inicio",
  },
  "Explorar": {
    en: "Explore",
    es: "Explorar",
  },
  "Em Alta": {
    en: "Trending",
    es: "Tendencias",
  },
  "Minhas Obras": {
    en: "My Works",
    es: "Mis obras",
  },
  "Comunidade": {
    en: "Community",
    es: "Comunidad",
  },
  "Biblioteca": {
    en: "Library",
    es: "Biblioteca",
  },
  "Seguindo": {
    en: "Following",
    es: "Siguiendo",
  },
  "Painel do Autor": {
    en: "Author Dashboard",
    es: "Panel del autor",
  },
  "Buscar obras, autor, gênero...": {
    en: "Search works, authors, genres...",
    es: "Buscar obras, autores, géneros...",
  },
  "Publicar obra": {
    en: "Publish work",
    es: "Publicar obra",
  },
  "Explorar obras": {
    en: "Explore works",
    es: "Explorar obras",
  },
  "Ver obra": {
    en: "View work",
    es: "Ver obra",
  },
  "Salvar": {
    en: "Save",
    es: "Guardar",
  },
  "Salvo": {
    en: "Saved",
    es: "Guardado",
  },
  "Obras em destaque": {
    en: "Featured works",
    es: "Obras destacadas",
  },
  "Atalhos principais": {
    en: "Main shortcuts",
    es: "Accesos principales",
  },
  "Em breve": {
    en: "Coming soon",
    es: "Próximamente",
  },
  "Continuar lendo": {
    en: "Continue reading",
    es: "Continuar leyendo",
  },
  "Continue do ponto em que parou.": {
    en: "Pick up where you left off.",
    es: "Continúa desde donde lo dejaste.",
  },
  "Minha lista": {
    en: "My list",
    es: "Mi lista",
  },
  "Autores para conhecer": {
    en: "Authors to discover",
    es: "Autores por descubrir",
  },
  "Perfis que dão vida ao catálogo.": {
    en: "Profiles that bring the catalog to life.",
    es: "Perfiles que dan vida al catálogo.",
  },
  "Recomendações para você": {
    en: "Recommendations for you",
    es: "Recomendaciones para ti",
  },
  "Obras parecidas com o que você lê ou salvou.": {
    en: "Works similar to what you read or saved.",
    es: "Obras parecidas a las que lees o guardaste.",
  },
  "Sugestões para começar sua próxima leitura.": {
    en: "Suggestions for your next read.",
    es: "Sugerencias para comenzar tu próxima lectura.",
  },
  "Publicações recentes": {
    en: "Recent publications",
    es: "Publicaciones recientes",
  },
  "obra publicada": {
    en: "published work",
    es: "obra publicada",
  },
  "obras publicadas": {
    en: "published works",
    es: "obras publicadas",
  },
  "Novos capítulos": {
    en: "New chapters",
    es: "Nuevos capítulos",
  },
  "Capítulos novos para acompanhar sem perder o ritmo.": {
    en: "New chapters to follow without missing a beat.",
    es: "Nuevos capítulos para seguir sin perder el ritmo.",
  },
  "Mais curtidas": {
    en: "Most liked",
    es: "Más gustadas",
  },
  "Na lista da comunidade nesta fase.": {
    en: "Popular with the community right now.",
    es: "Populares en la comunidad en este momento.",
  },
  "Mais comentadas": {
    en: "Most commented",
    es: "Más comentadas",
  },
  "Histórias que estão puxando conversa.": {
    en: "Stories sparking conversations.",
    es: "Historias que están generando conversación.",
  },
  "Extras e arquivos": {
    en: "Extras and files",
    es: "Extras y archivos",
  },
  "Histórias com material extra para abrir depois.": {
    en: "Stories with extra material to open later.",
    es: "Historias con material extra para abrir después.",
  },
  "Para ler agora": {
    en: "Read now",
    es: "Para leer ahora",
  },
  "Obras curtas para entrar rápido no universo.": {
    en: "Short works that pull you into the story quickly.",
    es: "Obras cortas para entrar rápidamente en el universo.",
  },
  "Catálogo": {
    en: "Catalog",
    es: "Catálogo",
  },
  "Obras reais publicadas na plataforma.": {
    en: "Real works published on the platform.",
    es: "Obras reales publicadas en la plataforma.",
  },
  "Fantasia e poderes": {
    en: "Fantasy and powers",
    es: "Fantasía y poderes",
  },
  "Mundos, poderes e mistérios para explorar.": {
    en: "Worlds, powers, and mysteries to explore.",
    es: "Mundos, poderes y misterios por explorar.",
  },
  "Terror e suspense": {
    en: "Horror and suspense",
    es: "Terror y suspenso",
  },
  "Atmosfera sombria, tensão e mistério.": {
    en: "Dark atmosphere, tension, and mystery.",
    es: "Atmósfera oscura, tensión y misterio.",
  },
  "Romance e drama": {
    en: "Romance and drama",
    es: "Romance y drama",
  },
  "Relações intensas e escolhas difíceis.": {
    en: "Intense relationships and difficult choices.",
    es: "Relaciones intensas y decisiones difíciles.",
  },
  "Ação e rivalidades": {
    en: "Action and rivalries",
    es: "Acción y rivalidades",
  },
  "Conflitos, disputas e personagens intensos.": {
    en: "Conflicts, rivalries, and intense characters.",
    es: "Conflictos, rivalidades y personajes intensos.",
  },
  "Sci-fi e códigos": {
    en: "Sci-fi and code",
    es: "Ciencia ficción y código",
  },
  "Futuro, sistemas e universos alternativos.": {
    en: "The future, systems, and alternate universes.",
    es: "Futuro, sistemas y universos alternativos.",
  },
  "Em breve na Historietas": {
    en: "Coming soon to Historietas",
    es: "Próximamente en Historietas",
  },
  "Obras chegando ao catálogo em breve.": {
    en: "Works coming to the catalog soon.",
    es: "Obras que llegarán pronto al catálogo.",
  },
  "Obras reais disponíveis para leitura.": {
    en: "Real works available to read.",
    es: "Obras reales disponibles para leer.",
  },
  "Continuar": {
    en: "Continue",
    es: "Continuar",
  },
  "Ler agora": {
    en: "Read now",
    es: "Leer ahora",
  },
  "Leitura": {
    en: "Reading",
    es: "Lectura",
  },
  "Por": {
    en: "By",
    es: "Por",
  },
  "Novo cap": {
    en: "New ch.",
    es: "Cap. nuevo",
  },
  "% lido": {
    en: "% read",
    es: "% leído",
  },
  "Ver perfil": {
    en: "View profile",
    es: "Ver perfil",
  },
  "Autor ainda sem avaliações": {
    en: "Author has no ratings yet",
    es: "El autor aún no tiene valoraciones",
  },
  "avaliação": {
    en: "rating",
    es: "valoración",
  },
  "avaliações": {
    en: "ratings",
    es: "valoraciones",
  },
  "Ver detalhes": {
    en: "View details",
    es: "Ver detalles",
  },
  "Nenhuma obra cadastrada": {
    en: "No works available",
    es: "No hay obras registradas",
  },
  "Nenhuma obra encontrada": {
    en: "No works found",
    es: "No se encontraron obras",
  },
  "Rolar carrossel para a esquerda": {
    en: "Scroll carousel left",
    es: "Desplazar el carrusel a la izquierda",
  },
  "Rolar carrossel para a direita": {
    en: "Scroll carousel right",
    es: "Desplazar el carrusel a la derecha",
  },
  "Entre na sua conta para salvar obras na sua lista.": {
    en: "Sign in to save works to your list.",
    es: "Inicia sesión para guardar obras en tu lista.",
  },
  "A obra ficou salva no aparelho, mas não sincronizou agora.": {
    en: "The work was saved on this device, but it could not sync right now.",
    es: "La obra se guardó en este dispositivo, pero no pudo sincronizarse ahora.",
  },
};

const homeTextNodeStates = new WeakMap<Text, HomeTranslatedNodeState>();
const homeAttributeStates = new WeakMap<
  Element,
  Map<string, HomeTranslatedNodeState>
>();

export function traduzirTextoDinamicoHome(
  texto: string,
  idioma: HistorietasLanguage
) {
  if (idioma === "pt-BR") {
    return texto;
  }

  const traducaoExata = HOME_UI_TRANSLATIONS[texto];

  if (traducaoExata) {
    return traducaoExata[idioma];
  }

  let correspondencia = texto.match(/^Notificações: (\d+) novas$/);

  if (correspondencia) {
    return idioma === "en"
      ? `${correspondencia[1]} new notifications`
      : `Notificaciones nuevas: ${correspondencia[1]}`;
  }

  correspondencia = texto.match(/^(\d+) na lista para acessar rápido\.$/);

  if (correspondencia) {
    return idioma === "en"
      ? `${correspondencia[1]} in your list for quick access.`
      : `${correspondencia[1]} en tu lista para acceder rápidamente.`;
  }

  correspondencia = texto.match(/^Capítulo (\d+)$/);

  if (correspondencia) {
    return idioma === "en"
      ? `Chapter ${correspondencia[1]}`
      : `Capítulo ${correspondencia[1]}`;
  }

  correspondencia = texto.match(/^Cap (\d+)$/);

  if (correspondencia) {
    return idioma === "en"
      ? `Ch. ${correspondencia[1]}`
      : `Cap. ${correspondencia[1]}`;
  }

  correspondencia = texto.match(/^Leitura Cap\. (\d+)$/);

  if (correspondencia) {
    return idioma === "en"
      ? `Reading Ch. ${correspondencia[1]}`
      : `Lectura Cap. ${correspondencia[1]}`;
  }

  correspondencia = texto.match(/^Abrir destaque (.+)$/);

  if (correspondencia) {
    return idioma === "en"
      ? `Open featured work ${correspondencia[1]}`
      : `Abrir obra destacada ${correspondencia[1]}`;
  }

  correspondencia = texto.match(/^Mostrar (.+)$/);

  if (correspondencia) {
    return idioma === "en"
      ? `Show ${correspondencia[1]}`
      : `Mostrar ${correspondencia[1]}`;
  }

  correspondencia = texto.match(/^Abrir perfil do autor (.+)$/);

  if (correspondencia) {
    return idioma === "en"
      ? `Open author profile for ${correspondencia[1]}`
      : `Abrir el perfil del autor ${correspondencia[1]}`;
  }

  correspondencia = texto.match(/^Avatar de (.+)$/);

  if (correspondencia) {
    return idioma === "en"
      ? `${correspondencia[1]} avatar`
      : `Avatar de ${correspondencia[1]}`;
  }

  correspondencia = texto.match(/^Abrir página da obra (.+)$/);

  if (correspondencia) {
    return idioma === "en"
      ? `Open work page for ${correspondencia[1]}`
      : `Abrir la página de la obra ${correspondencia[1]}`;
  }

  correspondencia = texto.match(
    /^Avaliação média (.+) de 5, com (\d+) (avaliação|avaliações)$/
  );

  if (correspondencia) {
    const total = Number(correspondencia[2]);

    if (idioma === "en") {
      return `Average rating ${correspondencia[1]} out of 5, from ${total} ${
        total === 1 ? "rating" : "ratings"
      }`;
    }

    return `Valoración media ${correspondencia[1]} de 5, con ${total} ${
      total === 1 ? "valoración" : "valoraciones"
    }`;
  }

  correspondencia = texto.match(/^Adicionou (.+) à lista$/);

  if (correspondencia) {
    return idioma === "en"
      ? `Added ${correspondencia[1]} to the list`
      : `Añadió ${correspondencia[1]} a la lista`;
  }

  correspondencia = texto.match(/^Autor de (.+) na Historietas\.$/);

  if (correspondencia) {
    return idioma === "en"
      ? `Author of ${correspondencia[1]} on Historietas.`
      : `Autor de ${correspondencia[1]} en Historietas.`;
  }

  correspondencia = texto.match(/^(\d+(?:[.,]\d+)?) mi$/);

  if (correspondencia) {
    return idioma === "en"
      ? `${correspondencia[1].replace(",", ".")}M`
      : `${correspondencia[1]} M`;
  }

  correspondencia = texto.match(/^(\d+(?:[.,]\d+)?) mil$/);

  if (correspondencia) {
    return idioma === "en"
      ? `${correspondencia[1].replace(",", ".")}K`
      : `${correspondencia[1]} mil`;
  }

  return texto;
}

export function traduzirValorPreservandoEspacosHome(
  valor: string,
  idioma: HistorietasLanguage
) {
  const inicio = valor.match(/^\s*/)?.[0] || "";
  const fim = valor.match(/\s*$/)?.[0] || "";
  const textoLimpo = valor.trim();

  if (!textoLimpo) {
    return valor;
  }

  return `${inicio}${traduzirTextoDinamicoHome(textoLimpo, idioma)}${fim}`;
}

function podeTraduzirElementoHome(elemento: Element | null) {
  if (!elemento) {
    return false;
  }

  const tag = elemento.tagName.toLowerCase();

  return tag !== "script" && tag !== "style" && tag !== "textarea";
}

function traduzirTextNodeHome(
  node: Text,
  idioma: HistorietasLanguage
) {
  if (!podeTraduzirElementoHome(node.parentElement)) {
    return;
  }

  const valorAtual = node.nodeValue || "";
  const estadoAtual = homeTextNodeStates.get(node);
  const original =
    estadoAtual && valorAtual === estadoAtual.translated
      ? estadoAtual.original
      : valorAtual;
  const traduzido = traduzirValorPreservandoEspacosHome(original, idioma);

  homeTextNodeStates.set(node, {
    original,
    translated: traduzido,
  });

  if (valorAtual !== traduzido) {
    node.nodeValue = traduzido;
  }
}

function traduzirAtributosElementoHome(
  elemento: Element,
  idioma: HistorietasLanguage
) {
  const atributos = ["aria-label", "title", "placeholder", "alt"];
  const estadosDoElemento =
    homeAttributeStates.get(elemento) ||
    new Map<string, HomeTranslatedNodeState>();

  atributos.forEach((atributo) => {
    const valorAtual = elemento.getAttribute(atributo);

    if (valorAtual === null) {
      return;
    }

    const estadoAtual = estadosDoElemento.get(atributo);
    const original =
      estadoAtual && valorAtual === estadoAtual.translated
        ? estadoAtual.original
        : valorAtual;
    const traduzido = traduzirValorPreservandoEspacosHome(original, idioma);

    estadosDoElemento.set(atributo, {
      original,
      translated: traduzido,
    });

    if (valorAtual !== traduzido) {
      elemento.setAttribute(atributo, traduzido);
    }
  });

  homeAttributeStates.set(elemento, estadosDoElemento);
}

function traduzirSubarvoreHome(
  raiz: Node,
  idioma: HistorietasLanguage
) {
  if (raiz.nodeType === Node.TEXT_NODE) {
    traduzirTextNodeHome(raiz as Text, idioma);
    return;
  }

  if (raiz.nodeType !== Node.ELEMENT_NODE) {
    return;
  }

  const elemento = raiz as Element;

  if (!podeTraduzirElementoHome(elemento)) {
    return;
  }

  traduzirAtributosElementoHome(elemento, idioma);

  const walker = document.createTreeWalker(
    elemento,
    NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT
  );

  while (walker.nextNode()) {
    const nodeAtual = walker.currentNode;

    if (nodeAtual.nodeType === Node.TEXT_NODE) {
      traduzirTextNodeHome(nodeAtual as Text, idioma);
    } else if (nodeAtual.nodeType === Node.ELEMENT_NODE) {
      traduzirAtributosElementoHome(nodeAtual as Element, idioma);
    }
  }
}

export default function useHomePageTranslations(
  rootRef: { current: HTMLElement | null },
  idioma: HistorietasLanguage
) {
  useEffect(() => {
    const raiz = rootRef.current;

    if (!raiz) {
      return;
    }

    traduzirSubarvoreHome(raiz, idioma);

    const observer = new MutationObserver((mutacoes) => {
      mutacoes.forEach((mutacao) => {
        if (mutacao.type === "characterData") {
          traduzirTextNodeHome(mutacao.target as Text, idioma);
          return;
        }

        if (mutacao.type === "attributes") {
          traduzirAtributosElementoHome(
            mutacao.target as Element,
            idioma
          );
          return;
        }

        mutacao.addedNodes.forEach((node) => {
          traduzirSubarvoreHome(node, idioma);
        });
      });
    });

    observer.observe(raiz, {
      childList: true,
      characterData: true,
      attributes: true,
      subtree: true,
      attributeFilter: ["aria-label", "title", "placeholder", "alt"],
    });

    return () => {
      observer.disconnect();
    };
  });
}
