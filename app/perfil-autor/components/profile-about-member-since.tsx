import type { ReactNode } from "react";

import { profileAboutMemberSinceStyle } from "../styles";

type ProfileAboutMemberSinceProps = {
  children: ReactNode;
};

export function ProfileAboutMemberSince({
  children,
}: ProfileAboutMemberSinceProps) {
  return <p style={profileAboutMemberSinceStyle}>{children}</p>;
}
