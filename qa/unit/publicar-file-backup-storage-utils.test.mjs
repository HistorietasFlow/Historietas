import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const backup = readFileSync(
  new URL("../../app/publicar/lib/publicar-file-backup-storage-utils.ts", import.meta.url),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/publicar/page.tsx", import.meta.url),
  "utf8",
);

test("backup de arquivos de Publicar preserva leitura, normalização e fallback", () => {
  assert.match(backup, /export function carregarBackupArquivosPublicar\(/);
  assert.match(backup, /if \(!userId\.trim\(\)\)/);
  assert.match(backup, /FILE_BACKUP_STORAGE_KEY/);
  assert.match(backup, /lerStorageUsuarioPublicar\(/);
  assert.match(backup, /JSON\.parse\(backupTexto\)/);
  assert.match(backup, /Object\.entries\(backupJson as Record<string, unknown>\)\.reduce/);
  assert.match(backup, /normalizarArquivoObra\(arquivo\)/);
  assert.match(backup, /return \{\} as Record<string, ArquivoObraLocal>;/);
});

test("backup de arquivos de Publicar preserva chaves, persistência e isolamento", () => {
  assert.match(backup, /export function sincronizarBackupArquivoPublicar\(/);
  assert.match(backup, /const backupAtual = carregarBackupArquivosPublicar\(userId\)/);
  assert.match(backup, /obterChavesBackupArquivoPublicar\(obra\)\.forEach/);
  assert.match(backup, /salvarJsonStorageUsuarioPublicar\(\s*FILE_BACKUP_STORAGE_KEY,/);
  assert.match(backup, /Backup local é camada de proteção\. Não bloqueia a publicação\./);
  assert.doesNotMatch(backup, /supabase|useEffect|useState/);
});

test("persistência local de obras de Publicar preserva arquivos leves e autoria", () => {
  assert.match(backup, /export function salvarObrasLocalmente\(/);
  assert.match(backup, /const userIdLimpo = userId\.trim\(\)/);
  assert.match(backup, /obrasParaSalvar\.map\(prepararObraParaLocalStorage\)/);
  assert.match(backup, /obraPertenceAoUsuarioPublicar\(obra, userIdLimpo\)/);
  assert.match(backup, /salvarJsonStorageUsuarioPublicar\(\s*STORAGE_KEY,/);
  assert.match(backup, /sincronizarBackupArquivoPublicar\(obrasParaSalvar, userIdLimpo\)/);
});

test("Publicar delega backup e persistência local ao módulo dedicado", () => {
  assert.match(pagina, /from "\.\/lib\/publicar-file-backup-storage-utils";/);
  for (const declaracao of [
    "function carregarBackupArquivosPublicar(",
    "function sincronizarBackupArquivoPublicar(",
    "function salvarObrasLocalmente(",
  ]) {
    assert.equal(pagina.includes(declaracao), false, `declaração removida: ${declaracao}`);
  }
  assert.match(pagina, /salvarObrasLocalmente\(novasObrasDoUsuario, userId\)/);
  assert.match(pagina, /async function salvarObra\(/);
  assert.match(pagina, /from "\.\/lib\/publicar-storage-operations";/);
  assert.doesNotMatch(pagina, /async function enviarArquivoStorage\(/);
});
