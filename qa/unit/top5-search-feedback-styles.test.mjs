import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const stylesPath = new URL(
  "../../app/perfil-autor/top-5/lib/top5-search-feedback-styles.ts",
  import.meta.url,
);
const pagePath = new URL(
  "../../app/perfil-autor/top-5/page.tsx",
  import.meta.url,
);

test("Top 5 delega somente os estilos de busca e feedback", async () => {
  const [styles, page] = await Promise.all([
    readFile(stylesPath, "utf8"),
    readFile(pagePath, "utf8"),
  ]);

  assert.match(styles, /import type \{ CSSProperties \} from "react";/);

  const styleNames = [
    "searchSectionStyle",
    "searchShellStyle",
    "searchIconStyle",
    "searchInputStyle",
    "messageStyle",
    "loadingStyle",
    "noticeStyle",
    "noticeTitleStyle",
    "noticeTextStyle",
    "loginButtonStyle",
  ];

  for (const styleName of styleNames) {
    assert.match(styles, new RegExp(`export const ${styleName}: CSSProperties =`));
    assert.doesNotMatch(page, new RegExp(`const ${styleName}: CSSProperties =`));
    assert.match(page, new RegExp(styleName));
  }

  for (const value of [
    'maxWidth: "980px"',
    'minHeight: "48px"',
    'borderRadius: "18px"',
    'background: "#000000"',
    'fontSize: "22px"',
    'height: "46px"',
    'WebkitAppearance: "none"',
    'letterSpacing: "-0.035em"',
    "--historietas-top5-message",
    "rgba(255,255,255,0.72)",
    "--historietas-top5-orange-soft",
    "--historietas-top5-orange-border",
    "fontWeight: 950",
    "lineHeight: 1.35",
    'background: "#FFFFFF"',
    'color: "#0A0A0A"',
  ]) {
    assert.ok(styles.includes(value), `preserva ${value}`);
  }

  assert.doesNotMatch(page, /CSSProperties/);
  assert.match(
    page,
    /import \{[\s\S]*loadingStyle,[\s\S]*loginButtonStyle,[\s\S]*messageStyle,[\s\S]*noticeStyle,[\s\S]*noticeTextStyle,[\s\S]*noticeTitleStyle,[\s\S]*searchIconStyle,[\s\S]*searchInputStyle,[\s\S]*searchSectionStyle,[\s\S]*searchShellStyle,[\s\S]*from "\.\/lib\/top5-search-feedback-styles";/,
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
