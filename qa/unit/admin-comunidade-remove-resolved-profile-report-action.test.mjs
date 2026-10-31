import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const actionSource = readFileSync(
  new URL(
    "../../app/admin/comunidade/actions/remover-denuncia-perfil-resolvida-moderacao.ts",
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
    "../../app/admin/comunidade/hooks/use-admin-comunidade-profile-report-actions.ts",
    import.meta.url,
  ),
  "utf8",
);

async function importarAction(supabase) {
  const javascript = typescript.transpileModule(
    actionSource.replace(
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
    `data:text/javascript;base64,${Buffer.from(`${javascript}\n// ${Math.random()}`).toString("base64")}`,
  );
}

function criarSupabase({ data = { id: "denuncia-1" }, error = null } = {}) {
  const chamadas = [];
  return {
    chamadas,
    supabase: {
      from(tabela) {
        chamadas.push(["from", tabela]);
        return {
          delete() {
            chamadas.push(["delete"]);
            return this;
          },
          eq(campo, valor) {
            chamadas.push(["eq", campo, valor]);
            return this;
          },
          select(colunas) {
            chamadas.push(["select", colunas]);
            return this;
          },
          maybeSingle() {
            chamadas.push(["maybeSingle"]);
            return Promise.resolve({ data, error });
          },
        };
      },
    },
  };
}

test("persiste a remoção da denúncia de perfil resolvida com a query atual", async () => {
  const { supabase, chamadas } = criarSupabase();
  const action = await importarAction(supabase);
  await action.persistirRemocaoDenunciaPerfilResolvidaModeracao({ denunciaId: "denuncia-1" });
  assert.deepEqual(chamadas, [
    ["from", "denuncias_perfis"],
    ["delete"],
    ["eq", "id", "denuncia-1"],
    ["eq", "status", "resolvida"],
    ["select", "id"],
    ["maybeSingle"],
  ]);
});

test("propaga o erro do Supabase e exige o registro removido", async () => {
  const erro = new Error("falha ao remover");
  const comErro = criarSupabase({ error: erro });
  const actionComErro = await importarAction(comErro.supabase);
  await assert.rejects(
    () => actionComErro.persistirRemocaoDenunciaPerfilResolvidaModeracao({ denunciaId: "denuncia-1" }),
    erro,
  );
  const semRegistro = criarSupabase({ data: null });
  const actionSemRegistro = await importarAction(semRegistro.supabase);
  await assert.rejects(
    () => actionSemRegistro.persistirRemocaoDenunciaPerfilResolvidaModeracao({ denunciaId: "denuncia-1" }),
    { message: "A denúncia de perfil resolvida não foi encontrada ou não pôde ser removida." },
  );
});

test("hook de Admin Comunidade mantém o fluxo de interface e delega a remoção de perfil", () => {
  assert.match(hookSource, /import \{ persistirRemocaoDenunciaPerfilResolvidaModeracao \} from "\.\.\/actions\/remover-denuncia-perfil-resolvida-moderacao";/);
  const funcao = hookSource.match(/async function removerDenunciaPerfilResolvida\([\s\S]*?(?=\n\s*return \{)/)?.[0] ?? "";
  assert.match(funcao, /if \(!usuarioId \|\| !ehAdmin\)/);
  assert.match(funcao, /denunciasPerfis\.find\(\(item\) => item\.id === denunciaId\)/);
  assert.match(funcao, /denuncia\.status !== "resolvida"/);
  assert.match(funcao, /setMenuDenunciaAbertoId\(""\)/);
  assert.match(funcao, /await persistirRemocaoDenunciaPerfilResolvidaModeracao\(\{\s*denunciaId,\s*\}\);/);
  assert.match(funcao, /setDenunciasPerfis\(/);
  assert.match(funcao, /Denúncia de perfil resolvida removida do painel\./);
  assert.match(funcao, /catch \(error\)/);
  assert.match(funcao, /finally/);
  assert.doesNotMatch(funcao, /\.from\("denuncias_perfis"\)/);
  assert.doesNotMatch(pageSource, /import \{ supabase \} from "\.\.\/\.\.\/\.\.\/lib\/supabase\/client";/);
  assert.match(pageSource, /useAdminComunidadeProfileReportActions\(\{/);
  assert.doesNotMatch(hookSource, /useState|useEffect|useMemo|router|localStorage|supabase|(?:^|\n)\s*<(?:[A-Z][A-Za-z0-9]*|[a-z][a-z0-9-]*)(?:\s|\/?>)/);
  assert.doesNotMatch(actionSource, /useState|useEffect|useMemo|router|localStorage|set[A-Z]|(?:^|\n)\s*<(?:[A-Z][A-Za-z0-9]*|[a-z][a-z0-9-]*)(?:\s|\/?>)/);
});
