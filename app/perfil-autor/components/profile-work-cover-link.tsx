import Link from "next/link";
import type { ReactNode } from "react";

import { profileWorkCoverLinkStyle } from "../styles";

type ProfileWorkCoverLinkProps = {
  children: ReactNode;
  href: string;
};

export function ProfileWorkCoverLink({
  children,
  href,
}: ProfileWorkCoverLinkProps) {
  return (
    <Link href={href} style={profileWorkCoverLinkStyle}>
      {children}
    </Link>
  );
}
