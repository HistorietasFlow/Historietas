import type { OrientacoesObraPainel } from "../lib/painel-autor-types";

const DADOS_INSUFICIENTES = "Dados insuficientes para esta análise";
const METRICAS_INDISPONIVEIS = "Métricas indisponíveis nesta atualização.";

export function PainelAutorOrientacoes({ dados }: { dados?: OrientacoesObraPainel }) {
  return (
    <details className="painel-autor-orientacoes">
      <summary>Orientações</summary>

      <div className="painel-autor-orientacoes-conteudo">
        <h3>Totais acumulados da obra</h3>
        {dados ? (
          <dl className="painel-autor-orientacoes-totais">
            <div>
              <dt>Visualizações</dt>
              <dd>{dados.visualizacoes}</dd>
              <dd>Aberturas registradas da obra.</dd>
            </div>
            <div>
              <dt>Seguidores</dt>
              <dd>{dados.seguidores}</dd>
              <dd>Contas que seguem a obra.</dd>
            </div>
            <div>
              <dt>Avaliações</dt>
              <dd>{dados.avaliacoes}</dd>
              <dd>Quantidade de notas registradas.</dd>
            </div>
          </dl>
        ) : (
          <p>{METRICAS_INDISPONIVEIS}</p>
        )}

        {dados && dados.capitulos.length > 0 && (
          <div>
            <h3>Visualizações por capítulo</h3>
            <p>Compare capítulos com tempos de publicação parecidos.</p>
            <dl className="painel-autor-orientacoes-capitulos">
              {dados.capitulos.map((capitulo) => (
                <div key={capitulo.id}>
                  <dt>{capitulo.titulo}</dt>
                  <dd>{capitulo.visualizacoes ?? "Indisponível"}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        <dl className="painel-autor-orientacoes-analises">
          <div>
            <dt>Continuidade da leitura</dt>
            <dd>{DADOS_INSUFICIENTES}</dd>
          </div>
          <div>
            <dt>Crescimento por período</dt>
            <dd>{DADOS_INSUFICIENTES}</dd>
          </div>
        </dl>
      </div>
    </details>
  );
}
