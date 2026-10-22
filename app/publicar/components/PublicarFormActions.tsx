import Link from "next/link";
import {
  buttonAreaStyle,
  desktopButtonAreaStyle,
  disabledButtonStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
} from "../lib/publicar-form-upload-styles";
import { PublicarProgress } from "./PublicarProgress";

type PublicarFormActionsProps = {
  cancelar: string;
  criarObra: string;
  isDesktop: boolean;
  processando: boolean;
  progresso: number;
  progressoRotulo: string;
  salvando: string;
};

export function PublicarFormActions({
  cancelar,
  criarObra,
  isDesktop,
  processando,
  progresso,
  progressoRotulo,
  salvando,
}: PublicarFormActionsProps) {
  return (
    <>
      <div style={isDesktop ? desktopButtonAreaStyle : buttonAreaStyle}>
        <Link href="/" style={secondaryButtonStyle}>
          {cancelar}
        </Link>

        <button
          type="submit"
          style={processando ? disabledButtonStyle : primaryButtonStyle}
          disabled={processando}
        >
          {processando ? salvando : criarObra}
        </button>
      </div>

      <PublicarProgress
        isDesktop={isDesktop}
        progresso={progresso}
        rotulo={progressoRotulo}
      />
    </>
  );
}
