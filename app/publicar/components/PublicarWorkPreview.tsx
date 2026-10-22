import {
  traduzirFormatoPublicar,
  traduzirGeneroPublicar,
} from "../lib/publicar-option-translations";
import {
  criarPreviewCoverStyle,
  desktopEmptyPreviewBoxStyle,
  desktopPreviewCardStyle,
  desktopPreviewPanelStyle,
  emptyPreviewBoxStyle,
  emptyPreviewContentStyle,
  emptyPreviewCoverStyle,
  emptyPreviewIconStyle,
  emptyPreviewTextStyle,
  emptyPreviewTitleStyle,
  previewActionBadgeStyle,
  previewActionRowStyle,
  previewAuthorStyle,
  previewBadgeStyle,
  previewBadgesStyle,
  previewCardStyle,
  previewContentStyle,
  previewCoverGlowStyle,
  previewGenreBadgeStyle,
  previewHeaderStyle,
  previewImportedChapterStyle,
  previewImportedMiniStyle,
  previewImportedTextStyle,
  previewImportedTitleStyle,
  previewMiniTitleStyle,
  previewObraTitleStyle,
  previewPanelStyle,
  previewProgressCompactStyle,
  previewProgressFillStyle,
  previewProgressTextStyle,
  previewProgressTrackStyle,
  previewRatingBadgeStyle,
  previewStatHeartIconStyle,
  previewStatIconStyle,
  previewStatItemStyle,
  previewStatValueStyle,
  previewStatsStyle,
  previewTopRowStyle,
} from "../lib/publicar-preview-styles";
import type { HistorietasLanguage } from "../../../lib/i18n";

type PublicarWorkPreviewProps = {
  arquivoCapituloMinutos: number;
  arquivoCapituloPalavras: number;
  arquivoCapituloTitulo: string;
  autor: string;
  capa: string;
  classificacaoTexto: string;
  formatoFinal: string;
  generoFinal: string;
  idioma: HistorietasLanguage;
  isDesktop: boolean;
  previewTemConteudo: boolean;
  t: (chave: string) => string;
  temCapituloImportado: boolean;
  titulo: string;
};

export function PublicarWorkPreview({
  arquivoCapituloMinutos,
  arquivoCapituloPalavras,
  arquivoCapituloTitulo,
  autor,
  capa,
  classificacaoTexto,
  formatoFinal,
  generoFinal,
  idioma,
  isDesktop,
  previewTemConteudo,
  t,
  temCapituloImportado,
  titulo,
}: PublicarWorkPreviewProps) {
  return (
    <aside style={isDesktop ? desktopPreviewPanelStyle : previewPanelStyle}>
      <div style={previewHeaderStyle}>
        <span style={previewMiniTitleStyle}>{t("previaObra")}</span>
      </div>

      {previewTemConteudo ? (
        <article style={isDesktop ? desktopPreviewCardStyle : previewCardStyle}>
          <div style={criarPreviewCoverStyle(capa)}>
            <div style={previewCoverGlowStyle} />
          </div>

          <div style={previewContentStyle}>
            <div style={previewTopRowStyle}>
              <h3 style={previewObraTitleStyle}>
                {titulo.trim() || t("obraSemTitulo")}
              </h3>

              <div style={previewBadgesStyle}>
                <span style={previewBadgeStyle}>
                  {formatoFinal
                    ? traduzirFormatoPublicar(idioma, formatoFinal)
                    : t("formato")}
                </span>

                <span style={previewRatingBadgeStyle}>{classificacaoTexto}</span>
              </div>
            </div>

            <p style={previewAuthorStyle}>
              {t("por")} {autor.trim() || t("autorNaoInformado")}
            </p>

            <div style={previewStatsStyle}>
              <span style={previewStatItemStyle}>
                <span style={previewStatIconStyle}>👁</span>
                <span style={previewStatValueStyle}>0</span>
              </span>

              <span style={previewStatItemStyle}>
                <span style={previewStatHeartIconStyle}>♥</span>
                <span style={previewStatValueStyle}>0</span>
              </span>

              <span style={previewStatItemStyle}>
                <span style={previewStatIconStyle}>💬</span>
                <span style={previewStatValueStyle}>0</span>
              </span>

              <span style={previewStatItemStyle}>
                <span style={previewStatIconStyle}>📚</span>
                <span style={previewStatValueStyle}>
                  {temCapituloImportado
                    ? `1 ${t("capituloAbreviado")}`
                    : `0 ${t("capituloAbreviado")}`}
                </span>
              </span>
            </div>

            <div style={previewProgressCompactStyle}>
              <div style={previewProgressTrackStyle}>
                <div
                  style={{
                    ...previewProgressFillStyle,
                    width: temCapituloImportado ? "100%" : "0%",
                  }}
                />
              </div>

              <span style={previewProgressTextStyle}>
                {temCapituloImportado
                  ? t("capituloPronto")
                  : t("semCapitulo")}
              </span>
            </div>

            {temCapituloImportado && (
              <div style={previewImportedChapterStyle}>
                <span style={previewImportedMiniStyle}>
                  {t("primeiroCapituloMaiusculo")}
                </span>

                <strong style={previewImportedTitleStyle}>
                  {arquivoCapituloTitulo || `${t("primeiroCapitulo")} 1`}
                </strong>

                <span style={previewImportedTextStyle}>
                  {arquivoCapituloPalavras} {t("palavras")} • {arquivoCapituloMinutos} {t("minLeitura")}
                </span>
              </div>
            )}

            <div style={previewActionRowStyle}>
              <span style={previewGenreBadgeStyle}>
                {generoFinal
                  ? traduzirGeneroPublicar(idioma, generoFinal)
                  : t("genero")}
              </span>

              <span style={previewActionBadgeStyle}>{t("previa")}</span>
            </div>
          </div>
        </article>
      ) : (
        <div style={isDesktop ? desktopEmptyPreviewBoxStyle : emptyPreviewBoxStyle}>
          <div style={emptyPreviewCoverStyle}>
            <span style={emptyPreviewIconStyle}>+</span>
          </div>

          <div style={emptyPreviewContentStyle}>
            <strong style={emptyPreviewTitleStyle}>{t("previaAqui")}</strong>

            <span style={emptyPreviewTextStyle}>{t("dicaPrevia")}</span>
          </div>
        </div>
      )}
    </aside>
  );
}
