"use client";

import { useEffect } from "react";
import { useHistorietasLanguage } from "../../../components/HistorietasLanguageProvider";
import type { HistorietasLanguage } from "../../../lib/i18n";

type TraducaoLerCapitulo = {
  en: string;
  es: string;
};

const LER_CAPITULO_UI_TRANSLATIONS: Record<
  string,
  TraducaoLerCapitulo
> = {
  "Carregando": { en: "Loading", es: "Cargando" },
  "Carregando capítulo": { en: "Loading chapter", es: "Cargando capítulo" },
  "Capítulo não encontrado": { en: "Chapter not found", es: "Capítulo no encontrado" },
  "Voltar para a Home": { en: "Back to Home", es: "Volver al inicio" },
  "Notificações": { en: "Notifications", es: "Notificaciones" },
  "Fechar": { en: "Close", es: "Cerrar" },
  "Ajustes": { en: "Settings", es: "Ajustes" },
  "Lido": { en: "Read", es: "Leído" },
  "Leitura em andamento": { en: "Reading in progress", es: "Lectura en curso" },
  "visualização": { en: "view", es: "visualización" },
  "visualizações": { en: "views", es: "visualizaciones" },
  "palavra": { en: "word", es: "palabra" },
  "palavras": { en: "words", es: "palabras" },
  "Tamanho da fonte": { en: "Font size", es: "Tamaño de fuente" },
  "Fonte": { en: "Font", es: "Fuente" },
  "Barra ativa": { en: "Progress bar active", es: "Barra activa" },
  "Barra de progresso": { en: "Progress bar", es: "Barra de progreso" },
  "Este capítulo ainda não possui texto.": { en: "This chapter does not have any text yet.", es: "Este capítulo todavía no tiene texto." },
  "Remover curtida do capítulo": { en: "Remove chapter like", es: "Quitar Me gusta del capítulo" },
  "Curtir capítulo": { en: "Like chapter", es: "Dar Me gusta al capítulo" },
  "Remover capítulo dos salvos": { en: "Remove chapter from saved", es: "Quitar capítulo de guardados" },
  "Salvar capítulo": { en: "Save chapter", es: "Guardar capítulo" },
  "Salvo ✓": { en: "Saved ✓", es: "Guardado ✓" },
  "Salvar": { en: "Save", es: "Guardar" },
  "Marcar capítulo como não lido": { en: "Mark chapter as unread", es: "Marcar capítulo como no leído" },
  "Marcar capítulo como lido": { en: "Mark chapter as read", es: "Marcar capítulo como leído" },
  "Salvando...": { en: "Saving...", es: "Guardando..." },
  "Lido ✓": { en: "Read ✓", es: "Leído ✓" },
  "Capítulo anterior": { en: "Previous chapter", es: "Capítulo anterior" },
  "← Capítulo anterior": { en: "← Previous chapter", es: "← Capítulo anterior" },
  "Sem anterior": { en: "No previous chapter", es: "Sin capítulo anterior" },
  "← Sem anterior": { en: "← No previous chapter", es: "← Sin capítulo anterior" },
  "Próximo capítulo": { en: "Next chapter", es: "Siguiente capítulo" },
  "Próximo capítulo →": { en: "Next chapter →", es: "Siguiente capítulo →" },
  "Voltar para obra": { en: "Back to work", es: "Volver a la obra" },
  "Responder": { en: "Reply", es: "Responder" },
  "Removendo...": { en: "Removing...", es: "Eliminando..." },
  "Remover": { en: "Remove", es: "Eliminar" },
  "Enviando...": { en: "Sending...", es: "Enviando..." },
  "Denunciar": { en: "Report", es: "Denunciar" },
  "Remover curtida do comentário": { en: "Remove comment like", es: "Quitar Me gusta del comentario" },
  "Curtir comentário": { en: "Like comment", es: "Dar Me gusta al comentario" },
  "Comentários": { en: "Comments", es: "Comentarios" },
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
  "Entre na sua conta para curtir este capítulo.": { en: "Sign in to like this chapter.", es: "Inicia sesión para dar Me gusta a este capítulo." },
  "Não foi possível atualizar a curtida agora.": { en: "The like could not be updated right now.", es: "No se pudo actualizar el Me gusta ahora." },
  "Entre na sua conta para salvar este capítulo.": { en: "Sign in to save this chapter.", es: "Inicia sesión para guardar este capítulo." },
  "Não foi possível atualizar o capítulo salvo agora.": { en: "The saved chapter could not be updated right now.", es: "No se pudo actualizar el capítulo guardado ahora." },
  "Entre na sua conta para marcar este capítulo como lido.": { en: "Sign in to mark this chapter as read.", es: "Inicia sesión para marcar este capítulo como leído." },
  "Não foi possível atualizar o status de leitura agora.": { en: "The reading status could not be updated right now.", es: "No se pudo actualizar el estado de lectura ahora." },
  "Entre na sua conta para comentar este capítulo.": { en: "Sign in to comment on this chapter.", es: "Inicia sesión para comentar este capítulo." },
  "Escreva um comentário antes de enviar.": { en: "Write a comment before sending.", es: "Escribe un comentario antes de enviarlo." },
  "Não foi possível enviar a resposta agora.": { en: "The reply could not be sent right now.", es: "No se pudo enviar la respuesta ahora." },
  "Não foi possível enviar o comentário agora.": { en: "The comment could not be sent right now.", es: "No se pudo enviar el comentario ahora." },
  "Entre na sua conta para apagar seu comentário.": { en: "Sign in to delete your comment.", es: "Inicia sesión para eliminar tu comentario." },
  "Você só pode remover seus próprios comentários.": { en: "You can only remove your own comments.", es: "Solo puedes eliminar tus propios comentarios." },
  "Não foi possível remover o comentário agora.": { en: "The comment could not be removed right now.", es: "No se pudo eliminar el comentario ahora." },
  "Entre na sua conta para curtir comentários.": { en: "Sign in to like comments.", es: "Inicia sesión para dar Me gusta a comentarios." },
  "Não foi possível atualizar a curtida do comentário agora.": { en: "The comment like could not be updated right now.", es: "No se pudo actualizar el Me gusta del comentario ahora." },
  "Entre na sua conta para denunciar comentários.": { en: "Sign in to report comments.", es: "Inicia sesión para denunciar comentarios." },
  "Você já denunciou este conteúdo.": { en: "You have already reported this content.", es: "Ya has denunciado este contenido." },
  "Não consegui enviar a denúncia agora.": { en: "The report could not be sent right now.", es: "No se pudo enviar la denuncia ahora." },
  "Obra sem título": { en: "Untitled work", es: "Obra sin título" },
  "Autor não informado": { en: "Author not provided", es: "Autor no indicado" },
  "Não informado": { en: "Not provided", es: "No indicado" },
  "Não informada": { en: "Not provided", es: "No indicada" },
  "Nenhuma sinopse informada.": { en: "No synopsis provided.", es: "No se proporcionó ninguna sinopsis." },
  "sem tags": { en: "no tags", es: "sin etiquetas" },
  "Usuário": { en: "User", es: "Usuario" },
  "agora": { en: "now", es: "ahora" },
};

export function traduzirTextoLerCapitulo(
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
  const traducaoExata = LER_CAPITULO_UI_TRANSLATIONS[conteudo];

  if (traducaoExata) {
    return `${inicio}${traducaoExata[idioma]}${fim}`;
  }

  let correspondencia = /^Notificações:\s*(\d+)\s*não lidas$/i.exec(conteudo);

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Notifications: ${correspondencia[1]} unread${fim}`
      : `${inicio}Notificaciones: ${correspondencia[1]} sin leer${fim}`;
  }

  correspondencia = /^Lido em\s+(.+)$/i.exec(conteudo);

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Read on ${correspondencia[1]}${fim}`
      : `${inicio}Leído el ${correspondencia[1]}${fim}`;
  }

  correspondencia = /^Fonte\s+(\d+)$/i.exec(conteudo);

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Font ${correspondencia[1]}${fim}`
      : `${inicio}Fuente ${correspondencia[1]}${fim}`;
  }

  correspondencia = /^Usar fonte\s+(\d+)$/i.exec(conteudo);

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Use font size ${correspondencia[1]}${fim}`
      : `${inicio}Usar tamaño de fuente ${correspondencia[1]}${fim}`;
  }

  correspondencia = /^(\d+)\s+comentários$/i.exec(conteudo);

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}${correspondencia[1]} comments${fim}`
      : `${inicio}${correspondencia[1]} comentarios${fim}`;
  }

  correspondencia = /^Ver\s+(\d+)\s+(resposta|respostas)$/i.exec(conteudo);

  if (correspondencia) {
    const quantidade = Number(correspondencia[1]);

    return idioma === "en"
      ? `${inicio}View ${quantidade} ${quantidade === 1 ? "reply" : "replies"}${fim}`
      : `${inicio}Ver ${quantidade} ${quantidade === 1 ? "respuesta" : "respuestas"}${fim}`;
  }

  correspondencia = /^Ver mais\s+(\d+)\s+(resposta|respostas)$/i.exec(conteudo);

  if (correspondencia) {
    const quantidade = Number(correspondencia[1]);

    return idioma === "en"
      ? `${inicio}View ${quantidade} more ${quantidade === 1 ? "reply" : "replies"}${fim}`
      : `${inicio}Ver ${quantidade} ${quantidade === 1 ? "respuesta" : "respuestas"} más${fim}`;
  }

  correspondencia = /^Adicionar\s+(.+)\s+ao comentário$/i.exec(conteudo);

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Add ${correspondencia[1]} to the comment${fim}`
      : `${inicio}Añadir ${correspondencia[1]} al comentario${fim}`;
  }

  correspondencia = /^Abrir perfil de\s+(.+)$/i.exec(conteudo);

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Open ${correspondencia[1]}'s profile${fim}`
      : `${inicio}Abrir el perfil de ${correspondencia[1]}${fim}`;
  }

  correspondencia = /^há\s+(\d+)\s+(segundo|segundos)$/i.exec(conteudo);

  if (correspondencia) {
    const quantidade = Number(correspondencia[1]);

    return idioma === "en"
      ? `${inicio}${quantidade} ${quantidade === 1 ? "second" : "seconds"} ago${fim}`
      : `${inicio}hace ${quantidade} ${quantidade === 1 ? "segundo" : "segundos"}${fim}`;
  }

  correspondencia = /^há\s+(\d+)\s+(minuto|minutos)$/i.exec(conteudo);

  if (correspondencia) {
    const quantidade = Number(correspondencia[1]);

    return idioma === "en"
      ? `${inicio}${quantidade} ${quantidade === 1 ? "minute" : "minutes"} ago${fim}`
      : `${inicio}hace ${quantidade} ${quantidade === 1 ? "minuto" : "minutos"}${fim}`;
  }

  correspondencia = /^há\s+(\d+)\s+(hora|horas)$/i.exec(conteudo);

  if (correspondencia) {
    const quantidade = Number(correspondencia[1]);

    return idioma === "en"
      ? `${inicio}${quantidade} ${quantidade === 1 ? "hour" : "hours"} ago${fim}`
      : `${inicio}hace ${quantidade} ${quantidade === 1 ? "hora" : "horas"}${fim}`;
  }

  correspondencia = /^há\s+(\d+)\s+(dia|dias)$/i.exec(conteudo);

  if (correspondencia) {
    const quantidade = Number(correspondencia[1]);

    return idioma === "en"
      ? `${inicio}${quantidade} ${quantidade === 1 ? "day" : "days"} ago${fim}`
      : `${inicio}hace ${quantidade} ${quantidade === 1 ? "día" : "días"}${fim}`;
  }

  correspondencia = /^Começou a ler\s+(.+)$/i.exec(conteudo);

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Started reading ${correspondencia[1]}${fim}`
      : `${inicio}Empezó a leer ${correspondencia[1]}${fim}`;
  }

  correspondencia = /^Salvou\s+(.+)$/i.exec(conteudo);

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Saved ${correspondencia[1]}${fim}`
      : `${inicio}Guardó ${correspondencia[1]}${fim}`;
  }

  correspondencia = /^Leu\s+(.+)$/i.exec(conteudo);

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Read ${correspondencia[1]}${fim}`
      : `${inicio}Leyó ${correspondencia[1]}${fim}`;
  }

  return texto;
}

export function LerCapituloLanguageBridge() {
  const { language } = useHistorietasLanguage();

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const seletorRaiz =
      "[data-historietas-ler-capitulo-root='true'], [data-historietas-ler-capitulo-comments-root='true']";

    type EstadoTraducaoLerCapitulo = {
      original: string;
      traduzido: string;
    };

    const estadosTexto: WeakMap<Text, EstadoTraducaoLerCapitulo> = new WeakMap();
    const estadosAtributos: WeakMap<
      Element,
      Map<string, EstadoTraducaoLerCapitulo>
    > = new WeakMap();
    const textosAlterados = new Set<Text>();
    const atributosAlterados: Array<{ elemento: Element; atributo: string }> = [];
    const atributosTraduziveis = ["aria-label", "title", "placeholder", "alt"];
    let aplicando = false;

    function elementoEstaNaPagina(elemento: Element | null) {
      return Boolean(elemento?.matches(seletorRaiz) || elemento?.closest(seletorRaiz));
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

      const proximo = traduzirTextoLerCapitulo(estado.original, language);
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

      const proximo = traduzirTextoLerCapitulo(estado.original, language);
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

        atributosTraduziveis.forEach((atributo) => aplicarAtributo(raiz, atributo));

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
