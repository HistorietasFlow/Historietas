import { calcularProgressoLeitura } from "./adicionar-capitulo-metrics-utils";

type CapituloComInteracoes = {
  id: string;
  curtiu: boolean;
  salvo: boolean;
  comentario: string;
  lido: boolean;
  lidoEm: string;
};

type ObraComCapitulos<TCapitulo extends CapituloComInteracoes> = {
  id: string;
  capitulos: TCapitulo[];
  ultimoCapituloLidoId: string;
  ultimaLeituraEm: string;
  visualizacoes?: number;
  totalCurtidas?: number;
  totalComentarios?: number;
  totalSalvos?: number;
  totalLidos?: number;
};

export function mesclarObrasComSupabase<
  TCapitulo extends CapituloComInteracoes,
  TObra extends ObraComCapitulos<TCapitulo>,
>(obrasLocais: TObra[], obrasSupabase: TObra[]) {
  const obrasLocaisPorId = new Map(obrasLocais.map((obra) => [obra.id, obra]));
  const obrasSupabaseIds = new Set(obrasSupabase.map((obra) => obra.id));

  const obrasMescladas = obrasSupabase.map((obraSupabase) => {
    const obraLocal = obrasLocaisPorId.get(obraSupabase.id);

    if (!obraLocal) {
      return obraSupabase;
    }

    return {
      ...obraSupabase,
      capitulos: obraSupabase.capitulos.map((capituloSupabase) => {
        const capituloLocal = obraLocal.capitulos.find(
          (capitulo) => capitulo.id === capituloSupabase.id
        );

        return capituloLocal
          ? {
              ...capituloSupabase,
              curtiu: capituloLocal.curtiu,
              salvo: capituloLocal.salvo,
              comentario: capituloLocal.comentario,
              lido: capituloLocal.lido,
              lidoEm: capituloLocal.lidoEm,
            }
          : capituloSupabase;
      }),
      ultimoCapituloLidoId: obraLocal.ultimoCapituloLidoId,
      ultimaLeituraEm: obraLocal.ultimaLeituraEm,
      progressoLeitura: calcularProgressoLeitura(obraSupabase.capitulos),
      visualizacoes: Math.max(
        obraSupabase.visualizacoes || 0,
        obraLocal.visualizacoes || 0
      ),
      totalCurtidas: Math.max(
        obraSupabase.totalCurtidas || 0,
        obraLocal.totalCurtidas || 0
      ),
      totalComentarios: Math.max(
        obraSupabase.totalComentarios || 0,
        obraLocal.totalComentarios || 0
      ),
      totalSalvos: Math.max(
        obraSupabase.totalSalvos || 0,
        obraLocal.totalSalvos || 0
      ),
      totalLidos: Math.max(
        obraSupabase.totalLidos || 0,
        obraLocal.totalLidos || 0
      ),
    };
  });

  const obrasSomenteLocais = obrasLocais.filter(
    (obraLocal) => !obrasSupabaseIds.has(obraLocal.id)
  );

  return [...obrasMescladas, ...obrasSomenteLocais];
}
