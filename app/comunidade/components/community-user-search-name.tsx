import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

type CommunityUserSearchNameProps = {
  href: string;
  children: ReactNode;
};

export function CommunityUserSearchName({
  href,
  children,
}: CommunityUserSearchNameProps) {
  return (
    <Link href={href} style={communityUserSearchNameStyle}>
      {children}
    </Link>
  );
}

const communityUserSearchNameStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "13px",
  lineHeight: 1.2,
  fontWeight: 950,
  textDecoration: "none",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};
