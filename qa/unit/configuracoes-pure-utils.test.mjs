import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const searchSource = readFileSync(
  new URL(
    "../../app/configuracoes/lib/configuracoes-search-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const accountSource = readFileSync(
  new URL(
    "../../app/configuracoes/lib/configuracoes-account-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const privacySource = readFileSync(
  new URL(
    "../../app/configuracoes/lib/configuracoes-privacy-preferences.ts",
    import.meta.url,
  ),
  "utf8",
);
const callbackTypesSource = readFileSync(
  new URL(
    "../../app/configuracoes/lib/configuracoes-callback-types.ts",
    import.meta.url,
  ),
  "utf8",
);
const callbackPrimitivesSource = readFileSync(
  new URL(
    "../../app/configuracoes/lib/configuracoes-callback-primitives.ts",
    import.meta.url,
  ),
  "utf8",
);
const presentationTypesSource = readFileSync(
  new URL(
    "../../app/configuracoes/lib/configuracoes-presentation-types.ts",
    import.meta.url,
  ),
  "utf8",
);
const feedbackActionTypesSource = readFileSync(
  new URL(
    "../../app/configuracoes/lib/configuracoes-feedback-action-types.ts",
    import.meta.url,
  ),
  "utf8",
);
const preferenceActionTypesSource = readFileSync(
  new URL(
    "../../app/configuracoes/lib/configuracoes-preference-action-types.ts",
    import.meta.url,
  ),
  "utf8",
);
const toggleTypesSource = readFileSync(
  new URL(
    "../../app/configuracoes/lib/configuracoes-toggle-types.ts",
    import.meta.url,
  ),
  "utf8",
);
const accountActionTypesSource = readFileSync(
  new URL(
    "../../app/configuracoes/lib/configuracoes-account-action-types.ts",
    import.meta.url,
  ),
  "utf8",
);
const overlayActionTypesSource = readFileSync(
  new URL(
    "../../app/configuracoes/lib/configuracoes-overlay-action-types.ts",
    import.meta.url,
  ),
  "utf8",
);
const blockedUsersActionTypesSource = readFileSync(
  new URL(
    "../../app/configuracoes/lib/configuracoes-blocked-users-action-types.ts",
    import.meta.url,
  ),
  "utf8",
);
const actionMessageModelsSource = readFileSync(
  new URL(
    "../../app/configuracoes/lib/configuracoes-action-message-models.ts",
    import.meta.url,
  ),
  "utf8",
);
const navigationTypesSource = readFileSync(
  new URL(
    "../../app/configuracoes/lib/configuracoes-navigation-types.ts",
    import.meta.url,
  ),
  "utf8",
);
const adminAccessHookSource = readFileSync(
  new URL(
    "../../app/configuracoes/hooks/use-configuracoes-admin-access.ts",
    import.meta.url,
  ),
  "utf8",
);
const initialAccessHookSource = readFileSync(
  new URL(
    "../../app/configuracoes/hooks/use-configuracoes-initial-access.ts",
    import.meta.url,
  ),
  "utf8",
);
const preferenceActionsHookSource = readFileSync(
  new URL(
    "../../app/configuracoes/hooks/use-configuracoes-preference-actions.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagePresentationHookSource = readFileSync(
  new URL(
    "../../app/configuracoes/hooks/use-configuracoes-page-presentation.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageStateHookSource = readFileSync(
  new URL(
    "../../app/configuracoes/hooks/use-configuracoes-page-state.ts",
    import.meta.url,
  ),
  "utf8",
);
const accessOrchestrationHookSource = readFileSync(
  new URL(
    "../../app/configuracoes/hooks/use-configuracoes-access-orchestration.ts",
    import.meta.url,
  ),
  "utf8",
);
const accountModelsSource = readFileSync(
  new URL(
    "../../app/configuracoes/lib/configuracoes-account-models.ts",
    import.meta.url,
  ),
  "utf8",
);
const errorMessagesSource = readFileSync(
  new URL(
    "../../app/configuracoes/lib/configuracoes-error-messages.ts",
    import.meta.url,
  ),
  "utf8",
);
const storageConstantsSource = readFileSync(
  new URL(
    "../../app/configuracoes/lib/configuracoes-account-storage-constants.ts",
    import.meta.url,
  ),
  "utf8",
);
const localSummarySource = readFileSync(
  new URL(
    "../../app/configuracoes/lib/configuracoes-local-summary-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const profileUtilsSource = readFileSync(
  new URL(
    "../../app/configuracoes/lib/configuracoes-profile-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const accountPreferencesSource = readFileSync(
  new URL(
    "../../app/configuracoes/lib/configuracoes-account-preferences.ts",
    import.meta.url,
  ),
  "utf8",
);
const accountBackupSource = readFileSync(
  new URL(
    "../../app/configuracoes/lib/configuracoes-account-backup.ts",
    import.meta.url,
  ),
  "utf8",
);
const searchVisibilitySource = readFileSync(
  new URL(
    "../../app/configuracoes/lib/configuracoes-search-visibility-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const accountSummarySupabaseSource = readFileSync(
  new URL(
    "../../app/configuracoes/lib/configuracoes-account-summary-supabase.ts",
    import.meta.url,
  ),
  "utf8",
);
const blockedUsersLoaderSource = readFileSync(
  new URL(
    "../../app/configuracoes/lib/configuracoes-blocked-users-loader.ts",
    import.meta.url,
  ),
  "utf8",
);
const profileSupabaseLoaderSource = readFileSync(
  new URL(
    "../../app/configuracoes/lib/configuracoes-profile-supabase-loader.ts",
    import.meta.url,
  ),
  "utf8",
);
const profileSupabaseSaverSource = readFileSync(
  new URL(
    "../../app/configuracoes/lib/configuracoes-profile-supabase-saver.ts",
    import.meta.url,
  ),
  "utf8",
);
const profileSaveActionSource = readFileSync(
  new URL(
    "../../app/configuracoes/lib/configuracoes-profile-save-action.ts",
    import.meta.url,
  ),
  "utf8",
);
const accountDeletionLocalCleanupSource = readFileSync(
  new URL(
    "../../app/configuracoes/lib/configuracoes-account-deletion-local-cleanup.ts",
    import.meta.url,
  ),
  "utf8",
);
const accountDeletionErrorMessagesSource = readFileSync(
  new URL(
    "../../app/configuracoes/lib/configuracoes-account-deletion-error-messages.ts",
    import.meta.url,
  ),
  "utf8",
);
const accountDeletionActionSource = readFileSync(
  new URL(
    "../../app/configuracoes/lib/configuracoes-account-deletion-action.ts",
    import.meta.url,
  ),
  "utf8",
);
const passwordChangeActionSource = readFileSync(
  new URL(
    "../../app/configuracoes/lib/configuracoes-password-change-action.ts",
    import.meta.url,
  ),
  "utf8",
);
const accountBackupDownloadSource = readFileSync(
  new URL(
    "../../app/configuracoes/lib/configuracoes-account-backup-download.ts",
    import.meta.url,
  ),
  "utf8",
);
const accountBackupActionsSource = readFileSync(
  new URL(
    "../../app/configuracoes/lib/configuracoes-account-backup-actions.ts",
    import.meta.url,
  ),
  "utf8",
);
const accountPreferenceStateSource = readFileSync(
  new URL(
    "../../app/configuracoes/lib/configuracoes-account-preference-state-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const privacyPreferenceStateSource = readFileSync(
  new URL(
    "../../app/configuracoes/lib/configuracoes-privacy-preference-state-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const securityFormValidationSource = readFileSync(
  new URL(
    "../../app/configuracoes/lib/configuracoes-security-form-validation.ts",
    import.meta.url,
  ),
  "utf8",
);
const modalStateActionsSource = readFileSync(
  new URL(
    "../../app/configuracoes/lib/configuracoes-modal-state-actions.ts",
    import.meta.url,
  ),
  "utf8",
);
const securityModalStateHookSource = readFileSync(
  new URL(
    "../../app/configuracoes/hooks/use-configuracoes-security-modal-state.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageViewModelHookSource = readFileSync(
  new URL(
    "../../app/configuracoes/hooks/use-configuracoes-page-view-model.ts",
    import.meta.url,
  ),
  "utf8",
);
const blockedUsersHookSource = readFileSync(
  new URL(
    "../../app/configuracoes/hooks/use-configuracoes-blocked-users.ts",
    import.meta.url,
  ),
  "utf8",
);
const accountActionHandlersHookSource = readFileSync(
  new URL(
    "../../app/configuracoes/hooks/use-configuracoes-account-action-handlers.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/configuracoes/page.tsx", import.meta.url),
  "utf8",
);
const secaoConta = readFileSync(
  new URL(
    "../../app/configuracoes/components/configuracoes-account-details-section.tsx",
    import.meta.url,
  ),
  "utf8",
);

function importarTypescript(source) {
  const javascript = typescript.transpileModule(source, {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  }).outputText;

  return import(
    "data:text/javascript;base64," +
      Buffer.from(javascript).toString("base64"),
  );
}

const search = await importarTypescript(searchSource);

test("loader de perfil preserva as duas consultas e fallbacks", () => {
  assert.match(
    profileSupabaseLoaderSource,
    /export async function carregarPerfilConfiguracoesSupabase\(/,
  );
  assert.match(profileSupabaseLoaderSource, /userId\.trim\(\)/);
  assert.match(profileSupabaseLoaderSource, /idUsuarioSupabaseValido\(userIdLimpo\)/);
  assert.equal(
    (profileSupabaseLoaderSource.match(/\.from\("profiles"\)/g) || []).length,
    2,
  );
  assert.match(profileSupabaseLoaderSource, /\.eq\("user_id", userIdLimpo\)/);
  assert.match(profileSupabaseLoaderSource, /\.eq\("id", userIdLimpo\)/);
  assert.equal(
    (profileSupabaseLoaderSource.match(/\.maybeSingle\(\)/g) || []).length,
    2,
  );
  assert.match(profileSupabaseLoaderSource, /normalizarPerfilConfiguracoesSupabase/);
  assert.match(profileSupabaseLoaderSource, /catch \{\s+return null;/);
  assert.doesNotMatch(
    profileSupabaseLoaderSource,
    /\.insert\(|\.update\(|\.delete\(|\.upsert\(|localStorage|useState|useEffect/,
  );
});

test("persistência de perfil preserva busca, atualização, criação e fallbacks", () => {
  assert.match(
    profileSupabaseSaverSource,
    /export async function salvarPerfilConfiguracoesSupabase\(/,
  );
  assert.match(profileSupabaseSaverSource, /userId\.trim\(\)/);
  assert.match(
    profileSupabaseSaverSource,
    /idUsuarioSupabaseValido\(userIdLimpo\)/,
  );
  assert.equal(
    (profileSupabaseSaverSource.match(/\.from\("profiles"\)/g) || []).length,
    4,
  );
  assert.match(profileSupabaseSaverSource, /\.eq\("user_id", userIdLimpo\)/);
  assert.match(profileSupabaseSaverSource, /\.eq\("id", userIdLimpo\)/);
  assert.match(profileSupabaseSaverSource, /\.update\(payloadAtualizacao\)/);
  assert.match(profileSupabaseSaverSource, /\.insert\(\{/);
  assert.match(profileSupabaseSaverSource, /tipo: "leitor"/);
  assert.match(profileSupabaseSaverSource, /avatar_url: ""/);
  assert.match(profileSupabaseSaverSource, /bio: ""/);
  assert.match(profileSupabaseSaverSource, /sobre_bio: ""/);
  assert.match(profileSupabaseSaverSource, /catch \(error\)/);
  assert.doesNotMatch(
    profileSupabaseSaverSource,
    /localStorage|sessionStorage|useState|useEffect|window|document|JSX/,
  );
});

test("limpeza local após exclusão preserva isolamento e fallbacks", () => {
  assert.match(
    accountDeletionLocalCleanupSource,
    /export function limparDadosLocaisContaExcluida\(/,
  );
  assert.match(accountDeletionLocalCleanupSource, /typeof window === "undefined"/);
  assert.match(accountDeletionLocalCleanupSource, /`:\$\{userId\.trim\(\)\}`/);
  assert.match(accountDeletionLocalCleanupSource, /localStorage\.length/);
  assert.match(accountDeletionLocalCleanupSource, /localStorage\.removeItem/);
  assert.match(accountDeletionLocalCleanupSource, /sessionStorage\.length/);
  assert.match(accountDeletionLocalCleanupSource, /sessionStorage\.removeItem/);
  assert.equal(
    (accountDeletionLocalCleanupSource.match(/endsWith\(sufixoUsuario\)/g) || [])
      .length,
    2,
  );
  assert.doesNotMatch(
    accountDeletionLocalCleanupSource,
    /supabase|useState|useEffect|JSX/,
  );
});
const account = await importarTypescript(accountSource);
const errorMessages = await importarTypescript(
  errorMessagesSource.replace(
    /import type \{ HistorietasLanguage \} from "\.\.\/\.\.\/\.\.\/lib\/i18n";\r?\nimport \{ textoIdioma \} from "\.\/configuracoes-search-utils";/,
    `const textoIdioma = (language, portugues, ingles, espanhol) =>
  language === "en" ? ingles : language === "es" ? espanhol : portugues;`,
  ),
);
const accountDeletionErrorMessages = await importarTypescript(
  accountDeletionErrorMessagesSource.replace(
    /import type \{ HistorietasLanguage \} from "\.\.\/\.\.\/\.\.\/lib\/i18n";\r?\nimport \{ textoIdioma \} from "\.\/configuracoes-search-utils";/,
    `const textoIdioma = (language, portugues, ingles, espanhol) =>
  language === "en" ? ingles : language === "es" ? espanhol : portugues;`,
  ),
);
const accountPreferenceState = await importarTypescript(
  accountPreferenceStateSource,
);
const privacyPreferenceState = await importarTypescript(
  privacyPreferenceStateSource,
);
const securityFormValidation = await importarTypescript(
  securityFormValidationSource.replace(
    /import type \{ HistorietasLanguage \} from "\.\.\/\.\.\/\.\.\/lib\/i18n";\r?\nimport \{ textoIdioma \} from "\.\/configuracoes-search-utils";/,
    `const textoIdioma = (language, portugues, ingles, espanhol) =>
  language === "en" ? ingles : language === "es" ? espanhol : portugues;`,
  ),
);
const modalStateActions = await importarTypescript(modalStateActionsSource);

test("busca de Configurações preserva idioma, normalização e aliases", () => {
  assert.equal(search.textoIdioma("pt-BR", "Conta", "Account", "Cuenta"), "Conta");
  assert.equal(search.textoIdioma("en", "Conta", "Account", "Cuenta"), "Account");
  assert.equal(search.textoIdioma("es", "Conta", "Account", "Cuenta"), "Cuenta");
  assert.equal(search.normalizarTextoBuscaConfiguracoes("  PÚBLICO  "), "publico");
  assert.deepEqual(search.ALIASES_BUSCA_CONFIGURACOES.privacidade, ["privacy", "privacidad"]);
  assert.deepEqual(search.ALIASES_BUSCA_CONFIGURACOES.login, ["login", "inicio de sesion"]);
});

test("visibilidade da busca preserva aliases e fallbacks", () => {
  assert.match(
    searchVisibilitySource,
    /export function deveMostrarSecaoConfiguracoes\(/,
  );
  assert.match(searchVisibilitySource, /ALIASES_BUSCA_CONFIGURACOES/);
  assert.match(searchVisibilitySource, /termos\.flatMap/);
  assert.match(searchVisibilitySource, /\.join\(" "\)/);
  assert.match(searchVisibilitySource, /\.includes\(buscaNormalizada\)/);
  assert.doesNotMatch(
    searchVisibilitySource,
    /useState|useEffect|supabase|localStorage|window|document/,
  );
});

test("resumo remoto da conta preserva queries, fallbacks e contagens", () => {
  assert.match(
    accountSummarySupabaseSource,
    /export async function carregarResumoContaSupabase\(/,
  );
  assert.match(
    accountSummarySupabaseSource,
    /async function contarRegistrosResumoSupabase\(/,
  );
  assert.match(accountSummarySupabaseSource, /userId\.trim\(\)/);
  assert.match(accountSummarySupabaseSource, /criarResumoLocal\(userIdLimpo\)/);
  assert.match(accountSummarySupabaseSource, /idUsuarioSupabaseValido\(userIdLimpo\)/);
  assert.match(accountSummarySupabaseSource, /Promise\.all\(\[/);

  for (const tabela of [
    "obras",
    "favoritos",
    "concluidas",
    "seguindo_obras",
    "seguindo_usuarios",
  ]) {
    assert.match(
      accountSummarySupabaseSource,
      new RegExp(`from\\("${tabela}"\\)`),
    );
  }

  assert.match(accountSummarySupabaseSource, /count: "exact", head: true/);
  assert.match(accountSummarySupabaseSource, /console\.warn/);
  assert.doesNotMatch(
    accountSummarySupabaseSource,
    /\.insert\(|\.update\(|\.delete\(|\.upsert\(|localStorage|useState|useEffect/,
  );
});

test("loader de usuários bloqueados preserva RPC e normalização", () => {
  assert.match(
    blockedUsersLoaderSource,
    /export async function listarUsuariosBloqueadosConfiguracoes\(/,
  );
  assert.match(blockedUsersLoaderSource, /supabase\.rpc\(/);
  assert.match(blockedUsersLoaderSource, /"listar_usuarios_bloqueados"/);
  assert.match(blockedUsersLoaderSource, /p_limite: 100/);
  assert.match(blockedUsersLoaderSource, /normalizarUsernameConfiguracoes/);
  assert.match(blockedUsersLoaderSource, /idUsuarioSupabaseValido/);
  assert.match(blockedUsersLoaderSource, /throw error/);
  assert.doesNotMatch(
    blockedUsersLoaderSource,
    /\.insert\(|\.update\(|\.delete\(|\.upsert\(|localStorage|useState|useEffect/,
  );
});

test("identidade de Configurações preserva limpeza, UUID, perfil administrativo e iniciais", () => {
  assert.equal(account.pegarTexto("  nome  "), "nome");
  assert.equal(account.pegarTexto("   ", "Usuário"), "Usuário");
  assert.equal(account.normalizarUsernameConfiguracoes(" @@João Silva__ "), "joao.silva");
  assert.equal(account.idUsuarioSupabaseValido("550e8400-e29b-41d4-a716-446655440000"), true);
  assert.equal(account.idUsuarioSupabaseValido("invalido"), false);
  assert.equal(account.metadataTemAdminConfiguracoes({ roles: ["moderador"] }), true);
  assert.equal(account.metadataTemAdminConfiguracoes({ role: "leitor" }), false);
  assert.equal(account.obterIniciais("Maria Silva", "maria@example.com"), "MS");
  assert.equal(account.obterIniciais("", "autor@example.com"), "AU");
});

test("modelos e traduções de erro de Configurações preservam contratos", () => {
  for (const tipo of [
    "UsuarioConfiguracoes",
    "ResultadoContagemResumoSupabase",
    "TabelaResumoSupabase",
    "PerfilConfiguracoesSupabase",
    "UsuarioBloqueadoConfiguracoesRpcRow",
  ]) {
    assert.match(accountModelsSource, new RegExp("export type " + tipo));
  }

  assert.equal(
    errorMessages.traduzirErroSenhaConfiguracoes("weak password", "pt-BR"),
    "A nova senha não atende aos requisitos de segurança.",
  );
  assert.equal(
    errorMessages.traduzirErroSenhaConfiguracoes("session expired", "en"),
    "For security, sign in again and try changing the password.",
  );
  assert.equal(
    errorMessages.traduzirErroUsernameConfiguracoes("duplicate", "es"),
    "Este @username ya está en uso.",
  );
  assert.equal(
    errorMessages.traduzirErroUsernameConfiguracoes("unknown", "pt-BR"),
    "Não consegui salvar esse @username agora.",
  );
  assert.doesNotMatch(
    errorMessagesSource,
    /supabase|localStorage|useState|useEffect|window|document/,
  );
  assert.match(storageConstantsSource, /CONFIG_STORAGE_KEY = "historietas-configuracoes-conta"/);
  assert.match(storageConstantsSource, /CONFIGURACOES_ATUALIZADAS_EVENT/);
  assert.match(storageConstantsSource, /"historietas-privacidade"/);
  assert.match(localSummarySource, /export function lerStorageUsuarioConfiguracoes/);
  assert.match(localSummarySource, /export function salvarJsonStorageUsuarioConfiguracoes/);
  assert.match(localSummarySource, /export function criarResumoLocal/);
  assert.match(localSummarySource, /typeof window === "undefined"/);
  assert.match(localSummarySource, /new Set\(/);
  assert.match(profileUtilsSource, /export function normalizarPerfilConfiguracoesSupabase/);
  assert.match(profileUtilsSource, /normalizarUsernameConfiguracoes/);
  assert.match(accountPreferencesSource, /export function carregarPreferencias/);
  assert.match(accountPreferencesSource, /export function salvarPreferencias/);
  assert.match(accountPreferencesSource, /new CustomEvent\(CONFIGURACOES_ATUALIZADAS_EVENT/);
  assert.match(accountBackupSource, /export function criarBackupLocal/);
  assert.match(accountBackupSource, /CHAVES_RESUMO\.forEach/);
  assert.match(accountBackupSource, /backup\[CONFIG_STORAGE_KEY\] = carregarPreferencias/);
});

test("mensagens de exclusão de conta preservam idiomas e fallback", () => {
  assert.equal(
    accountDeletionErrorMessages.traduzirErroExclusaoContaConfiguracoes(
      "senha_incorreta",
      "fallback",
      "pt-BR",
    ),
    "A senha atual está incorreta.",
  );
  assert.equal(
    accountDeletionErrorMessages.traduzirErroExclusaoContaConfiguracoes(
      "muitas_tentativas",
      "fallback",
      "en",
    ),
    "Too many confirmation attempts. Wait before trying again.",
  );
  assert.equal(
    accountDeletionErrorMessages.traduzirErroExclusaoContaConfiguracoes(
      "protecao_indisponivel",
      "fallback",
      "es",
    ),
    "No se pudo validar la seguridad de la operación ahora. Inténtalo de nuevo.",
  );
  assert.equal(
    accountDeletionErrorMessages.traduzirErroExclusaoContaConfiguracoes(
      "desconhecido",
      "fallback",
      "pt-BR",
    ),
    "fallback",
  );
  assert.match(accountDeletionErrorMessagesSource, /exclusao_falhou/);
  assert.doesNotMatch(
    accountDeletionErrorMessagesSource,
    /supabase|localStorage|useState|useEffect|window|document/,
  );
});

test("download do backup preserva Blob, URL e limpeza adiada", () => {
  assert.match(
    accountBackupDownloadSource,
    /export function baixarBackupConfiguracoes\(backup: string\)/,
  );
  assert.match(accountBackupDownloadSource, /new Blob\(\[backup\]/);
  assert.match(
    accountBackupDownloadSource,
    /type: "application\/json;charset=utf-8"/,
  );
  assert.match(accountBackupDownloadSource, /URL\.createObjectURL\(arquivo\)/);
  assert.match(
    accountBackupDownloadSource,
    /historietas-backup-\$\{dataAtual\}\.json/,
  );
  assert.match(accountBackupDownloadSource, /document\.body\.appendChild\(link\)/);
  assert.match(accountBackupDownloadSource, /document\.body\.removeChild\(link\)/);
  assert.match(
    accountBackupDownloadSource,
    /window\.setTimeout\(\(\) => URL\.revokeObjectURL\(url\), 0\)/,
  );
  assert.doesNotMatch(
    accountBackupDownloadSource,
    /supabase|localStorage|useState|useEffect|JSX/,
  );
});

test("transições das preferências da conta preservam campos e total", () => {
  const preferencias = {
    nomeExibicao: "Ana",
    username: "ana",
    emailContato: "ana@example.com",
    receberAvisos: true,
  };

  assert.equal(
    accountPreferenceState.calcularTotalBibliotecaConfiguracoes(2, 3, 4),
    9,
  );
  assert.deepEqual(
    accountPreferenceState.criarPreferenciaAtualizadaConfiguracoes(
      preferencias,
      "nomeExibicao",
      "Bea",
    ),
    { ...preferencias, nomeExibicao: "Bea" },
  );
  assert.deepEqual(
    accountPreferenceState.criarPreferenciasComAvisosAlternadosConfiguracoes(
      preferencias,
    ),
    { ...preferencias, receberAvisos: false },
  );
  assert.doesNotMatch(
    accountPreferenceStateSource,
    /supabase|localStorage|useState|useEffect|window|document/,
  );
});

test("transições das preferências de privacidade preservam dependências", () => {
  const privacidade = {
    perfilPrivado: false,
    aprovarNovosSeguidores: true,
    mostrarSeguidores: true,
  };

  assert.deepEqual(
    privacyPreferenceState.criarPrivacidadeAtualizadaConfiguracoes(
      privacidade,
      "mostrarSeguidores",
      false,
    ),
    { ...privacidade, mostrarSeguidores: false },
  );
  assert.deepEqual(
    privacyPreferenceState.criarPrivacidadeComPerfilPrivadoAlternadoConfiguracoes(
      privacidade,
    ),
    { ...privacidade, perfilPrivado: true, aprovarNovosSeguidores: true },
  );
  assert.deepEqual(
    privacyPreferenceState.criarPrivacidadeComAprovacaoAlternadaConfiguracoes(
      privacidade,
    ),
    { ...privacidade, aprovarNovosSeguidores: false, perfilPrivado: false },
  );
  assert.doesNotMatch(
    privacyPreferenceStateSource,
    /supabase|localStorage|useState|useEffect|window|document/,
  );
});

test("validações dos formulários de segurança preservam ordem, idiomas e regras", () => {
  assert.equal(
    securityFormValidation.validarExclusaoContaConfiguracoes("", "EXCLUIR", "pt-BR"),
    "Digite sua senha atual.",
  );
  assert.equal(
    securityFormValidation.validarExclusaoContaConfiguracoes("senha", "delete", "en"),
    "",
  );
  assert.equal(
    securityFormValidation.validarExclusaoContaConfiguracoes("senha", "excluir", "es"),
    "Escribe ELIMINAR exactamente como aparece para confirmar.",
  );
  assert.equal(
    securityFormValidation.validarAlteracaoSenhaConfiguracoes("", "Senha123", "Senha123", "pt-BR"),
    "Digite sua senha atual.",
  );
  assert.equal(
    securityFormValidation.validarAlteracaoSenhaConfiguracoes("Atual123", "Nova1", "Nova1", "en"),
    "The new password must be at least 8 characters long.",
  );
  assert.equal(
    securityFormValidation.validarAlteracaoSenhaConfiguracoes("Atual123", "NovaSenha", "NovaSenha", "es"),
    "Usa al menos una letra y un número en la nueva contraseña.",
  );
  assert.equal(
    securityFormValidation.validarAlteracaoSenhaConfiguracoes("Atual123", "Atual123", "Atual123", "pt-BR"),
    "A nova senha precisa ser diferente da senha atual.",
  );
  assert.equal(
    securityFormValidation.validarAlteracaoSenhaConfiguracoes("Atual123", "NovaSenha1", "OutraSenha1", "en"),
    "The confirmation does not match the new password.",
  );
  assert.equal(
    securityFormValidation.validarAlteracaoSenhaConfiguracoes("Atual123", "NovaSenha1", "NovaSenha1", "pt-BR"),
    "",
  );
  assert.match(securityFormValidationSource, /export function validarExclusaoContaConfiguracoes/);
  assert.match(securityFormValidationSource, /export function validarAlteracaoSenhaConfiguracoes/);
  assert.doesNotMatch(
    securityFormValidationSource,
    /supabase|localStorage|sessionStorage|useState|useEffect|window|document|fetch|JSX/,
  );
});

test("Configurações delega as fronteiras extraídas", () => {
  assert.match(
    pagina,
    /from "\.\/hooks\/use-configuracoes-page-presentation";/,
  );
  assert.match(
    secaoConta,
    /from "\.\.\/lib\/configuracoes-account-utils";/,
  );
  assert.doesNotMatch(pagina, /from "\.\/lib\/configuracoes-account-utils";/);
  assert.match(
    pageStateHookSource,
    /from "\.\.\/lib\/configuracoes-privacy-preferences";/,
  );
  assert.match(
    pagina,
    /from "\.\/hooks\/use-configuracoes-account-action-handlers";/,
  );
  assert.match(
    pageStateHookSource,
    /from "\.\.\/lib\/configuracoes-account-models";/,
  );
  assert.doesNotMatch(
    pagina,
    /from "\.\/lib\/configuracoes-account-storage-constants";/,
  );
  assert.doesNotMatch(
    pagina,
    /from "\.\/lib\/configuracoes-local-summary-utils";/,
  );
  assert.match(
    accessOrchestrationHookSource,
    /from "\.\/use-configuracoes-initial-access";/,
  );
  assert.match(
    accountActionHandlersHookSource,
    /from "\.\.\/lib\/configuracoes-profile-save-action";/,
  );
  assert.match(
    accountActionHandlersHookSource,
    /from "\.\.\/lib\/configuracoes-account-deletion-action";/,
  );
  assert.doesNotMatch(
    pagina,
    /from "\.\/lib\/configuracoes-account-preferences";/,
  );
  assert.match(
    accountActionHandlersHookSource,
    /from "\.\.\/lib\/configuracoes-account-backup-actions";/,
  );
  assert.match(
    pagina,
    /from "\.\/hooks\/use-configuracoes-security-modal-state";/,
  );
  assert.match(
    accessOrchestrationHookSource,
    /from "\.\/use-configuracoes-blocked-users";/,
  );
  assert.match(
    accessOrchestrationHookSource,
    /from "\.\/use-configuracoes-admin-access";/,
  );
  assert.match(
    pagina,
    /from "\.\/hooks\/use-configuracoes-preference-actions";/,
  );
  assert.match(
    accountBackupActionsSource,
    /from "\.\/configuracoes-account-backup";/,
  );
  assert.match(
    accountBackupActionsSource,
    /from "\.\/configuracoes-account-backup-download";/,
  );
  assert.doesNotMatch(
    pagina,
    /from "\.\/lib\/configuracoes-account-preference-state-utils";/,
  );
  assert.doesNotMatch(pagina, /from "\.\/lib\/configuracoes-privacy-actions";/);
  assert.doesNotMatch(
    pagina,
    /from "\.\/lib\/configuracoes-search-visibility-utils";/,
  );
  assert.doesNotMatch(
    pagina,
    /from "\.\/lib\/configuracoes-account-summary-supabase";/,
  );
  assert.match(
    accountActionHandlersHookSource,
    /from "\.\.\/lib\/configuracoes-profile-save-action";/,
  );
  assert.doesNotMatch(
    pagina,
    /from "\.\/lib\/configuracoes-blocked-users-loader";/,
  );

  for (const helper of [
    "textoIdioma",
    "normalizarTextoBuscaConfiguracoes",
    "pegarTexto",
    "normalizarUsernameConfiguracoes",
    "idUsuarioSupabaseValido",
    "metadataTemAdminConfiguracoes",
    "obterIniciais",
    "traduzirErroSenhaConfiguracoes",
    "traduzirErroUsernameConfiguracoes",
    "lerStorageUsuarioConfiguracoes",
    "salvarJsonStorageUsuarioConfiguracoes",
    "criarResumoLocal",
    "normalizarPerfilConfiguracoesSupabase",
    "carregarPreferencias",
    "salvarPreferencias",
    "copiarBackupConfiguracoes",
    "baixarBackupContaConfiguracoes",
    "deveMostrarSecaoConfiguracoes",
    "carregarResumoContaSupabase",
    "listarUsuariosBloqueadosConfiguracoes",
    "carregarPerfilConfiguracoesSupabase",
    "salvarPerfilConfiguracoesSupabase",
    "limparDadosLocaisContaExcluida",
    "traduzirErroExclusaoContaConfiguracoes",
    "excluirContaConfiguracoes",
    "baixarBackupConfiguracoes",
    "calcularTotalBibliotecaConfiguracoes",
    "criarPreferenciaAtualizadaConfiguracoes",
    "criarPreferenciasComAvisosAlternadosConfiguracoes",
    "criarPrivacidadeAtualizadaConfiguracoes",
    "criarPrivacidadeComPerfilPrivadoAlternadoConfiguracoes",
    "criarPrivacidadeComAprovacaoAlternadaConfiguracoes",
    "validarExclusaoContaConfiguracoes",
    "validarAlteracaoSenhaConfiguracoes",
    "abrirExclusaoContaConfiguracoes",
    "fecharExclusaoContaConfiguracoes",
    "abrirSegurancaConfiguracoes",
    "fecharSegurancaConfiguracoes",
  ]) {
    assert.doesNotMatch(pagina, new RegExp("function " + helper + "\\("));
  }

  assert.doesNotMatch(pagina, /function deveMostrar\(/);
  assert.match(
    pagina,
    /import \{ useConfiguracoesPagePresentation \} from "\.\/hooks\/use-configuracoes-page-presentation";/,
  );
  assert.match(pagina, /useConfiguracoesPagePresentation\(\{/);
  assert.doesNotMatch(pagina, /useConfiguracoesPageViewModel\(\{/);
  assert.doesNotMatch(pagina, /useHistorietasTheme\(pageStyle\)/);
  assert.doesNotMatch(pagina, /useNotificacoes\(\)/);
  assert.doesNotMatch(pagina, /useHistorietasLanguage\(\)/);
  assert.match(
    pagina,
    /import \{ useConfiguracoesPageState \} from "\.\/hooks\/use-configuracoes-page-state";/,
  );
  assert.match(pagina, /\} = useConfiguracoesPageState\(\);/);
  assert.doesNotMatch(pagina, /const \[verificandoAcesso, setVerificandoAcesso\] = useState\(true\);/);
  assert.match(pageStateHookSource, /^"use client";/);
  assert.match(pageStateHookSource, /import \{ useState \} from "react";/);
  assert.match(pageStateHookSource, /export function useConfiguracoesPageState\(\)/);
  assert.match(pageStateHookSource, /useState<UsuarioConfiguracoes \| null>\(null\)/);
  assert.match(pageStateHookSource, /useState<PreferenciasConta>\(preferenciasPadrao\)/);
  assert.match(
    pageStateHookSource,
    /useState<PreferenciasPrivacidadeHistorietas>\(\s*preferenciasPrivacidadePadrao,\s*\)/,
  );
  assert.match(pageStateHookSource, /useState<ResumoLocal>\(resumoPadrao\)/);
  for (const state of [
    "verificandoAcesso",
    "usuario",
    "preferencias",
    "privacidade",
    "resumo",
    "erroUsername",
    "salvando",
    "busca",
    "adminLiberado",
  ]) {
    assert.match(pageStateHookSource, new RegExp("\\b" + state + ","));
  }
  assert.doesNotMatch(
    pageStateHookSource,
    /useEffect|useMemo|supabase|localStorage|sessionStorage|window|document|fetch|JSX/,
  );
  assert.match(pagePresentationHookSource, /^"use client";/);
  assert.match(
    pagePresentationHookSource,
    /import \{ useHistorietasTheme \} from "\.\.\/\.\.\/\.\.\/lib\/historietasTheme";/,
  );
  assert.match(
    pagePresentationHookSource,
    /import \{ useNotificacoes \} from "\.\.\/\.\.\/\.\.\/components\/NotificacoesProvider";/,
  );
  assert.match(
    pagePresentationHookSource,
    /import \{ useHistorietasLanguage \} from "\.\.\/\.\.\/\.\.\/components\/HistorietasLanguageProvider";/,
  );
  assert.match(pagePresentationHookSource, /useHistorietasTheme\(pageStyle\)/);
  assert.match(pagePresentationHookSource, /useNotificacoes\(\)/);
  assert.match(pagePresentationHookSource, /useHistorietasLanguage\(\)/);
  assert.match(pagePresentationHookSource, /const usuarioIdLogado = usuario\?\.id \|\| "";/);
  assert.match(pagePresentationHookSource, /useConfiguracoesPageViewModel\(\{/);
  assert.match(
    pagePresentationHookSource,
    /return \{\s+pageThemeStyle,\s+notificacoesNaoLidas,\s+language,\s+usuarioIdLogado,\s+t,\s+deveMostrar,\s+totalBiblioteca,\s+\};/,
  );
  assert.match(pageViewModelHookSource, /^"use client";/);
  assert.match(pageViewModelHookSource, /import \{ useMemo \} from "react";/);
  assert.match(
    pageViewModelHookSource,
    /export function useConfiguracoesPageViewModel\(/,
  );
  assert.match(pageViewModelHookSource, /textoIdioma\(language, portugues, ingles, espanhol\)/);
  assert.match(
    pageViewModelHookSource,
    /deveMostrarSecaoConfiguracoes\(buscaNormalizada, \.\.\.termos\)/,
  );
  assert.match(
    pageViewModelHookSource,
    /calcularTotalBibliotecaConfiguracoes\(\s*resumo\.favoritas,\s*resumo\.concluidas,\s*resumo\.seguindoObras,\s*\)/,
  );
  assert.match(
    pageViewModelHookSource,
    /\[resumo\.concluidas, resumo\.favoritas, resumo\.seguindoObras\]/,
  );
  assert.doesNotMatch(
    pageViewModelHookSource,
    /supabase|localStorage|sessionStorage|window|document|fetch|JSX/,
  );
  assert.doesNotMatch(pagina, /async function contarRegistrosResumoSupabase\(/);
  assert.doesNotMatch(pagina, /async function listarUsuariosBloqueadosConfiguracoes\(/);
  assert.doesNotMatch(pagina, /async function carregarPerfilConfiguracoesSupabase\(/);
  assert.doesNotMatch(pagina, /carregarResumoContaSupabase\(usuarioCarregado\.id\)/);
  assert.doesNotMatch(pagina, /listarUsuariosBloqueadosConfiguracoes\(\)\.catch/);
  assert.doesNotMatch(pagina, /carregarPerfilConfiguracoesSupabase\(data\.user\.id\)/);

  assert.doesNotMatch(
    pagina,
    /async function carregarPreferenciasPrivacidade\(/,
  );
  assert.doesNotMatch(
    pagina,
    /async function salvarPreferenciasPrivacidade\(/,
  );
  assert.match(
    pageStateHookSource,
    /useState<PreferenciasPrivacidadeHistorietas>\(/,
  );
  assert.doesNotMatch(
    pagina,
    /carregarPreferenciasPrivacidade\(usuarioCarregado\.id,/,
  );
  assert.match(profileSaveActionSource, /export async function salvarConfiguracoesPerfil\(/);
  assert.match(profileSaveActionSource, /salvarPerfilConfiguracoesSupabase\(\{/);
  assert.match(profileSaveActionSource, /salvarPreferencias\(preferenciasNormalizadas, userIdSeguro\)/);
  assert.match(profileSaveActionSource, /salvarPreferenciasPrivacidade\(/);
  assert.match(profileSaveActionSource, /supabase\.auth\.getUser\(\)/);
  assert.match(profileSaveActionSource, /supabase\.auth\.updateUser\(\{/);
  assert.match(profileSaveActionSource, /carregarResumoContaSupabase\(userIdSeguro\)/);
  assert.doesNotMatch(pagina, /async function salvarConfiguracoesPerfil\(/);
  assert.doesNotMatch(pagina, /function limparDadosLocaisContaExcluida\(/);
  assert.match(accountActionHandlersHookSource, /salvarConfiguracoesPerfil\(\{/);
  assert.match(accountDeletionActionSource, /export async function excluirContaConfiguracoes\(/);
  assert.match(accountDeletionActionSource, /event\.preventDefault\(\);/);
  assert.match(
    accountDeletionActionSource,
    /validarExclusaoContaConfiguracoes\(\s*senhaExclusaoConta,\s*confirmacaoExclusaoConta,\s*language,/,
  );
  assert.match(accountDeletionActionSource, /fetch\("\/api\/conta\/excluir"/);
  assert.match(accountDeletionActionSource, /credentials: "same-origin"/);
  assert.match(accountDeletionActionSource, /confirmacao: "EXCLUIR"/);
  assert.match(
    accountDeletionActionSource,
    /traduzirErroExclusaoContaConfiguracoes\(/,
  );
  assert.match(
    accountDeletionActionSource,
    /limparDadosLocaisContaExcluida\(usuarioIdLogado\)/,
  );
  assert.match(accountDeletionActionSource, /await supabase\.auth\.signOut\(\)/);
  assert.match(
    accountDeletionActionSource,
    /redirecionarLogin\(\);\s*atualizarRota\(\);/,
  );
  assert.match(accountDeletionActionSource, /finally \{\s*setExcluindoConta\(false\);/);
  assert.doesNotMatch(
    accountDeletionActionSource,
    /useState|useEffect|localStorage|sessionStorage|JSX/,
  );
  assert.doesNotMatch(pagina, /async function excluirContaConfiguracoes\(/);
  assert.match(accountActionHandlersHookSource, /excluirContaConfiguracoes\(\{/);
  assert.match(accountActionHandlersHookSource, /redirecionarLogin: \(\) => router\.replace\("\/login"\)/);
  assert.match(accountActionHandlersHookSource, /atualizarRota: \(\) => router\.refresh\(\)/);
  assert.match(passwordChangeActionSource, /export async function alterarSenhaConfiguracoes\(/);
  assert.match(passwordChangeActionSource, /event\.preventDefault\(\);/);
  assert.match(
    passwordChangeActionSource,
    /if \(salvandoSenha \|\| senhaAlterada\) \{/,
  );
  assert.match(
    passwordChangeActionSource,
    /validarAlteracaoSenhaConfiguracoes\(\s*senhaAtual,\s*novaSenha,\s*confirmarNovaSenha,\s*language,/,
  );
  assert.match(passwordChangeActionSource, /await supabase\.auth\.getUser\(\)/);
  assert.match(
    passwordChangeActionSource,
    /dadosUsuario\.user\.id !== usuarioIdLogado/,
  );
  assert.match(
    passwordChangeActionSource,
    /dadosUsuario\.user\.email\?\.trim\(\)\.toLowerCase\(\) \|\| ""/,
  );
  assert.match(passwordChangeActionSource, /supabase\.auth\.signInWithPassword\(\{/);
  assert.match(passwordChangeActionSource, /password: senhaAtual/);
  assert.match(passwordChangeActionSource, /supabase\.auth\.updateUser\(\{/);
  assert.match(passwordChangeActionSource, /password: novaSenha/);
  assert.match(
    passwordChangeActionSource,
    /traduzirErroSenhaConfiguracoes\(/,
  );
  assert.match(
    passwordChangeActionSource,
    /setSenhaAtual\(""\);\s*setNovaSenha\(""\);\s*setConfirmarNovaSenha\(""\);\s*setSenhaAlterada\(true\);/,
  );
  assert.match(passwordChangeActionSource, /finally \{\s*setSalvandoSenha\(false\);/);
  assert.doesNotMatch(
    passwordChangeActionSource,
    /useState|useEffect|localStorage|sessionStorage|JSX/,
  );
  assert.doesNotMatch(pagina, /async function alterarSenhaConfiguracoes\(/);
  assert.match(accountActionHandlersHookSource, /alterarSenhaConfiguracoes\(\{/);
  assert.match(accountActionHandlersHookSource, /copiarBackupConfiguracoes\(\{/);
  assert.match(accountActionHandlersHookSource, /baixarBackupContaConfiguracoes\(\{/);
  assert.match(pagina, /useConfiguracoesAccountActionHandlers\(\{/);
  assert.match(pagina, /useConfiguracoesSecurityModalState\(\)/);
  assert.match(
    pagina,
    /import \{ useConfiguracoesAccessOrchestration \} from "\.\/hooks\/use-configuracoes-access-orchestration";/,
  );
  assert.match(pagina, /useConfiguracoesAccessOrchestration\(\{/);
  assert.match(accessOrchestrationHookSource, /^"use client";/);
  assert.match(accessOrchestrationHookSource, /useConfiguracoesBlockedUsers\(\{/);
  assert.match(
    accessOrchestrationHookSource,
    /useConfiguracoesInitialAccess\(\{\s*router,\s*setVerificandoAcesso,\s*setUsuario,\s*setPreferencias,\s*setPrivacidade,\s*setResumo,\s*setUsuariosBloqueados: blockedUsers\.setUsuariosBloqueados,\s*\}\);/,
  );
  assert.doesNotMatch(pagina, /async function verificarAcesso\(/);
  assert.match(
    accessOrchestrationHookSource,
    /useConfiguracoesAdminAccess\(\{\s*verificandoAcesso,\s*setAdminLiberado,\s*\}\);/,
  );
  assert.match(accessOrchestrationHookSource, /return blockedUsers;/);
  assert.ok(
    accessOrchestrationHookSource.indexOf("useConfiguracoesBlockedUsers({") <
      accessOrchestrationHookSource.indexOf("useConfiguracoesInitialAccess({") &&
      accessOrchestrationHookSource.indexOf("useConfiguracoesInitialAccess({") <
        accessOrchestrationHookSource.indexOf("useConfiguracoesAdminAccess({"),
  );
  assert.doesNotMatch(
    accessOrchestrationHookSource,
    /supabase|localStorage|sessionStorage|window|document|fetch|JSX/,
  );
  assert.doesNotMatch(pagina, /async function verificarAdmin\(/);
  assert.doesNotMatch(pagina, /function atualizarPreferencia</);
  assert.doesNotMatch(pagina, /function alternarReceberAvisos\(/);
  assert.doesNotMatch(pagina, /function aplicarPrivacidadeAtualizada\(/);
  assert.doesNotMatch(pagina, /function atualizarPrivacidade</);
  assert.doesNotMatch(pagina, /function alternarPerfilPrivado\(/);
  assert.doesNotMatch(pagina, /function alternarAprovacaoNovosSeguidores\(/);
  assert.match(
    pagina,
    /useConfiguracoesPreferenceActions\(\{\s*preferencias,\s*privacidade,\s*usuarioIdLogado,\s*setPreferencias,\s*setPrivacidade,\s*setMensagemAcao,\s*mostrarMensagemAcao,\s*traduzirTexto: t,\s*\}\);/,
  );
  assert.doesNotMatch(pagina, /const confirmacaoEsperada/);
  assert.doesNotMatch(pagina, /!\/\[A-Za-zÀ-ÖØ-öø-ÿ\]\/.test\(novaSenha\)/);
  assert.doesNotMatch(pagina, /localStorage/);
  assert.doesNotMatch(pagina, /supabase\./);
  assert.match(accountActionHandlersHookSource, /supabase\.auth\.signOut\(\)/);
  assert.doesNotMatch(searchSource, /useState|useEffect|supabase|localStorage/);
  assert.doesNotMatch(accountSource, /useState|useEffect|supabase|localStorage/);
  assert.doesNotMatch(privacySource, /useState|useEffect|useMemo/);
});

test("hook de acesso administrativo preserva autenticacao, RPC e cleanup", () => {
  assert.match(adminAccessHookSource, /^"use client";/);
  assert.match(adminAccessHookSource, /import \{ useEffect \} from "react";/);
  assert.match(
    adminAccessHookSource,
    /export function useConfiguracoesAdminAccess\(/,
  );
  assert.match(adminAccessHookSource, /if \(verificandoAcesso\) \{\s*return;/);
  assert.match(adminAccessHookSource, /let cancelado = false;/);
  assert.match(adminAccessHookSource, /async function verificarAdmin\(\)/);
  assert.match(adminAccessHookSource, /await supabase\.auth\.getUser\(\)/);
  assert.match(adminAccessHookSource, /const user = data\.user \|\| null;/);
  assert.match(adminAccessHookSource, /if \(!user \|\| userError\)/);
  assert.match(
    adminAccessHookSource,
    /metadataTemAdminConfiguracoes\(\s*user\.app_metadata as AppMetadataAdminConfiguracoes \| null \| undefined,/,
  );
  assert.match(adminAccessHookSource, /supabase\.rpc\(\s*"usuario_e_admin",/);
  assert.match(
    adminAccessHookSource,
    /error \? adminPeloToken : adminLiberadoResposta === true/,
  );
  assert.match(adminAccessHookSource, /supabase\.auth\.onAuthStateChange\(\(event\) =>/);
  assert.match(
    adminAccessHookSource,
    /if \(event === "SIGNED_OUT"\) \{\s*setAdminLiberado\(false\);\s*return;/,
  );
  assert.match(
    adminAccessHookSource,
    /return \(\) => \{\s*cancelado = true;\s*subscription\.unsubscribe\(\);\s*\};/,
  );
  assert.match(adminAccessHookSource, /\}, \[verificandoAcesso\]\);/);
  assert.doesNotMatch(adminAccessHookSource, /localStorage|sessionStorage|window|document|JSX/);
});

test("hook inicial preserva autenticacao, cargas paralelas e cancelamento", () => {
  assert.match(initialAccessHookSource, /^"use client";/);
  assert.match(initialAccessHookSource, /import \{ useEffect \} from "react";/);
  assert.match(
    initialAccessHookSource,
    /export function useConfiguracoesInitialAccess\(/,
  );
  assert.match(initialAccessHookSource, /let cancelado = false;/);
  assert.match(initialAccessHookSource, /async function verificarAcesso\(\)/);
  assert.match(initialAccessHookSource, /await supabase\.auth\.getUser\(\)/);
  assert.match(initialAccessHookSource, /if \(cancelado\) \{\s*return;/);
  assert.match(
    initialAccessHookSource,
    /if \(error \|\| !data\.user\) \{\s*router\.replace\(criarLoginHrefConfiguracoes\(\)\);/,
  );
  assert.match(
    initialAccessHookSource,
    /carregarPerfilConfiguracoesSupabase\(data\.user\.id\)/,
  );
  assert.match(initialAccessHookSource, /const preferenciasCarregadas = carregarPreferencias\(usuarioCarregado\.id\)/);
  assert.match(initialAccessHookSource, /await Promise\.all\(\[/);
  assert.match(
    initialAccessHookSource,
    /carregarPreferenciasPrivacidade\(usuarioCarregado\.id, \{\s*usarFallbackLocal: true,/,
  );
  assert.match(initialAccessHookSource, /carregarResumoContaSupabase\(usuarioCarregado\.id\)/);
  assert.match(initialAccessHookSource, /listarUsuariosBloqueadosConfiguracoes\(\)\.catch\(\(\) => \[\]\)/);
  assert.match(
    initialAccessHookSource,
    /setUsuario\(usuarioCarregado\);\s*setPrivacidade\(privacidadeCarregada\);\s*setUsuariosBloqueados\(usuariosBloqueadosCarregados\);/,
  );
  assert.match(
    initialAccessHookSource,
    /setResumo\(resumoCarregado\);\s*setVerificandoAcesso\(false\);/,
  );
  assert.match(
    initialAccessHookSource,
    /catch \{\s*if \(!cancelado\) \{\s*router\.replace\(criarLoginHrefConfiguracoes\(\)\);/,
  );
  assert.match(initialAccessHookSource, /return \(\) => \{\s*cancelado = true;\s*\};/);
  assert.match(initialAccessHookSource, /\}, \[router\]\);/);
  assert.doesNotMatch(initialAccessHookSource, /localStorage|sessionStorage|window|document|JSX/);
});

test("hook de acoes de preferencias preserva as composicoes da pagina", () => {
  assert.match(preferenceActionsHookSource, /^"use client";/);
  assert.match(
    preferenceActionsHookSource,
    /export function useConfiguracoesPreferenceActions\(/,
  );
  assert.match(
    preferenceActionsHookSource,
    /from "\.\.\/lib\/configuracoes-preference-actions";/,
  );
  assert.match(
    preferenceActionsHookSource,
    /from "\.\.\/lib\/configuracoes-privacy-actions";/,
  );
  assert.match(
    preferenceActionsHookSource,
    /atualizarPreferenciaConfiguracoes\(\{\s*campo,\s*valor,\s*setPreferencias,\s*\}\)/,
  );
  assert.match(
    preferenceActionsHookSource,
    /alternarReceberAvisosConfiguracoes\(\{\s*preferencias,\s*setPreferencias,\s*usuarioIdLogado,\s*\}\)/,
  );
  assert.match(
    preferenceActionsHookSource,
    /aplicarPrivacidadeAtualizadaConfiguracoes\(\{[\s\S]*?privacidadeAtualizada,[\s\S]*?setPrivacidade,[\s\S]*?setMensagemAcao,[\s\S]*?usuarioIdLogado,[\s\S]*?mostrarMensagemAcao,[\s\S]*?traduzirTexto,[\s\S]*?\}\)/,
  );
  assert.match(
    preferenceActionsHookSource,
    /atualizarPrivacidadeConfiguracoes\(\{\s*privacidade,\s*campo,\s*valor,\s*aplicarPrivacidadeAtualizada,\s*\}\)/,
  );
  assert.match(
    preferenceActionsHookSource,
    /alternarPerfilPrivadoConfiguracoes\(\{\s*privacidade,\s*aplicarPrivacidadeAtualizada,\s*\}\)/,
  );
  assert.match(
    preferenceActionsHookSource,
    /alternarAprovacaoNovosSeguidoresConfiguracoes\(\{\s*privacidade,\s*aplicarPrivacidadeAtualizada,\s*\}\)/,
  );
  assert.match(
    preferenceActionsHookSource,
    /return \{[\s\S]*?atualizarPreferencia,[\s\S]*?alternarReceberAvisos,[\s\S]*?aplicarPrivacidadeAtualizada,[\s\S]*?atualizarPrivacidade,[\s\S]*?alternarPerfilPrivado,[\s\S]*?alternarAprovacaoNovosSeguidores,[\s\S]*?\};/,
  );
  assert.doesNotMatch(
    preferenceActionsHookSource,
    /supabase|localStorage|sessionStorage|window|document|JSX/,
  );
});

test("ações dos modais preservam resets, guardas e fronteira local", () => {
  const chamadas = [];
  const acoesExclusao = {
    setSenhaExclusaoConta: (valor) => chamadas.push(["senhaExclusao", valor]),
    setConfirmacaoExclusaoConta: (valor) =>
      chamadas.push(["confirmacaoExclusao", valor]),
    setErroExclusaoConta: (valor) => chamadas.push(["erroExclusao", valor]),
    setMostrarExclusaoConta: (valor) =>
      chamadas.push(["mostrarExclusao", valor]),
  };
  const acoesSeguranca = {
    setSenhaAtual: (valor) => chamadas.push(["senhaAtual", valor]),
    setNovaSenha: (valor) => chamadas.push(["novaSenha", valor]),
    setConfirmarNovaSenha: (valor) =>
      chamadas.push(["confirmarNovaSenha", valor]),
    setErroSenha: (valor) => chamadas.push(["erroSenha", valor]),
    setSenhaAlterada: (valor) => chamadas.push(["senhaAlterada", valor]),
    setMostrarSeguranca: (valor) => chamadas.push(["mostrarSeguranca", valor]),
  };

  modalStateActions.abrirExclusaoContaConfiguracoes(acoesExclusao);
  modalStateActions.abrirSegurancaConfiguracoes(acoesSeguranca);
  assert.deepEqual(chamadas, [
    ["senhaExclusao", ""],
    ["confirmacaoExclusao", ""],
    ["erroExclusao", ""],
    ["mostrarExclusao", true],
    ["senhaAtual", ""],
    ["novaSenha", ""],
    ["confirmarNovaSenha", ""],
    ["erroSenha", ""],
    ["senhaAlterada", false],
    ["mostrarSeguranca", true],
  ]);

  chamadas.length = 0;
  modalStateActions.fecharExclusaoContaConfiguracoes({
    ...acoesExclusao,
    excluindoConta: true,
  });
  modalStateActions.fecharSegurancaConfiguracoes({
    ...acoesSeguranca,
    salvandoSenha: true,
  });
  assert.deepEqual(chamadas, []);

  modalStateActions.fecharExclusaoContaConfiguracoes({
    ...acoesExclusao,
    excluindoConta: false,
  });
  modalStateActions.fecharSegurancaConfiguracoes({
    ...acoesSeguranca,
    salvandoSenha: false,
  });
  assert.deepEqual(chamadas, [
    ["mostrarExclusao", false],
    ["senhaExclusao", ""],
    ["confirmacaoExclusao", ""],
    ["erroExclusao", ""],
    ["mostrarSeguranca", false],
    ["senhaAtual", ""],
    ["novaSenha", ""],
    ["confirmarNovaSenha", ""],
    ["erroSenha", ""],
    ["senhaAlterada", false],
  ]);

  for (const helper of [
    "abrirExclusaoContaConfiguracoes",
    "fecharExclusaoContaConfiguracoes",
    "abrirSegurancaConfiguracoes",
    "fecharSegurancaConfiguracoes",
  ]) {
    assert.match(modalStateActionsSource, new RegExp("export function " + helper));
  }
  assert.doesNotMatch(
    modalStateActionsSource,
    /supabase|localStorage|sessionStorage|useState|useEffect|window|document|fetch|JSX/,
  );
});

test("hook dos modais preserva os estados e delega as transições puras", () => {
  assert.match(securityModalStateHookSource, /^"use client";/);
  assert.match(
    securityModalStateHookSource,
    /import \{ useState \} from "react";/,
  );
  assert.match(
    securityModalStateHookSource,
    /from "\.\.\/lib\/configuracoes-modal-state-actions";/,
  );
  assert.match(
    securityModalStateHookSource,
    /export function useConfiguracoesSecurityModalState\(\)/,
  );

  for (const state of [
    "mostrarSeguranca",
    "senhaAtual",
    "novaSenha",
    "confirmarNovaSenha",
    "salvandoSenha",
    "erroSenha",
    "senhaAlterada",
    "mostrarExclusaoConta",
    "senhaExclusaoConta",
    "confirmacaoExclusaoConta",
    "excluindoConta",
    "erroExclusaoConta",
  ]) {
    assert.match(
      securityModalStateHookSource,
      new RegExp("const \\[" + state + ", set"),
    );
  }

  for (const action of [
    "abrirExclusaoConta",
    "fecharExclusaoConta",
    "abrirSeguranca",
    "fecharSeguranca",
  ]) {
    assert.match(securityModalStateHookSource, new RegExp("function " + action));
    assert.match(securityModalStateHookSource, new RegExp("\\n    " + action + ","));
  }

  assert.doesNotMatch(
    securityModalStateHookSource,
    /supabase|localStorage|sessionStorage|window|document|fetch|JSX/,
  );
  assert.doesNotMatch(pagina, /const \[mostrarSeguranca, setMostrarSeguranca\]/);
  assert.doesNotMatch(pagina, /function abrirSeguranca\(\)/);
  assert.doesNotMatch(pagina, /function fecharExclusaoConta\(\)/);
});

test("hook de bloqueados preserva a fronteira de estado e interação", () => {
  assert.match(blockedUsersHookSource, /^"use client";/);
  assert.match(
    blockedUsersHookSource,
    /export function useConfiguracoesBlockedUsers\(/,
  );
  assert.match(
    blockedUsersHookSource,
    /import type \{ UsuarioBloqueadoConfiguracoes \}/,
  );
  assert.match(blockedUsersHookSource, /listarUsuariosBloqueadosConfiguracoes/);
  assert.match(blockedUsersHookSource, /idUsuarioSupabaseValido/);
  assert.match(blockedUsersHookSource, /supabase\.rpc/);
  assert.match(blockedUsersHookSource, /window\.confirm/);
  assert.doesNotMatch(
    blockedUsersHookSource,
    /localStorage|sessionStorage|useEffect|JSX/,
  );
});

test("contratos de callback compartilhados preservam assinaturas e consumidores", () => {
  assert.match(
    presentationTypesSource,
    /export type TraduzirTextoConfiguracoes = \(\s+portugues: string,\s+ingles: string,\s+espanhol: string,\s+\) => string;/,
  );
  assert.match(
    actionMessageModelsSource,
    /export type TipoMensagemAcaoConfiguracoes = "sucesso" \| "erro" \| "aviso";/,
  );
  assert.match(
    actionMessageModelsSource,
    /export type MensagemAcaoConfiguracoesVisual = \{\s+tipo: TipoMensagemAcaoConfiguracoes;\s+texto: string;\s+\};/,
  );
  assert.match(
    actionMessageModelsSource,
    /export type MensagemAcaoConfiguracoes = MensagemAcaoConfiguracoesVisual & \{\s+id: number;\s+\};/,
  );
  assert.match(
    feedbackActionTypesSource,
    /import type \{ TipoMensagemAcaoConfiguracoes \} from "\.\/configuracoes-action-message-models";/,
  );
  assert.match(
    callbackPrimitivesSource,
    /export type ExecutarAcaoComArgumentosConfiguracoes<\s+Argumentos extends unknown\[\],\s+> = \(\.\.\.argumentos: Argumentos\) => void;/,
  );
  assert.match(
    callbackTypesSource,
    /export type \{\s+AtualizarCampoConfiguracoes,\s+AtualizarTextoConfiguracoes,\s+AtualizarValorConfiguracoes,\s+ExecutarAcaoAssincronaComArgumentoConfiguracoes,\s+ExecutarAcaoAssincronaConfiguracoes,\s+ExecutarAcaoComArgumentosConfiguracoes,\s+ExecutarAcaoConfiguracoes,\s+VerificarCondicaoConfiguracoes,\s+\} from "\.\/configuracoes-callback-primitives";/,
  );
  assert.match(
    callbackTypesSource,
    /export type \{\s+AtualizarBuscaConfiguracoes,\s+DeveMostrarConfiguracoes,\s+TraduzirTextoConfiguracoes,\s+\} from "\.\/configuracoes-presentation-types";/,
  );
  assert.match(
    callbackTypesSource,
    /export type \{\s+LimparMensagemAcaoConfiguracoes,\s+MostrarMensagemAcaoConfiguracoes,\s+\} from "\.\/configuracoes-feedback-action-types";/,
  );
  assert.match(
    callbackTypesSource,
    /export type \{\s+AplicarPrivacidadeAtualizadaConfiguracoes,\s+AtualizarPreferenciaConfiguracoes,\s+AtualizarPrivacidadeConfiguracoes,\s+\} from "\.\/configuracoes-preference-action-types";/,
  );
  assert.match(
    callbackTypesSource,
    /export type \{\s+AlternarAprovacaoNovosSeguidoresConfiguracoes,\s+AlternarConfiguracao,\s+AlternarPerfilPrivadoConfiguracoes,\s+AlternarReceberAvisosConfiguracoes,\s+AlternarUsuariosBloqueadosConfiguracoes,\s+\} from "\.\/configuracoes-toggle-types";/,
  );
  assert.match(
    callbackTypesSource,
    /export type \{\s+LimparErroUsernameConfiguracoes,\s+SalvarConfiguracoes,\s+SairDaContaConfiguracoes,\s+CopiarBackupConfiguracoes,\s+BaixarBackupConfiguracoes,\s+\} from "\.\/configuracoes-account-action-types";/,
  );
  assert.match(
    callbackTypesSource,
    /export type \{\s+AbrirSegurancaConfiguracoes,\s+AbrirExclusaoContaConfiguracoes,\s+FecharOverlayConfiguracoes,\s+EnviarFormularioConfiguracoes,\s+AtualizarBooleanoConfiguracoes,\s+\} from "\.\/configuracoes-overlay-action-types";/,
  );
  assert.match(
    callbackTypesSource,
    /export type \{\s+CarregarUsuariosBloqueadosConfiguracoes,\s+DesbloquearUsuarioConfiguracoes,\s+\} from "\.\/configuracoes-blocked-users-action-types";/,
  );
  assert.match(
    presentationTypesSource,
    /import type \{\s+AtualizarTextoConfiguracoes,\s+VerificarCondicaoConfiguracoes,\s+\} from "\.\/configuracoes-callback-primitives";/,
  );
  assert.match(
    feedbackActionTypesSource,
    /export type MostrarMensagemAcaoConfiguracoes =\s+ExecutarAcaoComArgumentosConfiguracoes<\s+\[TipoMensagemAcaoConfiguracoes, string\]\s+>;/,
  );
  assert.match(
    callbackPrimitivesSource,
    /export type VerificarCondicaoConfiguracoes<Argumentos extends unknown\[\]> = \(\s+\.\.\.argumentos: Argumentos\s+\) => boolean;/,
  );
  assert.match(
    presentationTypesSource,
    /export type DeveMostrarConfiguracoes =\s+VerificarCondicaoConfiguracoes<string\[\]>;/,
  );
  assert.match(
    callbackPrimitivesSource,
    /export type AtualizarCampoConfiguracoes<Objeto> = <K extends keyof Objeto>\(\s+campo: K,\s+valor: Objeto\[K\],\s+\) => void;/,
  );
  assert.match(
    preferenceActionTypesSource,
    /export type AtualizarPreferenciaConfiguracoes =\s+AtualizarCampoConfiguracoes<PreferenciasConta>;/,
  );
  assert.match(
    preferenceActionTypesSource,
    /export type AtualizarPrivacidadeConfiguracoes =\s+AtualizarCampoConfiguracoes<PreferenciasPrivacidadeHistorietas>;/,
  );
  assert.match(
    callbackPrimitivesSource,
    /export type ExecutarAcaoConfiguracoes = \(\) => void;/,
  );
  assert.match(
    toggleTypesSource,
    /export type AlternarConfiguracao = ExecutarAcaoConfiguracoes;/,
  );
  assert.match(
    toggleTypesSource,
    /export type AlternarPerfilPrivadoConfiguracoes = AlternarConfiguracao;/,
  );
  assert.match(
    toggleTypesSource,
    /export type AlternarAprovacaoNovosSeguidoresConfiguracoes =\s+AlternarConfiguracao;/,
  );
  assert.match(
    preferenceActionTypesSource,
    /export type AplicarPrivacidadeAtualizadaConfiguracoes =\s+AtualizarValorConfiguracoes<PreferenciasPrivacidadeHistorietas>;/,
  );
  assert.match(
    accountActionTypesSource,
    /export type LimparErroUsernameConfiguracoes = ExecutarAcaoConfiguracoes;/,
  );
  assert.match(
    accountActionTypesSource,
    /export type SalvarConfiguracoes = ExecutarAcaoConfiguracoes;/,
  );
  assert.match(
    overlayActionTypesSource,
    /export type AbrirSegurancaConfiguracoes = ExecutarAcaoConfiguracoes;/,
  );
  assert.match(
    overlayActionTypesSource,
    /export type AbrirExclusaoContaConfiguracoes = ExecutarAcaoConfiguracoes;/,
  );
  assert.match(
    accountActionTypesSource,
    /export type SairDaContaConfiguracoes = ExecutarAcaoConfiguracoes;/,
  );
  assert.match(
    overlayActionTypesSource,
    /export type FecharOverlayConfiguracoes = ExecutarAcaoConfiguracoes;/,
  );
  assert.match(
    overlayActionTypesSource,
    /export type EnviarFormularioConfiguracoes =\s+FormEventHandler<HTMLFormElement>;/,
  );
  assert.match(
    callbackPrimitivesSource,
    /export type AtualizarValorConfiguracoes<Valor> = \(valor: Valor\) => void;/,
  );
  assert.match(
    callbackPrimitivesSource,
    /export type AtualizarTextoConfiguracoes = AtualizarValorConfiguracoes<string>;/,
  );
  assert.match(
    presentationTypesSource,
    /export type AtualizarBuscaConfiguracoes = AtualizarTextoConfiguracoes;/,
  );
  assert.match(
    callbackPrimitivesSource,
    /export type ExecutarAcaoAssincronaConfiguracoes = \(\) => Promise<void>;/,
  );
  assert.match(
    blockedUsersActionTypesSource,
    /export type CarregarUsuariosBloqueadosConfiguracoes =\s+ExecutarAcaoAssincronaConfiguracoes;/,
  );
  assert.match(
    toggleTypesSource,
    /export type AlternarUsuariosBloqueadosConfiguracoes = AlternarConfiguracao;/,
  );
  assert.match(
    callbackPrimitivesSource,
    /export type ExecutarAcaoAssincronaComArgumentoConfiguracoes<Argumento> = \(\s+argumento: Argumento,\s+\) => Promise<void>;/,
  );
  assert.match(
    blockedUsersActionTypesSource,
    /export type DesbloquearUsuarioConfiguracoes =\s+ExecutarAcaoAssincronaComArgumentoConfiguracoes<UsuarioBloqueadoConfiguracoes>;/,
  );
  assert.doesNotMatch(
    callbackTypesSource,
    /supabase|localStorage|sessionStorage|useState|useEffect|window|document|fetch|JSX/,
  );
  assert.doesNotMatch(
    actionMessageModelsSource,
    /React|supabase|localStorage|sessionStorage|useState|useEffect|window|document|fetch|JSX/,
  );
  assert.doesNotMatch(
    callbackPrimitivesSource,
    /React|supabase|localStorage|sessionStorage|useState|useEffect|window|document|fetch|JSX/,
  );
  for (const source of [
    feedbackActionTypesSource,
    preferenceActionTypesSource,
    toggleTypesSource,
    accountActionTypesSource,
    overlayActionTypesSource,
    blockedUsersActionTypesSource,
  ]) {
    assert.doesNotMatch(
      source,
      /React|supabase|localStorage|sessionStorage|useState|useEffect|window|document|fetch|JSX/,
    );
  }

  for (const arquivo of [
    "hooks/use-configuracoes-account-action-handlers.ts",
    "hooks/use-configuracoes-blocked-users.ts",
    "hooks/use-configuracoes-preference-actions.ts",
    "lib/configuracoes-account-backup-actions.ts",
    "lib/configuracoes-account-deletion-action.ts",
    "lib/configuracoes-password-change-action.ts",
    "lib/configuracoes-preference-actions.ts",
    "lib/configuracoes-profile-save-action.ts",
    "lib/configuracoes-sign-out-action.ts",
    "components/configuracoes-account-deletion-modal.tsx",
    "components/configuracoes-account-details-section.tsx",
    "components/configuracoes-account-actions-section.tsx",
    "components/configuracoes-action-toast.tsx",
    "components/configuracoes-blocked-users-panel.tsx",
    "components/configuracoes-page-content.tsx",
    "components/configuracoes-page-header.tsx",
    "components/configuracoes-page-overlays.tsx",
    "components/configuracoes-data-section.tsx",
    "components/configuracoes-diary-privacy-section.tsx",
    "components/configuracoes-moderation-section.tsx",
    "components/configuracoes-preferences-section.tsx",
    "components/configuracoes-profile-privacy-section.tsx",
    "components/configuracoes-profile-card.tsx",
    "components/configuracoes-profile-tab-visibility-section.tsx",
    "components/configuracoes-search.tsx",
    "components/configuracoes-security-password-modal.tsx",
    "components/configuracoes-support-section.tsx",
    "components/configuracoes-usage-summary-section.tsx",
  ]) {
    const source = readFileSync(
      new URL("../../app/configuracoes/" + arquivo, import.meta.url),
      "utf8",
    );
    assert.match(source, /configuracoes-callback-types/);
    assert.doesNotMatch(source, /type TraduzirTextoConfiguracoes/);
    assert.doesNotMatch(source, /type TraduzirTexto =/);
  }

  const actionMessageHookSource = readFileSync(
    new URL(
      "../../app/configuracoes/hooks/use-configuracoes-action-message.ts",
      import.meta.url,
    ),
    "utf8",
  );
  assert.match(
    actionMessageHookSource,
    /configuracoes-action-message-models/,
  );
  assert.doesNotMatch(actionMessageHookSource, /configuracoes-callback-types/);
});

test("contratos de apresentacao compartilhados preservam filtro e atualizacoes", () => {
  for (const arquivo of [
    "components/configuracoes-account-actions-section.tsx",
    "components/configuracoes-account-details-section.tsx",
    "components/configuracoes-data-section.tsx",
    "components/configuracoes-diary-privacy-section.tsx",
    "components/configuracoes-moderation-section.tsx",
    "components/configuracoes-page-content.tsx",
    "components/configuracoes-preferences-section.tsx",
    "components/configuracoes-profile-privacy-section.tsx",
    "components/configuracoes-profile-tab-visibility-section.tsx",
    "components/configuracoes-support-section.tsx",
    "components/configuracoes-usage-summary-section.tsx",
  ]) {
    const source = readFileSync(
      new URL("../../app/configuracoes/" + arquivo, import.meta.url),
      "utf8",
    );
    assert.match(source, /DeveMostrarConfiguracoes/);
    assert.doesNotMatch(
      source,
      /deveMostrar: \(\.\.\.termos: string\[\]\) => boolean;/,
    );
  }

  for (const arquivo of [
    "components/configuracoes-account-details-section.tsx",
    "components/configuracoes-page-content.tsx",
  ]) {
    const source = readFileSync(
      new URL("../../app/configuracoes/" + arquivo, import.meta.url),
      "utf8",
    );
    assert.match(source, /AtualizarPreferenciaConfiguracoes/);
    assert.doesNotMatch(
      source,
      /onAtualizarPreferencia: <K extends keyof PreferenciasConta>/,
    );
  }

  for (const arquivo of [
    "components/configuracoes-diary-privacy-section.tsx",
    "components/configuracoes-page-content.tsx",
    "components/configuracoes-profile-tab-visibility-section.tsx",
  ]) {
    const source = readFileSync(
      new URL("../../app/configuracoes/" + arquivo, import.meta.url),
      "utf8",
    );
    assert.match(source, /AtualizarPrivacidadeConfiguracoes/);
    assert.doesNotMatch(
      source,
      /onAtualizarPrivacidade: <K extends keyof PreferenciasPrivacidadeHistorietas>/,
    );
  }
});

test("contratos compartilhados dos overlays preservam fechamento, formulario e campos", () => {
  for (const arquivo of [
    "components/configuracoes-page-overlays.tsx",
    "components/configuracoes-security-password-modal.tsx",
    "components/configuracoes-account-deletion-modal.tsx",
  ]) {
    const source = readFileSync(
      new URL("../../app/configuracoes/" + arquivo, import.meta.url),
      "utf8",
    );
    assert.match(source, /FecharOverlayConfiguracoes/);
    assert.match(source, /EnviarFormularioConfiguracoes/);
    assert.match(source, /AtualizarTextoConfiguracoes/);
    assert.doesNotMatch(source, /FormEventHandler/);
    assert.doesNotMatch(source, /onSubmit: FormEventHandler<HTMLFormElement>;/);
    assert.doesNotMatch(source, /on\w+Change: \(valor: string\) => void;/);
  }
});

test("contratos compartilhados de bloqueados preservam carregamento, painel e desbloqueio", () => {
  for (const arquivo of [
    "components/configuracoes-page-content.tsx",
    "components/configuracoes-profile-privacy-section.tsx",
  ]) {
    const source = readFileSync(
      new URL("../../app/configuracoes/" + arquivo, import.meta.url),
      "utf8",
    );
    assert.match(source, /CarregarUsuariosBloqueadosConfiguracoes/);
    assert.match(source, /AlternarUsuariosBloqueadosConfiguracoes/);
    assert.match(source, /DesbloquearUsuarioConfiguracoes/);
    assert.doesNotMatch(source, /onCarregarUsuariosBloqueados: \(\) => Promise<void>;/);
    assert.doesNotMatch(source, /onAlternarUsuariosBloqueados: \(\) => void;/);
    assert.doesNotMatch(
      source,
      /onDesbloquearUsuario: \(\s+usuario: UsuarioBloqueadoConfiguracoes,\s+\) => Promise<void>;/,
    );
  }

  const painel = readFileSync(
    new URL(
      "../../app/configuracoes/components/configuracoes-blocked-users-panel.tsx",
      import.meta.url,
    ),
    "utf8",
  );
  assert.match(painel, /CarregarUsuariosBloqueadosConfiguracoes/);
  assert.match(painel, /DesbloquearUsuarioConfiguracoes/);
  assert.doesNotMatch(painel, /onRecarregar: \(\) => Promise<void>;/);
  assert.doesNotMatch(
    painel,
    /onDesbloquear: \(\s+usuario: UsuarioBloqueadoConfiguracoes,\s+\) => Promise<void>;/,
  );
});

test("contratos compartilhados de privacidade do perfil preservam as secoes", () => {
  for (const arquivo of [
    "components/configuracoes-page-content.tsx",
    "components/configuracoes-profile-privacy-section.tsx",
  ]) {
    const source = readFileSync(
      new URL("../../app/configuracoes/" + arquivo, import.meta.url),
      "utf8",
    );
    assert.match(source, /AlternarPerfilPrivadoConfiguracoes/);
    assert.match(source, /AlternarAprovacaoNovosSeguidoresConfiguracoes/);
    assert.doesNotMatch(source, /onAlternarPerfilPrivado: \(\) => void;/);
    assert.doesNotMatch(
      source,
      /onAlternarAprovacaoNovosSeguidores: \(\) => void;/,
    );
  }

  for (const arquivo of [
    "components/configuracoes-page-content.tsx",
    "components/configuracoes-diary-privacy-section.tsx",
  ]) {
    const source = readFileSync(
      new URL("../../app/configuracoes/" + arquivo, import.meta.url),
      "utf8",
    );
    assert.match(source, /AplicarPrivacidadeAtualizadaConfiguracoes/);
    assert.doesNotMatch(
      source,
      /onAplicarPrivacidadeAtualizada: \(\s+privacidadeAtualizada: PreferenciasPrivacidadeHistorietas,\s+\) => void;/,
    );
  }
});

test("contratos compartilhados dos detalhes da conta preservam as acoes", () => {
  for (const arquivo of [
    "components/configuracoes-page-content.tsx",
    "components/configuracoes-account-details-section.tsx",
  ]) {
    const source = readFileSync(
      new URL("../../app/configuracoes/" + arquivo, import.meta.url),
      "utf8",
    );
    assert.match(source, /LimparErroUsernameConfiguracoes/);
    assert.match(source, /SalvarConfiguracoes/);
    assert.match(source, /AbrirSegurancaConfiguracoes/);
    assert.doesNotMatch(source, /onLimparErroUsername: \(\) => void;/);
    assert.doesNotMatch(source, /onSalvar: \(\) => void;/);
    assert.doesNotMatch(source, /onAbrirSeguranca: \(\) => void;/);
  }
});

test("contratos compartilhados das acoes da conta preservam exclusao e saida", () => {
  for (const arquivo of [
    "components/configuracoes-page-content.tsx",
    "components/configuracoes-account-actions-section.tsx",
  ]) {
    const source = readFileSync(
      new URL("../../app/configuracoes/" + arquivo, import.meta.url),
      "utf8",
    );
    assert.match(source, /AbrirExclusaoContaConfiguracoes/);
    assert.match(source, /SairDaContaConfiguracoes/);
    assert.doesNotMatch(source, /onAbrirExclusaoConta: \(\) => void;/);
    assert.doesNotMatch(source, /onSairDaConta: \(\) => void;/);
  }
});

test("contratos compartilhados de conteudo preservam busca, retorno, avisos e backup", () => {
  for (const [arquivo, contratos, assinaturasLocais] of [
    [
      "components/configuracoes-page-content.tsx",
      [
        "AtualizarBuscaConfiguracoes",
        "VoltarConfiguracoes",
        "AlternarReceberAvisosConfiguracoes",
        "CopiarBackupConfiguracoes",
        "BaixarBackupConfiguracoes",
      ],
      [
        /onBuscaChange: \(valor: string\) => void;/,
        /onVoltar: \(\) => void;/,
        /onAlternarReceberAvisos: \(\) => void;/,
        /onCopiarBackup: \(\) => void;/,
        /onBaixarBackup: \(\) => void;/,
      ],
    ],
    [
      "components/configuracoes-search.tsx",
      ["AtualizarBuscaConfiguracoes"],
      [/onBuscaChange: \(busca: string\) => void;/],
    ],
    [
      "components/configuracoes-page-header.tsx",
      ["VoltarConfiguracoes"],
      [/onVoltar: \(\) => void;/],
    ],
    [
      "components/configuracoes-preferences-section.tsx",
      ["AlternarReceberAvisosConfiguracoes"],
      [/onAlternarReceberAvisos: \(\) => void;/],
    ],
    [
      "components/configuracoes-data-section.tsx",
      ["CopiarBackupConfiguracoes", "BaixarBackupConfiguracoes"],
      [
        /onCopiarBackup: \(\) => void;/,
        /onBaixarBackup: \(\) => void;/,
      ],
    ],
  ]) {
    const source = readFileSync(
      new URL("../../app/configuracoes/" + arquivo, import.meta.url),
      "utf8",
    );

    for (const contrato of contratos) {
      assert.match(source, new RegExp(contrato));
    }

    for (const assinaturaLocal of assinaturasLocais) {
      assert.doesNotMatch(source, assinaturaLocal);
    }
  }
});

test("contratos de navegacao compartilhados preservam os routers dos hooks e acoes", () => {
  assert.match(
    navigationTypesSource,
    /import type \{ ExecutarAcaoConfiguracoes \} from "\.\/configuracoes-callback-types";/,
  );
  assert.match(
    navigationTypesSource,
    /export type NavegarConfiguracoes = \(href: string\) => void;/,
  );
  assert.match(
    navigationTypesSource,
    /export type RouterConfiguracoes = \{\s+replace: NavegarConfiguracoes;\s+\};/,
  );
  assert.match(
    navigationTypesSource,
    /export type RouterConfiguracoesAtualizavel = RouterConfiguracoes & \{\s+refresh: ExecutarAcaoConfiguracoes;\s+\};/,
  );
  assert.match(
    navigationTypesSource,
    /export type RouterConfiguracoesHistorico = \{\s+back: ExecutarAcaoConfiguracoes;\s+\};/,
  );
  assert.doesNotMatch(
    navigationTypesSource,
    /supabase|localStorage|sessionStorage|useState|useEffect|window|document|fetch|JSX/,
  );

  for (const [arquivo, contrato] of [
    [
      "hooks/use-configuracoes-account-action-handlers.ts",
      "RouterConfiguracoesAtualizavel",
    ],
    ["hooks/use-configuracoes-initial-access.ts", "RouterConfiguracoes"],
    [
      "lib/configuracoes-content-actions.ts",
      "RouterConfiguracoesHistorico",
    ],
  ]) {
    const source = readFileSync(
      new URL("../../app/configuracoes/" + arquivo, import.meta.url),
      "utf8",
    );
    assert.match(source, /configuracoes-navigation-types/);
    assert.match(source, new RegExp("import type \\{ " + contrato + " \\}"));
    assert.doesNotMatch(source, new RegExp("type " + contrato + " ="));
  }
});

test("contratos de navegacao das acoes de conta preservam redirecionamento e atualizacao", () => {
  assert.match(
    navigationTypesSource,
    /export type RedirecionarLoginConfiguracoes = ExecutarAcaoConfiguracoes;/,
  );
  assert.match(
    navigationTypesSource,
    /export type AtualizarRotaConfiguracoes = ExecutarAcaoConfiguracoes;/,
  );

  for (const [arquivo, contratos, assinaturasLocais] of [
    [
      "lib/configuracoes-account-deletion-action.ts",
      ["RedirecionarLoginConfiguracoes", "AtualizarRotaConfiguracoes"],
      [
        /redirecionarLogin: \(\) => void;/,
        /atualizarRota: \(\) => void;/,
      ],
    ],
    [
      "lib/configuracoes-profile-save-action.ts",
      ["RedirecionarLoginConfiguracoes"],
      [/redirecionarLogin: \(\) => void;/],
    ],
    [
      "lib/configuracoes-sign-out-action.ts",
      ["RedirecionarLoginConfiguracoes", "AtualizarRotaConfiguracoes"],
      [
        /redirecionarLogin: \(\) => void;/,
        /atualizarRota: \(\) => void;/,
      ],
    ],
  ]) {
    const source = readFileSync(
      new URL("../../app/configuracoes/" + arquivo, import.meta.url),
      "utf8",
    );

    assert.match(source, /configuracoes-navigation-types/);
    for (const contrato of contratos) {
      assert.match(source, new RegExp(contrato));
    }
    for (const assinaturaLocal of assinaturasLocais) {
      assert.doesNotMatch(source, assinaturaLocal);
    }
  }
});

test("contratos de feedback de acoes preservam a limpeza compartilhada", () => {
  assert.match(
    feedbackActionTypesSource,
    /export type LimparMensagemAcaoConfiguracoes = AtualizarValorConfiguracoes<null>;/,
  );

  for (const arquivo of [
    "hooks/use-configuracoes-account-action-handlers.ts",
    "hooks/use-configuracoes-preference-actions.ts",
    "lib/configuracoes-account-backup-actions.ts",
    "lib/configuracoes-overlay-field-actions.ts",
    "lib/configuracoes-preference-actions.ts",
    "lib/configuracoes-profile-save-action.ts",
  ]) {
    const source = readFileSync(
      new URL("../../app/configuracoes/" + arquivo, import.meta.url),
      "utf8",
    );
    assert.match(source, /LimparMensagemAcaoConfiguracoes/);
    assert.doesNotMatch(source, /setMensagemAcao: \(mensagem: null\) => void;/);
  }

  const toast = readFileSync(
    new URL(
      "../../app/configuracoes/components/configuracoes-action-toast.tsx",
      import.meta.url,
    ),
    "utf8",
  );
  assert.match(toast, /FecharOverlayConfiguracoes/);
  assert.doesNotMatch(toast, /onFechar: \(\) => void;/);
});

test("contratos de setters preservam texto e booleanos compartilhados", () => {
  assert.match(
    callbackPrimitivesSource,
    /export type AtualizarTextoConfiguracoes = AtualizarValorConfiguracoes<string>;/,
  );
  assert.match(
    overlayActionTypesSource,
    /export type AtualizarBooleanoConfiguracoes = AtualizarValorConfiguracoes<boolean>;/,
  );

  for (const arquivo of [
    "lib/configuracoes-content-actions.ts",
    "lib/configuracoes-overlay-field-actions.ts",
    "lib/configuracoes-modal-state-actions.ts",
  ]) {
    const source = readFileSync(
      new URL("../../app/configuracoes/" + arquivo, import.meta.url),
      "utf8",
    );
    assert.match(source, /AtualizarTextoConfiguracoes/);
  }

  const modalStateActions = readFileSync(
    new URL(
      "../../app/configuracoes/lib/configuracoes-modal-state-actions.ts",
      import.meta.url,
    ),
    "utf8",
  );
  assert.match(modalStateActions, /AtualizarBooleanoConfiguracoes/);
  assert.doesNotMatch(modalStateActions, /\(mostrar: boolean\) => void;/);
  assert.doesNotMatch(modalStateActions, /\(alterada: boolean\) => void;/);
});
