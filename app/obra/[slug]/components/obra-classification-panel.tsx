"use client";

import type {
  KeyboardEventHandler,
  RefObject,
} from "react";
import { createPortal } from "react-dom";
import {
  ehClassificacao18,
  traduzirAvisoConteudo18,
  type AvisoConteudo18,
} from "../../../../lib/historietasAdultContent";
import type { HistorietasLanguage } from "../../../../lib/i18n";
import {
  classificationNoWarningsStyle,
  classificationPanelBackdropStyle,
  classificationPanelBadgeAdultStyle,
  classificationPanelBadgeStyle,
  classificationPanelCloseStyle,
  classificationPanelContentStyle,
  classificationPanelDescriptionStyle,
  classificationPanelHeaderStyle,
  classificationPanelIntroStyle,
  classificationPanelOverlayStyle,
  classificationPanelStyle,
  classificationPanelTitleStyle,
  classificationWarningDotStyle,
  classificationWarningItemStyle,
  classificationWarningsGridStyle,
  classificationWarningsStyle,
  classificationWarningsTitleStyle,
} from "../lib/obra-style-utils";

type ObraClassificationPanelProps = {
  classificacaoIndicativa: string;
  avisosConteudo: AvisoConteudo18[];
  language: HistorietasLanguage;
  textos: {
    titulo: string;
    descricao: string;
    avisos: string;
    semAvisos: string;
    fechar: string;
  };
  dialogRef: RefObject<HTMLElement | null>;
  onFechar: () => void;
  onKeyDown: KeyboardEventHandler<HTMLElement>;
};

export default function ObraClassificationPanel({
  classificacaoIndicativa,
  avisosConteudo,
  language,
  textos,
  dialogRef,
  onFechar,
  onKeyDown,
}: ObraClassificationPanelProps) {
  return createPortal(
    <section
      data-historietas-obra-classificacao-root="true"
      style={classificationPanelOverlayStyle}
      aria-label={textos.titulo}
    >
      <button
        type="button"
        aria-label={textos.fechar}
        onClick={onFechar}
        style={classificationPanelBackdropStyle}
      />

      <article
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="historietas-classificacao-title"
        tabIndex={-1}
        onKeyDown={onKeyDown}
        style={classificationPanelStyle}
      >
        <header style={classificationPanelHeaderStyle}>
          <span
            data-historietas-i18n-ignore="true"
            style={{
              ...classificationPanelBadgeStyle,
              ...(ehClassificacao18(classificacaoIndicativa)
                ? classificationPanelBadgeAdultStyle
                : {}),
            }}
          >
            {classificacaoIndicativa}
          </span>

          <button
            type="button"
            data-dialog-initial-focus="true"
            onClick={onFechar}
            aria-label={textos.fechar}
            style={classificationPanelCloseStyle}
          >
            ×
          </button>
        </header>

        <div style={classificationPanelContentStyle}>
          <div style={classificationPanelIntroStyle}>
            <strong
              id="historietas-classificacao-title"
              style={classificationPanelTitleStyle}
            >
              {textos.titulo}
            </strong>

            <p style={classificationPanelDescriptionStyle}>
              {textos.descricao}{" "}
              <strong data-historietas-i18n-ignore="true">
                {classificacaoIndicativa}
              </strong>
              .
            </p>
          </div>

          {ehClassificacao18(classificacaoIndicativa) ? (
            <section style={classificationWarningsStyle}>
              <span style={classificationWarningsTitleStyle}>
                {textos.avisos}
              </span>

              {avisosConteudo.length > 0 ? (
                <div style={classificationWarningsGridStyle}>
                  {avisosConteudo.map((aviso) => (
                    <div key={aviso} style={classificationWarningItemStyle}>
                      <span
                        style={classificationWarningDotStyle}
                        aria-hidden="true"
                      />
                      <span>{traduzirAvisoConteudo18(aviso, language)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={classificationNoWarningsStyle}>
                  {textos.semAvisos}
                </p>
              )}
            </section>
          ) : null}
        </div>
      </article>
    </section>,
    document.body,
  );
}
