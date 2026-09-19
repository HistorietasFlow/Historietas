import type { ReactNode } from "react";

import { profileAboutEditorStyle } from "../styles";

type ProfileAboutEditorProps = {
  children: ReactNode;
};

export function ProfileAboutEditor({ children }: ProfileAboutEditorProps) {
  return <div style={profileAboutEditorStyle}>{children}</div>;
}
