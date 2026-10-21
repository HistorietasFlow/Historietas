import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const header = readFileSync(
  new URL(
    "../../app/configuracoes/components/configuracoes-page-header.tsx",
    import.meta.url,
  ),
  "utf8",
);
const search = readFileSync(
  new URL("../../app/configuracoes/components/configuracoes-search.tsx", import.meta.url),
  "utf8",
);
const profile = readFileSync(
  new URL(
    "../../app/configuracoes/components/configuracoes-profile-card.tsx",
    import.meta.url,
  ),
  "utf8",
);
const styles = readFileSync(
  new URL(
    "../../app/configuracoes/lib/configuracoes-shell-styles.ts",
    import.meta.url,
  ),
  "utf8",
);
const securityStyles = readFileSync(
  new URL(
    "../../app/configuracoes/lib/configuracoes-security-styles.ts",
    import.meta.url,
  ),
  "utf8",
);

test("estilos de segurança preservam modais, privacidade e spreads", () => {
  for (const style of [
    "pageStyle",
    "listCardTransparentStyle",
    "securityOverlayStyle",
    "securityModalStyle",
    "securityModalHeaderStyle",
    "securityModalIconStyle",
    "deleteModalIconStyle",
    "securityModalHeadingStyle",
    "securityModalTitleStyle",
    "securityModalSubtitleStyle",
    "securityCloseButtonStyle",
    "securityCloseButtonDisabledStyle",
    "securityFormStyle",
    "securityFieldStyle",
    "securityFieldLabelStyle",
    "securityPasswordInputStyle",
    "securityHintStyle",
    "securityErrorStyle",
    "securitySuccessStyle",
    "securityFeedbackTextStyle",
    "deleteWarningStyle",
    "deleteWarningListStyle",
    "deletePublicLinkStyle",
    "securityActionsStyle",
    "securityButtonBaseStyle",
    "securitySecondaryButtonStyle",
    "securityPrimaryButtonStyle",
    "deleteDangerButtonStyle",
    "deleteDangerButtonDisabledStyle",
    "securitySecondaryButtonDisabledStyle",
    "securityPrimaryButtonDisabledStyle",
    "securityDoneButtonStyle",
    "privacySelectStyle",
  ]) {
    assert.match(
      securityStyles,
      new RegExp("export const " + style + ": CSSProperties ="),
    );
  }

  assert.match(
    securityStyles,
    /import \{ safeTextStyle \} from "\.\/configuracoes-settings-primitives-styles";/,
  );
  assert.match(securityStyles, /zIndex: 1200/);
  assert.match(securityStyles, /width: "min\(440px, 100%\)"/);
  assert.match(securityStyles, /gridTemplateColumns: "42px minmax\(0, 1fr\) 36px"/);
  assert.match(securityStyles, /transform: "translateX\(22px\)"/);
  assert.equal((securityStyles.match(/\.\.\.safeTextStyle,/g) || []).length, 4);
  assert.equal((securityStyles.match(/\.\.\.securityButtonBaseStyle,/g) || []).length, 3);
  assert.doesNotMatch(
    securityStyles,
    /supabase|localStorage|useState|useEffect|window|document|=>/,
  );
});

const pagina = readFileSync(
  new URL("../../app/configuracoes/page.tsx", import.meta.url),
  "utf8",
);

test("shell de Configurações preserva cabeçalho, busca e perfil", () => {
  assert.match(header, /export function ConfiguracoesPageHeader\(/);
  assert.match(header, /import \{ SvgIcon \} from "\.\/configuracoes-svg-icon";/);
  assert.match(header, /onClick=\{onVoltar\}/);
  assert.match(header, /aria-label=\{traduzirTexto\("Voltar", "Back", "Volver"\)\}/);
  assert.match(header, /name="arrowLeft" size=\{25\} strokeWidth=\{2\.4\}/);
  assert.match(header, /"Configurações e atividade"/);

  assert.match(search, /export function ConfiguracoesSearch\(/);
  assert.match(search, /htmlFor="buscar-configuracoes"/);
  assert.match(search, /id="buscar-configuracoes"/);
  assert.match(search, /className="configuracoes-input configuracoes-input-transparente"/);
  assert.match(search, /onChange=\{\(event\) => onBuscaChange\(event\.target\.value\)\}/);
  assert.match(search, /maxLength=\{80\}/);
  assert.match(search, /autoComplete="off"/);
  assert.match(search, /name="search" size=\{23\} strokeWidth=\{2\.3\}/);

  assert.match(profile, /export function ConfiguracoesProfileCard\(/);
  assert.match(profile, /import \{ obterIniciais \} from "\.\.\/lib\/configuracoes-account-utils";/);
  assert.match(profile, /obterIniciais\(nomeExibicao, emailContato\)/);
  assert.match(profile, /Conta Historietas/);
  assert.match(profile, /Historietas account/);
  assert.match(profile, /Cuenta de Historietas/);
  assert.match(profile, /\? `@\$\{username\}`/);
  assert.match(profile, /@username não definido/);
  assert.match(profile, /E-mail não informado/);
});

test("estilos do shell preservam valores, spreads e fronteira visual", () => {
  for (const style of [
    "containerStyle",
    "headerStyle",
    "backButtonStyle",
    "pageTitleStyle",
    "searchBoxStyle",
    "searchInputStyle",
    "profileCardStyle",
    "avatarStyle",
    "profileTextStyle",
    "profileNameStyle",
    "profileUsernameStyle",
    "profileEmailStyle",
  ]) {
    assert.match(styles, new RegExp("export const " + style + ": CSSProperties ="));
  }

  assert.match(styles, /import \{ safeTextStyle \} from "\.\/configuracoes-settings-primitives-styles";/);
  assert.match(styles, /width: "min\(760px, calc\(100% - 32px\)\)"/);
  assert.match(styles, /gridTemplateColumns: "40px minmax\(0, 1fr\)"/);
  assert.match(styles, /gridTemplateColumns: "52px minmax\(0, 1fr\)"/);
  assert.match(styles, /linear-gradient\(135deg, rgba\(148,163,184,0\.90\), rgba\(75,85,99,0\.95\)\)/);
  assert.equal((styles.match(/\.\.\.safeTextStyle,/g) || []).length, 3);
  assert.doesNotMatch(styles, /supabase|localStorage|useState|useEffect|window|document|=>/);
});

test("a página delega somente o shell visual e preserva a orquestração", () => {
  for (const component of [
    "ConfiguracoesPageHeader",
    "ConfiguracoesSearch",
    "ConfiguracoesProfileCard",
  ]) {
    assert.match(pagina, new RegExp("import \\{ " + component));
    assert.match(pagina, new RegExp("<" + component));
  }

  assert.match(pagina, /from "\.\/lib\/configuracoes-shell-styles";/);
  assert.match(pagina, /from "\.\/lib\/configuracoes-security-styles";/);
  assert.match(pagina, /<section style=\{containerStyle\}>/);
  assert.match(pagina, /const \[busca, setBusca\] = useState\(""\);/);
  assert.match(pagina, /onVoltar=\{\(\) => router\.back\(\)\}/);
  assert.match(pagina, /onBuscaChange=\{setBusca\}/);
  assert.match(pagina, /usuarioNome=\{usuario\?\.nome\}/);
  assert.match(pagina, /supabase\./);
  assert.match(
    pagina,
    /from "\.\/lib\/configuracoes-account-deletion-local-cleanup";/,
  );
  assert.match(pagina, /limparDadosLocaisContaExcluida\(usuarioIdLogado\)/);
  assert.doesNotMatch(pagina, /localStorage/);

  for (const style of [
    "containerStyle",
    "headerStyle",
    "backButtonStyle",
    "pageTitleStyle",
    "searchBoxStyle",
    "searchInputStyle",
    "profileCardStyle",
    "avatarStyle",
    "profileTextStyle",
    "profileNameStyle",
    "profileUsernameStyle",
    "profileEmailStyle",
  ]) {
    assert.doesNotMatch(
      pagina,
      new RegExp("const " + style + ": CSSProperties ="),
    );
  }

  for (const style of [
    "pageStyle",
    "listCardTransparentStyle",
    "securityOverlayStyle",
    "securityModalStyle",
    "securityModalHeaderStyle",
    "securityModalIconStyle",
    "deleteModalIconStyle",
    "securityModalHeadingStyle",
    "securityModalTitleStyle",
    "securityModalSubtitleStyle",
    "securityCloseButtonStyle",
    "securityCloseButtonDisabledStyle",
    "securityFormStyle",
    "securityFieldStyle",
    "securityFieldLabelStyle",
    "securityPasswordInputStyle",
    "securityHintStyle",
    "securityErrorStyle",
    "securitySuccessStyle",
    "securityFeedbackTextStyle",
    "deleteWarningStyle",
    "deleteWarningListStyle",
    "deletePublicLinkStyle",
    "securityActionsStyle",
    "securityButtonBaseStyle",
    "securitySecondaryButtonStyle",
    "securityPrimaryButtonStyle",
    "deleteDangerButtonStyle",
    "deleteDangerButtonDisabledStyle",
    "securitySecondaryButtonDisabledStyle",
    "securityPrimaryButtonDisabledStyle",
    "securityDoneButtonStyle",
    "privacySelectStyle",
  ]) {
    assert.doesNotMatch(
      pagina,
      new RegExp("const " + style + ": CSSProperties ="),
    );
  }
});
