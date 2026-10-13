import DenunciaModal from "../../../components/DenunciaModal";

type ProfileReportProfileModalProps = {
  open: boolean;
  targetId: string;
  targetTitle: string;
  targetUrl: string;
  onClose: () => void;
  onSent: () => void;
};

export function ProfileReportProfileModal({
  open,
  targetId,
  targetTitle,
  targetUrl,
  onClose,
  onSent,
}: ProfileReportProfileModalProps) {
  return (
    <DenunciaModal
      aberto={open}
      alvoTipo="perfil"
      alvoId={targetId}
      alvoTitulo={targetTitle}
      alvoUrl={targetUrl}
      onFechar={onClose}
      onEnviada={onSent}
    />
  );
}
