import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const componente = readFileSync(
  new URL(
    "../../app/configuracoes/components/configuracoes-settings-primitives.tsx",
    import.meta.url,
  ),
  "utf8",
);
const estilos = readFileSync(
  new URL(
    "../../app/configuracoes/lib/configuracoes-settings-primitives-styles.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/configuracoes/page.tsx", import.meta.url),
  "utf8",
);

test("primitives de Configurações preservam seções, linhas e inputs", () => {
  assert.match(componente, /import Link from "next\/link";/);
  assert.match(componente, /import type \{ ReactNode \} from "react";/);
  assert.match(componente, /import \{ SvgIcon \} from "\.\/configuracoes-svg-icon";/);
  assert.match(componente, /import type \{ IconName \} from "\.\/configuracoes-svg-icon";/);

  for (const primitive of [
    "ValorLinha",
    "SectionTitle",
    "SettingsSection",
    "SettingsRow",
    "SettingsInput",
  ]) {
    assert.match(componente, new RegExp("export function " + primitive + "\\("));
  }

  assert.match(componente, /danger = false/);
  assert.match(componente, /style=\{danger \? rowValueDangerStyle : rowValueStyle\}/);
  assert.match(componente, /<section style=\{sectionStyle\}>/);
  assert.match(componente, /<div style=\{listCardStyle\}>\{children\}<\/div>/);
  assert.match(componente, /<Link href=\{href\} style=\{rowLinkStyle\}>/);
  assert.match(componente, /type="button" onClick=\{onClick\} style=\{rowButtonStyle\}/);
  assert.match(componente, /return <div style=\{rowStaticStyle\}>\{content\}<\/div>;/);
  assert.match(componente, /name="chevronRight" size=\{22\} strokeWidth=\{2\.6\}/);
  assert.match(componente, /className="configuracoes-input configuracoes-input-transparente"/);
  assert.match(componente, /onChange=\{\(event\) => onChange\(event\.target\.value\)\}/);
  assert.match(componente, /style=\{error \? inputErrorStyle : inputHelperStyle\}/);
});

test("estilos das primitives preservam valores e spreads", () => {
  for (const estilo of [
    "safeTextStyle",
    "sectionStyle",
    "sectionTitleStyle",
    "listCardStyle",
    "rowBaseStyle",
    "rowButtonStyle",
    "rowLinkStyle",
    "rowStaticStyle",
    "rowIconStyle",
    "rowTextBoxStyle",
    "rowTitleStyle",
    "rowTitleDangerStyle",
    "rowSubtitleStyle",
    "rowRightStyle",
    "rowValueStyle",
    "rowValueDangerStyle",
    "rowChevronStyle",
    "inputRowStyle",
    "inputTextBoxStyle",
    "inputLabelStyle",
    "inputStyle",
    "inputHelperStyle",
    "inputErrorStyle",
  ]) {
    assert.match(
      estilos,
      new RegExp("export const " + estilo + ": CSSProperties ="),
    );
  }

  assert.match(estilos, /overflowWrap: "anywhere"/);
  assert.match(estilos, /wordBreak: "break-word"/);
  assert.match(estilos, /borderRadius: "18px"/);
  assert.match(estilos, /gridTemplateColumns: "34px minmax\(0, 1fr\) auto 22px"/);
  assert.match(estilos, /gridTemplateColumns: "40px minmax\(0, 1fr\)"/);
  assert.match(estilos, /\.\.\.safeTextStyle,/);
  assert.equal((estilos.match(/\.\.\.rowBaseStyle,/g) || []).length, 3);
  assert.match(estilos, /\.\.\.rowTitleStyle,/);
  assert.match(estilos, /\.\.\.rowValueStyle,/);
  assert.match(estilos, /\.\.\.inputHelperStyle,/);
  assert.doesNotMatch(estilos, /supabase|localStorage|useState|useEffect|window|document|=>/);
});

test("a página delega primitives visuais e preserva a orquestração", () => {
  assert.match(
    pagina,
    /from "\.\/components\/configuracoes-settings-primitives";/,
  );
  assert.match(
    pagina,
    /from "\.\/lib\/configuracoes-settings-primitives-styles";/,
  );

  for (const primitive of [
    "ValorLinha",
    "SectionTitle",
    "SettingsSection",
    "SettingsRow",
    "SettingsInput",
  ]) {
    assert.doesNotMatch(pagina, new RegExp("function " + primitive + "\\("));
  }

  for (const estilo of [
    "safeTextStyle",
    "sectionTitleStyle",
    "listCardStyle",
    "rowBaseStyle",
    "rowButtonStyle",
    "rowLinkStyle",
    "rowStaticStyle",
    "rowIconStyle",
    "rowTextBoxStyle",
    "rowTitleStyle",
    "rowTitleDangerStyle",
    "rowSubtitleStyle",
    "rowRightStyle",
    "rowValueStyle",
    "rowValueDangerStyle",
    "rowChevronStyle",
    "inputRowStyle",
    "inputTextBoxStyle",
    "inputLabelStyle",
    "inputStyle",
    "inputHelperStyle",
    "inputErrorStyle",
  ]) {
    assert.doesNotMatch(
      pagina,
      new RegExp("const " + estilo + ": CSSProperties ="),
    );
  }

  assert.equal((pagina.match(/<SettingsSection/g) || []).length >= 8, true);
  assert.equal((pagina.match(/<SettingsRow/g) || []).length >= 30, true);
  assert.equal((pagina.match(/<SettingsInput/g) || []).length, 3);
  assert.match(pagina, /async function salvar\(/);
  assert.match(pagina, /supabase\./);
  assert.match(
    pagina,
    /from "\.\/lib\/configuracoes-account-deletion-local-cleanup";/,
  );
  assert.match(pagina, /limparDadosLocaisContaExcluida\(usuarioIdLogado\)/);
  assert.doesNotMatch(pagina, /localStorage/);
});
