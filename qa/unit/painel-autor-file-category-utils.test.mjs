import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const utilsSource = readFileSync(
  new URL(
    "../../app/painel-autor/lib/painel-autor-file-category-utils.ts",
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
const { normalizarCategoriaArquivoSupabase } = await import(
  `data:text/javascript;base64,${Buffer.from(utilsJavascript).toString("base64")}`,
);

test("normalizarCategoriaArquivoSupabase preserva as categorias explícitas", () => {
  assert.equal(normalizarCategoriaArquivoSupabase("texto", "image/png"), "texto");
  assert.equal(normalizarCategoriaArquivoSupabase("documento", "text/plain"), "documento");
  assert.equal(normalizarCategoriaArquivoSupabase("imagem", "application/pdf"), "imagem");
  assert.equal(normalizarCategoriaArquivoSupabase("outro", "text/markdown"), "outro");
});

test("normalizarCategoriaArquivoSupabase preserva a classificação por MIME e fallback", () => {
  assert.equal(normalizarCategoriaArquivoSupabase(null, "IMAGE/PNG"), "imagem");
  assert.equal(normalizarCategoriaArquivoSupabase(null, "application/pdf"), "documento");
  assert.equal(normalizarCategoriaArquivoSupabase(null, "application/msword"), "documento");
  assert.equal(normalizarCategoriaArquivoSupabase(null, "text/plain"), "texto");
  assert.equal(normalizarCategoriaArquivoSupabase(null, "application/markdown"), "texto");
  assert.equal(normalizarCategoriaArquivoSupabase(null, null), "outro");
  assert.equal(normalizarCategoriaArquivoSupabase(null, "application/octet-stream"), "outro");
});

test("Painel do Autor delega somente a categoria de arquivo ao helper extraído", () => {
  assert.match(
    pagina,
    /import \{ normalizarCategoriaArquivoSupabase \} from "\.\/lib\/painel-autor-file-category-utils";/,
  );
  assert.doesNotMatch(pagina, /function normalizarCategoriaArquivoSupabase\(/);
  assert.equal((pagina.match(/\bnormalizarCategoriaArquivoSupabase\b/g) || []).length, 2);
  assert.match(
    pagina,
    /categoria: normalizarCategoriaArquivoSupabase\(\s*obraBanco\.arquivo_categoria,\s*obraBanco\.arquivo_tipo\s*\)/,
  );
  assert.doesNotMatch(utilsSource, /supabase|localStorage|useState|useEffect/);
});
