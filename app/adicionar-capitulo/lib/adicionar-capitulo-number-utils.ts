export function normalizarNumeroAdicionarCapitulo(valor: unknown, fallback = 0) {
  if (typeof valor === "number" && Number.isFinite(valor)) {
    return Math.max(0, Math.round(valor));
  }

  if (typeof valor === "string" && valor.trim()) {
    const numero = Number(valor.replace(/\./g, "").replace(",", "."));

    if (Number.isFinite(numero)) {
      return Math.max(0, Math.round(numero));
    }
  }

  return Math.max(0, Math.round(fallback));
}

export function obterCampoNumericoObraAdicionarCapitulo(
  obra: Record<string, unknown>,
  campos: string[],
  fallback = 0
) {
  const valorEncontrado = campos
    .map((campo) => obra[campo])
    .find((valor) => {
      return (
        (typeof valor === "number" && Number.isFinite(valor)) ||
        (typeof valor === "string" && Boolean(valor.trim()))
      );
    });

  return normalizarNumeroAdicionarCapitulo(valorEncontrado, fallback);
}
