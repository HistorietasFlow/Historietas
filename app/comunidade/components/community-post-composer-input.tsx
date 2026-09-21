import {
  forwardRef,
  type CSSProperties,
  type InputHTMLAttributes,
} from "react";

type CommunityPostComposerInputProps =
  InputHTMLAttributes<HTMLInputElement>;

export const CommunityPostComposerInput = forwardRef<
  HTMLInputElement,
  CommunityPostComposerInputProps
>(function CommunityPostComposerInput(
  { style, ...inputProps },
  ref,
) {
  return (
    <input
      ref={ref}
      {...inputProps}
      style={style ? { ...inputStyle, ...style } : inputStyle}
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
