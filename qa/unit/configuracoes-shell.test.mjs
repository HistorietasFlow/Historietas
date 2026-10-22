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
const securityModalBodyLock = readFileSync(
  new URL(
    "../../app/configuracoes/hooks/use-configuracoes-security-modal-body-lock.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagePresentation = readFileSync(
  new URL(
    "../../app/configuracoes/hooks/use-configuracoes-page-presentation.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageState = readFileSync(
  new URL(
    "../../app/configuracoes/hooks/use-configuracoes-page-state.ts",
    import.meta.url,
  ),
  "utf8",
);
const backupActions = readFileSync(
  new URL(
    "../../app/configuracoes/lib/configuracoes-account-backup-actions.ts",
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
const content = readFileSync(
  new URL(
    "../../app/configuracoes/components/configuracoes-page-content.tsx",
    import.meta.url,
  ),
  "utf8",
);
const loadingState = readFileSync(
  new URL(
    "../../app/configuracoes/components/configuracoes-page-loading-state.tsx",
    import.meta.url,
  ),
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
  assert.match(
    pagina,
    /import \{ ConfiguracoesPageContent \} from "\.\/components\/configuracoes-page-content";/,
  );
  assert.match(
    pagina,
    /import \{ ConfiguracoesPageLoadingState \} from "\.\/components\/configuracoes-page-loading-state";/,
  );
  assert.match(pagina, /<ConfiguracoesPageContent/);
  assert.match(pagina, /<ConfiguracoesPageLoadingState/);

  for (const component of [
    "ConfiguracoesPageHeader",
    "ConfiguracoesSearch",
    "ConfiguracoesProfileCard",
  ]) {
    assert.match(content, new RegExp("import \\{ " + component));
    assert.match(content, new RegExp("<" + component));
  }

  assert.match(content, /from "\.\.\/lib\/configuracoes-shell-styles";/);
  assert.match(
    pagina,
    /from "\.\/hooks\/use-configuracoes-page-presentation";/,
  );
  assert.match(pagina, /useConfiguracoesPagePresentation\(\{/);
  assert.doesNotMatch(pagina, /from "\.\/lib\/configuracoes-security-styles";/);
  assert.match(
    pagePresentation,
    /import \{ pageStyle \} from "\.\.\/lib\/configuracoes-security-styles";/,
  );
  assert.match(pagePresentation, /useHistorietasTheme\(pageStyle\)/);
  assert.match(pagePresentation, /useNotificacoes\(\)/);
  assert.match(pagePresentation, /useHistorietasLanguage\(\)/);
  assert.doesNotMatch(
    pagePresentation,
    /supabase|localStorage|sessionStorage|useState|useEffect|window|document|fetch|JSX/,
  );
  assert.match(content, /<section style=\{containerStyle\}>/);
  assert.match(
    pagina,
    /from "\.\/hooks\/use-configuracoes-page-state";/,
  );
  assert.match(pagina, /\} = useConfiguracoesPageState\(\);/);
  assert.match(pageState, /const \[busca, setBusca\] = useState\(""\);/);
  assert.match(pageState, /const \[salvando, setSalvando\] = useState\(false\);/);
  assert.doesNotMatch(pagina, /const \[busca, setBusca\] = useState\(""\);/);
  assert.match(
    pagina,
    /import \{ criarAcoesConteudoConfiguracoes \} from "\.\/lib\/configuracoes-content-actions";/,
  );
  assert.match(pagina, /onVoltar=\{onVoltar\}/);
  assert.match(pagina, /onBuscaChange=\{setBusca\}/);
  assert.match(pagina, /usuarioNome=\{usuario\?\.nome\}/);
  assert.match(loadingState, /<LoadingSpinner label=\{label\} \/>/);
  assert.match(loadingState, /<style>\{`\$\{themeCss\}\$\{pageCss\}`\}<\/style>/);
  assert.doesNotMatch(
    content,
    /supabase|localStorage|sessionStorage|useState|useEffect|window|document|fetch/,
  );
  assert.doesNotMatch(
    loadingState,
    /supabase|localStorage|sessionStorage|useState|useEffect|window|document|fetch/,
  );
  assert.match(
    pagina,
    /import \{ useConfiguracoesSecurityModalBodyLock \} from "\.\/hooks\/use-configuracoes-security-modal-body-lock";/,
  );
  assert.match(pagina, /useConfiguracoesSecurityModalBodyLock\(\{/);
  assert.doesNotMatch(pagina, /document\.body\.style\.overflow = "hidden"/);
  assert.match(
    pagina,
    /from "\.\/hooks\/use-configuracoes-account-action-handlers";/,
  );
  assert.match(pagina, /useConfiguracoesAccountActionHandlers\(\{/);
  assert.match(accountActionHandlers, /supabase\./);
  assert.match(
    accountActionHandlers,
    /from "\.\.\/lib\/configuracoes-account-deletion-action";/,
  );
  assert.match(
    accountActionHandlers,
    /from "\.\.\/lib\/configuracoes-account-backup-actions";/,
  );
  assert.match(accountActionHandlers, /copiarBackupConfiguracoes\(\{/);
  assert.match(accountActionHandlers, /baixarBackupContaConfiguracoes\(\{/);
  assert.match(accountActionHandlers, /excluirContaConfiguracoes\(\{/);
  assert.doesNotMatch(pagina, /limparDadosLocaisContaExcluida\(usuarioIdLogado\)/);
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

test("ações de backup preservam cópia, download, mensagens e fronteira local", () => {
  assert.match(
    backupActions,
    /export async function copiarBackupConfiguracoes\(/,
  );
  assert.match(
    backupActions,
    /export function baixarBackupContaConfiguracoes\(/,
  );
  assert.match(
    backupActions,
    /import \{ criarBackupLocal \} from "\.\/configuracoes-account-backup";/,
  );
  assert.match(
    backupActions,
    /import \{ baixarBackupConfiguracoes \} from "\.\/configuracoes-account-backup-download";/,
  );
  assert.match(
    backupActions,
    /import \{ copiarTextoConfiguracoes \} from "\.\/configuracoes-copy-utils";/,
  );
  assert.match(backupActions, /setMensagemAcao\(null\)/);
  assert.match(
    backupActions,
    /await copiarTextoConfiguracoes\(criarBackupLocal\(usuarioIdLogado\)\)/,
  );
  assert.match(backupActions, /baixarBackupConfiguracoes\(backup\)/);
  assert.match(backupActions, /Dados copiados para a área de transferência\./);
  assert.match(backupActions, /Backup preparado e download iniciado\./);
  assert.match(backupActions, /Não foi possível copiar os dados\./);
  assert.match(backupActions, /Não foi possível baixar o backup\./);
  assert.doesNotMatch(
    backupActions,
    /supabase|useState|useEffect|window|document|JSX/,
  );
});

test("hook do modal de segurança preserva body lock, Escape e limpeza", () => {
  assert.match(securityModalBodyLock, /^"use client";/);
  assert.match(
    securityModalBodyLock,
    /export function useConfiguracoesSecurityModalBodyLock\(/,
  );
  assert.match(securityModalBodyLock, /!mostrarSeguranca \|\| typeof document === "undefined"/);
  assert.match(securityModalBodyLock, /const overflowAnterior = document\.body\.style\.overflow/);
  assert.match(securityModalBodyLock, /document\.body\.style\.overflow = "hidden"/);
  assert.match(securityModalBodyLock, /event\.key === "Escape" && !salvandoSenha/);
  assert.match(securityModalBodyLock, /setMostrarSeguranca\(false\)/);
  assert.match(securityModalBodyLock, /setSenhaAtual\(""\)/);
  assert.match(securityModalBodyLock, /setNovaSenha\(""\)/);
  assert.match(securityModalBodyLock, /setConfirmarNovaSenha\(""\)/);
  assert.match(securityModalBodyLock, /setErroSenha\(""\)/);
  assert.match(securityModalBodyLock, /setSenhaAlterada\(false\)/);
  assert.match(securityModalBodyLock, /window\.addEventListener\("keydown", fecharComEscape\)/);
  assert.match(securityModalBodyLock, /window\.removeEventListener\("keydown", fecharComEscape\)/);
  assert.match(securityModalBodyLock, /document\.body\.style\.overflow = overflowAnterior/);
  assert.doesNotMatch(
    securityModalBodyLock,
    /supabase|localStorage|sessionStorage|fetch|JSX/,
  );
});
