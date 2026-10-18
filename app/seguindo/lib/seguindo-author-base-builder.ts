import type { AutorSeguido, ObraLocal } from "./seguindo-page-types";
import { normalizarNomeAutor } from "./seguindo-format-utils";
import { obraEstaNaLista } from "./seguindo-work-collection-utils";
import { mostrarClassificacao } from "./seguindo-work-presentation-utils";
import {
  calcularProgressoLeitura,
  obraEmLeitura,
  obterTotalComentariosObraSeguindo,
  obterTotalCurtidasObraSeguindo,
  obterTotalLidosObraSeguindo,
  obterTotalSalvosObraSeguindo,
} from "./seguindo-work-metrics-utils";

export function montarAutoresBaseSeguindo(
  obrasVisiveisSeguindo: ObraLocal[],
  autoresSeguidos: string[],
  obrasFavoritas: string[],
  obrasConcluidas: string[],
): AutorSeguido[] {
    const mapa = new Map<string, { nome: string; obras: ObraLocal[] }>();

    obrasVisiveisSeguindo.forEach((obra) => {
      const nomeAutor = obra.autor.trim() || "Autor não informado";
      const chaveAutor = normalizarNomeAutor(nomeAutor);

      if (!autoresSeguidos.includes(chaveAutor)) {
        return;
      }

      const autorExistente = mapa.get(chaveAutor);

      if (autorExistente) {
        mapa.set(chaveAutor, {
          ...autorExistente,
          obras: [...autorExistente.obras, obra],
        });

        return;
      }

      mapa.set(chaveAutor, {
        nome: nomeAutor,
        obras: [obra],
      });
    });

    return Array.from(mapa.entries())
      .map(([chave, grupoAutor]) => {
        const obrasDoAutor = grupoAutor.obras;

        const totalCapitulos = obrasDoAutor.reduce(
          (total, obra) => total + obra.capitulos.length,
          0
        );

        const totalCurtidas = obrasDoAutor.reduce((total, obra) => {
          return total + obterTotalCurtidasObraSeguindo(obra);
        }, 0);

        const totalComentarios = obrasDoAutor.reduce((total, obra) => {
          return total + obterTotalComentariosObraSeguindo(obra);
        }, 0);

        const totalSalvos = obrasDoAutor.reduce((total, obra) => {
          return total + obterTotalSalvosObraSeguindo(obra);
        }, 0);

        const totalFavoritas = obrasDoAutor.filter((obra) =>
          obraEstaNaLista(obra, obrasFavoritas)
        ).length;

        const totalConcluidas = obrasDoAutor.filter((obra) =>
          obraEstaNaLista(obra, obrasConcluidas)
        ).length;

        const totalComClassificacao = obrasDoAutor.filter((obra) =>
          mostrarClassificacao(obra)
        ).length;

        const totalLidos = obrasDoAutor.reduce((total, obra) => {
          return total + obterTotalLidosObraSeguindo(obra);
        }, 0);

        const totalEmLeitura = obrasDoAutor.filter((obra) =>
          obraEmLeitura(obra)
        ).length;

        const progressoMedio =
          obrasDoAutor.length > 0
            ? Math.round(
                obrasDoAutor.reduce((total, obra) => {
                  return total + calcularProgressoLeitura(obra.capitulos);
                }, 0) / obrasDoAutor.length
              )
            : 0;

        return {
          chave,
          nome: grupoAutor.nome,
          autorId:
            obrasDoAutor.find((obra) => Boolean(obra.autorId?.trim()))
              ?.autorId?.trim() || "",
          obras: obrasDoAutor,
          totalCapitulos,
          totalPublicadas: obrasDoAutor.filter((obra) => obra.publicado).length,
          totalRascunhos: obrasDoAutor.filter((obra) => !obra.publicado).length,
          totalCurtidas,
          totalComentarios,
          totalSalvos,
          totalFavoritas,
          totalConcluidas,
          totalComClassificacao,
          totalLidos,
          totalEmLeitura,
          progressoMedio,
        };
      })
      .sort((autorA, autorB) => autorA.nome.localeCompare(autorB.nome));

}
