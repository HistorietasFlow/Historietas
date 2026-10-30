import {
  calcularProgressoLeitura,
  normalizarObra,
  type CapituloLocal,
  type ObraLocal,
} from "./ler-capitulo-work-normalization";

export function normalizarObrasLeitor(
  obras: ObraLocal[],
) {
  return obras.map(
    (obra, index) =>
      normalizarObra(
        obra,
        index,
      ),
  );
}

export function atualizarCapituloNasObrasLeitor({
  obras,
  obraAtualId,
  capituloAtualId,
  dados,
}: {
  obras: ObraLocal[];
  obraAtualId: string;
  capituloAtualId: string;
  dados: Partial<CapituloLocal>;
}) {
  return obras.map(
    (obra, obraIndex) => {
      const obraNormalizada =
        normalizarObra(
          obra,
          obraIndex,
        );

      if (
        obraNormalizada.id !==
        obraAtualId
      ) {
        return obraNormalizada;
      }

      const capitulosAtualizados =
        obraNormalizada.capitulos.map(
          (capitulo) => {
            if (
              capitulo.id !==
              capituloAtualId
            ) {
              return capitulo;
            }

            return {
              ...capitulo,
              ...dados,
            };
          },
        );

      return {
        ...obraNormalizada,
        capitulos:
          capitulosAtualizados,
        progressoLeitura:
          calcularProgressoLeitura(
            capitulosAtualizados,
          ),
      };
    },
  );
}
