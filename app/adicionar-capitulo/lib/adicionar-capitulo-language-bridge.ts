import type { HistorietasLanguage } from "../../../lib/i18n";

type EstadoTextoTraduzidoAdicionarCapitulo = {
  original: string;
  traduzido: string;
};

type EstadoAtributoTraduzidoAdicionarCapitulo = Record<
  string,
  EstadoTextoTraduzidoAdicionarCapitulo
>;

const estadosTextosTraduzidosAdicionarCapitulo = new WeakMap<
  Text,
  EstadoTextoTraduzidoAdicionarCapitulo
>();

const estadosAtributosTraduzidosAdicionarCapitulo = new WeakMap<
  Element,
  EstadoAtributoTraduzidoAdicionarCapitulo
>();

const TRADUCOES_ADICIONAR_CAPITULO: Record<
  Exclude<HistorietasLanguage, "pt-BR">,
  Record<string, string>
> = {
  en: {
    "ADICIONAR CAPÍTULO": "ADD CHAPTER",
    "Obra não encontrada": "Work not found",
    "Voltar para a Home": "Back to Home",
    "Notificações": "Notifications",
    "Não foi possível criar": "Unable to create",
    "Capítulo": "Chapter",
    "Título do capítulo": "Chapter title",
    "Texto do capítulo": "Chapter text",
    "Opcional. Se deixar vazio, o sistema usa Capítulo":
      "Optional. Leave it blank to use Chapter",
    "Importar versão revisada": "Import revised version",
    "Opcional. Importe um arquivo .txt ou .md.":
      "Optional. Import a .txt or .md file.",
    "Arquivo importado:": "Imported file:",
    "Importar .txt/.md": "Import .txt/.md",
    "Escreva o texto do capítulo aqui...": "Write the chapter text here...",
    "Salvando...": "Saving...",
    "Criado": "Created",
    "Criar capítulo": "Create chapter",
    "Ler capítulo": "Read chapter",
    "Ver obra": "View work",
    "Cancelar": "Cancel",
    "PRÉVIA DO CAPÍTULO": "CHAPTER PREVIEW",
    "Obra sem título": "Untitled work",
    "Autor não informado": "Author not provided",
    "Não informado": "Not provided",
    "Não informada": "Not provided",
    "Nenhuma sinopse informada.": "No synopsis provided.",
    "Arquivo da obra": "Work file",
    "Envie um arquivo .txt ou .md para importar o texto do capítulo.":
      "Upload a .txt or .md file to import the chapter text.",
    "Esse arquivo é grande demais. Use um arquivo de até 700 KB.":
      "This file is too large. Use a file up to 700 KB.",
    "O arquivo foi lido, mas não tem texto suficiente para formar um capítulo.":
      "The file was read, but it does not contain enough text to form a chapter.",
    "Não consegui ler esse arquivo. Tente salvar como .txt ou .md e importar novamente.":
      "I couldn't read this file. Save it as .txt or .md and import it again.",
    "O título do capítulo precisa ter pelo menos 3 letras ou números. Se quiser usar o título automático, deixe o campo vazio.":
      "The chapter title must contain at least 3 letters or numbers. Leave the field blank to use the automatic title.",
    "O texto do capítulo precisa ter pelo menos 20 letras ou números.":
      "The chapter text must contain at least 20 letters or numbers.",
    "Você não tem permissão para adicionar capítulo nesta obra.":
      "You do not have permission to add a chapter to this work.",
    "Não consegui salvar esse capítulo. Tente atualizar a página e criar novamente.":
      "I couldn't save this chapter. Refresh the page and try creating it again.",
  },
  es: {
    "ADICIONAR CAPÍTULO": "AÑADIR CAPÍTULO",
    "Obra não encontrada": "Obra no encontrada",
    "Voltar para a Home": "Volver al inicio",
    "Notificações": "Notificaciones",
    "Não foi possível criar": "No se pudo crear",
    "Capítulo": "Capítulo",
    "Título do capítulo": "Título del capítulo",
    "Texto do capítulo": "Texto del capítulo",
    "Opcional. Se deixar vazio, o sistema usa Capítulo":
      "Opcional. Déjalo vacío para usar Capítulo",
    "Importar versão revisada": "Importar versión revisada",
    "Opcional. Importe um arquivo .txt ou .md.":
      "Opcional. Importa un archivo .txt o .md.",
    "Arquivo importado:": "Archivo importado:",
    "Importar .txt/.md": "Importar .txt/.md",
    "Escreva o texto do capítulo aqui...": "Escribe aquí el texto del capítulo...",
    "Salvando...": "Guardando...",
    "Criado": "Creado",
    "Criar capítulo": "Crear capítulo",
    "Ler capítulo": "Leer capítulo",
    "Ver obra": "Ver obra",
    "Cancelar": "Cancelar",
    "PRÉVIA DO CAPÍTULO": "VISTA PREVIA DEL CAPÍTULO",
    "Obra sem título": "Obra sin título",
    "Autor não informado": "Autor no indicado",
    "Não informado": "No indicado",
    "Não informada": "No indicada",
    "Nenhuma sinopse informada.": "No se proporcionó ninguna sinopsis.",
    "Arquivo da obra": "Archivo de la obra",
    "Envie um arquivo .txt ou .md para importar o texto do capítulo.":
      "Sube un archivo .txt o .md para importar el texto del capítulo.",
    "Esse arquivo é grande demais. Use um arquivo de até 700 KB.":
      "Este archivo es demasiado grande. Usa un archivo de hasta 700 KB.",
    "O arquivo foi lido, mas não tem texto suficiente para formar um capítulo.":
      "El archivo se leyó, pero no contiene suficiente texto para formar un capítulo.",
    "Não consegui ler esse arquivo. Tente salvar como .txt ou .md e importar novamente.":
      "No pude leer este archivo. Guárdalo como .txt o .md e impórtalo de nuevo.",
    "O título do capítulo precisa ter pelo menos 3 letras ou números. Se quiser usar o título automático, deixe o campo vazio.":
      "El título del capítulo debe contener al menos 3 letras o números. Deja el campo vacío para usar el título automático.",
    "O texto do capítulo precisa ter pelo menos 20 letras ou números.":
      "El texto del capítulo debe contener al menos 20 letras o números.",
    "Você não tem permissão para adicionar capítulo nesta obra.":
      "No tienes permiso para añadir un capítulo a esta obra.",
    "Não consegui salvar esse capítulo. Tente atualizar a página e criar novamente.":
      "No pude guardar este capítulo. Actualiza la página e intenta crearlo de nuevo.",
  },
};

function traduzirConteudoAdicionarCapitulo(
  conteudo: string,
  idioma: HistorietasLanguage
) {
  if (idioma === "pt-BR" || !conteudo) {
    return conteudo;
  }

  const traducaoExata = TRADUCOES_ADICIONAR_CAPITULO[idioma][conteudo];

  if (traducaoExata) {
    return traducaoExata;
  }

  const numeroCapitulo = /^Capítulo\s+(\d+)$/i.exec(conteudo);

  if (numeroCapitulo) {
    return idioma === "en"
      ? `Chapter ${numeroCapitulo[1]}`
      : `Capítulo ${numeroCapitulo[1]}`;
  }

  const exemploCapitulo = /^Ex:\s*Capítulo\s+(\d+)$/i.exec(conteudo);

  if (exemploCapitulo) {
    return idioma === "en"
      ? `E.g.: Chapter ${exemploCapitulo[1]}`
      : `Ej.: Capítulo ${exemploCapitulo[1]}`;
  }

  const notificacoesNaoLidas =
    /^Notificações:\s*(\d+)\s*não lidas$/i.exec(conteudo);

  if (notificacoesNaoLidas) {
    return idioma === "en"
      ? `Notifications: ${notificacoesNaoLidas[1]} unread`
      : `Notificaciones: ${notificacoesNaoLidas[1]} sin leer`;
  }

  const resumoArquivo =
    /^(.*?)\s*•\s*(\d+)\s*palavras\s*•\s*(\d+)\s*min$/i.exec(conteudo);

  if (resumoArquivo) {
    return idioma === "en"
      ? `${resumoArquivo[1]} • ${resumoArquivo[2]} words • ${resumoArquivo[3]} min`
      : `${resumoArquivo[1]} • ${resumoArquivo[2]} palabras • ${resumoArquivo[3]} min`;
  }

  const prefixos: Array<{
    pt: string;
    en: string;
    es: string;
  }> = [
    {
      pt: "Não consegui confirmar a autoria da obra:",
      en: "I couldn't confirm the authorship of the work:",
      es: "No pude confirmar la autoría de la obra:",
    },
    {
      pt: "Não consegui calcular a ordem do novo capítulo:",
      en: "I couldn't calculate the new chapter order:",
      es: "No pude calcular el orden del nuevo capítulo:",
    },
    {
      pt: "Não consegui salvar capítulo no Supabase:",
      en: "I couldn't save the chapter in Supabase:",
      es: "No pude guardar el capítulo en Supabase:",
    },
  ];

  for (const prefixo of prefixos) {
    if (conteudo.startsWith(prefixo.pt)) {
      const complemento = conteudo.slice(prefixo.pt.length);

      return `${prefixo[idioma === "en" ? "en" : "es"]}${complemento}`;
    }
  }

  return conteudo;
}

function traduzirTextoAdicionarCapitulo(
  texto: string,
  idioma: HistorietasLanguage
) {
  if (!texto || idioma === "pt-BR") {
    return texto;
  }

  const inicio = texto.match(/^\s*/)?.[0] || "";
  const fim = texto.match(/\s*$/)?.[0] || "";
  const conteudo = texto.trim();

  if (!conteudo) {
    return texto;
  }

  return `${inicio}${traduzirConteudoAdicionarCapitulo(conteudo, idioma)}${fim}`;
}

export function traduzirElementoAdicionarCapitulo(
  raiz: HTMLElement,
  idioma: HistorietasLanguage
) {
  const walker = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
  let noAtual = walker.nextNode();

  while (noAtual) {
    const noTexto = noAtual as Text;
    const elementoPai = noTexto.parentElement;
    const tagPai = elementoPai?.tagName.toLowerCase() || "";

    if (!["script", "style", "textarea"].includes(tagPai)) {
      const textoAtual = noTexto.nodeValue || "";
      const estadoAnterior =
        estadosTextosTraduzidosAdicionarCapitulo.get(noTexto);
      const textoOriginal =
        estadoAnterior && textoAtual === estadoAnterior.traduzido
          ? estadoAnterior.original
          : textoAtual;
      const textoTraduzido = traduzirTextoAdicionarCapitulo(
        textoOriginal,
        idioma
      );

      estadosTextosTraduzidosAdicionarCapitulo.set(noTexto, {
        original: textoOriginal,
        traduzido: textoTraduzido,
      });

      if (textoAtual !== textoTraduzido) {
        noTexto.nodeValue = textoTraduzido;
      }
    }

    noAtual = walker.nextNode();
  }

  const elementos = [raiz, ...Array.from(raiz.querySelectorAll("*"))];
  const atributosTraduziveis = ["aria-label", "title", "placeholder", "alt"];

  elementos.forEach((elemento) => {
    const estadosAtributos =
      estadosAtributosTraduzidosAdicionarCapitulo.get(elemento) || {};

    atributosTraduziveis.forEach((atributo) => {
      const valorAtual = elemento.getAttribute(atributo);

      if (valorAtual === null) {
        return;
      }

      const estadoAnterior = estadosAtributos[atributo];
      const valorOriginal =
        estadoAnterior && valorAtual === estadoAnterior.traduzido
          ? estadoAnterior.original
          : valorAtual;
      const valorTraduzido = traduzirTextoAdicionarCapitulo(
        valorOriginal,
        idioma
      );

      estadosAtributos[atributo] = {
        original: valorOriginal,
        traduzido: valorTraduzido,
      };

      if (valorAtual !== valorTraduzido) {
        elemento.setAttribute(atributo, valorTraduzido);
      }
    });

    estadosAtributosTraduzidosAdicionarCapitulo.set(
      elemento,
      estadosAtributos
    );
  });
}


