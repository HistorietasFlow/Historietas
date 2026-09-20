import type { CSSProperties } from "react";

type CommunityPollResultBarProps = {
  visible: boolean;
  width: string;
};

export function CommunityPollResultBar({
  visible,
  width,
}: CommunityPollResultBarProps) {
  return (
    <span
      style={{
        ...pollResultBarStyle,
        width,
        opacity: visible ? 1 : 0,
      }}
    />
  );
}

const pollResultBarStyle: CSSProperties = {
  position: "absolute",
  inset: "0 auto 0 0",
  background: "var(--historietas-comunidade-cyan-22, rgba(255,255,255,0.10))",
  pointerEvents: "none",
};
