import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const helperPath = new URL(
  "../../app/perfil-autor/top-5/lib/top5-user-name-resolver.ts",
  import.meta.url,
);
const pagePath = new URL(
  "../../app/perfil-autor/top-5/page.tsx",
  import.meta.url,
);

function carregarResolver(source, obterNomeInicial, carregarPerfil) {
  const executavel = source
    .replace(/\r\n/g, "\n")
    .replace(
      'import { carregarNomePerfilTop5 } from "./top5-profile-name-loader";\n',
      "",
    )
    .replace(
      'import { obterNomeInicialUsuarioTop5 } from "./top5-user-name";\n',
      "",
    )
    .replace(
      "export async function resolverNomeUsuarioTop5(\n  userId: string,\n  nomeMetadata: unknown,\n  nameMetadata: unknown,\n  email: unknown,\n) {",
      "async function resolverNomeUsuarioTop5(userId, nomeMetadata, nameMetadata, email) {",
    );

  return new Function(
    "obterNomeInicialUsuarioTop5",
    "carregarNomePerfilTop5",
    `${executavel}\nreturn resolverNomeUsuarioTop5;`,
  )(obterNomeInicial, carregarPerfil);
}

test("Top 5 resolve o nome inicial e o perfil sem deslocar o lifecycle da página", async () => {
  const [helper, page] = await Promise.all([
    readFile(helperPath, "utf8"),
    readFile(pagePath, "utf8"),
  ]);

  assert.match(
    helper,
    /import \{ obterNomeInicialUsuarioTop5 \} from "\.\/top5-user-name";/,
  );
  assert.match(
    helper,
    /import \{ carregarNomePerfilTop5 \} from "\.\/top5-profile-name-loader";/,
  );
  assert.match(helper, /export async function resolverNomeUsuarioTop5/);
  assert.match(
    helper,
    /obterNomeInicialUsuarioTop5\(\s*nomeMetadata,\s*nameMetadata,\s*email,\s*\)/,
  );
  assert.match(helper, /if \(userId\)/);
  assert.match(
    helper,
    /carregarNomePerfilTop5\(\s*userId,\s*nomeUsuario,\s*\)/,
  );
  assert.match(helper, /return nomeUsuario;/);
  assert.doesNotMatch(helper, /try\s*\{/);
  assert.doesNotMatch(helper, /catch\s*\(/);

  const chamadasSemUsuario = [];
  const resolverSemUsuario = carregarResolver(
    helper,
    (nome, name, email) => {
      chamadasSemUsuario.push(["inicial", nome, name, email]);
      return "Nome inicial";
    },
    async () => {
      chamadasSemUsuario.push(["perfil"]);
      return "Perfil";
    },
  );
  assert.equal(
    await resolverSemUsuario("", "Nome", "Name", "email@exemplo.com"),
    "Nome inicial",
  );
  assert.deepEqual(chamadasSemUsuario, [
    ["inicial", "Nome", "Name", "email@exemplo.com"],
  ]);

  const chamadasComUsuario = [];
  const resolverComUsuario = carregarResolver(
    helper,
    () => "Nome inicial",
    async (userId, fallback) => {
      chamadasComUsuario.push([userId, fallback]);
      return "Nome do perfil";
    },
  );
  assert.equal(await resolverComUsuario("user-1", null, null, null), "Nome do perfil");
  assert.deepEqual(chamadasComUsuario, [["user-1", "Nome inicial"]]);

  const resolverFallback = carregarResolver(
    helper,
    () => "Nome inicial",
    async (_userId, fallback) => fallback,
  );
  assert.equal(await resolverFallback("user-1", null, null, null), "Nome inicial");

  const erroPerfil = new Error("falha do perfil");
  const resolverComErro = carregarResolver(
    helper,
    () => "Nome inicial",
    async () => {
      throw erroPerfil;
    },
  );
  await assert.rejects(
    () => resolverComErro("user-1", null, null, null),
    erroPerfil,
  );

  assert.match(
    page,
    /import \{ useTop5InitialLoad \} from "\.\/hooks\/use-top5-initial-load";/,
  );
  assert.doesNotMatch(page, /import \{ obterNomeInicialUsuarioTop5 \}/);
  assert.doesNotMatch(page, /import \{ carregarNomePerfilTop5 \}/);
  assert.doesNotMatch(page, /obterNomeInicialUsuarioTop5\(authData\.user/);
  assert.doesNotMatch(page, /carregarNomePerfilTop5\(/);
  assert.doesNotMatch(page, /resolverNomeUsuarioTop5\(/);

  for (const forbidden of [
    "react",
    "useEffect",
    "useState",
    "supabase",
    "auth",
    "cancelado",
    "set",
    "router",
    "localStorage",
    "Obra",
    "JSX",
  ]) {
    assert.ok(!helper.includes(forbidden), `não contém ${forbidden}`);
  }
});
