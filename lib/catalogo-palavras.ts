export type IntervaloPalavrasTexto = Readonly<{ minimo: string; maximo: string }>;

export const INTERVALO_PALAVRAS_VAZIO: IntervaloPalavrasTexto = { minimo: "", maximo: "" };

// Strings are accepted only by the UI/URL parser, never by the RPC contract.
export function lerIntervaloPalavras(minimo: unknown, maximo: unknown, aceitarTexto = false) {
  function limite(valor: unknown): number | null {
    if (valor === null || valor === undefined || (aceitarTexto && valor === "")) return null;
    if (aceitarTexto && typeof valor === "string" && !/[^0-9]/.test(valor)) valor = Number(valor);
    if (typeof valor !== "number" || !Number.isSafeInteger(valor) || valor < 0) {
      throw new Error("Intervalo de palavras inválido.");
    }
    return valor;
  }
  const palavrasMinimas = limite(minimo);
  const palavrasMaximas = limite(maximo);
  if (palavrasMinimas !== null && palavrasMaximas !== null && palavrasMinimas > palavrasMaximas) {
    throw new Error("Intervalo de palavras inválido.");
  }
  return { palavrasMinimas, palavrasMaximas };
}

export function validarIntervaloPalavras(texto: IntervaloPalavrasTexto) {
  try {
    return { valido: true as const, ...lerIntervaloPalavras(texto.minimo, texto.maximo, true) };
  } catch {
    return { valido: false as const };
  }
}

// Invalid incoming values remain visible and correctable, not silently neutral.
export function canonizarPalavrasUrl(valor: string | null | undefined) {
  if (valor == null || valor === "") return "";
  try { return String(lerIntervaloPalavras(valor, null, true).palavrasMinimas); }
  catch { return valor; }
}
