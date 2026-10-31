import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const loaderSource = readFileSync(
  new URL(
    "../../app/admin/comunidade/loaders/verificar-acesso-moderacao.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/admin/comunidade/page.tsx", import.meta.url),
  "utf8",
);
const hookSource = readFileSync(
  new URL(
    "../../app/admin/comunidade/hooks/use-admin-comunidade-initial-data.ts",
    import.meta.url,
  ),
  "utf8",
);

async function importarLoader(supabase) {
  const javascript = typescript.transpileModule(
    loaderSource.replace(
      'import { supabase } from "../../../../lib/supabase/client";',
      "const supabase = globalThis.__supabaseTeste;",
    ),
    {
      compilerOptions: {
        module: typescript.ModuleKind.ESNext,
        target: typescript.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  globalThis.__supabaseTeste = supabase;

  return import(
    `data:text/javascript;base64,${Buffer.from(
      `${javascript}\n// ${Math.random()}`,
    ).toString("base64")}`
  );
}

function criarSupabase({ user = null, usuarioErro = null, adminResposta, adminErro = null }) {
  const chamadas = [];

  return {
    chamadas,
    supabase: {
      auth: {
        getUser() {
          chamadas.push("getUser");
          return Promise.resolve({
            data: { user },
            error: usuarioErro,
          });
        },
      },
      rpc(nome) {
        chamadas.push(`rpc:${nome}`);
        return Promise.resolve({
          data: adminResposta,
          error: adminErro,
        });
      },
    },
  };
}

test("verifica o usuário e confirma somente a resposta administrativa literal true", async () => {
  const user = { id: "admin-1", email: "admin@historietas.local" };
  const sucesso = criarSupabase({ user, adminResposta: true });
  const loader = await importarLoader(sucesso.supabase);

  const resultado = await loader.verificarAcessoModeracao();

  assert.equal(resultado.user, user);
  assert.equal(resultado.adminConfirmado, true);
  assert.deepEqual(sucesso.chamadas, ["getUser", "rpc:usuario_e_admin"]);

  for (const adminResposta of [false, 1, "true", null, undefined]) {
    const semConfirmacao = criarSupabase({ user, adminResposta });
    const outroLoader = await importarLoader(semConfirmacao.supabase);

    assert.equal(
      (await outroLoader.verificarAcessoModeracao()).adminConfirmado,
      false,
    );
    assert.deepEqual(semConfirmacao.chamadas, ["getUser", "rpc:usuario_e_admin"]);
  }
});

test("preserva ausência de usuário e propaga erros da autenticação e da RPC", async () => {
  const semUsuario = criarSupabase({ user: null });
  const loaderSemUsuario = await importarLoader(semUsuario.supabase);

  assert.deepEqual(await loaderSemUsuario.verificarAcessoModeracao(), {
    user: null,
    adminConfirmado: false,
  });
  assert.deepEqual(semUsuario.chamadas, ["getUser"]);

  const usuarioErro = new Error("falha ao buscar usuário");
  const comErroUsuario = criarSupabase({ usuarioErro });
  const loaderComErroUsuario = await importarLoader(comErroUsuario.supabase);
  await assert.rejects(
    () => loaderComErroUsuario.verificarAcessoModeracao(),
    usuarioErro,
  );

  const adminErro = new Error("falha administrativa");
  const comErroAdmin = criarSupabase({ user: { id: "usuario-1" }, adminErro });
  const loaderComErroAdmin = await importarLoader(comErroAdmin.supabase);
  await assert.rejects(
    () => loaderComErroAdmin.verificarAcessoModeracao(),
    adminErro,
  );
  assert.deepEqual(comErroAdmin.chamadas, ["getUser", "rpc:usuario_e_admin"]);
});

test("Admin Comunidade mantém a orquestração, setters e redirect do acesso", () => {
  assert.match(
    hookSource,
    /import \{ verificarAcessoModeracao \} from "\.\.\/loaders\/verificar-acesso-moderacao";/,
  );
  assert.match(
    hookSource,
    /const \{ user, adminConfirmado \} =\s*await verificarAcessoModeracao\(\);/,
  );
  assert.doesNotMatch(hookSource, /supabase\.auth\.getUser\(\)/);
  assert.doesNotMatch(hookSource, /supabase\.rpc\("usuario_e_admin"\)/);
  assert.match(hookSource, /setUsuarioId\(""\);/);
  assert.match(hookSource, /setEhAdmin\(false\);/);
  assert.match(hookSource, /setDenuncias\(\[\]\);/);
  assert.match(hookSource, /setDenunciasPerfis\(\[\]\);/);
  assert.match(hookSource, /setReincidenciasPorUsuario\(\{\}\);/);
  assert.match(hookSource, /router\.replace\(criarLoginHrefAdminModeracao\(\)\);/);
  assert.match(hookSource, /setUsuarioId\(user\.id\);/);
  assert.match(hookSource, /setEhAdmin\(adminConfirmado\);/);
  assert.match(
    hookSource,
    /Promise\.all\(\[[\s\S]*?carregarDenuncias\(\),[\s\S]*?carregarDenunciasPerfis\(\),[\s\S]*?carregarReincidenciasModeracao\(\),/,
  );
  assert.match(hookSource, /let cancelado = false;/);
  assert.match(hookSource, /catch \(error\)/);
  assert.match(hookSource, /finally/);
  assert.match(hookSource, /\}, \[router\]\);/);
  assert.match(pageSource, /useAdminComunidadeInitialData\(/);
  assert.doesNotMatch(pageSource, /async function iniciarModeracao/);
  assert.doesNotMatch(
    loaderSource,
    /useState|useEffect|useMemo|router|localStorage|set[A-Z]|(?:^|\n)\s*<(?:[A-Z][A-Za-z0-9]*|[a-z][a-z0-9-]*)(?:\s|\/?>)/,
  );
});
