import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL(
    "../../app/configuracoes/lib/configuracoes-privacy-preferences.ts",
    import.meta.url,
  ),
  "utf8",
);
const page = readFileSync(
  new URL("../../app/configuracoes/page.tsx", import.meta.url),
  "utf8",
);
const pageStateHook = readFileSync(
  new URL(
    "../../app/configuracoes/hooks/use-configuracoes-page-state.ts",
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
const preferenceActionsHook = readFileSync(
  new URL(
    "../../app/configuracoes/hooks/use-configuracoes-preference-actions.ts",
    import.meta.url,
  ),
  "utf8",
);
const actions = readFileSync(
  new URL(
    "../../app/configuracoes/lib/configuracoes-preference-actions.ts",
    import.meta.url,
  ),
  "utf8",
);
const privacyActions = readFileSync(
  new URL(
    "../../app/configuracoes/lib/configuracoes-privacy-actions.ts",
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

test("preferências de privacidade preservam tipos, defaults e compatibilidade", () => {
  assert.match(
    source,
    /export type PreferenciasPrivacidadeHistorietas = \{/,
  );
  assert.match(
    source,
    /export const preferenciasPrivacidadePadrao: PreferenciasPrivacidadeHistorietas = \{/,
  );

  for (const campo of [
    "perfilPrivado",
    "aprovarNovosSeguidores",
    "visibilidadeObras",
    "visibilidadeSobre",
    "visibilidadeDiario",
    "visibilidadeComunidade",
    "visibilidadeBiblioteca",
    "visibilidadeAtividades",
    "quemPodeComentarDiario",
    "visibilidadeAvaliacaoDiario",
    "mostrarAvaliacaoDiario",
    "permitirAvaliacaoDiario",
    "quemPodeAvaliarDiario",
  ]) {
    assert.match(source, new RegExp(campo));
  }

  assert.match(source, /"historietas-privacidade"/);
  assert.match(source, /"historietas:privacidade-atualizada"/);
  assert.match(source, /registro\.perfilPrivado \?\? registro\.perfil_privado/);
  assert.match(
    source,
    /registro\.visibilidadeAvaliacaoDiario \?\?\s*registro\.visibilidade_avaliacao_diario/,
  );
  assert.match(
    source,
    /registro\.quemPodeAvaliarDiario \?\?\s*registro\.quem_pode_avaliar_diario/,
  );
  assert.match(source, /quemPodeAvaliarDiario !== "ninguem"/);
});

test("preferências de privacidade preservam cache e contratos Supabase", () => {
  assert.match(source, /typeof window === "undefined" \|\| !userId\.trim\(\)/);
  assert.match(source, /localStorage\.getItem\(criarChavePrivacidadeUsuario\(userId\)\)/);
  assert.match(source, /localStorage\.setItem\(/);
  assert.match(source, /new CustomEvent\(PRIVACIDADE_ATUALIZADA_EVENT/);
  assert.match(source, /supabase\s*\.from\("preferencias_privacidade"\)/);
  assert.match(source, /\.eq\("user_id", userIdLimpo\)/);
  assert.match(source, /\.maybeSingle\(\)/);
  assert.match(source, /\.upsert\(/);
  assert.match(source, /\{ onConflict: "user_id" \}/);
  assert.match(source, /const payloadLegado = \{/);
  assert.match(source, /visibilidade_avaliacao_diario:/);
  assert.match(source, /return \{ ok: false, erro: "Usuário inválido\." \};/);
  assert.match(source, /"Não foi possível salvar a privacidade\."/);
});

test("Configurações consome a fronteira de privacidade sem manter duplicação", () => {
  assert.match(
    pageStateHook,
    /import \{\s*preferenciasPrivacidadePadrao,\s*\} from "\.\.\/lib\/configuracoes-privacy-preferences";/,
  );
  assert.match(
    pageStateHook,
    /import type \{\s*PreferenciasPrivacidadeHistorietas,[\s\S]*?\} from "\.\.\/lib\/configuracoes-privacy-preferences";/,
  );

  for (const declaracao of [
    "function normalizarPreferenciasPrivacidade",
    "function carregarPreferenciasPrivacidadeLocal",
    "function salvarPreferenciasPrivacidadeLocal",
    "async function carregarPreferenciasPrivacidade",
    "async function salvarPreferenciasPrivacidade",
  ]) {
    assert.doesNotMatch(page, new RegExp(declaracao));
  }

  assert.match(
    accessOrchestrationHook,
    /import \{ useConfiguracoesInitialAccess \} from "\.\/use-configuracoes-initial-access";/,
  );
  assert.match(
    page,
    /import \{ useConfiguracoesPageState \} from "\.\/hooks\/use-configuracoes-page-state";/,
  );
  assert.match(
    pageStateHook,
    /useState<PreferenciasPrivacidadeHistorietas>\(\s*preferenciasPrivacidadePadrao,\s*\)/,
  );
  assert.match(page, /useConfiguracoesAccessOrchestration\(\{/);
  assert.match(accessOrchestrationHook, /useConfiguracoesInitialAccess\(\{/);
  assert.match(
    initialAccessHook,
    /import \{\s*carregarPreferenciasPrivacidade,\s*\} from "\.\.\/lib\/configuracoes-privacy-preferences";/,
  );
  assert.match(
    initialAccessHook,
    /carregarPreferenciasPrivacidade\(usuarioCarregado\.id, \{\s*usarFallbackLocal: true,\s*\}\)/,
  );
  assert.match(profileSaveAction, /salvarPreferenciasPrivacidade\(/);
  assert.match(profileSaveAction, /salvarPerfilConfiguracoesSupabase\(\{/);
  assert.match(
    page,
    /from "\.\/hooks\/use-configuracoes-account-action-handlers";/,
  );
  assert.match(page, /useConfiguracoesAccountActionHandlers\(\{/);
  assert.match(accountActionHandlers, /salvarConfiguracoesPerfil\(\{/);
  assert.doesNotMatch(page, /salvarPreferenciasPrivacidade\(/);
});

test("ações de preferências preservam estado, persistência e sincronização", () => {
  assert.match(
    actions,
    /export function atualizarPreferenciaConfiguracoes[\s\S]*?criarPreferenciaAtualizadaConfiguracoes/,
  );
  assert.match(
    actions,
    /export function alternarReceberAvisosConfiguracoes[\s\S]*?criarPreferenciasComAvisosAlternadosConfiguracoes/,
  );
  assert.match(actions, /if \(usuarioIdLogado\) \{\s*salvarPreferencias/);
  assert.match(
    actions,
    /export function aplicarPrivacidadeAtualizadaConfiguracoes/,
  );
  assert.match(actions, /setPrivacidade\(privacidadeAtualizada\);/);
  assert.match(actions, /setMensagemAcao\(null\);/);
  assert.match(actions, /const userIdSeguro = usuarioIdLogado\.trim\(\);/);
  assert.match(actions, /void salvarPreferenciasPrivacidade\(/);
  assert.match(actions, /resultado\.ok/);
  assert.match(actions, /"A privacidade ficou salva neste aparelho, mas não sincronizou:"/);
  assert.match(
    actions,
    /"Não foi possível sincronizar a preferência de privacidade:"/,
  );
  assert.match(actions, /The preference was saved only on this device/);
  assert.match(actions, /La preferencia se guardó solo en este dispositivo/);
  assert.doesNotMatch(actions, /useState|useEffect|localStorage|supabase\./);

  assert.match(
    page,
    /from "\.\/hooks\/use-configuracoes-preference-actions";/,
  );
  assert.match(page, /useConfiguracoesPreferenceActions\(\{/);
  assert.match(preferenceActionsHook, /atualizarPreferenciaConfiguracoes\(\{/);
  assert.match(preferenceActionsHook, /alternarReceberAvisosConfiguracoes\(\{/);
  assert.match(preferenceActionsHook, /aplicarPrivacidadeAtualizadaConfiguracoes\(\{/);
  assert.doesNotMatch(page, /void salvarPreferenciasPrivacidade\(/);
  assert.doesNotMatch(page, /criarPreferenciasComAvisosAlternadosConfiguracoes/);
});

test("ações de privacidade preservam as três composições da página", () => {
  assert.match(privacyActions, /export function atualizarPrivacidadeConfiguracoes/);
  assert.match(privacyActions, /criarPrivacidadeAtualizadaConfiguracoes/);
  assert.match(privacyActions, /export function alternarPerfilPrivadoConfiguracoes/);
  assert.match(privacyActions, /criarPrivacidadeComPerfilPrivadoAlternadoConfiguracoes/);
  assert.match(privacyActions, /export function alternarAprovacaoNovosSeguidoresConfiguracoes/);
  assert.match(privacyActions, /criarPrivacidadeComAprovacaoAlternadaConfiguracoes/);
  assert.doesNotMatch(privacyActions, /useState|useEffect|localStorage|supabase\./);
  assert.match(
    page,
    /from "\.\/hooks\/use-configuracoes-preference-actions";/,
  );
  assert.match(preferenceActionsHook, /atualizarPrivacidadeConfiguracoes\(\{/);
  assert.match(preferenceActionsHook, /alternarPerfilPrivadoConfiguracoes\(\{/);
  assert.match(
    preferenceActionsHook,
    /alternarAprovacaoNovosSeguidoresConfiguracoes\(\{/,
  );
});
