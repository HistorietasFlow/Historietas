import { PublicarAdultWarnings } from "./PublicarAdultWarnings";
import {
  LIMITE_CARACTERES_TAG_PERSONALIZADA,
  OPCOES_TAGS_OBRA,
  OUTRA_TAG_VALUE,
} from "../lib/publicar-static-options";
import { traduzirTagPublicar } from "../lib/publicar-option-translations";
import {
  desktopHalfFieldStyle,
  fieldGroupStyle,
  inputStyle,
  labelStyle,
} from "../lib/publicar-form-upload-styles";
import type { AvisoConteudo18 } from "../../../lib/historietasAdultContent";
import type { HistorietasLanguage } from "../../../lib/i18n";

type PublicarTagClassificationFieldsProps = {
  avisosConteudo18: AvisoConteudo18[];
  classificacao18Selecionada: boolean;
  classificacaoIndicativa: string;
  idioma: HistorietasLanguage;
  isDesktop: boolean;
  onAlternarAviso: (aviso: AvisoConteudo18) => void;
  onClassificacaoChange: (valor: string) => void;
  onTagChange: (valor: string) => void;
  onTagPersonalizadaChange: (valor: string) => void;
  t: (chave: "tag" | "escolherTag" | "outraTag" | "digiteTag" | "classificacaoIndicativa" | "escolherClassificacao" | "livre") => string;
  tagPersonalizada: string;
  tagsDaObra: string[];
  usarTagPersonalizada: boolean;
};

export function PublicarTagClassificationFields({
  avisosConteudo18,
  classificacao18Selecionada,
  classificacaoIndicativa,
  idioma,
  isDesktop,
  onAlternarAviso,
  onClassificacaoChange,
  onTagChange,
  onTagPersonalizadaChange,
  t,
  tagPersonalizada,
  tagsDaObra,
  usarTagPersonalizada,
}: PublicarTagClassificationFieldsProps) {
  return (
    <>
      <div style={isDesktop ? desktopHalfFieldStyle : fieldGroupStyle}>
        <label htmlFor="publicar-tag" style={labelStyle}>{t("tag")}</label>

        <select
          id="publicar-tag"
          value={usarTagPersonalizada ? OUTRA_TAG_VALUE : tagsDaObra[0] || ""}
          onChange={(event) => onTagChange(event.target.value)}
          style={inputStyle}
        >
          <option value="">{t("escolherTag")}</option>

          {OPCOES_TAGS_OBRA.map((tag) => (
            <option key={tag} value={tag}>
              {traduzirTagPublicar(idioma, tag)}
            </option>
          ))}

          <option value={OUTRA_TAG_VALUE}>{t("outraTag")}</option>
        </select>

        {usarTagPersonalizada && (
          <input
            aria-label={t("outraTag")}
            value={tagPersonalizada}
            onChange={(event) => onTagPersonalizadaChange(event.target.value)}
            style={inputStyle}
            placeholder={t("digiteTag")}
            maxLength={LIMITE_CARACTERES_TAG_PERSONALIZADA}
            type="text"
          />
        )}
      </div>

      <div style={isDesktop ? desktopHalfFieldStyle : fieldGroupStyle}>
        <label htmlFor="publicar-classificacao" style={labelStyle}>{t("classificacaoIndicativa")}</label>

        <select
          id="publicar-classificacao"
          value={classificacaoIndicativa}
          onChange={(event) => onClassificacaoChange(event.target.value)}
          style={inputStyle}
        >
          <option value="">{t("escolherClassificacao")}</option>
          <option value="Livre">{t("livre")}</option>
          <option>10+</option>
          <option>12+</option>
          <option>14+</option>
          <option>16+</option>
          <option>18+</option>
        </select>

        {classificacao18Selecionada ? (
          <PublicarAdultWarnings
            avisosConteudo18={avisosConteudo18}
            idioma={idioma}
            onAlternarAviso={onAlternarAviso}
          />
        ) : null}
      </div>
    </>
  );
}
