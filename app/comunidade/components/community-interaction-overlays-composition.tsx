import type { ComponentProps } from "react";
import DenunciaModal from "../../../components/DenunciaModal";
import { CommunityActionFeedbackToast } from "./community-action-feedback-toast";
import { ComentariosSheet } from "./community-comments-sheet";

type CommunityInteractionOverlaysCompositionProps = {
  comentariosSheetProps: ComponentProps<typeof ComentariosSheet>;
  denunciaModalProps: ComponentProps<typeof DenunciaModal>;
  feedbackAcao: string;
};

export function CommunityInteractionOverlaysComposition({
  comentariosSheetProps,
  denunciaModalProps,
  feedbackAcao,
}: CommunityInteractionOverlaysCompositionProps) {
  return (
    <>
      <ComentariosSheet
        key={comentariosSheetProps.post?.id || "comentarios-fechados"}
        {...comentariosSheetProps}
      />

      <DenunciaModal {...denunciaModalProps} />

      {feedbackAcao && (
        <CommunityActionFeedbackToast>
          {feedbackAcao}
        </CommunityActionFeedbackToast>
      )}
    </>
  );
}
