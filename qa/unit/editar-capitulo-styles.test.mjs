import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const stylesSource = readFileSync(
  new URL(
    "../../app/editar-capitulo/lib/editar-capitulo-styles.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/editar-capitulo/page.tsx", import.meta.url),
  "utf8",
);

const styleNames = [
  "safeTextStyle",
  "mobileTopWaterFadeStyle",
  "desktopTopWaterFadeStyle",
  "pageStyle",
  "containerStyle",
  "titleHeaderStyle",
  "desktopTitleHeaderStyle",
  "headerTitleLinkStyle",
  "desktopHeaderTitleLinkStyle",
  "headerTitleTextStyle",
  "desktopHeaderTitleTextStyle",
  "errorBoxStyle",
  "errorTitleStyle",
  "errorTextStyle",
  "mainGridStyle",
  "formStyle",
  "formHeaderStyle",
  "formMiniTitleStyle",
  "formTitleStyle",
  "fieldGroupStyle",
  "labelStyle",
  "inputStyle",
  "textareaStyle",
  "hintStyle",
  "importBoxStyle",
  "importInfoStyle",
  "importTitleStyle",
  "importIconBoxStyle",
  "importIconStyle",
  "importSuccessStyle",
  "importErrorStyle",
  "importButtonStyle",
  "hiddenFileInputStyle",
  "buttonAreaStyle",
  "saveButtonStyle",
  "disabledButtonStyle",
  "secondaryButtonStyle",
  "cancelButtonStyle",
  "deleteButtonStyle",
  "disabledDeleteButtonStyle",
  "previewPanelStyle",
  "previewHeaderStyle",
  "previewMiniTitleStyle",
  "previewChapterCardStyle",
  "previewChapterTitleStyle",
  "previewChapterTextStyle",
  "previewTopRowStyle",
  "desktopContainerStyle",
  "desktopMainGridStyle",
  "desktopFormStyle",
  "desktopFormHeaderStyle",
  "desktopFormTitleStyle",
  "desktopImportBoxStyle",
  "desktopImportButtonStyle",
  "desktopTextareaStyle",
  "desktopButtonAreaStyle",
  "desktopSaveButtonStyle",
  "desktopDisabledButtonStyle",
  "desktopSecondaryButtonStyle",
  "desktopCancelButtonStyle",
  "desktopDeleteButtonStyle",
  "desktopDisabledDeleteButtonStyle",
  "desktopPreviewPanelStyle",
  "desktopPreviewChapterCardStyle",
  "desktopPreviewChapterTitleStyle",
  "desktopPreviewChapterTextStyle",
];

test("estilos de Editar Capítulo preservam as 66 constantes e seus contratos", () => {
  assert.match(stylesSource, /^import type \{ CSSProperties \} from "react";/);
  assert.equal(
    (stylesSource.match(/^(?:const|export const) \w+Style: CSSProperties =/gm) || [])
      .length,
    66,
  );

  for (const styleName of styleNames) {
    assert.match(
      stylesSource,
      new RegExp(`^(?:const|export const) ${styleName}: CSSProperties =`, "m"),
    );
  }

  assert.match(stylesSource, /export const desktopContainerStyle: CSSProperties = \{\s*\.\.\.containerStyle,/);
  assert.match(stylesSource, /export const desktopFormStyle: CSSProperties = \{\s*\.\.\.formStyle,/);
  assert.match(stylesSource, /export const desktopPreviewPanelStyle: CSSProperties = \{\s*\.\.\.previewPanelStyle,/);
  assert.match(stylesSource, /\.\.\.safeTextStyle/);
  assert.match(
    stylesSource,
    /background: "var\(--historietas-editar-capitulo-bg-page, #000000\)"/,
  );
  assert.doesNotMatch(stylesSource, /function |useState|useEffect|supabase|localStorage|router|<\w+/);
});

test("Editar Capítulo consome os estilos extraídos sem alterar os consumidores", () => {
  assert.doesNotMatch(pageSource, /^const \w+Style: CSSProperties =/m);
  assert.doesNotMatch(pageSource, /CSSProperties/);

  for (const styleName of styleNames.filter(
    (styleName) => styleName !== "safeTextStyle",
  )) {
    assert.match(pageSource, new RegExp(`\\b${styleName}\\b`));
  }

  assert.match(pageSource, /useHistorietasTheme\(pageStyle\)/);
  assert.match(pageSource, /isDesktop \? desktopContainerStyle : containerStyle/);
  assert.match(pageSource, /isDesktop \? desktopFormStyle : formStyle/);
  assert.match(pageSource, /isDesktop \? desktopPreviewPanelStyle : previewPanelStyle/);
  assert.match(
    pageSource,
    /isDesktop\s*\?\s*desktopDisabledButtonStyle\s*:\s*disabledButtonStyle/,
  );
  assert.match(
    pageSource,
    /isDesktop\s*\?\s*desktopSaveButtonStyle\s*:\s*saveButtonStyle/,
  );
});
