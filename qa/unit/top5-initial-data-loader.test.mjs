import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const loaderPath = new URL(
  "../../app/perfil-autor/top-5/lib/top5-initial-data-loader.ts",
  import.meta.url,
);
const pagePath = new URL(
  "../../app/perfil-autor/top-5/page.tsx",
  import.meta.url,
);

function carregarLoader(source, getUser, carregarObrasSupabaseTop5) {
  const executavel = source
    .replace(/\r\n/g, "\n")
    .replace(
      'import { supabase } from "../../../../lib/supabase/client";\n',
      "const supabase = { auth: { getUser } };\n",
    )
    .replace(
      'import { carregarObrasSupabaseTop5 } from "./top5-supabase-works-loader";\n',
      "",
    )
    .replace(
      "export async function carregarDadosIniciaisTop5() {",
      "async function carregarDadosIniciaisTop5() {",
    );

  return new Function(
    "getUser",
    "carregarObrasSupabaseTop5",
    `${executavel}\nreturn carregarDadosIniciaisTop5;`,
  )(getUser, carregarObrasSupabaseTop5);
}

test("Top 5 carrega em paralelo a sessão e as obras Supabase", async () => {
  const [loader, page] = await Promise.all([
    readFile(loaderPath, "utf8"),
    readFile(pagePath, "utf8"),
  ]);

  assert.match(
    loader,
    /import \{ supabase \} from "\.\.\/\.\.\/\.\.\/\.\.\/lib\/supabase\/client";/,
  );
  assert.match(
    loader,
    /import \{ carregarObrasSupabaseTop5 \} from "\.\/top5-supabase-works-loader";/,
  );
  assert.match(loader, /export async function carregarDadosIniciaisTop5/);
  assert.match(
    loader,
    /Promise\.all\(\[\s*supabase\.auth\.getUser\(\),\s*carregarObrasSupabaseTop5\(\),\s*\]\)/,
  );
  assert.match(
    loader,
    /return \{\s*authData,\s*obrasSupabase,\s*\};/,
  );
  assert.doesNotMatch(loader, /try\s*\{/);
  assert.doesNotMatch(loader, /catch\s*\(/);

  const chamadas = [];
  let resolverAuth;
  let resolverObras;
  const authData = { user: { id: "usuario-1" } };
  const obrasSupabase = [{ id: "obra-1" }];
  const carregarDadosIniciaisTop5 = carregarLoader(
    loader,
    () => {
      chamadas.push("auth");
      return new Promise((resolve) => {
        resolverAuth = resolve;
      });
    },
    () => {
      chamadas.push("obras");
      return new Promise((resolve) => {
        resolverObras = resolve;
      });
    },
  );

  const dados = carregarDadosIniciaisTop5();
  assert.deepEqual(chamadas, ["auth", "obras"]);
  resolverObras(obrasSupabase);
  resolverAuth({ data: authData });
  assert.deepEqual(await dados, { authData, obrasSupabase });

  const erro = new Error("falha ao carregar obras");
  const propagaErro = carregarLoader(
    loader,
    () => Promise.resolve({ data: authData }),
    () => Promise.reject(erro),
  );
  await assert.rejects(propagaErro(), erro);

  const erroAuth = new Error("falha ao carregar sessão");
  const propagaErroAuth = carregarLoader(
    loader,
    () => Promise.reject(erroAuth),
    () => Promise.resolve(obrasSupabase),
  );
  await assert.rejects(propagaErroAuth(), erroAuth);

  assert.match(
    page,
    /import \{ carregarDadosIniciaisTop5 \} from "\.\/lib\/top5-initial-data-loader";/,
  );
  assert.doesNotMatch(page, /Promise\.all\(\[\s*supabase\.auth\.getUser\(\)/);
  assert.doesNotMatch(page, /supabase\.auth\.getUser\(\)/);
  assert.doesNotMatch(page, /carregarObrasSupabaseTop5\(\)/);
  assert.match(
    page,
    /const \{\s*authData,\s*obrasSupabase,\s*\} = await carregarDadosIniciaisTop5\(\);\s*if \(cancelado\) \{\s*return;\s*\}\s*const userId = authData\.user\?\.id \|\| "";/,
  );

  for (const forbidden of [
    "react",
    "useEffect",
    "set",
    "router",
    "localStorage",
    "JSX",
    "style={",
    "cancelado",
    "selecionar",
    "mesclar",
    "salvarTop5",
  ]) {
    assert.doesNotMatch(
      loader,
      new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    );
  }
});
