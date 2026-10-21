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
const pagina = readFileSync(
  new URL("../../app/configuracoes/page.tsx", import.meta.url),
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

test("useConfiguracoesActionMessage preserva ID e expiração segura", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /export function useConfiguracoesActionMessage\(\)/);
  assert.match(
    hook,
    /useState<MensagemAcaoConfiguracoes \| null>\(null\)/,
  );
  assert.match(hook, /type TipoMensagemAcaoConfiguracoes = "sucesso" \| "erro" \| "aviso";/);
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
    pagina,
    backupActions,
    blockedUsersHook,
    preferenceActions,
    signOutAction,
    profileSaveAction,
  ].flatMap((fonte) => fonte.match(/mostrarMensagemAcao\(/g) || []);
  assert.equal(chamadasDominio.length, 15);
  assert.match(
    pagina,
    /from "\.\/lib\/configuracoes-account-backup-actions";/,
  );
  assert.match(
    pagina,
    /from "\.\/lib\/configuracoes-profile-save-action";/,
  );
  assert.match(
    pagina,
    /import \{ ConfiguracoesActionToast \} from "\.\/components\/configuracoes-action-toast";/,
  );
  assert.match(pagina, /<ConfiguracoesActionToast/);
  assert.match(pagina, /mensagem=\{mensagemAcao\}/);
  assert.match(pagina, /onFechar=\{\(\) => setMensagemAcao\(null\)\}/);
  assert.match(toast, /onClick=\{onFechar\}/);
  assert.match(toast, /role=\{mensagem\.tipo === "erro" \? "alert" : "status"\}/);
  assert.match(pagina, /function salvar\(/);
  assert.match(pagina, /function alterarSenha\(/);
  assert.match(pagina, /function excluirConta\(/);
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
  assert.match(
    pagina,
    /from "\.\/lib\/configuracoes-sign-out-action";/,
  );
  assert.match(pagina, /sairDaContaConfiguracoes\(\{/);
  assert.match(pagina, /encerrarSessao: \(\) => supabase\.auth\.signOut\(\)/);
  assert.match(pagina, /redirecionarLogin: \(\) => router\.replace\("\/login"\)/);
  assert.match(pagina, /atualizarRota: \(\) => router\.refresh\(\)/);
});
