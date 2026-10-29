import { ehClassificacao18 } from "../../../../lib/historietasAdultContent";
import { obterIdentificadoresObraTop5 } from "./top5-work-identifiers";
import type { ObraTop5 } from "./top5-types";

export function mesclarObrasTop5(obras: ObraTop5[]) {
  const obrasMescladas: ObraTop5[] = [];
  const indicePorIdentificador = new Map<string, number>();

  obras.forEach((obra) => {
    if (!obra.publicado || ehClassificacao18(obra.classificacaoIndicativa)) {
      return;
    }

    const identificadores = obterIdentificadoresObraTop5(obra);
    const indiceExistente = identificadores
      .map((identificador) => indicePorIdentificador.get(identificador))
      .find((indice): indice is number => typeof indice === "number");

    if (typeof indiceExistente === "number") {
      const obraExistente = obrasMescladas[indiceExistente];
      const obraAtualizada: ObraTop5 = {
        ...obraExistente,
        ...obra,
        capa: obra.capa || obraExistente.capa,
        capaNome: obra.capaNome || obraExistente.capaNome,
        capitulos:
          obra.capitulos.length > 0 ? obra.capitulos : obraExistente.capitulos,
        arquivoObra: obra.arquivoObra || obraExistente.arquivoObra,
        link: obra.link || obraExistente.link,
      };

      obrasMescladas[indiceExistente] = obraAtualizada;

      obterIdentificadoresObraTop5(obraAtualizada).forEach((identificador) => {
        indicePorIdentificador.set(identificador, indiceExistente);
      });

      return;
    }

    const novoIndice = obrasMescladas.length;
    obrasMescladas.push(obra);

    identificadores.forEach((identificador) => {
      indicePorIdentificador.set(identificador, novoIndice);
    });
  });

  return obrasMescladas;
}
