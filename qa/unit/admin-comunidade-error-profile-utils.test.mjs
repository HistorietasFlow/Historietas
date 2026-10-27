import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const errorSource = readFileSync(
  new URL(
    "../../app/admin/comunidade/lib/admin-comunidade-error-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const profileSource = readFileSync(
  new URL(
    "../../app/admin/comunidade/lib/admin-comunidade-profile-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/admin/comunidade/page.tsx", import.meta.url),
  "utf8",
);

function importarModuloTypescript(source) {
  const javascript = typescript.transpileModule(source, {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  }).outputText;

  return import(
    `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`,
  );
}

const errorUtils = await importarModuloTypescript(errorSource);
const profileUtils = await importarModuloTypescript(profileSource);

test("helpers de erro preservam detalhes, fallback e erros opcionais", () => {
  assert.equal(
    errorUtils.criarMensagemErro("Erro ao carregar", undefined),
    "Erro ao carregar: erro desconhecido.",
  );
  assert.equal(
    errorUtils.criarMensagemErro("Erro ao carregar", {}),
    "Erro ao carregar: erro desconhecido.",
  );
  assert.equal(
    errorUtils.criarMensagemErro("Erro ao carregar", {
      message: "Falha",
      code: "P0001",
      details: "Detalhe",
      hint: "Tente novamente",
    }),
    "Erro ao carregar: Falha · código P0001 · Detalhe · Tente novamente",
  );

  assert.equal(errorUtils.erroOpcionalIgnoravel(undefined), false);
  assert.equal(errorUtils.erroOpcionalIgnoravel({}), false);
  assert.equal(errorUtils.erroOpcionalIgnoravel({ code: "42P01" }), true);
  assert.equal(errorUtils.erroOpcionalIgnoravel({ code: "42703" }), true);
  assert.equal(
    errorUtils.erroOpcionalIgnoravel({ message: "RELATION DOES NOT EXIST" }),
    true,
  );
  assert.equal(
    errorUtils.erroOpcionalIgnoravel({ message: "Schema Cache is stale" }),
    true,
  );
  assert.equal(
    errorUtils.erroOpcionalIgnoravel({ message: "Could Not Find column" }),
    true,
  );
  assert.equal(
    errorUtils.erroOpcionalIgnoravel({ message: "permission denied" }),
    false,
  );
});

test("helpers de perfis preservam normalização, fallback e chaves", () => {
  assert.equal(
    profileUtils.obterNomePerfilModeracao({ nome: "  Ada  " }),
    "Ada",
  );
  assert.equal(
    profileUtils.obterNomePerfilModeracao({ nome: "   " }),
    "Usuário sem nome",
  );
  assert.equal(
    profileUtils.obterNomePerfilModeracao({ nome: null }),
    "Usuário sem nome",
  );

  const perfis = [
    { id: " perfil-1 ", user_id: " usuario-1 ", nome: "  Ada  " },
    { id: "perfil-2", nome: "Bruno" },
    { user_id: "usuario-3", nome: "   " },
    { id: "   ", user_id: "   ", nome: "Ignorado" },
  ];
  const mapa = profileUtils.criarMapaNomesPerfisModeracao(perfis);

  assert.equal(mapa.get("usuario-1"), "Ada");
  assert.equal(mapa.get("perfil-1"), "Ada");
  assert.equal(mapa.get("perfil-2"), "Bruno");
  assert.equal(mapa.get("usuario-3"), "Usuário sem nome");
  assert.equal(mapa.has(""), false);
  assert.equal(mapa.size, 4);
});

test("Admin Comunidade delega erros e perfis aos módulos puros", () => {
  for (const nome of [
    "criarMensagemErro",
    "erroOpcionalIgnoravel",
    "obterNomePerfilModeracao",
    "criarMapaNomesPerfisModeracao",
  ]) {
    assert.doesNotMatch(pageSource, new RegExp(`function ${nome}\\b`));
  }

  assert.doesNotMatch(pageSource, /type PerfilModeracao\s*=/);
  assert.match(pageSource, /from "\.\/lib\/admin-comunidade-error-utils"/);
  assert.match(pageSource, /from "\.\/lib\/admin-comunidade-profile-utils"/);
  assert.equal(
    (pageSource.match(/criarMapaNomesPerfisModeracao\(/g) || []).length,
    2,
  );
  assert.match(pageSource, /erroOpcionalIgnoravel\(denunciasErro\)/);
  assert.match(pageSource, /criarMensagemErro\("Erro ao carregar moderação", error\)/);

  for (const source of [errorSource, profileSource]) {
    assert.doesNotMatch(
      source,
      /from\s+["']react["']|from\s+["'][^"']*supabase|useState|useEffect|localStorage|router|(?:^|\n)\s*<(?:[A-Z][A-Za-z0-9]*|[a-z][a-z0-9-]*)(?:\s|\/?>)/,
    );
  }
});
