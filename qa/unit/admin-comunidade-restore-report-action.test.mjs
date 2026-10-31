import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const actionSource = readFileSync(
  new URL(
    "../../app/admin/comunidade/actions/restaurar-denuncia-moderacao.ts",
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
    "../../app/admin/comunidade/hooks/use-admin-comunidade-content-report-actions.ts",
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
    `data:text/javascript;base64,${Buffer.from(
      `${javascript}\n// ${Math.random()}`,
    ).toString("base64")}`,
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

test("persiste a restauração da denúncia com a query atual", async () => {
  const { supabase, chamadas } = criarSupabase();
  const action = await importarAction(supabase);

  await action.persistirRestauracaoDenunciaModeracao({
    denunciaId: "denuncia-1",
  });

  assert.deepEqual(chamadas, [
    ["from", "comunidade_denuncias"],
    ["update", { arquivada: false }],
    ["eq", "id", "denuncia-1"],
    ["select", "id"],
    ["maybeSingle"],
  ]);
});

test("propaga o erro do Supabase", async () => {
  const erro = new Error("falha ao restaurar");
  const { supabase } = criarSupabase({ error: erro });
  const action = await importarAction(supabase);

  await assert.rejects(
    () =>
      action.persistirRestauracaoDenunciaModeracao({
        denunciaId: "denuncia-1",
      }),
    erro,
  );
});

test("exige o registro restaurado retornado", async () => {
  const { supabase } = criarSupabase({ data: null });
  const action = await importarAction(supabase);

  await assert.rejects(
    () =>
      action.persistirRestauracaoDenunciaModeracao({
        denunciaId: "denuncia-1",
      }),
    {
      message: "A denúncia não foi encontrada ou não pôde ser restaurada.",
    },
  );
});

test("Admin Comunidade mantém o fluxo de interface e delega a restauração", () => {
  assert.match(
    hookSource,
    /import \{ persistirRestauracaoDenunciaModeracao \} from "\.\.\/actions\/restaurar-denuncia-moderacao";/,
  );

  const funcaoRestauracao = hookSource.match(
    /async function restaurarDenunciaArquivada\([\s\S]*?(?=\n\s*async function removerDenunciaResolvida)/,
  )?.[0] ?? "";

  assert.match(
    funcaoRestauracao,
    /if \(!usuarioId \|\| !ehAdmin\) \{\s*setErro\("Apenas moderadores podem restaurar denúncias\."\);/,
  );
  assert.match(funcaoRestauracao, /if \(acaoEmAndamento\)/);
  assert.match(funcaoRestauracao, /const chaveAcao = `\$\{denunciaId\}-restaurar`;/);
  assert.match(funcaoRestauracao, /setMenuDenunciaAbertoId\(""\);/);
  assert.match(
    funcaoRestauracao,
    /await persistirRestauracaoDenunciaModeracao\(\{\s*denunciaId,\s*\}\);/,
  );
  assert.match(funcaoRestauracao, /setDenuncias\(/);
  assert.match(funcaoRestauracao, /arquivada: false/);
  assert.match(
    funcaoRestauracao,
    /setSucesso\("Denúncia restaurada para o painel principal\."\);/,
  );
  assert.match(funcaoRestauracao, /catch \(error\)/);
  assert.match(funcaoRestauracao, /finally/);
  assert.match(pageSource, /useAdminComunidadeContentReportActions\(/);
  assert.doesNotMatch(pageSource, /async function restaurarDenunciaArquivada\(/);
  assert.doesNotMatch(
    funcaoRestauracao,
    /\.from\("comunidade_denuncias"\)/,
  );
  assert.doesNotMatch(
    actionSource,
    /useState|useEffect|useMemo|router|localStorage|set[A-Z]|(?:^|\n)\s*<(?:[A-Z][A-Za-z0-9]*|[a-z][a-z0-9-]*)(?:\s|\/?>)/,
  );
});
