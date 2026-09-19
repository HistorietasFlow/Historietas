import type { ReactNode } from "react";

import { workActionSheetMetaStyle } from "../styles";

type ProfileWorkActionSheetMetaProps = {
  children: ReactNode;
};

export function ProfileWorkActionSheetMeta({
  children,
}: ProfileWorkActionSheetMetaProps) {
  return <span style={workActionSheetMetaStyle}>{children}</span>;
}
