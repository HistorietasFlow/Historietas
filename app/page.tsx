"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Children, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { useHistorietasLanguage } from "../components/HistorietasLanguageProvider";
import type { HistorietasLanguage } from "../lib/i18n";
import { supabase } from "../lib/supabase/client";
import { useNotificacoes } from "../components/NotificacoesProvider";
import { criarSlugBase, idObraSupabaseValido, normalizarTexto } from "../lib/utils";
import {
  historietasThemeCss,
  useHistorietasTheme,
} from "../lib/historietasTheme";
import { ehClassificacao18 } from "../lib/historietasAdultContent";
import { carregarMetricasConteudos } from "../lib/metricas";

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
  publicado?: boolean;
};

type Obra = {
  id?: string;
  titulo: string;
  autor: string;
  autorId?: string;
  genero: string;
  classificacaoIndicativa: string;
  status: string;
  views: string;
  likes: string;
  comentarios: string;
  link: string;
  disponivel: boolean;
  slug: string;
  formato: string;
  sinopse: string;
  tags: string[];
  capa?: string;
  capaUrl?: string;
  cover?: string;
  imagem?: string;
  capitulos?: CapituloLocal[];
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
  arquivoObra?: unknown;
  publicado: boolean;
  capitulos: CapituloLocal[];
  criadaEm: string;
  ultimoCapituloLidoId: string;
  ultimaLeituraEm: string;
  progressoLeitura: number;
  visualizacoes: number;
  totalCurtidas: number;
  totalComentarios: number;
  slug: string;
  link: string;
};

type SupabaseObraRow = {
  id: string;
  user_id: string;
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
  publicado: boolean | null;
  visualizacoes: number | null;
  slug: string | null;
  link: string | null;
  criada_em: string | null;
  atualizado_em: string | null;
};

type SupabaseCapituloRow = {
  id: string;
  obra_id: string;
  user_id: string | null;
  titulo: string | null;
  ordem: number | null;
  publicado: boolean | null;
  criado_em: string | null;
  atualizado_em: string | null;
};

type SupabaseProgressoLeituraHomeRow = {
  obra_id: string | null;
  capitulo_id: string | null;
  lido: boolean | null;
  atualizado_em: string | null;
};

type PerfilSupabaseHome = {
  userId: string;
  nome: string;
  avatar: string;
  bio: string;
};

type PerfilSupabaseHomeRow = {
  id: string | null;
  user_id: string | null;
  nome: string | null;
  avatar_url: string | null;
  bio: string | null;
  sobre_bio: string | null;
};

type PerfilAutorSalvo = {
  avatar: string;
  avatarNome: string;
  bio: string;
};

type PerfisAutoresSalvos = Record<string, PerfilAutorSalvo>;

type AutorHome = {
  chave: string;
  nome: string;
  autorId: string;
  avatar: string;
  bio: string;
  totalObras: number;
  totalCapitulos: number;
  totalCurtidas: number;
  totalComentarios: number;
  generos: string[];
  href: string;
};

type AvaliacaoAutorHome = {
  media: number;
  total: number;
};

type AvaliacoesAutoresHome = Record<string, AvaliacaoAutorHome>;

const STORAGE_KEY = "historietas-obras";
const FAVORITES_STORAGE_KEY = "historietas-obras-favoritas";
const COMPLETED_STORAGE_KEY = "historietas-obras-concluidas";
const AUTHOR_PROFILE_STORAGE_KEY = "historietas-perfis-autores";

const OBRAS_CATALOGO_HOME: Obra[] = [];

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

function traduzirTextoDinamicoHome(
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

function traduzirValorPreservandoEspacosHome(
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

function useHomePageTranslations(
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

const HERO_INICIAL_HOME = {
  titulo: "DESCUBRA NOVAS HISTÓRIAS",
  autor: "HISTORIETAS",
  genero: "Catálogo em formação",
  classificacaoIndicativa: "Leitores",
  sinopse:
    "O HISTORIETAS está formando seu catálogo inicial. Explore obras publicadas, acompanhe autores e publique sua história quando quiser.",
  status: "Catálogo aberto",
  slug: "inicio",
  formato: "Leitura online",
  tags: ["leitura", "autores", "histórias"],
  views: "",
  likes: "",
  comentarios: "",
  disponivel: false,
  link: "/explorar",
} as Obra & { link: string };

function formatarGeneroHome(genero: string) {
  const generoLimpo = genero.trim();
  const generoNormalizado = normalizarTexto(generoLimpo);

  if (generoNormalizado === "fantasia sombria") {
    return "Fantasia";
  }

  if (
    generoNormalizado === "sci-fi" ||
    generoNormalizado === "sci fi" ||
    generoNormalizado === "scifi" ||
    generoNormalizado === "cyberpunk"
  ) {
    return "Ficção";
  }

  return generoLimpo || "Não informado";
}



type HomeMetadataTranslation = {
  en: string;
  es: string;
};

const HOME_GENRE_TRANSLATIONS: Record<string, HomeMetadataTranslation> = {
  fantasia: { en: "Fantasy", es: "Fantasía" },
  terror: { en: "Horror", es: "Terror" },
  ficcao: { en: "Fiction", es: "Ficción" },
  romance: { en: "Romance", es: "Romance" },
  drama: { en: "Drama", es: "Drama" },
  acao: { en: "Action", es: "Acción" },
  misterio: { en: "Mystery", es: "Misterio" },
  suspense: { en: "Thriller", es: "Suspenso" },
  aventura: { en: "Adventure", es: "Aventura" },
  comedia: { en: "Comedy", es: "Comedia" },
};

const HOME_FORMAT_TRANSLATIONS: Record<string, HomeMetadataTranslation> = {
  webnovel: { en: "Web novel", es: "Novela web" },
  "light novel": { en: "Light novel", es: "Novela ligera" },
  romance: { en: "Novel", es: "Novela" },
  conto: { en: "Short story", es: "Cuento" },
  poesia: { en: "Poetry", es: "Poesía" },
  hq: { en: "Comics", es: "Cómic" },
  manga: { en: "Manga", es: "Manga" },
  fanfic: { en: "Fanfiction", es: "Fanfic" },
  historia: { en: "Story", es: "Historia" },
  "leitura online": { en: "Online reading", es: "Lectura en línea" },
};

function traduzirGeneroHome(
  genero: string,
  idioma: HistorietasLanguage
) {
  const generoFormatado = formatarGeneroHome(genero);

  if (idioma === "pt-BR") {
    return generoFormatado;
  }

  const traducao = HOME_GENRE_TRANSLATIONS[normalizarTexto(generoFormatado)];

  return traducao?.[idioma] || generoFormatado;
}

function traduzirFormatoHome(
  formato: string,
  idioma: HistorietasLanguage
) {
  const formatoLimpo = formato.trim() || "História";

  if (idioma === "pt-BR") {
    return formatoLimpo;
  }

  const traducao = HOME_FORMAT_TRANSLATIONS[normalizarTexto(formatoLimpo)];

  return traducao?.[idioma] || formatoLimpo;
}

function traduzirClassificacaoHome(
  classificacao: string,
  idioma: HistorietasLanguage
) {
  const classificacaoLimpa = classificacao.trim() || "Não informada";

  if (idioma === "pt-BR") {
    return classificacaoLimpa;
  }

  const classificacaoNormalizada = normalizarTexto(classificacaoLimpa);

  if (classificacaoNormalizada === "livre") {
    return idioma === "en" ? "All ages" : "Todo público";
  }

  if (classificacaoNormalizada === "leitores") {
    return idioma === "en" ? "Readers" : "Lectores";
  }

  if (
    classificacaoNormalizada === "nao informada" ||
    classificacaoNormalizada === "nao informado"
  ) {
    return idioma === "en" ? "Not provided" : "No informada";
  }

  const faixaEtaria = classificacaoLimpa.match(/^(10|12|14|16|18)(?:\s*anos|\+)?$/i);

  if (faixaEtaria) {
    return `${faixaEtaria[1]}+`;
  }

  return classificacaoLimpa;
}

function traduzirBioAutorHome(
  bio: string,
  idioma: HistorietasLanguage
) {
  if (idioma === "pt-BR") {
    return bio;
  }

  const correspondencia = bio.match(/^Autor de (.+) na Historietas\.$/i);

  if (!correspondencia) {
    return bio;
  }

  const generoTraduzido = traduzirGeneroHome(correspondencia[1], idioma)
    .toLocaleLowerCase(idioma === "en" ? "en" : "es");

  return idioma === "en"
    ? `Author of ${generoTraduzido} on Historietas.`
    : `Autor de ${generoTraduzido} en Historietas.`;
}

function criarLoginHrefHome() {
  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.pathname}${window.location.search}`
      : "/";
  const destinoSeguro =
    redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : "/";
  const params = new URLSearchParams({
    redirectTo: destinoSeguro,
  });

  return `/login?${params.toString()}`;
}

function criarHrefLeituraCapituloHome(
  obra: Pick<ObraLocal, "id" | "slug" | "titulo" | "publicado">,
  capitulo: CapituloLocal,
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
  )}&capituloId=${encodeURIComponent(capitulo.id)}`;
}

function criarHrefObraCatalogoHome(obra: Obra) {
  const obraComLink = obra as Obra & { link?: string; slug?: string };
  const linkObra = obraComLink.link?.trim();

  if (linkObra) {
    return linkObra;
  }

  if (!obra.disponivel) {
    return "/explorar";
  }

  const slugObra = obraComLink.slug?.trim() || criarSlugBase(obra.titulo);

  return `/obra/${slugObra}`;
}

function criarObraHeroLocalHome(obra: ObraLocal): Obra {
  return {
    id: obra.id,
    titulo: obra.titulo,
    autor: obra.autor,
    genero: formatarGeneroHome(obra.genero),
    formato: obra.formato || "História",
    classificacaoIndicativa: obra.classificacaoIndicativa,
    sinopse: obra.sinopse || "Nenhuma sinopse informada.",
    tags: obra.tags,
    status: obra.capitulos.length > 0 ? "Em andamento" : "Publicado",
    views: compactarNumeroHome(obra.visualizacoes || 0),
    likes: compactarNumeroHome(obterTotalCurtidasObraHome(obra)),
    comentarios: compactarNumeroHome(obterTotalComentariosObraHome(obra)),
    disponivel: true,
    capa: obra.capa,
    capaUrl: obra.capa,
    arquivoObra: obra.arquivoObra,
    slug: obra.slug,
    link: obra.link,
    capitulos: obra.capitulos,
  } as Obra & {
    id?: string;
    capa?: string;
    capaUrl?: string;
    slug?: string;
    link?: string;
    arquivoObra?: unknown;
    capitulos?: CapituloLocal[];
  };
}

function calcularProgressoLeitura(capitulos: CapituloLocal[]) {
  if (capitulos.length === 0) {
    return 0;
  }

  const capitulosLidos = capitulos.filter((capitulo) => capitulo.lido).length;

  return Math.round((capitulosLidos / capitulos.length) * 100);
}

function encontrarCapituloParaContinuar(obra: ObraLocal) {
  const temCapituloLido = obra.capitulos.some((capitulo) => capitulo.lido);

  if (!temCapituloLido) {
    return null;
  }

  const indiceUltimoCapituloLido = obra.ultimoCapituloLidoId
    ? obra.capitulos.findIndex(
        (capitulo) => capitulo.id === obra.ultimoCapituloLidoId
      )
    : -1;

  if (indiceUltimoCapituloLido >= 0) {
    const proximoCapituloNaoLido = obra.capitulos
      .slice(indiceUltimoCapituloLido + 1)
      .find((capitulo) => !capitulo.lido);

    if (proximoCapituloNaoLido) {
      return proximoCapituloNaoLido;
    }
  }

  return obra.capitulos.find((capitulo) => !capitulo.lido) || null;
}

function obraLocalCombinaBusca(obra: ObraLocal, termoBusca: string) {
  if (!termoBusca) {
    return true;
  }

  const textoObra = normalizarTexto(
    [
      obra.titulo,
      obra.autor,
      obra.genero,
      formatarGeneroHome(obra.genero),
      obra.formato,
      obra.classificacaoIndicativa,
      obra.sinopse,
      obra.tags.join(" "),
      obra.capaNome,
      obra.capitulos.map((capitulo) => capitulo.titulo).join(" "),
    ].join(" ")
  );

  return textoObra.includes(termoBusca);
}

function obterTempoUltimaLeitura(obra: ObraLocal) {
  const temposLeitura = [
    obra.ultimaLeituraEm,
    ...obra.capitulos
      .filter((capitulo) => capitulo.lido)
      .map((capitulo) => capitulo.lidoEm),
  ].map((dataLeitura) => {
    const tempo = new Date(dataLeitura).getTime();

    return Number.isNaN(tempo) ? 0 : tempo;
  });

  return Math.max(0, ...temposLeitura);
}


function criarMobileCoverStyle(capa: string): CSSProperties {
  if (!capa) {
    return coverPlaceholderStyle;
  }

  return {
    ...coverPlaceholderStyle,
    backgroundImage: `url(${capa})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

function obterImagemObraCatalogo(obra: Obra) {
  const obraComImagem = obra as Obra & {
    capa?: string;
    capaUrl?: string;
    cover?: string;
    imagem?: string;
  };

  return (
    [
      obraComImagem.capa,
      obraComImagem.capaUrl,
      obraComImagem.cover,
      obraComImagem.imagem,
    ].find((imagem): imagem is string => {
      return typeof imagem === "string" && Boolean(imagem.trim());
    }) || ""
  );
}

function obterFormatoObraCatalogoHome(obra: Obra) {
  const obraComFormato = obra as Obra & {
    formato?: string;
  };

  return obraComFormato.formato?.trim() || "História";
}

function obterTotalCapitulosObraCatalogoHome(obra: Obra) {
  const obraComCapitulos = obra as Obra & {
    capitulos?: unknown;
  };

  return Array.isArray(obraComCapitulos.capitulos)
    ? obraComCapitulos.capitulos.length
    : 0;
}

function obraCatalogoTemArquivoAnexadoHome(obra: Obra) {
  const obraComArquivo = obra as Obra & {
    arquivoObra?: unknown;
  };
  const arquivo = obraComArquivo.arquivoObra;

  if (!arquivo || typeof arquivo !== "object" || Array.isArray(arquivo)) {
    return false;
  }

  const arquivoValidado = arquivo as Record<string, unknown>;

  return Boolean(
    typeof arquivoValidado.nome === "string" &&
      arquivoValidado.nome.trim() &&
      typeof arquivoValidado.conteudo === "string" &&
      arquivoValidado.conteudo.trim(),
  );
}

function criarMobileCoverThumbStyle(obra: Obra): CSSProperties {
  const imagemObra = obterImagemObraCatalogo(obra);

  if (!imagemObra) {
    return coverThumbStyle;
  }

  return {
    ...coverThumbStyle,
    backgroundImage: `url(${imagemObra})`,
    backgroundSize: "cover",
    backgroundPosition: obra.disponivel ? "center" : "center top",
  };
}

function formatarSinopseHeroMobile(sinopse: string | undefined) {
  const textoBase = String(sinopse || "Nenhuma sinopse informada.")
    .replace(/\s+/g, " ")
    .trim();

  if (!textoBase) {
    return "Nenhuma sinopse informada.";
  }

  const textoComPalavrasSeguras = textoBase
    .split(" ")
    .map((palavra) => {
      if (palavra.length <= 18) {
        return palavra;
      }

      return `${palavra.slice(0, 16)}…`;
    })
    .join(" ");

  if (textoComPalavrasSeguras.length <= 132) {
    return textoComPalavrasSeguras;
  }

  return `${textoComPalavrasSeguras.slice(0, 129).trim()}…`;
}

function obterIdentificadorFavoritoHome(obra: Obra) {
  const obraComIdentificador = obra as Obra & {
    id?: string;
    slug?: string;
  };

  return (
    obraComIdentificador.id?.trim() ||
    obraComIdentificador.slug?.trim() ||
    criarSlugBase(obra.titulo)
  );
}

function criarFavoritosNormalizadosHome(obrasFavoritas: string[]) {
  return new Set(
    obrasFavoritas
      .map((favorito) => favorito.trim())
      .filter(Boolean)
  );
}

function normalizarListaIdsHome(lista: string[]) {
  return Array.from(
    new Set(
      lista
        .map((item) => item.trim())
        .filter((item) => Boolean(item))
    )
  );
}

function criarStorageKeyUsuarioHome(chave: string, userId: string) {
  const userIdLimpo = userId.trim();

  return userIdLimpo ? `${chave}:${userIdLimpo}` : "";
}

function lerStorageUsuarioHome(chave: string, userId = "") {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return null;
  }

  try {
    const chaveStorage = criarStorageKeyUsuarioHome(chave, userIdLimpo);

    return chaveStorage ? localStorage.getItem(chaveStorage) : null;
  } catch {
    return null;
  }
}

function salvarJsonStorageUsuarioHome(
  chave: string,
  userId: string,
  valor: unknown
) {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return;
  }

  try {
    const chaveStorage = criarStorageKeyUsuarioHome(chave, userIdLimpo);

    if (!chaveStorage) {
      return;
    }

    localStorage.setItem(chaveStorage, JSON.stringify(valor));
  } catch {
    // A Home continua funcionando mesmo se o navegador bloquear o localStorage.
  }
}

function carregarListaIdsHome(chave: string, userId: string, fallback: string[] = []) {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return [] as string[];
  }

  try {
    const listaTexto = lerStorageUsuarioHome(chave, userIdLimpo);
    const listaJson: unknown = listaTexto ? JSON.parse(listaTexto) : [];
    const listaSalva = Array.isArray(listaJson)
      ? listaJson.filter((id): id is string => typeof id === "string")
      : [];

    return normalizarListaIdsHome([...fallback, ...listaSalva]);
  } catch {
    return normalizarListaIdsHome(fallback);
  }
}

function salvarListaIdsHome(chave: string, userId: string, lista: string[]) {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return;
  }

  const listaNormalizada = normalizarListaIdsHome(lista);

  salvarJsonStorageUsuarioHome(chave, userIdLimpo, listaNormalizada);
}

function criarIdentificadoresObraLocalHome(
  obra: Pick<ObraLocal, "id" | "slug" | "titulo">
) {
  return normalizarListaIdsHome([
    obra.id,
    obra.slug,
    criarSlugBase(obra.titulo),
    normalizarTexto(obra.titulo),
  ]);
}

function criarIdentificadoresObraCatalogoHome(obra: Obra) {
  const obraComIdentificador = obra as Obra & {
    id?: string;
    slug?: string;
  };

  return normalizarListaIdsHome([
    obraComIdentificador.id?.trim() || "",
    obraComIdentificador.slug?.trim() || "",
    criarSlugBase(obra.titulo),
    normalizarTexto(obra.titulo),
  ]);
}

function colecaoTemIdentificadorHome(identificadores: string[], colecao: string[]) {
  const colecaoNormalizada = criarFavoritosNormalizadosHome(colecao);

  return identificadores.some((identificador) =>
    colecaoNormalizada.has(identificador)
  );
}

function removerIdentificadoresDaListaHome(lista: string[], identificadores: string[]) {
  const identificadoresParaRemover = new Set(identificadores);

  return normalizarListaIdsHome(
    lista.filter((item) => !identificadoresParaRemover.has(item.trim()))
  );
}

function obraLocalEstaNaMinhaLista(obra: ObraLocal, obrasFavoritas: string[]) {
  return colecaoTemIdentificadorHome(
    criarIdentificadoresObraLocalHome(obra),
    obrasFavoritas
  );
}

function obraCatalogoEstaNaMinhaLista(obra: Obra, obrasFavoritas: string[]) {
  return colecaoTemIdentificadorHome(
    criarIdentificadoresObraCatalogoHome(obra),
    obrasFavoritas
  );
}

function obraCatalogoCombinaBuscaHome(obra: Obra, termoBusca: string) {
  if (!termoBusca) {
    return true;
  }

  const textoObra = normalizarTexto(
    [
      obra.titulo,
      obra.autor,
      obra.genero,
      formatarGeneroHome(obra.genero),
      obra.classificacaoIndicativa,
      obra.status,
    ].join(" ")
  );

  return textoObra.includes(termoBusca);
}

function obterTemasRecomendacaoObra(obra: ObraLocal) {
  return Array.from(
    new Set(
      [
        obra.genero,
        formatarGeneroHome(obra.genero),
        obra.formato,
        ...obra.tags,
      ]
        .map((tema) => normalizarTexto(tema))
        .filter((tema) => tema && tema !== "sem tags" && tema !== "nao informado")
    )
  );
}

function obterTemasRecomendacaoObraCatalogo(obra: Obra) {
  return Array.from(
    new Set(
      [
        obra.genero,
        formatarGeneroHome(obra.genero),
        obra.status,
        obra.classificacaoIndicativa,
      ]
        .map((tema) => normalizarTexto(tema))
        .filter((tema) => tema && tema !== "nao informado")
    )
  );
}

function obraCombinaComTemasRecomendados(obra: ObraLocal, temas: Set<string>) {
  if (temas.size === 0) {
    return false;
  }

  return obterTemasRecomendacaoObra(obra).some((tema) => temas.has(tema));
}

function obraCatalogoCombinaComTemasRecomendados(obra: Obra, temas: Set<string>) {
  if (temas.size === 0) {
    return false;
  }

  return obterTemasRecomendacaoObraCatalogo(obra).some((tema) =>
    temas.has(tema)
  );
}

function criarDesktopHeroPosterStyle(obra: Obra): CSSProperties {
  const imagemObra = obterImagemObraCatalogo(obra);

  if (imagemObra) {
    return {
      ...desktopHeroPosterStyle,
      backgroundImage: `url(${imagemObra})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  }

  return {
    ...desktopHeroPosterStyle,
    backgroundImage:
      "linear-gradient(145deg, #050505 0%, #0B0B0D 52%, #000000 100%)",
  };
}


function criarMobileHeroFrameBackground(): CSSProperties {
  return {
    ...heroStyle,
    backgroundColor: "#000000",
    backgroundImage: "linear-gradient(145deg, #000000 0%, #050505 58%, #0B0B0D 100%)",
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

function criarMobileHeroImageLayerStyle(obra: Obra): CSSProperties {
  const imagemObra = obterImagemObraCatalogo(obra);
  const imagemOuFallback = imagemObra
    ? `url(${imagemObra})`
    : "linear-gradient(145deg, #050505 0%, #0B0B0D 58%, #000000 100%)";

  return {
    position: "absolute",
    zIndex: 0,
    inset: "5px",
    borderRadius: "24px",
    backgroundImage: imagemOuFallback,
    backgroundSize: "cover",
    backgroundPosition: obra.disponivel ? "center" : "center top",
    pointerEvents: "none",
  };
}

function criarDecoracaoHomeStyle(): CSSProperties {
  return {
    display: "none",
  };
}

function contarCurtidasObraLocal(obra: ObraLocal) {
  return obra.capitulos.filter((capitulo) => capitulo.curtiu).length;
}

function contarComentariosObraLocal(obra: ObraLocal) {
  return obra.capitulos.filter((capitulo) => capitulo.comentario.trim()).length;
}

function normalizarNumeroHome(valor: unknown, fallback = 0) {
  if (typeof valor === "number" && Number.isFinite(valor)) {
    return Math.max(0, Math.round(valor));
  }

  if (typeof valor === "string" && valor.trim()) {
    const numero = Number(valor.replace(/\./g, "").replace(",", "."));

    if (Number.isFinite(numero)) {
      return Math.max(0, Math.round(numero));
    }
  }

  return fallback;
}

function obterLocaleHomeAtual() {
  if (typeof document === "undefined") {
    return {
      locale: "pt-BR",
      language: "pt-BR" as HistorietasLanguage,
    };
  }

  const language = document.documentElement.lang;

  if (language === "en" || language.toLowerCase().startsWith("en-")) {
    return {
      locale: "en-US",
      language: "en" as HistorietasLanguage,
    };
  }

  if (language === "es" || language.toLowerCase().startsWith("es-")) {
    return {
      locale: "es-ES",
      language: "es" as HistorietasLanguage,
    };
  }

  return {
    locale: "pt-BR",
    language: "pt-BR" as HistorietasLanguage,
  };
}

function compactarNumeroHome(valor: number) {
  const numero = Math.max(0, Math.round(valor));
  const { locale, language } = obterLocaleHomeAtual();

  if (numero >= 1000000) {
    const numeroCompactado = (numero / 1000000).toLocaleString(locale, {
      maximumFractionDigits: 1,
    });

    if (language === "en") {
      return `${numeroCompactado}M`;
    }

    if (language === "es") {
      return `${numeroCompactado} M`;
    }

    return `${numeroCompactado} mi`;
  }

  if (numero >= 1000) {
    const numeroCompactado = (numero / 1000).toLocaleString(locale, {
      maximumFractionDigits: 1,
    });

    if (language === "en") {
      return `${numeroCompactado}K`;
    }

    return `${numeroCompactado} mil`;
  }

  return numero.toLocaleString(locale);
}

function formatarMediaAvaliacaoAutorHome(
  avaliacao: AvaliacaoAutorHome | undefined
) {
  if (
    !avaliacao ||
    avaliacao.total <= 0 ||
    !Number.isFinite(avaliacao.media) ||
    avaliacao.media <= 0
  ) {
    return "—";
  }

  return avaliacao.media.toLocaleString(obterLocaleHomeAtual().locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
}

function obterTotalCurtidasObraHome(obra: ObraLocal) {
  return Math.max(obra.totalCurtidas || 0, contarCurtidasObraLocal(obra));
}

function obterTotalComentariosObraHome(obra: ObraLocal) {
  return Math.max(obra.totalComentarios || 0, contarComentariosObraLocal(obra));
}

function obterTempoUltimoCapitulo(obra: ObraLocal) {
  const ultimoCapitulo = obra.capitulos[obra.capitulos.length - 1] || null;
  const dataReferencia = ultimoCapitulo?.criadoEm || obra.criadaEm;
  const tempo = new Date(dataReferencia).getTime();

  return Number.isNaN(tempo) ? 0 : tempo;
}

function obraTemArquivoAnexado(obra: ObraLocal) {
  const arquivo = obra.arquivoObra;

  if (!arquivo || typeof arquivo !== "object" || Array.isArray(arquivo)) {
    return false;
  }

  const arquivoValidado = arquivo as Record<string, unknown>;

  return Boolean(
    typeof arquivoValidado.nome === "string" &&
      arquivoValidado.nome.trim() &&
      typeof arquivoValidado.conteudo === "string" &&
      arquivoValidado.conteudo.trim()
  );
}

function obraTemConteudoPublicoHome(obra: ObraLocal) {
  return obra.capitulos.length > 0 || obraTemArquivoAnexado(obra);
}

function obraCatalogoCombinaTemas(obra: Obra, temas: string[]) {
  const textoObra = normalizarTexto(
    [
      obra.titulo,
      obra.autor,
      obra.genero,
      formatarGeneroHome(obra.genero),
      obra.status,
    ].join(" ")
  );

  return temas.some((tema) => textoObra.includes(normalizarTexto(tema)));
}

function normalizarChaveAutor(nome: string) {
  return normalizarTexto(nome).replace(/\s+/g, " ").trim();
}

function criarIniciaisAutor(nome: string) {
  const partes = nome
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (partes.length === 0) {
    return "H";
  }

  return partes
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase();
}

function normalizarPerfilAutorSalvo(valor: unknown): PerfilAutorSalvo | null {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) {
    return null;
  }

  const perfil = valor as Record<string, unknown>;

  return {
    avatar: typeof perfil.avatar === "string" ? perfil.avatar : "",
    avatarNome: typeof perfil.avatarNome === "string" ? perfil.avatarNome : "",
    bio: typeof perfil.bio === "string" ? perfil.bio : "",
  };
}

function normalizarPerfisAutoresSalvos(valor: unknown): PerfisAutoresSalvos {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) {
    return {};
  }

  const perfis = valor as Record<string, unknown>;

  return Object.entries(perfis).reduce<PerfisAutoresSalvos>(
    (perfisNormalizados, [chave, perfil]) => {
      const perfilNormalizado = normalizarPerfilAutorSalvo(perfil);

      if (perfilNormalizado) {
        perfisNormalizados[chave] = perfilNormalizado;
      }

      return perfisNormalizados;
    },
    {}
  );
}

function encontrarPerfilAutor(
  perfisAutores: PerfisAutoresSalvos,
  nomeAutor: string
) {
  const chaveNormalizada = normalizarChaveAutor(nomeAutor);
  const chaveSimples = nomeAutor.trim().replace(/\s+/g, " ").toLowerCase();

  return (
    perfisAutores[chaveNormalizada] ||
    perfisAutores[chaveSimples] ||
    perfisAutores[nomeAutor] ||
    Object.entries(perfisAutores).find(([chave]) => {
      return normalizarChaveAutor(chave) === chaveNormalizada;
    })?.[1] ||
    null
  );
}

function criarBioAutorPadrao(nomeAutor: string, generos: string[]) {
  const generoPrincipal = formatarGeneroHome(generos[0] || "histórias");

  return `Autor de ${generoPrincipal.toLowerCase()} na Historietas.`;
}

function criarHrefPerfilAutorHome(nomeAutor: string, autorId = "") {
  const nomeAutorLimpo = nomeAutor.trim();
  const autorIdLimpo = autorId.trim();
  const parametros = new URLSearchParams();

  if (nomeAutorLimpo) {
    parametros.set("autor", nomeAutorLimpo);
  }

  if (autorIdLimpo) {
    parametros.set("autorId", autorIdLimpo);
    parametros.set("userId", autorIdLimpo);
  }

  const query = parametros.toString();

  return query ? `/perfil-autor?${query}` : "/perfil-autor";
}

function obterValorTextoPerfilHome(...valores: Array<string | null | undefined>) {
  return (
    valores
      .find((valor) => typeof valor === "string" && Boolean(valor.trim()))
      ?.trim() || ""
  );
}

function normalizarPerfilSupabaseHome(
  perfil: PerfilSupabaseHomeRow
): PerfilSupabaseHome | null {
  const userId = obterValorTextoPerfilHome(perfil.user_id, perfil.id);
  const nome = obterValorTextoPerfilHome(perfil.nome);

  if (!userId || !nome) {
    return null;
  }

  return {
    userId,
    nome,
    avatar: obterValorTextoPerfilHome(perfil.avatar_url),
    bio: obterValorTextoPerfilHome(perfil.bio, perfil.sobre_bio),
  };
}

function carregarPerfisAutoresHomeSalvos(userId = "") {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo) {
    return {};
  }

  try {
    const perfisAutoresTexto = lerStorageUsuarioHome(
      AUTHOR_PROFILE_STORAGE_KEY,
      userIdLimpo
    );
    const perfisAutoresJson: unknown = perfisAutoresTexto
      ? JSON.parse(perfisAutoresTexto)
      : {};

    return normalizarPerfisAutoresSalvos(perfisAutoresJson);
  } catch {
    return {};
  }
}

function salvarPerfisSupabaseHomeNoStorage(
  perfis: PerfilSupabaseHome[],
  userId = ""
) {
  const userIdLimpo = userId.trim();

  if (perfis.length === 0 || !userIdLimpo) {
    return;
  }

  try {
    const perfisSalvos = carregarPerfisAutoresHomeSalvos(userIdLimpo);
    const perfisAtualizados: PerfisAutoresSalvos = { ...perfisSalvos };

    perfis.forEach((perfil) => {
      const perfilAutor: PerfilAutorSalvo = {
        avatar: perfil.avatar,
        avatarNome: "",
        bio: perfil.bio,
      };
      const chaves = [
        perfil.userId,
        perfil.nome,
        normalizarChaveAutor(perfil.nome),
        perfil.nome.trim().replace(/\s+/g, " ").toLowerCase(),
      ];

      chaves.forEach((chave) => {
        const chaveLimpa = chave.trim();

        if (chaveLimpa) {
          perfisAtualizados[chaveLimpa] = perfilAutor;
        }
      });
    });

    salvarJsonStorageUsuarioHome(
      AUTHOR_PROFILE_STORAGE_KEY,
      userIdLimpo,
      perfisAtualizados
    );
  } catch {
    // Profiles são apoio visual. A Home continua funcionando com os dados da obra.
  }
}

async function carregarPerfisSupabaseHome(autorIds: string[], userId = "") {
  const idsUnicos = Array.from(
    new Set(
      autorIds
        .map((autorId) => autorId.trim())
        .filter(Boolean)
    )
  );
  const perfisPorUsuario = new Map<string, PerfilSupabaseHome>();

  if (idsUnicos.length === 0) {
    return perfisPorUsuario;
  }

  const linhas: PerfilSupabaseHomeRow[] = [];

  try {
    const { data, error } = await supabase
      .from("profiles_publicos")
      .select("id, user_id, nome, avatar_url, bio, sobre_bio")
      .in("user_id", idsUnicos)
      .limit(1000);

    if (error) {
      console.warn("Não consegui carregar profiles da Home por user_id:", error.message);
    } else if (Array.isArray(data)) {
      linhas.push(...data);
    }
  } catch (error) {
    console.warn("Não consegui acessar profiles da Home por user_id:", error);
  }

  try {
    const { data, error } = await supabase
      .from("profiles_publicos")
      .select("id, user_id, nome, avatar_url, bio, sobre_bio")
      .in("id", idsUnicos)
      .limit(1000);

    if (error) {
      console.warn("Não consegui carregar profiles da Home por id:", error.message);
    } else if (Array.isArray(data)) {
      linhas.push(...data);
    }
  } catch (error) {
    console.warn("Não consegui acessar profiles da Home por id:", error);
  }

  const perfisNormalizados = linhas
    .map((perfil) => normalizarPerfilSupabaseHome(perfil))
    .filter((perfil): perfil is PerfilSupabaseHome => Boolean(perfil));

  perfisNormalizados.forEach((perfil) => {
    perfisPorUsuario.set(perfil.userId, perfil);
  });

  linhas.forEach((linha) => {
    const perfil = normalizarPerfilSupabaseHome(linha);

    if (!perfil) {
      return;
    }

    [linha.user_id, linha.id].forEach((chave) => {
      const chaveLimpa = chave?.trim() || "";

      if (chaveLimpa) {
        perfisPorUsuario.set(chaveLimpa, perfil);
      }
    });
  });

  salvarPerfisSupabaseHomeNoStorage(perfisNormalizados, userId);

  return perfisPorUsuario;
}


function criarAutorHome(
  nomeAutor: string,
  autorId: string,
  generos: string[],
  totalObras: number,
  totalCapitulos: number,
  totalCurtidas: number,
  totalComentarios: number,
  perfisAutores: PerfisAutoresSalvos
): AutorHome {
  const perfil = encontrarPerfilAutor(perfisAutores, nomeAutor);
  const generosUnicos = Array.from(
    new Set(
      generos
        .filter((genero) => Boolean(genero.trim()))
        .map((genero) => formatarGeneroHome(genero))
    )
  );
  const bioPerfil = perfil?.bio.trim() || "";

  return {
    chave: autorId.trim() || normalizarChaveAutor(nomeAutor),
    nome: nomeAutor.trim() || "Autor não informado",
    autorId: autorId.trim(),
    avatar: perfil?.avatar.trim() || "",
    bio: bioPerfil || criarBioAutorPadrao(nomeAutor, generosUnicos),
    totalObras,
    totalCapitulos,
    totalCurtidas,
    totalComentarios,
    generos: generosUnicos.slice(0, 2),
    href: criarHrefPerfilAutorHome(nomeAutor, autorId),
  };
}

function normalizarCapituloHome(
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
    curtiu: Boolean(capitulo.curtiu),
    salvo: Boolean(capitulo.salvo),
    comentario:
      typeof capitulo.comentario === "string" ? capitulo.comentario : "",
    criadoEm: typeof capitulo.criadoEm === "string" ? capitulo.criadoEm : "",
    lido: Boolean(capitulo.lido),
    lidoEm: typeof capitulo.lidoEm === "string" ? capitulo.lidoEm : "",
    publicado: capitulo.publicado !== false,
  };
}

function normalizarObraHome(
  obra: Partial<ObraLocal> & Record<string, unknown>,
  index: number
): ObraLocal {
  const capitulosNormalizadosTodos: CapituloLocal[] = Array.isArray(obra.capitulos)
    ? obra.capitulos.map((capitulo, capituloIndex) =>
        normalizarCapituloHome(
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
    arquivoObra: obra.arquivoObra,
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
    visualizacoes: normalizarNumeroHome(
      obra.visualizacoes ??
        obra.views ??
        obra.visualizacoesTotal ??
        obra.totalVisualizacoes ??
        obra.total_visualizacoes,
    ),
    totalCurtidas: normalizarNumeroHome(
      obra.totalCurtidas ??
        obra.curtidas ??
        obra.likes ??
        obra.totalLikes ??
        obra.total_curtidas,
      capitulosNormalizados.filter((capitulo) => capitulo.curtiu).length,
    ),
    totalComentarios: normalizarNumeroHome(
      obra.totalComentarios ??
        obra.comentarios ??
        obra.totalComments ??
        obra.total_comentarios,
      capitulosNormalizados.filter((capitulo) =>
        capitulo.comentario.trim(),
      ).length,
    ),
    slug,
    link:
      typeof obra.link === "string" && obra.link.trim()
        ? obra.link.trim()
        : `/obra/${slug}`,
  };
}

function normalizarObrasHomeSalvas(valor: unknown) {
  if (!Array.isArray(valor)) {
    return [];
  }

  return valor
    .map((obra, index) =>
      normalizarObraHome(
        obra as Partial<ObraLocal> & Record<string, unknown>,
        index
      )
    )
    .filter((obra) => obra.publicado && obraTemConteudoPublicoHome(obra));
}

function normalizarCategoriaArquivoHome(categoria: string | null) {
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

function criarArquivoObraSupabaseHome(obra: SupabaseObraRow) {
  const arquivoUrl = obra.arquivo_url?.trim() || "";

  if (!arquivoUrl) {
    return null;
  }

  const categoriaArquivo = normalizarCategoriaArquivoHome(
    obra.arquivo_categoria
  );
  const tipoArquivo =
    obra.arquivo_tipo?.trim() ||
    (categoriaArquivo === "documento"
      ? "application/pdf"
      : categoriaArquivo === "imagem"
      ? "image/*"
      : categoriaArquivo === "texto"
      ? "text/plain"
      : "");

  return {
    nome: obra.arquivo_nome?.trim() || "Arquivo da obra",
    tipo: tipoArquivo,
    tamanho:
      typeof obra.arquivo_tamanho === "number" &&
      Number.isFinite(obra.arquivo_tamanho)
        ? obra.arquivo_tamanho
        : 0,
    conteudo: arquivoUrl,
    categoria: categoriaArquivo,
    criadoEm: obra.criada_em || "",
  };
}

function normalizarObraSupabaseHome(
  obra: SupabaseObraRow,
  capitulosSupabase: SupabaseCapituloRow[],
  obraLocal: ObraLocal | undefined,
  index: number
): ObraLocal {
  const capitulosLocaisPorId = new Map(
    (obraLocal?.capitulos || []).map((capitulo) => [capitulo.id, capitulo])
  );

  const capitulosOrdenados = [...capitulosSupabase].sort((capituloA, capituloB) => {
    return (capituloA.ordem ?? 0) - (capituloB.ordem ?? 0);
  });

  const capitulosRemotos = capitulosOrdenados.map((capitulo, capituloIndex) => {
    const capituloLocal = capitulosLocaisPorId.get(capitulo.id);

    return {
      id: capitulo.id,
      titulo:
        capitulo.titulo?.trim() ||
        `Capítulo ${capituloIndex + 1}`,
      texto: "",
      curtiu: Boolean(capituloLocal?.curtiu),
      salvo: Boolean(capituloLocal?.salvo),
      comentario: capituloLocal?.comentario || "",
      criadoEm: capitulo.criado_em || "",
      lido: Boolean(capituloLocal?.lido),
      lidoEm: capituloLocal?.lidoEm || "",
      publicado: true,
    } satisfies CapituloLocal;
  });

  const capitulosMesclados = capitulosRemotos;

  const tituloObra = obra.titulo?.trim() || "Obra sem título";
  const slugObra =
    obra.slug?.trim() ||
    criarSlugBase(tituloObra || `obra-${index + 1}`);

  return {
    id: obra.id || `obra-${index + 1}`,
    titulo: tituloObra,
    autor: obra.autor?.trim() || "Autor não informado",
    autorId: obra.user_id?.trim() || "",
    genero: obra.genero?.trim() || "Não informado",
    formato: obra.formato?.trim() || "Não informado",
    classificacaoIndicativa:
      obra.classificacao_indicativa?.trim() ||
      "Não informada",
    sinopse:
      obra.sinopse?.trim() ||
      "Nenhuma sinopse informada.",
    tags:
      Array.isArray(obra.tags) && obra.tags.length > 0
        ? obra.tags.filter((tag) => typeof tag === "string" && Boolean(tag.trim()))
        : ["sem tags"],
    capa: obra.capa_url?.trim() || "",
    capaNome: obra.capa_nome?.trim() || "",
    arquivoObra: criarArquivoObraSupabaseHome(obra),
    publicado: Boolean(obra.publicado),
    capitulos: capitulosMesclados,
    criadaEm: obra.criada_em || "",
    ultimoCapituloLidoId: obraLocal?.ultimoCapituloLidoId || "",
    ultimaLeituraEm: obraLocal?.ultimaLeituraEm || "",
    progressoLeitura: calcularProgressoLeitura(capitulosMesclados),
    visualizacoes: normalizarNumeroHome(obra.visualizacoes),
    totalCurtidas: capitulosMesclados.filter((capitulo) => capitulo.curtiu).length,
    totalComentarios: capitulosMesclados.filter((capitulo) =>
      capitulo.comentario.trim(),
    ).length,
    slug: slugObra,
    link: obra.link?.trim() || `/obra/${slugObra}`,
  };
}

function aplicarProgressoLeituraHome(
  obra: ObraLocal,
  progressoPorCapitulo: Map<string, SupabaseProgressoLeituraHomeRow>,
  progressoCarregado: boolean
) {
  if (!progressoCarregado) {
    return obra;
  }

  let ultimoCapituloLidoId = "";
  let ultimaLeituraEm = "";

  const capitulos = obra.capitulos.map((capitulo) => {
    const registro = progressoPorCapitulo.get(capitulo.id);
    const lido = Boolean(registro?.lido);
    const lidoEmRemoto =
      typeof registro?.atualizado_em === "string"
        ? registro.atualizado_em
        : "";
    const lidoEm = lido ? lidoEmRemoto || capitulo.lidoEm : "";

    if (lido) {
      const tempoAtual = new Date(lidoEm).getTime();
      const tempoUltimaLeitura = new Date(ultimaLeituraEm).getTime();
      const tempoAtualSeguro = Number.isNaN(tempoAtual) ? 0 : tempoAtual;
      const tempoUltimaLeituraSeguro = Number.isNaN(tempoUltimaLeitura)
        ? 0
        : tempoUltimaLeitura;

      if (
        !ultimoCapituloLidoId ||
        tempoAtualSeguro >= tempoUltimaLeituraSeguro
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
}

async function carregarObrasSupabaseHome(obrasLocais: ObraLocal[], userId = "") {
  try {
    const { data: obrasBanco, error: erroObras } = await supabase
      .from("obras")
      .select(
        "id, user_id, titulo, autor, genero, formato, classificacao_indicativa, sinopse, tags, capa_url, capa_nome, arquivo_url, arquivo_nome, arquivo_tipo, arquivo_tamanho, arquivo_categoria, publicado, visualizacoes, slug, link, criada_em, atualizado_em"
      )
      .eq("publicado", true)
      .order("criada_em", { ascending: false })
      .limit(80);

    if (erroObras) {
      console.warn(
        "Não consegui carregar obras da Home no Supabase:",
        erroObras.message
      );
      return obrasLocais;
    }

    const obrasSupabase = obrasBanco || [];

    if (obrasSupabase.length === 0) {
      return obrasLocais;
    }

    const perfisAutoresSupabase = await carregarPerfisSupabaseHome(
      obrasSupabase
        .map((obra) => obra.user_id || "")
        .filter(Boolean),
      userId
    );

    const obrasIds = obrasSupabase
      .map((obra) => obra.id)
      .filter((id): id is string => typeof id === "string" && Boolean(id.trim()));

    const capitulosPorObraId = new Map<string, SupabaseCapituloRow[]>();

    if (obrasIds.length > 0) {
      const { data: capitulosBanco, error: erroCapitulos } = await supabase
        .from("capitulos")
        .select("id, obra_id, user_id, titulo, ordem, publicado, criado_em, atualizado_em")
        .in("obra_id", obrasIds)
        .eq("publicado", true)
        .order("ordem", { ascending: true })
        .limit(600);

      if (erroCapitulos) {
        console.warn(
          "Não consegui carregar capítulos da Home no Supabase:",
          erroCapitulos.message
        );
      } else {
        (capitulosBanco || []).forEach((capitulo) => {
          const capitulosDaObra = capitulosPorObraId.get(capitulo.obra_id) || [];
          capitulosDaObra.push(capitulo);
          capitulosPorObraId.set(capitulo.obra_id, capitulosDaObra);
        });
      }
    }

    const capituloParaObraId = new Map<string, string>();
    const progressoPorCapituloId =
      new Map<string, SupabaseProgressoLeituraHomeRow>();

    capitulosPorObraId.forEach((capitulosDaObra, obraId) => {
      capitulosDaObra.forEach((capitulo) => {
        if (capitulo.id) {
          capituloParaObraId.set(capitulo.id, obraId);
        }
      });
    });

    const capituloIdsPublicados = Array.from(capituloParaObraId.keys());
    const userIdLimpo = userId.trim();
    const metricas = await carregarMetricasConteudos({
      obraIds: obrasIds,
      capituloIds: capituloIdsPublicados,
    });
    const progressoHomeCarregado = metricas.carregado && Boolean(userIdLimpo);

    if (progressoHomeCarregado) {
      metricas.capitulos.forEach((metrica) => {
        if (!metrica.usuario.leu) {
          return;
        }

        progressoPorCapituloId.set(metrica.id, {
          obra_id: metrica.obraId,
          capitulo_id: metrica.id,
          lido: true,
          atualizado_em: metrica.usuario.lidoEm,
        });
      });
    }

    const obrasRemotas = obrasSupabase.map((obra, index) => {
      const obraLocal = obrasLocais.find((obraLocalAtual) => {
        const slugLocal = obraLocalAtual.slug || criarSlugBase(obraLocalAtual.titulo);
        const slugBanco = obra.slug?.trim() || "";

        return obraLocalAtual.id === obra.id || (slugBanco && slugLocal === slugBanco);
      });

      const perfilAutor = perfisAutoresSupabase.get(obra.user_id || "");
      const obraComAutorProfile: SupabaseObraRow = perfilAutor?.nome
        ? {
            ...obra,
            autor: perfilAutor.nome,
          }
        : obra;

      const obraNormalizada = aplicarProgressoLeituraHome(
        normalizarObraSupabaseHome(
          obraComAutorProfile,
          capitulosPorObraId.get(obra.id) || [],
          obraLocal,
          index
        ),
        progressoPorCapituloId,
        progressoHomeCarregado
      );
      const metrica = metricas.obras.get(obra.id);

      return {
        ...obraNormalizada,
        totalCurtidas: Math.max(
          obraNormalizada.totalCurtidas,
          metrica?.audiencia.curtidoresUnicos || 0,
        ),
        totalComentarios: Math.max(
          obraNormalizada.totalComentarios,
          metrica?.audiencia.comentaristasUnicos || 0,
        ),
      };
    });

    const idsRemotos = new Set(obrasRemotas.map((obra) => obra.id));
    const slugsRemotos = new Set(
      obrasRemotas.map((obra) => obra.slug || criarSlugBase(obra.titulo))
    );

    const obrasApenasLocais = obrasLocais.filter((obraLocalAtual) => {
      const slugLocal = obraLocalAtual.slug || criarSlugBase(obraLocalAtual.titulo);

      return !idsRemotos.has(obraLocalAtual.id) && !slugsRemotos.has(slugLocal);
    });

    const obrasAtualizadas = [...obrasRemotas, ...obrasApenasLocais].filter(
      (obra) => obra.publicado && obraTemConteudoPublicoHome(obra)
    );

    return obrasAtualizadas;
  } catch (error) {
    console.warn("Não consegui acessar o Supabase na Home:", error);
    return obrasLocais;
  }
}

async function carregarIdsColecaoUsuarioHome(
  tabela: "favoritos" | "concluidas",
  userId: string
) {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo) {
    return [] as string[];
  }

  try {
    const { data, error } = await supabase
      .from(tabela)
      .select("obra_id")
      .eq("user_id", userIdLimpo)
      .limit(1000);

    if (error || !Array.isArray(data)) {
      return [] as string[];
    }

    return normalizarListaIdsHome(
      data
        .map((registro: unknown) => {
          if (!registro || typeof registro !== "object" || Array.isArray(registro)) {
            return "";
          }

          const obraId = (registro as { obra_id?: unknown }).obra_id;

          return typeof obraId === "string" ? obraId : "";
        })
        .filter(Boolean)
    );
  } catch {
    return [] as string[];
  }
}

async function sincronizarColecaoObraHome(
  tabela: "favoritos" | "concluidas",
  obraId: string,
  ativo: boolean
) {
  try {
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id || "";

    if (!userId || !idObraSupabaseValido(obraId)) {
      return false;
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
      return true;
    }

    const payloadBase = {
      user_id: userId,
      obra_id: obraId,
    };

    const { error: erroComVisibilidade } = await supabase.from(tabela).insert({
      ...payloadBase,
      visibilidade: "parcial",
    });

    if (!erroComVisibilidade) {
      return true;
    }

    const { error: erroSemVisibilidade } = await supabase
      .from(tabela)
      .insert(payloadBase);

    if (erroSemVisibilidade) {
      throw erroSemVisibilidade;
    }

    return true;
  } catch (error) {
    console.warn(`Não consegui sincronizar ${tabela} na Home:`, error);
    return false;
  }
}

async function registrarAtividadeDiarioHome({
  userId,
  tipo,
  obra,
  texto,
}: {
  userId: string;
  tipo: "favoritou_obra" | "concluiu_obra";
  obra: ObraLocal;
  texto: string;
}) {
  if (!userId.trim() || !idObraSupabaseValido(obra.id)) {
    return;
  }

  try {
    await supabase.from("diario_atividades").insert({
      user_id: userId,
      tipo,
      obra_id: obra.id,
      texto: texto.trim() || null,
      visibilidade: "parcial",
      metadata: {
        obra_titulo: obra.titulo,
        obra_slug: obra.slug,
        autor: obra.autor,
        origem: "home",
      },
    });
  } catch {
    // A Home não deve travar se o Diário não registrar a atividade.
  }
}

function encontrarObraLocalPorHeroHome(
  obrasLocais: ObraLocal[],
  heroObra: Obra,
  heroFavoritoId: string
) {
  const identificadoresHero = new Set(
    normalizarListaIdsHome([
      heroFavoritoId,
      ...criarIdentificadoresObraCatalogoHome(heroObra),
      normalizarTexto(heroObra.titulo),
    ])
  );

  return (
    obrasLocais.find((obra) => {
      return criarIdentificadoresObraLocalHome(obra).some((identificador) =>
        identificadoresHero.has(identificador)
      );
    }) || null
  );
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

export default function Home() {
  const router = useRouter();
  const { language } = useHistorietasLanguage();
  const homeTranslationRootRef = useRef<HTMLElement | null>(null);
  useHomePageTranslations(homeTranslationRootRef, language);
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);
  const [busca, setBusca] = useState("");
  const [obrasLocais, setObrasLocais] = useState<ObraLocal[]>([]);
  const [obrasFavoritas, setObrasFavoritas] = useState<string[]>([]);
  const [perfisAutores, setPerfisAutores] = useState<PerfisAutoresSalvos>({});
  const [avaliacoesAutoresHome, setAvaliacoesAutoresHome] =
    useState<AvaliacoesAutoresHome>({});
  const { notificacoesNaoLidas } = useNotificacoes();
  const [heroIndex, setHeroIndex] = useState(0);
  const [buscaMobileAberta, setBuscaMobileAberta] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [usuarioLogado, setUsuarioLogado] = useState(false);
  const [usuarioIdLogado, setUsuarioIdLogado] = useState("");
  const [dadosHomeCarregados, setDadosHomeCarregados] = useState(false);
  const [avisoLogin, setAvisoLogin] = useState("");

  useEffect(() => {
    let cancelado = false;

    async function carregarUsuarioHome() {
      try {
        const { data } = await supabase.auth.getUser();
        const logado = Boolean(data.user);

        if (!cancelado) {
          setUsuarioLogado(logado);
          setUsuarioIdLogado(data.user?.id || "");

          if (logado) {
            setAvisoLogin("");
          }
        }
      } catch {
        if (!cancelado) {
          setUsuarioLogado(false);
          setUsuarioIdLogado("");
        }
      }
    }

    void carregarUsuarioHome();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_evento, session) => {
      const logado = Boolean(session?.user);

      setUsuarioLogado(logado);
      setUsuarioIdLogado(session?.user.id || "");

      if (logado) {
        setAvisoLogin("");
      }
    });

    return () => {
      cancelado = true;
      subscription.unsubscribe();
    };
  }, []);

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
    const reiniciarCarregamentoTimer = window.setTimeout(() => {
      if (!cancelado) {
        setDadosHomeCarregados(false);
      }
    }, 0);

    async function carregarDadosHome() {
      try {
        let userIdHome = usuarioIdLogado.trim();
        if (!userIdHome) {
          try {
            const { data } = await supabase.auth.getUser();
            userIdHome = data.user?.id || "";
          } catch {
            userIdHome = "";
          }
        }

        const obrasSalvasTexto = lerStorageUsuarioHome(
          STORAGE_KEY,
          userIdHome
        );
        const obrasSalvasJson = obrasSalvasTexto
          ? JSON.parse(obrasSalvasTexto)
          : [];

        const obrasNormalizadas = normalizarObrasHomeSalvas(obrasSalvasJson);

        salvarJsonStorageUsuarioHome(STORAGE_KEY, userIdHome, obrasNormalizadas);

        let obrasFavoritasNormalizadas = carregarListaIdsHome(
          FAVORITES_STORAGE_KEY,
          userIdHome
        );
        let obrasConcluidasNormalizadas = carregarListaIdsHome(
          COMPLETED_STORAGE_KEY,
          userIdHome
        );

        if (userIdHome) {
          const [favoritasSupabase, concluidasSupabase] = await Promise.all([
            carregarIdsColecaoUsuarioHome("favoritos", userIdHome),
            carregarIdsColecaoUsuarioHome("concluidas", userIdHome),
          ]);

          obrasFavoritasNormalizadas = normalizarListaIdsHome([
            ...obrasFavoritasNormalizadas,
            ...favoritasSupabase,
          ]);
          obrasConcluidasNormalizadas = normalizarListaIdsHome([
            ...obrasConcluidasNormalizadas,
            ...concluidasSupabase,
          ]);
        }

        salvarListaIdsHome(
          FAVORITES_STORAGE_KEY,
          userIdHome,
          obrasFavoritasNormalizadas
        );

        salvarListaIdsHome(
          COMPLETED_STORAGE_KEY,
          userIdHome,
          obrasConcluidasNormalizadas
        );

        const perfisAutoresNormalizados =
          carregarPerfisAutoresHomeSalvos(userIdHome);

        if (!cancelado) {
          setObrasLocais(obrasNormalizadas);
          setObrasFavoritas(obrasFavoritasNormalizadas);
          setPerfisAutores(perfisAutoresNormalizados);
        }

        const obrasComSupabase = await carregarObrasSupabaseHome(
          obrasNormalizadas,
          userIdHome
        );

        if (!cancelado) {
          window.clearTimeout(reiniciarCarregamentoTimer);
          setObrasLocais(obrasComSupabase);
          setPerfisAutores(carregarPerfisAutoresHomeSalvos(userIdHome));
          setDadosHomeCarregados(true);
        }
      } catch {
        if (!cancelado) {
          window.clearTimeout(reiniciarCarregamentoTimer);
          setObrasLocais([]);
          setObrasFavoritas([]);
          setPerfisAutores({});
          setDadosHomeCarregados(true);
        }
      }
    }

    void carregarDadosHome();

    return () => {
      cancelado = true;
      window.clearTimeout(reiniciarCarregamentoTimer);
    };
  }, [usuarioIdLogado]);

  const termoBusca = normalizarTexto(busca);

  const obrasPublicadas = useMemo(() => {
    return obrasLocais.filter((obra) => {
      return (
        obra.publicado &&
        obraTemConteudoPublicoHome(obra) &&
        !ehClassificacao18(obra.classificacaoIndicativa)
      );
    });
  }, [obrasLocais]);

  const homeSemObrasReais =
    dadosHomeCarregados && !termoBusca && obrasPublicadas.length === 0;

  const obrasHero = useMemo(() => {
    if (!termoBusca) {
      return obrasPublicadas
        .slice(0, 6)
        .map((obra) => criarObraHeroLocalHome(obra));
    }

    return obrasPublicadas
      .map((obra, ordem) => {
        const titulo = normalizarTexto(obra.titulo);
        const autor = normalizarTexto(obra.autor);
        const genero = normalizarTexto(formatarGeneroHome(obra.genero));
        const tags = obra.tags.map((tag) => normalizarTexto(tag));
        const textoCompleto = normalizarTexto(
          [
            obra.titulo,
            obra.autor,
            obra.genero,
            formatarGeneroHome(obra.genero),
            obra.formato,
            obra.classificacaoIndicativa,
            obra.sinopse,
            ...obra.tags,
            ...obra.capitulos.map((capitulo) => capitulo.titulo),
          ].join(" ")
        );

        let relevancia = -1;

        if (titulo.startsWith(termoBusca)) {
          relevancia = 0;
        } else if (titulo.includes(termoBusca)) {
          relevancia = 1;
        } else if (autor.startsWith(termoBusca)) {
          relevancia = 2;
        } else if (
          genero.startsWith(termoBusca) ||
          tags.some((tag) => tag.startsWith(termoBusca))
        ) {
          relevancia = 3;
        } else if (textoCompleto.includes(termoBusca)) {
          relevancia = 4;
        }

        return {
          obra,
          ordem,
          relevancia,
        };
      })
      .filter((resultado) => resultado.relevancia >= 0)
      .sort((resultadoA, resultadoB) => {
        return (
          resultadoA.relevancia - resultadoB.relevancia ||
          resultadoA.ordem - resultadoB.ordem
        );
      })
      .slice(0, 6)
      .map(({ obra }) => criarObraHeroLocalHome(obra));
  }, [obrasPublicadas, termoBusca]);

  useEffect(() => {
    const redefinirHeroTimer = window.setTimeout(() => {
      setHeroIndex(0);
    }, 0);

    return () => {
      window.clearTimeout(redefinirHeroTimer);
    };
  }, [termoBusca]);

  useEffect(() => {
    if (obrasHero.length === 0) {
      return;
    }

    const ajustarHeroTimer = window.setTimeout(() => {
      setHeroIndex((indexAtual) =>
        indexAtual >= obrasHero.length ? 0 : indexAtual
      );
    }, 0);

    return () => {
      window.clearTimeout(ajustarHeroTimer);
    };
  }, [obrasHero.length]);

  useEffect(() => {
    if (obrasHero.length <= 1) {
      return;
    }

    const intervalo = window.setInterval(() => {
      setHeroIndex((indexAtual) => (indexAtual + 1) % obrasHero.length);
    }, 9000);

    return () => window.clearInterval(intervalo);
  }, [obrasHero.length]);

  const usandoHeroInicial = obrasHero.length === 0;
  const heroObra = obrasHero[heroIndex] || obrasHero[0] || HERO_INICIAL_HOME;
  const heroObraHref = usandoHeroInicial ? "/explorar" : criarHrefObraCatalogoHome(heroObra);
  const heroTemImagem = Boolean(!usandoHeroInicial && obterImagemObraCatalogo(heroObra));
  const heroFavoritoId = usandoHeroInicial ? "" : obterIdentificadorFavoritoHome(heroObra);
  const heroTotalCapitulos = usandoHeroInicial
    ? 0
    : obterTotalCapitulosObraCatalogoHome(heroObra);
  const desktopHeroTemArquivo = Boolean(
    !usandoHeroInicial && obraCatalogoTemArquivoAnexadoHome(heroObra),
  );
  const desktopHeroTotalConteudo = compactarNumeroHome(
    desktopHeroTemArquivo ? 1 : heroTotalCapitulos,
  );
  const metricasHeroHome = [
    { icone: "👁️", valor: heroObra.views || "0" },
    { icone: "❤️", valor: heroObra.likes || "0", destaque: true },
    { icone: "💬", valor: heroObra.comentarios || "0" },
  ];
  const desktopMetricasHeroHome = [
    ...metricasHeroHome,
    {
      icone: desktopHeroTemArquivo ? "📄" : "📚",
      valor: desktopHeroTotalConteudo,
    },
  ];
  const heroEstaSalvo = Boolean(
    usuarioLogado &&
      heroObra &&
      heroFavoritoId &&
      colecaoTemIdentificadorHome(
        criarIdentificadoresObraCatalogoHome(heroObra),
        obrasFavoritas
      )
  );

  async function exigirLoginHome(mensagem: string) {
    try {
      const { data } = await supabase.auth.getUser();
      const logado = Boolean(data.user);

      setUsuarioLogado(logado);
      setUsuarioIdLogado(data.user?.id || "");

      if (logado) {
        setAvisoLogin("");
        return true;
      }
    } catch {
      setUsuarioLogado(false);
      setUsuarioIdLogado("");
    }

    setAvisoLogin(mensagem);
    router.push(criarLoginHrefHome());
    return false;
  }

  async function alternarHeroFavorito() {
    if (!heroObra || !heroFavoritoId) {
      return;
    }

    const podeSalvar = await exigirLoginHome(
      "Entre na sua conta para salvar obras na sua lista."
    );

    if (!podeSalvar) {
      return;
    }

    let userIdAtual = "";

    try {
      const { data } = await supabase.auth.getUser();
      userIdAtual = data.user?.id || "";
    } catch {
      userIdAtual = "";
    }

    const obraLocalHero = encontrarObraLocalPorHeroHome(
      obrasLocais,
      heroObra,
      heroFavoritoId
    );
    const identificadoresHero = normalizarListaIdsHome([
      heroFavoritoId,
      ...criarIdentificadoresObraCatalogoHome(heroObra),
      ...(obraLocalHero ? criarIdentificadoresObraLocalHome(obraLocalHero) : []),
    ]);
    const estaNaLista = colecaoTemIdentificadorHome(
      identificadoresHero,
      obrasFavoritas
    );
    const novoStatusFavorito = !estaNaLista;
    const favoritoPrincipal = obraLocalHero?.id || heroFavoritoId;
    const favoritosSemHero = removerIdentificadoresDaListaHome(
      obrasFavoritas,
      identificadoresHero
    );
    const favoritosAtualizados = novoStatusFavorito
      ? normalizarListaIdsHome([...favoritosSemHero, favoritoPrincipal])
      : favoritosSemHero;

    salvarListaIdsHome(FAVORITES_STORAGE_KEY, userIdAtual, favoritosAtualizados);
    setObrasFavoritas(favoritosAtualizados);

    if (obraLocalHero) {
      const sincronizado = await sincronizarColecaoObraHome(
        "favoritos",
        obraLocalHero.id,
        novoStatusFavorito
      );

      if (!sincronizado && novoStatusFavorito) {
        setAvisoLogin("A obra ficou salva no aparelho, mas não sincronizou agora.");
      }

      if (novoStatusFavorito && userIdAtual) {
        void registrarAtividadeDiarioHome({
          userId: userIdAtual,
          tipo: "favoritou_obra",
          obra: obraLocalHero,
          texto: `Adicionou ${obraLocalHero.titulo} à lista`,
        });
      }
    }
  }

  const obrasPublicadasFiltradas = useMemo(() => {
    return obrasPublicadas
      .filter((obra) => obraLocalCombinaBusca(obra, termoBusca))
      .sort((obraA, obraB) => {
        const dataA = new Date(obraA.criadaEm).getTime();
        const dataB = new Date(obraB.criadaEm).getTime();

        return (
          (Number.isNaN(dataB) ? 0 : dataB) -
          (Number.isNaN(dataA) ? 0 : dataA)
        );
      });
  }, [obrasPublicadas, termoBusca]);

  const obrasParaContinuar = useMemo(() => {
    if (!usuarioLogado) {
      return [];
    }

    return obrasPublicadas
      .filter((obra) => {
        return (
          Boolean(encontrarCapituloParaContinuar(obra)) &&
          obraLocalCombinaBusca(obra, termoBusca)
        );
      })
      .sort((obraA, obraB) => {
        return obterTempoUltimaLeitura(obraB) - obterTempoUltimaLeitura(obraA);
      })
      .slice(0, 5);
  }, [obrasPublicadas, termoBusca, usuarioLogado]);

  const obrasMinhaLista = useMemo(() => {
    if (!usuarioLogado) {
      return [];
    }

    return obrasPublicadas
      .filter((obra) => {
        return (
          obraLocalEstaNaMinhaLista(obra, obrasFavoritas) &&
          obraLocalCombinaBusca(obra, termoBusca)
        );
      })
      .sort((obraA, obraB) => {
        const dataA = new Date(obraA.ultimaLeituraEm || obraA.criadaEm).getTime();
        const dataB = new Date(obraB.ultimaLeituraEm || obraB.criadaEm).getTime();

        return (
          (Number.isNaN(dataB) ? 0 : dataB) -
          (Number.isNaN(dataA) ? 0 : dataA)
        );
      })
      .slice(0, 12);
  }, [obrasPublicadas, obrasFavoritas, termoBusca, usuarioLogado]);

  const obrasCatalogoMinhaLista = useMemo(() => {
    if (!usuarioLogado) {
      return [];
    }

    return OBRAS_CATALOGO_HOME
      .filter((obra) => {
        return (
          obraCatalogoEstaNaMinhaLista(obra, obrasFavoritas) &&
          obraCatalogoCombinaBuscaHome(obra, termoBusca)
        );
      })
      .slice(0, 12);
  }, [obrasFavoritas, termoBusca, usuarioLogado]);

  const temasRecomendadosUsuario = useMemo(() => {
    const temas = new Set<string>();

    [...obrasParaContinuar, ...obrasMinhaLista].forEach((obra) => {
      obterTemasRecomendacaoObra(obra).forEach((tema) => {
        temas.add(tema);
      });
    });

    obrasCatalogoMinhaLista.forEach((obra) => {
      obterTemasRecomendacaoObraCatalogo(obra).forEach((tema) => {
        temas.add(tema);
      });
    });

    return temas;
  }, [obrasCatalogoMinhaLista, obrasMinhaLista, obrasParaContinuar]);

  const obrasRecomendadas = useMemo(() => {
    const obrasJaPriorizadas = new Set(
      [...obrasParaContinuar, ...obrasMinhaLista].map((obra) => obra.id)
    );

    return obrasPublicadas
      .filter((obra) => {
        return (
          !obrasJaPriorizadas.has(obra.id) &&
          obraCombinaComTemasRecomendados(obra, temasRecomendadosUsuario) &&
          obraLocalCombinaBusca(obra, termoBusca)
        );
      })
      .sort((obraA, obraB) => {
        const afinidadeA = obterTemasRecomendacaoObra(obraA).filter((tema) =>
          temasRecomendadosUsuario.has(tema)
        ).length;
        const afinidadeB = obterTemasRecomendacaoObra(obraB).filter((tema) =>
          temasRecomendadosUsuario.has(tema)
        ).length;

        return (
          afinidadeB - afinidadeA ||
          obterTempoUltimoCapitulo(obraB) - obterTempoUltimoCapitulo(obraA)
        );
      })
      .slice(0, 12);
  }, [
    obrasMinhaLista,
    obrasParaContinuar,
    obrasPublicadas,
    temasRecomendadosUsuario,
    termoBusca,
  ]);

  const obrasCatalogoRecomendadas = useMemo(() => {
    const titulosMinhaLista = new Set(
      obrasCatalogoMinhaLista.map((obra) => normalizarTexto(obra.titulo))
    );

    const recomendadasPorTema = OBRAS_CATALOGO_HOME.filter((obra) => {
      return (
        !titulosMinhaLista.has(normalizarTexto(obra.titulo)) &&
        obraCatalogoCombinaBuscaHome(obra, termoBusca) &&
        obraCatalogoCombinaComTemasRecomendados(obra, temasRecomendadosUsuario)
      );
    });

    const baseRecomendacoes =
      recomendadasPorTema.length > 0
        ? recomendadasPorTema
        : OBRAS_CATALOGO_HOME.filter((obra) => {
            return (
              !titulosMinhaLista.has(normalizarTexto(obra.titulo)) &&
              obraCatalogoCombinaBuscaHome(obra, termoBusca)
            );
          });

    return baseRecomendacoes.slice(0, 12);
  }, [obrasCatalogoMinhaLista, temasRecomendadosUsuario, termoBusca]);

  const totalMinhaListaHome =
    obrasMinhaLista.length + obrasCatalogoMinhaLista.length;
  const totalRecomendacoesHome =
    obrasRecomendadas.length + obrasCatalogoRecomendadas.length;

  const obrasFiltradas = useMemo(() => {
    if (!termoBusca) {
      return OBRAS_CATALOGO_HOME;
    }

    return OBRAS_CATALOGO_HOME.filter((obra) => {
      const textoObra = normalizarTexto(
        [
          obra.titulo,
          obra.autor,
          obra.genero,
          formatarGeneroHome(obra.genero),
          obra.classificacaoIndicativa,
          obra.status,
        ].join(" ")
      );

      return textoObra.includes(termoBusca);
    });
  }, [termoBusca]);

  const obrasComNovosCapitulos = useMemo(() => {
    return obrasPublicadas
      .filter((obra) => obra.capitulos.length > 0 && obraLocalCombinaBusca(obra, termoBusca))
      .sort((obraA, obraB) => obterTempoUltimoCapitulo(obraB) - obterTempoUltimoCapitulo(obraA))
      .slice(0, 12);
  }, [obrasPublicadas, termoBusca]);

  const obrasMaisCurtidas = useMemo(() => {
    return obrasPublicadas
      .filter((obra) => obterTotalCurtidasObraHome(obra) > 0 && obraLocalCombinaBusca(obra, termoBusca))
      .sort((obraA, obraB) => obterTotalCurtidasObraHome(obraB) - obterTotalCurtidasObraHome(obraA))
      .slice(0, 12);
  }, [obrasPublicadas, termoBusca]);

  const obrasMaisComentadas = useMemo(() => {
    return obrasPublicadas
      .filter((obra) => obterTotalComentariosObraHome(obra) > 0 && obraLocalCombinaBusca(obra, termoBusca))
      .sort((obraA, obraB) => obterTotalComentariosObraHome(obraB) - obterTotalComentariosObraHome(obraA))
      .slice(0, 12);
  }, [obrasPublicadas, termoBusca]);

  const obrasComArquivoAnexado = useMemo(() => {
    return obrasPublicadas
      .filter((obra) => obraTemArquivoAnexado(obra) && obraLocalCombinaBusca(obra, termoBusca))
      .slice(0, 12);
  }, [obrasPublicadas, termoBusca]);

  const leiturasRapidas = useMemo(() => {
    return obrasPublicadas
      .filter((obra) => {
        return (
          obra.capitulos.length > 0 &&
          obra.capitulos.length <= 3 &&
          obraLocalCombinaBusca(obra, termoBusca)
        );
      })
      .sort((obraA, obraB) => obraA.capitulos.length - obraB.capitulos.length)
      .slice(0, 12);
  }, [obrasPublicadas, termoBusca]);

  const autoresParaConhecer = useMemo<AutorHome[]>(() => {
    const autoresMap = new Map<
      string,
      {
        nome: string;
        autorId: string;
        generos: string[];
        totalObras: number;
        totalCapitulos: number;
        totalCurtidas: number;
        totalComentarios: number;
      }
    >();

    function registrarAutor(
      nomeAutor: string,
      autorId: string,
      genero: string,
      capitulos = 0,
      curtidas = 0,
      comentarios = 0
    ) {
      const nomeLimpo = nomeAutor.trim() || "Autor não informado";
      const autorIdLimpo = autorId.trim();
      const chave = autorIdLimpo || normalizarChaveAutor(nomeLimpo);
      const autorRegistrado = autoresMap.get(chave);

      if (autorRegistrado) {
        autoresMap.set(chave, {
          ...autorRegistrado,
          generos: genero.trim()
            ? [...autorRegistrado.generos, genero.trim()]
            : autorRegistrado.generos,
          totalObras: autorRegistrado.totalObras + 1,
          totalCapitulos: autorRegistrado.totalCapitulos + capitulos,
          totalCurtidas: autorRegistrado.totalCurtidas + curtidas,
          totalComentarios: autorRegistrado.totalComentarios + comentarios,
        });

        return;
      }

      autoresMap.set(chave, {
        nome: nomeLimpo,
        autorId: autorIdLimpo,
        generos: genero.trim() ? [genero.trim()] : [],
        totalObras: 1,
        totalCapitulos: capitulos,
        totalCurtidas: curtidas,
        totalComentarios: comentarios,
      });
    }

    obrasPublicadas
      .filter((obra) => obraLocalCombinaBusca(obra, termoBusca))
      .forEach((obra) => {
        registrarAutor(
          obra.autor,
          obra.autorId || "",
          obra.genero,
          obra.capitulos.length,
          obterTotalCurtidasObraHome(obra),
          obterTotalComentariosObraHome(obra)
        );
      });

    obrasFiltradas.forEach((obra) => {
      registrarAutor(obra.autor, "", obra.genero);
    });

    return Array.from(autoresMap.values())
      .map((autor) =>
        criarAutorHome(
          autor.nome,
          autor.autorId,
          autor.generos,
          autor.totalObras,
          autor.totalCapitulos,
          autor.totalCurtidas,
          autor.totalComentarios,
          perfisAutores
        )
      )
      .sort((autorA, autorB) => {
        return (
          autorB.totalObras - autorA.totalObras ||
          autorB.totalCapitulos - autorA.totalCapitulos ||
          autorA.nome.localeCompare(autorB.nome, "pt-BR")
        );
      })
      .slice(0, 12);
  }, [obrasPublicadas, obrasFiltradas, perfisAutores, termoBusca]);

  useEffect(() => {
    const autorIds = Array.from(
      new Set(
        autoresParaConhecer
          .map((autor) => autor.autorId.trim())
          .filter((autorId) => idObraSupabaseValido(autorId))
      )
    );
    let cancelado = false;

    async function carregarAvaliacoesAutoresHome() {
      if (autorIds.length === 0) {
        await Promise.resolve();

        if (!cancelado) {
          setAvaliacoesAutoresHome({});
        }

        return;
      }

      try {
        const contrato = await carregarMetricasConteudos({ autorIds });

        if (!contrato.carregado) {
          if (!cancelado) {
            setAvaliacoesAutoresHome({});
          }
          return;
        }

        const avaliacoesAtualizadas = autorIds.reduce<AvaliacoesAutoresHome>(
          (resultado, autorId) => {
            const avaliacao = contrato.autores.get(autorId)?.avaliacao;

            if (avaliacao && avaliacao.total > 0) {
              resultado[autorId] = {
                media: avaliacao.media,
                total: avaliacao.total,
              };
            }

            return resultado;
          },
          {}
        );

        if (!cancelado) {
          setAvaliacoesAutoresHome(avaliacoesAtualizadas);
        }
      } catch {
        if (!cancelado) {
          setAvaliacoesAutoresHome({});
        }
      }
    }

    void carregarAvaliacoesAutoresHome();

    return () => {
      cancelado = true;
    };
  }, [autoresParaConhecer]);

  const obrasFantasiaPoderes = useMemo(() => {
    return obrasFiltradas.filter((obra) =>
      obraCatalogoCombinaTemas(obra, ["fantasia", "sobrenatural", "poder", "magia"])
    );
  }, [obrasFiltradas]);

  const obrasTerrorSuspense = useMemo(() => {
    return obrasFiltradas.filter((obra) =>
      obraCatalogoCombinaTemas(obra, ["terror", "suspense", "mistério", "sombrio"])
    );
  }, [obrasFiltradas]);

  const obrasRomanceDrama = useMemo(() => {
    return obrasFiltradas.filter((obra) =>
      obraCatalogoCombinaTemas(obra, ["romance", "drama", "emocional"])
    );
  }, [obrasFiltradas]);

  const obrasAcaoRivalidades = useMemo(() => {
    return obrasFiltradas.filter((obra) =>
      obraCatalogoCombinaTemas(obra, ["ação", "acao", "luta", "rivalidade", "guerra"])
    );
  }, [obrasFiltradas]);

  const obrasScifiCodigo = useMemo(() => {
    return obrasFiltradas.filter((obra) =>
      obraCatalogoCombinaTemas(obra, ["sci-fi", "scifi", "ficção", "futur", "código", "codigo"])
    );
  }, [obrasFiltradas]);

  const obrasEmBreve = useMemo(() => {
    return obrasFiltradas.filter((obra) => !obra.disponivel);
  }, [obrasFiltradas]);

  if (!dadosHomeCarregados) {
    return (
      <main ref={homeTranslationRootRef} style={pageThemeStyle} aria-busy="true">
        <style>{`${themePageCss}${historietasThemeCss}`}</style>
        <LoadingSpinner label="Carregando página inicial" />
      </main>
    );
  }

  if (!heroObra) {
    return (
      <main
        ref={homeTranslationRootRef}
        style={{
          ...pageThemeStyle,
          display: "grid",
          placeItems: "center",
          padding: "40px",
        }}
      >
        <p
          style={{
            margin: 0,
            color: "#FFFFFF",
            fontSize: "12px",
            fontWeight: 800,
            textAlign: "center",
          }}
        >
          Nenhuma obra cadastrada
        </p>
      </main>
    );
  }

  return (
    <main ref={homeTranslationRootRef} style={pageThemeStyle}>
      <style>{`${themePageCss}${historietasThemeCss}`}</style>

      <div style={pageDecorationLayerStyle} aria-hidden="true">
        {["✦", "◌", "✧"].map((decoracao, index) => (
          <span key={`${decoracao}-${index}`} style={criarDecoracaoHomeStyle()}>
            {decoracao}
          </span>
        ))}
      </div>

      {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}

      {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}

      <header className="historietas-home-header" style={isDesktop ? desktopNavStyle : mobileNavStyle}>
        {isDesktop && (
          <div style={desktopNavInnerStyle}>
            <Link
              href="/"
              className="historietas-home-logo"
              style={desktopLogoStyle}
              aria-label="Historietas"
            >
              <span className="historietas-home-logo-mark" style={desktopLogoMarkStyle}>H</span>
              <span className="historietas-home-logo-text" style={desktopLogoTextStyle}>istorietas</span>
            </Link>

            <div
              className="historietas-home-desktop-links"
              style={desktopMenuStyle}
              role="navigation"
              aria-label="Navegação principal"
            >
              <Link href="/" className="historietas-home-desktop-link" style={desktopActiveLinkStyle}>
                Início
              </Link>

              <Link href="/explorar" className="historietas-home-desktop-link" style={desktopLinkStyle}>
                Explorar
              </Link>

              <Link href="/publicar" className="historietas-home-desktop-link" style={desktopLinkStyle}>
                Publicar
              </Link>

              <Link href="/comunidade" className="historietas-home-desktop-link" style={desktopLinkStyle}>
                Comunidade
              </Link>

              <Link href="/seguindo" className="historietas-home-desktop-link" style={desktopLinkStyle}>
                Seguindo
              </Link>

            </div>

            <div style={desktopInlineSearchAreaStyle}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                style={desktopSearchIconStyle}
              >
                <circle cx="10.75" cy="10.75" r="6.75" stroke="currentColor" strokeWidth="2" />
                <path d="M16 16L20.25 20.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>

              <input
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                aria-label="Buscar obras, autor, gênero..."
                placeholder="Buscar obras, autor, gênero..."
                className="historietas-home-header-search-input"
                style={desktopInputStyle}
              />
            </div>

            <div className="historietas-home-desktop-actions" style={desktopHeaderActionsStyle}>
              <Link
                href="/notificacoes"
                className="historietas-home-desktop-icon-link"
                style={desktopHeaderIconLinkStyle}
                aria-label={
                  notificacoesNaoLidas > 0
                    ? `Notificações: ${notificacoesNaoLidas} novas`
                    : "Notificações"
                }
                title="Notificações"
              >
                <svg
                  width="21"
                  height="21"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M6.75 9.75C6.75 6.85 8.85 4.5 12 4.5C15.15 4.5 17.25 6.85 17.25 9.75V13.1L18.7 15.7H5.3L6.75 13.1V9.75Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                  <path d="M9.75 18C10.15 18.8 10.9 19.25 12 19.25C13.1 19.25 13.85 18.8 14.25 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>

                {usuarioLogado && notificacoesNaoLidas > 0 ? (
                  <span style={desktopNotificationCountBadgeStyle}>
                    {notificacoesNaoLidas > 99 ? "99+" : notificacoesNaoLidas}
                  </span>
                ) : null}
              </Link>

              <Link
                href="/configuracoes"
                className="historietas-home-desktop-icon-link"
                style={desktopHeaderIconLinkStyle}
                aria-label="Configurações"
                title="Configurações"
              >
                <svg
                  width="21"
                  height="21"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M9.8 4.6L10.35 3H13.65L14.2 4.6L15.65 5.2L17.15 4.45L19.5 6.8L18.75 8.3L19.35 9.75L21 10.35V13.65L19.35 14.25L18.75 15.7L19.5 17.2L17.15 19.55L15.65 18.8L14.2 19.4L13.65 21H10.35L9.8 19.4L8.35 18.8L6.85 19.55L4.5 17.2L5.25 15.7L4.65 14.25L3 13.65V10.35L4.65 9.75L5.25 8.3L4.5 6.8L6.85 4.45L8.35 5.2L9.8 4.6Z"
                    stroke="currentColor"
                    strokeWidth="1.55"
                    strokeLinejoin="round"
                  />
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
                </svg>
              </Link>

              <Link
                href="/perfil-autor"
                className="historietas-home-desktop-profile-link"
                style={desktopProfileLinkStyle}
                aria-label="Abrir perfil"
                title="Perfil"
              >
                <span style={desktopProfileAvatarStyle}>
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="8.25" r="3.25" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M5.75 19C6.3 15.75 8.6 14 12 14C15.4 14 17.7 15.75 18.25 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </span>
              </Link>
            </div>
          </div>
        )}

        {!isDesktop && (
          <div style={navInnerStyle}>
            <div style={navTopRowStyle}>
              <Link href="/" className="historietas-home-logo" style={logoStyle} aria-label="Historietas">
                <span className="historietas-home-logo-mark" style={logoMarkStyle}>H</span>
                <span className="historietas-home-logo-text" style={logoTextStyle}>istorietas</span>
              </Link>

              {buscaMobileAberta ? (
                <div className="historietas-home-mobile-search-area" style={mobileHeaderSearchAreaStyle}>
                  <input
                    value={busca}
                    onChange={(event) => setBusca(event.target.value)}
                    aria-label="Buscar..."
                    placeholder="Buscar..."
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    maxLength={90}
                    className="historietas-home-header-search-input"
                    style={mobileHeaderSearchInputStyle}
                    type="text"
                    autoFocus
                  />

                </div>
              ) : null}

              <div className="historietas-home-header-actions" style={navIconsStyle}>
                <button
                  type="button"
                  onClick={() => setBuscaMobileAberta((aberta) => !aberta)}
                  aria-label={buscaMobileAberta ? "Fechar busca" : "Abrir busca"}
                  aria-pressed={buscaMobileAberta}
                  className="historietas-home-search-toggle"
                  style={
                    buscaMobileAberta
                      ? mobileSearchToggleActiveStyle
                      : mobileSearchToggleStyle
                  }
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
              </div>
            </div>
          </div>
        )}
      </header>

      <div style={isDesktop ? desktopContainerStyle : containerStyle}>
        <section
          style={
            isDesktop
              ? {
                  ...heroStyle,
                  ...desktopHeroStyle,
                }
              : criarMobileHeroFrameBackground()
          }
        >
          {!isDesktop && (
            <div style={criarMobileHeroImageLayerStyle(heroObra)} aria-hidden="true" />
          )}

          {!isDesktop && (
            <div
              style={
                heroTemImagem
                  ? mobileHeroImageGlowStyle
                  : heroGlowStyle
              }
            />
          )}

          {!isDesktop && !heroTemImagem && (
            <div style={heroDecorationLayerStyle} aria-hidden="true">
              {["✦", "◌", "✧", "◇"].map((decoracao, index) => (
                <span key={`hero-${decoracao}-${index}`} style={criarDecoracaoHomeStyle()}>
                  {decoracao}
                </span>
              ))}
            </div>
          )}

          {isDesktop ? (
            <div style={desktopHeroShellStyle}>
              <div style={desktopHeroPosterFrameStyle}>
                <Link
                  href={heroObraHref}
                  style={criarDesktopHeroPosterStyle(heroObra)}
                  aria-label={`Abrir ${heroObra.titulo}`}
                >
                  {!heroTemImagem && (
                    <>
                      <span style={desktopHeroPosterGlowStyle} aria-hidden="true" />
                      <strong style={desktopHeroPosterTitleStyle}>{heroObra.titulo}</strong>
                      <span style={desktopHeroPosterStatusStyle}>
                        {heroObra.status || "Obra em destaque"}
                      </span>
                    </>
                  )}
                </Link>
              </div>

              <div style={desktopHeroContentStyle}>
                <span style={desktopHeroKickerStyle}>
                  {usandoHeroInicial ? "Conheça o Historietas" : "Em destaque"}
                </span>

                <h1 className="historietas-home-hero-title" style={desktopHeroTitleStyle}>
                  {heroObra.titulo}
                </h1>

                <div style={desktopHeroMetaStyle}>
                  <span style={desktopHeroAuthorStyle}>
                    Por {heroObra.autor || "Autor não informado"}
                  </span>
                  <span style={desktopHeroMetaDividerStyle} aria-hidden="true" />
                  <span style={desktopHeroGenreStyle}>
                    {traduzirGeneroHome(heroObra.genero, language)}
                  </span>
                  <span style={desktopHeroMetaDividerStyle} aria-hidden="true" />
                  <span style={desktopHeroClassificationStyle}>
                    {traduzirClassificacaoHome(heroObra.classificacaoIndicativa, language)}
                  </span>
                </div>

                <p style={desktopHeroDescriptionStyle}>
                  {heroObra.sinopse || "Nenhuma sinopse informada."}
                </p>

                <div style={usandoHeroInicial ? desktopHeroInitialButtonsStyle : desktopHeroButtonsStyle}>
                  <Link href={heroObraHref} style={desktopPrimaryButtonStyle}>
                    {usandoHeroInicial ? "Explorar obras" : "Ler agora"}
                  </Link>

                  {usandoHeroInicial && (
                    <Link href="/publicar" style={desktopSecondaryButtonStyle}>
                      Publicar obra
                    </Link>
                  )}

                  {!usandoHeroInicial && (
                    <button
                      type="button"
                      onClick={alternarHeroFavorito}
                      aria-pressed={heroEstaSalvo}
                      style={desktopHeroSaveButtonStyle}
                    >
                      {heroEstaSalvo ? "Salvo" : "Salvar"}
                    </button>
                  )}
                </div>

                {avisoLogin && <p style={desktopHeroLoginNoticeStyle}>{avisoLogin}</p>}

                {!usandoHeroInicial && (
                  <div style={desktopHeroFooterStyle}>
                    <div style={desktopHeroStatsStyle}>
                      {desktopMetricasHeroHome.map((metrica) => (
                        <span
                          key={`hero-desktop-${metrica.icone}`}
                          style={desktopHeroStatItemStyle}
                        >
                          <span
                            style={
                              metrica.destaque
                                ? cardStatHeartIconStyle
                                : desktopHeroStatIconStyle
                            }
                          >
                            {metrica.icone}
                          </span>
                          <span style={desktopHeroStatValueStyle}>
                            {metrica.valor}
                          </span>
                        </span>
                      ))}
                    </div>

                    <div style={desktopHeroDotsStyle} aria-label="Obras em destaque">
                      {obrasHero.map((obra, index) => (
                        <button
                          key={`${obra.titulo}-${index}`}
                          type="button"
                          onClick={() => setHeroIndex(index)}
                          aria-label={`Mostrar ${obra.titulo}`}
                          style={
                            index === heroIndex
                              ? desktopHeroDotActiveStyle
                              : desktopHeroDotStyle
                          }
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={mobileHeroContentStyle}>
              <div style={mobileHeroMetaStyle}>
                <span style={mobileHeroPillStyle}>✦ {traduzirGeneroHome(heroObra.genero, language)}</span>
                <span style={mobileHeroPillStyle}>◆ {traduzirClassificacaoHome(heroObra.classificacaoIndicativa, language)}</span>
              </div>

              <div style={mobileHeroTextBlockStyle}>
                <h1
                  className="historietas-home-hero-title"
                  style={mobileHeroTitleStyle}
                >
                  {heroObra.titulo}
                </h1>

                <p style={mobileHeroDescriptionStyle}>
                  {formatarSinopseHeroMobile(heroObra.sinopse)}
                </p>
              </div>

              <div style={usandoHeroInicial ? mobileHeroInitialButtonsStyle : mobileHeroButtonsStyle}>
                <Link href={heroObraHref} style={primaryButtonStyle}>
                  {usandoHeroInicial ? "Explorar obras" : "Ver obra"}
                </Link>

                {usandoHeroInicial && (
                  <Link href="/publicar" style={secondaryButtonStyle}>
                    Publicar obra
                  </Link>
                )}

                {!usandoHeroInicial && (
                  <button
                  type="button"
                  onClick={alternarHeroFavorito}
                  aria-pressed={heroEstaSalvo}
                  style={heroSaveButtonStyle}
                >
                    {heroEstaSalvo ? "Salvo" : "Salvar"}
                  </button>
                )}
              </div>

              {avisoLogin && <p style={heroLoginNoticeStyle}>{avisoLogin}</p>}

              {!usandoHeroInicial && (
                <div style={mobileHeroFooterStyle}>
                  <div style={mobileHeroStatsStyle}>
                    {metricasHeroHome.map((metrica) => (
                      <span
                        key={`hero-mobile-${metrica.icone}`}
                        style={mobileHeroStatItemStyle}
                      >
                        <span
                          style={
                            metrica.destaque
                              ? cardStatHeartIconStyle
                              : mobileHeroStatIconStyle
                          }
                        >
                          {metrica.icone}
                        </span>
                        <span style={mobileHeroStatValueStyle}>
                          {metrica.valor}
                        </span>
                      </span>
                    ))}
                  </div>

                  <div style={mobileHeroDotsStyle} aria-label="Obras em destaque">
                    {obrasHero.map((obra, index) => (
                      <button
                        key={`${obra.titulo}-${index}`}
                        type="button"
                        onClick={() => setHeroIndex(index)}
                        aria-label={`Mostrar ${obra.titulo}`}
                        style={
                          index === heroIndex
                            ? mobileHeroDotActiveStyle
                            : mobileHeroDotStyle
                        }
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        <section style={isDesktop ? desktopSummaryStripStyle : summaryStripStyle} aria-label="Atalhos principais">
          <Link href="/em-breve" style={summaryItemStyle}>
            <strong style={summaryNumberStyle}>Em breve</strong>
          </Link>

          <span style={summaryDividerLineStyle} aria-hidden="true" />

          <Link href="/em-alta" style={summaryItemStyle}>
            <strong style={summaryNumberStyle}>Em Alta</strong>
          </Link>
        </section>

        {homeSemObrasReais && <HomeEmptyState />}

        {obrasParaContinuar.length > 0 && (
          <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
            <SectionHeader
              title="Continuar lendo"
              subtitle="Continue do ponto em que parou."
            />

            <CarouselRow isDesktop={isDesktop}>
              {obrasParaContinuar.map((obra) => (
                <MobileObraLocalCard
                  key={`continuar-${obra.id}`}
                  obra={obra}
                  tipo="continuar"
                  isDesktop={isDesktop}
                />
              ))}
            </CarouselRow>
          </section>
        )}

        {totalMinhaListaHome > 0 && (
          <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
            <SectionHeader
              title="Minha lista"
              subtitle={`${totalMinhaListaHome} na lista para acessar rápido.`}
            />

            <CarouselRow isDesktop={isDesktop}>
              {obrasMinhaLista.map((obra) => (
                <MobileObraLocalCard
                  key={`minha-lista-${obra.id}`}
                  obra={obra}
                  tipo="catalogo"
                  isDesktop={isDesktop}
                />
              ))}

              {obrasCatalogoMinhaLista.map((obra) => (
                <MobileObraCard
                  key={`minha-lista-catalogo-${obra.titulo}`}
                  obra={obra}
                  isDesktop={isDesktop}
                />
              ))}
            </CarouselRow>
          </section>
        )}

        {autoresParaConhecer.length > 0 && (
          <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
            <SectionHeader
              title="Autores para conhecer"
              subtitle="Perfis que dão vida ao catálogo."
            />

            <CarouselRow isDesktop={isDesktop} variant="autor">
              {autoresParaConhecer.map((autor) => (
                <MobileAutorCard
                  key={`autor-${autor.chave}`}
                  autor={autor}
                  avaliacao={avaliacoesAutoresHome[autor.autorId]}
                  isDesktop={isDesktop}
                />
              ))}
            </CarouselRow>
          </section>
        )}

        {totalRecomendacoesHome > 0 && (
          <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
            <SectionHeader
              title="Recomendações para você"
              subtitle={
                temasRecomendadosUsuario.size > 0
                  ? "Obras parecidas com o que você lê ou salvou."
                  : "Sugestões para começar sua próxima leitura."
              }
            />

            <CarouselRow isDesktop={isDesktop}>
              {obrasRecomendadas.map((obra) => (
                <MobileObraLocalCard
                  key={`recomendadas-${obra.id}`}
                  obra={obra}
                  tipo="catalogo"
                  isDesktop={isDesktop}
                />
              ))}

              {obrasCatalogoRecomendadas.map((obra) => (
                <MobileObraCard
                  key={`recomendadas-catalogo-${obra.titulo}`}
                  obra={obra}
                  isDesktop={isDesktop}
                />
              ))}
            </CarouselRow>
          </section>
        )}

        {obrasPublicadasFiltradas.length > 0 && (
          <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
            <SectionHeader
              title="Publicações recentes"
              subtitle={`${obrasPublicadasFiltradas.length} ${
                obrasPublicadasFiltradas.length === 1
                  ? "obra publicada"
                  : "obras publicadas"
              }`}
            />

            <CarouselRow isDesktop={isDesktop}>
              {obrasPublicadasFiltradas.map((obra) => (
                <MobileObraLocalCard
                  key={obra.id}
                  obra={obra}
                  tipo="catalogo"
                  isDesktop={isDesktop}
                />
              ))}
            </CarouselRow>
          </section>
        )}

        {obrasComNovosCapitulos.length > 0 && (
          <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
            <SectionHeader
              title="Novos capítulos"
              subtitle="Capítulos novos para acompanhar sem perder o ritmo."
            />

            <CarouselRow isDesktop={isDesktop}>
              {obrasComNovosCapitulos.map((obra) => (
                <MobileObraLocalCard
                  key={`novos-capitulos-${obra.id}`}
                  obra={obra}
                  tipo="novo-capitulo"
                  isDesktop={isDesktop}
                />
              ))}
            </CarouselRow>
          </section>
        )}

        {obrasMaisCurtidas.length > 0 && (
          <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
            <SectionHeader
              title="Mais curtidas"
              subtitle="Na lista da comunidade nesta fase."
            />

            <CarouselRow isDesktop={isDesktop}>
              {obrasMaisCurtidas.map((obra) => (
                <MobileObraLocalCard
                  key={`mais-curtidas-${obra.id}`}
                  obra={obra}
                  tipo="catalogo"
                  isDesktop={isDesktop}
                />
              ))}
            </CarouselRow>
          </section>
        )}

        {obrasMaisComentadas.length > 0 && (
          <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
            <SectionHeader
              title="Mais comentadas"
              subtitle="Histórias que estão puxando conversa."
            />

            <CarouselRow isDesktop={isDesktop}>
              {obrasMaisComentadas.map((obra) => (
                <MobileObraLocalCard
                  key={`mais-comentadas-${obra.id}`}
                  obra={obra}
                  tipo="catalogo"
                  isDesktop={isDesktop}
                />
              ))}
            </CarouselRow>
          </section>
        )}

        {obrasComArquivoAnexado.length > 0 && (
          <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
            <SectionHeader
              title="Extras e arquivos"
              subtitle="Histórias com material extra para abrir depois."
            />

            <CarouselRow isDesktop={isDesktop}>
              {obrasComArquivoAnexado.map((obra) => (
                <MobileObraLocalCard
                  key={`arquivo-anexado-${obra.id}`}
                  obra={obra}
                  tipo="catalogo"
                  isDesktop={isDesktop}
                />
              ))}
            </CarouselRow>
          </section>
        )}

        {leiturasRapidas.length > 0 && (
          <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
            <SectionHeader
              title="Para ler agora"
              subtitle="Obras curtas para entrar rápido no universo."
            />

            <CarouselRow isDesktop={isDesktop}>
              {leiturasRapidas.map((obra) => (
                <MobileObraLocalCard
                  key={`leituras-rapidas-${obra.id}`}
                  obra={obra}
                  tipo="catalogo"
                  isDesktop={isDesktop}
                />
              ))}
            </CarouselRow>
          </section>
        )}

        {(obrasFiltradas.length > 0 || Boolean(termoBusca)) && (
          <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
            <SectionHeader title="Catálogo" subtitle="Obras reais publicadas na plataforma." />

            {obrasFiltradas.length > 0 ? (
              <CarouselRow isDesktop={isDesktop}>
                {obrasFiltradas.map((obra) => (
                  <MobileObraCard key={obra.titulo} obra={obra} isDesktop={isDesktop} />
                ))}
              </CarouselRow>
            ) : (
              <EmptySearch />
            )}
          </section>
        )}

        {obrasFantasiaPoderes.length > 0 && (
          <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
            <SectionHeader
              title="Fantasia e poderes"
              subtitle="Mundos, poderes e mistérios para explorar."
            />

            <CarouselRow isDesktop={isDesktop}>
              {obrasFantasiaPoderes.map((obra) => (
                <MobileObraCard key={`fantasia-${obra.titulo}`} obra={obra} isDesktop={isDesktop} />
              ))}
            </CarouselRow>
          </section>
        )}

        {obrasTerrorSuspense.length > 0 && (
          <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
            <SectionHeader
              title="Terror e suspense"
              subtitle="Atmosfera sombria, tensão e mistério."
            />

            <CarouselRow isDesktop={isDesktop}>
              {obrasTerrorSuspense.map((obra) => (
                <MobileObraCard key={`terror-${obra.titulo}`} obra={obra} isDesktop={isDesktop} />
              ))}
            </CarouselRow>
          </section>
        )}

        {obrasRomanceDrama.length > 0 && (
          <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
            <SectionHeader
              title="Romance e drama"
              subtitle="Relações intensas e escolhas difíceis."
            />

            <CarouselRow isDesktop={isDesktop}>
              {obrasRomanceDrama.map((obra) => (
                <MobileObraCard key={`romance-${obra.titulo}`} obra={obra} isDesktop={isDesktop} />
              ))}
            </CarouselRow>
          </section>
        )}

        {obrasAcaoRivalidades.length > 0 && (
          <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
            <SectionHeader
              title="Ação e rivalidades"
              subtitle="Conflitos, disputas e personagens intensos."
            />

            <CarouselRow isDesktop={isDesktop}>
              {obrasAcaoRivalidades.map((obra) => (
                <MobileObraCard key={`acao-${obra.titulo}`} obra={obra} isDesktop={isDesktop} />
              ))}
            </CarouselRow>
          </section>
        )}

        {obrasScifiCodigo.length > 0 && (
          <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
            <SectionHeader
              title="Sci-fi e códigos"
              subtitle="Futuro, sistemas e universos alternativos."
            />

            <CarouselRow isDesktop={isDesktop}>
              {obrasScifiCodigo.map((obra) => (
                <MobileObraCard key={`scifi-${obra.titulo}`} obra={obra} isDesktop={isDesktop} />
              ))}
            </CarouselRow>
          </section>
        )}

        {obrasEmBreve.length > 0 && (
          <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
            <SectionHeader
              title="Em breve na Historietas"
              subtitle="Obras chegando ao catálogo em breve."
            />

            <CarouselRow isDesktop={isDesktop}>
              {obrasEmBreve.map((obra) => (
                <MobileObraCard key={`em-breve-${obra.titulo}`} obra={obra} isDesktop={isDesktop} />
              ))}
            </CarouselRow>
          </section>
        )}

        {obrasFiltradas.length > 0 && (
          <section style={isDesktop ? desktopLastSectionStyle : lastSectionStyle}>
            <SectionHeader
              title="Obras em destaque"
              subtitle="Obras reais disponíveis para leitura."
            />

            <CarouselRow isDesktop={isDesktop}>
              {obrasFiltradas.map((obra) => (
                <MobileObraCard key={`destaque-${obra.titulo}`} obra={obra} isDesktop={isDesktop} />
              ))}
            </CarouselRow>
          </section>
        )}
      </div>
    </main>
  );
}

function SectionHeader({
  title,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div style={sectionHeaderStyle}>
      <h2 style={sectionTitleStyle}>{title}</h2>
    </div>
  );
}

function MobileObraLocalCard({
  obra,
  tipo,
  isDesktop,
}: {
  obra: ObraLocal;
  tipo: "continuar" | "catalogo" | "novo-capitulo";
  isDesktop?: boolean;
}) {
  const { language } = useHistorietasLanguage();
  const visualizacoesObra = compactarNumeroHome(obra.visualizacoes || 0);
  const totalCurtidas = compactarNumeroHome(obterTotalCurtidasObraHome(obra));
  const totalComentarios = compactarNumeroHome(
    obterTotalComentariosObraHome(obra),
  );
  const obraTemArquivo = obraTemArquivoAnexado(obra);
  const iconeConteudoObra = obraTemArquivo ? "📄" : "📚";
  const totalConteudoObra = compactarNumeroHome(
    obraTemArquivo ? 1 : obra.capitulos.length,
  );

  const progressoLeitura = calcularProgressoLeitura(obra.capitulos);
  const capituloParaContinuar = encontrarCapituloParaContinuar(obra);
  const ultimoCapituloPublicado =
    obra.capitulos.length > 0 ? obra.capitulos[obra.capitulos.length - 1] : null;
  const slugObra = obra.slug || criarSlugBase(obra.titulo);
  const verObraHref = obra.link?.trim() || `/obra/${slugObra}`;
  const numeroCapituloContinuar = capituloParaContinuar
    ? Math.max(
        1,
        obra.capitulos.findIndex(
          (capitulo) => capitulo.id === capituloParaContinuar.id
        ) + 1
      )
    : 0;
  const numeroUltimoCapitulo = ultimoCapituloPublicado
    ? Math.max(
        1,
        obra.capitulos.findIndex(
          (capitulo) => capitulo.id === ultimoCapituloPublicado.id
        ) + 1
      )
    : 0;
  const continuarLeituraHref = capituloParaContinuar
    ? criarHrefLeituraCapituloHome(
        obra,
        capituloParaContinuar,
        numeroCapituloContinuar || 1
      )
    : verObraHref;
  const ultimoCapituloHref = ultimoCapituloPublicado
    ? criarHrefLeituraCapituloHome(
        obra,
        ultimoCapituloPublicado,
        numeroUltimoCapitulo || 1
      )
    : verObraHref;
  const perfilAutorHref = criarHrefPerfilAutorHome(obra.autor, obra.autorId || "");

  const actionHref =
    tipo === "continuar"
      ? continuarLeituraHref
      : tipo === "novo-capitulo"
      ? ultimoCapituloHref
      : verObraHref;
  const actionLabel =
    tipo === "continuar"
      ? "Continuar"
      : tipo === "novo-capitulo"
      ? "Ler agora"
      : "Ver obra";
  const actionSubLabel =
    tipo === "continuar"
      ? numeroCapituloContinuar > 0
        ? `Leitura Cap. ${String(numeroCapituloContinuar).padStart(2, "0")}`
        : "Leitura"
      : tipo === "novo-capitulo" && numeroUltimoCapitulo > 0
      ? `Cap ${numeroUltimoCapitulo}`
      : "";
  const cardComAlturaExtra = progressoLeitura > 0 || tipo === "novo-capitulo";
  const cardStyle = isDesktop
    ? cardComAlturaExtra
      ? desktopPublishedCardCompactHeightStyle
      : desktopPublishedCardStyle
    : cardComAlturaExtra
    ? publishedCardCompactHeightStyle
    : publishedCardStyle;
  const capaStyle = isDesktop
    ? {
        ...criarMobileCoverStyle(obra.capa),
        ...(cardComAlturaExtra
          ? desktopCoverPlaceholderCompactHeightStyle
          : desktopCoverPlaceholderStyle),
      }
    : {
        ...criarMobileCoverStyle(obra.capa),
        ...(cardComAlturaExtra ? coverPlaceholderCompactHeightStyle : {}),
      };

  return (
    <article style={cardStyle}>
      <Link href={verObraHref} style={capaStyle} />

      <div style={publishedInfoStyle}>
        <div style={cardTopRowStyle}>
          <h3 style={isDesktop ? desktopPublishedTitleStyle : publishedTitleStyle}>{obra.titulo}</h3>

          <Link href={perfilAutorHref} style={authorLinkStyle}>
            Por {obra.autor}
          </Link>
        </div>

        <div style={statusRowStyle}>
          <span style={formatBadgeStyle}>{traduzirFormatoHome(obra.formato, language)}</span>
          <span style={classificationBadgeStyle}>
            {traduzirClassificacaoHome(obra.classificacaoIndicativa, language)}
          </span>
        </div>

        {tipo === "novo-capitulo" && ultimoCapituloPublicado && (
          <Link href={ultimoCapituloHref} style={latestChapterInfoStyle}>
            Novo cap {numeroUltimoCapitulo} •{" "}
            {ultimoCapituloPublicado.titulo}
          </Link>
        )}

        <div style={cardStatsStyle}>
          <span style={cardStatItemStyle}>
            <span style={cardStatIconStyle}>👁️</span>
            <span style={cardStatValueStyle}>{visualizacoesObra}</span>
          </span>

          <span style={cardStatItemStyle}>
            <span style={cardStatHeartIconStyle}>❤️</span>
            <span style={cardStatValueStyle}>{totalCurtidas}</span>
          </span>

          <span style={cardStatItemStyle}>
            <span style={cardStatIconStyle}>💬</span>
            <span style={cardStatValueStyle}>{totalComentarios}</span>
          </span>

          <span style={cardStatItemStyle}>
            <span style={cardStatIconStyle}>{iconeConteudoObra}</span>
            <span style={cardStatValueStyle}>{totalConteudoObra}</span>
          </span>
        </div>

        {progressoLeitura > 0 && (
          <div style={progressCompactStyle}>
            <div style={progressTrackStyle}>
              <div
                style={{
                  ...progressBarStyle,
                  width: `${progressoLeitura}%`,
                }}
              />
            </div>

            <span style={progressTextStyle}>{progressoLeitura}% lido</span>
          </div>
        )}

        <div style={isDesktop ? desktopCardActionRowStyle : mobileCardActionRowStyle}>
          <span style={isDesktop ? desktopCardGenreBadgeStyle : mobileCardGenreBadgeStyle}>
            {traduzirGeneroHome(obra.genero, language)}
          </span>

          <Link
            href={actionHref}
            style={{
              ...(isDesktop
                ? desktopCardPrimaryActionStyle
                : mobileCardPrimaryActionStyle),
              ...(actionLabel === "Ver obra" ||
              actionLabel === "Continuar" ||
              actionLabel === "Ler agora"
                ? pageBackgroundActionButtonStyle
                : {}),
            }}
          >
            {actionSubLabel ? (
              <span style={continueActionTextWrapStyle}>
                <span style={continueActionMainTextStyle}>{actionLabel}</span>
                <span style={continueActionSubTextStyle}>{actionSubLabel}</span>
              </span>
            ) : (
              actionLabel
            )}
          </Link>
        </div>
      </div>
    </article>
  );
}

function MobileAutorCard({
  autor,
  avaliacao,
  isDesktop,
}: {
  autor: AutorHome;
  avaliacao?: AvaliacaoAutorHome;
  isDesktop?: boolean;
}) {
  const { language } = useHistorietasLanguage();
  const generosAutor = autor.generos.length > 0 ? autor.generos : ["Historietas"];

  return (
    <Link
      href={autor.href}
      style={isDesktop ? desktopAuthorCardStyle : authorCardStyle}
      aria-label={`Abrir perfil do autor ${autor.nome}`}
    >
      <span style={authorCardGlowStyle} aria-hidden="true" />

      <div style={authorCardTopStyle}>
        <div style={authorAvatarShellStyle}>
          {autor.avatar ? (
            <img
              src={autor.avatar}
              alt={`Avatar de ${autor.nome}`}
              style={authorAvatarImageStyle}
            />
          ) : (
            <span style={authorAvatarInitialsStyle}>
              {criarIniciaisAutor(autor.nome)}
            </span>
          )}
        </div>

        <div style={authorIdentityStyle}>
          <h3 style={authorCardNameStyle}>{autor.nome}</h3>

          <p style={authorCardBioStyle}>{traduzirBioAutorHome(autor.bio, language)}</p>
        </div>
      </div>

      <div style={authorMetaRowStyle}>
        <span
          style={authorMetaBadgeStyle}
          aria-label={`${autor.totalObras} ${
            autor.totalObras === 1 ? "obra publicada" : "obras publicadas"
          }`}
        >
          📚 {autor.totalObras}
        </span>

        <span
          style={authorMetaBadgeStyle}
          aria-label={
            avaliacao && avaliacao.total > 0
              ? `Avaliação média ${formatarMediaAvaliacaoAutorHome(
                  avaliacao
                )} de 5, com ${avaliacao.total} ${
                  avaliacao.total === 1 ? "avaliação" : "avaliações"
                }`
              : "Autor ainda sem avaliações"
          }
        >
          <span style={authorRatingStarStyle} aria-hidden="true">
            ★
          </span>
          {formatarMediaAvaliacaoAutorHome(avaliacao)}
        </span>

        {autor.totalCurtidas > 0 && (
          <span style={authorMetaBadgeStyle}>❤️ {autor.totalCurtidas}</span>
        )}

        {autor.totalComentarios > 0 && (
          <span style={authorMetaBadgeStyle}>💬 {autor.totalComentarios}</span>
        )}
      </div>

      <div style={authorBottomRowStyle}>
        <div style={authorGenreRowStyle}>
          {generosAutor.slice(0, 2).map((genero) => (
            <span key={`${autor.chave}-${genero}`} style={authorGenreBadgeStyle}>
              {traduzirGeneroHome(genero, language)}
            </span>
          ))}
        </div>

        <span style={authorProfileButtonStyle}>Ver perfil</span>
      </div>
    </Link>
  );
}

function MobileObraCard({ obra, isDesktop }: { obra: Obra; isDesktop?: boolean }) {
  const { language } = useHistorietasLanguage();
  const obraHref = criarHrefObraCatalogoHome(obra);
  const obraTemArquivo = obraCatalogoTemArquivoAnexadoHome(obra);
  const iconeConteudoObra = obraTemArquivo ? "📄" : "📚";
  const totalConteudoObra = compactarNumeroHome(
    obraTemArquivo ? 1 : obterTotalCapitulosObraCatalogoHome(obra),
  );
 
  const conteudoCard = (
    <>
      <div
        style={
          isDesktop
            ? {
                ...criarMobileCoverThumbStyle(obra),
                minHeight: "122px",
                borderRadius: "16px",
              }
            : criarMobileCoverThumbStyle(obra)
        }
      />

      <div style={obraInfoStyle}>
        <div style={cardTopRowStyle}>
          <h3 style={isDesktop ? desktopObraTitleStyle : obraTitleStyle}>{obra.titulo}</h3>

          <p style={authorStyle}>Por {obra.autor}</p>
        </div>

        <div style={statusRowStyle}>
          <span style={formatBadgeStyle}>{traduzirFormatoHome(obterFormatoObraCatalogoHome(obra), language)}</span>
          <span style={classificationBadgeStyle}>
            {traduzirClassificacaoHome(obra.classificacaoIndicativa, language)}
          </span>
        </div>

        <div style={cardStatsStyle}>
          <span style={cardStatItemStyle}>
            <span style={cardStatIconStyle}>👁️</span>
            <span style={cardStatValueStyle}>{obra.views}</span>
          </span>

          <span style={cardStatItemStyle}>
            <span style={cardStatHeartIconStyle}>❤️</span>
            <span style={cardStatValueStyle}>{obra.likes}</span>
          </span>

          <span style={cardStatItemStyle}>
            <span style={cardStatIconStyle}>💬</span>
            <span style={cardStatValueStyle}>{obra.comentarios}</span>
          </span>

          <span style={cardStatItemStyle}>
            <span style={cardStatIconStyle}>{iconeConteudoObra}</span>
            <span style={cardStatValueStyle}>{totalConteudoObra}</span>
          </span>

         </div>

        <div style={isDesktop ? desktopCardActionRowStyle : mobileCardActionRowStyle}>
          <span style={isDesktop ? desktopCardGenreBadgeStyle : mobileCardGenreBadgeStyle}>
            {traduzirGeneroHome(obra.genero, language)}
          </span>

          <span
            style={{
              ...(obra.disponivel
                ? isDesktop
                  ? desktopCardPrimaryActionStyle
                  : mobileCardPrimaryActionStyle
                : isDesktop
                  ? desktopCardSecondaryActionStyle
                  : mobileCardSecondaryActionStyle),
              ...(obra.disponivel
                ? pageBackgroundActionButtonStyle
                : {}),
            }}
          >
            {obra.disponivel ? "Ver obra" : "Ver detalhes"}
          </span>
        </div>
      </div>
    </>
  );

  return (
    <Link
      href={obraHref}
      style={
        isDesktop
          ? obra.disponivel
            ? desktopObraCardStyle
            : desktopObraCardSoonStyle
          : obra.disponivel
            ? obraCardStyle
            : obraCardSoonStyle
      }
      aria-label={`Abrir página da obra ${obra.titulo}`}
    >
      {conteudoCard}
    </Link>
  );
}

function HomeEmptyState() {
  return (
    <p
      style={{
        margin: "10px 0 0",
        color: "#FFFFFF",
        fontSize: "12px",
        fontWeight: 800,
        textAlign: "center",
      }}
    >
      Nenhuma obra cadastrada
    </p>
  );
}

function EmptySearch() {
  return (
    <p
      style={{
        margin: "10px 0 0",
        color: "#FFFFFF",
        fontSize: "12px",
        fontWeight: 800,
        textAlign: "center",
      }}
    >
      Nenhuma obra encontrada
    </p>
  );
}

function CarouselRow({
  children,
  isDesktop,
  variant = "obra",
}: {
  children: ReactNode;
  isDesktop: boolean;
  variant?: "obra" | "autor";
}) {
  const rowRef = useRef<HTMLDivElement | null>(null);
  const totalItems = Children.count(children);
  const precisaDeCarrossel = isDesktop && totalItems > 3;

  const listStyle = !isDesktop
    ? variant === "autor"
      ? authorListStyle
      : storyListStyle
    : precisaDeCarrossel
      ? variant === "autor"
        ? desktopAuthorListStyle
        : desktopStoryListStyle
      : variant === "autor"
        ? desktopStaticAuthorListStyle
        : desktopStaticStoryListStyle;

  useEffect(() => {
    const row = rowRef.current;

    if (!row) {
      return;
    }

    const voltarParaInicio = () => {
      row.scrollLeft = 0;
    };

    voltarParaInicio();

    const frame = window.requestAnimationFrame(voltarParaInicio);
    const timer = window.setTimeout(voltarParaInicio, 90);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [isDesktop, precisaDeCarrossel, totalItems, variant]);

  function rolarCarrossel(direcao: -1 | 1) {
    rowRef.current?.scrollBy({
      left: direcao * 450,
      behavior: "smooth",
    });
  }

  if (!isDesktop || !precisaDeCarrossel) {
    return (
      <div ref={rowRef} style={listStyle}>
        {children}
      </div>
    );
  }

  return (
    <div style={desktopCarouselShellStyle}>
      <button
        type="button"
        onClick={() => rolarCarrossel(-1)}
        style={desktopCarouselArrowLeftStyle}
        aria-label="Rolar carrossel para a esquerda"
      >
        <span
          aria-hidden="true"
          style={desktopCarouselArrowLeftIconStyle}
        />
      </button>

      <div ref={rowRef} style={listStyle}>
        {children}
      </div>

      <button
        type="button"
        onClick={() => rolarCarrossel(1)}
        style={desktopCarouselArrowRightStyle}
        aria-label="Rolar carrossel para a direita"
      >
        <span
          aria-hidden="true"
          style={desktopCarouselArrowRightIconStyle}
        />
      </button>
    </div>
  );
}

const themePageCss = `
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

  body {
    background: var(--historietas-bg-start, #000000) !important;
    color: var(--historietas-text-primary, #FFFFFF) !important;
  }

  nav,
  [data-bottom-nav],
  [data-mobile-nav],
  nav:has(a[href="/publicar"]),
  div:has(> a[href="/publicar"]):has(> a[href="/perfil-autor?aba=biblioteca"]) {
    background: var(--historietas-bottom-nav-bg, #000000) !important;
    border-color: var(--historietas-bottom-nav-border, var(--historietas-border-soft, rgba(255,255,255,0.12))) !important;
    box-shadow: var(--historietas-bottom-nav-shadow, none) !important;
    color: var(--historietas-bottom-nav-text, var(--historietas-text-secondary, #A1A1AA)) !important;
  }

  nav::before,
  [data-bottom-nav]::before,
  [data-mobile-nav]::before {
    background: var(--historietas-bottom-nav-shine, none) !important;
  }

  nav a,
  [data-bottom-nav] a,
  [data-mobile-nav] a,
  nav button,
  [data-bottom-nav] button,
  [data-mobile-nav] button {
    color: var(--historietas-bottom-nav-text, var(--historietas-text-secondary, #A1A1AA)) !important;
    box-shadow: none !important;
  }

  nav a:hover,
  [data-bottom-nav] a:hover,
  [data-mobile-nav] a:hover,
  nav button:hover,
  [data-bottom-nav] button:hover,
  [data-mobile-nav] button:hover {
    background: var(--historietas-bottom-nav-hover-bg, var(--historietas-active-surface, rgba(255,255,255,0.055))) !important;
    border-color: var(--historietas-bottom-nav-border, var(--historietas-border-soft, rgba(255,255,255,0.10))) !important;
    color: var(--historietas-bottom-nav-hover-text, var(--historietas-text-primary, #FFFFFF)) !important;
  }

  nav a[href="/"],
  [data-bottom-nav] a[href="/"],
  [data-mobile-nav] a[href="/"] {
    background: #000000 !important;
    border-color: rgba(255,255,255,0.18) !important;
    color: #FFFFFF !important;
  }

  nav a[href="/publicar"],
  [data-bottom-nav] a[href="/publicar"],
  [data-mobile-nav] a[href="/publicar"] {
    background: #000000 !important;
    border-color: #FFFFFF !important;
    box-shadow: none !important;
    color: #FFFFFF !important;
  }

  nav .historietas-bottom-nav-icon,
  [data-bottom-nav] .historietas-bottom-nav-icon,
  [data-mobile-nav] .historietas-bottom-nav-icon {
    color: var(--historietas-bottom-nav-icon-text, #FFFFFF) !important;
    background: var(--historietas-bottom-nav-icon-bg, var(--historietas-surface, rgba(255,255,255,0.045))) !important;
    border-color: var(--historietas-bottom-nav-icon-border, var(--historietas-border-soft, rgba(255,255,255,0.055))) !important;
  }

  nav a[href="/publicar"] .historietas-bottom-nav-icon,
  [data-bottom-nav] a[href="/publicar"] .historietas-bottom-nav-icon,
  [data-mobile-nav] a[href="/publicar"] .historietas-bottom-nav-icon {
    color: #FFFFFF !important;
    background: var(--historietas-bottom-nav-main-icon-bg, rgba(255,255,255,0.16)) !important;
    border-color: var(--historietas-bottom-nav-main-icon-border, rgba(255,255,255,0.18)) !important;
  }



  .historietas-home-search-toggle,
  .historietas-home-search-toggle:hover,
  .historietas-home-search-toggle:active,
  .historietas-home-search-toggle:focus,
  .historietas-home-search-toggle:focus-visible {
    background: transparent !important;
    border: 0 !important;
    box-shadow: none !important;
    outline: none !important;
    filter: none !important;
    backdrop-filter: none !important;
    -webkit-tap-highlight-color: transparent !important;
  }

  .historietas-home-header-search-input,
  .historietas-home-header-search-input:hover,
  .historietas-home-header-search-input:focus,
  .historietas-home-header-search-input:focus-visible {
    border-color: transparent !important;
    box-shadow: none !important;
    outline: none !important;
    filter: none !important;
    backdrop-filter: none !important;
  }

  .historietas-home-header {
    background: #000000 !important;
    border-color: rgba(255,255,255,0.10) !important;
    color: #FFFFFF !important;
    box-shadow: none !important;
  }

  .historietas-home-logo {
    color: #FFFFFF !important;
  }

  .historietas-home-logo-mark {
    background: #000000 !important;
    border-color: rgba(255,255,255,0.22) !important;
    color: #FFFFFF !important;
    box-shadow: none !important;
  }

  .historietas-home-logo-text {
    background: none !important;
    color: #FFFFFF !important;
    -webkit-text-fill-color: #FFFFFF !important;
    text-shadow: none !important;
  }

  .historietas-home-header-search-input {
    background: #050505 !important;
    border-color: rgba(255,255,255,0.18) !important;
    color: #FFFFFF !important;
    box-shadow: none !important;
    outline: none !important;
  }

  .historietas-home-header-search-input::placeholder {
    color: #A1A1AA !important;
  }

  .historietas-home-search-toggle,
  .historietas-home-search-toggle:hover,
  .historietas-home-search-toggle:active,
  .historietas-home-search-toggle:focus,
  .historietas-home-search-toggle:focus-visible {
    background: transparent !important;
    border: 0 !important;
    color: #FFFFFF !important;
    box-shadow: none !important;
    outline: none !important;
  }

  .historietas-home-header-actions a {
    background: #050505 !important;
    border-color: rgba(255,255,255,0.18) !important;
    color: #FFFFFF !important;
    box-shadow: none !important;
  }

  .historietas-home-desktop-menu a {
    background: #050505 !important;
    border-color: rgba(255,255,255,0.14) !important;
    color: #D4D4D8 !important;
    box-shadow: none !important;
  }

  .historietas-home-desktop-menu a[href="/"] {
    background: #FFFFFF !important;
    border-color: #FFFFFF !important;
    color: #000000 !important;
  }

  .historietas-home-desktop-links::-webkit-scrollbar {
    display: none;
  }

  .historietas-home-desktop-link:hover,
  .historietas-home-desktop-link:focus-visible {
    color: #FFFFFF !important;
  }

  .historietas-home-desktop-icon-link:hover,
  .historietas-home-desktop-icon-link:focus-visible,
  .historietas-home-desktop-profile-link:hover,
  .historietas-home-desktop-profile-link:focus-visible {
    background: rgba(255,255,255,0.08) !important;
    color: #FFFFFF !important;
    outline: none !important;
  }

`;

const safeTextStyle: CSSProperties = {
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

const pageDecorationLayerStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  overflow: "hidden",
  pointerEvents: "none",
  zIndex: 0,
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

const heroDecorationLayerStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  overflow: "hidden",
  pointerEvents: "none",
  zIndex: 0,
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

// Teste: identidade tipográfica trazida da página Lista.
// Mantém os tamanhos e o layout próprios da Home.
const listaPageTitleTypographyStyle: CSSProperties = {
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontWeight: 900,
  letterSpacing: "-0.035em",
};

const listaWorkTitleTypographyStyle: CSSProperties = {
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontWeight: 500,
  letterSpacing: "-0.01em",
};

const listaAuthorMetaTypographyStyle: CSSProperties = {
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontWeight: 450,
  lineHeight: 1.25,
};

const pageStyle: CSSProperties = {
  position: "relative",
  minHeight: "100vh",
  width: "100%",
  maxWidth: "100vw",
  overflowX: "clip",
  background:
    "var(--historietas-bg-start, #000000)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const containerStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: "min(820px, calc(100% - 24px))",
  maxWidth: "100%",
  margin: "0 auto",
  boxSizing: "border-box",
  minWidth: 0,
};

const navStyle: CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 30,
  background: "#000000",
  borderBottom: "0",
  boxShadow: "none",
  maxWidth: "100vw",
  overflowX: "hidden",
};


const desktopNavStyle: CSSProperties = {
  ...navStyle,
  background: "#111113",
  borderBottom: "0",
  boxShadow: "none",
  overflow: "visible",
};
const mobileNavStyle: CSSProperties = {
  ...navStyle,
  background: "#000000",
  borderBottom: "0",
  boxShadow: "none",
  overflow: "visible",
};

const navInnerStyle: CSSProperties = {
  width: "min(820px, calc(100% - 24px))",
  maxWidth: "100%",
  margin: "0 auto",
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "12px",
  padding: "14px 0 12px",
  boxSizing: "border-box",
  minWidth: 0,
};

const navTopRowStyle: CSSProperties = {
  position: "relative",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "14px",
  flexWrap: "wrap",
  maxWidth: "100%",
  boxSizing: "border-box",
  minWidth: 0,
};

const desktopContainerStyle: CSSProperties = {
  ...containerStyle,
  width: "min(1760px, calc(100% - 48px))",
};

const desktopNavInnerStyle: CSSProperties = {
  width: "min(1760px, calc(100% - 48px))",
  maxWidth: "100%",
  minHeight: "70px",
  margin: "0 auto",
  display: "grid",
  gridTemplateColumns: "auto minmax(0, 1fr) minmax(176px, 360px) auto",
  alignItems: "center",
  gap: "clamp(12px, 1.45vw, 26px)",
  padding: "0",
  boxSizing: "border-box",
  minWidth: 0,
};

const desktopLogoStyle: CSSProperties = {
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "25px",
  ...listaPageTitleTypographyStyle,
  display: "flex",
  alignItems: "center",
  gap: "4px",
  flex: "0 0 auto",
  minWidth: 0,
  ...safeTextStyle,
};

const desktopLogoMarkStyle: CSSProperties = {
  width: "36px",
  height: "36px",
  borderRadius: "10px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#08080A",
  color: "#FFFFFF",
  fontSize: "20px",
  fontWeight: 950,
  letterSpacing: 0,
  flex: "0 0 auto",
  border: "1px solid rgba(255,255,255,0.18)",
  boxShadow: "none",
};

const desktopLogoTextStyle: CSSProperties = {
  marginLeft: "-1px",
  background: "none",
  color: "#FFFFFF",
  WebkitTextFillColor: "#FFFFFF",
  textShadow: "none",
};

const logoStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  fontSize: "25px",
  ...listaPageTitleTypographyStyle,
  display: "flex",
  alignItems: "center",
  gap: "4px",
  minWidth: 0,
  maxWidth: "min(100%, calc(100% - 96px))",
  ...safeTextStyle,
};

const logoMarkStyle: CSSProperties = {
  width: "34px",
  height: "34px",
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#000000",
  color: "#FFFFFF",
  fontSize: "19px",
  fontWeight: 950,
  letterSpacing: 0,
  flex: "0 0 auto",
  border: "1px solid rgba(255,255,255,0.22)",
  boxShadow: "none",
};

const logoTextStyle: CSSProperties = {
  marginLeft: "-1px",
  background:
    "linear-gradient(135deg, #FFFFFF 0%, #FFFFFF 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  textShadow: "none",
};

const navIconsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  flex: "0 0 auto",
  maxWidth: "100%",
};

const mobileHeaderSearchAreaStyle: CSSProperties = {
  position: "absolute",
  zIndex: 30,
  top: "50%",
  left: "158px",
  right: "36px",
  width: "auto",
  minWidth: 0,
  height: "34px",
  transform: "translateY(-50%)",
};

const mobileHeaderSearchInputStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  width: "100%",
  minWidth: 0,
  height: "34px",
  borderRadius: "999px",
  border: "none",
  background: "#000000",
  color: "#FFFFFF",
  padding: "0 10px",
  outline: "none",
  fontFamily: "inherit",
  fontSize: "13px",
  fontWeight: 700,
  boxSizing: "border-box",
  boxShadow: "none",
};







const mobileSearchToggleStyle: CSSProperties = {
  width: "34px",
  height: "34px",
  borderRadius: 0,
  border: 0,
  background: "transparent",
  color: "#FFFFFF",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
  fontSize: "15px",
  cursor: "pointer",
  flex: "0 0 auto",
  boxShadow: "none",
  outline: "none",
  WebkitTapHighlightColor: "transparent",
  WebkitAppearance: "none",
  appearance: "none",
};

const mobileSearchToggleActiveStyle: CSSProperties = {
  ...mobileSearchToggleStyle,
  border: 0,
  background: "transparent",
  color: "#FFFFFF",
  boxShadow: "none",
  outline: "none",
};


const desktopMenuStyle: CSSProperties = {
  display: "flex",
  alignItems: "stretch",
  gap: "clamp(15px, 1.15vw, 24px)",
  minWidth: 0,
  maxWidth: "100%",
  height: "70px",
  overflowX: "auto",
  overflowY: "hidden",
  padding: 0,
  scrollbarWidth: "none",
};

const desktopInlineSearchAreaStyle: CSSProperties = {
  position: "relative",
  zIndex: 30,
  width: "100%",
  minWidth: 0,
  maxWidth: "360px",
  height: "40px",
  display: "flex",
  alignItems: "center",
};







const desktopLinkStyle: CSSProperties = {
  position: "relative",
  color: "#C5C5C8",
  textDecoration: "none",
  fontSize: "13.5px",
  fontWeight: 700,
  lineHeight: 1,
  whiteSpace: "nowrap",
  flex: "0 0 auto",
  height: "70px",
  padding: "0",
  display: "inline-flex",
  alignItems: "center",
  borderBottom: "2px solid transparent",
  background: "transparent",
  borderRadius: 0,
  transition: "color 160ms ease, border-color 160ms ease",
};

const desktopActiveLinkStyle: CSSProperties = {
  ...desktopLinkStyle,
  color: "#FFFFFF",
  borderBottomColor: "#FFFFFF",
};

const desktopInputStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  height: "40px",
  borderRadius: "6px",
  border: "0",
  background: "#1B1B1E",
  color: "#FFFFFF",
  padding: "0 13px 0 40px",
  outline: "none",
  fontFamily: "inherit",
  fontSize: "13.5px",
  fontWeight: 650,
  boxSizing: "border-box",
  boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)",
};

const desktopSearchIconStyle: CSSProperties = {
  position: "absolute",
  zIndex: 1,
  left: "12px",
  top: "50%",
  transform: "translateY(-50%)",
  color: "#A5A5AA",
  pointerEvents: "none",
};

const desktopHeaderActionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: "4px",
  flex: "0 0 auto",
};

const desktopHeaderIconLinkStyle: CSSProperties = {
  position: "relative",
  width: "40px",
  height: "40px",
  borderRadius: "6px",
  border: 0,
  background: "transparent",
  color: "#D8D8DA",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flex: "0 0 auto",
  transition: "background 160ms ease, color 160ms ease",
};

const desktopNotificationCountBadgeStyle: CSSProperties = {
  position: "absolute",
  top: "2px",
  right: "1px",
  minWidth: "17px",
  height: "17px",
  padding: "0 4px",
  borderRadius: "999px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: "2px solid #111113",
  background: "#EF4444",
  color: "#FFFFFF",
  fontSize: "9px",
  lineHeight: 1,
  fontWeight: 900,
  letterSpacing: "-0.03em",
  boxSizing: "border-box",
  pointerEvents: "none",
};

const desktopProfileLinkStyle: CSSProperties = {
  width: "44px",
  height: "44px",
  marginLeft: "2px",
  borderRadius: "6px",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#FFFFFF",
  background: "transparent",
  transition: "background 160ms ease",
};

const desktopProfileAvatarStyle: CSSProperties = {
  width: "34px",
  height: "34px",
  borderRadius: "999px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#08080A",
  color: "#FFFFFF",
  border: "1px solid rgba(255,255,255,0.22)",
  boxSizing: "border-box",
};

const heroStyle: CSSProperties = {
  marginTop: "8px",
  borderRadius: "28px",
  overflow: "hidden",
  border: "1px solid rgba(255,255,255,0.06)",
  boxShadow: "none",
  position: "relative",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const desktopHeroStyle: CSSProperties = {
  marginTop: "-4px",
  minHeight: 0,
  borderRadius: 0,
  border: "none",
  boxShadow: "none",
  background: "transparent",
  overflow: "visible",
};

const desktopHeroShellStyle: CSSProperties = {
  position: "relative",
  zIndex: 2,
  width: "100%",
  display: "grid",
  gridTemplateColumns: "minmax(350px, 1.03fr) minmax(0, 0.97fr)",
  alignItems: "center",
  gap: "clamp(34px, 4.5vw, 82px)",
  minHeight: "clamp(440px, 40vw, 590px)",
  padding: "clamp(18px, 2vw, 32px) 0",
  boxSizing: "border-box",
};

const desktopHeroPosterFrameStyle: CSSProperties = {
  position: "relative",
  width: "100%",
  maxWidth: "650px",
  height: "clamp(400px, 35vw, 530px)",
  minHeight: "400px",
  justifySelf: "start",
  padding: "5px",
  borderRadius: "28px",
  overflow: "hidden",
  border: "1px solid rgba(255,255,255,0.08)",
  background:
    "linear-gradient(145deg, #050505 0%, #0B0B0D 58%, #000000 100%)",
  boxShadow:
    "0 24px 64px rgba(0,0,0,0.26), inset 0 0 0 1px rgba(255,255,255,0.025)",
  boxSizing: "border-box",
};

const desktopHeroPosterStyle: CSSProperties = {
  position: "relative",
  width: "100%",
  height: "100%",
  minHeight: 0,
  borderRadius: "22px",
  overflow: "hidden",
  border: "1px solid rgba(255,255,255,0.06)",
  boxShadow: "none",
  textDecoration: "none",
  color: "#FFFFFF",
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-end",
  gap: "10px",
  padding: "22px",
  boxSizing: "border-box",
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
};

const desktopHeroPosterGlowStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "linear-gradient(180deg, rgba(4, 0, 10, 0.02) 0%, rgba(4, 0, 10, 0.54) 100%)",
  pointerEvents: "none",
};




const desktopHeroPosterTitleStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  color: "#FFFFFF",
  fontSize: "28px",
  lineHeight: 1.06,
  ...listaWorkTitleTypographyStyle,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

const desktopHeroPosterStatusStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: "fit-content",
  maxWidth: "100%",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "13px",
  fontWeight: 900,
  ...safeTextStyle,
};


const heroGlowStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "linear-gradient(180deg, rgba(4, 0, 10, 0.18) 0%, #000000 100%)",
};


const mobileHeroImageGlowStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  background: "transparent",
};

const heroContentStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  minHeight: "min(460px, 68vh)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-end",
  gap: "15px",
  padding: "24px 16px 22px",
  boxSizing: "border-box",
  maxWidth: "100%",
  minWidth: 0,
};

const desktopHeroContentStyle: CSSProperties = {
  position: "relative",
  zIndex: 3,
  width: "100%",
  maxWidth: "650px",
  minWidth: 0,
  justifySelf: "center",
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  justifyContent: "center",
  gap: "15px",
  padding: "clamp(8px, 1vw, 18px) clamp(12px, 1.5vw, 28px)",
  textAlign: "left",
  boxSizing: "border-box",
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

const desktopHeroKickerStyle: CSSProperties = {
  color: "#D7D7DA",
  fontSize: "12px",
  fontWeight: 800,
  lineHeight: 1,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  textShadow: "0 2px 12px rgba(0,0,0,0.70)",
};

const desktopHeroAuthorStyle: CSSProperties = {
  color: "#FFFFFF",
  fontWeight: 750,
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

const desktopHeroGenreStyle: CSSProperties = {
  color: "#D2D2D5",
  textShadow: "0 2px 12px rgba(0,0,0,0.62)",
  ...safeTextStyle,
};

const desktopHeroClassificationStyle: CSSProperties = {
  minHeight: 0,
  padding: 0,
  borderRadius: 0,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "flex-start",
  background: "transparent",
  border: "none",
  color: "#D2D2D5",
  fontSize: "13.5px",
  fontWeight: 650,
  lineHeight: 1.25,
  boxSizing: "border-box",
  textShadow: "0 2px 12px rgba(0,0,0,0.62)",
  ...safeTextStyle,
};


const heroPillStyle: CSSProperties = {
  maxWidth: "100%",
  minHeight: "34px",
  padding: "8px 14px",
  borderRadius: "999px",
  background: "#000000",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#FFFFFF",
  fontSize: "12.5px",
  fontWeight: 950,
  boxShadow: "none",
  textShadow: "0 1px 0 rgba(0,0,0,0.28)",
  ...safeTextStyle,
};

const heroTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "clamp(34px, 11vw, 72px)",
  lineHeight: 0.96,
  ...listaWorkTitleTypographyStyle,
  maxWidth: "100%",
  textShadow:
    "0 1px 0 rgba(0,0,0,0.34), 0 2px 12px rgba(0,0,0,0.34)",
  ...safeTextStyle,
};

const desktopHeroTitleStyle: CSSProperties = {
  ...heroTitleStyle,
  width: "100%",
  maxWidth: "700px",
  margin: 0,
  fontSize: "clamp(46px, 5.2vw, 78px)",
  lineHeight: 0.98,
  textAlign: "left",
  color: "#FFFFFF",
  textShadow:
    "0 2px 0 rgba(0,0,0,0.40), 0 8px 28px rgba(0,0,0,0.62)",
};

const heroDescriptionStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "15px",
  ...listaAuthorMetaTypographyStyle,
  lineHeight: 1.55,
  maxWidth: "100%",
  textShadow:
    "0 1px 0 rgba(0,0,0,0.32), 0 2px 10px rgba(0,0,0,0.30)",
  ...safeTextStyle,
};

const desktopHeroDescriptionStyle: CSSProperties = {
  ...heroDescriptionStyle,
  width: "100%",
  maxWidth: "620px",
  minHeight: 0,
  margin: 0,
  color: "#D5D5D8",
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
};


const heroButtonsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(138px, 1fr))",
  gap: "10px",
  maxWidth: "100%",
  boxSizing: "border-box",
  minWidth: 0,
};

const mobileHeroButtonsStyle: CSSProperties = {
  ...heroButtonsStyle,
  position: "absolute",
  left: "16px",
  right: "16px",
  bottom: "58px",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  alignSelf: "auto",
  width: "auto",
};

const desktopHeroButtonsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: "10px",
  width: "auto",
  maxWidth: "100%",
  marginTop: "5px",
  boxSizing: "border-box",
  minWidth: 0,
};

const desktopHeroInitialButtonsStyle: CSSProperties = {
  ...desktopHeroButtonsStyle,
  flexWrap: "wrap",
};

const desktopPrimaryButtonStyle: CSSProperties = {
  minWidth: "164px",
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
  fontSize: "14px",
  fontWeight: 850,
  lineHeight: 1.1,
  textAlign: "center",
  boxSizing: "border-box",
  boxShadow: "0 10px 28px rgba(0,0,0,0.28)",
  cursor: "pointer",
  ...safeTextStyle,
};

const desktopSecondaryButtonStyle: CSSProperties = {
  ...desktopPrimaryButtonStyle,
  minWidth: "154px",
  background: "rgba(10,10,12,0.74)",
  color: "#FFFFFF",
  border: "1px solid rgba(255,255,255,0.34)",
  boxShadow: "none",
};

const desktopHeroSaveButtonStyle: CSSProperties = {
  ...desktopSecondaryButtonStyle,
  minWidth: "140px",
  fontFamily: "inherit",
  appearance: "none",
  WebkitAppearance: "none",
};

const desktopHeroLoginNoticeStyle: CSSProperties = {
  margin: "-2px 0 0",
  color: "#F4F4F5",
  fontSize: "12.5px",
  fontWeight: 700,
  lineHeight: 1.35,
  textShadow: "0 2px 12px rgba(0,0,0,0.72)",
  maxWidth: "100%",
  ...safeTextStyle,
};

const mobileHeroInitialButtonsStyle: CSSProperties = {
  ...mobileHeroButtonsStyle,
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  justifyContent: "center",
  justifyItems: "stretch",
};

const primaryButtonStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "50px",
  padding: "0 22px",
  borderRadius: "999px",
  background: "#000000",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "15px",
  fontWeight: 900,
  border: "1px solid rgba(255,255,255,0.08)",
  textAlign: "center",
  lineHeight: 1.15,
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  whiteSpace: "normal",
  boxShadow: "none",
  ...safeTextStyle,
};

const secondaryButtonStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "50px",
  padding: "0 22px",
  borderRadius: "999px",
  background: "#000000",
  color: "#FFFFFF",
  textDecoration: "none",
  fontFamily: "inherit",
  fontSize: "15px",
  fontWeight: 900,
  border: "1px solid rgba(255,255,255,0.08)",
  appearance: "none",
  cursor: "pointer",
  textAlign: "center",
  lineHeight: 1.15,
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  whiteSpace: "normal",
  boxShadow: "none",
  ...safeTextStyle,
};

const heroSaveButtonStyle: CSSProperties = {
  ...primaryButtonStyle,
  fontFamily: "inherit",
  appearance: "none",
  cursor: "pointer",
};

const heroLoginNoticeStyle: CSSProperties = {
  margin: "2px 0 0",
  color: "#DDD6FE",
  fontSize: "13px",
  fontWeight: 800,
  lineHeight: 1.35,
  maxWidth: "100%",
  ...safeTextStyle,
};

const heroDotsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  marginTop: "4px",
  flexWrap: "wrap",
  maxWidth: "100%",
};

const heroDotStyle: CSSProperties = {
  width: "18px",
  height: "5px",
  borderRadius: "999px",
  border: "0",
  background: "color-mix(in srgb, var(--historietas-text-secondary, #FFFFFF) 24%, transparent)",
  cursor: "pointer",
};


const desktopHeroFooterStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  justifyContent: "flex-start",
  gap: "16px",
  width: "100%",
  maxWidth: "100%",
  minWidth: 0,
  marginTop: "3px",
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

const desktopHeroStatItemStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: "6px",
  minWidth: 0,
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: 0,
  boxSizing: "border-box",
  whiteSpace: "nowrap",
  textShadow: "0 2px 12px rgba(0,0,0,0.76)",
  ...safeTextStyle,
};

const desktopHeroStatIconStyle: CSSProperties = {
  lineHeight: 1,
  flexShrink: 0,
};


const desktopHeroStatValueStyle: CSSProperties = {
  display: "inline-block",
  minWidth: 0,
  overflow: "visible",
  textOverflow: "clip",
  whiteSpace: "nowrap",
};

const desktopHeroDotsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: "7px",
  width: "auto",
  maxWidth: "100%",
  minWidth: 0,
  marginTop: 0,
  flexWrap: "nowrap",
};

const desktopHeroDotStyle: CSSProperties = {
  width: "28px",
  height: "4px",
  borderRadius: "999px",
  border: 0,
  padding: 0,
  background: "rgba(255,255,255,0.28)",
  cursor: "pointer",
};

const desktopHeroDotActiveStyle: CSSProperties = {
  ...desktopHeroDotStyle,
  width: "46px",
  background: "#FFFFFF",
};

const mobileHeroContentStyle: CSSProperties = {
  ...heroContentStyle,
  display: "block",
  minHeight: "min(460px, 68vh)",
  padding: "22px 16px 18px",
  position: "relative",
};

const mobileHeroMetaStyle: CSSProperties = {
  position: "absolute",
  top: "22px",
  left: "16px",
  right: "16px",
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: "8px",
  flexWrap: "wrap",
  maxWidth: "calc(100% - 32px)",
  minWidth: 0,
};

const mobileHeroPillStyle: CSSProperties = {
  ...heroPillStyle,
  padding: "8px 13px",
  background: "#000000",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#FFFFFF",
  boxShadow: "none",
  textShadow: "0 1px 0 rgba(0,0,0,0.28)",
};

const mobileHeroTextBlockStyle: CSSProperties = {
  position: "absolute",
  left: "16px",
  right: "16px",
  bottom: "120px",
  display: "grid",
  justifyItems: "center",
  gap: "4px",
  textAlign: "center",
  width: "auto",
  maxWidth: "none",
  minWidth: 0,
};

const mobileHeroTitleStyle: CSSProperties = {
  ...heroTitleStyle,
  width: "100%",
  textAlign: "center",
  fontSize: "clamp(34px, 10.2vw, 60px)",
  lineHeight: 0.96,
  textShadow:
    "0 1px 0 rgba(0,0,0,0.34), 0 2px 12px rgba(0,0,0,0.34)",
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

const mobileHeroDescriptionStyle: CSSProperties = {
  ...heroDescriptionStyle,
  justifySelf: "center",
  textAlign: "center",
  color: "#FFFFFF",
  fontSize: "14px",
  lineHeight: 1.5,
  textShadow:
    "0 1px 0 rgba(0,0,0,0.32), 0 2px 10px rgba(0,0,0,0.30)",
  display: "-webkit-box",
  WebkitLineClamp: 3,
  WebkitBoxOrient: "vertical",
  width: "100%",
  maxWidth: "560px",
  overflow: "hidden",
  overflowWrap: "anywhere",
  wordBreak: "break-word",
  hyphens: "auto",
};

const mobileHeroFooterStyle: CSSProperties = {
  position: "absolute",
  left: "16px",
  right: "16px",
  bottom: "18px",
  display: "grid",
  gridTemplateColumns: "156px minmax(0, 1fr)",
  alignSelf: "auto",
  alignItems: "center",
  gap: "8px",
  width: "auto",
  maxWidth: "none",
  minWidth: 0,
};

const mobileHeroStatsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  alignItems: "center",
  justifyContent: "stretch",
  columnGap: "5px",
  color: "#FFFFFF",
  fontSize: "11.5px",
  fontWeight: 900,
  textShadow: "0 2px 12px rgba(0,0,0,0.78)",
  width: "156px",
  maxWidth: "100%",
  minWidth: "156px",
  whiteSpace: "nowrap",
};

const mobileHeroStatItemStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "3px",
  minWidth: 0,
  width: "100%",
  whiteSpace: "nowrap",
  textShadow: "0 1px 0 rgba(0,0,0,0.28)",
};

const mobileHeroStatIconStyle: CSSProperties = {
  lineHeight: 1,
  flexShrink: 0,
};


const mobileHeroStatValueStyle: CSSProperties = {
  display: "inline-block",
  minWidth: 0,
  overflow: "visible",
  textOverflow: "clip",
  whiteSpace: "nowrap",
};

const mobileHeroDotsStyle: CSSProperties = {
  ...heroDotsStyle,
  justifyContent: "flex-end",
  marginTop: 0,
  marginLeft: 0,
  gap: "6px",
};

const mobileHeroDotStyle: CSSProperties = {
  ...heroDotStyle,
  width: "16px",
};

const mobileHeroDotActiveStyle: CSSProperties = {
  ...mobileHeroDotStyle,
  width: "34px",
  background: "rgba(255,255,255,0.58)",
};

const summaryStripStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto minmax(0, 1fr)",
  alignItems: "center",
  gap: "0",
  marginTop: "14px",
  padding: "0",
  borderRadius: "0",
  background: "transparent",
  border: "0",
  boxShadow: "none",
  maxWidth: "100%",
  boxSizing: "border-box",
  minWidth: 0,
  overflow: "visible",
};

const desktopSummaryStripStyle: CSSProperties = {
  ...summaryStripStyle,
  gridTemplateColumns: "minmax(0, 1fr) auto minmax(0, 1fr)",
  gap: "0",
  padding: "0",
  borderRadius: "0",
};

const summaryItemStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "42px",
  padding: "8px 10px",
  maxWidth: "100%",
  minWidth: 0,
  borderRadius: "0",
  background: "transparent",
  border: "0",
  textDecoration: "none",
  color: "#FFFFFF",
  boxSizing: "border-box",
};

const summaryDividerLineStyle: CSSProperties = {
  width: "1px",
  height: "30px",
  alignSelf: "center",
  justifySelf: "center",
  background: "rgba(255,255,255,0.20)",
  borderRadius: "999px",
};

const summaryNumberStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "17px",
  lineHeight: 1,
  fontWeight: 950,
  textAlign: "center",
  ...safeTextStyle,
};


const sectionStyle: CSSProperties = {
  marginTop: "24px",
  maxWidth: "100%",
  boxSizing: "border-box",
  minWidth: 0,
};

const lastSectionStyle: CSSProperties = {
  marginTop: "24px",
  paddingBottom: "22px",
  maxWidth: "100%",
  boxSizing: "border-box",
  minWidth: 0,
};

const desktopSectionStyle: CSSProperties = {
  ...sectionStyle,
  marginTop: "30px",
};

const desktopLastSectionStyle: CSSProperties = {
  ...lastSectionStyle,
  marginTop: "30px",
  paddingBottom: "76px",
};

const sectionHeaderStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  justifyItems: "center",
  gap: "6px",
  marginBottom: "14px",
  maxWidth: "100%",
  minWidth: 0,
  textAlign: "center",
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  color: "#FFFFFF",
  fontSize: "clamp(24px, 4vw, 30px)",
  lineHeight: 1.05,
  ...listaPageTitleTypographyStyle,
  maxWidth: "100%",
  textAlign: "center",
  ...safeTextStyle,
};

const storyListStyle: CSSProperties = {
  display: "flex",
  gap: "14px",
  width: "calc(100% + 24px)",
  maxWidth: "calc(100% + 24px)",
  minWidth: 0,
  boxSizing: "border-box",
  overflowX: "auto",
  overflowY: "hidden",
  padding: "2px 12px 8px",
  margin: "0 -12px",
  scrollSnapType: "x mandatory",
  scrollPaddingLeft: "12px",
  scrollPaddingRight: "12px",
  scrollbarWidth: "none",
  msOverflowStyle: "none",
};

const desktopCarouselShellStyle: CSSProperties = {
  position: "relative",
  width: "100%",
  maxWidth: "100%",
  overflow: "visible",
  boxSizing: "border-box",
};

const desktopStoryListStyle: CSSProperties = {
  ...storyListStyle,
  gap: "18px",
  width: "100vw",
  maxWidth: "100vw",
  marginLeft: "calc(50% - 50vw)",
  marginRight: "calc(50% - 50vw)",
  padding:
    "6px max(24px, calc((100vw - 1760px) / 2)) 20px",
  scrollPaddingLeft: "max(24px, calc((100vw - 1760px) / 2))",
  scrollPaddingRight: "max(24px, calc((100vw - 1760px) / 2))",
};

const desktopStaticStoryListStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, 360px)",
  justifyContent: "space-between",
  gap: "18px",
  width: "100%",
  maxWidth: "100%",
  padding: "6px 0 10px",
  margin: 0,
  boxSizing: "border-box",
  overflow: "visible",
};

const desktopCarouselArrowBaseStyle: CSSProperties = {
  position: "absolute",
  top: "50%",
  transform: "translateY(-50%)",
  zIndex: 4,
  width: "52px",
  height: "96px",
  padding: 0,
  borderRadius: 0,
  border: "none",
  background: "transparent",
  color: "#FFFFFF",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  boxShadow: "none",
  outline: "none",
  WebkitTapHighlightColor: "transparent",
};

const desktopCarouselArrowLeftStyle: CSSProperties = {
  ...desktopCarouselArrowBaseStyle,
  left: "-10px",
};

const desktopCarouselArrowRightStyle: CSSProperties = {
  ...desktopCarouselArrowBaseStyle,
  right: "-10px",
};

const desktopCarouselArrowIconBaseStyle: CSSProperties = {
  display: "block",
  width: "18px",
  height: "18px",
  borderTop: "4px solid #FFFFFF",
  borderRight: "4px solid #FFFFFF",
  filter: "drop-shadow(0 2px 5px rgba(0,0,0,0.92))",
  pointerEvents: "none",
  boxSizing: "border-box",
};

const desktopCarouselArrowLeftIconStyle: CSSProperties = {
  ...desktopCarouselArrowIconBaseStyle,
  transform: "rotate(-135deg)",
};

const desktopCarouselArrowRightIconStyle: CSSProperties = {
  ...desktopCarouselArrowIconBaseStyle,
  transform: "rotate(45deg)",
};

const authorListStyle: CSSProperties = {
  ...storyListStyle,
  gap: "12px",
  padding: "2px 12px 8px",
};

const desktopAuthorListStyle: CSSProperties = {
  ...authorListStyle,
  gap: "16px",
  width: "100vw",
  maxWidth: "100vw",
  marginLeft: "calc(50% - 50vw)",
  marginRight: "calc(50% - 50vw)",
  padding:
    "6px max(24px, calc((100vw - 1760px) / 2)) 18px",
  scrollPaddingLeft: "max(24px, calc((100vw - 1760px) / 2))",
  scrollPaddingRight: "max(24px, calc((100vw - 1760px) / 2))",
};

const desktopStaticAuthorListStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))",
  gap: "16px",
  width: "100%",
  maxWidth: "100%",
  padding: "6px 0 8px",
  margin: 0,
  boxSizing: "border-box",
  overflow: "visible",
};

const authorCardStyle: CSSProperties = {
  position: "relative",
  flex: "0 0 min(318px, 84vw)",
  width: "min(318px, 84vw)",
  scrollSnapAlign: "start",
  padding: "12px",
  borderRadius: "24px",
  background: "transparent",
  border: "none",
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  display: "grid",
  gap: "10px",
  boxShadow: "none",
  boxSizing: "border-box",
  overflow: "hidden",
};

const desktopAuthorCardStyle: CSSProperties = {
  ...authorCardStyle,
  flex: "0 0 356px",
  width: "356px",
  maxWidth: "356px",
  padding: "14px",
  borderRadius: "26px",
};

const authorCardGlowStyle: CSSProperties = {
  display: "none",
};

const authorCardTopStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  display: "grid",
  gridTemplateColumns: "68px minmax(0, 1fr)",
  gap: "11px",
  alignItems: "center",
  minWidth: 0,
};

const authorAvatarShellStyle: CSSProperties = {
  width: "68px",
  height: "68px",
  borderRadius: "21px",
  padding: "3px",
  background: "rgba(255,255,255,0.08)",
  boxShadow: "none",
  overflow: "hidden",
  flex: "0 0 auto",
};

const authorAvatarImageStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  display: "block",
  objectFit: "cover",
  borderRadius: "18px",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.08))",
};

const authorAvatarInitialsStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "18px",
  background: "#050505",
  color: "#FFFFFF",
  fontSize: "22px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.06em",
};

const authorIdentityStyle: CSSProperties = {
  display: "grid",
  gap: "5px",
  alignContent: "center",
  minWidth: 0,
};

const authorCardNameStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "24px",
  lineHeight: 0.98,
  ...listaWorkTitleTypographyStyle,
  display: "-webkit-box",
  WebkitLineClamp: 1,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

const authorCardBioStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "12px",
  ...listaAuthorMetaTypographyStyle,
  lineHeight: 1.35,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

const authorMetaRowStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "6px",
  minWidth: 0,
};

const authorMetaBadgeStyle: CSSProperties = {
  width: "100%",
  minHeight: "32px",
  padding: "0 6px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "var(--historietas-text-secondary, #E4E4E7)",
  fontSize: "10px",
  lineHeight: 1,
  fontWeight: 900,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  ...safeTextStyle,
};

const authorRatingStarStyle: CSSProperties = {
  color: "#FACC15",
  fontSize: "13px",
  lineHeight: 1,
  marginRight: "3px",
  textShadow: "0 0 8px rgba(250,204,21,0.22)",
  flex: "0 0 auto",
  transform: "translateY(-1px)",
};

const authorBottomRowStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "8px",
  minWidth: 0,
};

const authorGenreRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "6px",
  minWidth: 0,
};

const authorGenreBadgeStyle: CSSProperties = {
  width: "100%",
  minHeight: "30px",
  padding: "0 8px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "10px",
  lineHeight: 1,
  fontWeight: 950,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  ...safeTextStyle,
};

const authorProfileButtonStyle: CSSProperties = {
  width: "100%",
  maxWidth: "100%",
  minHeight: "40px",
  padding: "0 12px",
  borderRadius: "999px",
  background: "var(--historietas-bg-start, #000000)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#FFFFFF",
  fontSize: "13px",
  fontWeight: 950,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  whiteSpace: "nowrap",
  ...safeTextStyle,
};

const publishedCardStyle: CSSProperties = {
  flex: "0 0 min(360px, 88vw)",
  width: "min(360px, 88vw)",
  scrollSnapAlign: "start",
  display: "grid",
  gridTemplateColumns: "minmax(88px, 98px) minmax(0, 1fr)",
  gap: "14px",
  alignItems: "stretch",
  padding: "11px",
  borderRadius: "22px",
  background: "transparent",
  border: "none",
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  minWidth: 0,
  maxWidth: "88vw",
  overflow: "hidden",
  boxShadow: "none",
  boxSizing: "border-box",
};

const desktopPublishedCardStyle: CSSProperties = {
  ...publishedCardStyle,
  flex: "0 0 360px",
  width: "360px",
  maxWidth: "360px",
  gridTemplateColumns: "98px minmax(0, 1fr)",
  gap: "14px",
  padding: "11px",
  borderRadius: "22px",
  boxShadow: "none",
};

const publishedCardCompactHeightStyle: CSSProperties = {
  ...publishedCardStyle,
  padding: "8px",
};

const desktopPublishedCardCompactHeightStyle: CSSProperties = {
  ...desktopPublishedCardStyle,
  padding: "8px",
};

const coverPlaceholderStyle: CSSProperties = {
  minHeight: "116px",
  borderRadius: "16px",
  position: "relative",
  overflow: "hidden",
  backgroundImage: "linear-gradient(135deg, #050505 0%, #0B0B0D 100%)",
  backgroundSize: "cover",
  backgroundPosition: "center",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  textDecoration: "none",
  display: "block",
};

const desktopCoverPlaceholderStyle: CSSProperties = {
  minHeight: "116px",
  borderRadius: "16px",
};

const coverPlaceholderCompactHeightStyle: CSSProperties = {
  minHeight: "106px",
};

const desktopCoverPlaceholderCompactHeightStyle: CSSProperties = {
  minHeight: "106px",
  borderRadius: "16px",
};


const publishedInfoStyle: CSSProperties = {
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  display: "grid",
  alignContent: "center",
  gap: "7px",
};

const cardTopRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "8px",
  minWidth: 0,
};

const publishedTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "20px",
  lineHeight: 1.05,
  ...listaWorkTitleTypographyStyle,
  maxWidth: "100%",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

const desktopPublishedTitleStyle: CSSProperties = {
  ...publishedTitleStyle,
  fontSize: "20px",
  lineHeight: 1.05,
};

const statusRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "6px",
  maxWidth: "100%",
  minWidth: 0,
};


const formatBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "5px 8px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "10px",
  fontWeight: 900,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const classificationBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "5px 8px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "10px",
  fontWeight: 950,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const authorLinkStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  margin: 0,
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "12px",
  ...listaAuthorMetaTypographyStyle,
  textDecoration: "none",
  borderBottom: "0",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const latestChapterInfoStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "11px",
  lineHeight: 1.2,
  fontWeight: 900,
  textDecoration: "none",
  display: "-webkit-box",
  WebkitLineClamp: 1,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

const cardStatsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  flexWrap: "wrap",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "11px",
  fontWeight: 800,
  maxWidth: "100%",
  minWidth: 0,
};

const cardStatItemStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
  minWidth: 0,
  whiteSpace: "nowrap",
  lineHeight: 1,
};

const cardStatIconStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  lineHeight: 1,
  flex: "0 0 auto",
};

const cardStatHeartIconStyle: CSSProperties = {
  ...cardStatIconStyle,
  color: "#E11D48",
};

const cardStatValueStyle: CSSProperties = {
  display: "inline-block",
  lineHeight: 1,
  whiteSpace: "nowrap",
};

const mobileCardActionRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  marginTop: "4px",
  maxWidth: "100%",
  minWidth: 0,
  overflow: "hidden",
  boxSizing: "border-box",
};

const mobileCardGenreBadgeStyle: CSSProperties = {
  flex: "0 1 42%",
  maxWidth: "42%",
  minHeight: "34px",
  padding: "0 10px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "11px",
  fontWeight: 900,
  lineHeight: 1.12,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  boxSizing: "border-box",
};

const progressCompactStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  alignItems: "center",
  gap: "8px",
  maxWidth: "100%",
  boxSizing: "border-box",
  minWidth: 0,
};

const progressTrackStyle: CSSProperties = {
  width: "100%",
  height: "7px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  overflow: "hidden",
  boxSizing: "border-box",
};

const progressBarStyle: CSSProperties = {
  height: "100%",
  borderRadius: "999px",
  background: "linear-gradient(90deg, #FFFFFF 0%, #A1A1AA 100%)",
};

const progressTextStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "11px",
  fontWeight: 850,
  lineHeight: 1.2,
  whiteSpace: "nowrap",
};

const readNowStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  minHeight: "34px",
  padding: "0 14px",
  marginTop: "4px",
  borderRadius: "999px",
  background: "#050505",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#FFFFFF",
  fontSize: "13px",
  fontWeight: 950,
  lineHeight: 1.15,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const continueActionTextWrapStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  alignItems: "center",
  gap: "1px",
  lineHeight: 1.05,
  textAlign: "center",
  minWidth: 0,
  ...safeTextStyle,
};

const continueActionMainTextStyle: CSSProperties = {
  display: "block",
  fontSize: "11px",
  lineHeight: 1.05,
  fontWeight: 950,
  ...safeTextStyle,
};

const continueActionSubTextStyle: CSSProperties = {
  display: "block",
  fontSize: "10px",
  lineHeight: 1.05,
  fontWeight: 900,
  opacity: 0.96,
  ...safeTextStyle,
};

const mobileCardPrimaryActionStyle: CSSProperties = {
  ...readNowStyle,
  flex: "1 1 auto",
  minWidth: 0,
  marginTop: 0,
  padding: "0 12px",
  textAlign: "center",
};

const pageBackgroundActionButtonStyle: CSSProperties = {
  background: "var(--historietas-bg-start, #000000)",
};

const mobileCardSecondaryActionStyle: CSSProperties = {
  flex: "1 1 auto",
  minWidth: 0,
  maxWidth: "100%",
  minHeight: "34px",
  padding: "0 12px",
  marginTop: 0,
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "13px",
  fontWeight: 950,
  lineHeight: 1.15,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const desktopCardActionRowStyle: CSSProperties = {
  ...mobileCardActionRowStyle,
  overflow: "visible",
};

const desktopCardGenreBadgeStyle: CSSProperties = {
  ...mobileCardGenreBadgeStyle,
  flex: "0 1 42%",
  maxWidth: "42%",
  padding: "0 10px",
  textAlign: "center",
};

const desktopCardPrimaryActionStyle: CSSProperties = {
  ...mobileCardPrimaryActionStyle,
  justifyContent: "center",
  textAlign: "center",
};

const desktopCardSecondaryActionStyle: CSSProperties = {
  ...mobileCardSecondaryActionStyle,
  justifyContent: "center",
  textAlign: "center",
};

const obraCardStyle: CSSProperties = {
  flex: "0 0 min(360px, 88vw)",
  width: "min(360px, 88vw)",
  scrollSnapAlign: "start",
  display: "grid",
  gridTemplateColumns: "minmax(88px, 98px) minmax(0, 1fr)",
  gap: "14px",
  alignItems: "stretch",
  padding: "11px",
  borderRadius: "22px",
  background: "transparent",
  border: "none",
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  minWidth: 0,
  maxWidth: "88vw",
  overflow: "hidden",
  boxShadow: "none",
  boxSizing: "border-box",
};

const desktopObraCardStyle: CSSProperties = {
  ...obraCardStyle,
  flex: "0 0 360px",
  width: "360px",
  maxWidth: "360px",
  gridTemplateColumns: "98px minmax(0, 1fr)",
  gap: "14px",
  padding: "11px",
  borderRadius: "22px",
  boxShadow: "none",
};

const obraCardSoonStyle: CSSProperties = {
  ...obraCardStyle,
  opacity: 0.9,
};

const desktopObraCardSoonStyle: CSSProperties = {
  ...desktopObraCardStyle,
  opacity: 0.9,
};

const coverThumbStyle: CSSProperties = {
  minHeight: "122px",
  borderRadius: "16px",
  position: "relative",
  overflow: "hidden",
  backgroundImage: "linear-gradient(135deg, #050505 0%, #0B0B0D 100%)",
  backgroundSize: "cover",
  backgroundPosition: "center",
  maxWidth: "100%",
  boxSizing: "border-box",
  minWidth: 0,
};


const obraInfoStyle: CSSProperties = {
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  display: "grid",
  alignContent: "center",
  gap: "7px",
};

const obraTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "20px",
  lineHeight: 1.05,
  ...listaWorkTitleTypographyStyle,
  maxWidth: "100%",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

const desktopObraTitleStyle: CSSProperties = {
  ...obraTitleStyle,
  fontSize: "20px",
  lineHeight: 1.05,
};



const authorStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "12px",
  ...listaAuthorMetaTypographyStyle,
  maxWidth: "100%",
  ...safeTextStyle,
};
