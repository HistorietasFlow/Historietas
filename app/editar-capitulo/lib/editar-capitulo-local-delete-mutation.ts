import { calcularProgressoLeitura } from "./editar-capitulo-metrics-utils";
import { normalizarObra } from "./editar-capitulo-work-normalizer";

type ParametrosRemoverCapituloDasObrasLocais = {
  obras: readonly Parameters<typeof normalizarObra>[0][];
  obraId: string;
  capituloId: string;
};

export function removerCapituloDasObrasLocais({
  obras,
  obraId,
  capituloId,
}: ParametrosRemoverCapituloDasObrasLocais) {
  const novasObras = obras.map((obra, obraIndex) => {
    const obraNormalizada = normalizarObra(obra, obraIndex);

    if (obraNormalizada.id !== obraId) {
      return obraNormalizada;
    }

    const capituloRemovido =
      obraNormalizada.capitulos.find(
        (capitulo) => capitulo.id === capituloId
      ) || null;
    const capitulosRestantes = obraNormalizada.capitulos.filter(
      (capitulo) => capitulo.id !== capituloId
    );

    return {
      ...obraNormalizada,
      capitulos: capitulosRestantes,
      ultimoCapituloLidoId:
        obraNormalizada.ultimoCapituloLidoId === capituloId
          ? ""
          : obraNormalizada.ultimoCapituloLidoId,
      progressoLeitura: calcularProgressoLeitura(capitulosRestantes),
      totalCurtidas: Math.max(
        0,
        (obraNormalizada.totalCurtidas || 0) -
          (capituloRemovido?.curtiu ? 1 : 0)
      ),
      totalComentarios: Math.max(
        0,
        (obraNormalizada.totalComentarios || 0) -
          (capituloRemovido?.comentario.trim() ? 1 : 0)
      ),
      totalSalvos: Math.max(
        0,
        (obraNormalizada.totalSalvos || 0) -
          (capituloRemovido?.salvo ? 1 : 0)
      ),
      totalLidos: Math.max(
        0,
        (obraNormalizada.totalLidos || 0) -
          (capituloRemovido?.lido ? 1 : 0)
      ),
    };
  });

  return novasObras;
}
