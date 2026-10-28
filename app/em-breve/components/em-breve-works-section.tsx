import Link from "next/link";
import { type ObraEmBreveCard } from "../lib/em-breve-work-normalizers";
import { listaTemObraEmBreve } from "../lib/em-breve-work-list-utils";
import { criarLinkCardEmBreve } from "../lib/em-breve-work-link-utils";
import { obterIconeTematicaEmBreve } from "../lib/em-breve-presentation-utils";
import {
  accessMessageStyle,
  relatedSectionStyle,
  relatedGridStyle,
  relatedCardStyle,
  relatedCoverLinkStyle,
  relatedContentStyle,
  relatedTitleLinkStyle,
  relatedTopLineStyle,
  relatedTitleStyle,
  relatedAuthorStyle,
  relatedReleasePanelStyle,
  relatedReleaseLabelStyle,
  relatedReleaseTextStyle,
  relatedBottomRowStyle,
  relatedMetaBadgesStyle,
  relatedThemeBadgeStyle,
  relatedThemeIconStyle,
  relatedThemeTextStyle,
  relatedFormatBadgeStyle,
  relatedSaveButtonStyle,
  relatedSavedButtonStyle,
  desktopRelatedSectionStyle,
  desktopRelatedGridStyle,
  desktopRelatedCardStyle,
  desktopRelatedContentStyle,
  desktopRelatedTopLineStyle,
  desktopRelatedReleasePanelStyle,
  desktopRelatedBottomRowStyle,
  criarCoverCardEmBreveStyle,
} from "../lib/em-breve-styles";

export function EmBreveWorksSection({
  obras,
  obrasSalvasNormalizadas,
  desktopLayout,
  avisoAcesso,
  obraProcessandoId,
  salvarLancamento,
}: {
  obras: ObraEmBreveCard[];
  obrasSalvasNormalizadas: string[];
  desktopLayout: boolean;
  avisoAcesso: string;
  obraProcessandoId: string;
  salvarLancamento: (obra: ObraEmBreveCard) => void | Promise<void>;
}) {
  return (
    <section
      style={
        desktopLayout ? desktopRelatedSectionStyle : relatedSectionStyle
      }
    >
      {avisoAcesso && <p style={accessMessageStyle}>{avisoAcesso}</p>}

      <div style={desktopLayout ? desktopRelatedGridStyle : relatedGridStyle}>
        {obras.map((obra) => {
          const obraSalva = listaTemObraEmBreve(obra, obrasSalvasNormalizadas);

          return (
            <article
              key={`${obra.origem}-${obra.id}`}
              style={desktopLayout ? desktopRelatedCardStyle : relatedCardStyle}
            >
              <Link
                href={criarLinkCardEmBreve(obra)}
                style={relatedCoverLinkStyle}
                aria-label={`Abrir aviso de ${obra.titulo}`}
              >
                <div
                  style={criarCoverCardEmBreveStyle(obra, desktopLayout)}
                />
              </Link>

              <div
                style={
                  desktopLayout ? desktopRelatedContentStyle : relatedContentStyle
                }
              >
                <div
                  style={
                    desktopLayout
                      ? desktopRelatedTopLineStyle
                      : relatedTopLineStyle
                  }
                >
                  <Link
                    href={criarLinkCardEmBreve(obra)}
                    style={relatedTitleLinkStyle}
                  >
                    <strong
                      data-historietas-i18n-ignore="true"
                      style={relatedTitleStyle}
                    >
                      {obra.titulo}
                    </strong>
                  </Link>
                </div>

                <span style={relatedAuthorStyle}>
                  Por{" "}
                  <span data-historietas-i18n-ignore="true">{obra.autor}</span>
                </span>

                <div
                  style={
                    desktopLayout
                      ? desktopRelatedReleasePanelStyle
                      : relatedReleasePanelStyle
                  }
                >
                  <span style={relatedReleaseLabelStyle}>
                    {obraSalva ? "AVISO ATIVADO" : "LANÇAMENTO REAL SEM CONTEÚDO"}
                  </span>

                  <span style={relatedReleaseTextStyle}>
                    {obraSalva
                      ? "Você será avisado quando a leitura for liberada."
                      : "Esta obra existe, mas ainda não tem capítulo ou arquivo publicado."}
                  </span>
                </div>

                <div
                  style={
                    desktopLayout
                      ? desktopRelatedBottomRowStyle
                      : relatedBottomRowStyle
                  }
                >
                  <div style={relatedMetaBadgesStyle}>
                    <div style={relatedThemeBadgeStyle}>
                      <span style={relatedThemeIconStyle}>
                        {obterIconeTematicaEmBreve(obra.genero)}
                      </span>
                      <span style={relatedThemeTextStyle}>
                        {obra.genero}
                      </span>
                    </div>

                    <div style={relatedFormatBadgeStyle}>
                      <span style={relatedThemeTextStyle}>
                        {obra.formato}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => salvarLancamento(obra)}
                    disabled={Boolean(obraProcessandoId)}
                    style={{
                      ...(obraSalva
                        ? relatedSavedButtonStyle
                        : relatedSaveButtonStyle),
                      opacity:
                        obraProcessandoId && obraProcessandoId !== obra.id
                          ? 0.55
                          : 1,
                      cursor: obraProcessandoId ? "wait" : "pointer",
                    }}
                    aria-pressed={obraSalva}
                    aria-busy={obraProcessandoId === obra.id}
                  >
                    {obraProcessandoId === obra.id
                      ? "Salvando..."
                      : obraSalva
                        ? "✓ Aviso ativo"
                        : "Avisar"}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
