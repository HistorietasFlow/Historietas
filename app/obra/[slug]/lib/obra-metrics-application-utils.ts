import { carregarMetricasConteudos } from "../../../../lib/metricas";
import type { ObraLocal } from "./obra-data-utils";
import { normalizarContadorObraPublica } from "./obra-metric-utils";
import { calcularProgressoLeitura } from "./obra-reading-utils";

export async function aplicarMetricasObraPublica(
  obrasParaAtualizar: ObraLocal[],
  userId: string,
) {
  const obraIds = Array.from(
    new Set(obrasParaAtualizar.map((obra) => obra.id.trim()).filter(Boolean)),
  );
  const capituloIds = Array.from(
    new Set(
      obrasParaAtualizar.flatMap((obra) =>
        obra.capitulos.map((capitulo) => capitulo.id.trim()).filter(Boolean),
      ),
    ),
  );

  if (obraIds.length === 0 && capituloIds.length === 0) {
    return obrasParaAtualizar;
  }

  const metricas = await carregarMetricasConteudos({ obraIds, capituloIds });

  if (!metricas.carregado) {
    return obrasParaAtualizar;
  }

  const aplicarProgresso = Boolean(userId.trim());

  return obrasParaAtualizar.map((obra) => {
    const metricaObra = metricas.obras.get(obra.id);
    let ultimoCapituloLidoId = aplicarProgresso
      ? ""
      : obra.ultimoCapituloLidoId;
    let ultimaLeituraEm = aplicarProgresso ? "" : obra.ultimaLeituraEm;

    const capitulos = obra.capitulos.map((capitulo) => {
      const metrica = metricas.capitulos.get(capitulo.id);
      const progressoRemotoDisponivel = aplicarProgresso && Boolean(metrica);
      const lido = progressoRemotoDisponivel
        ? Boolean(metrica?.usuario.leu)
        : capitulo.lido;
      const lidoEm = progressoRemotoDisponivel && lido
        ? metrica?.usuario.lidoEm || ""
        : capitulo.lidoEm;

      if (lido) {
        const tempoAtual = new Date(lidoEm).getTime();
        const tempoUltimo = new Date(ultimaLeituraEm).getTime();
        const tempoAtualSeguro = Number.isNaN(tempoAtual) ? 0 : tempoAtual;
        const tempoUltimoSeguro = Number.isNaN(tempoUltimo) ? 0 : tempoUltimo;

        if (!ultimoCapituloLidoId || tempoAtualSeguro >= tempoUltimoSeguro) {
          ultimoCapituloLidoId = capitulo.id;
          ultimaLeituraEm = lidoEm;
        }
      }

      return {
        ...capitulo,
        curtiu: Boolean(capitulo.curtiu || metrica?.usuario.curtiu),
        salvo: Boolean(capitulo.salvo || metrica?.usuario.salvou),
        lido,
        lidoEm,
        totalCurtidas:
          metrica?.interacoes.curtidas ??
          normalizarContadorObraPublica(capitulo.totalCurtidas),
        totalComentarios:
          metrica?.interacoes.comentarios ??
          normalizarContadorObraPublica(capitulo.totalComentarios),
        totalSalvos:
          metrica?.interacoes.salvos ??
          normalizarContadorObraPublica(capitulo.totalSalvos),
        // Progresso de leitura é privado; o contrato fornece apenas o estado
        // do usuário atual, não um contador público de leitores.
        totalLidos: normalizarContadorObraPublica(capitulo.totalLidos),
      };
    });

    return {
      ...obra,
      capitulos,
      ultimoCapituloLidoId,
      ultimaLeituraEm,
      progressoLeitura: calcularProgressoLeitura(capitulos),
      visualizacoes:
        metricaObra?.visualizacoes ??
        normalizarContadorObraPublica(obra.visualizacoes),
      totalCurtidas:
        metricaObra?.interacoesDiretas.curtidas ??
        normalizarContadorObraPublica(obra.totalCurtidas),
      totalComentarios:
        metricaObra?.interacoesDiretas.comentarios ??
        normalizarContadorObraPublica(obra.totalComentarios),
      totalFavoritos:
        metricaObra?.interacoesDiretas.favoritos ??
        normalizarContadorObraPublica(obra.totalFavoritos),
      totalConcluidas:
        metricaObra?.interacoesDiretas.concluidas ??
        normalizarContadorObraPublica(obra.totalConcluidas),
    };
  });
}
