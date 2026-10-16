import { ehClassificacao18 } from "../../../lib/historietasAdultContent";
import type { ObraLocal, ObraRanking } from "./em-alta-models";
import { criarHrefLeituraCapitulo } from "./em-alta-route-utils";
import {
  calcularCapitulosLidos,
  calcularProgressoLeitura,
  encontrarCapituloParaContinuar,
  obterAvaliacaoLocalRanking,
  obterVisualizacoesRegistradasObra,
} from "./em-alta-ranking-data-utils";

export function calcularRankingObrasLocais(
  obrasLocais: ObraLocal[],
  avaliacoesLocaisRegistradas: Record<string, number>,
  visualizacoesRegistradas: Record<string, number>,
): ObraRanking[] {
  return obrasLocais
    .filter(
      (obra) =>
        obra.publicado && !ehClassificacao18(obra.classificacaoIndicativa),
    )
    .map((obra) => {
      const totalCurtidas = Math.max(0, obra.totalCurtidasRanking || 0);
      const totalComentarios = Math.max(0, obra.totalComentariosRanking || 0);
      const totalSalvos = Math.max(0, obra.totalSalvosRanking || 0);
      const avaliacaoLocalObra = obterAvaliacaoLocalRanking(
        obra,
        avaliacoesLocaisRegistradas,
      );
      const totalAvaliacoes = Math.max(
        0,
        obra.totalAvaliacoesRanking || 0,
        avaliacaoLocalObra > 0 ? 1 : 0,
      );
      const mediaAvaliacoes = Math.max(
        0,
        Math.min(
          5,
          Math.max(obra.mediaAvaliacoesRanking || 0, avaliacaoLocalObra),
        ),
      );

      const visualizacoesRegistradasObra = obterVisualizacoesRegistradasObra(
        obra,
        visualizacoesRegistradas,
      );
      const capitulosLidos = calcularCapitulosLidos(obra.capitulos);
      const visualizacoes = Math.max(
        obra.totalViewsRanking || 0,
        visualizacoesRegistradasObra,
      );
      const progressoLeitura = calcularProgressoLeitura(obra.capitulos);
      const capituloParaContinuar = encontrarCapituloParaContinuar(obra);
      const ultimoCapituloLidoTitulo = capituloParaContinuar
        ? capituloParaContinuar.titulo
        : "";
      const indiceCapituloParaContinuar = capituloParaContinuar
        ? obra.capitulos.findIndex(
            (capitulo) => capitulo.id === capituloParaContinuar.id,
          )
        : -1;
      const numeroCapituloParaContinuar =
        indiceCapituloParaContinuar >= 0
          ? indiceCapituloParaContinuar + 1
          : 1;
      const ultimoCapituloLidoHref = capituloParaContinuar
        ? criarHrefLeituraCapitulo(
            obra,
            capituloParaContinuar,
            numeroCapituloParaContinuar,
          )
        : "";
      const ultimaLeituraEm =
        obra.ultimaLeituraEm || capituloParaContinuar?.lidoEm || "";

      const criadaEmTimestamp = new Date(obra.criadaEm).getTime();
      const dataValida = Number.isNaN(criadaEmTimestamp)
        ? 0
        : criadaEmTimestamp;

      const pontuacao =
        totalCurtidas * 2 +
        totalComentarios * 3 +
        totalSalvos * 4 +
        visualizacoes * 1 +
        totalAvaliacoes * 4 +
        Math.round(mediaAvaliacoes * 4);

      return {
        id: `local-${obra.id}`,
        storageId: obra.id,
        tipo: "local",
        titulo: obra.titulo,
        autor: obra.autor,
        autorId: obra.autorId || "",
        autorAvatar: obra.autorAvatarRanking || "",
        seguidoresAutor: obra.totalSeguidoresAutorRanking || 0,
        genero: obra.genero,
        formato: obra.formato,
        classificacaoIndicativa: obra.classificacaoIndicativa,
        status: "Publicado",
        href: obra.link || `/obra/${obra.slug}`,
        disponivel: true,
        capa: obra.capa,
        capaNome: obra.capaNome,
        capitulos: obra.capitulos.length,
        capitulosLidos,
        progressoLeitura,
        ultimoCapituloLidoTitulo,
        ultimoCapituloLidoHref,
        ultimaLeituraEm,
        curtidas: totalCurtidas,
        comentarios: totalComentarios,
        salvos: totalSalvos,
        views: visualizacoes,
        avaliacoes: totalAvaliacoes,
        mediaAvaliacao: mediaAvaliacoes,
        pontuacao,
        criadaEmTimestamp: dataValida,
      } satisfies ObraRanking;
    });
}
