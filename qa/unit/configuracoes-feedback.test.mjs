import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const toast = readFileSync(
  new URL(
    "../../app/configuracoes/components/configuracoes-action-toast.tsx",
    import.meta.url,
  ),
  "utf8",
);
const blockedUsers = readFileSync(
  new URL(
    "../../app/configuracoes/components/configuracoes-blocked-users-panel.tsx",
    import.meta.url,
  ),
  "utf8",
);
const toastStyles = readFileSync(
  new URL(
    "../../app/configuracoes/lib/configuracoes-action-toast-styles.ts",
    import.meta.url,
  ),
  "utf8",
);
const blockedUsersStyles = readFileSync(
  new URL(
    "../../app/configuracoes/lib/configuracoes-blocked-users-styles.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/configuracoes/page.tsx", import.meta.url),
  "utf8",
);

test("feedback de Configurações preserva toast, acessibilidade e traduções", () => {
  assert.match(toast, /export function ConfiguracoesActionToast\(/);
  assert.match(toast, /role=\{mensagem\.tipo === "erro" \? "alert" : "status"\}/);
  assert.match(toast, /aria-live=\{mensagem\.tipo === "erro" \? "assertive" : "polite"\}/);
  assert.match(toast, /aria-atomic="true"/);
  assert.match(toast, /mensagem\.tipo === "sucesso"/);
  assert.match(toast, /mensagem\.tipo === "aviso"/);
  assert.match(toast, /\? "check"/);
  assert.match(toast, /\? "shield"/);
  assert.match(toast, /: "file"/);
  assert.match(toast, /"Sucesso", "Success", "Éxito"/);
  assert.match(toast, /"Atenção", "Attention", "Atención"/);
  assert.match(toast, /"Fechar mensagem",/);
  assert.match(toast, /onClick=\{onFechar\}/);
});

test("painel de bloqueados preserva fallbacks, ações e estados", () => {
  assert.match(blockedUsers, /export function ConfiguracoesBlockedUsersPanel\(/);
  assert.match(blockedUsers, /import Image from "next\/image";/);
  assert.match(
    blockedUsers,
    /import type \{ UsuarioBloqueadoConfiguracoes \} from "\.\.\/lib\/configuracoes-account-models";/,
  );
  assert.doesNotMatch(
    blockedUsers,
    /type UsuarioBloqueadoConfiguracoesVisual = \{/,
  );
  assert.match(blockedUsers, /onClick=\{\(\) => void onRecarregar\(\)\}/);
  assert.match(blockedUsers, /disabled=\{carregando\}/);
  assert.match(blockedUsers, /!carregando && !erro && usuarios\.length === 0/);
  assert.match(blockedUsers, /usuarioBloqueado\.nome\.trim\(\)\.charAt\(0\)\.toUpperCase\(\) \|\| "U"/);
  assert.match(blockedUsers, /unoptimized/);
  assert.match(blockedUsers, /onClick=\{\(\) => void onDesbloquear\(usuarioBloqueado\)\}/);
  assert.match(blockedUsers, /disabled=\{Boolean\(desbloqueandoUsuarioId\)\}/);
  assert.match(blockedUsers, /"Tentar novamente",/);
  assert.match(blockedUsers, /"Você não bloqueou nenhum usuário\.",/);
  assert.match(blockedUsers, /"Desbloqueando\.\.\.",/);
  assert.match(blockedUsers, /"Desbloquear",/);
});

test("estilos de feedback preservam valores e permanecem puros", () => {
  for (const style of [
    "actionToastBaseStyle",
    "actionToastSuccessStyle",
    "actionToastWarningStyle",
    "actionToastErrorStyle",
    "actionToastIconStyle",
    "actionToastTextBoxStyle",
    "actionToastTitleStyle",
    "actionToastMessageStyle",
    "actionToastCloseStyle",
  ]) {
    assert.match(toastStyles, new RegExp("export const " + style + ": CSSProperties ="));
  }

  for (const style of [
    "blockedUsersPanelStyle",
    "blockedUserRowStyle",
    "blockedUserAvatarStyle",
    "blockedUserAvatarFallbackStyle",
    "blockedUserTextStyle",
    "blockedUserNameStyle",
    "blockedUserUsernameStyle",
    "blockedUserButtonStyle",
    "blockedUserButtonDisabledStyle",
    "blockedUsersEmptyStyle",
    "blockedUsersErrorStyle",
    "blockedUsersRetryButtonStyle",
  ]) {
    assert.match(
      blockedUsersStyles,
      new RegExp("export const " + style + ": CSSProperties ="),
    );
  }

  assert.match(toastStyles, /zIndex: 1400/);
  assert.match(toastStyles, /\.\.\.actionToastBaseStyle,/);
  assert.match(toastStyles, /\.\.\.safeTextStyle,/);
  assert.match(blockedUsersStyles, /gridTemplateColumns: "38px minmax\(0, 1fr\) auto"/);
  assert.match(blockedUsersStyles, /\.\.\.blockedUserButtonStyle,/);

  for (const source of [toastStyles, blockedUsersStyles]) {
    assert.doesNotMatch(source, /supabase|localStorage|useState|useEffect|window|document|=>/);
  }
});

test("página delega feedback visual e mantém ações e estados", () => {
  assert.match(
    pagina,
    /from "\.\/components\/configuracoes-action-toast";/,
  );
  assert.match(
    pagina,
    /from "\.\/components\/configuracoes-blocked-users-panel";/,
  );
  assert.match(pagina, /<ConfiguracoesActionToast/);
  assert.match(pagina, /<ConfiguracoesBlockedUsersPanel/);
  assert.match(pagina, /onRecarregar=\{carregarUsuariosBloqueados\}/);
  assert.match(pagina, /onDesbloquear=\{desbloquearUsuarioConfiguracoes\}/);
  assert.match(pagina, /onFechar=\{\(\) => setMensagemAcao\(null\)\}/);
  assert.match(pagina, /async function carregarUsuariosBloqueados\(\)/);
  assert.match(pagina, /async function desbloquearUsuarioConfiguracoes\(/);
  assert.match(pagina, /useConfiguracoesActionMessage\(\)/);
  assert.match(
    pagina,
    /import type \{ PreferenciasConta, ResumoLocal, UsuarioBloqueadoConfiguracoes \} from "\.\/lib\/configuracoes-account-models";/,
  );
  assert.doesNotMatch(pagina, /type UsuarioBloqueadoConfiguracoes = \{/);

  for (const style of [
    "actionToastBaseStyle",
    "actionToastSuccessStyle",
    "actionToastWarningStyle",
    "actionToastErrorStyle",
    "blockedUsersPanelStyle",
    "blockedUserRowStyle",
    "blockedUsersRetryButtonStyle",
  ]) {
    assert.doesNotMatch(
      pagina,
      new RegExp("const " + style + ": CSSProperties ="),
    );
  }
});
