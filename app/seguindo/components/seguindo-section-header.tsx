"use client";

import {
  desktopSectionHeaderTextStyle,
  desktopSectionTitleStyle,
  desktopSectionCounterStyle,
} from "../lib/seguindo-desktop-social-section-styles";
import {
  sectionHeaderStyle,
  desktopSectionHeaderStyle,
  sectionHeaderTextStyle,
  sectionTitleStyle,
  sectionCounterStyle,
} from "../lib/seguindo-section-header-styles";

type SeguindoSectionHeaderProps = {
  isDesktop: boolean;
  titulo: string;
  total: number | string;
};

export function SeguindoSectionHeader({
  isDesktop,
  titulo,
  total,
}: SeguindoSectionHeaderProps) {
  return (
    <div style={isDesktop ? desktopSectionHeaderStyle : sectionHeaderStyle}>
      <div style={isDesktop ? desktopSectionHeaderTextStyle : sectionHeaderTextStyle}>
        <h2 style={isDesktop ? desktopSectionTitleStyle : sectionTitleStyle}>
          {titulo}
        </h2>
      </div>

      <span style={isDesktop ? desktopSectionCounterStyle : sectionCounterStyle}>
        {total}
      </span>
    </div>
  );
}
