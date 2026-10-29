import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const helperPath = new URL(
  "../../app/perfil-autor/top-5/lib/top5-user.ts",
  import.meta.url,
);
const pagePath = new URL(
  "../../app/perfil-autor/top-5/page.tsx",
  import.meta.url,
);

async function carregarCriarUsuarioTop5() {
  const source = (await readFile(helperPath, "utf8"))
    .replace(/\r\n/g, "\n")
    .replace(
      'import type { UsuarioTop5 } from "./top5-types";\n\n',
      "",
    )
    .replace(
      /export function criarUsuarioTop5\(\n  userId: string,\n  nomeUsuario: string,\n\): UsuarioTop5 \| null \{/,
      "function criarUsuarioTop5(userId, nomeUsuario) {",
    );

  return new Function(`${source}\nreturn criarUsuarioTop5;`)();
}

test("criarUsuarioTop5 preserva a composição condicional atual", async () => {
  const criarUsuarioTop5 = await carregarCriarUsuarioTop5();
  const userId = " usuario-1 ";
  const nomeUsuario = " Nome atual ";

  assert.deepEqual(
    criarUsuarioTop5(userId, nomeUsuario),
    {
      id: userId,
      nome: nomeUsuario,
    },
  );
  assert.equal(criarUsuarioTop5("", nomeUsuario), null);
  assert.equal(userId, " usuario-1 ");
  assert.equal(nomeUsuario, " Nome atual ");
  assert.deepEqual(
    criarUsuarioTop5("  ", ""),
    {
      id: "  ",
      nome: "",
    },
  );
});

test("a Fase 40 mantém composição e lifecycle na página", async () => {
  const [helper, pageOriginal] = await Promise.all([
    readFile(helperPath, "utf8"),
    readFile(pagePath, "utf8"),
  ]);
  const page = pageOriginal.replace(/\r\n/g, "\n");

  assert.match(
    helper,
    /import type \{ UsuarioTop5 \} from "\.\/top5-types";/,
  );
  assert.match(
    helper,
    /export function criarUsuarioTop5\(\n  userId: string,\n  nomeUsuario: string,\n\): UsuarioTop5 \| null/,
  );
  assert.match(
    helper,
    /return userId\s*\? \{\s*id: userId,\s*nome: nomeUsuario,\s*\}\s*: null;/,
  );

  for (const forbidden of [
    "useState",
    "useEffect",
    "supabase",
    "auth",
    "setUsuario",
    "router",
    "localStorage",
    "ObraTop5",
    "Selecion",
    "persist",
    "<",
  ]) {
    assert.doesNotMatch(helper, new RegExp(forbidden, "i"));
  }

  assert.match(
    page,
    /import \{ criarUsuarioTop5 \} from "\.\/lib\/top5-user";/,
  );
  assert.match(page, /useState<UsuarioTop5 \| null>\(null\)/);
  assert.match(page, /const userId = authData\.user\?\.id \|\| "";/);
  assert.match(page, /const nomeUsuario = await resolverNomeUsuarioTop5\(/);
  assert.match(
    page,
    /setUsuario\(\s*criarUsuarioTop5\(\s*userId,\s*nomeUsuario,\s*\),\s*\);/,
  );

  const setUsuario = page.indexOf("setUsuario(\n          criarUsuarioTop5(");
  const setObras = page.indexOf("setObras(obrasMescladas);");
  const setIds = page.indexOf("setIdsSelecionados(idsNormalizados);");
  const sincronizar = page.indexOf("sincronizarSelecaoInicialTop5(");
  assert.ok(setUsuario >= 0);
  assert.ok(setUsuario < setObras);
  assert.ok(setObras < setIds);
  assert.ok(setIds < sincronizar);

  assert.equal(
    (page.match(/if \(cancelado\) \{\n          return;\n        \}/g) || [])
      .length,
    2,
  );
  assert.match(
    page,
    /catch \{\s*if \(!cancelado\) \{\s*setUsuario\(null\);\s*setObras\(\[\]\);\s*setIdsSelecionados\(\[\]\);/,
  );
});
