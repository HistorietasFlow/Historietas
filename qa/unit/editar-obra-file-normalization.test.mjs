import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";
import "./editar-obra-supabase-file-converter.test.mjs";
import "./editar-obra-metrics-utils.test.mjs";
import "./editar-obra-file-backup-key-utils.test.mjs";
import "./editar-obra-file-backup-storage.test.mjs";
import "./editar-obra-chapter-normalizer.test.mjs";
import "./editar-obra-work-normalizer.test.mjs";
import "./editar-obra-supabase-work-normalizer.test.mjs";
import "./editar-obra-storage-preparation.test.mjs";
import "./editar-obra-local-work-storage.test.mjs";
import "./editar-obra-remote-storage.test.mjs";
import "./editar-obra-diary-action.test.mjs";
import "./editar-obra-form-validation.test.mjs";
import "./editar-obra-cover-style-utils.test.mjs";
import "./editar-obra-tag-utils.test.mjs";
import "./editar-obra-navigation-utils.test.mjs";
import "./editar-obra-form-preparation.test.mjs";
import "./editar-obra-derived-form-values.test.mjs";

const source = readFileSync(new URL("../../app/editar-obra/lib/editar-obra-file-normalization.ts", import.meta.url), "utf8");
const pageSource = readFileSync(new URL("../../app/editar-obra/page.tsx", import.meta.url), "utf8");
const javascript = typescript.transpileModule(source, { compilerOptions: { module: typescript.ModuleKind.ESNext, target: typescript.ScriptTarget.ES2022 } }).outputText;
const { normalizarArquivoObra, ehDataUrlEdicaoObra, normalizarArquivoObraPersistivel } = await import(`data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`);

test("normalização de arquivo preserva rejeições, campos e categorias", () => {
  for (const valor of [null, [], "arquivo", 1]) assert.equal(normalizarArquivoObra(valor), null);
  assert.equal(normalizarArquivoObra({ nome: " ", conteudo: "x" }), null);
  assert.equal(normalizarArquivoObra({ nome: "x", conteudo: " " }), null);
  assert.deepEqual(normalizarArquivoObra({ nome: " arquivo ", tipo: 1, tamanho: Number.NaN, conteudo: " conteúdo ", categoria: "inválida", criadoEm: 2 }), { nome: " arquivo ", tipo: "", tamanho: 0, conteudo: " conteúdo ", categoria: "outro", criadoEm: "" });
  for (const categoria of ["texto", "documento", "imagem", "outro"]) assert.equal(normalizarArquivoObra({ nome: "x", conteudo: "y", categoria }).categoria, categoria);
});

test("Data URL e persistência preservam detecção e rejeição", () => {
  assert.equal(ehDataUrlEdicaoObra(" data:text/plain;base64,abc"), true);
  assert.equal(ehDataUrlEdicaoObra("DATA:text/plain"), false);
  assert.deepEqual(normalizarArquivoObraPersistivel({ nome: "obra.txt", conteudo: "texto", categoria: "texto" }), { nome: "obra.txt", tipo: "", tamanho: 0, conteudo: "texto", categoria: "texto", criadoEm: "" });
  assert.equal(normalizarArquivoObraPersistivel({ nome: "obra.txt", conteudo: "data:text/plain;base64,eA==" }), null);
});

test("Editar Obra delega somente a normalização de arquivos", () => {
  assert.match(pageSource, /from "\.\/lib\/editar-obra-file-normalization";/);
  for (const helper of ["normalizarArquivoObra", "ehDataUrlEdicaoObra", "normalizarArquivoObraPersistivel"]) assert.doesNotMatch(pageSource, new RegExp(`function ${helper}\\(`));
  assert.doesNotMatch(source, /supabase|localStorage|useState|useEffect/);
});
