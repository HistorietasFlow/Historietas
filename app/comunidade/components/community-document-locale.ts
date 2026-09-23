export function obterLocaleDocumentoComunidade() {
  if (typeof document === "undefined") {
    return "pt-BR";
  }

  const idiomaDocumento = document.documentElement.lang.toLowerCase();

  if (idiomaDocumento.startsWith("en")) {
    return "en-US";
  }

  if (idiomaDocumento.startsWith("es")) {
    return "es-ES";
  }

  return "pt-BR";
}
