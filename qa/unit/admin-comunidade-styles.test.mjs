import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const stylesSource = readFileSync(
  new URL(
    "../../app/admin/comunidade/lib/admin-comunidade-styles.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL(
    "../../app/admin/comunidade/page.tsx",
    import.meta.url,
  ),
  "utf8",
);
const profileReportCardSource = readFileSync(
  new URL(
    "../../app/admin/comunidade/components/admin-comunidade-profile-report-card.tsx",
    import.meta.url,
  ),
  "utf8",
);
const contentReportCardSource = readFileSync(
  new URL(
    "../../app/admin/comunidade/components/admin-comunidade-content-report-card.tsx",
    import.meta.url,
  ),
  "utf8",
);
const filtersSheetSource = readFileSync(
  new URL(
    "../../app/admin/comunidade/components/admin-comunidade-filters-sheet.tsx",
    import.meta.url,
  ),
  "utf8",
);
const styleConsumerSources = [
  pageSource,
  profileReportCardSource,
  contentReportCardSource,
  filtersSheetSource,
];

const pageStyleNames = [
  "pageStyle",
  "containerStyle",
  "desktopContainerStyle",
  "titleHeaderStyle",
  "desktopTitleHeaderStyle",
  "titleHeaderActionsStyle",
  "desktopTechnicalSupportButtonStyle",
  "mobileTechnicalSupportButtonStyle",
  "desktopNotificationButtonStyle",
  "desktopNotificationBadgeStyle",
  "titleSearchButtonStyle",
  "mobileTopWaterFadeStyle",
  "desktopTopWaterFadeStyle",
  "statsGridStyle",
  "statCardStyle",
  "statNumberStyle",
  "statLabelStyle",
  "toolsStyle",
  "adminSearchShellStyle",
  "adminSearchIconStyle",
  "adminSearchInputStyle",
  "adminFilterLabelButtonStyle",
  "adminFilterActionIconStyle",
  "statusFilterWrapStyle",
  "filterButtonsStyle",
  "filterButtonStyle",
  "activeFilterButtonStyle",
  "feedbackWrapStyle",
  "errorStyle",
  "successStyle",
  "summaryStyle",
  "summaryTitleStyle",
  "clearButtonStyle",
  "listStyle",
  "reportCardStyle",
  "reportHeaderStyle",
  "reportTitleWrapStyle",
  "reportMetaLineStyle",
  "reportDotStyle",
  "targetBadgeStyle",
  "postTargetBadgeStyle",
  "commentTargetBadgeStyle",
  "reportTitleStyle",
  "reportDateStyle",
  "statusInlineStyle",
  "archivedInlineStyle",
  "reportHeaderRightStyle",
  "reportMenuWrapStyle",
  "reportMenuButtonStyle",
  "reportMenuOverlayStyle",
  "reportMenuBackdropStyle",
  "reportMenuStyle",
  "reportMenuHandleStyle",
  "reportMenuTitleStyle",
  "reportMenuItemStyle",
  "reportMenuItemLinkStyle",
  "reportMenuItemActiveStyle",
  "reportMenuDangerItemStyle",
  "reportMenuDividerStyle",
  "reportBodyStyle",
  "contentBoxStyle",
  "sectionHeaderLineStyle",
  "sectionHintStyle",
  "boxLabelStyle",
  "adminObservationLabelStyle",
  "reportedTextStyle",
  "reportedTextCompactStyle",
  "metaGridStyle",
  "metaItemStyle",
  "recurrenceMetaItemStyle",
  "spoilerMetaItemStyle",
  "reasonGridStyle",
  "reasonItemStyle",
  "detailTextStyle",
  "mutedTextStyle",
  "adminNoteStyle",
  "textareaStyle",
  "analysisMetaStyle"
];

test("Admin Comunidade delega todos os estilos React estáticos ao módulo extraído", () => {
  assert.match(
    stylesSource,
    /import type \{ CSSProperties \} from "react";/,
  );
  assert.equal(
    (
      stylesSource.match(
        /\bconst \w+Style: CSSProperties/g,
      ) || []
    ).length,
    90,
  );
  assert.match(
    stylesSource,
    /const safeTextStyle: CSSProperties/,
  );
  assert.doesNotMatch(
    stylesSource,
    /export const safeTextStyle/,
  );
  assert.doesNotMatch(
    pageSource,
    /const \w+Style: CSSProperties/,
  );

  for (const styleName of pageStyleNames) {
    assert.match(
      stylesSource,
      new RegExp(
        `export const \\b${styleName}\\b: CSSProperties`,
      ),
    );
    assert.ok(
      styleConsumerSources.some((source) =>
        new RegExp(`\\b${styleName}\\b`).test(source)
      ),
      `${styleName} deve permanecer consumido pela página ou pelos componentes extraídos`,
    );
  }

  assert.match(
    pageSource,
    /from "\.\/lib\/admin-comunidade-styles";/,
  );
  assert.match(pageSource, /useHistorietasTheme\(pageStyle\)/);
});

test("Admin Comunidade preserva estilos, spreads e consumidores visuais", () => {
  for (const pattern of [
    /\.\.\.safeTextStyle/,
    /\.\.\.filterButtonStyle/,
    /\.\.\.adminFiltersSheetOptionStyle/,
    /\.\.\.reportMenuItemStyle/,
    /\.\.\.metaItemStyle/,
    /\.\.\.reportedTextStyle/,
    /mobileTopWaterFadeStyle/,
    /desktopTopWaterFadeStyle/,
    /desktopContainerStyle/,
    /desktopTitleHeaderStyle/,
    /filterButtonsStyle/,
    /activeFilterButtonStyle/,
    /reportCardStyle/,
    /reportHeaderStyle/,
    /reportMenuStyle/,
    /adminFiltersSheetStyle/,
    /contentBoxStyle/,
    /metaGridStyle/,
    /analysisMetaStyle/,
  ]) {
    assert.match(stylesSource, pattern);
  }

  assert.match(pageSource, /<AdminComunidadeLanguageBridge/);
  assert.match(
    pageSource,
    /<style>\{\`\$\{historietasThemeCss\}\$\{adminComunidadePageCss\}\`\}<\/style>/,
  );
});

test("módulo de estilos não inclui comportamento de runtime", () => {
  assert.doesNotMatch(
    stylesSource,
    /useState|useEffect|useMemo|useRef|supabase|localStorage|router/i,
  );
  assert.doesNotMatch(
    stylesSource,
    /<(?:[A-Z][A-Za-z0-9]*|[a-z][a-z0-9-]*)(?:\s|\/?>)/,
  );
});
