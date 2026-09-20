import type { CSSProperties, ReactNode } from "react";

type CommunityPollOptionStatusProps = {
  children: ReactNode;
  selected: boolean;
};

export function CommunityPollOptionStatus({
  children,
  selected,
}: CommunityPollOptionStatusProps) {
  return (
    <span
      style={{
        ...pollOptionStatusStyle,
        color: selected ? "#000000" : "#FFFFFF",
        WebkitTextFillColor: selected ? "#000000" : "#FFFFFF",
        textShadow: selected ? "none" : pollOptionStatusStyle.textShadow,
      }}
    >
      {children}
    </span>
  );
}

const pollOptionStatusStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  color: "#FFFFFF",
  WebkitTextFillColor: "#FFFFFF",
  opacity: 1,
  textShadow: "0 1px 2px rgba(0,0,0,0.38)",
  fontSize: "10px",
  fontWeight: 950,
  whiteSpace: "nowrap",
};
