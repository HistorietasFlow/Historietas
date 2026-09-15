import type { ReactNode } from "react";
import {
  authorHeaderInfoStyle,
  desktopTitleStyle,
  profileNameRowStyle,
  titleStyle,
} from "../styles";

type ProfileHeaderInfoProps = {
  autorNome: string;
  children: ReactNode;
  isDesktop: boolean;
};

export function ProfileHeaderInfo({
  autorNome,
  children,
  isDesktop,
}: ProfileHeaderInfoProps) {
  return (
    <div style={authorHeaderInfoStyle}>
      <div style={profileNameRowStyle}>
        <h1
          data-historietas-user-content="true"
          className="historietas-theme-title"
          style={isDesktop ? desktopTitleStyle : titleStyle}
        >
          {autorNome}
        </h1>
      </div>

      {children}
    </div>
  );
}
