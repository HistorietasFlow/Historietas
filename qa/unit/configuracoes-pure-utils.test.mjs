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
const accountBackupDownloadSource = readFileSync(
  new URL(
    "../../app/configuracoes/lib/configuracoes-account-backup-download.ts",
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
const pagina = readFileSync(
  new URL("../../app/configuracoes/page.tsx", import.meta.url),
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
  assert.match(pagina, /from "\.\/lib\/configuracoes-search-utils";/);
  assert.match(pagina, /from "\.\/lib\/configuracoes-account-utils";/);
  assert.match(
    pagina,
    /from "\.\/lib\/configuracoes-privacy-preferences";/,
  );
  assert.match(pagina, /from "\.\/lib\/configuracoes-error-messages";/);
  assert.match(pagina, /from "\.\/lib\/configuracoes-account-models";/);
  assert.doesNotMatch(
    pagina,
    /from "\.\/lib\/configuracoes-account-storage-constants";/,
  );
  assert.doesNotMatch(
    pagina,
    /from "\.\/lib\/configuracoes-local-summary-utils";/,
  );
  assert.match(
    pagina,
    /from "\.\/lib\/configuracoes-profile-supabase-loader";/,
  );
  assert.match(
    pagina,
    /from "\.\/lib\/configuracoes-profile-supabase-saver";/,
  );
  assert.match(
    pagina,
    /from "\.\/lib\/configuracoes-account-deletion-local-cleanup";/,
  );
  assert.match(
    pagina,
    /from "\.\/lib\/configuracoes-account-deletion-error-messages";/,
  );
  assert.match(pagina, /from "\.\/lib\/configuracoes-account-preferences";/);
  assert.match(pagina, /from "\.\/lib\/configuracoes-account-backup";/);
  assert.match(
    pagina,
    /from "\.\/lib\/configuracoes-account-backup-download";/,
  );
  assert.match(
    pagina,
    /from "\.\/lib\/configuracoes-account-preference-state-utils";/,
  );
  assert.match(
    pagina,
    /from "\.\/lib\/configuracoes-privacy-preference-state-utils";/,
  );
  assert.match(
    pagina,
    /from "\.\/lib\/configuracoes-security-form-validation";/,
  );
  assert.match(
    pagina,
    /from "\.\/lib\/configuracoes-search-visibility-utils";/,
  );
  assert.match(
    pagina,
    /from "\.\/lib\/configuracoes-account-summary-supabase";/,
  );
  assert.match(
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
    "criarBackupLocal",
    "deveMostrarSecaoConfiguracoes",
    "carregarResumoContaSupabase",
    "listarUsuariosBloqueadosConfiguracoes",
    "carregarPerfilConfiguracoesSupabase",
    "salvarPerfilConfiguracoesSupabase",
    "limparDadosLocaisContaExcluida",
    "traduzirErroExclusaoContaConfiguracoes",
    "baixarBackupConfiguracoes",
    "calcularTotalBibliotecaConfiguracoes",
    "criarPreferenciaAtualizadaConfiguracoes",
    "criarPreferenciasComAvisosAlternadosConfiguracoes",
    "criarPrivacidadeAtualizadaConfiguracoes",
    "criarPrivacidadeComPerfilPrivadoAlternadoConfiguracoes",
    "criarPrivacidadeComAprovacaoAlternadaConfiguracoes",
    "validarExclusaoContaConfiguracoes",
    "validarAlteracaoSenhaConfiguracoes",
  ]) {
    assert.doesNotMatch(pagina, new RegExp("function " + helper + "\\("));
  }

  assert.doesNotMatch(pagina, /function deveMostrar\(/);
  assert.match(
    pagina,
    /deveMostrarSecaoConfiguracoes\(buscaNormalizada, \.\.\.termos\)/,
  );
  assert.doesNotMatch(pagina, /async function contarRegistrosResumoSupabase\(/);
  assert.doesNotMatch(pagina, /async function listarUsuariosBloqueadosConfiguracoes\(/);
  assert.doesNotMatch(pagina, /async function carregarPerfilConfiguracoesSupabase\(/);
  assert.match(pagina, /carregarResumoContaSupabase\(usuarioCarregado\.id\)/);
  assert.match(pagina, /listarUsuariosBloqueadosConfiguracoes\(\)\.catch/);
  assert.match(pagina, /carregarPerfilConfiguracoesSupabase\(data\.user\.id\)/);

  assert.doesNotMatch(
    pagina,
    /async function carregarPreferenciasPrivacidade\(/,
  );
  assert.doesNotMatch(
    pagina,
    /async function salvarPreferenciasPrivacidade\(/,
  );
  assert.match(
    pagina,
    /useState<PreferenciasPrivacidadeHistorietas>\(/,
  );
  assert.match(
    pagina,
    /carregarPreferenciasPrivacidade\(usuarioCarregado\.id,/,
  );
  assert.match(pagina, /salvarPreferenciasPrivacidade\(/);
  assert.doesNotMatch(pagina, /async function salvarPerfilConfiguracoesSupabase\(/);
  assert.doesNotMatch(pagina, /function limparDadosLocaisContaExcluida\(/);
  assert.match(pagina, /salvarPerfilConfiguracoesSupabase\(\{/);
  assert.match(pagina, /limparDadosLocaisContaExcluida\(usuarioIdLogado\)/);
  assert.match(pagina, /validarExclusaoContaConfiguracoes\(\s*senhaExclusaoConta,/);
  assert.match(pagina, /validarAlteracaoSenhaConfiguracoes\(\s*senhaAtual,/);
  assert.doesNotMatch(pagina, /const confirmacaoEsperada/);
  assert.doesNotMatch(pagina, /!\/\[A-Za-zÀ-ÖØ-öø-ÿ\]\/.test\(novaSenha\)/);
  assert.doesNotMatch(pagina, /localStorage/);
  assert.match(pagina, /supabase\./);
  assert.doesNotMatch(searchSource, /useState|useEffect|supabase|localStorage/);
  assert.doesNotMatch(accountSource, /useState|useEffect|supabase|localStorage/);
  assert.doesNotMatch(privacySource, /useState|useEffect|useMemo/);
});
