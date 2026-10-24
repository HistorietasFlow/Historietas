import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL(
    "../../app/painel-autor/lib/painel-autor-work-card-layout-style-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const page = readFileSync(
  new URL("../../app/painel-autor/page.tsx", import.meta.url),
  "utf8",
);
const workCardSource = readFileSync(
  new URL(
    "../../app/painel-autor/components/painel-autor-work-card.tsx",
    import.meta.url,
  ),
  "utf8",
);
const sectionSource = readFileSync(
  new URL(
    "../../app/painel-autor/components/painel-autor-section.tsx",
    import.meta.url,
  ),
  "utf8",
);
const desktopCompositionsSource = readFileSync(
  new URL(
    "../../app/painel-autor/lib/painel-autor-desktop-compositions-style-utils.ts",
    import.meta.url,
  ),
  "utf8",
);

test("estilos estruturais dos cards preservam o contrato visual", () => {
  for (const name of [
    "sectionStyle",
    "worksGridStyle",
    "workCardStyle",
    "coverLinkStyle",
    "coverGlowStyle",
    "workContentStyle",
    "statusRowStyle",
    "publishedStatusStyle",
    "draftStatusStyle",
  ]) {
    assert.match(source, new RegExp(`export const ${name}: CSSProperties`));
  }

  assert.match(
    source,
    /import \{ safeTextStyle \} from "\.\/painel-autor-desktop-header-style-utils";/,
  );
  assert.match(source, /gridTemplateColumns: "repeat\(2, minmax\(0, 1fr\)\)"/);
  assert.match(source, /overflow: "visible"/);
  assert.match(source, /textDecorationLine: "none"/);
  assert.match(source, /display: "none"/);
  assert.match(source, /padding: "28px 42px 9px 10px"/);
  assert.match(source, /pointerEvents: "none"/);
  assert.match(source, /fontSize: "8px"/);
  assert.match(source, /\.\.\.safeTextStyle/);
  assert.match(source, /\.\.\.publishedStatusStyle/);
});

test("página delega os estilos e mantém composições desktop e consumidores", () => {
  assert.match(
    workCardSource,
    /from "\.\.\/lib\/painel-autor-work-card-layout-style-utils";/,
  );

  for (const name of [
    "sectionStyle",
    "worksGridStyle",
    "workCardStyle",
    "coverLinkStyle",
    "coverGlowStyle",
    "workContentStyle",
    "statusRowStyle",
    "publishedStatusStyle",
    "draftStatusStyle",
  ]) {
    assert.doesNotMatch(page, new RegExp(`const ${name}: CSSProperties`));
  }

  assert.match(
    workCardSource,
    /from "\.\.\/lib\/painel-autor-desktop-compositions-style-utils";/,
  );
  for (const [name, baseStyle] of [
    ["desktopSectionStyle", "sectionStyle"],
    ["desktopWorksGridStyle", "worksGridStyle"],
    ["desktopWorkCardStyle", "workCardStyle"],
    ["desktopWorkContentStyle", "workContentStyle"],
  ]) {
    assert.match(
      desktopCompositionsSource,
      new RegExp(`export const ${name}: CSSProperties = \\{\\s*\\.\\.\\.${baseStyle},`),
    );
    assert.doesNotMatch(page, new RegExp(`const ${name}: CSSProperties = \\{`));
  }
  assert.match(
    sectionSource,
    /from "\.\.\/lib\/painel-autor-work-card-layout-style-utils";/,
  );
  assert.match(
    sectionSource,
    /from "\.\.\/lib\/painel-autor-desktop-compositions-style-utils";/,
  );
  assert.match(
    sectionSource,
    /style=\{isDesktop \? desktopSectionStyle : sectionStyle\}/,
  );
  assert.match(
    sectionSource,
    /style=\{isDesktop \? desktopWorksGridStyle : worksGridStyle\}/,
  );
  assert.match(
    page,
    /import \{ ObraPainelCard \} from "\.\/components\/painel-autor-work-card";/,
  );
  assert.doesNotMatch(page, /function ObraPainelCard\(/);
  assert.match(workCardSource, /style=\{isDesktop \? desktopWorkCardStyle : workCardStyle\}/);
  assert.match(workCardSource, /style=\{coverLinkStyle\}/);
  assert.match(workCardSource, /style=\{coverGlowStyle\}/);
  assert.match(workCardSource, /style=\{statusRowStyle\}/);
  assert.match(workCardSource, /style=\{obraComStatusPublicado \? publishedStatusStyle : draftStatusStyle\}/);
  assert.match(workCardSource, /style=\{isDesktop \? desktopWorkContentStyle : workContentStyle\}/);
});
