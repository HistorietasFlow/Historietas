import { useHistorietasLanguage } from "../../../components/HistorietasLanguageProvider";
import type { OrientacoesObraPainel } from "../lib/painel-autor-types";

const ROTULOS = {
  "pt-BR": {
    titulo: "Orientações",
    totais: "Totais acumulados da obra",
    visualizacoes: "Visualizações",
    descricaoVisualizacoes: "Aberturas registradas da obra.",
    seguidores: "Seguidores",
    descricaoSeguidores: "Contas que seguem a obra.",
    avaliacoes: "Avaliações",
    descricaoAvaliacoes: "Quantidade de notas registradas.",
    metricasIndisponiveis: "Métricas indisponíveis nesta atualização.",
    visualizacoesCapitulo: "Visualizações por capítulo",
    orientacaoCapitulos: "Compare capítulos com tempos de publicação parecidos.",
    capituloSemTitulo: "Capítulo sem título",
    indisponivel: "Indisponível",
    continuidade: "Continuidade da leitura",
    crescimento: "Crescimento por período",
    dadosInsuficientes: "Dados insuficientes para esta análise",
  },
  en: {
    titulo: "Insights",
    totais: "Lifetime totals for this work",
    visualizacoes: "Views",
    descricaoVisualizacoes: "Recorded opens of this work.",
    seguidores: "Followers",
    descricaoSeguidores: "Accounts following the work.",
    avaliacoes: "Ratings",
    descricaoAvaliacoes: "Number of recorded ratings.",
    metricasIndisponiveis: "Metrics are unavailable for this update.",
    visualizacoesCapitulo: "Views by chapter",
    orientacaoCapitulos: "Compare chapters that have been published for similar lengths of time.",
    capituloSemTitulo: "Untitled chapter",
    indisponivel: "Unavailable",
    continuidade: "Reading continuity",
    crescimento: "Growth over time",
    dadosInsuficientes: "Insufficient data for this analysis",
  },
  es: {
    titulo: "Orientaciones",
    totais: "Totales acumulados de la obra",
    visualizacoes: "Visualizaciones",
    descricaoVisualizacoes: "Aperturas registradas de la obra.",
    seguidores: "Seguidores",
    descricaoSeguidores: "Cuentas que siguen la obra.",
    avaliacoes: "Valoraciones",
    descricaoAvaliacoes: "Cantidad de puntuaciones registradas.",
    metricasIndisponiveis: "Las métricas no están disponibles en esta actualización.",
    visualizacoesCapitulo: "Visualizaciones por capítulo",
    orientacaoCapitulos: "Compara capítulos que llevan publicados tiempos similares.",
    capituloSemTitulo: "Capítulo sin título",
    indisponivel: "No disponible",
    continuidade: "Continuidad de la lectura",
    crescimento: "Crecimiento por período",
    dadosInsuficientes: "Datos insuficientes para este análisis",
  },
} as const;

export function PainelAutorOrientacoes({ dados }: { dados?: OrientacoesObraPainel }) {
  const { language } = useHistorietasLanguage();
  const rotulos = ROTULOS[language];

  return (
    <details className="painel-autor-orientacoes" translate="no">
      <summary>{rotulos.titulo}</summary>

      <div className="painel-autor-orientacoes-conteudo">
        <h3>{rotulos.totais}</h3>
        {dados ? (
          <dl className="painel-autor-orientacoes-totais">
            <div>
              <dt>{rotulos.visualizacoes}</dt>
              <dd>{dados.visualizacoes}</dd>
              <dd>{rotulos.descricaoVisualizacoes}</dd>
            </div>
            <div>
              <dt>{rotulos.seguidores}</dt>
              <dd>{dados.seguidores}</dd>
              <dd>{rotulos.descricaoSeguidores}</dd>
            </div>
            <div>
              <dt>{rotulos.avaliacoes}</dt>
              <dd>{dados.avaliacoes}</dd>
              <dd>{rotulos.descricaoAvaliacoes}</dd>
            </div>
          </dl>
        ) : (
          <p>{rotulos.metricasIndisponiveis}</p>
        )}

        {dados && dados.capitulos.length > 0 && (
          <div>
            <h3>{rotulos.visualizacoesCapitulo}</h3>
            <p>{rotulos.orientacaoCapitulos}</p>
            <dl className="painel-autor-orientacoes-capitulos">
              {dados.capitulos.map((capitulo) => (
                <div key={capitulo.id}>
                  <dt>{capitulo.titulo || rotulos.capituloSemTitulo}</dt>
                  <dd>{capitulo.visualizacoes ?? rotulos.indisponivel}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        <dl className="painel-autor-orientacoes-analises">
          <div>
            <dt>{rotulos.continuidade}</dt>
            <dd>{rotulos.dadosInsuficientes}</dd>
          </div>
          <div>
            <dt>{rotulos.crescimento}</dt>
            <dd>{rotulos.dadosInsuficientes}</dd>
          </div>
        </dl>
      </div>
    </details>
  );
}
