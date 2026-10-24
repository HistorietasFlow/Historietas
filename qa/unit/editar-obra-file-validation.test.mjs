import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL("../../app/editar-obra/lib/editar-obra-file-validation.ts", import.meta.url),
  "utf8",
);
const pageSource = readFileSync(new URL("../../app/editar-obra/page.tsx", import.meta.url), "utf8");
const javascript = typescript.transpileModule(source, {
  compilerOptions: { module: typescript.ModuleKind.ESNext, target: typescript.ScriptTarget.ES2022 },
}).outputText;
const {
  arquivoTemExtensao,
  tipoMimeCompativel,
  arquivoImagemAceito,
  arquivoTextoAceito,
  arquivoPdfAceito,
  identificarCategoriaArquivo,
  arquivoObraAceito,
} = await import(`data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`);
const arquivo = (name, type) => ({ name, type });

test("validadores preservam extensões e MIME de imagens", () => {
  assert.equal(arquivoTemExtensao("CAPA.PNG", [".png"]), true);
  assert.equal(arquivoTemExtensao("capa.txt", [".png"]), false);
  for (const nome of ["capa.png", "capa.JPG", "capa.JPEG", "capa.webp", "capa.GIF"]) {
    assert.equal(arquivoImagemAceito(arquivo(nome, "image/png")), true);
  }
  assert.equal(arquivoImagemAceito(arquivo("capa.png", "application/pdf")), false);
  assert.equal(tipoMimeCompativel(arquivo("x", ""), new Set(["image/png"])), true);
  assert.equal(tipoMimeCompativel(arquivo("x", "application/octet-stream"), new Set(["image/png"])), true);
  assert.equal(tipoMimeCompativel(arquivo("x", "image/jpeg"), new Set(["image/png"])), false);
});

test("validadores preservam texto, PDF, categorias e aceitação de obra", () => {
  assert.equal(arquivoTextoAceito(arquivo("obra.TXT", "text/plain")), true);
  assert.equal(arquivoTextoAceito(arquivo("obra.md", "text/markdown")), true);
  assert.equal(arquivoPdfAceito(arquivo("obra.PDF", "application/pdf")), true);
  assert.equal(identificarCategoriaArquivo(arquivo("capa.png", "image/png")), "imagem");
  assert.equal(identificarCategoriaArquivo(arquivo("obra.txt", "text/plain")), "texto");
  assert.equal(identificarCategoriaArquivo(arquivo("obra.pdf", "application/pdf")), "documento");
  assert.equal(identificarCategoriaArquivo(arquivo("obra.exe", "application/octet-stream")), "outro");
  assert.equal(arquivoObraAceito(arquivo("obra.pdf", "application/pdf")), true);
  assert.equal(arquivoObraAceito(arquivo("obra.exe", "application/octet-stream")), false);
});

test("Editar Obra delega somente a validação de arquivos", () => {
  assert.match(pageSource, /from "\.\/lib\/editar-obra-file-validation";/);
  for (const helper of ["arquivoTemExtensao", "tipoMimeCompativel", "arquivoImagemAceito", "arquivoTextoAceito", "arquivoPdfAceito", "identificarCategoriaArquivo", "arquivoObraAceito"]) {
    assert.doesNotMatch(pageSource, new RegExp(`function ${helper}\\(`));
  }
  assert.match(source, /arquivoPdfAceito\(arquivo\) \|\| arquivoTextoAceito\(arquivo\) \|\| arquivoImagemAceito\(arquivo\)/);
  assert.doesNotMatch(source, /supabase|localStorage|useState|useEffect/);
});
