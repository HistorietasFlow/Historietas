import { forwardRef } from "react";
import type { ComponentPropsWithoutRef, CSSProperties } from "react";

type CommunityCommentsTextareaProps = Omit<
  ComponentPropsWithoutRef<"textarea">,
  "style"
>;

export const CommunityCommentsTextarea = forwardRef<
  HTMLTextAreaElement,
  CommunityCommentsTextareaProps
>(function CommunityCommentsTextarea(textareaProps, ref) {
  return (
    <textarea
      {...textareaProps}
      ref={ref}
      style={textareaStyle}
    />
  );
});

const textareaStyle: CSSProperties = {
  width: "100%",
  minHeight: "38px",
  maxHeight: "82px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "var(--historietas-comunidade-bg-deep, #000000)",
  color: "#FFFFFF",
  padding: "9px 12px",
  outline: "none",
  fontSize: "12.5px",
  lineHeight: 1.32,
  fontWeight: 650,
  resize: "none",
  overflowY: "auto",
  fontFamily: "inherit",
  boxSizing: "border-box",
};
