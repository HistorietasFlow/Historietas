"use client";

import { useEffect } from "react";
import { useHistorietasLanguage } from "../../../components/HistorietasLanguageProvider";
import type { HistorietasLanguage } from "../../../lib/i18n";

type TraducaoEditarCapitulo = {
  en: string;
  es: string;
};

const EDITAR_CAPITULO_UI_TRANSLATIONS: Record<
  string,
  TraducaoEditarCapitulo
> = {
  "Capítulo não encontrado": { en: "Chapter not found", es: "Capítulo no encontrado" },
  "Voltar para a Home": { en: "Back to Home", es: "Volver al inicio" },
  "EDITAR CAPÍTULO": { en: "EDIT CHAPTER", es: "EDITAR CAPÍTULO" },
  "Notificações": { en: "Notifications", es: "Notificaciones" },
  "Não foi possível salvar": { en: "Could not save", es: "No se pudo guardar" },
  "Capítulo": { en: "Chapter", es: "Capítulo" },
  "Título do capítulo": { en: "Chapter title", es: "Título del capítulo" },
  "Se deixar vazio, o sistema usa Capítulo": { en: "Leave it blank to use Chapter", es: "Déjalo vacío para usar Capítulo" },
  "Texto do capítulo": { en: "Chapter text", es: "Texto del capítulo" },
  "Importar versão revisada": { en: "Import revised version", es: "Importar versión revisada" },
  "Opcional. Importe um arquivo .txt ou .md.": { en: "Optional. Import a .txt or .md file.", es: "Opcional. Importa un archivo .txt o .md." },
  "Arquivo importado:": { en: "Imported file:", es: "Archivo importado:" },
  "Importar .txt/.md": { en: "Import .txt/.md", es: "Importar .txt/.md" },
  "Escreva o texto do capítulo": { en: "Write the chapter text", es: "Escribe el texto del capítulo" },
  "Mínimo: 20 letras ou números.": { en: "Minimum: 20 letters or numbers.", es: "Mínimo: 20 letras o números." },
  "Salvando...": { en: "Saving...", es: "Guardando..." },
  "Atualizado": { en: "Updated", es: "Actualizado" },
  "Salvar alterações": { en: "Save changes", es: "Guardar cambios" },
  "Ler capítulo": { en: "Read chapter", es: "Leer capítulo" },
  "Cancelar": { en: "Cancel", es: "Cancelar" },
  "Excluir capítulo": { en: "Delete chapter", es: "Eliminar capítulo" },
  "Excluindo...": { en: "Deleting...", es: "Eliminando..." },
  "Não foi possível excluir": { en: "Could not delete", es: "No se pudo eliminar" },
  "PRÉVIA DO CAPÍTULO": { en: "CHAPTER PREVIEW", es: "VISTA PREVIA DEL CAPÍTULO" },
  "O texto do capítulo vai aparecer aqui enquanto você edita.": { en: "The chapter text will appear here while you edit.", es: "El texto del capítulo aparecerá aquí mientras lo editas." },
  "Obra sem título": { en: "Untitled work", es: "Obra sin título" },
  "Autor não informado": { en: "Author not provided", es: "Autor no indicado" },
  "Não informado": { en: "Not provided", es: "No indicado" },
  "Não informada": { en: "Not provided", es: "No indicada" },
  "Nenhuma sinopse informada.": { en: "No synopsis provided.", es: "No se proporcionó ninguna sinopsis." },
  "sem tags": { en: "no tags", es: "sin etiquetas" },
  "Arquivo da obra": { en: "Work file", es: "Archivo de la obra" },
  "Envie um arquivo .txt ou .md para importar o texto do capítulo.": { en: "Upload a .txt or .md file to import the chapter text.", es: "Sube un archivo .txt o .md para importar el texto del capítulo." },
  "Esse arquivo é grande demais. Use um arquivo de até 700 KB.": { en: "This file is too large. Use a file up to 700 KB.", es: "Este archivo es demasiado grande. Usa un archivo de hasta 700 KB." },
  "O arquivo foi lido, mas não tem texto suficiente para formar um capítulo.": { en: "The file was read, but it does not contain enough text to form a chapter.", es: "El archivo se leyó, pero no contiene suficiente texto para formar un capítulo." },
  "Não consegui ler esse arquivo. Tente salvar como .txt ou .md e importar novamente.": { en: "I couldn't read this file. Save it as .txt or .md and import it again.", es: "No pude leer este archivo. Guárdalo como .txt o .md e impórtalo de nuevo." },
  "O título do capítulo precisa ter pelo menos 3 letras ou números. Se quiser usar o título automático, deixe o campo vazio.": { en: "The chapter title must contain at least 3 letters or numbers. Leave the field blank to use the automatic title.", es: "El título del capítulo debe contener al menos 3 letras o números. Deja el campo vacío para usar el título automático." },
  "O texto do capítulo precisa ter pelo menos 20 letras ou números.": { en: "The chapter text must contain at least 20 letters or numbers.", es: "El texto del capítulo debe contener al menos 20 letras o números." },
  "Entre na sua conta antes de editar o capítulo.": { en: "Sign in before editing the chapter.", es: "Inicia sesión antes de editar el capítulo." },
  "Entre na sua conta antes de excluir o capítulo.": { en: "Sign in before deleting the chapter.", es: "Inicia sesión antes de eliminar el capítulo." },
  "Você não tem permissão para editar este capítulo.": { en: "You do not have permission to edit this chapter.", es: "No tienes permiso para editar este capítulo." },
  "Você não tem permissão para excluir este capítulo.": { en: "You do not have permission to delete this chapter.", es: "No tienes permiso para eliminar este capítulo." },
  "Não consegui confirmar a atualização do capítulo no Supabase.": { en: "I could not confirm the chapter update in Supabase.", es: "No pude confirmar la actualización del capítulo en Supabase." },
  "Não consegui confirmar a exclusão do capítulo no Supabase.": { en: "I could not confirm the chapter deletion in Supabase.", es: "No pude confirmar la eliminación del capítulo en Supabase." },
  "Não consegui salvar as alterações. Atualize a página e tente novamente.": { en: "I could not save the changes. Refresh the page and try again.", es: "No pude guardar los cambios. Actualiza la página e inténtalo de nuevo." },
  "Não consegui excluir o capítulo. Atualize a página e tente novamente.": { en: "I could not delete the chapter. Refresh the page and try again.", es: "No pude eliminar el capítulo. Actualiza la página e inténtalo de nuevo." },
};

function traduzirTextoEditarCapitulo(
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
  const traducaoExata = EDITAR_CAPITULO_UI_TRANSLATIONS[conteudo];

  if (traducaoExata) {
    return `${inicio}${traducaoExata[idioma]}${fim}`;
  }

  let correspondencia = /^Capítulo\s+(\d+)$/i.exec(conteudo);

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Chapter ${correspondencia[1]}${fim}`
      : `${inicio}Capítulo ${correspondencia[1]}${fim}`;
  }

  correspondencia = /^Ex:\s*Capítulo\s+(\d+)$/i.exec(conteudo);

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}E.g.: Chapter ${correspondencia[1]}${fim}`
      : `${inicio}Ej.: Capítulo ${correspondencia[1]}${fim}`;
  }

  correspondencia = /^Notificações:\s*(\d+)\s*não lidas$/i.exec(conteudo);

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Notifications: ${correspondencia[1]} unread${fim}`
      : `${inicio}Notificaciones: ${correspondencia[1]} sin leer${fim}`;
  }

  correspondencia = /^(.*?)\s*•\s*(\d+)\s*palavras\s*•\s*(\d+)\s*min$/i.exec(
    conteudo,
  );

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}${correspondencia[1]} • ${correspondencia[2]} words • ${correspondencia[3]} min${fim}`
      : `${inicio}${correspondencia[1]} • ${correspondencia[2]} palabras • ${correspondencia[3]} min${fim}`;
  }

  correspondencia = /^Não consegui confirmar sua permissão para editar o capítulo:\s*([\s\S]+)$/i.exec(
    conteudo,
  );

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}I could not confirm your permission to edit the chapter: ${correspondencia[1]}${fim}`
      : `${inicio}No pude confirmar tu permiso para editar el capítulo: ${correspondencia[1]}${fim}`;
  }

  correspondencia = /^Não consegui atualizar o capítulo no Supabase:\s*([\s\S]+)$/i.exec(
    conteudo,
  );

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}I could not update the chapter in Supabase: ${correspondencia[1]}${fim}`
      : `${inicio}No pude actualizar el capítulo en Supabase: ${correspondencia[1]}${fim}`;
  }

  return texto;
}

export function EditarCapituloLanguageBridge() {
  const { language } = useHistorietasLanguage();

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const raiz = document.querySelector(
      "[data-historietas-editar-capitulo-root='true']",
    );

    if (!raiz) {
      return;
    }

    const raizPagina = raiz;

    type EstadoTraducaoEditarCapitulo = {
      original: string;
      traduzido: string;
    };

    const estadosTexto: WeakMap<Text, EstadoTraducaoEditarCapitulo> = new WeakMap();
    const estadosAtributos: WeakMap<
      Element,
      Map<string, EstadoTraducaoEditarCapitulo>
    > = new WeakMap();
    const textosAlterados = new Set<Text>();
    const atributosAlterados: Array<{ elemento: Element; atributo: string }> = [];
    const atributosTraduziveis = ["aria-label", "title", "placeholder", "alt"];
    let aplicando = false;

    function deveIgnorarElemento(elemento: Element | null) {
      if (!elemento) {
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

      const proximo = traduzirTextoEditarCapitulo(estado.original, language);
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

      const proximo = traduzirTextoEditarCapitulo(estado.original, language);
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

      if (!(no instanceof Element) || deveIgnorarElemento(no)) {
        return;
      }

      atributosTraduziveis.forEach((atributo) => aplicarAtributo(no, atributo));

      const walker = document.createTreeWalker(
        no,
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
    }

    function aplicarTudo() {
      if (aplicando) {
        return;
      }

      aplicando = true;

      try {
        aplicarNo(raizPagina);
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

    observador.observe(raizPagina, {
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
