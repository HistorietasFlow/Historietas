import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../../app/adicionar-capitulo/lib/adicionar-capitulo-file-backup-storage.ts", import.meta.url), "utf8");
const page = readFileSync(new URL("../../app/adicionar-capitulo/page.tsx", import.meta.url), "utf8");

test("backup de arquivos preserva carregamento normalizado e falhas silenciosas", () => {
  assert.match(source, /const FILE_BACKUP_STORAGE_KEY = "historietas-arquivos-obras-backup"/);
  assert.match(source, /const userIdLimpo = userId\.trim\(\)/);
  assert.match(source, /if \(!userIdLimpo\) \{\s*return \{\};/);
  assert.match(source, /lerStorageUsuarioAdicionarCapitulo\([\s\S]*?FILE_BACKUP_STORAGE_KEY,[\s\S]*?userIdLimpo/);
  assert.match(source, /backupTexto \? JSON\.parse\(backupTexto\) : \{\}/);
  assert.match(source, /!backupJson \|\| typeof backupJson !== "object" \|\| Array\.isArray\(backupJson\)/);
  assert.match(source, /obraId\.trim\(\) && arquivoNormalizado/);
  assert.match(source, /backupNormalizado\[obraId\] = arquivoNormalizado/);
  assert.match(source, /salvarJsonStorageUsuarioAdicionarCapitulo\([\s\S]*?backupNormalizado/);
  assert.match(source, /catch \{\s*return \{\};/);
});

test("backup de arquivos preserva sincronização por chaves e referências normalizadas", () => {
  assert.match(source, /export function sincronizarBackupArquivosObras\(/);
  assert.match(source, /const backupAtual = carregarBackupArquivosObras\(userIdLimpo\)/);
  assert.match(source, /normalizarArquivoObra\(obra\.arquivoObra\)/);
  assert.match(source, /obterChavesBackupArquivoAdicionarCapitulo\(obra\)\.forEach/);
  assert.match(source, /backupAtual\[chave\] = arquivoNormalizado/);
  assert.match(source, /salvarJsonStorageUsuarioAdicionarCapitulo\([\s\S]*?backupAtual/);
  assert.match(source, /catch \{[\s\S]*?criação do capítulo continua funcionando normalmente/);
});

test("Adicionar Capítulo delega somente backup e mantém consumidores", () => {
  assert.doesNotMatch(page, /function carregarBackupArquivosObras\(/);
  assert.doesNotMatch(page, /function sincronizarBackupArquivosObras\(/);
  assert.match(page, /carregarBackupArquivosObras\(/);
  assert.match(page, /sincronizarBackupArquivosObras\(/);
  assert.match(page, /function carregarObrasLocais\(/);
  assert.match(page, /function salvarObrasAdicionarCapituloStorage\(/);
  assert.doesNotMatch(
    source,
    /from\s+["']react["']|useState|useEffect|useMemo|useRef|localStorage|supabase|router/i,
  );
  assert.doesNotMatch(source, /<(?:[A-Z][A-Za-z0-9]*|[a-z][a-z0-9-]*)(?:\s|\/?>)/);
});
