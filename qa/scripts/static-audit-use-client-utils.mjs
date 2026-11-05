const USE_CLIENT_SCAN_LIMIT = 2_000;

function caractereEhWhitespace(caractere) {
  return Boolean(caractere) && caractere.trim() === "";
}

export function hasUseClientDirective(content) {
  const inicio = content.charCodeAt(0) === 0xfeff ? 1 : 0;
  const beginning = content.slice(inicio, inicio + USE_CLIENT_SCAN_LIMIT);
  let indice = 0;

  while (indice < beginning.length) {
    while (caractereEhWhitespace(beginning[indice])) {
      indice += 1;
    }

    if (beginning.startsWith("//", indice)) {
      const fimComentario = beginning.indexOf("\n", indice + 2);

      if (fimComentario === -1) {
        return false;
      }

      indice = fimComentario + 1;
      continue;
    }

    if (beginning.startsWith("/*", indice)) {
      const fimComentario = beginning.indexOf("*/", indice + 2);

      if (fimComentario === -1) {
        return false;
      }

      indice = fimComentario + 2;
      continue;
    }

    break;
  }

  const aspas = beginning[indice];

  if (aspas !== '"' && aspas !== "'") {
    return false;
  }

  const diretiva = `${aspas}use client${aspas}`;

  if (!beginning.startsWith(diretiva, indice)) {
    return false;
  }

  indice += diretiva.length;

  while (caractereEhWhitespace(beginning[indice])) {
    indice += 1;
  }

  return beginning[indice] === ";";
}
