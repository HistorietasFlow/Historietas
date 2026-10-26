import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(new URL("../../app/adicionar-capitulo/lib/adicionar-capitulo-storage-preparation.ts", import.meta.url), "utf8");
const page = readFileSync(new URL("../../app/adicionar-capitulo/page.tsx", import.meta.url), "utf8");
const javascript = typescript.transpileModule(source, { compilerOptions: { module: typescript.ModuleKind.ESNext, target: typescript.ScriptTarget.ES2022 } }).outputText;
const { ehDataUrlAdicionarCapitulo, prepararObraAdicionarCapituloParaStorage } = await import(`data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`);

test("preparação de storage remove somente data URLs sem mutar entrada", () => {
  assert.equal(ehDataUrlAdicionarCapitulo("data:image/png;base64,x"), true); assert.equal(ehDataUrlAdicionarCapitulo(" DATA:x"), false); assert.equal(ehDataUrlAdicionarCapitulo("https://x"), false);
  const arquivo = { conteudo: "data:text/plain,x", nome: "a", tipo: "text/plain", tamanho: 1 }; const obra = { capa: "data:image/png,x", arquivoObra: arquivo, outro: "preservado" };
  const preparada = prepararObraAdicionarCapituloParaStorage(obra); assert.equal(preparada.capa, ""); assert.equal(preparada.arquivoObra.conteudo, ""); assert.equal(preparada.arquivoObra.nome, "a"); assert.equal(preparada.outro, "preservado"); assert.equal(obra.capa, "data:image/png,x"); assert.equal(arquivo.conteudo, "data:text/plain,x");
  const normal = prepararObraAdicionarCapituloParaStorage({ capa: "https://capa", arquivoObra: { conteudo: "texto", nome: "n" } }); assert.equal(normal.capa, "https://capa"); assert.equal(normal.arquivoObra.conteudo, "texto"); assert.equal(prepararObraAdicionarCapituloParaStorage({ capa: "x" }).arquivoObra, null);
});

test("Adicionar Capítulo delega somente preparação para storage", () => {
  assert.doesNotMatch(page, /function ehDataUrlAdicionarCapitulo\(/); assert.doesNotMatch(page, /function prepararObraAdicionarCapituloParaStorage\(/); assert.match(page, /obrasParaSalvar\.map\(\s*prepararObraAdicionarCapituloParaStorage/); assert.match(page, /sincronizarBackupArquivosObras\(obrasParaSalvar/); assert.doesNotMatch(source, /useState|useEffect|localStorage|\.from\(|router/);
});
