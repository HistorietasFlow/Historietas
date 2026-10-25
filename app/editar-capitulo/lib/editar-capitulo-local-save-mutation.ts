import { calcularProgressoLeitura } from "./editar-capitulo-metrics-utils";
import { normalizarObra } from "./editar-capitulo-work-normalizer";

type ObraNormalizada = ReturnType<typeof normalizarObra>;

type ParametrosAplicarEdicaoCapituloNasObrasLocais = {
  obras: readonly Parameters<typeof normalizarObra>[0][];
  obraId: string;
  capituloId: string;
  tituloFinal: string;
  textoFinal: string;
  numeroCapituloFinal: number;
  autorFinalObra: string;
  userId: string;
};

export function aplicarEdicaoCapituloNasObrasLocais({
  obras,
  obraId,
  capituloId,
  tituloFinal,
  textoFinal,
  numeroCapituloFinal,
  autorFinalObra,
  userId,
}: ParametrosAplicarEdicaoCapituloNasObrasLocais) {
  let obraAtualizadaParaAcoes: ObraNormalizada | null = null;

  const novasObras = obras.map((obra, obraIndex) => {
    const obraNormalizada = normalizarObra(obra, obraIndex);

    if (obraNormalizada.id !== obraId) {
      return obraNormalizada;
    }

    const capitulosAtualizados = obraNormalizada.capitulos.map((capitulo) => {
      if (capitulo.id !== capituloId) {
        return capitulo;
      }

      return {
        ...capitulo,
        titulo: tituloFinal,
        texto: textoFinal,
        ordem: numeroCapituloFinal,
      };
    });

    const obraAtualizada: ObraNormalizada = {
      ...obraNormalizada,
      autor: autorFinalObra,
      autorId: obraNormalizada.autorId || userId,
      capitulos: capitulosAtualizados,
      progressoLeitura: calcularProgressoLeitura(capitulosAtualizados),
    };

    obraAtualizadaParaAcoes = obraAtualizada;
    return obraAtualizada;
  });

  return {
    novasObras,
    obraAtualizadaParaAcoes,
  };
}
