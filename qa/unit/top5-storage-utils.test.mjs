import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const storagePath = new URL(
  "../../app/perfil-autor/top-5/lib/top5-storage-utils.ts",
  import.meta.url,
);
const pagePath = new URL(
  "../../app/perfil-autor/top-5/page.tsx",
  import.meta.url,
);

test("Top 5 delega somente helpers de storage por usuário", async () => {
  const [storage, page] = await Promise.all([
    readFile(storagePath, "utf8"),
    readFile(pagePath, "utf8"),
  ]);

  assert.match(storage, /export function criarStorageKeyUsuarioTop5/);
  assert.match(storage, /export function lerStorageUsuarioTop5/);
  assert.match(storage, /export function salvarJsonStorageUsuarioTop5/);
  assert.match(storage, /userId\.trim\(\)/);
  assert.match(storage, /`\$\{chave\}:\$\{userIdLimpo\}`/);
  assert.match(storage, /typeof window === "undefined"/);
  assert.match(storage, /localStorage\.getItem\(chaveStorage\)/);
  assert.match(storage, /localStorage\.setItem\(chaveStorage, JSON\.stringify\(valor\)\)/);
  assert.match(storage, /return chaveStorage \? localStorage\.getItem\(chaveStorage\) : null;/);
  assert.match(storage, /return null;/);
  assert.match(storage, /return false;/);
  assert.match(storage, /return true;/);

  assert.doesNotMatch(page, /lerStorageUsuarioTop5/);
  assert.doesNotMatch(page, /salvarJsonStorageUsuarioTop5/);
  assert.doesNotMatch(page, /function criarStorageKeyUsuarioTop5/);
  assert.doesNotMatch(page, /function lerStorageUsuarioTop5/);
  assert.doesNotMatch(page, /function salvarJsonStorageUsuarioTop5/);
  assert.doesNotMatch(page, /function carregarObrasLocaisTop5/);
  assert.doesNotMatch(page, /function carregarTop5Salvo/);
  assert.doesNotMatch(page, /function salvarTop5/);
  assert.doesNotMatch(page, /STORAGE_KEY/);
  assert.doesNotMatch(page, /TOP_FIVE_STORAGE_KEY/);

  for (const forbidden of [
    "react",
    "useEffect",
    "supabase",
    "auth",
    "useRouter",
    "ObraTop5",
    "normalizar",
    "STORAGE_KEY",
    "TOP_FIVE_STORAGE_KEY",
    "TOP_FIVE_MAXIMO",
    ".insert(",
    ".delete(",
    "style={",
  ]) {
    assert.doesNotMatch(
      storage,
      new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    );
  }
});
