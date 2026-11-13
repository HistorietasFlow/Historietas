import type { HistorietasLanguage } from "../../../lib/i18n";

export function textosFiltroPalavras(idioma: HistorietasLanguage) {
  if (idioma === "en") return {
    titulo: "Available words", minimo: "Minimum words", maximo: "Maximum words", aplicar: "Apply word range",
    ajuda: "This filter only considers published, fully measured text chapters. Works with attachments, mixed content or unknown length do not appear while the filter is active.",
    erro: "Enter whole numbers from 0 to 9007199254740991. The minimum must not exceed the maximum.",
    corrigir: "Correct word range", palavras: "Words", desde: "from", ate: "up to",
  };
  if (idioma === "es") return {
    titulo: "Palabras disponibles", minimo: "Mínimo de palabras", maximo: "Máximo de palabras", aplicar: "Aplicar intervalo de palabras",
    ajuda: "El filtro solo considera capítulos de texto publicados y completamente medidos. Las obras con archivos adjuntos, contenido mixto o tamaño desconocido no aparecen cuando el filtro está activo.",
    erro: "Introduce números enteros de 0 a 9007199254740991. El mínimo no puede superar el máximo.",
    corrigir: "Corregir intervalo de palabras", palavras: "Palabras", desde: "a partir de", ate: "hasta",
  };
  return {
    titulo: "Palavras disponíveis", minimo: "Mínimo de palavras", maximo: "Máximo de palavras", aplicar: "Aplicar intervalo de palavras",
    ajuda: "O filtro considera apenas capítulos de texto publicados e totalmente medidos. Obras com anexos, conteúdo misto ou tamanho desconhecido não aparecem quando o filtro está ativo.",
    erro: "Informe inteiros de 0 a 9007199254740991. O mínimo não pode ser maior que o máximo.",
    corrigir: "Corrigir intervalo de palavras", palavras: "Palavras", desde: "a partir de", ate: "até",
  };
}

export function descreverIntervaloPalavras(minimo: number | null, maximo: number | null, idioma: HistorietasLanguage) {
  const t = textosFiltroPalavras(idioma);
  const numero = (valor: number) => valor.toLocaleString(idioma);
  return minimo !== null && maximo !== null ? `${numero(minimo)}–${numero(maximo)}`
    : minimo !== null ? `${t.desde} ${numero(minimo)}` : maximo !== null ? `${t.ate} ${numero(maximo)}` : "";
}
