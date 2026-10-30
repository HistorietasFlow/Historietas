import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL(
    "../../app/editar-obra/lib/editar-obra-local-selection.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/editar-obra/page.tsx", import.meta.url),
  "utf8",
);
const initialLoadSource = readFileSync(
  new URL(
    "../../app/editar-obra/hooks/use-editar-obra-initial-load.ts",
    import.meta.url,
  ),
  "utf8",
);

async function criarModulo() {
  const javascript = typescript
    .transpileModule(
      source.replace(
        'import { usuarioPodeEditarObraLocal } from "./editar-obra-ownership-utils";',
        `const usuarioPodeEditarObraLocal = (obra, userId) => {
          const usuarioAtual = userId.trim().toLowerCase();
          const autorIdObra = (obra.autorId || "").trim().toLowerCase();
          return Boolean(usuarioAtual) && (!autorIdObra || autorIdObra === usuarioAtual);
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

  return import(
    "data:text/javascript;base64," +
      Buffer.from(javascript).toString("base64") +
      "#" +
      Math.random(),
  );
}

test("seleciona obras autorizadas sem alterar a ordem ou a lista original", async () => {
  const { selecionarObrasLocaisAutorizadasEdicaoObra } = await criarModulo();
  const obrasNormalizadas = [
    { id: "obra-autorizada", autorId: " USUARIO-1 " },
    { id: "obra-outra-conta", autorId: "usuario-2" },
    { id: "obra-antiga" },
  ];
  const obrasOriginais = structuredClone(obrasNormalizadas);

  const resultado = selecionarObrasLocaisAutorizadasEdicaoObra({
    obrasNormalizadas,
    userId: " usuario-1 ",
    obraId: "obra-antiga",
  });

  assert.deepEqual(resultado.obrasAutorizadas, [
    obrasNormalizadas[0],
    obrasNormalizadas[2],
  ]);
  assert.equal(resultado.obraLocal, obrasNormalizadas[2]);
  assert.notEqual(resultado.obrasAutorizadas, obrasNormalizadas);
  assert.deepEqual(obrasNormalizadas, obrasOriginais);
});

test("mantém obra local indefinida quando a obra alvo não estiver autorizada", async () => {
  const { selecionarObrasLocaisAutorizadasEdicaoObra } = await criarModulo();

  const resultado = selecionarObrasLocaisAutorizadasEdicaoObra({
    obrasNormalizadas: [{ id: "obra-outra-conta", autorId: "usuario-2" }],
    userId: "usuario-1",
    obraId: "obra-outra-conta",
  });

  assert.deepEqual(resultado.obrasAutorizadas, []);
  assert.equal(resultado.obraLocal, undefined);
});

test("Editar Obra delega as duas seleções locais ao helper puro", () => {
  assert.match(
    initialLoadSource,
    /import \{ selecionarObrasLocaisAutorizadasEdicaoObra \} from "\.\.\/lib\/editar-obra-local-selection";/,
  );
  assert.doesNotMatch(
    pageSource,
    /import \{ usuarioPodeEditarObraLocal \} from "\.\/lib\/editar-obra-ownership-utils";/,
  );
  assert.equal(
    (initialLoadSource.match(/selecionarObrasLocaisAutorizadasEdicaoObra\(/g) || [])
      .length,
    2,
  );
  assert.match(
    initialLoadSource,
    /carregarObrasLocalStorageEdicaoObra\(userId\)[\s\S]*?selecionarObrasLocaisAutorizadasEdicaoObra\([\s\S]*?setObras\(obrasAutorizadas\)/,
  );
  assert.match(
    initialLoadSource,
    /carregarCapitulosSupabaseEdicaoObra\([\s\S]*?selecionarObrasLocaisAutorizadasEdicaoObra\([\s\S]*?normalizarObraSupabase\(/,
  );
  assert.match(
    source,
    /import \{ usuarioPodeEditarObraLocal \} from "\.\/editar-obra-ownership-utils";/,
  );
  assert.match(
    source,
    /obrasNormalizadas\.filter\(\(obra\) =>\s*usuarioPodeEditarObraLocal\(obra, userId\)/,
  );
  assert.match(
    source,
    /obrasAutorizadas\.find\(\(obra\) => obra\.id === obraId\)/,
  );
});
