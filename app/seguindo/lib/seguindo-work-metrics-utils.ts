import type { ContratoMetricas } from "../../../lib/metricas";
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

export type TotaisInteracoesSeguindo = {
  curtidasPorObra: Record<string, number>;
  comentariosPorObra: Record<string, number>;
  salvosPorObra: Record<string, number>;
  lidosPorObra: Record<string, number>;
  seguidoresPorObra: Record<string, number>;
  favoritasPorObra: Record<string, number>;
  concluidasPorObra: Record<string, number>;
  curtidasPorCapitulo: Record<string, number>;
  comentariosPorCapitulo: Record<string, number>;
  salvosPorCapitulo: Record<string, number>;
  lidosPorCapitulo: Record<string, number>;
};

export function prepararMetricasSeguindo(
  metricas: ContratoMetricas,
  userId: string,
) {
  const favoritasSupabase = new Set<string>();
  const concluidasSupabase = new Set<string>();
  const capitulosSalvos = new Set<string>();
  const capitulosCurtidos = new Set<string>();
  const progressoPorCapitulo = new Map<string, string>();
  const progressoCarregado = metricas.carregado && Boolean(userId.trim());
  const totaisReais: TotaisInteracoesSeguindo = {
    curtidasPorObra: {},
    comentariosPorObra: {},
    salvosPorObra: {},
    lidosPorObra: {},
    seguidoresPorObra: {},
    favoritasPorObra: {},
    concluidasPorObra: {},
    curtidasPorCapitulo: {},
    comentariosPorCapitulo: {},
    salvosPorCapitulo: {},
    lidosPorCapitulo: {},
  };

  metricas.obras.forEach((metrica) => {
    totaisReais.curtidasPorObra[metrica.id] =
      metrica.audiencia.curtidoresUnicos;
    totaisReais.comentariosPorObra[metrica.id] =
      metrica.audiencia.comentaristasUnicos;
    totaisReais.salvosPorObra[metrica.id] =
      metrica.audiencia.salvadoresUnicos;
    totaisReais.seguidoresPorObra[metrica.id] =
      metrica.interacoesDiretas.seguidores;
    totaisReais.favoritasPorObra[metrica.id] =
      metrica.interacoesDiretas.favoritos;
    totaisReais.concluidasPorObra[metrica.id] =
      metrica.interacoesDiretas.concluidas;

    if (metrica.usuario.favoritou) {
      favoritasSupabase.add(metrica.id);
    }

    if (metrica.usuario.concluiu) {
      concluidasSupabase.add(metrica.id);
    }
  });

  metricas.capitulos.forEach((metrica) => {
    totaisReais.curtidasPorCapitulo[metrica.id] =
      metrica.interacoes.curtidas;
    totaisReais.comentariosPorCapitulo[metrica.id] =
      metrica.interacoes.comentarios;
    totaisReais.salvosPorCapitulo[metrica.id] = metrica.interacoes.salvos;

    if (metrica.usuario.curtiu) {
      capitulosCurtidos.add(metrica.id);
    }

    if (metrica.usuario.salvou) {
      capitulosSalvos.add(metrica.id);
    }

    if (progressoCarregado && metrica.usuario.leu) {
      progressoPorCapitulo.set(metrica.id, metrica.usuario.lidoEm);
    }
  });

  return {
    favoritasSupabase,
    concluidasSupabase,
    capitulosSalvos,
    capitulosCurtidos,
    progressoPorCapitulo,
    progressoCarregado,
    totaisReais,
  };
}
