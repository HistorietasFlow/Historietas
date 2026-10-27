import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const actionSource = readFileSync(
  new URL(
    "../../app/admin/comunidade/actions/remover-conteudo-denunciado-moderacao.ts",
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

function criarSupabase({ error = null } = {}) {
  const chamadas = [];

  return {
    chamadas,
    supabase: {
      rpc(nome, payload) {
        chamadas.push(["rpc", nome, payload]);
        return Promise.resolve({ error });
      },
    },
  };
}

test("remove conteúdo pela RPC transacional com o payload atual", async () => {
  const { supabase, chamadas } = criarSupabase();
  const action = await importarAction(supabase);
  const observacaoFinal = "x".repeat(801);

  await action.removerConteudoDenunciadoModeracao({
    alvoTipo: "comentario_capitulo",
    alvoId: "capitulo-comentario-1",
    observacaoFinal,
  });

  assert.deepEqual(chamadas, [
    [
      "rpc",
      "remover_conteudo_denunciado_transacional",
      {
        p_alvo_tipo: "comentario_capitulo",
        p_alvo_id: "capitulo-comentario-1",
        p_observacao_admin: observacaoFinal.slice(0, 800),
      },
    ],
  ]);
});

test("propaga o erro retornado pela RPC", async () => {
  const erro = new Error("falha transacional");
  const { supabase } = criarSupabase({ error: erro });
  const action = await importarAction(supabase);

  await assert.rejects(
    () =>
      action.removerConteudoDenunciadoModeracao({
        alvoTipo: "obra",
        alvoId: "obra-1",
        observacaoFinal: "Observação",
      }),
    erro,
  );
});

test("Admin Comunidade mantém a orquestração e delega a RPC", () => {
  assert.match(
    pageSource,
    /import \{ removerConteudoDenunciadoModeracao \} from "\.\/actions\/remover-conteudo-denunciado-moderacao";/,
  );
  assert.match(
    pageSource,
    /if \(!usuarioId \|\| !ehAdmin\) \{\s*setErro\("Apenas moderadores podem remover conteúdo denunciado\."\);/,
  );
  assert.match(pageSource, /denuncia\.arquivada/);
  assert.match(pageSource, /denuncia\.status !== "pendente"/);
  assert.match(pageSource, /window\.confirm\(/);
  assert.match(
    pageSource,
    /const observacaoFinal =\s*observacaoAtual \|\|\s*`Conteúdo removido pela moderação em \$\{new Date\(\)\.toLocaleDateString\(/,
  );
  assert.match(pageSource, /const analisadoEm = new Date\(\)\.toISOString\(\);/);
  assert.match(
    pageSource,
    /await removerConteudoDenunciadoModeracao\(\{\s*alvoTipo: denuncia\.alvoTipo,\s*alvoId: denuncia\.alvoId,\s*observacaoFinal,\s*\}\);/,
  );
  assert.match(pageSource, /setDenuncias\(/);
  assert.match(pageSource, /setObservacoes\(/);
  assert.match(pageSource, /rotuloSucessoRemocaoAlvo\(/);

  const funcaoRemocao = pageSource.match(
    /async function removerConteudoDenunciado[\s\S]*?(?=\n\s*async function arquivarDenuncia)/,
  )?.[0] ?? "";
  assert.doesNotMatch(
    funcaoRemocao,
    /remover_conteudo_denunciado_transacional/,
  );
  assert.match(funcaoRemocao, /catch \(error\)/);
  assert.match(funcaoRemocao, /finally/);
  assert.doesNotMatch(
    actionSource,
    /useState|useEffect|useMemo|router|localStorage|set[A-Z]|(?:^|\n)\s*<(?:[A-Z][A-Za-z0-9]*|[a-z][a-z0-9-]*)(?:\s|\/?>)/,
  );
});
