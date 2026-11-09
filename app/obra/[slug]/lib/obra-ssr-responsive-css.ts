import type { CSSProperties } from "react";
import {
  containerStyle, desktopContainerStyle, heroStyle, desktopHeroStyle,
  heroContentStyle, desktopHeroContentStyle, heroOverlayContentStyle, desktopHeroOverlayContentStyle,
  heroCoverLinkStyle, desktopHeroCoverLinkStyle, coverArtStyle, desktopCoverArtStyle,
  heroTopOverlayStyle, desktopHeroTopOverlayStyle, desktopHeaderRightStyle,
  titleStyle, desktopTitleStyle, heroBottomMetaBarStyle, desktopHeroBottomMetaBarStyle,
  heroBottomMetricsStyle, desktopHeroStatsStyle, heroActionsStyle, desktopHeroActionsStyle,
  primaryReadingButtonStyle, desktopPrimaryReadingButtonStyle, secondaryButtonStyle, desktopSecondaryFollowButtonStyle,
  followedButtonStyle, desktopFollowedButtonStyle, obraAddButtonStyle, desktopObraAddButtonStyle,
  communityBoxStyle, desktopCommunityBoxStyle, statsGridStyle, desktopStatsGridStyle,
  chaptersListStyle, desktopChaptersListStyle, chapterCardStyle, desktopChapterCardStyle,
  workRatingBoxStyle, desktopWorkRatingBoxStyle,
} from "./obra-style-utils";

// Reaplica os estilos existentes antes da hidratação, sem outra árvore ou UA.
const styles: [string, CSSProperties, CSSProperties][] = [
  ["container", containerStyle, desktopContainerStyle], ["hero", heroStyle, desktopHeroStyle],
  ["hero-content", heroContentStyle, desktopHeroContentStyle], ["overlay", heroOverlayContentStyle, desktopHeroOverlayContentStyle],
  ["cover-link", heroCoverLinkStyle, desktopHeroCoverLinkStyle], ["cover", coverArtStyle, desktopCoverArtStyle],
  ["header", heroTopOverlayStyle, desktopHeroTopOverlayStyle], ["header-right", { display: "contents" }, desktopHeaderRightStyle],
  ["title", titleStyle, desktopTitleStyle], ["meta", heroBottomMetaBarStyle, desktopHeroBottomMetaBarStyle],
  ["metrics", heroBottomMetricsStyle, desktopHeroStatsStyle], ["actions", heroActionsStyle, desktopHeroActionsStyle],
  ["reading", primaryReadingButtonStyle, desktopPrimaryReadingButtonStyle],
  ["follow", secondaryButtonStyle, desktopSecondaryFollowButtonStyle], ["followed", followedButtonStyle, desktopFollowedButtonStyle],
  ["more", obraAddButtonStyle, desktopObraAddButtonStyle], ["community", communityBoxStyle, desktopCommunityBoxStyle],
  ["stats", statsGridStyle, desktopStatsGridStyle], ["chapters", chaptersListStyle, desktopChaptersListStyle],
  ["chapter", chapterCardStyle, desktopChapterCardStyle], ["rating", workRatingBoxStyle, desktopWorkRatingBoxStyle],
];
const unitless = new Set(["lineHeight", "fontWeight", "zIndex", "opacity", "flex", "flexGrow", "flexShrink", "order", "WebkitLineClamp"]);
const root = '[data-historietas-obra-dinamica-root="true"]';
export const obraSsrResponsiveCss = `
  @media (max-width: 1023.98px) { ${root} [data-obra-desktop-only] { display:none !important; } }
  @media (min-width: 1024px) {
    ${root} [data-obra-mobile-author] { display:none !important; }
    ${root} [data-obra-responsive="cover"] img { object-position:center !important; }
    ${styles.map(([name, mobile, desktop]) => {
      const a = mobile as Record<string, unknown>, b = desktop as Record<string, unknown>;
      return `:where(${root} [data-obra-responsive="${name}"]) {${[...new Set([...Object.keys(a), ...Object.keys(b)])].map(key => {
        const value = b[key];
        const cssKey = key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`).replace(/^ms-/, "-ms-");
        return `${cssKey}:${value == null ? "initial" : typeof value === "number" && value !== 0 && !unitless.has(key) ? `${value}px` : value} !important;`;
      }).join("")}}`;
    }).join("\n")}
  }
`;
