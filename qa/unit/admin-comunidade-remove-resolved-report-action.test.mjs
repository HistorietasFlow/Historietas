import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const actionSource = readFileSync(
  new URL(
    "../../app/admin/comunidade/actions/remover-denuncia-resolvida-moderacao.ts",
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

test("persiste a remoção da denúncia resolvida com a query atual", async () => {
  const { supabase, chamadas } = criarSupabase();
  const action = await importarAction(supabase);

  await action.persistirRemocaoDenunciaResolvidaModeracao({
    denunciaId: "denuncia-1",
  });

  assert.deepEqual(chamadas, [
    ["from", "comunidade_denuncias"],
    ["delete"],
    ["eq", "id", "denuncia-1"],
    ["eq", "status", "resolvida"],
    ["select", "id"],
    ["maybeSingle"],
  ]);
});

test("propaga o erro do Supabase", async () => {
  const erro = new Error("falha ao remover");
  const { supabase } = criarSupabase({ error: erro });
  const action = await importarAction(supabase);

  await assert.rejects(
    () =>
      action.persistirRemocaoDenunciaResolvidaModeracao({
        denunciaId: "denuncia-1",
      }),
    erro,
  );
});

test("exige o registro removido retornado", async () => {
  const { supabase } = criarSupabase({ data: null });
  const action = await importarAction(supabase);

  await assert.rejects(
    () =>
      action.persistirRemocaoDenunciaResolvidaModeracao({
        denunciaId: "denuncia-1",
      }),
    {
      message: "A denúncia resolvida não foi encontrada ou não pôde ser removida.",
    },
  );
});

test("Admin Comunidade mantém o fluxo de interface e delega a remoção", () => {
  assert.match(
    pageSource,
    /import \{ persistirRemocaoDenunciaResolvidaModeracao \} from "\.\/actions\/remover-denuncia-resolvida-moderacao";/,
  );

  const funcaoRemocao = pageSource.match(
    /async function removerDenunciaResolvida\([\s\S]*?(?=\n\s*async function removerDenunciaPerfilResolvida)/,
  )?.[0] ?? "";

  assert.match(
    funcaoRemocao,
    /if \(!usuarioId \|\| !ehAdmin\) \{\s*setErro\("Apenas moderadores podem remover denúncias resolvidas\."\);/,
  );
  assert.match(funcaoRemocao, /if \(acaoEmAndamento\)/);
  assert.match(
    funcaoRemocao,
    /const denuncia = denuncias\.find\(\(item\) => item\.id === denunciaId\);/,
  );
  assert.match(funcaoRemocao, /denuncia\.status !== "resolvida"/);
  assert.match(funcaoRemocao, /setMenuDenunciaAbertoId\(""\);/);
  assert.match(
    funcaoRemocao,
    /await persistirRemocaoDenunciaResolvidaModeracao\(\{\s*denunciaId,\s*\}\);/,
  );
  assert.match(
    funcaoRemocao,
    /setDenuncias\(\(denunciasAtuais\) =>\s*denunciasAtuais\.filter\(\(denunciaAtual\) => denunciaAtual\.id !== denunciaId\)/,
  );
  assert.match(
    funcaoRemocao,
    /delete proximasObservacoes\[denunciaId\];/,
  );
  assert.match(
    funcaoRemocao,
    /setSucesso\("Denúncia resolvida removida do painel\."\);/,
  );
  assert.match(funcaoRemocao, /catch \(error\)/);
  assert.match(funcaoRemocao, /finally/);
  assert.doesNotMatch(
    funcaoRemocao,
    /\.from\("comunidade_denuncias"\)/,
  );
  assert.doesNotMatch(
    actionSource,
    /useState|useEffect|useMemo|router|localStorage|set[A-Z]|(?:^|\n)\s*<(?:[A-Z][A-Za-z0-9]*|[a-z][a-z0-9-]*)(?:\s|\/?>)/,
  );
});
