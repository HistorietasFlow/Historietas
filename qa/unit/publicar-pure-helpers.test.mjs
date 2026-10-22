import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const identificadores = readFileSync(
  new URL("../../app/publicar/lib/publicar-id-utils.ts", import.meta.url),
  "utf8",
);
const arquivos = readFileSync(
  new URL("../../app/publicar/lib/publicar-file-utils.ts", import.meta.url),
  "utf8",
);
const obras = readFileSync(
  new URL("../../app/publicar/lib/publicar-work-utils.ts", import.meta.url),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/publicar/page.tsx", import.meta.url),
  "utf8",
);

test("helpers de identificador de Publicar preservam UUID seguro e nome de storage", () => {
  for (const helper of [
    "gerarUuidFallback",
    "criarUuidSeguro",
    "criarId",
    "limparNomeArquivoStorage",
  ]) {
    assert.match(identificadores, new RegExp(`export function ${helper}\\(`));
  }

  assert.match(identificadores, /cryptoGlobal\.getRandomValues\(bytes\)/);
  assert.match(identificadores, /cryptoGlobal\.randomUUID\(\)/);
  assert.match(identificadores, /bytes\[6\] = \(bytes\[6\] & 0x0f\) \| 0x40/);
  assert.match(identificadores, /bytes\[8\] = \(bytes\[8\] & 0x3f\) \| 0x80/);
  assert.match(identificadores, /normalizarTexto\(nomeBase\)/);
  assert.match(identificadores, /\|\| "arquivo"/);
  assert.doesNotMatch(identificadores, /supabase|localStorage|useEffect|useState/);
});

test("helpers de arquivo de Publicar preservam extensões, MIME e categorias", () => {
  for (const helper of [
    "identificarCategoriaArquivo",
    "arquivoTemExtensao",
    "arquivoImagemAceito",
    "tipoMimeCompativel",
    "arquivoPdfAceito",
    "arquivoObraAceito",
    "arquivoTextoAceito",
  ]) {
    assert.match(arquivos, new RegExp(`export function ${helper}\\(`));
  }

  for (const literal of [
    'return "imagem";',
    'return "texto";',
    'return "documento";',
    'return "outro";',
    '"application/octet-stream"',
    '[".pdf"]',
    '[".txt", ".md"]',
  ]) {
    assert.ok(arquivos.includes(literal), `literal preservado: ${literal}`);
  }

  assert.match(arquivos, /EXTENSOES_IMAGEM_ACEITAS/);
  assert.match(arquivos, /TIPOS_MIME_IMAGEM_ACEITOS/);
  assert.match(arquivos, /TIPOS_MIME_PDF_ACEITOS/);
  assert.match(arquivos, /TIPOS_MIME_TEXTO_ACEITOS/);
  assert.doesNotMatch(arquivos, /supabase|localStorage|useEffect|useState/);
});

test("helpers de obra de Publicar preservam classificação, slug e progresso", () => {
  for (const helper of [
    "normalizarClassificacaoIndicativaPublicar",
    "criarSlugUnico",
    "calcularProgressoLeitura",
  ]) {
    assert.match(obras, new RegExp(`export function ${helper}\\(`));
  }

  assert.match(obras, /valorNormalizado === "livre" \|\| valorNormalizado === "l"/);
  assert.ok(obras.includes('classificacao.replace("+", "")'));
  assert.match(obras, /criarSlugBase\(titulo\)/);
  assert.match(obras, /while \(slugsUsados\.has\(slugFinal\)\)/);
  assert.match(obras, /Math\.round\(\(capitulosLidos \/ capitulos\.length\) \* 100\)/);
  assert.doesNotMatch(obras, /supabase|localStorage|useEffect|useState/);
});

test("Publicar delega os helpers puros às fronteiras extraídas", () => {
  for (const modulo of [
    "publicar-id-utils",
    "publicar-file-utils",
    "publicar-work-utils",
  ]) {
    assert.match(pagina, new RegExp(`from "\\./lib/${modulo}";`));
  }

  for (const declaracao of [
    "function gerarUuidFallback(",
    "function criarUuidSeguro(",
    "function criarId(",
    "function limparNomeArquivoStorage(",
    "function identificarCategoriaArquivo(",
    "function arquivoTemExtensao(",
    "function arquivoImagemAceito(",
    "function tipoMimeCompativel(",
    "function arquivoPdfAceito(",
    "function arquivoObraAceito(",
    "function arquivoTextoAceito(",
    "function normalizarClassificacaoIndicativaPublicar(",
    "function criarSlugUnico(",
    "function calcularProgressoLeitura(",
  ]) {
    assert.equal(pagina.includes(declaracao), false, `declaração removida: ${declaracao}`);
  }

  assert.match(pagina, /from "\.\/lib\/publicar-storage-operations";/);
  assert.doesNotMatch(pagina, /async function enviarArquivoStorage\(/);
  assert.match(pagina, /from "\.\/lib\/publicar-file-backup-storage-utils";/);
  assert.doesNotMatch(pagina, /function salvarObrasLocalmente\(/);
  assert.match(pagina, /function salvarObra\(/);
});
