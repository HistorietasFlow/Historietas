import type {
  CSSProperties,
  MouseEventHandler,
  ReactNode,
} from "react";

type CommunityCommentReportButtonProps = {
  children: ReactNode;
  disabled: boolean;
  onClick: MouseEventHandler<HTMLButtonElement>;
};

export function CommunityCommentReportButton({
  children,
  disabled,
  onClick,
}: CommunityCommentReportButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        ...commentReportButtonStyle,
        opacity: disabled ? 0.58 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {children}
    </button>
  );
}

const commentReportButtonStyle: CSSProperties = {
  width: "fit-content",
  border: "none",
  background: "transparent",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "10.5px",
  fontWeight: 900,
  fontFamily: "inherit",
  padding: "1px 0 0",
  cursor: "pointer",
};
