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
const blockedUsersHook = readFileSync(
  new URL(
    "../../app/configuracoes/hooks/use-configuracoes-blocked-users.ts",
    import.meta.url,
  ),
  "utf8",
);
const accessOrchestrationHook = readFileSync(
  new URL(
    "../../app/configuracoes/hooks/use-configuracoes-access-orchestration.ts",
    import.meta.url,
  ),
  "utf8",
);
const initialAccessHook = readFileSync(
  new URL(
    "../../app/configuracoes/hooks/use-configuracoes-initial-access.ts",
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
const overlays = readFileSync(
  new URL(
    "../../app/configuracoes/components/configuracoes-page-overlays.tsx",
    import.meta.url,
  ),
  "utf8",
);
const acoesCamposOverlay = readFileSync(
  new URL(
    "../../app/configuracoes/lib/configuracoes-overlay-field-actions.ts",
    import.meta.url,
  ),
  "utf8",
);
const profilePrivacySection = readFileSync(
  new URL(
    "../../app/configuracoes/components/configuracoes-profile-privacy-section.tsx",
    import.meta.url,
  ),
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

test("painel de bloqueados preserva lifecycle, confirmação e RPC", () => {
  assert.match(blockedUsersHook, /^"use client";/);
  assert.match(
    blockedUsersHook,
    /export function useConfiguracoesBlockedUsers\(/,
  );
  assert.match(
    blockedUsersHook,
    /from "\.\.\/\.\.\/\.\.\/lib\/supabase\/client";/,
  );
  assert.match(
    blockedUsersHook,
    /from "\.\.\/lib\/configuracoes-blocked-users-loader";/,
  );
  assert.match(
    blockedUsersHook,
    /useState<\s*UsuarioBloqueadoConfiguracoes\[\]\s*>/,
  );
  assert.match(blockedUsersHook, /async function carregarUsuariosBloqueados\(\)/);
  assert.match(blockedUsersHook, /if \(carregandoUsuariosBloqueados\)/);
  assert.match(blockedUsersHook, /function alternarUsuariosBloqueados\(\)/);
  assert.match(blockedUsersHook, /void carregarUsuariosBloqueados\(\)/);
  assert.match(
    blockedUsersHook,
    /async function desbloquearUsuarioConfiguracoes\(/,
  );
  assert.match(blockedUsersHook, /idUsuarioSupabaseValido\(usuarioBloqueado\.userId\)/);
  assert.match(blockedUsersHook, /window\.confirm/);
  assert.match(blockedUsersHook, /supabase\.rpc\(\s*"desbloquear_usuario"/);
  assert.match(blockedUsersHook, /p_bloqueado_id: usuarioBloqueado\.userId/);
  assert.match(blockedUsersHook, /data !== true/);
  assert.match(blockedUsersHook, /usuariosAtuais\.filter/);
  assert.match(blockedUsersHook, /mostrarMensagemAcao\(\s*"sucesso"/);
  assert.match(blockedUsersHook, /setDesbloqueandoUsuarioId\(""\)/);
  assert.doesNotMatch(
    blockedUsersHook,
    /localStorage|sessionStorage|useEffect|JSX/,
  );
});

test("página delega feedback visual e mantém ações e estados", () => {
  assert.match(
    pagina,
    /from "\.\/components\/configuracoes-page-overlays";/,
  );
  assert.match(
    profilePrivacySection,
    /from "\.\/configuracoes-blocked-users-panel";/,
  );
  assert.match(pagina, /<ConfiguracoesPageOverlays/);
  assert.match(overlays, /<ConfiguracoesActionToast/);
  assert.match(pagina, /<ConfiguracoesPageContent/);
  assert.match(content, /<ConfiguracoesProfilePrivacySection/);
  assert.match(profilePrivacySection, /<ConfiguracoesBlockedUsersPanel/);
  assert.match(profilePrivacySection, /onRecarregar=\{onCarregarUsuariosBloqueados\}/);
  assert.match(profilePrivacySection, /onDesbloquear=\{onDesbloquearUsuario\}/);
  assert.match(
    pagina,
    /onCarregarUsuariosBloqueados=\{carregarUsuariosBloqueados\}/,
  );
  assert.match(
    pagina,
    /onDesbloquearUsuario=\{desbloquearUsuarioConfiguracoes\}/,
  );
  assert.match(pagina, /onFecharMensagemAcao=\{onFecharMensagemAcao\}/);
  assert.match(
    acoesCamposOverlay,
    /onFecharMensagemAcao\(\) \{\s+setMensagemAcao\(null\);/,
  );
  assert.match(
    accessOrchestrationHook,
    /from "\.\/use-configuracoes-blocked-users";/,
  );
  assert.match(pagina, /useConfiguracoesAccessOrchestration\(\{/);
  assert.match(accessOrchestrationHook, /useConfiguracoesBlockedUsers\(\{/);
  assert.match(
    accessOrchestrationHook,
    /useConfiguracoesInitialAccess\(\{[\s\S]*?setUsuariosBloqueados: blockedUsers\.setUsuariosBloqueados,[\s\S]*?\}\);/,
  );
  assert.match(
    initialAccessHook,
    /listarUsuariosBloqueadosConfiguracoes\(\)\.catch\(\(\) => \[\]\)/,
  );
  assert.match(
    initialAccessHook,
    /setUsuariosBloqueados\(usuariosBloqueadosCarregados\)/,
  );
  assert.doesNotMatch(pagina, /async function carregarUsuariosBloqueados\(\)/);
  assert.doesNotMatch(pagina, /async function desbloquearUsuarioConfiguracoes\(/);
  assert.match(pagina, /useConfiguracoesActionMessage\(\)/);
  assert.doesNotMatch(pagina, /UsuarioBloqueadoConfiguracoes/);
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
