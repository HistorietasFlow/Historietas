import type {
  CSSProperties,
  Dispatch,
  ReactNode,
  SetStateAction,
} from "react";

type FeedbackTimerRef = {
  current: number | null;
};

export function emitirFeedbackAcao(
  setFeedbackAcao: Dispatch<SetStateAction<string>>,
  feedbackTimerRef: FeedbackTimerRef,
  mensagem: string,
) {
  setFeedbackAcao(mensagem);

  if (feedbackTimerRef.current) {
    window.clearTimeout(feedbackTimerRef.current);
  }

  feedbackTimerRef.current = window.setTimeout(() => {
    setFeedbackAcao("");
    feedbackTimerRef.current = null;
  }, 2600);
}

type CommunityActionFeedbackToastProps = {
  children: ReactNode;
};

export function CommunityActionFeedbackToast({
  children,
}: CommunityActionFeedbackToastProps) {
  return (
    <div role="status" aria-live="polite" style={actionFeedbackToastStyle}>
      {children}
    </div>
  );
}

const safeTextStyle: CSSProperties = {
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

const actionFeedbackToastStyle: CSSProperties = {
  position: "fixed",
  right: "max(14px, env(safe-area-inset-right))",
  bottom: "calc(16px + env(safe-area-inset-bottom))",
  zIndex: 80,
  maxWidth: "min(360px, calc(100vw - 28px))",
  padding: "12px 14px",
  borderRadius: "18px",
  background:
    "var(--historietas-surface-strong, var(--historietas-comunidade-dark-98, rgba(0,0,0,0.98)))",
  border:
    "1px solid var(--historietas-border-soft, rgba(255,255,255,0.12))",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "12px",
  fontWeight: 900,
  boxShadow: "none",
  ...safeTextStyle,
};
