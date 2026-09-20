import type {
  CSSProperties,
  MouseEventHandler,
  ReactNode,
} from "react";

type CommunityPollOptionButtonProps = {
  children: ReactNode;
  disabled: boolean;
  onClick: MouseEventHandler<HTMLButtonElement>;
  selected: boolean;
};

export function CommunityPollOptionButton({
  children,
  disabled,
  onClick,
  selected,
}: CommunityPollOptionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={selected ? pollOptionSelectedStyle : pollOptionStyle}
    >
      {children}
    </button>
  );
}

const pollOptionStyle: CSSProperties = {
  position: "relative",
  minHeight: "36px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "8px",
  padding: "0 10px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  background: "rgba(255,255,255,0.045)",
  color: "#FFFFFF",
  WebkitTextFillColor: "#FFFFFF",
  opacity: 1,
  fontSize: "11px",
  fontWeight: 900,
  fontFamily: "inherit",
  cursor: "pointer",
  overflow: "hidden",
  boxShadow: "none",
};

const pollOptionSelectedStyle: CSSProperties = {
  ...pollOptionStyle,
  border: "1px solid var(--historietas-comunidade-cyan-62, rgba(255,255,255,0.62))",
  background: "linear-gradient(135deg, var(--historietas-comunidade-blue, #FFFFFF) 0%, var(--historietas-comunidade-cyan, #D4D4D8) 100%)",
  color: "#000000",
  WebkitTextFillColor: "#000000",
  opacity: 1,
};
