import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

function transpilarModulo(source) {
  return typescript.transpileModule(source, {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  }).outputText;
}

async function importarModulo(source) {
  return import(
    `data:text/javascript;base64,${Buffer.from(transpilarModulo(source)).toString("base64")}`,
  );
}

const source = readFileSync(
  new URL(
    "../../app/editar-obra/lib/editar-obra-storage-preparation.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/editar-obra/page.tsx", import.meta.url),
  "utf8",
);
const localWorkStorageSource = readFileSync(
  new URL(
    "../../app/editar-obra/lib/editar-obra-local-work-storage.ts",
    import.meta.url,
  ),
  "utf8",
);
const fileNormalizationSource = readFileSync(
  new URL(
    "../../app/editar-obra/lib/editar-obra-file-normalization.ts",
    import.meta.url,
  ),
  "utf8",
);
const { ehDataUrlEdicaoObra, normalizarArquivoObraPersistivel } =
  await importarModulo(fileNormalizationSource);

globalThis.__editarObraEhDataUrl = ehDataUrlEdicaoObra;
globalThis.__editarObraNormalizarArquivoPersistivel =
  normalizarArquivoObraPersistivel;

const sourceComDependencias = source.replace(
  /import \{\r?\n  ehDataUrlEdicaoObra,\r?\n  normalizarArquivoObraPersistivel,\r?\n\} from "\.\/editar-obra-file-normalization";/,
  "const ehDataUrlEdicaoObra = globalThis.__editarObraEhDataUrl;\nconst normalizarArquivoObraPersistivel = globalThis.__editarObraNormalizarArquivoPersistivel;",
);
const { prepararObraEdicaoParaStorage } = await importarModulo(
  sourceComDependencias,
);

function arquivo(conteudo = "arquivo persistível") {
  return {
    nome: "obra.txt",
    tipo: "text/plain",
    tamanho: 12,
    conteudo,
    categoria: "texto",
    criadoEm: "2026-01-01",
  };
}

test("preserva capa e arquivo persistíveis sem alterar campos adicionais", () => {
  const obra = {
    id: "obra-1",
    capa: " capa-original.png ",
    arquivoObra: arquivo(),
    titulo: "Título original",
    metadados: { interno: true },
  };
  const resultado = prepararObraEdicaoParaStorage(obra);

  assert.notEqual(resultado, obra);
  assert.equal(resultado.capa, " capa-original.png ");
  assert.deepEqual(resultado.arquivoObra, arquivo());
  assert.equal(resultado.titulo, "Título original");
  assert.equal(resultado.metadados, obra.metadados);
});

test("remove capas e arquivos Data URL somente da representação persistível", () => {
  const obra = {
    id: "obra-2",
    capa: " data:image/png;base64,capa ",
    arquivoObra: arquivo("data:text/plain;base64,YXJxdWl2bw=="),
    titulo: "Obra com previews",
  };
  const antes = structuredClone(obra);
  const resultado = prepararObraEdicaoParaStorage(obra);

  assert.equal(resultado.capa, "");
  assert.equal(resultado.arquivoObra, null);
  assert.deepEqual(obra, antes);
});

test("normaliza arquivo inválido com o helper persistível sem mutar a entrada", () => {
  const obra = {
    id: "obra-3",
    capa: "capa.png",
    arquivoObra: { nome: " ", conteudo: "texto" },
    outroCampo: ["preservado"],
  };
  const antes = structuredClone(obra);
  const resultado = prepararObraEdicaoParaStorage(obra);

  assert.equal(resultado.arquivoObra, null);
  assert.deepEqual(resultado.outroCampo, ["preservado"]);
  assert.deepEqual(obra, antes);
});

test("Editar Obra delega somente a preparação persistível", () => {
  assert.doesNotMatch(pageSource, /prepararObraEdicaoParaStorage/);
  assert.doesNotMatch(pageSource, /function prepararObraEdicaoParaStorage\(/);
  assert.match(
    localWorkStorageSource,
    /import \{ prepararObraEdicaoParaStorage \} from "\.\/editar-obra-storage-preparation";/,
  );
  assert.match(localWorkStorageSource, /\.map\(prepararObraEdicaoParaStorage\)/);
  assert.match(
    source,
    /from "\.\/editar-obra-file-normalization";/,
  );
  assert.match(
    source,
    /capa: ehDataUrlEdicaoObra\(obra\.capa\) \? "" : obra\.capa/,
  );
  assert.match(
    source,
    /arquivoObra: normalizarArquivoObraPersistivel\(obra\.arquivoObra\)/,
  );
  assert.doesNotMatch(source, /supabase|localStorage|useState|useEffect|window\./);
});
