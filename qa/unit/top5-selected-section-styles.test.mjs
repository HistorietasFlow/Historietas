import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const stylesPath = new URL(
  "../../app/perfil-autor/top-5/lib/top5-selected-section-styles.ts",
  import.meta.url,
);
const pagePath = new URL(
  "../../app/perfil-autor/top-5/page.tsx",
  import.meta.url,
);
const selectedSectionPath = new URL(
  "../../app/perfil-autor/top-5/components/top5-selected-section.tsx",
  import.meta.url,
);

test("Top 5 delega somente os estilos da seção de obras selecionadas", async () => {
  const [styles, page, selectedSection] = await Promise.all([
    readFile(stylesPath, "utf8"),
    readFile(pagePath, "utf8"),
    readFile(selectedSectionPath, "utf8"),
  ]);

  assert.match(styles, /import type \{ CSSProperties \} from "react";/);

  const styleNames = [
    "selectedSectionStyle",
    "selectedHeaderStyle",
    "selectedTitleStyle",
    "selectedListStyle",
    "selectedSlotStyle",
    "selectedNumberStyle",
    "selectedRemoveButtonStyle",
    "selectedActionsStyle",
    "selectedMoveButtonStyle",
    "emptySelectedSlotStyle",
    "footerActionsStyle",
    "cancelButtonStyle",
    "saveButtonStyle",
    "saveButtonDisabledStyle",
  ];

  for (const styleName of styleNames) {
    assert.match(
      styles,
      new RegExp(`export const ${styleName}: CSSProperties =`),
    );
    assert.doesNotMatch(
      page,
      new RegExp(`const ${styleName}: CSSProperties =`),
    );
  }

  for (const value of [
    'maxWidth: "980px"',
    'gridTemplateColumns: "repeat(5, minmax(0, 1fr))"',
    'aspectRatio: "0.62 / 1"',
    'borderRadius: "15px"',
    "fontWeight: 950",
    'background: "rgba(0,0,0,0.76)"',
    'background: "rgba(0,0,0,0.72)"',
    'background: "rgba(0,0,0,0.68)"',
    'minHeight: "32px"',
    'background: "#0B0B0B"',
    'border: "1px solid #2A2A2A"',
    "opacity: 0.48",
    'cursor: "not-allowed"',
  ]) {
    assert.ok(styles.includes(value), `preserva ${value}`);
  }

  assert.match(
    styles,
    /export const saveButtonDisabledStyle: CSSProperties = \{\s*\.\.\.saveButtonStyle,\s*opacity: 0\.48,\s*cursor: "not-allowed",\s*\};/,
  );
  assert.doesNotMatch(page, /CSSProperties/);
  assert.match(
    selectedSection,
    /import \{ selectedSectionStyle \} from "\.\.\/lib\/top5-selected-section-styles";/,
  );
  assert.doesNotMatch(page, /selectedSectionStyle/);

  for (const delegatedStyleName of [
    "cancelButtonStyle",
    "emptySelectedSlotStyle",
    "footerActionsStyle",
    "saveButtonDisabledStyle",
    "saveButtonStyle",
    "selectedActionsStyle",
    "selectedHeaderStyle",
    "selectedListStyle",
    "selectedMoveButtonStyle",
    "selectedNumberStyle",
    "selectedRemoveButtonStyle",
    "selectedSlotStyle",
    "selectedTitleStyle",
  ]) {
    assert.doesNotMatch(page, new RegExp(delegatedStyleName));
  }

  for (const forbidden of [
    "useEffect",
    "supabase",
    "auth",
    "useRouter",
    "localStorage",
    "ObraTop5",
    "carregarObras",
    "function ",
    "<div",
    "top5PerfilAutorPageCss",
  ]) {
    assert.doesNotMatch(
      styles,
      new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    );
  }
});
