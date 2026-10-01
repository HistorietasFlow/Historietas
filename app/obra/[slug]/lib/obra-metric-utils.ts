import { idObraSupabaseValido, obterNumeroSeguro } from "../../../../lib/utils";

export async function incrementarVisualizacaoObraPublicaSupabase(
  obraId: string
): Promise<number | null> {
  const obraIdLimpo = obraId.trim();

  if (!idObraSupabaseValido(obraIdLimpo)) {
    return null;
  }

  try {
    const response = await fetch("/api/visualizacoes", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipo: "obra",
        conteudoId: obraIdLimpo,
      }),
    });
    const data = (await response.json().catch(() => null)) as
      | { ok?: boolean; total?: unknown }
      | null;

    if (!response.ok || !data?.ok || typeof data.total !== "number") {
      return null;
    }

    return Math.max(0, obterNumeroSeguro(data.total, 0));
  } catch {
    // A página da obra continua funcionando mesmo se a contagem falhar.
    return null;
  }
}

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
export type MetricasComunidadeObra = {
  teorias: number;
  reviews: number;
  posts: number;
  carregado: boolean;
};

export const metricasComunidadeObraVazias: MetricasComunidadeObra = {
  teorias: 0,
  reviews: 0,
  posts: 0,
  carregado: false,
};

