import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const utilsSource = readFileSync(
  new URL(
    "../../app/painel-autor/lib/painel-autor-file-normalizer.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/painel-autor/page.tsx", import.meta.url),
  "utf8",
);
const utilsJavascript = typescript.transpileModule(utilsSource, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const { normalizarArquivoObra } = await import(
  `data:text/javascript;base64,${Buffer.from(utilsJavascript).toString("base64")}`,
);

test("normalizarArquivoObra rejeita entradas inválidas e campos obrigatórios vazios", () => {
  assert.equal(normalizarArquivoObra(null), null);
  assert.equal(normalizarArquivoObra([]), null);
  assert.equal(normalizarArquivoObra("arquivo"), null);
  assert.equal(normalizarArquivoObra({ conteudo: "texto" }), null);
  assert.equal(normalizarArquivoObra({ nome: "arquivo", conteudo: "  " }), null);
  assert.equal(normalizarArquivoObra({ nome: "  ", conteudo: "texto" }), null);
});

test("normalizarArquivoObra preserva valores recebidos e categorias permitidas", () => {
  for (const categoria of ["texto", "documento", "imagem", "outro"]) {
    const arquivo = {
      nome: "  manuscrito.md  ",
      tipo: "text/markdown",
      tamanho: 412,
      conteudo: "  Conteúdo  ",
      categoria,
      criadoEm: "2026-10-09",
    };

    assert.deepEqual(normalizarArquivoObra(arquivo), arquivo);
  }
});

test("normalizarArquivoObra mantém fallbacks de categoria, campos opcionais e tamanho", () => {
  assert.deepEqual(
    normalizarArquivoObra({
      nome: "arquivo",
      conteudo: "conteúdo",
      tipo: 42,
      tamanho: Number.NaN,
      categoria: "invalida",
      criadoEm: 123,
    }),
    {
      nome: "arquivo",
      tipo: "",
      tamanho: 0,
      conteudo: "conteúdo",
      categoria: "outro",
      criadoEm: "",
    },
  );
  assert.equal(
    normalizarArquivoObra({
      nome: "arquivo",
      conteudo: "conteúdo",
      tamanho: Infinity,
    }).tamanho,
    0,
  );
});

test("Painel do Autor delega somente a normalização de arquivo ao helper extraído", () => {
  assert.match(
    pagina,
    /import \{ normalizarArquivoObra \} from "\.\/lib\/painel-autor-file-normalizer";/,
  );
  assert.match(pagina, /type ArquivoObraLocal = \{/);
  assert.doesNotMatch(pagina, /function normalizarArquivoObra\(/);
  assert.equal((pagina.match(/\bnormalizarArquivoObra\b/g) || []).length, 6);
  assert.match(
    pagina,
    /Boolean\(normalizarArquivoObra\(obra\.arquivoObra\)\)/,
  );
  assert.match(
    pagina,
    /arquivoObra: normalizarArquivoObra\(obra\.arquivoObra\)/,
  );
  assert.doesNotMatch(utilsSource, /supabase|localStorage|useState|useEffect/);
});
