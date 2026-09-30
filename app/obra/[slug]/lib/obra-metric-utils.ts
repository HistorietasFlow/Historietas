export function obterNumeroMetrica(valor: string) {
  const valorNormalizado = valor.trim().toLowerCase().replace(",", ".");

  if (!valorNormalizado) {
    return 0;
  }

  const multiplicador = valorNormalizado.endsWith("k") ? 1000 : 1;
  const numero = Number.parseFloat(valorNormalizado.replace(/[^0-9.]/g, ""));

  return Number.isFinite(numero) ? Math.round(numero * multiplicador) : 0;
}

export function normalizarContadorObraPublica(valor: unknown) {
  if (typeof valor === "number" && Number.isFinite(valor)) {
    return Math.max(0, Math.round(valor));
  }

  if (typeof valor === "string" && valor.trim()) {
    const numero = Number(valor.replace(/\./g, "").replace(",", "."));

    if (Number.isFinite(numero)) {
      return Math.max(0, Math.round(numero));
    }
  }

  return 0;
}

export function totalComentariosObraPublica(obra: { totalComentarios?: unknown }) {
  return normalizarContadorObraPublica(obra.totalComentarios);
}
