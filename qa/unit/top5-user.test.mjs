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

test("a composição de usuário permanece integrada ao lifecycle dedicado", async () => {
  const [helper, pageOriginal] = await Promise.all([
    readFile(helperPath, "utf8"),
    readFile(pagePath, "utf8"),
  ]);
  const helperSource = helper.replace(/\r\n/g, "\n");
  const page = pageOriginal.replace(/\r\n/g, "\n");

  assert.match(
    helperSource,
    /import type \{ UsuarioTop5 \} from "\.\/top5-types";/,
  );
  assert.match(
    helperSource,
    /export function criarUsuarioTop5\(\n  userId: string,\n  nomeUsuario: string,\n\): UsuarioTop5 \| null/,
  );
  assert.match(
    helperSource,
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
    assert.doesNotMatch(helperSource, new RegExp(forbidden, "i"));
  }

  assert.match(
    page,
    /import \{ useTop5InitialLoad \} from "\.\/hooks\/use-top5-initial-load";/,
  );
  assert.match(page, /useState<UsuarioTop5 \| null>\(null\)/);
  assert.match(page, /useTop5InitialLoad\(\{\s*setUsuario,\s*setCarregando,\s*setObras,\s*setIdsSelecionados,\s*\}\);/);
});
