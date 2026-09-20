import type { CSSProperties, ReactNode } from "react";

type CommunityUserSearchSectionProps = {
  ariaLabel: string;
  children: ReactNode;
};

export function CommunityUserSearchSection({
  ariaLabel,
  children,
}: CommunityUserSearchSectionProps) {
  return (
    <section
      style={communityUserSearchSectionStyle}
      aria-label={ariaLabel}
    >
      {children}
    </section>
  );
}

const communityUserSearchSectionStyle: CSSProperties = {
  display: "grid",
  gap: "10px",
  padding: "12px 0 8px",
  borderBottom: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  minWidth: 0,
};
