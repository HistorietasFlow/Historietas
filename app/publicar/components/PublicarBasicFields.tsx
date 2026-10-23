import {
  desktopHalfFieldStyle,
  fieldGroupStyle,
  hintStyle,
  inputStyle,
  labelStyle,
} from "../lib/publicar-form-upload-styles";

type PublicarBasicFieldsProps = {
  autor: string;
  isDesktop: boolean;
  onAutorChange: (valor: string) => void;
  onTituloChange: (valor: string) => void;
  t: (chave: "tituloObra" | "nomeAutor" | "dicaTitulo" | "dicaAutor") => string;
  titulo: string;
};

export function PublicarBasicFields({
  autor,
  isDesktop,
  onAutorChange,
  onTituloChange,
  t,
  titulo,
}: PublicarBasicFieldsProps) {
  return (
    <>
      <div style={isDesktop ? desktopHalfFieldStyle : fieldGroupStyle}>
        <label htmlFor="publicar-titulo" style={labelStyle}>{t("tituloObra")}</label>

        <input
          id="publicar-titulo"
          value={titulo}
          onChange={(event) => onTituloChange(event.target.value)}
          style={inputStyle}
          placeholder="Ex: Shadow Eclipse"
          type="text"
        />

        <span style={hintStyle}>{t("dicaTitulo")}</span>
      </div>

      <div style={isDesktop ? desktopHalfFieldStyle : fieldGroupStyle}>
        <label htmlFor="publicar-autor" style={labelStyle}>{t("nomeAutor")}</label>

        <input
          id="publicar-autor"
          value={autor}
          onChange={(event) => onAutorChange(event.target.value)}
          style={inputStyle}
          placeholder="Ex: Historietas Studio"
          type="text"
        />

        <span style={hintStyle}>{t("dicaAutor")}</span>
      </div>
    </>
  );
}
