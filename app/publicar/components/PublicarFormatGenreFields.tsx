import {
  LIMITE_CARACTERES_FORMATO_GENERO_PERSONALIZADO,
  OPCOES_FORMATO_OBRA,
  OPCOES_GENERO_OBRA,
  OUTRO_FORMATO_VALUE,
  OUTRO_GENERO_VALUE,
} from "../lib/publicar-static-options";
import {
  traduzirFormatoPublicar,
  traduzirGeneroPublicar,
} from "../lib/publicar-option-translations";
import {
  desktopFullWidthDoubleFieldStyle,
  doubleFieldStyle,
  fieldGroupStyle,
  inputStyle,
  labelStyle,
} from "../lib/publicar-form-upload-styles";
import type { HistorietasLanguage } from "../../../lib/i18n";

type PublicarFormatGenreFieldsProps = {
  formato: string;
  formatoEhPersonalizado: boolean;
  formatoPersonalizado: string;
  genero: string;
  generoEhPersonalizado: boolean;
  generoPersonalizado: string;
  idioma: HistorietasLanguage;
  isDesktop: boolean;
  onFormatoChange: (valor: string) => void;
  onFormatoPersonalizadoChange: (valor: string) => void;
  onGeneroChange: (valor: string) => void;
  onGeneroPersonalizadoChange: (valor: string) => void;
  t: (chave: "formato" | "escolherFormato" | "outroFormato" | "digiteFormato" | "generoPrincipal" | "escolherGenero" | "outroGenero" | "digiteGenero") => string;
};

export function PublicarFormatGenreFields({
  formato,
  formatoEhPersonalizado,
  formatoPersonalizado,
  genero,
  generoEhPersonalizado,
  generoPersonalizado,
  idioma,
  isDesktop,
  onFormatoChange,
  onFormatoPersonalizadoChange,
  onGeneroChange,
  onGeneroPersonalizadoChange,
  t,
}: PublicarFormatGenreFieldsProps) {
  return (
    <div style={isDesktop ? desktopFullWidthDoubleFieldStyle : doubleFieldStyle}>
      <div style={fieldGroupStyle}>
        <label htmlFor="publicar-formato" style={labelStyle}>{t("formato")}</label>

        <select
          id="publicar-formato"
          value={formato}
          onChange={(event) => onFormatoChange(event.target.value)}
          style={inputStyle}
        >
          <option value="">{t("escolherFormato")}</option>
          {OPCOES_FORMATO_OBRA.map((opcao) => (
            <option key={opcao} value={opcao}>
              {traduzirFormatoPublicar(idioma, opcao)}
            </option>
          ))}
          <option value={OUTRO_FORMATO_VALUE}>{t("outroFormato")}</option>
        </select>

        {formatoEhPersonalizado && (
          <input
            aria-label={t("outroFormato")}
            value={formatoPersonalizado}
            onChange={(event) => onFormatoPersonalizadoChange(event.target.value)}
            style={inputStyle}
            placeholder={t("digiteFormato")}
            maxLength={LIMITE_CARACTERES_FORMATO_GENERO_PERSONALIZADO}
            type="text"
          />
        )}
      </div>

      <div style={fieldGroupStyle}>
        <label htmlFor="publicar-genero" style={labelStyle}>{t("generoPrincipal")}</label>

        <select
          id="publicar-genero"
          value={genero}
          onChange={(event) => onGeneroChange(event.target.value)}
          style={inputStyle}
        >
          <option value="">{t("escolherGenero")}</option>
          {OPCOES_GENERO_OBRA.map((opcao) => (
            <option key={opcao} value={opcao}>
              {traduzirGeneroPublicar(idioma, opcao)}
            </option>
          ))}
          <option value={OUTRO_GENERO_VALUE}>{t("outroGenero")}</option>
        </select>

        {generoEhPersonalizado && (
          <input
            aria-label={t("outroGenero")}
            value={generoPersonalizado}
            onChange={(event) => onGeneroPersonalizadoChange(event.target.value)}
            style={inputStyle}
            placeholder={t("digiteGenero")}
            maxLength={LIMITE_CARACTERES_FORMATO_GENERO_PERSONALIZADO}
            type="text"
          />
        )}
      </div>
    </div>
  );
}
