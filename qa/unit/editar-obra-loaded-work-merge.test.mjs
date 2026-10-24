import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL(
    "../../app/editar-obra/lib/editar-obra-loaded-work-merge.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/editar-obra/page.tsx", import.meta.url),
  "utf8",
);
const chamadasNormalizacao = [];
globalThis.__chamadasNormalizacaoObrasCarregadasEditarObra =
  chamadasNormalizacao;

const javascript = typescript
  .transpileModule(
    source.replace(
      'import { normalizarObra } from "./editar-obra-work-normalizer";',
      `const normalizarObra = (obra, index) => {
  globalThis.__chamadasNormalizacaoObrasCarregadasEditarObra.push({
    obra: { ...obra },
    index,
  });
  return { ...obra, normalizadaNoIndice: index };
};`,
    ),
    {
      compilerOptions: {
        module: typescript.ModuleKind.ESNext,
        target: typescript.ScriptTarget.ES2022,
      },
    },
  )
  .outputText;
const { prepararObrasCarregadasEdicaoObra } = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`,
);

function criarObra(campos = {}) {
  return {
    id: "obra-remota",
    autor: "Autor remoto",
    autorId: "",
    capitulos: [{ id: "capitulo-remoto" }],
    ...campos,
  };
}

test("prepara a obra remota com profile sem restaurar capítulos do cache", () => {
  const obraNormalizadaSupabase = criarObra();
  const obrasAutorizadas = [
    criarObra({
      id: "obra-remota",
      capitulos: [{ id: "capitulo-removido-remotamente" }],
    }),
    criarObra({ id: "outra-obra" }),
  ];
  const entradaOriginal = structuredClone(obrasAutorizadas);
  chamadasNormalizacao.length = 0;

  const resultado = prepararObrasCarregadasEdicaoObra({
    obraNormalizadaSupabase,
    nomeProfileUsuario: "Nome do profile",
    userId: "usuario-atual",
    obrasAutorizadas,
    obraIdParam: "obra-remota",
  });

  assert.deepEqual(resultado.obraSupabaseComAutorProfile, {
    ...obraNormalizadaSupabase,
    autor: "Nome do profile",
    autorId: "usuario-atual",
    normalizadaNoIndice: 0,
  });
  assert.deepEqual(resultado.obraSupabaseComAutorProfile.capitulos, [
    { id: "capitulo-remoto" },
  ]);
  assert.deepEqual(
    resultado.obrasAtualizadas.map((obra) => obra.id),
    ["obra-remota", "outra-obra"],
  );
  assert.deepEqual(chamadasNormalizacao.map(({ index }) => index), [0]);
  assert.deepEqual(obrasAutorizadas, entradaOriginal);
});

test("mantém diretamente a obra normalizada quando o profile não tem nome", () => {
  const obraNormalizadaSupabase = criarObra({ autorId: "autor-remoto" });
  chamadasNormalizacao.length = 0;

  const resultado = prepararObrasCarregadasEdicaoObra({
    obraNormalizadaSupabase,
    nomeProfileUsuario: "",
    userId: "usuario-atual",
    obrasAutorizadas: [],
    obraIdParam: "obra-remota",
  });

  assert.strictEqual(resultado.obraSupabaseComAutorProfile, obraNormalizadaSupabase);
  assert.deepEqual(resultado.obrasAtualizadas, [obraNormalizadaSupabase]);
  assert.deepEqual(chamadasNormalizacao, []);
});

test("Editar Obra delega somente a reconciliação pura das obras carregadas", () => {
  assert.match(
    pageSource,
    /import \{ prepararObrasCarregadasEdicaoObra \} from "\.\/lib\/editar-obra-loaded-work-merge";/,
  );
  assert.match(
    pageSource,
    /const obraNormalizadaSupabase = normalizarObraSupabase\([\s\S]*?const \{ obraSupabaseComAutorProfile, obrasAtualizadas \} =\s*prepararObrasCarregadasEdicaoObra\(\{[\s\S]*?obraNormalizadaSupabase,[\s\S]*?obrasAutorizadas,[\s\S]*?\}\);/,
  );
  assert.match(
    pageSource,
    /salvarObrasDoUsuarioPreservandoOutrasContas\(obrasAtualizadas, userId\)/,
  );
  assert.match(
    source,
    /normalizarObra\(\s*\{[\s\S]*?\.\.\.obraNormalizadaSupabase,[\s\S]*?autor: nomeProfileUsuario,[\s\S]*?autorId: obraNormalizadaSupabase\.autorId \|\| userId,[\s\S]*?\},\s*0,/,
  );
  assert.match(
    source,
    /\[\s*obraSupabaseComAutorProfile,\s*\.\.\.obrasAutorizadas\.filter\(\(obra\) => obra\.id !== obraIdParam\),\s*\]/,
  );
  assert.doesNotMatch(source, /supabase|localStorage|storage|useState|useEffect|await|new Date/);
});
