import type { ReactNode } from "react";

import { workActionSheetAuthorStyle } from "../styles";

type ProfileWorkActionSheetAuthorProps = {
  children: ReactNode;
};

export function ProfileWorkActionSheetAuthor({
  children,
}: ProfileWorkActionSheetAuthorProps) {
  return <span style={workActionSheetAuthorStyle}>{children}</span>;
}
