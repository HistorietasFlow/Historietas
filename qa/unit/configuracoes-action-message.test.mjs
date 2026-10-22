import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hook = readFileSync(
  new URL(
    "../../app/configuracoes/hooks/use-configuracoes-action-message.ts",
    import.meta.url,
  ),
  "utf8",
);
const callbackTypes = readFileSync(
  new URL(
    "../../app/configuracoes/lib/configuracoes-callback-types.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/configuracoes/page.tsx", import.meta.url),
  "utf8",
);
const overlays = readFileSync(
  new URL(
    "../../app/configuracoes/components/configuracoes-page-overlays.tsx",
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
const blockedUsersHook = readFileSync(
  new URL(
    "../../app/configuracoes/hooks/use-configuracoes-blocked-users.ts",
    import.meta.url,
  ),
  "utf8",
);
const preferenceActions = readFileSync(
  new URL(
    "../../app/configuracoes/lib/configuracoes-preference-actions.ts",
    import.meta.url,
  ),
  "utf8",
);
const toast = readFileSync(
  new URL(
    "../../app/configuracoes/components/configuracoes-action-toast.tsx",
    import.meta.url,
  ),
  "utf8",
);
const signOutAction = readFileSync(
  new URL(
    "../../app/configuracoes/lib/configuracoes-sign-out-action.ts",
    import.meta.url,
  ),
  "utf8",
);
const profileSaveAction = readFileSync(
  new URL(
    "../../app/configuracoes/lib/configuracoes-profile-save-action.ts",
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
const acoesCamposOverlay = readFileSync(
  new URL(
    "../../app/configuracoes/lib/configuracoes-overlay-field-actions.ts",
    import.meta.url,
  ),
  "utf8",
);

test("useConfiguracoesActionMessage preserva ID e expiração segura", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /export function useConfiguracoesActionMessage\(\)/);
  assert.match(
    hook,
    /useState<MensagemAcaoConfiguracoes \| null>\(null\)/,
  );
  assert.match(
    hook,
    /from "\.\.\/lib\/configuracoes-callback-types";/,
  );
  assert.match(hook, /function mostrarMensagemAcao\(\s*tipo: TipoMensagemAcaoConfiguracoes,\s*texto: string,/);
  assert.match(hook, /setMensagemAcao\(\(mensagemAtual\) => \(\{/);
  assert.match(hook, /id: \(mensagemAtual\?\.id \?\? 0\) \+ 1,/);
  assert.match(hook, /tipo,/);
  assert.match(hook, /texto,/);
  assert.match(hook, /if \(!mensagemAcao\) \{/);
  assert.match(hook, /const mensagemId = mensagemAcao\.id;/);
  assert.match(hook, /window\.setTimeout\(\(\) => \{/);
  assert.match(hook, /\}, 5000\);/);
  assert.match(hook, /setMensagemAcao\(\(mensagemAtual\) =>/);
  assert.match(
    hook,
    /mensagemAtual\?\.id === mensagemId \? null : mensagemAtual/,
  );
  assert.match(hook, /window\.clearTimeout\(timer\)/);
  assert.match(hook, /\}, \[mensagemAcao\]\);/);
  assert.match(hook, /return \{\s*mensagemAcao,\s*setMensagemAcao,\s*mostrarMensagemAcao,\s*\};/);
});

test("modelos compartilhados da mensagem de ação preservam contratos e consumidores", () => {
  assert.match(
    callbackTypes,
    /export type TipoMensagemAcaoConfiguracoes = "sucesso" \| "erro" \| "aviso";/,
  );
  assert.match(
    callbackTypes,
    /export type MensagemAcaoConfiguracoesVisual = \{\s+tipo: TipoMensagemAcaoConfiguracoes;\s+texto: string;\s+\};/,
  );
  assert.match(
    callbackTypes,
    /export type MensagemAcaoConfiguracoes = MensagemAcaoConfiguracoesVisual & \{\s+id: number;\s+\};/,
  );
  assert.match(
    callbackTypes,
    /export type ExecutarAcaoComArgumentosConfiguracoes<\s+Argumentos extends unknown\[\],\s+> = \(\.\.\.argumentos: Argumentos\) => void;/,
  );
  assert.match(
    callbackTypes,
    /export type MostrarMensagemAcaoConfiguracoes =\s+ExecutarAcaoComArgumentosConfiguracoes<\s+\[TipoMensagemAcaoConfiguracoes, string\]\s+>;/,
  );
  assert.doesNotMatch(
    callbackTypes,
    /React|useState|useEffect|supabase|localStorage|window|document|JSX/,
  );
  assert.match(hook, /MensagemAcaoConfiguracoes,/);
  assert.match(hook, /TipoMensagemAcaoConfiguracoes,/);
  assert.doesNotMatch(hook, /type TipoMensagemAcaoConfiguracoes =/);
  assert.doesNotMatch(hook, /type MensagemAcaoConfiguracoes =/);
  assert.match(toast, /MensagemAcaoConfiguracoesVisual,/);
  assert.doesNotMatch(toast, /type MensagemAcaoConfiguracoesVisual =/);
});

test("Configurações mantém domínio e toast na página", () => {
  assert.match(
    pagina,
    /import \{ useConfiguracoesActionMessage \} from "\.\/hooks\/use-configuracoes-action-message";/,
  );
  assert.match(
    pagina,
    /const \{\s*mensagemAcao,\s*setMensagemAcao,\s*mostrarMensagemAcao,\s*\} = useConfiguracoesActionMessage\(\);/,
  );
  assert.doesNotMatch(
    pagina,
    /useState<MensagemAcaoConfiguracoes \| null>\(null\)/,
  );
  assert.doesNotMatch(pagina, /function mostrarMensagemAcao\(/);
  assert.doesNotMatch(pagina, /\}, 5000\);/);
  assert.doesNotMatch(pagina, /type TipoMensagemAcaoConfiguracoes =/);
  assert.doesNotMatch(pagina, /type MensagemAcaoConfiguracoes =/);

  const chamadasDominio = [
    accountActionHandlers,
    backupActions,
    blockedUsersHook,
    preferenceActions,
    signOutAction,
    profileSaveAction,
  ].flatMap((fonte) => fonte.match(/mostrarMensagemAcao\(/g) || []);
  assert.equal(chamadasDominio.length, 15);
  assert.match(
    pagina,
    /import \{ useConfiguracoesAccountActionHandlers \} from "\.\/hooks\/use-configuracoes-account-action-handlers";/,
  );
  assert.match(pagina, /useConfiguracoesAccountActionHandlers\(\{/);
  assert.match(accountActionHandlers, /from "\.\.\/lib\/configuracoes-account-backup-actions";/);
  assert.match(accountActionHandlers, /from "\.\.\/lib\/configuracoes-profile-save-action";/);
  assert.match(
    pagina,
    /import \{ ConfiguracoesPageOverlays \} from "\.\/components\/configuracoes-page-overlays";/,
  );
  assert.match(pagina, /<ConfiguracoesPageOverlays/);
  assert.match(pagina, /mensagemAcao=\{mensagemAcao\}/);
  assert.match(pagina, /onFecharMensagemAcao=\{onFecharMensagemAcao\}/);
  assert.match(
    acoesCamposOverlay,
    /onFecharMensagemAcao\(\) \{\s+setMensagemAcao\(null\);/,
  );
  assert.match(
    overlays,
    /import \{ ConfiguracoesActionToast \} from "\.\/configuracoes-action-toast";/,
  );
  assert.match(overlays, /<ConfiguracoesActionToast/);
  assert.match(overlays, /mensagem=\{mensagemAcao\}/);
  assert.match(overlays, /onFechar=\{onFecharMensagemAcao\}/);
  assert.match(toast, /onClick=\{onFechar\}/);
  assert.match(toast, /role=\{mensagem\.tipo === "erro" \? "alert" : "status"\}/);
  assert.match(accountActionHandlers, /async function salvar\(/);
  assert.match(accountActionHandlers, /async function alterarSenha\(/);
  assert.match(accountActionHandlers, /async function excluirConta\(/);
  assert.doesNotMatch(pagina, /async function salvar\(/);
  assert.doesNotMatch(pagina, /async function alterarSenha\(/);
  assert.doesNotMatch(pagina, /async function excluirConta\(/);
});

test("ação de saída preserva limpeza, fallback e navegação", () => {
  assert.match(signOutAction, /export async function sairDaContaConfiguracoes/);
  assert.match(signOutAction, /limparMensagem\(\);/);
  assert.match(signOutAction, /const \{ error \} = await encerrarSessao\(\);/);
  assert.match(signOutAction, /if \(error\) \{/);
  assert.match(signOutAction, /mostrarMensagemAcao\(\s*"erro"/);
  assert.match(signOutAction, /N\\u00e3o foi poss\\u00edvel sair da conta agora/);
  assert.match(signOutAction, /redirecionarLogin\(\);\s*atualizarRota\(\);/);
  assert.doesNotMatch(signOutAction, /useState|useEffect|localStorage|supabase\./);
  assert.match(accountActionHandlers, /from "\.\.\/lib\/configuracoes-sign-out-action";/);
  assert.match(accountActionHandlers, /sairDaContaConfiguracoes\(\{/);
  assert.match(accountActionHandlers, /encerrarSessao: \(\) => supabase\.auth\.signOut\(\)/);
  assert.match(accountActionHandlers, /redirecionarLogin: \(\) => router\.replace\("\/login"\)/);
  assert.match(accountActionHandlers, /atualizarRota: \(\) => router\.refresh\(\)/);
});
