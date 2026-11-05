import { carregarMetricasConteudos } from "../../../../lib/metricas";
import { supabase } from "../../../../lib/supabase/client";
import type { ObraDinamica } from "./obra-data-utils";
import type { CarregarMetricasObra } from "./obra-work-metrics-request-coordinator";

export async function carregarSnapshotRemotoAvaliacaoObra({
  obra,
  usuarioIdLogado,
  carregarMetricasObra = (obraId) =>
    carregarMetricasConteudos({ obraIds: [obraId] }),
}: {
  obra: Pick<ObraDinamica, "id" | "autorId">;
  usuarioIdLogado: string;
  carregarMetricasObra?: CarregarMetricasObra;
}) {
  const { data: usuarioData } = await supabase.auth.getUser();
  const userId = usuarioData.user?.id || usuarioIdLogado || "";
  const autorIdObraAtual = obra.autorId?.trim() || "";
  const usuarioEhAutorDaObraAtual = Boolean(
    userId &&
      autorIdObraAtual &&
      userId === autorIdObraAtual,
  );
  const contrato = await carregarMetricasObra(obra.id);
  const metrica = contrato.obras.get(obra.id);

  if (!contrato.carregado || !metrica) {
    return null;
  }

  const minhaNotaRemota =
    userId && !usuarioEhAutorDaObraAtual
      ? metrica.avaliacao.minhaNota
      : 0;
  const minhaNota = usuarioEhAutorDaObraAtual ? 0 : minhaNotaRemota;

  return {
    userId,
    usuarioEhAutorDaObraAtual,
    minhaNotaRemota,
    minhaNota,
    total: metrica.avaliacao.total,
    media: metrica.avaliacao.media,
  };
}
