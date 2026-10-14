import DenunciaModal, {
  type TipoAlvoDenuncia,
} from "../../../components/DenunciaModal";

type AlvoDenuncia = {
  id: string;
  tipo: Extract<TipoAlvoDenuncia, "diario_anotacao" | "comentario_diario">;
  titulo: string;
};

type ListasDiaryReportModalProps = {
  alvo: AlvoDenuncia | null;
  onClose: () => void;
  onSent: () => void;
};

export function ListasDiaryReportModal({
  alvo,
  onClose,
  onSent,
}: ListasDiaryReportModalProps) {
  return (
    <DenunciaModal
      aberto={Boolean(alvo)}
      alvoTipo={alvo?.tipo || "diario_anotacao"}
      alvoId={alvo?.id || ""}
      alvoTitulo={alvo?.titulo || "Conteúdo do Diário"}
      onFechar={onClose}
      onEnviada={onSent}
    />
  );
}
