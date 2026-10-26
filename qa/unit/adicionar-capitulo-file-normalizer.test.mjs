import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const normalizerSource = readFileSync(
  new URL(
    "../../app/adicionar-capitulo/lib/adicionar-capitulo-file-normalizer.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/adicionar-capitulo/page.tsx", import.meta.url),
  "utf8",
);
const normalizerJavascript = typescript.transpileModule(normalizerSource, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const { normalizarArquivoObra } = await import(
  `data:text/javascript;base64,${Buffer.from(normalizerJavascript).toString("base64")}`,
);

test("normalizarArquivoObra rejeita estruturas inválidas", () => {
  assert.equal(normalizarArquivoObra(null), null);
  assert.equal(normalizarArquivoObra("arquivo"), null);
  assert.equal(normalizarArquivoObra([]), null);
  assert.equal(normalizarArquivoObra({ conteudo: "conteúdo" }), null);
  assert.equal(normalizarArquivoObra({ nome: "  ", conteudo: "conteúdo" }), null);
  assert.equal(normalizarArquivoObra({ nome: "arquivo", conteudo: "  " }), null);
});

test("normalizarArquivoObra preserva dados válidos e fallbacks", () => {
  const arquivo = normalizarArquivoObra({
    nome: "  arquivo.txt  ",
    tipo: " text/plain ",
    tamanho: 12.5,
    conteudo: "  conteúdo original  ",
    categoria: "texto",
    criadoEm: "2024-01-01",
  });

  assert.deepEqual(arquivo, {
    nome: "  arquivo.txt  ",
    tipo: " text/plain ",
    tamanho: 12.5,
    conteudo: "  conteúdo original  ",
    categoria: "texto",
    criadoEm: "2024-01-01",
  });
  assert.equal(normalizarArquivoObra({ nome: "a", conteudo: "b", categoria: "documento" }).categoria, "documento");
  assert.equal(normalizarArquivoObra({ nome: "a", conteudo: "b", categoria: "imagem" }).categoria, "imagem");
  assert.equal(normalizarArquivoObra({ nome: "a", conteudo: "b", categoria: "outro" }).categoria, "outro");
  assert.deepEqual(normalizarArquivoObra({
    nome: "a",
    conteudo: "b",
    tipo: null,
    tamanho: "12",
    categoria: "inválida",
    criadoEm: null,
  }), {
    nome: "a",
    tipo: "",
    tamanho: 0,
    conteudo: "b",
    categoria: "outro",
    criadoEm: "",
  });
  assert.equal(normalizarArquivoObra({ nome: "a", conteudo: "b", tamanho: NaN }).tamanho, 0);
  assert.equal(normalizarArquivoObra({ nome: "a", conteudo: "b", tamanho: Infinity }).tamanho, 0);
});

test("Adicionar Capítulo delega somente normalizarArquivoObra ao módulo extraído", () => {
  assert.match(
    pageSource,
    /import \{ normalizarArquivoObra \} from "\.\/lib\/adicionar-capitulo-file-normalizer";/,
  );
  assert.doesNotMatch(pageSource, /function normalizarArquivoObra\(/);
  assert.match(pageSource, /function carregarBackupArquivosObras[\s\S]*?normalizarArquivoObra\(arquivo\)/);
  assert.match(pageSource, /function sincronizarBackupArquivosObras[\s\S]*?normalizarArquivoObra\(obra\.arquivoObra\)/);
  assert.match(pageSource, /function restaurarArquivoObraComBackup[\s\S]*?normalizarArquivoObra\(backup\[chave\]\)/);
  assert.match(pageSource, /function normalizarObra[\s\S]*?arquivoObra: normalizarArquivoObra\(obra\.arquivoObra\)/);
  assert.match(pageSource, /function normalizarObra\(/);
  assert.match(pageSource, /function obterChavesBackupArquivoAdicionarCapitulo\(/);
  assert.doesNotMatch(
    normalizerSource,
    /supabase|localStorage|useState|useEffect|router|<[A-Za-z][A-Za-z0-9]*(?:\s[^>]*)?>[\s\S]*?<\/[A-Za-z]/,
  );
});
