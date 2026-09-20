import type { CSSProperties, ReactNode } from "react";

type CommunitySheetOverlayProps = {
  ariaLabel: string;
  children: ReactNode;
  closeAriaLabel: string;
  onClose: () => void;
};

export function CommunitySheetOverlay({
  ariaLabel,
  children,
  closeAriaLabel,
  onClose,
}: CommunitySheetOverlayProps) {
  return (
    <section style={communitySheetOverlayStyle} aria-label={ariaLabel}>
      <button
        type="button"
        aria-label={closeAriaLabel}
        onClick={onClose}
        style={communitySheetBackdropStyle}
      />

      {children}
    </section>
  );
}

const communitySheetOverlayStyle: CSSProperties = {
  position: "fixed",
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
  height: "100dvh",
  zIndex: 240,
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
  background: "rgba(0,0,0,0.68)",
  padding: 0,
  boxSizing: "border-box",
  overscrollBehavior: "none",
  touchAction: "none",
};

const communitySheetBackdropStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  border: "none",
  background: "transparent",
  cursor: "pointer",
};
