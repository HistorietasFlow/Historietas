import type { CSSProperties, ReactNode } from "react";

type CommunitySpoilerHiddenTitleProps = {
  children: ReactNode;
};

export function CommunitySpoilerHiddenTitle({
  children,
}: CommunitySpoilerHiddenTitleProps) {
  return <strong style={spoilerHiddenTitleStyle}>{children}</strong>;
}

const spoilerHiddenTitleStyle: CSSProperties = {
  display: "inline-flex",
  width: "fit-content",
  maxWidth: "100%",
  margin: 0,
  color: "var(--historietas-comunidade-danger-text, #FFFFFF)",
  fontSize: "13px",
  fontWeight: 950,
  lineHeight: 1.35,
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};
