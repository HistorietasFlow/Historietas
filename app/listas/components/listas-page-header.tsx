import type { CSSProperties } from "react";

type PerfilDiarioListas = {
  avatar: string;
  nome: string;
};

type AvaliacaoDiarioCabecalho = {
  media: number;
  minhaNota: number;
  podeAvaliar: boolean;
  salvando: boolean;
  total: number;
  visivel: boolean;
};

type ListasPageHeaderProps = {
  avaliacaoDiario: AvaliacaoDiarioCabecalho;
  criarAvatarStyle: (avatar: string) => CSSProperties;
  formatarNota: (nota: number) => string;
  headerInnerStyle: CSSProperties;
  headerStyle: CSSProperties;
  isDiaryProfile: boolean;
  listDiaryHeaderRatingBoxStyle: CSSProperties;
  listDiaryHeaderRatingStarActiveStyle: CSSProperties;
  listDiaryHeaderRatingStarBaseStyle: CSSProperties;
  listDiaryHeaderRatingStarButtonStyle: CSSProperties;
  listDiaryHeaderRatingStarFillStyle: CSSProperties;
  listDiaryHeaderRatingStarVisualStyle: CSSProperties;
  listDiaryHeaderRatingStarsRowStyle: CSSProperties;
  listDiaryProfileHeaderStyle: CSSProperties;
  listDiaryProfileHeaderTopStyle: CSSProperties;
  listDiaryProfileTitleAreaStyle: CSSProperties;
  listDiaryProfileTitleStyle: CSSProperties;
  listDiaryRatingNumberStyle: CSSProperties;
  listDiaryRatingSummaryStarBaseStyle: CSSProperties;
  listDiaryRatingSummaryStarFillStyle: CSSProperties;
  listDiaryRatingSummaryStarVisualStyle: CSSProperties;
  listDiaryRatingSummaryStarsStyle: CSSProperties;
  listDiaryRatingSummaryStyle: CSSProperties;
  listDiaryRatingTotalStyle: CSSProperties;
  notasAvaliacao: readonly number[];
  obterPreenchimentoEstrela: (estrela: number, nota: number) => string;
  obterProximaNota: (estrela: number, notaAtual: number) => number;
  onAvaliarDiario: (nota: number) => void;
  pageTitleStyle: CSSProperties;
  perfil: PerfilDiarioListas | null;
  perfilEhProprio: boolean;
  tituloPagina: string;
};

export function ListasPageHeader({
  avaliacaoDiario,
  criarAvatarStyle,
  formatarNota,
  headerInnerStyle,
  headerStyle,
  isDiaryProfile,
  listDiaryHeaderRatingBoxStyle,
  listDiaryHeaderRatingStarActiveStyle,
  listDiaryHeaderRatingStarBaseStyle,
  listDiaryHeaderRatingStarButtonStyle,
  listDiaryHeaderRatingStarFillStyle,
  listDiaryHeaderRatingStarVisualStyle,
  listDiaryHeaderRatingStarsRowStyle,
  listDiaryProfileHeaderStyle,
  listDiaryProfileHeaderTopStyle,
  listDiaryProfileTitleAreaStyle,
  listDiaryProfileTitleStyle,
  listDiaryRatingNumberStyle,
  listDiaryRatingSummaryStarBaseStyle,
  listDiaryRatingSummaryStarFillStyle,
  listDiaryRatingSummaryStarVisualStyle,
  listDiaryRatingSummaryStarsStyle,
  listDiaryRatingSummaryStyle,
  listDiaryRatingTotalStyle,
  notasAvaliacao,
  obterPreenchimentoEstrela,
  obterProximaNota,
  onAvaliarDiario,
  pageTitleStyle,
  perfil,
  perfilEhProprio,
  tituloPagina,
}: ListasPageHeaderProps) {
  return (
    <header style={headerStyle}>
      <div style={headerInnerStyle}>
        {isDiaryProfile && perfil ? (
          <div style={listDiaryProfileHeaderStyle}>
            <div style={listDiaryProfileHeaderTopStyle}>
              <span
                aria-hidden="true"
                style={criarAvatarStyle(perfil.avatar)}
              >
                {!perfil.avatar
                  ? perfil.nome.slice(0, 1).toLocaleUpperCase("pt-BR") || "U"
                  : ""}
              </span>

              <div style={listDiaryProfileTitleAreaStyle}>
                <h1
                  data-historietas-user-content="true"
                  style={listDiaryProfileTitleStyle}
                >
                  {tituloPagina}
                </h1>
              </div>

              {(perfilEhProprio || avaliacaoDiario.visivel) && (
                <div style={listDiaryRatingSummaryStyle}>
                  <strong style={listDiaryRatingNumberStyle}>
                    {formatarNota(avaliacaoDiario.media)}
                  </strong>
                  <span
                    style={listDiaryRatingSummaryStarsStyle}
                    aria-label={`Média ${formatarNota(
                      avaliacaoDiario.media,
                    )} de 5`}
                  >
                    {notasAvaliacao.map((estrela) => (
                      <span
                        key={`media-diario-${estrela}`}
                        style={listDiaryRatingSummaryStarVisualStyle}
                        aria-hidden="true"
                      >
                        <span style={listDiaryRatingSummaryStarBaseStyle}>
                          ★
                        </span>
                        <span
                          style={{
                            ...listDiaryRatingSummaryStarFillStyle,
                            width: obterPreenchimentoEstrela(
                              estrela,
                              avaliacaoDiario.media,
                            ),
                          }}
                        >
                          ★
                        </span>
                      </span>
                    ))}
                  </span>
                  <span style={listDiaryRatingTotalStyle}>
                    {avaliacaoDiario.total} Av. Diário
                  </span>
                </div>
              )}
            </div>

            {!perfilEhProprio &&
              avaliacaoDiario.visivel &&
              avaliacaoDiario.podeAvaliar && (
                <div
                  style={listDiaryHeaderRatingBoxStyle}
                  aria-label="Avaliar este Diário"
                >
                  <div style={listDiaryHeaderRatingStarsRowStyle}>
                    {notasAvaliacao.map((estrela) => {
                      const preenchimento = obterPreenchimentoEstrela(
                        estrela,
                        avaliacaoDiario.minhaNota,
                      );
                      const interativa = !avaliacaoDiario.salvando;
                      const proximaNota = obterProximaNota(
                        estrela,
                        avaliacaoDiario.minhaNota,
                      );

                      return (
                        <button
                          key={`avaliacao-diario-cabecalho-${estrela}`}
                          type="button"
                          onClick={() => {
                            if (!interativa) {
                              return;
                            }

                            onAvaliarDiario(proximaNota);
                          }}
                          disabled={!interativa}
                          style={{
                            ...(preenchimento === "0%"
                              ? listDiaryHeaderRatingStarButtonStyle
                              : listDiaryHeaderRatingStarActiveStyle),
                            cursor: interativa ? "pointer" : "default",
                            opacity: avaliacaoDiario.salvando ? 0.58 : 1,
                          }}
                          aria-label={`Avaliar Diário com ${proximaNota
                            .toString()
                            .replace(".", ",")} estrela${
                            proximaNota === 1 ? "" : "s"
                          }`}
                        >
                          <span
                            style={listDiaryHeaderRatingStarVisualStyle}
                            aria-hidden="true"
                          >
                            <span style={listDiaryHeaderRatingStarBaseStyle}>
                              ★
                            </span>
                            <span
                              style={{
                                ...listDiaryHeaderRatingStarFillStyle,
                                width: preenchimento,
                              }}
                            >
                              ★
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
          </div>
        ) : (
          <h1 data-historietas-user-content="true" style={pageTitleStyle}>
            {tituloPagina}
          </h1>
        )}
      </div>
    </header>
  );
}
