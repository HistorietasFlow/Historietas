import { forwardRef, type CSSProperties } from "react";

type CommunityPostComposerTextareaProps = {
  disabled: boolean;
};

export const CommunityPostComposerTextarea = forwardRef<
  HTMLTextAreaElement,
  CommunityPostComposerTextareaProps
>(function CommunityPostComposerTextarea({ disabled }, ref) {
  return (
    <textarea
      ref={ref}
      disabled={disabled}
      placeholder="Abra uma conversa, peça indicação ou divulgue uma obra real publicada..."
      autoComplete="off"
      autoCorrect="off"
      spellCheck={false}
      maxLength={700}
      rows={3}
      style={postComposerTextareaStyle}
    />
  );
});

const inputStyle: CSSProperties = {
  width: "100%",
  minHeight: "38px",
  borderRadius: "15px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "var(--historietas-comunidade-bg-deep, #000000)",
  color: "var(--historietas-input-text, #FFFFFF)",
  padding: "0 12px",
  outline: "none",
  fontSize: "13px",
  fontWeight: 750,
  fontFamily: "inherit",
  boxSizing: "border-box",
  minWidth: 0,
};

const postComposerTextareaStyle: CSSProperties = {
  ...inputStyle,
  minHeight: "66px",
  maxHeight: "130px",
  borderRadius: "17px",
  padding: "10px 12px",
  resize: "none",
  lineHeight: 1.45,
  overflowY: "auto",
  WebkitOverflowScrolling: "touch",
};
