import type { CSSProperties } from "react";
import {
  fieldGroupStyle,
  labelStyle,
  safeTextStyle,
} from "../styles/editar-obra-shared-styles";

type EditarObraSynopsisFieldProps = {
  isDesktop: boolean;
  sinopse: string;
  onSinopseChange: (sinopse: string) => void;
};

export function EditarObraSynopsisField({
  isDesktop,
  sinopse,
  onSinopseChange,
}: EditarObraSynopsisFieldProps) {
  return (
    <div style={fieldGroupStyle}>
      <label htmlFor="editar-obra-sinopse" style={labelStyle}>Sinopse</label>

      <textarea
        id="editar-obra-sinopse"
        value={sinopse}
        onChange={(event) => onSinopseChange(event.target.value)}
        placeholder="Escreva a sinopse da obra"
        style={isDesktop ? desktopTextareaStyle : textareaStyle}
      />
    </div>
  );
}

const textareaStyle: CSSProperties = {
  width: "100%",
  minHeight: "90px",
  borderRadius: "20px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "var(--historietas-editar-obra-bg-deep, #000000)",
  color: "#FFFFFF",
  padding: "14px",
  outline: "none",
  fontSize: "13px",
  fontWeight: 700,
  lineHeight: 1.58,
  resize: "vertical",
  fontFamily: "inherit",
  boxSizing: "border-box",
  minWidth: 0,
  maxWidth: "100%",
  boxShadow: "none",
  ...safeTextStyle,
};

const desktopTextareaStyle: CSSProperties = {
  ...textareaStyle,
  minHeight: "132px",
};
