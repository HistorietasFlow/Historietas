import {
  safeTextStyle,
} from "../lib/publicar-layout-styles";
import {
  desktopFullWidthErrorBoxStyle,
  errorBoxStyle,
} from "../lib/publicar-form-upload-styles";

type PublicarFormErrorProps = {
  isDesktop: boolean;
  mensagem: string;
  titulo: string;
};

export function PublicarFormError({
  isDesktop,
  mensagem,
  titulo,
}: PublicarFormErrorProps) {
  return (
    <div style={isDesktop ? desktopFullWidthErrorBoxStyle : errorBoxStyle}>
      <strong style={safeTextStyle}>{titulo}</strong>
      <span style={safeTextStyle}>{mensagem}</span>
    </div>
  );
}
