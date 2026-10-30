import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const loader = readFileSync(
  new URL(
    "../../app/painel-autor/lib/painel-autor-supabase-data-loader.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/painel-autor/page.tsx", import.meta.url), "utf8",
);

test("loader agregado preserva autenticação, perfil, carregamento e fallbacks", () => {
  for (const contrato of [
    "supabase.auth.getUser()",
    'const userId = usuarioData.user?.id || "";',
    "carregarProfilePainelAutor(userId)",
    "obterNomeProfilePainelAutor(profileAutor)",
    "marcarObrasComDonoPainel(obrasLocais, userId)",
    "filtrarObrasDoUsuarioPainel(obrasLocaisComDono, userId)",
    "aplicarNomeProfileNasObrasPainel(",
    "filtrarListaPorObrasDoUsuario(",
    "carregarObrasPainelAutorSupabase(userId)",
    "if (obraIds.length === 0)",
    "carregarCapitulosPainelAutorSupabase(",
    "const [metricas, comentariosCapitulos] = await Promise.all([",
    "carregarMetricasConteudos({",
    "carregarComentariosCapitulosUsuarioPainel(userId, capituloIds)",
    "prepararEstadoMetricasPainel(metricas)",
    "obraAtual.id === obraBanco.id || slugLocal === slugBanco",
    "converterObraSupabaseParaLocalPainel({",
    "totalCurtidasPainel: metrica?.audiencia.curtidoresUnicos || 0",
    "totalComentariosPainel: metrica?.audiencia.comentaristasUnicos || 0",
    "totalSalvosPainel: metrica?.audiencia.salvadoresUnicos || 0",
    "mesclarResultadoSupabasePainelAutor({",
    'console.warn("Não consegui acessar o Supabase no Painel do Autor:", error)',
    "favoritas: normalizarListaIds(obrasFavoritasLocais)",
    "concluidas: normalizarListaIds(obrasConcluidasLocais)",
  ]) {
    assert.ok(loader.includes(contrato), contrato);
  }
});

test("loader retorna vazio sem usuário autenticado", async () => {
  const javascript = typescript
    .transpileModule(
      loader
        .replace(
          'import { supabase } from "../../../lib/supabase/client";',
          "const supabase = { auth: { getUser: () => Promise.resolve({ data: { user: null } }) } };",
        )
        .replace(/import[\s\S]*?from "[^"]+";\r?\n/g, ""),
      {
        compilerOptions: {
          module: typescript.ModuleKind.ESNext,
          target: typescript.ScriptTarget.ES2022,
        },
      },
    )
    .outputText;
  const { carregarPainelAutorSupabase } = await import(
    `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`,
  );

  assert.deepEqual(
    await carregarPainelAutorSupabase([], ["favorita"], ["concluida"]),
    { obras: [], favoritas: [], concluidas: [] },
  );
});

test("hook inicial delega ao loader e a página delega a exclusão", () => {
  const hook = readFileSync(
    new URL(
      "../../app/painel-autor/hooks/use-painel-autor-initial-data.ts",
      import.meta.url,
    ),
    "utf8",
  );
  assert.match(
    hook,
    /import \{[\s\S]*?carregarPainelAutorSupabase,[\s\S]*?\} from "\.\.\/lib\/painel-autor-supabase-data-loader";/,
  );
  assert.doesNotMatch(hook, /async function carregarPainelAutorSupabase\(/);
  assert.match(
    hook,
    /const dadosSupabase = await carregarPainelAutorSupabase\([\s\S]*?obrasUsuarioLogado,[\s\S]*?obrasFavoritasUsuario,[\s\S]*?obrasConcluidasUsuario[\s\S]*?\);/,
  );
  assert.match(hook, /async function carregarDadosPainelAutor\(\)/);
  assert.match(pagina, /usePainelAutorDeleteWork\(/);
  assert.doesNotMatch(pagina, /async function excluirObra\(/);
});
