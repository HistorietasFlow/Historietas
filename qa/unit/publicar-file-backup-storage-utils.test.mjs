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
const controladorPagina = readFileSync(
  new URL("../../app/publicar/hooks/use-publicar-page-controller.ts", import.meta.url),
  "utf8",
);
const controladorFormulario = readFileSync(
  new URL("../../app/publicar/hooks/use-publicar-form-controller.ts", import.meta.url),
  "utf8",
);
const acaoSubmissao = readFileSync(
  new URL("../../app/publicar/lib/publicar-submission-action.ts", import.meta.url),
  "utf8",
);
const hookSubmissao = readFileSync(
  new URL("../../app/publicar/hooks/use-publicar-submission.ts", import.meta.url),
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
  assert.match(pagina, /import \{ usePublicarPageController \} from "\.\/hooks\/use-publicar-page-controller";/);
  assert.match(controladorPagina, /import \{ usePublicarFormController \} from "\.\/use-publicar-form-controller";/);
  assert.match(controladorFormulario, /import \{ usePublicarSubmission \} from "\.\/use-publicar-submission";/);
  assert.doesNotMatch(pagina, /from "\.\/lib\/publicar-submission-action";/);
  for (const declaracao of [
    "function carregarBackupArquivosPublicar(",
    "function sincronizarBackupArquivoPublicar(",
    "function salvarObrasLocalmente(",
  ]) {
    assert.equal(pagina.includes(declaracao), false, `declaração removida: ${declaracao}`);
  }
  assert.doesNotMatch(pagina, /salvarObrasLocalmente\(novasObrasDoUsuario, userId\)/);
  assert.match(hookSubmissao, /from "\.\.\/lib\/publicar-submission-action";/);
  assert.match(hookSubmissao, /async function salvarObra\(event: FormEvent<HTMLFormElement>\)/);
  assert.match(acaoSubmissao, /from "\.\/publicar-file-backup-storage-utils";/);
  assert.match(acaoSubmissao, /salvarObrasLocalmente\(novasObrasDoUsuario, userId\)/);
  assert.match(acaoSubmissao, /export async function salvarObraPublicar\(/);
  assert.match(acaoSubmissao, /from "\.\/publicar-storage-operations";/);
  assert.doesNotMatch(pagina, /async function enviarArquivoStorage\(/);
});
