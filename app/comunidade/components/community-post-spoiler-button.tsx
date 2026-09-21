import type {
  CSSProperties,
  MouseEventHandler,
  ReactNode,
} from "react";

type CommunityPostSpoilerButtonProps = {
  children: ReactNode;
  onClick: MouseEventHandler<HTMLButtonElement>;
};

export function CommunityPostSpoilerButton({
  children,
  onClick,
}: CommunityPostSpoilerButtonProps) {
  return (
    <button type="button" onClick={onClick} style={actionButtonStyle}>
      {children}
    </button>
  );
}

const actionButtonStyle: CSSProperties = {
  minHeight: "26px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "0",
  border: "none",
  background: "transparent",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "12px",
  fontWeight: 950,
  fontFamily: "inherit",
  padding: "0 4px",
  cursor: "pointer",
  minWidth: "0",
  textAlign: "center",
  whiteSpace: "nowrap",
  boxShadow: "none",
};
