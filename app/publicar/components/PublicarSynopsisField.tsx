import {
  desktopFullWidthFieldStyle,
  fieldGroupStyle,
  labelRowStyle,
  labelStyle,
  miniCounterOkStyle,
  miniCounterWarningStyle,
  textareaStyle,
} from "../lib/publicar-form-upload-styles";

type PublicarSynopsisFieldProps = {
  caracteresValidos: number;
  isDesktop: boolean;
  onSinopseChange: (sinopse: string) => void;
  palavras: number;
  sinopse: string;
  sinopseValida: boolean;
  t: (chave: "sinopse" | "resumoChamativo" | "minimoSinopse" | "palavras") => string;
};

export function PublicarSynopsisField({
  caracteresValidos,
  isDesktop,
  onSinopseChange,
  palavras,
  sinopse,
  sinopseValida,
  t,
}: PublicarSynopsisFieldProps) {
  return (
    <div style={isDesktop ? desktopFullWidthFieldStyle : fieldGroupStyle}>
      <div style={labelRowStyle}>
        <label htmlFor="publicar-sinopse" style={labelStyle}>{t("sinopse")}</label>

        <span
          style={
            sinopseValida ? miniCounterOkStyle : miniCounterWarningStyle
          }
        >
          {caracteresValidos}/20
        </span>
      </div>

      <textarea
        id="publicar-sinopse"
        value={sinopse}
        onChange={(event) => onSinopseChange(event.target.value)}
        style={textareaStyle}
        placeholder={`${t("resumoChamativo")}\n${t("minimoSinopse")} ${palavras} ${t("palavras")}.`}
      />
    </div>
  );
}
