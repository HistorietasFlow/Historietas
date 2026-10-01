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

export function totalVisualizacoesObraPublica(obra: { visualizacoes?: unknown }) {
  return normalizarContadorObraPublica(obra.visualizacoes);
}

export function totalCurtidasObraPublica(obra: { totalCurtidas?: unknown }) {
  return normalizarContadorObraPublica(obra.totalCurtidas);
}
export type MetricasObraPublica = {
  visualizacoes: number;
  curtidas: number;
  comentarios: number;
  seguidores: number;
  curtidaAtiva: boolean;
  carregado: boolean;
};

export const metricasObraVazias: MetricasObraPublica = {
  visualizacoes: 0,
  curtidas: 0,
  comentarios: 0,
  seguidores: 0,
  curtidaAtiva: false,
  carregado: false,
};

export function criarMetricasBaseObra(
  obra: { views: string; likes: string; comentarios: string } | null,
): MetricasObraPublica {
  if (!obra) {
    return metricasObraVazias;
  }

  return {
    visualizacoes: obterNumeroMetrica(obra.views),
    curtidas: obterNumeroMetrica(obra.likes),
    comentarios: obterNumeroMetrica(obra.comentarios),
    seguidores: 0,
    curtidaAtiva: false,
    carregado: false,
  };
}

