import type {
  CSSProperties,
  MouseEventHandler,
  ReactNode,
} from "react";

type CommunityCommentRemoveButtonProps = {
  children: ReactNode;
  disabled: boolean;
  onClick: MouseEventHandler<HTMLButtonElement>;
};

export function CommunityCommentRemoveButton({
  children,
  disabled,
  onClick,
}: CommunityCommentRemoveButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        ...commentRemoveButtonStyle,
        opacity: disabled ? 0.58 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {children}
    </button>
  );
}

const commentRemoveButtonStyle: CSSProperties = {
  width: "fit-content",
  border: "none",
  background: "transparent",
  color:
    "var(--historietas-danger-button-text, var(--historietas-comunidade-danger-text, #FFFFFF))",
  fontSize: "10.5px",
  fontWeight: 900,
  fontFamily: "inherit",
  padding: "1px 0 0",
  cursor: "pointer",
};
