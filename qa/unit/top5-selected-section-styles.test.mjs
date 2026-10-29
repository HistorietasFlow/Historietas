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

test("Top 5 delega somente os estilos da seção de obras selecionadas", async () => {
  const [styles, page] = await Promise.all([
    readFile(stylesPath, "utf8"),
    readFile(pagePath, "utf8"),
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
    assert.match(page, new RegExp(styleName));
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
    page,
    /import \{[\s\S]*cancelButtonStyle,[\s\S]*emptySelectedSlotStyle,[\s\S]*footerActionsStyle,[\s\S]*saveButtonDisabledStyle,[\s\S]*saveButtonStyle,[\s\S]*selectedActionsStyle,[\s\S]*selectedHeaderStyle,[\s\S]*selectedListStyle,[\s\S]*selectedMoveButtonStyle,[\s\S]*selectedNumberStyle,[\s\S]*selectedRemoveButtonStyle,[\s\S]*selectedSectionStyle,[\s\S]*selectedSlotStyle,[\s\S]*selectedTitleStyle,[\s\S]*from "\.\/lib\/top5-selected-section-styles";/,
  );

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
