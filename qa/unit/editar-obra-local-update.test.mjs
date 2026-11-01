import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL("../../app/editar-obra/lib/editar-obra-local-update.ts", import.meta.url),
  "utf8",
);
const saveActionSource = readFileSync(
  new URL(
    "../../app/editar-obra/hooks/use-editar-obra-save-action.ts",
    import.meta.url,
  ),
  "utf8",
);
const localPersistenceSource = readFileSync(
  new URL(
    "../../app/editar-obra/lib/editar-obra-local-persistence.ts",
    import.meta.url,
  ),
  "utf8",
);
const chamadasNormalizacao = [];
globalThis.__chamadasNormalizacaoEditarObra = chamadasNormalizacao;
const javascript = typescript
  .transpileModule(
    source.replace(
      'import { normalizarObra } from "./editar-obra-work-normalizer";',
      `const normalizarObra = (obra, index) => {
  globalThis.__chamadasNormalizacaoEditarObra.push({ obra: { ...obra }, index });
  return { ...obra, id: obra.id || "obra-" + (index + 1), normalizadaNoIndice: index };
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
const { atualizarObraNaListaLocalEdicao } = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`,
);

function criarParametros(obras) {
  return {
    obras,
    obraId: "obra-alvo",
    titulo: "Título atualizado",
    autor: "Autora atualizada",
    genero: "Fantasia",
    formato: "HQ",
    classificacaoIndicativa: "Livre",
    avisosConteudo: ["violencia"],
    sinopse: "Sinopse atualizada",
    tags: ["aventura"],
    capa: "capa.png",
    capaNome: "Capa.png",
    arquivoObra: null,
  };
}

test("reconstrói a lista, preserva a ordem e normaliza duas vezes somente a obra alvo", () => {
  const obras = [
    { id: "outra-obra", titulo: "Outra" },
    { id: "obra-alvo", titulo: "Anterior", tags: ["antiga"] },
  ];
  const entradaOriginal = structuredClone(obras);
  chamadasNormalizacao.length = 0;

  const resultado = atualizarObraNaListaLocalEdicao(criarParametros(obras));

  assert.equal(resultado.length, 2);
  assert.equal(resultado[0].id, "outra-obra");
  assert.equal(resultado[0].titulo, "Outra");
  assert.deepEqual(resultado[1], {
    id: "obra-alvo",
    titulo: "Título atualizado",
    tags: ["aventura"],
    normalizadaNoIndice: 1,
    autor: "Autora atualizada",
    genero: "Fantasia",
    formato: "HQ",
    classificacaoIndicativa: "Livre",
    avisosConteudo: ["violencia"],
    sinopse: "Sinopse atualizada",
    capa: "capa.png",
    capaNome: "Capa.png",
    arquivoObra: null,
  });
  assert.deepEqual(chamadasNormalizacao.map(({ index }) => index), [0, 1, 1]);
  assert.equal(chamadasNormalizacao[2].obra.titulo, "Título atualizado");
  assert.deepEqual(obras, entradaOriginal);
});

test("Editar Obra delega somente a atualização pura da lista local", () => {
  assert.match(
    saveActionSource,
    /import \{ persistirObraLocalEBackupEdicaoObra \} from "\.\.\/lib\/editar-obra-local-persistence";/,
  );
  assert.match(
    saveActionSource,
    /await removerArquivosStorageEdicaoObra\(arquivosAntigosParaRemover\);[\s\S]*?const novasObrasDoUsuario = persistirObraLocalEBackupEdicaoObra\(\{[\s\S]*?obras,[\s\S]*?arquivoObra: arquivoObraFinal,[\s\S]*?\}\);/,
  );
  assert.doesNotMatch(saveActionSource, /atualizarObraNaListaLocalEdicao\(/);
  assert.match(
    localPersistenceSource,
    /import \{ atualizarObraNaListaLocalEdicao \} from "\.\/editar-obra-local-update";/,
  );
  assert.match(source, /return obras\.map\(\(obra, index\) => \{/);
  assert.match(source, /const obraNormalizada = normalizarObra\(obra, index\);/);
  assert.match(source, /if \(obraNormalizada\.id !== obraId\)/);
  assert.match(source, /return normalizarObra\([\s\S]*?\.\.\.obraNormalizada,[\s\S]*?arquivoObra,[\s\S]*?index,/);
  assert.doesNotMatch(source, /supabase|storage|localStorage|useState|useEffect|await|new Date/);
});
