import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const copy = readFileSync(new URL("../../app/configuracoes/lib/configuracoes-copy-utils.ts", import.meta.url), "utf8");
const route = readFileSync(new URL("../../app/configuracoes/lib/configuracoes-route-utils.ts", import.meta.url), "utf8");
const backupActions = readFileSync(new URL("../../app/configuracoes/lib/configuracoes-account-backup-actions.ts", import.meta.url), "utf8");
const page = readFileSync(new URL("../../app/configuracoes/page.tsx", import.meta.url), "utf8");
const accountActionHandlers = readFileSync(
  new URL(
    "../../app/configuracoes/hooks/use-configuracoes-account-action-handlers.ts",
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
const accessOrchestrationHook = readFileSync(
  new URL(
    "../../app/configuracoes/hooks/use-configuracoes-access-orchestration.ts",
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

test("cópia de Configurações preserva Clipboard e fallback temporário", () => {
  assert.match(copy, /export async function copiarTextoConfiguracoes\(texto: string\)/);
  assert.match(copy, /navigator\.clipboard\?\.writeText/);
  assert.match(copy, /document\.createElement\("textarea"\)/);
  assert.match(copy, /campoTemporario\.setAttribute\("readonly", "true"\)/);
  assert.match(copy, /document\.execCommand\("copy"\)/);
  assert.match(copy, /campoTemporario\.remove\(\)/);
});

test("rota de login e consumidores de Configurações permanecem idênticos", () => {
  assert.match(route, /export function criarLoginHrefConfiguracoes\(\)/);
  assert.match(route, /redirectTo: "\/configuracoes"/);
  assert.match(route, /return `\/login\?\$\{params\.toString\(\)\}`;/);
  assert.match(
    page,
    /from "\.\/hooks\/use-configuracoes-account-action-handlers";/,
  );
  assert.match(
    accountActionHandlers,
    /from "\.\.\/lib\/configuracoes-account-backup-actions";/,
  );
  assert.match(accountActionHandlers, /from "\.\.\/lib\/configuracoes-route-utils";/);
  assert.match(accountActionHandlers, /from "\.\.\/lib\/configuracoes-profile-save-action";/);
  assert.match(
    accessOrchestrationHook,
    /import \{ useConfiguracoesInitialAccess \} from "\.\/use-configuracoes-initial-access";/,
  );
  assert.match(initialAccessHook, /from "\.\.\/lib\/configuracoes-route-utils";/);
  assert.doesNotMatch(page, /async function copiarTexto\(/);
  assert.doesNotMatch(page, /function criarLoginHrefConfiguracoes\(/);
  assert.doesNotMatch(page, /async function verificarAcesso\(/);
  assert.match(
    page,
    /import \{ useConfiguracoesAccessOrchestration \} from "\.\/hooks\/use-configuracoes-access-orchestration";/,
  );
  assert.match(page, /useConfiguracoesAccessOrchestration\(\{/);
  assert.match(accessOrchestrationHook, /useConfiguracoesInitialAccess\(\{/);
  assert.doesNotMatch(page, /criarLoginHrefConfiguracoes\(/);
  assert.equal(
    (accountActionHandlers.match(/criarLoginHrefConfiguracoes\(/g) || []).length,
    1,
  );
  assert.equal(
    (initialAccessHook.match(/criarLoginHrefConfiguracoes\(\)/g) || []).length,
    2,
  );
  assert.match(profileSaveAction, /redirecionarLogin\(\);/);
  assert.match(
    backupActions,
    /await copiarTextoConfiguracoes\(criarBackupLocal\(usuarioIdLogado\)\)/,
  );
});
