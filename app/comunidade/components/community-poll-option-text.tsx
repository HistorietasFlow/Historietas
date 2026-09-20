import type { CSSProperties, ReactNode } from "react";

type CommunityPollOptionTextProps = {
  children: ReactNode;
  selected: boolean;
};

export function CommunityPollOptionText({
  children,
  selected,
}: CommunityPollOptionTextProps) {
  return (
    <span
      data-historietas-user-content="true"
      style={{
        ...pollOptionTextStyle,
        color: selected ? "#000000" : "#FFFFFF",
        WebkitTextFillColor: selected ? "#000000" : "#FFFFFF",
        textShadow: selected ? "none" : pollOptionTextStyle.textShadow,
      }}
    >
      {children}
    </span>
  );
}

const pollOptionTextStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  minWidth: 0,
  textAlign: "left",
  color: "#FFFFFF",
  WebkitTextFillColor: "#FFFFFF",
  opacity: 1,
  textShadow: "0 1px 2px rgba(0,0,0,0.38)",
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};
