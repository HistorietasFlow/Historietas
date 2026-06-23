export function normalizarTexto(texto: string) {
  return texto
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function criarSlugBase(titulo: string) {
  const slug = normalizarTexto(titulo)
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || "obra";
}

export function idObraSupabaseValido(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    id
  );
}

export function obterNumeroSeguro(valor: unknown, fallback = 0) {
  return typeof valor === "number" && Number.isFinite(valor) ? valor : fallback;
}

export function formatarNumeroCompacto(valor: number) {
  if (!Number.isFinite(valor) || valor <= 0) {
    return "0";
  }

  if (valor >= 1000) {
    const valorCompacto = valor / 1000;
    const texto =
      valorCompacto >= 10
        ? Math.round(valorCompacto).toString()
        : valorCompacto.toFixed(1).replace(".0", "");

    return `${texto}K`;
  }

  return String(valor);
}

export function formatarTamanhoArquivo(tamanho: number) {
  if (!Number.isFinite(tamanho) || tamanho <= 0) {
    return "0 KB";
  }

  if (tamanho >= 1024 * 1024) {
    return `${(tamanho / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(tamanho / 1024))} KB`;
}

export function formatarData(dataIso: string, fallback = "Data não informada") {
  const data = new Date(dataIso);

  if (Number.isNaN(data.getTime())) {
    return fallback;
  }

  return data.toLocaleDateString("pt-BR");
}