import type { CSSProperties } from "react";
import {
  AVISOS_CONTEUDO_18,
  ehClassificacao18,
  traduzirAvisoConteudo18,
  traduzirTextoConteudo18,
  type AvisoConteudo18,
} from "../../../lib/historietasAdultContent";
import type { HistorietasLanguage } from "../../../lib/i18n";
import {
  fieldGroupStyle,
  inputStyle,
  labelStyle,
} from "../styles/editar-obra-shared-styles";

type EditarObraContentRatingFieldProps = {
  classificacaoIndicativa: string;
  avisosConteudo18: AvisoConteudo18[];
  language: HistorietasLanguage;
  onClassificacaoChange: (novaClassificacao: string) => void;
  onToggleAvisoConteudo18: (aviso: AvisoConteudo18) => void;
};

export function EditarObraContentRatingField({
  classificacaoIndicativa,
  avisosConteudo18,
  language,
  onClassificacaoChange,
  onToggleAvisoConteudo18,
}: EditarObraContentRatingFieldProps) {
  return (
    <div style={fieldGroupStyle}>
      <label htmlFor="editar-obra-classificacao" style={labelStyle}>
        Classificação indicativa
      </label>

      <select
        id="editar-obra-classificacao"
        value={classificacaoIndicativa}
        onChange={(event) => onClassificacaoChange(event.target.value)}
        style={inputStyle}
      >
        <option value="">Escolha a classificação</option>
        <option>Livre</option>
        <option>10+</option>
        <option>12+</option>
        <option>14+</option>
        <option>16+</option>
        <option>18+</option>
      </select>

      {ehClassificacao18(classificacaoIndicativa) ? (
        <section style={adultWarningsBoxStyle} aria-label="Avisos de conteúdo 18+">
          <strong style={adultWarningsTitleStyle}>
            {traduzirTextoConteudo18("avisosObrigatorios", language)}
          </strong>
          <p style={adultWarningsDescriptionStyle}>
            {traduzirTextoConteudo18("descricaoPublicacao", language)}
          </p>

          <div style={adultWarningsGridStyle}>
            {AVISOS_CONTEUDO_18.map((aviso) => {
              const selecionado = avisosConteudo18.includes(aviso);

              return (
                <label
                  key={aviso}
                  style={{
                    ...adultWarningOptionStyle,
                    ...(selecionado ? adultWarningOptionSelectedStyle : {}),
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selecionado}
                    onChange={() => onToggleAvisoConteudo18(aviso)}
                    style={adultWarningCheckboxStyle}
                  />
                  <span>{traduzirAvisoConteudo18(aviso, language)}</span>
                </label>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}

const adultWarningsBoxStyle: CSSProperties = {
  display: "grid",
  gap: "10px",
  marginTop: "10px",
  padding: "14px",
  borderRadius: "16px",
  border: "1px solid rgba(255, 105, 130, 0.28)",
  background: "rgba(94, 20, 44, 0.12)",
};

const adultWarningsTitleStyle: CSSProperties = {
  color: "#FFD7DE",
  fontSize: "12px",
  fontWeight: 900,
};

const adultWarningsDescriptionStyle: CSSProperties = {
  margin: 0,
  color: "#C9BFD2",
  fontSize: "11px",
  lineHeight: 1.55,
};

const adultWarningsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
  gap: "8px",
};

const adultWarningOptionStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: "9px",
  padding: "10px 11px",
  borderRadius: "12px",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  background: "rgba(255, 255, 255, 0.025)",
  color: "#F2ECF8",
  fontSize: "11px",
  lineHeight: 1.4,
  cursor: "pointer",
};

const adultWarningOptionSelectedStyle: CSSProperties = {
  borderColor: "rgba(255, 113, 143, 0.5)",
  background: "rgba(126, 35, 67, 0.2)",
};

const adultWarningCheckboxStyle: CSSProperties = {
  width: "16px",
  height: "16px",
  marginTop: "1px",
  accentColor: "#FF6680",
  flex: "0 0 auto",
};
