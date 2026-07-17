export function normalizarTexto(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function criarSlugBase(titulo: string) {
  const slug = normalizarTexto(titulo)
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "obra";
}

export function idObraSupabaseValido(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    id.trim(),
  );
}

export function obterNumeroSeguro(valor: unknown, fallback = 0) {
  if (typeof valor === "number" && Number.isFinite(valor)) {
    return valor;
  }

  return Number.isFinite(fallback) ? fallback : 0;
}

export function formatarNumeroCompacto(valor: number) {
  if (!Number.isFinite(valor) || valor <= 0) {
    return "0";
  }

  const numero = Math.max(0, valor);

  if (numero >= 1_000_000_000) {
    const valorCompacto = numero / 1_000_000_000;
    const texto =
      valorCompacto >= 10
        ? Math.round(valorCompacto).toString()
        : valorCompacto.toFixed(1).replace(".0", "");

    return `${texto}B`;
  }

  if (numero >= 1_000_000) {
    const valorCompacto = numero / 1_000_000;
    const texto =
      valorCompacto >= 10
        ? Math.round(valorCompacto).toString()
        : valorCompacto.toFixed(1).replace(".0", "");

    return `${texto}M`;
  }

  if (numero >= 1_000) {
    const valorCompacto = numero / 1_000;
    const texto =
      valorCompacto >= 10
        ? Math.round(valorCompacto).toString()
        : valorCompacto.toFixed(1).replace(".0", "");

    return `${texto}K`;
  }

  return Math.round(numero).toString();
}

export function formatarTamanhoArquivo(tamanho: number) {
  if (!Number.isFinite(tamanho) || tamanho <= 0) {
    return "0 KB";
  }

  if (tamanho >= 1024 ** 3) {
    return `${(tamanho / 1024 ** 3).toFixed(1)} GB`;
  }

  if (tamanho >= 1024 ** 2) {
    return `${(tamanho / 1024 ** 2).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(tamanho / 1024))} KB`;
}

export function formatarData(
  dataIso: string,
  fallback = "Data não informada",
) {
  const dataIsoLimpa = dataIso.trim();

  if (!dataIsoLimpa) {
    return fallback;
  }

  const data = new Date(dataIsoLimpa);

  if (Number.isNaN(data.getTime())) {
    return fallback;
  }

  return data.toLocaleDateString("pt-BR");
}