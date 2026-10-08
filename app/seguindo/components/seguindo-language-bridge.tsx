"use client";

import { useEffect } from "react";
import { useHistorietasLanguage } from "../../../components/HistorietasLanguageProvider";
import type { HistorietasLanguage } from "../../../lib/i18n";

type TraducaoSeguindo = {
  en: string;
  es: string;
};

const SEGUINDO_UI_TRANSLATIONS: Record<string, TraducaoSeguindo> = {
  "Seguindo": { en: "Following", es: "Siguiendo" },
  "SEGUIDORES": { en: "FOLLOWERS", es: "SEGUIDORES" },
  "Seguidores": { en: "Followers", es: "Seguidores" },
  "PESSOAS SEGUIDAS": { en: "PEOPLE FOLLOWED", es: "PERSONAS SEGUIDAS" },
  "Pessoas seguidas": { en: "People followed", es: "Personas seguidas" },
  "OBRAS SEGUIDAS": { en: "FOLLOWED WORKS", es: "OBRAS SEGUIDAS" },
  "Obras seguidas": { en: "Followed works", es: "Obras seguidas" },
  "Abrir classificação de Seguindo": {
    en: "Open Following sorting",
    es: "Abrir clasificación de Siguiendo",
  },
  "Pesquisar seguidor ou perfil": {
    en: "Search follower or profile",
    es: "Buscar seguidor o perfil",
  },
  "Pesquisar obra, autor, gênero ou tag": {
    en: "Search work, author, genre, or tag",
    es: "Buscar obra, autor, género o etiqueta",
  },
  "Pesquisar pessoa, autor ou perfil": {
    en: "Search person, author, or profile",
    es: "Buscar persona, autor o perfil",
  },
  "Fechar busca": { en: "Close search", es: "Cerrar búsqueda" },
  "Abrir busca": { en: "Open search", es: "Abrir búsqueda" },
  "Classificar por": { en: "Sort by", es: "Ordenar por" },
  "Filtros": { en: "Filters", es: "Filtros" },
  "Padrão": { en: "Default", es: "Predeterminado" },
  "Mais recentes": { en: "Newest", es: "Más recientes" },
  "Mais antigos": { en: "Oldest", es: "Más antiguos" },
  "Maior progresso": { en: "Most progress", es: "Mayor progreso" },
  "Mais capítulos": { en: "Most chapters", es: "Más capítulos" },
  "Nenhum seguidor ainda": {
    en: "No followers yet",
    es: "Aún no hay seguidores",
  },
  "Você ainda não tem seguidores": {
    en: "You do not have any followers yet",
    es: "Aún no tienes seguidores",
  },
  "SOLICITAÇÕES PARA SEGUIR": {
    en: "FOLLOW REQUESTS",
    es: "SOLICITUDES PARA SEGUIR",
  },
  "Solicitações para seguir": {
    en: "Follow requests",
    es: "Solicitudes para seguir",
  },
  "Aceitar": { en: "Accept", es: "Aceptar" },
  "Recusar": { en: "Decline", es: "Rechazar" },
  "Remover seguidor": { en: "Remove follower", es: "Eliminar seguidor" },
  "Solicitado": { en: "Requested", es: "Solicitado" },
  "Cancelar": { en: "Cancel", es: "Cancelar" },
  "Responder solicitação": {
    en: "Respond to request",
    es: "Responder solicitud",
  },
  "Nenhuma obra seguida ainda": {
    en: "No followed works yet",
    es: "Aún no hay obras seguidas",
  },
  "Nenhum perfil seguido ainda": {
    en: "No followed profiles yet",
    es: "Aún no hay perfiles seguidos",
  },
  "Você ainda não segue nada": {
    en: "You are not following anything yet",
    es: "Aún no sigues nada",
  },
  "Nada encontrado": { en: "Nothing found", es: "No se encontró nada" },
  "Nenhuma obra seguida encontrada": {
    en: "No followed work found",
    es: "No se encontró ninguna obra seguida",
  },
  "Obra": { en: "Work", es: "Obra" },
  "obra": { en: "work", es: "obra" },
  "obras": { en: "works", es: "obras" },
  "Por": { en: "By", es: "Por" },
  "Ver obra": { en: "View work", es: "Ver obra" },
  "Deixar de seguir": { en: "Unfollow", es: "Dejar de seguir" },
  "SUGESTÕES PARA SEGUIR": {
    en: "SUGGESTIONS TO FOLLOW",
    es: "SUGERENCIAS PARA SEGUIR",
  },
  "Carregando sugestões para seguir": {
    en: "Loading suggestions to follow",
    es: "Cargando sugerencias para seguir",
  },
  "Seguir": { en: "Follow", es: "Seguir" },
  "AUTORES SEGUIDOS": { en: "AUTHORS FOLLOWED", es: "AUTORES SEGUIDOS" },
  "em leitura": { en: "being read", es: "en lectura" },
  "Abrir perfil": { en: "Open profile", es: "Abrir perfil" },
  "Carregando": { en: "Loading", es: "Cargando" },
  "Carregando seguindo": { en: "Loading following", es: "Cargando seguidos" },
  "Abrir perfil de": { en: "Open profile of", es: "Abrir perfil de" },
  "Perfil de leitor no Historietas.": {
    en: "Reader profile on Historietas.",
    es: "Perfil de lector en Historietas.",
  },
  "Autor não informado": { en: "Author not provided", es: "Autor no informado" },
  "Usuário": { en: "User", es: "Usuario" },
  "Não informado": { en: "Not provided", es: "No informado" },
  "Não informada": { en: "Not provided", es: "No informada" },
  "Obra sem título": { en: "Untitled work", es: "Obra sin título" },
  "Capítulo sem título": { en: "Untitled chapter", es: "Capítulo sin título" },
  "Nenhum texto foi escrito ainda.": {
    en: "No text has been written yet.",
    es: "Todavía no se ha escrito ningún texto.",
  },
  "Nenhuma sinopse informada.": {
    en: "No synopsis provided.",
    es: "No se proporcionó ninguna sinopsis.",
  },
  "sem tags": { en: "no tags", es: "sin etiquetas" },
  "Data não informada": { en: "Date not provided", es: "Fecha no informada" },
  "Leitura": { en: "Reading", es: "Lectura" },
  "Começou": { en: "Started", es: "Empezó" },
  "Concluiu": { en: "Completed", es: "Completó" },
  "Avaliou": { en: "Rated", es: "Calificó" },
  "Favoritou": { en: "Favorited", es: "Marcó como favorita" },
  "Salvou": { en: "Saved", es: "Guardó" },
  "Review": { en: "Review", es: "Reseña" },
  "Lista": { en: "List", es: "Lista" },
  "Diário": { en: "Journal", es: "Diario" },
  "criou uma lista de leitura": {
    en: "created a reading list",
    es: "creó una lista de lectura",
  },
  "registrou uma atividade no Diário": {
    en: "recorded an activity in the Journal",
    es: "registró una actividad en el Diario",
  },
  "Fantasia": { en: "Fantasy", es: "Fantasía" },
  "Ficção": { en: "Fiction", es: "Ficción" },
  "Ficção científica": { en: "Science fiction", es: "Ciencia ficción" },
  "Romance": { en: "Romance", es: "Romance" },
  "Terror": { en: "Horror", es: "Terror" },
  "Ação": { en: "Action", es: "Acción" },
  "Aventura": { en: "Adventure", es: "Aventura" },
  "Comédia": { en: "Comedy", es: "Comedia" },
  "Mistério": { en: "Mystery", es: "Misterio" },
  "Suspense": { en: "Thriller", es: "Suspenso" },
  "Sobrenatural": { en: "Supernatural", es: "Sobrenatural" },
  "Drama": { en: "Drama", es: "Drama" },
  "Conto": { en: "Short story", es: "Cuento" },
  "Poesia": { en: "Poetry", es: "Poesía" },
  "Mangá": { en: "Manga", es: "Manga" },
  "HQ": { en: "Comics", es: "Cómic" },
  "Livro": { en: "Book", es: "Libro" },
  "Webnovel": { en: "Web novel", es: "Novela web" },
  "Original": { en: "Original", es: "Original" },
  "Publicado": { en: "Published", es: "Publicado" },
  "Rascunho": { en: "Draft", es: "Borrador" },
};

export function traduzirTextoSeguindo(texto: string, idioma: HistorietasLanguage) {
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
  const traducaoExata = SEGUINDO_UI_TRANSLATIONS[conteudo];

  if (traducaoExata) {
    return `${inicio}${traducaoExata[idioma]}${fim}`;
  }

  let correspondencia = /^Pesquisar em (.+)$/i.exec(conteudo);

  if (correspondencia) {
    const descricao = traduzirDescricaoListaSeguindo(correspondencia[1], idioma);

    return idioma === "en"
      ? `${inicio}Search in ${descricao}${fim}`
      : `${inicio}Buscar en ${descricao}${fim}`;
  }

  correspondencia = /^Abrir perfil de (.+)$/i.exec(conteudo);

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Open ${correspondencia[1]}'s profile${fim}`
      : `${inicio}Abrir el perfil de ${correspondencia[1]}${fim}`;
  }

  correspondencia = /^(\d+)\s+em leitura$/i.exec(conteudo);

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}${correspondencia[1]} being read${fim}`
      : `${inicio}${correspondencia[1]} en lectura${fim}`;
  }

  correspondencia = /^(\d+)\s+(obra|obras)$/i.exec(conteudo);

  if (correspondencia) {
    const quantidade = Number(correspondencia[1]);

    if (idioma === "en") {
      return `${inicio}${correspondencia[1]} ${quantidade === 1 ? "work" : "works"}${fim}`;
    }

    return `${inicio}${correspondencia[1]} ${quantidade === 1 ? "obra" : "obras"}${fim}`;
  }

  correspondencia = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(conteudo);

  if (correspondencia && idioma === "en") {
    return `${inicio}${correspondencia[2]}/${correspondencia[1]}/${correspondencia[3]}${fim}`;
  }

  correspondencia = /^leu um capítulo de (.+)$/i.exec(conteudo);

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}read a chapter of ${correspondencia[1]}${fim}`
      : `${inicio}leyó un capítulo de ${correspondencia[1]}${fim}`;
  }

  correspondencia = /^começou a ler (.+)$/i.exec(conteudo);

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}started reading ${correspondencia[1]}${fim}`
      : `${inicio}empezó a leer ${correspondencia[1]}${fim}`;
  }

  correspondencia = /^concluiu (.+)$/i.exec(conteudo);

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}completed ${correspondencia[1]}${fim}`
      : `${inicio}completó ${correspondencia[1]}${fim}`;
  }

  correspondencia = /^avaliou (.+?)(?: com ([\d.,]+) estrelas)?$/i.exec(conteudo);

  if (correspondencia) {
    const nota = correspondencia[2]
      ? idioma === "en"
        ? correspondencia[2].replace(",", ".")
        : correspondencia[2]
      : "";
    const sufixo = nota
      ? idioma === "en"
        ? ` with ${nota} stars`
        : ` con ${nota} estrellas`
      : "";

    return idioma === "en"
      ? `${inicio}rated ${correspondencia[1]}${sufixo}${fim}`
      : `${inicio}calificó ${correspondencia[1]}${sufixo}${fim}`;
  }

  correspondencia = /^favoritou (.+)$/i.exec(conteudo);

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}favorited ${correspondencia[1]}${fim}`
      : `${inicio}marcó como favorita ${correspondencia[1]}${fim}`;
  }

  correspondencia = /^salvou (.+)$/i.exec(conteudo);

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}saved ${correspondencia[1]}${fim}`
      : `${inicio}guardó ${correspondencia[1]}${fim}`;
  }

  correspondencia = /^publicou uma review(?: sobre (.+))?$/i.exec(conteudo);

  if (correspondencia) {
    if (!correspondencia[1]) {
      return idioma === "en"
        ? `${inicio}published a review${fim}`
        : `${inicio}publicó una reseña${fim}`;
    }

    return idioma === "en"
      ? `${inicio}published a review of ${correspondencia[1]}${fim}`
      : `${inicio}publicó una reseña sobre ${correspondencia[1]}${fim}`;
  }

  correspondencia = /^interagiu com (.+)$/i.exec(conteudo);

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}interacted with ${correspondencia[1]}${fim}`
      : `${inicio}interactuó con ${correspondencia[1]}${fim}`;
  }

  return texto;
}

function traduzirDescricaoListaSeguindo(
  descricao: string,
  idioma: Exclude<HistorietasLanguage, "pt-BR">
) {
  const correspondencia = /^(seguidores|pessoas seguidas|obras seguidas)(?: de (.+))?$/i.exec(
    descricao.trim()
  );

  if (!correspondencia) {
    return descricao;
  }

  const tipo = correspondencia[1].toLowerCase();
  const nome = correspondencia[2]?.trim() || "";
  const tipoTraduzido = idioma === "en"
    ? tipo === "seguidores"
      ? "followers"
      : tipo === "pessoas seguidas"
        ? "people followed"
        : "followed works"
    : tipo === "seguidores"
      ? "seguidores"
      : tipo === "pessoas seguidas"
        ? "personas seguidas"
        : "obras seguidas";

  if (!nome) {
    return tipoTraduzido;
  }

  return idioma === "en"
    ? `${tipoTraduzido} of ${nome}`
    : `${tipoTraduzido} de ${nome}`;
}

export function SeguindoLanguageBridge() {
  const { language } = useHistorietasLanguage();

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const seletorRaiz = "[data-historietas-seguindo-root='true']";

    type EstadoTraducaoSeguindo = {
      original: string;
      traduzido: string;
    };

    const estadosTexto: WeakMap<Text, EstadoTraducaoSeguindo> = new WeakMap();
    const estadosAtributos: WeakMap<
      Element,
      Map<string, EstadoTraducaoSeguindo>
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

      const proximo = traduzirTextoSeguindo(estado.original, language);
      estado.traduzido = proximo;

      if (no.data !== proximo) {
        no.data = proximo;
      }
    }

    function aplicarAtributos(elemento: Element) {
      if (deveIgnorarElemento(elemento)) {
        return;
      }

      let estadosElemento = estadosAtributos.get(elemento);

      if (!estadosElemento) {
        estadosElemento = new Map();
        estadosAtributos.set(elemento, estadosElemento);
      }

      atributosTraduziveis.forEach((atributo) => {
        const atual = elemento.getAttribute(atributo);

        if (atual === null) {
          return;
        }

        let estado = estadosElemento?.get(atributo);

        if (!estado) {
          estado = { original: atual, traduzido: atual };
          estadosElemento?.set(atributo, estado);
          atributosAlterados.push({ elemento, atributo });
        } else if (atual !== estado.traduzido && atual !== estado.original) {
          estado.original = atual;
        }

        const proximo = traduzirTextoSeguindo(estado.original, language);
        estado.traduzido = proximo;

        if (atual !== proximo) {
          elemento.setAttribute(atributo, proximo);
        }
      });
    }

    function aplicarNo(no: Node) {
      if (no.nodeType === Node.TEXT_NODE) {
        aplicarTexto(no as Text);
        return;
      }

      if (no.nodeType !== Node.ELEMENT_NODE) {
        return;
      }

      const elemento = no as Element;

      if (deveIgnorarElemento(elemento)) {
        return;
      }

      aplicarAtributos(elemento);

      elemento.querySelectorAll("*").forEach((filho) => {
        if (!deveIgnorarElemento(filho)) {
          aplicarAtributos(filho);
        }
      });

      const walker = document.createTreeWalker(
        elemento,
        NodeFilter.SHOW_TEXT
      );
      let textoAtual = walker.nextNode();

      while (textoAtual) {
        aplicarTexto(textoAtual as Text);
        textoAtual = walker.nextNode();
      }
    }

    function aplicarPagina() {
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

    aplicarPagina();

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

          if (mutacao.type === "attributes") {
            aplicarAtributos(mutacao.target as Element);
            return;
          }

          mutacao.addedNodes.forEach((no) => aplicarNo(no));
        });
      } finally {
        aplicando = false;
      }
    });

    observador.observe(document.body, {
      childList: true,
      subtree: true,
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

      atributosAlterados.forEach(({ elemento, atributo }) => {
        const estado = estadosAtributos.get(elemento)?.get(atributo);

        if (
          estado &&
          elemento.isConnected &&
          elemento.getAttribute(atributo) === estado.traduzido
        ) {
          elemento.setAttribute(atributo, estado.original);
        }
      });
    };
  }, [language]);

  return null;
}
