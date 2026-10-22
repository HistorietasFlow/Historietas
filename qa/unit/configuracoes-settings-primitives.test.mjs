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
const secaoUso = readFileSync(
  new URL(
    "../../app/configuracoes/components/configuracoes-usage-summary-section.tsx",
    import.meta.url,
  ),
  "utf8",
);
const secaoDados = readFileSync(
  new URL(
    "../../app/configuracoes/components/configuracoes-data-section.tsx",
    import.meta.url,
  ),
  "utf8",
);
const secaoSuporte = readFileSync(
  new URL(
    "../../app/configuracoes/components/configuracoes-support-section.tsx",
    import.meta.url,
  ),
  "utf8",
);
const secaoModeracao = readFileSync(
  new URL(
    "../../app/configuracoes/components/configuracoes-moderation-section.tsx",
    import.meta.url,
  ),
  "utf8",
);
const secaoPreferencias = readFileSync(
  new URL(
    "../../app/configuracoes/components/configuracoes-preferences-section.tsx",
    import.meta.url,
  ),
  "utf8",
);
const secoesAcoesConta = readFileSync(
  new URL(
    "../../app/configuracoes/components/configuracoes-account-actions-section.tsx",
    import.meta.url,
  ),
  "utf8",
);
const secaoPrivacidadePerfil = readFileSync(
  new URL(
    "../../app/configuracoes/components/configuracoes-profile-privacy-section.tsx",
    import.meta.url,
  ),
  "utf8",
);
const secaoVisibilidadeAbas = readFileSync(
  new URL(
    "../../app/configuracoes/components/configuracoes-profile-tab-visibility-section.tsx",
    import.meta.url,
  ),
  "utf8",
);
const secaoPrivacidadeDiario = readFileSync(
  new URL(
    "../../app/configuracoes/components/configuracoes-diary-privacy-section.tsx",
    import.meta.url,
  ),
  "utf8",
);
const secaoConta = readFileSync(
  new URL(
    "../../app/configuracoes/components/configuracoes-account-details-section.tsx",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/configuracoes/page.tsx", import.meta.url),
  "utf8",
);
const content = readFileSync(
  new URL(
    "../../app/configuracoes/components/configuracoes-page-content.tsx",
    import.meta.url,
  ),
  "utf8",
);
const accountActionHandlers = readFileSync(
  new URL(
    "../../app/configuracoes/hooks/use-configuracoes-account-action-handlers.ts",
    import.meta.url,
  ),
  "utf8",
);

test("primitives de Configurações preservam seções, linhas e inputs", () => {
  assert.match(componente, /import Link from "next\/link";/);
  assert.match(componente, /import type \{ ReactNode \} from "react";/);
  assert.match(componente, /AtualizarTextoConfiguracoes/);
  assert.match(componente, /ExecutarAcaoConfiguracoes/);
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
  assert.match(componente, /onChange: AtualizarTextoConfiguracoes;/);
  assert.match(componente, /onClick\?: ExecutarAcaoConfiguracoes;/);
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
    secaoConta,
    /from "\.\/configuracoes-settings-primitives";/,
  );
  assert.doesNotMatch(
    pagina,
    /from "\.\/components\/configuracoes-settings-primitives";/,
  );
  assert.match(
    secoesAcoesConta,
    /from "\.\.\/lib\/configuracoes-settings-primitives-styles";/,
  );
  assert.match(pagina, /<ConfiguracoesPageContent/);
  assert.match(content, /<ConfiguracoesAccountActionsSection/);

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

  const consumidoresPrimitives = [
    pagina,
    secaoUso,
    secaoDados,
    secaoSuporte,
    secaoModeracao,
    secaoPreferencias,
    secoesAcoesConta,
    secaoPrivacidadePerfil,
    secaoVisibilidadeAbas,
    secaoPrivacidadeDiario,
    secaoConta,
  ];
  const totalSecoes = consumidoresPrimitives.reduce(
    (total, source) => total + (source.match(/<SettingsSection/g) || []).length,
    0,
  );
  const totalLinhas = consumidoresPrimitives.reduce(
    (total, source) => total + (source.match(/<SettingsRow/g) || []).length,
    0,
  );

  assert.equal(totalSecoes >= 8, true);
  assert.equal(totalLinhas >= 30, true);
  assert.equal((pagina.match(/<SettingsInput/g) || []).length, 0);
  assert.equal((secaoConta.match(/<SettingsInput/g) || []).length, 3);
  assert.match(
    pagina,
    /from "\.\/hooks\/use-configuracoes-account-action-handlers";/,
  );
  assert.match(pagina, /useConfiguracoesAccountActionHandlers\(\{/);
  assert.match(accountActionHandlers, /async function salvar\(/);
  assert.match(accountActionHandlers, /supabase\./);
  assert.match(
    accountActionHandlers,
    /from "\.\.\/lib\/configuracoes-account-deletion-action";/,
  );
  assert.match(accountActionHandlers, /excluirContaConfiguracoes\(\{/);
  assert.doesNotMatch(pagina, /limparDadosLocaisContaExcluida\(usuarioIdLogado\)/);
  assert.doesNotMatch(pagina, /localStorage/);
});
