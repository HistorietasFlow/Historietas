import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL(
    "../../app/editar-obra/lib/editar-obra-supabase-file-converter.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/editar-obra/page.tsx", import.meta.url),
  "utf8",
);
const javascript = typescript.transpileModule(source, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const {
  normalizarCategoriaArquivoSupabase,
  criarArquivoObraDeSupabase,
  criarArquivoRemotoEdicaoObra,
} = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`,
);

const arquivoLocal = {
  nome: "local.txt",
  tipo: "text/plain",
  tamanho: 7,
  conteudo: "local",
  categoria: "texto",
  criadoEm: "2026-01-01",
};

test("conversor preserva somente as categorias Supabase válidas", () => {
  for (const categoria of ["texto", "documento", "imagem", "outro"]) {
    assert.equal(normalizarCategoriaArquivoSupabase(categoria), categoria);
  }
  assert.equal(normalizarCategoriaArquivoSupabase("inválida"), "outro");
  assert.equal(normalizarCategoriaArquivoSupabase(null), "outro");
  assert.equal(normalizarCategoriaArquivoSupabase(undefined), "outro");
});

test("arquivo Supabase preserva precedência remota e fallbacks locais", () => {
  assert.deepEqual(
    criarArquivoObraDeSupabase({
      arquivo_url: "  remoto.pdf  ",
      arquivo_nome: "  remoto.pdf  ",
      arquivo_tipo: "application/pdf",
      arquivo_tamanho: 42,
      arquivo_categoria: "documento",
      criada_em: "2026-02-01",
    }, arquivoLocal),
    {
      nome: "remoto.pdf",
      tipo: "application/pdf",
      tamanho: 42,
      conteudo: "remoto.pdf",
      categoria: "documento",
      criadoEm: "2026-02-01",
    },
  );

  assert.deepEqual(
    criarArquivoObraDeSupabase({ arquivo_url: "", arquivo_nome: "remoto.txt" }, arquivoLocal),
    { ...arquivoLocal, nome: "remoto.txt" },
  );
  assert.deepEqual(
    criarArquivoObraDeSupabase({ arquivo_url: "remoto.txt", arquivo_nome: "" }, arquivoLocal),
    { ...arquivoLocal, conteudo: "remoto.txt" },
  );
  assert.equal(criarArquivoObraDeSupabase({}), null);
});

test("arquivo Supabase preserva tamanho, tipo e criação de fallback", () => {
  assert.deepEqual(
    criarArquivoObraDeSupabase({
      arquivo_url: "remoto",
      arquivo_nome: "remoto.txt",
      arquivo_tamanho: Number.NaN,
      arquivo_categoria: "inválida",
    }, arquivoLocal),
    {
      nome: "remoto.txt",
      tipo: "text/plain",
      tamanho: 7,
      conteudo: "remoto",
      categoria: "outro",
      criadoEm: "2026-01-01",
    },
  );
});

test("arquivo remoto preserva guards, tamanho e categoria", () => {
  assert.deepEqual(
    criarArquivoRemotoEdicaoObra({
      arquivo_url: " remoto.pdf ",
      arquivo_nome: " remoto.pdf ",
      arquivo_tipo: "application/pdf",
      arquivo_tamanho: 12,
      arquivo_categoria: "documento",
      criada_em: "2026-03-01",
    }),
    {
      nome: "remoto.pdf",
      tipo: "application/pdf",
      tamanho: 12,
      conteudo: "remoto.pdf",
      categoria: "documento",
      criadoEm: "2026-03-01",
    },
  );
  assert.equal(criarArquivoRemotoEdicaoObra({ arquivo_url: "url" }), null);
  assert.equal(criarArquivoRemotoEdicaoObra({ arquivo_nome: "nome" }), null);
  assert.deepEqual(
    criarArquivoRemotoEdicaoObra({
      arquivo_url: "url",
      arquivo_nome: "nome",
      arquivo_tamanho: Number.NaN,
      arquivo_categoria: "inválida",
    }),
    {
      nome: "nome",
      tipo: "",
      tamanho: 0,
      conteudo: "url",
      categoria: "outro",
      criadoEm: "",
    },
  );
});

test("Editar Obra delega somente a conversão de arquivos Supabase", () => {
  assert.match(
    pageSource,
    /import \{[\s\S]*?criarArquivoObraDeSupabase,[\s\S]*?criarArquivoRemotoEdicaoObra,[\s\S]*?\} from "\.\/lib\/editar-obra-supabase-file-converter";/,
  );
  for (const helper of [
    "normalizarCategoriaArquivoSupabase",
    "criarArquivoObraDeSupabase",
    "criarArquivoRemotoEdicaoObra",
  ]) {
    assert.doesNotMatch(pageSource, new RegExp(`function ${helper}\\(`));
  }
  assert.match(source, /obra\.arquivo_url\?\.trim\(\) \|\| arquivoLocal\?\.conteudo \|\| ""/);
  assert.match(source, /obra\.arquivo_nome\?\.trim\(\) \|\| arquivoLocal\?\.nome \|\| ""/);
  assert.doesNotMatch(source, /supabase|useState|useEffect|window\.|document\./);
});
