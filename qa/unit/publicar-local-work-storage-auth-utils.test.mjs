import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const auth = readFileSync(
  new URL("../../app/publicar/lib/publicar-auth-utils.ts", import.meta.url),
  "utf8",
);
const storage = readFileSync(
  new URL("../../app/publicar/lib/publicar-user-storage-utils.ts", import.meta.url),
  "utf8",
);
const obrasLocais = readFileSync(
  new URL("../../app/publicar/lib/publicar-local-work-utils.ts", import.meta.url),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/publicar/page.tsx", import.meta.url),
  "utf8",
);

test("helpers de autenticação de Publicar preservam retorno e nome de metadata", () => {
  for (const helper of ["criarLoginHrefPublicar", "obterNomeMetadataPublicar"]) {
    assert.match(auth, new RegExp(`export function ${helper}\\(`));
  }

  assert.match(auth, /redirectTo: "\/publicar"/);
  assert.match(auth, /return `\/login\?\$\{params\.toString\(\)\}`/);
  for (const chave of [
    "metadata.nome",
    "metadata.name",
    "metadata.full_name",
    "metadata.username",
    "metadata.user_name",
    "metadata.preferred_username",
  ]) {
    assert.ok(auth.includes(chave), `metadata preservada: ${chave}`);
  }
  assert.match(auth, /email\.split\("@"\)\[0\] \|\| ""/);
  assert.doesNotMatch(auth, /supabase|localStorage|useEffect|useState/);
});

test("storage por usuário de Publicar preserva isolamento, SSR e fallbacks", () => {
  for (const helper of [
    "criarStorageKeyUsuarioPublicar",
    "lerStorageUsuarioPublicar",
    "salvarJsonStorageUsuarioPublicar",
  ]) {
    assert.match(storage, new RegExp(`export function ${helper}\\(`));
  }

  assert.match(storage, /`\$\{chave\}:\$\{userIdLimpo\}`/);
  assert.match(storage, /typeof window === "undefined" \|\| !userIdLimpo/);
  assert.match(storage, /localStorage\.getItem\(chaveStorage\)/);
  assert.match(storage, /localStorage\.setItem\(chaveStorage, JSON\.stringify\(valor\)\)/);
  assert.doesNotMatch(storage, /supabase|useEffect|useState/);
});

test("normalização local de Publicar preserva capítulos, arquivos, backups e propriedade", () => {
  for (const helper of [
    "normalizarArquivoObra",
    "normalizarObraSalva",
    "ehDataUrl",
    "prepararObraParaLocalStorage",
    "obterAutorIdObraPublicar",
    "obraPertenceAoUsuarioPublicar",
    "obterChavesBackupArquivoPublicar",
  ]) {
    assert.match(obrasLocais, new RegExp(`export function ${helper}\\(`));
  }

  for (const literal of [
    'arquivo.categoria === "texto"',
    'arquivo.categoria === "documento"',
    'arquivo.categoria === "imagem"',
    'arquivo.categoria === "outro"',
    'return valor.startsWith("data:")',
    'capa: ehDataUrl(obra.capa) ? "" : obra.capa',
    "normalizarAvisosConteudo18(",
    "calcularProgressoLeitura(capitulosNormalizados)",
    "`id:${obra.id}`",
    "`slug:${obra.slug || criarSlugBase(obra.titulo)}`",
    "`titulo:${normalizarTexto(obra.titulo)}`",
  ]) {
    assert.ok(obrasLocais.includes(literal), `contrato preservado: ${literal}`);
  }
  assert.doesNotMatch(obrasLocais, /supabase|localStorage|useEffect|useState/);
});

test("Publicar delega fronteiras locais, storage e autenticação extraídas", () => {
  for (const modulo of [
    "publicar-auth-utils",
    "publicar-user-storage-utils",
    "publicar-local-work-utils",
  ]) {
    assert.match(pagina, new RegExp(`from "\\./lib/${modulo}";`));
  }

  for (const declaracao of [
    "function criarLoginHrefPublicar(",
    "function obterNomeMetadataPublicar(",
    "function criarStorageKeyUsuarioPublicar(",
    "function lerStorageUsuarioPublicar(",
    "function salvarJsonStorageUsuarioPublicar(",
    "function normalizarArquivoObra(",
    "function normalizarObraSalva(",
    "function ehDataUrl(",
    "function prepararObraParaLocalStorage(",
    "function obterAutorIdObraPublicar(",
    "function obraPertenceAoUsuarioPublicar(",
    "function obterChavesBackupArquivoPublicar(",
  ]) {
    assert.equal(pagina.includes(declaracao), false, `declaração removida: ${declaracao}`);
  }

  assert.match(pagina, /async function enviarArquivoStorage\(/);
  assert.match(pagina, /async function carregarNomePerfilPublicar\(/);
  assert.match(pagina, /function carregarBackupArquivosPublicar\(/);
  assert.match(pagina, /async function salvarObra\(/);
});
