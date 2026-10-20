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

test("busca de Configurações preserva idioma, normalização e aliases", () => {
  assert.equal(search.textoIdioma("pt-BR", "Conta", "Account", "Cuenta"), "Conta");
  assert.equal(search.textoIdioma("en", "Conta", "Account", "Cuenta"), "Account");
  assert.equal(search.textoIdioma("es", "Conta", "Account", "Cuenta"), "Cuenta");
  assert.equal(search.normalizarTextoBuscaConfiguracoes("  PÚBLICO  "), "publico");
  assert.deepEqual(search.ALIASES_BUSCA_CONFIGURACOES.privacidade, ["privacy", "privacidad"]);
  assert.deepEqual(search.ALIASES_BUSCA_CONFIGURACOES.login, ["login", "inicio de sesion"]);
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

test("Configurações delega apenas as duas fronteiras puras", () => {
  assert.match(pagina, /from "\.\/lib\/configuracoes-search-utils";/);
  assert.match(pagina, /from "\.\/lib\/configuracoes-account-utils";/);

  for (const helper of [
    "textoIdioma",
    "normalizarTextoBuscaConfiguracoes",
    "pegarTexto",
    "normalizarUsernameConfiguracoes",
    "idUsuarioSupabaseValido",
    "metadataTemAdminConfiguracoes",
    "obterIniciais",
  ]) {
    assert.doesNotMatch(pagina, new RegExp("function " + helper + "\\("));
  }

  assert.match(pagina, /async function carregarPreferenciasPrivacidade\(/);
  assert.match(pagina, /async function salvarPerfilConfiguracoesSupabase\(/);
  assert.match(pagina, /localStorage/);
  assert.match(pagina, /supabase\./);
  assert.doesNotMatch(searchSource, /useState|useEffect|supabase|localStorage/);
  assert.doesNotMatch(accountSource, /useState|useEffect|supabase|localStorage/);
});
