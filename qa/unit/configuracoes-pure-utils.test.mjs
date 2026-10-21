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
const account = await importarTypescript(accountSource);
const errorMessages = await importarTypescript(
  errorMessagesSource.replace(
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
  assert.match(pagina, /from "\.\/lib\/configuracoes-profile-utils";/);
  assert.match(pagina, /from "\.\/lib\/configuracoes-account-preferences";/);
  assert.match(pagina, /from "\.\/lib\/configuracoes-account-backup";/);
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
  assert.match(pagina, /carregarResumoContaSupabase\(usuarioCarregado\.id\)/);
  assert.match(pagina, /listarUsuariosBloqueadosConfiguracoes\(\)\.catch/);

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
  assert.match(pagina, /async function salvarPerfilConfiguracoesSupabase\(/);
  assert.match(pagina, /localStorage/);
  assert.match(pagina, /supabase\./);
  assert.doesNotMatch(searchSource, /useState|useEffect|supabase|localStorage/);
  assert.doesNotMatch(accountSource, /useState|useEffect|supabase|localStorage/);
  assert.doesNotMatch(privacySource, /useState|useEffect|useMemo/);
});
