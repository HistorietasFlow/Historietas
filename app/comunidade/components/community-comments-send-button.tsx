import type { ComponentPropsWithoutRef, CSSProperties } from "react";

type CommunityCommentsSendButtonProps = Omit<
  ComponentPropsWithoutRef<"button">,
  "style"
> & {
  active: boolean;
};

export function CommunityCommentsSendButton({
  active,
  children,
  ...buttonProps
}: CommunityCommentsSendButtonProps) {
  return (
    <button
      {...buttonProps}
      style={{
        ...sendButtonStyle,
        opacity: active ? 1 : 0.58,
        cursor: active ? "pointer" : "not-allowed",
      }}
    >
      {children}
    </button>
  );
}

const sendButtonStyle: CSSProperties = {
  width: "36px",
  height: "36px",
  borderRadius: "999px",
  border:
    "1px solid var(--historietas-bottom-nav-publish-border, var(--historietas-comunidade-purple-soft-34, rgba(255,255,255,0.18)))",
  background:
    "var(--historietas-bottom-nav-publish-bg, var(--historietas-comunidade-purple-72, rgba(255,255,255,0.12)))",
  color: "#FFFFFF",
  fontSize: "18px",
  lineHeight: 1,
  fontWeight: 950,
  fontFamily: "inherit",
  padding: 0,
};
