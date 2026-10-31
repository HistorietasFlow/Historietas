export function decodificarSlugSeguro(valor: string) {
  const slug = valor.trim();

  if (!slug || slug.length > 180) {
    return "";
  }

  try {
    const slugDecodificado = decodeURIComponent(slug).trim();

    if (
      !slugDecodificado ||
      slugDecodificado.length > 180 ||
      slugDecodificado.includes("/") ||
      slugDecodificado.includes("\\") ||
      /[\u0000-\u001F\u007F]/.test(slugDecodificado)
    ) {
      return "";
    }

    return slugDecodificado;
  } catch {
    return "";
  }
}

export function obterNumeroCapituloSeguro(valor: string) {
  const numeroTexto = valor.trim();

  if (!/^[1-9]\d*$/.test(numeroTexto)) {
    return null;
  }

  const numero = Number(numeroTexto);

  return Number.isSafeInteger(numero) ? numero : null;
}
