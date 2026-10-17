import { normalizarNumeroSeguindo } from "./seguindo-format-utils";

type CapituloMetricasSeguindo = {
  curtiu: boolean;
  salvo: boolean;
  lido: boolean;
  comentario: string;
};

type ObraMetricasSeguindo = {
  capitulos: CapituloMetricasSeguindo[];
  totalCurtidas?: number;
  totalComentarios?: number;
  totalSalvos?: number;
  totalSeguidores?: number;
  totalFavoritas?: number;
  totalLidos?: number;
};

function contarCapitulosComFlagSeguindo(
  obra: Pick<ObraMetricasSeguindo, "capitulos">,
  campo: "curtiu" | "salvo" | "lido",
) {
  return obra.capitulos.filter((capitulo) => Boolean(capitulo[campo])).length;
}

function contarComentariosLocaisSeguindo(
  obra: Pick<ObraMetricasSeguindo, "capitulos">,
) {
  return obra.capitulos.filter((capitulo) => capitulo.comentario.trim()).length;
}

export function obterTotalCurtidasObraSeguindo(
  obra: Pick<ObraMetricasSeguindo, "capitulos" | "totalCurtidas">,
) {
  return Math.max(
    normalizarNumeroSeguindo(obra.totalCurtidas, 0),
    contarCapitulosComFlagSeguindo(obra, "curtiu"),
  );
}

export function obterTotalComentariosObraSeguindo(
  obra: Pick<ObraMetricasSeguindo, "capitulos" | "totalComentarios">,
) {
  return Math.max(
    normalizarNumeroSeguindo(obra.totalComentarios, 0),
    contarComentariosLocaisSeguindo(obra),
  );
}

export function obterTotalSalvosObraSeguindo(
  obra: Pick<
    ObraMetricasSeguindo,
    | "capitulos"
    | "totalSalvos"
    | "totalSeguidores"
    | "totalFavoritas"
  >,
) {
  return Math.max(
    normalizarNumeroSeguindo(obra.totalSalvos, 0),
    normalizarNumeroSeguindo(obra.totalSeguidores, 0),
    normalizarNumeroSeguindo(obra.totalFavoritas, 0),
    contarCapitulosComFlagSeguindo(obra, "salvo"),
  );
}

export function obterTotalLidosObraSeguindo(
  obra: Pick<ObraMetricasSeguindo, "capitulos" | "totalLidos">,
) {
  return Math.max(
    normalizarNumeroSeguindo(obra.totalLidos, 0),
    contarCapitulosComFlagSeguindo(obra, "lido"),
  );
}

export function calcularProgressoLeitura(
  capitulos: Array<Pick<CapituloMetricasSeguindo, "lido">>,
) {
  if (capitulos.length === 0) {
    return 0;
  }

  const capitulosLidos = capitulos.filter((capitulo) => capitulo.lido).length;

  return Math.round((capitulosLidos / capitulos.length) * 100);
}

export function obraEmLeitura(
  obra: Pick<ObraMetricasSeguindo, "capitulos">,
) {
  const progresso = calcularProgressoLeitura(obra.capitulos);

  return progresso > 0 && progresso < 100;
}
export function somarTotaisCapitulosSeguindo(
  capitulos: Array<{ id: string }>,
  contagens: Record<string, number>,
) {
  return capitulos.reduce((total, capitulo) => {
    return total + normalizarNumeroSeguindo(contagens[capitulo.id], 0);
  }, 0);
}

export function obterTotalRegistroObraSeguindo(
  obraId: string,
  contagens: Record<string, number>,
) {
  return normalizarNumeroSeguindo(contagens[obraId], 0);
}
