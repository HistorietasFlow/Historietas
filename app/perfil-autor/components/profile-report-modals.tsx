import type { TipoAlvoDenuncia } from "../../../components/DenunciaModal";
import { ProfileReportContentModal } from "./profile-report-content-modal";
import { ProfileReportProfileModal } from "./profile-report-profile-modal";

type ProfileReportModalsProps = {
  profileOpen: boolean;
  profileTargetId: string;
  profileTargetTitle: string;
  profileTargetUrl: string;
  contentOpen: boolean;
  contentTargetType: TipoAlvoDenuncia;
  contentTargetId: string;
  contentTargetTitle: string;
  onProfileClose: () => void;
  onProfileSent: () => void;
  onContentClose: () => void;
  onContentSent: () => void;
};

export function ProfileReportModals({
  profileOpen,
  profileTargetId,
  profileTargetTitle,
  profileTargetUrl,
  contentOpen,
  contentTargetType,
  contentTargetId,
  contentTargetTitle,
  onProfileClose,
  onProfileSent,
  onContentClose,
  onContentSent,
}: ProfileReportModalsProps) {
  return (
    <>
      <ProfileReportProfileModal
        open={profileOpen}
        targetId={profileTargetId}
        targetTitle={profileTargetTitle}
        targetUrl={profileTargetUrl}
        onClose={onProfileClose}
        onSent={onProfileSent}
      />

      <ProfileReportContentModal
        open={contentOpen}
        targetType={contentTargetType}
        targetId={contentTargetId}
        targetTitle={contentTargetTitle}
        onClose={onContentClose}
        onSent={onContentSent}
      />
    </>
  );
}
