import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const actionSource = readFileSync(
  new URL(
    "../../app/admin/comunidade/actions/arquivar-denuncia-moderacao.ts",
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

test("persiste o arquivamento da denúncia com a query atual", async () => {
  const { supabase, chamadas } = criarSupabase();
  const action = await importarAction(supabase);

  await action.persistirArquivamentoDenunciaModeracao({
    denunciaId: "denuncia-1",
  });

  assert.deepEqual(chamadas, [
    ["from", "comunidade_denuncias"],
    ["update", { arquivada: true }],
    ["eq", "id", "denuncia-1"],
    ["select", "id"],
    ["maybeSingle"],
  ]);
});

test("propaga o erro do Supabase", async () => {
  const erro = new Error("falha ao arquivar");
  const { supabase } = criarSupabase({ error: erro });
  const action = await importarAction(supabase);

  await assert.rejects(
    () =>
      action.persistirArquivamentoDenunciaModeracao({
        denunciaId: "denuncia-1",
      }),
    erro,
  );
});

test("exige o registro arquivado retornado", async () => {
  const { supabase } = criarSupabase({ data: null });
  const action = await importarAction(supabase);

  await assert.rejects(
    () =>
      action.persistirArquivamentoDenunciaModeracao({
        denunciaId: "denuncia-1",
      }),
    {
      message: "A denúncia não foi encontrada ou não pôde ser arquivada.",
    },
  );
});

test("Admin Comunidade mantém o fluxo de interface e delega o arquivamento", () => {
  assert.match(
    pageSource,
    /import \{ persistirArquivamentoDenunciaModeracao \} from "\.\/actions\/arquivar-denuncia-moderacao";/,
  );

  const funcaoArquivamento = pageSource.match(
    /async function arquivarDenuncia\([\s\S]*?(?=\n\s*async function restaurarDenunciaArquivada)/,
  )?.[0] ?? "";

  assert.match(
    funcaoArquivamento,
    /if \(!usuarioId \|\| !ehAdmin\) \{\s*setErro\("Apenas moderadores podem arquivar denúncias\."\);/,
  );
  assert.match(funcaoArquivamento, /if \(acaoEmAndamento\)/);
  assert.match(funcaoArquivamento, /const chaveAcao = `\$\{denunciaId\}-arquivar`;/);
  assert.match(funcaoArquivamento, /setMenuDenunciaAbertoId\(""\);/);
  assert.match(
    funcaoArquivamento,
    /await persistirArquivamentoDenunciaModeracao\(\{\s*denunciaId,\s*\}\);/,
  );
  assert.match(funcaoArquivamento, /setDenuncias\(/);
  assert.match(funcaoArquivamento, /arquivada: true/);
  assert.match(
    funcaoArquivamento,
    /setSucesso\("Denúncia arquivada e ocultada do painel principal\."\);/,
  );
  assert.match(funcaoArquivamento, /catch \(error\)/);
  assert.match(funcaoArquivamento, /finally/);
  assert.doesNotMatch(
    funcaoArquivamento,
    /\.from\("comunidade_denuncias"\)/,
  );
  assert.doesNotMatch(
    actionSource,
    /useState|useEffect|useMemo|router|localStorage|set[A-Z]|(?:^|\n)\s*<(?:[A-Z][A-Za-z0-9]*|[a-z][a-z0-9-]*)(?:\s|\/?>)/,
  );
});
