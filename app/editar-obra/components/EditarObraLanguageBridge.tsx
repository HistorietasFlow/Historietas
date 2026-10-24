"use client";

import { useEffect } from "react";
import { useHistorietasLanguage } from "../../../components/HistorietasLanguageProvider";
import type { HistorietasLanguage } from "../../../lib/i18n";

type EditarObraTranslationEntry = {
  en: string;
  es: string;
};

const EDITAR_OBRA_UI_TRANSLATIONS: Record<
  string,
  EditarObraTranslationEntry
> = {
  "Voltar para a Home": { en: "Back to Home", es: "Volver al inicio" },
  "EDITAR OBRA": { en: "EDIT WORK", es: "EDITAR OBRA" },
  "Notificações": { en: "Notifications", es: "Notificaciones" },
  "Obra não encontrada": { en: "Work not found", es: "Obra no encontrada" },
  "Não foi possível salvar": { en: "Could not save", es: "No se pudo guardar" },
  "Adicionar capa": { en: "Add cover", es: "Añadir portada" },
  "Capa atual": { en: "Current cover", es: "Portada actual" },
  "Imagem vertical. Máximo: 2 MB.": { en: "Vertical image. Maximum: 2 MB.", es: "Imagen vertical. Máximo: 2 MB." },
  "Trocar": { en: "Change", es: "Cambiar" },
  "Escolher": { en: "Choose", es: "Elegir" },
  "Remover": { en: "Remove", es: "Eliminar" },
  "Arquivo completo da obra": { en: "Full work file", es: "Archivo completo de la obra" },
  "Arquivo atual": { en: "Current file", es: "Archivo actual" },
  "Enviar PDF, texto ou imagem": { en: "Upload PDF, text, or image", es: "Subir PDF, texto o imagen" },
  "Opcional. Anexe PDF, texto, imagem ou página de mangá. Máximo: 5 MB.": { en: "Optional. Attach a PDF, text file, image, or manga page. Maximum: 5 MB.", es: "Opcional. Adjunta un PDF, texto, imagen o página de manga. Máximo: 5 MB." },
  "Trocar arquivo": { en: "Change file", es: "Cambiar archivo" },
  "Escolher arquivo": { en: "Choose file", es: "Elegir archivo" },
  "Título da obra": { en: "Work title", es: "Título de la obra" },
  "Digite o título": { en: "Enter the title", es: "Escribe el título" },
  "Mínimo: 3 letras ou números.": { en: "Minimum: 3 letters or numbers.", es: "Mínimo: 3 letras o números." },
  "Autor": { en: "Author", es: "Autor" },
  "Nome do autor": { en: "Author name", es: "Nombre del autor" },
  "Mínimo: 2 letras ou números.": { en: "Minimum: 2 letters or numbers.", es: "Mínimo: 2 letras o números." },
  "Formato": { en: "Format", es: "Formato" },
  "Escolha um formato": { en: "Choose a format", es: "Elige un formato" },
  "Outro formato": { en: "Other format", es: "Otro formato" },
  "Digite o formato": { en: "Enter the format", es: "Escribe el formato" },
  "Gênero": { en: "Genre", es: "Género" },
  "Escolha um gênero": { en: "Choose a genre", es: "Elige un género" },
  "Outro gênero": { en: "Other genre", es: "Otro género" },
  "Digite o gênero": { en: "Enter the genre", es: "Escribe el género" },
  "Tag": { en: "Tag", es: "Etiqueta" },
  "Escolha uma tag": { en: "Choose a tag", es: "Elige una etiqueta" },
  "Outra tag": { en: "Other tag", es: "Otra etiqueta" },
  "Digite a tag": { en: "Enter the tag", es: "Escribe la etiqueta" },
  "Classificação indicativa": { en: "Age rating", es: "Clasificación por edad" },
  "Selecione pelo menos um aviso de conteúdo para a obra 18+.": {
    en: "Select at least one content warning for the 18+ work.",
    es: "Selecciona al menos una advertencia de contenido para la obra 18+.",
  },
  "Escolha a classificação": { en: "Choose the age rating", es: "Elige la clasificación" },
  "Sinopse": { en: "Synopsis", es: "Sinopsis" },
  "Escreva a sinopse da obra": { en: "Write the work synopsis", es: "Escribe la sinopsis de la obra" },
  "Salvando...": { en: "Saving...", es: "Guardando..." },
  "Atualizada": { en: "Updated", es: "Actualizada" },
  "Salvar alterações": { en: "Save changes", es: "Guardar cambios" },
  "Ver obra": { en: "View work", es: "Ver obra" },
  "Cancelar": { en: "Cancel", es: "Cancelar" },
  "Progresso": { en: "Progress", es: "Progreso" },
  "PRÉVIA DA OBRA": { en: "WORK PREVIEW", es: "VISTA PREVIA DE LA OBRA" },
  "Obra sem título": { en: "Untitled work", es: "Obra sin título" },
  "Por": { en: "By", es: "Por" },
  "Autor não informado": { en: "Author not provided", es: "Autor no informado" },
  "Publicado": { en: "Published", es: "Publicado" },
  "Rascunho": { en: "Draft", es: "Borrador" },
  "Livre": { en: "All ages", es: "Todo público" },
  "Não informado": { en: "Not provided", es: "No informado" },
  "Não informada": { en: "Not provided", es: "No informada" },
  "Nenhuma sinopse informada.": { en: "No synopsis provided.", es: "No se proporcionó una sinopsis." },
  "sem tags": { en: "no tags", es: "sin etiquetas" },
  "Arquivo da obra": { en: "Work file", es: "Archivo de la obra" },
  "Webnovel": { en: "Web novel", es: "Novela web" },
  "Light novel": { en: "Light novel", es: "Novela ligera" },
  "Romance": { en: "Novel", es: "Novela" },
  "Conto": { en: "Short story", es: "Cuento" },
  "Poesia": { en: "Poetry", es: "Poesía" },
  "HQ": { en: "Comic", es: "Cómic" },
  "Mangá": { en: "Manga", es: "Manga" },
  "Fanfic": { en: "Fanfiction", es: "Fanfic" },
  "Fantasia": { en: "Fantasy", es: "Fantasía" },
  "Terror": { en: "Horror", es: "Terror" },
  "Ficção": { en: "Fiction", es: "Ficción" },
  "Drama": { en: "Drama", es: "Drama" },
  "Ação": { en: "Action", es: "Acción" },
  "Mistério": { en: "Mystery", es: "Misterio" },
  "Suspense": { en: "Thriller", es: "Suspenso" },
  "Aventura": { en: "Adventure", es: "Aventura" },
  "Comédia": { en: "Comedy", es: "Comedia" },
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
  "O título precisa ter pelo menos 3 letras ou números.": { en: "The title must contain at least 3 letters or numbers.", es: "El título debe tener al menos 3 letras o números." },
  "O autor precisa ter pelo menos 2 letras ou números.": { en: "The author must contain at least 2 letters or numbers.", es: "El autor debe tener al menos 2 letras o números." },
  "O formato personalizado precisa ter 3 a 14 caracteres, sem vírgula, emoji ou símbolo estranho.": { en: "The custom format must contain 3 to 14 characters, without commas, emojis, or unsupported symbols.", es: "El formato personalizado debe tener entre 3 y 14 caracteres, sin comas, emojis ni símbolos no admitidos." },
  "Escolha um formato para a obra.": { en: "Choose a format for the work.", es: "Elige un formato para la obra." },
  "O gênero personalizado precisa ter 3 a 14 caracteres, sem vírgula, emoji ou símbolo estranho.": { en: "The custom genre must contain 3 to 14 characters, without commas, emojis, or unsupported symbols.", es: "El género personalizado debe tener entre 3 y 14 caracteres, sin comas, emojis ni símbolos no admitidos." },
  "Escolha um gênero para a obra.": { en: "Choose a genre for the work.", es: "Elige un género para la obra." },
  "A tag personalizada precisa ter 2 a 10 caracteres, sem vírgula, emoji ou símbolo estranho, e não pode repetir gênero ou formato.": { en: "The custom tag must contain 2 to 10 characters, without commas, emojis, or unsupported symbols, and cannot repeat the genre or format.", es: "La etiqueta personalizada debe tener entre 2 y 10 caracteres, sin comas, emojis ni símbolos no admitidos, y no puede repetir el género ni el formato." },
  "Escolha a classificação indicativa da obra.": { en: "Choose the work age rating.", es: "Elige la clasificación por edad de la obra." },
  "A sinopse precisa ter pelo menos 20 letras ou números.": { en: "The synopsis must contain at least 20 letters or numbers.", es: "La sinopsis debe tener al menos 20 letras o números." },
  "Escolha um arquivo de imagem válido.": { en: "Choose a valid image file.", es: "Elige un archivo de imagen válido." },
  "A capa precisa ter no máximo 2 MB.": { en: "The cover must be no larger than 2 MB.", es: "La portada debe tener como máximo 2 MB." },
  "Não consegui carregar essa imagem.": { en: "I could not load this image.", es: "No pude cargar esta imagen." },
  "Escolha PDF, TXT, MD ou imagem em PNG, JPG, WEBP ou GIF.": { en: "Choose a PDF, TXT, MD, or an image in PNG, JPG, WEBP, or GIF format.", es: "Elige un PDF, TXT, MD o una imagen en formato PNG, JPG, WEBP o GIF." },
  "O arquivo completo precisa ter no máximo 5 MB.": { en: "The full file must be no larger than 5 MB.", es: "El archivo completo debe tener como máximo 5 MB." },
  "Não consegui carregar esse arquivo.": { en: "I could not load this file.", es: "No pude cargar este archivo." },
  "Entre na sua conta antes de editar a obra.": { en: "Sign in before editing the work.", es: "Inicia sesión antes de editar la obra." },
  "Você não tem permissão para editar esta obra.": { en: "You do not have permission to edit this work.", es: "No tienes permiso para editar esta obra." },
  "Não consegui confirmar a atualização da obra no Supabase.": { en: "I could not confirm the work update in Supabase.", es: "No pude confirmar la actualización de la obra en Supabase." },
  "Não consegui atualizar a obra no Supabase.": { en: "I could not update the work in Supabase.", es: "No pude actualizar la obra en Supabase." },
  "Não consegui salvar as alterações. Tente usar uma capa/arquivo menor ou atualizar a página e salvar novamente.": { en: "I could not save the changes. Try using a smaller cover/file or refresh the page and save again.", es: "No pude guardar los cambios. Prueba con una portada o archivo más pequeño, o actualiza la página y vuelve a guardar." },
};

function traduzirTextoEditarObra(
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
  const traducaoExata = EDITAR_OBRA_UI_TRANSLATIONS[conteudo];

  if (traducaoExata) {
    return `${inicio}${traducaoExata[idioma]}${fim}`;
  }

  let correspondencia = /^Notificações: (\d+) não lidas$/.exec(conteudo);
  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Notifications: ${correspondencia[1]} unread${fim}`
      : `${inicio}Notificaciones: ${correspondencia[1]} sin leer${fim}`;
  }

  correspondencia = /^(\d+) cap\.$/.exec(conteudo);
  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}${correspondencia[1]} ch.${fim}`
      : `${inicio}${correspondencia[1]} cap.${fim}`;
  }

  correspondencia = /^(\d+)% pronto$/.exec(conteudo);
  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}${correspondencia[1]}% ready${fim}`
      : `${inicio}${correspondencia[1]}% listo${fim}`;
  }

  correspondencia = /^Não consegui confirmar sua permissão para editar esta obra: ([\s\S]+)$/.exec(conteudo);
  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}I could not confirm your permission to edit this work: ${correspondencia[1]}${fim}`
      : `${inicio}No pude confirmar tu permiso para editar esta obra: ${correspondencia[1]}${fim}`;
  }

  correspondencia = /^Não consegui atualizar a obra no Supabase: ([\s\S]+)$/.exec(conteudo);
  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}I could not update the work in Supabase: ${correspondencia[1]}${fim}`
      : `${inicio}No pude actualizar la obra en Supabase: ${correspondencia[1]}${fim}`;
  }

  correspondencia = /^Erro ao enviar (.+): ([\s\S]+)$/.exec(conteudo);
  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Error uploading ${correspondencia[1]}: ${correspondencia[2]}${fim}`
      : `${inicio}Error al subir ${correspondencia[1]}: ${correspondencia[2]}${fim}`;
  }

  return texto;
}

export function EditarObraLanguageBridge() {
  const { language } = useHistorietasLanguage();

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const raiz = document.querySelector(
      "[data-historietas-editar-obra-root='true']",
    );

    if (!raiz) {
      return;
    }

    const raizPagina = raiz;

    type EstadoTraducaoEditarObra = {
      original: string;
      traduzido: string;
    };

    const estadosTexto: WeakMap<Text, EstadoTraducaoEditarObra> = new WeakMap();
    const estadosAtributos: WeakMap<
      Element,
      Map<string, EstadoTraducaoEditarObra>
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

      const proximo = traduzirTextoEditarObra(estado.original, language);
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

      const proximo = traduzirTextoEditarObra(estado.original, language);
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

