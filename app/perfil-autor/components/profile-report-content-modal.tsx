import DenunciaModal, {
  type TipoAlvoDenuncia,
} from "../../../components/DenunciaModal";

type ProfileReportContentModalProps = {
  open: boolean;
  targetType: TipoAlvoDenuncia;
  targetId: string;
  targetTitle: string;
  onClose: () => void;
  onSent: () => void;
};

export function ProfileReportContentModal({
  open,
  targetType,
  targetId,
  targetTitle,
  onClose,
  onSent,
}: ProfileReportContentModalProps) {
  return (
    <DenunciaModal
      aberto={open}
      alvoTipo={targetType}
      alvoId={targetId}
      alvoTitulo={targetTitle}
      onFechar={onClose}
      onEnviada={onSent}
    />
  );
}
