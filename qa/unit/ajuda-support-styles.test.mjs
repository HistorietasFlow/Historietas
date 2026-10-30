import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const modulo = readFileSync(
  new URL("../../app/ajuda/lib/ajuda-support-styles.ts", import.meta.url),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/ajuda/page.tsx", import.meta.url),
  "utf8",
);

const estilos = [
  "supportCardStyle",
  "supportSeparationNoticeStyle",
  "supportSeparationIconStyle",
  "supportSeparationTextStyle",
  "supportSuccessStyle",
  "supportErrorStyle",
  "supportLoginNoticeStyle",
  "supportLoginLinkStyle",
  "supportFormStyle",
  "supportFormGridStyle",
  "supportFieldStyle",
  "supportLabelStyle",
  "supportInputStyle",
  "supportTextareaStyle",
  "supportCounterStyle",
  "supportFormActionsStyle",
  "supportEnvironmentNoteStyle",
  "supportTicketsSectionStyle",
  "supportTicketsHeadingStyle",
  "supportTicketsListStyle",
  "supportTicketStyle",
  "supportTicketHeaderStyle",
  "supportTicketTitleStyle",
  "supportTicketStatusStyle",
  "supportTicketDescriptionStyle",
  "supportAdminNoteStyle",
  "supportTicketDateStyle",
];

test("os estilos do suporte técnico são exportados pelo módulo dedicado", () => {
  assert.match(modulo, /import type \{\s*CSSProperties,\s*\} from "react";/);
  assert.equal(
    (modulo.match(/export const \w+Style: CSSProperties/g) || []).length,
    estilos.length,
  );

  for (const estilo of estilos) {
    assert.match(modulo, new RegExp(`export const ${estilo}: CSSProperties`));
    assert.match(pagina, new RegExp(`\\b${estilo}\\b`));
    assert.doesNotMatch(
      pagina,
      new RegExp(`const ${estilo}: CSSProperties`),
    );
  }

  assert.match(
    modulo,
    /export const supportTextareaStyle: CSSProperties = \{\s*\.\.\.supportInputStyle,/,
  );
  assert.match(modulo, /minHeight: "132px"/);
  assert.match(modulo, /whiteSpace: "pre-wrap"/);
  assert.match(modulo, /overflowWrap: "anywhere"/);
});

test("a página consome os estilos do suporte sem mantê-los localmente", () => {
  assert.match(pagina, /from "\.\/lib\/ajuda-support-styles";/);
  assert.doesNotMatch(pagina, /const supportCardStyle: CSSProperties/);
  assert.doesNotMatch(pagina, /const supportTicketDateStyle: CSSProperties/);
});
