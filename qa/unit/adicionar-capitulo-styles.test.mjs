import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const stylesSource = readFileSync(
  new URL(
    "../../app/adicionar-capitulo/lib/adicionar-capitulo-styles.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/adicionar-capitulo/page.tsx", import.meta.url),
  "utf8",
);

const styleNames = Array.from(
  stylesSource.matchAll(/^export const (\w+Style): CSSProperties = \{/gm),
  ([, name]) => name,
);

test("estilos de Adicionar Capítulo preservam os 62 contratos CSSProperties", () => {
  assert.match(
    stylesSource,
    /import type \{ CSSProperties \} from "react";/,
  );
  assert.equal(
    (stylesSource.match(/^(?:export )?const \w+Style: CSSProperties = \{/gm) || [])
      .length,
    62,
  );
  assert.match(stylesSource, /const safeTextStyle: CSSProperties = \{/);
  assert.equal(styleNames.length, 61);
  assert.match(stylesSource, /const mobileTopWaterFadeStyle: CSSProperties = \{/);
  assert.match(stylesSource, /export const desktopTopWaterFadeStyle: CSSProperties = \{/);
  assert.match(stylesSource, /export const desktopPreviewChapterCardStyle: CSSProperties = \{/);
  assert.match(
    stylesSource,
    /export const pageStyle: CSSProperties = \{[\s\S]*?background: "var\(--historietas-adicionar-capitulo-bg-page, #000000\)"/,
  );
});

test("estilos de Adicionar Capítulo preservam spreads e variantes responsivas", () => {
  assert.match(
    stylesSource,
    /export const desktopTitleHeaderStyle: CSSProperties = \{\s*\.\.\.titleHeaderStyle,/,
  );
  assert.match(
    stylesSource,
    /export const disabledButtonStyle: CSSProperties = \{\s*\.\.\.primaryButtonStyle,/,
  );
  assert.match(
    stylesSource,
    /export const desktopDisabledButtonStyle: CSSProperties = \{\s*\.\.\.disabledButtonStyle,/,
  );
  assert.match(
    stylesSource,
    /export const desktopContainerStyle: CSSProperties = \{\s*\.\.\.containerStyle,/,
  );
  assert.match(
    stylesSource,
    /export const desktopPreviewChapterCardStyle: CSSProperties = \{\s*\.\.\.previewChapterCardStyle,/,
  );
  assert.match(stylesSource, /\.\.\.safeTextStyle,/);
});

test("Adicionar Capítulo importa e consome os estilos extraídos", () => {
  assert.doesNotMatch(pageSource, /^const \w+Style: CSSProperties = \{/m);
  assert.match(
    pageSource,
    /from "\.\/lib\/adicionar-capitulo-styles";/,
  );
  assert.match(pageSource, /useHistorietasTheme\(pageStyle\)/);
  assert.match(
    pageSource,
    /style=\{isDesktop \? desktopPreviewChapterCardStyle : previewChapterCardStyle\}/,
  );
  styleNames.forEach((styleName) => {
    assert.ok(
      (pageSource.match(new RegExp(`\\b${styleName}\\b`, "g")) || []).length >= 2,
      `${styleName} continua importado e consumido pela página`,
    );
  });
});

test("módulo de estilos de Adicionar Capítulo permanece isolado", () => {
  assert.doesNotMatch(
    stylesSource,
    /import(?!\s+type)\s+.*from\s+["']react["']|useState|useEffect|useMemo|useRef|supabase|localStorage|router/i,
  );
  assert.doesNotMatch(
    stylesSource,
    /<(?:[A-Z][A-Za-z0-9]*|[a-z][a-z0-9-]*)(?:\s|\/?>)/,
  );
});
