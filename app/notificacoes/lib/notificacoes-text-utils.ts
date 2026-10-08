export function corrigirTextoQuebrado(texto: string) {
  let textoCorrigido = texto;

  for (let tentativa = 0; tentativa < 2; tentativa += 1) {
    if (!/[ÃÂâð ]/.test(textoCorrigido)) {
      break;
    }

    try {
      const bytes = new Uint8Array(
        Array.from(textoCorrigido, (caractere) => caractere.charCodeAt(0) & 255)
      );
      const decodificado = new TextDecoder("utf-8", { fatal: true }).decode(bytes);

      if (!decodificado || decodificado === textoCorrigido) {
        break;
      }

      textoCorrigido = decodificado;
    } catch {
      break;
    }
  }

  return textoCorrigido.replace(/ /g, "");
}

export function limparTextoExibicao(valor: string) {
  return corrigirTextoQuebrado(valor).trim();
}
