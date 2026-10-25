import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL(
    "../../app/editar-capitulo/lib/editar-capitulo-file-normalization.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/editar-capitulo/page.tsx", import.meta.url),
  "utf8",
);
const backupSource = readFileSync(
  new URL(
    "../../app/editar-capitulo/lib/editar-capitulo-file-backup-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const workNormalizerSource = readFileSync(
  new URL(
    "../../app/editar-capitulo/lib/editar-capitulo-work-normalizer.ts",
    import.meta.url,
  ),
  "utf8",
);
const javascript = typescript.transpileModule(source, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const { normalizarArquivoObra } = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`,
);

test("normalizador de arquivo de Editar Capítulo rejeita entradas e campos obrigatórios inválidos", () => {
  for (const valor of [null, undefined, "arquivo", 1, true, []]) {
    assert.equal(normalizarArquivoObra(valor), null);
  }

  assert.equal(normalizarArquivoObra({ nome: " ", conteudo: "texto" }), null);
  assert.equal(normalizarArquivoObra({ nome: "arquivo", conteudo: " " }), null);
});

test("normalizador de arquivo de Editar Capítulo preserva valores validados e fallbacks", () => {
  const arquivo = normalizarArquivoObra({
    nome: " arquivo ",
    tipo: " text/plain ",
    tamanho: -12.5,
    conteudo: " conteúdo ",
    categoria: "texto",
    criadoEm: " 2026-01-01 ",
  });

  assert.deepEqual(arquivo, {
    nome: " arquivo ",
    tipo: " text/plain ",
    tamanho: -12.5,
    conteudo: " conteúdo ",
    categoria: "texto",
    criadoEm: " 2026-01-01 ",
  });

  for (const categoria of ["texto", "documento", "imagem", "outro"]) {
    assert.equal(
      normalizarArquivoObra({ nome: "arquivo", conteudo: "texto", categoria })
        .categoria,
      categoria,
    );
  }

  assert.deepEqual(
    normalizarArquivoObra({
      nome: "arquivo",
      tipo: 1,
      tamanho: Number.NaN,
      conteudo: "texto",
      categoria: "invalida",
      criadoEm: 1,
    }),
    {
      nome: "arquivo",
      tipo: "",
      tamanho: 0,
      conteudo: "texto",
      categoria: "outro",
      criadoEm: "",
    },
  );

  for (const tamanho of [Infinity, "12", null]) {
    assert.equal(
      normalizarArquivoObra({ nome: "arquivo", conteudo: "texto", tamanho })
        .tamanho,
      0,
    );
  }
});

test("Editar Capítulo delega somente a normalização de arquivo ao módulo extraído", () => {
  assert.match(
    workNormalizerSource,
    /import \{ normalizarArquivoObra \} from "\.\/editar-capitulo-file-normalization";/,
  );
  assert.doesNotMatch(pageSource, /function normalizarArquivoObra\(/);
  assert.doesNotMatch(
    pageSource,
    /import \{ normalizarArquivoObra \} from "\.\/lib\/editar-capitulo-file-normalization";/,
  );
  assert.match(
    workNormalizerSource,
    /arquivoObra: normalizarArquivoObra\(obra\.arquivoObra\)/,
  );
  assert.match(
    backupSource,
    /const arquivoNormalizado = normalizarArquivoObra\(arquivo\);/,
  );
  assert.match(
    backupSource,
    /\.map\(\(chave\) => normalizarArquivoObra\(backup\[chave\]\)\)/,
  );
});
