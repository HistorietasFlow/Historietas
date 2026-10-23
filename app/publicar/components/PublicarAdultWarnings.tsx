import {
  AVISOS_CONTEUDO_18,
  traduzirAvisoConteudo18,
  traduzirTextoConteudo18,
  type AvisoConteudo18,
} from "../../../lib/historietasAdultContent";
import type { HistorietasLanguage } from "../../../lib/i18n";
import {
  adultWarningCheckboxStyle,
  adultWarningOptionSelectedStyle,
  adultWarningOptionStyle,
  adultWarningsBoxStyle,
  adultWarningsCounterStyle,
  adultWarningsDescriptionStyle,
  adultWarningsGridStyle,
  adultWarningsHeaderStyle,
  adultWarningsTitleStyle,
} from "../lib/publicar-form-upload-styles";

type PublicarAdultWarningsProps = {
  avisosConteudo18: AvisoConteudo18[];
  idioma: HistorietasLanguage;
  onAlternarAviso: (aviso: AvisoConteudo18) => void;
};

export function PublicarAdultWarnings({
  avisosConteudo18,
  idioma,
  onAlternarAviso,
}: PublicarAdultWarningsProps) {
  return (
    <section style={adultWarningsBoxStyle} aria-label="Avisos de conteúdo 18+">
      <div style={adultWarningsHeaderStyle}>
        <strong style={adultWarningsTitleStyle}>{traduzirTextoConteudo18("avisosObrigatorios", idioma)}</strong>
        <span style={adultWarningsCounterStyle}>
          {avisosConteudo18.length} {traduzirTextoConteudo18(avisosConteudo18.length === 1 ? "selecionado" : "selecionados", idioma)}
        </span>
      </div>

      <p style={adultWarningsDescriptionStyle}>
        {traduzirTextoConteudo18("descricaoPublicacao", idioma)}
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
                onChange={() => onAlternarAviso(aviso)}
                style={adultWarningCheckboxStyle}
              />
              <span>{traduzirAvisoConteudo18(aviso, idioma)}</span>
            </label>
          );
        })}
      </div>
    </section>
  );
}
