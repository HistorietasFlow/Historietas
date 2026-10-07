import { obraActionToastStyle } from "../lib/obra-style-utils";

type ObraActionToastProps = {
  mensagem: string;
};

export default function ObraActionToast({
  mensagem,
}: ObraActionToastProps) {
  if (!mensagem) {
    return null;
  }

  return (
    <div
      style={obraActionToastStyle}
      role="status"
      aria-live="polite"
    >
      {mensagem}
    </div>
  );
}
