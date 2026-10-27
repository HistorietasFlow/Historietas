import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const actionSource = readFileSync(
  new URL(
    "../../app/admin/comunidade/actions/atualizar-status-denuncia-perfil-moderacao.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/admin/comunidade/page.tsx", import.meta.url),
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
    `data:text/javascript;base64,${Buffer.from(
      `${javascript}\n// ${Math.random()}`,
    ).toString("base64")}`
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
          update(payload) {
            chamadas.push(["update", payload]);
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

test("persiste o status de perfil com a query e o payload atuais", async () => {
  const { supabase, chamadas } = criarSupabase();
  const action = await importarAction(supabase);

  await action.persistirStatusDenunciaPerfilModeracao({
    denunciaId: "denuncia-1",
    novoStatus: "resolvida",
    atualizadoEm: "2026-10-27T12:00:00.000Z",
  });

  assert.deepEqual(chamadas, [
    ["from", "denuncias_perfis"],
    [
      "update",
      {
        status: "resolvida",
        atualizado_em: "2026-10-27T12:00:00.000Z",
      },
    ],
    ["eq", "id", "denuncia-1"],
    ["select", "id"],
    ["maybeSingle"],
  ]);
});

test("propaga o erro do Supabase", async () => {
  const erro = new Error("falha ao atualizar");
  const { supabase } = criarSupabase({ error: erro });
  const action = await importarAction(supabase);

  await assert.rejects(
    () =>
      action.persistirStatusDenunciaPerfilModeracao({
        denunciaId: "denuncia-1",
        novoStatus: "analisada",
        atualizadoEm: "2026-10-27T12:00:00.000Z",
      }),
    erro,
  );
});

test("exige o registro atualizado retornado", async () => {
  const { supabase } = criarSupabase({ data: null });
  const action = await importarAction(supabase);

  await assert.rejects(
    () =>
      action.persistirStatusDenunciaPerfilModeracao({
        denunciaId: "denuncia-1",
        novoStatus: "ignorada",
        atualizadoEm: "2026-10-27T12:00:00.000Z",
      }),
    {
      message:
        "A denúncia de perfil não foi encontrada ou não pôde ser atualizada.",
    },
  );
});

test("Admin Comunidade mantém o fluxo de interface e delega a persistência", () => {
  assert.match(
    pageSource,
    /import \{ persistirStatusDenunciaPerfilModeracao \} from "\.\/actions\/atualizar-status-denuncia-perfil-moderacao";/,
  );
  assert.match(
    pageSource,
    /const atualizadoEm = new Date\(\)\.toISOString\(\);/,
  );
  assert.match(
    pageSource,
    /if \(!usuarioId \|\| !ehAdmin\) \{\s*setErro\("Apenas moderadores podem atualizar denúncias de perfis\."\);/,
  );
  assert.match(
    pageSource,
    /await persistirStatusDenunciaPerfilModeracao\(\{\s*denunciaId,\s*novoStatus,\s*atualizadoEm,\s*\}\);/,
  );
  assert.match(pageSource, /setDenunciasPerfis\(/);
  assert.match(pageSource, /STATUS_PERFIL_LABEL\[\s*novoStatus\s*\]/);

  const funcaoStatusPerfil = pageSource.match(
    /async function atualizarStatusDenunciaPerfil[\s\S]*?(?=\n\s*async function removerDenunciaPerfilResolvida)/,
  )?.[0] ?? "";
  assert.doesNotMatch(funcaoStatusPerfil, /\.from\("denuncias_perfis"\)/);
  assert.match(funcaoStatusPerfil, /catch \(error\)/);
  assert.match(funcaoStatusPerfil, /finally/);
  assert.doesNotMatch(
    actionSource,
    /useState|useEffect|useMemo|router|localStorage|set[A-Z]|(?:^|\n)\s*<(?:[A-Z][A-Za-z0-9]*|[a-z][a-z0-9-]*)(?:\s|\/?>)/,
  );
});
