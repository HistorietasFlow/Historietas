import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const copy = readFileSync(new URL("../../app/configuracoes/lib/configuracoes-copy-utils.ts", import.meta.url), "utf8");
const route = readFileSync(new URL("../../app/configuracoes/lib/configuracoes-route-utils.ts", import.meta.url), "utf8");
const backupActions = readFileSync(new URL("../../app/configuracoes/lib/configuracoes-account-backup-actions.ts", import.meta.url), "utf8");
const page = readFileSync(new URL("../../app/configuracoes/page.tsx", import.meta.url), "utf8");

test("cópia de Configurações preserva Clipboard e fallback temporário", () => {
  assert.match(copy, /export async function copiarTextoConfiguracoes\(texto: string\)/);
  assert.match(copy, /navigator\.clipboard\?\.writeText/);
  assert.match(copy, /document\.createElement\("textarea"\)/);
  assert.match(copy, /campoTemporario\.setAttribute\("readonly", "true"\)/);
  assert.match(copy, /document\.execCommand\("copy"\)/);
  assert.match(copy, /campoTemporario\.remove\(\)/);
});

test("rota de login e consumidores de Configurações permanecem idênticos", () => {
  assert.match(route, /export function criarLoginHrefConfiguracoes\(\)/);
  assert.match(route, /redirectTo: "\/configuracoes"/);
  assert.match(route, /return `\/login\?\$\{params\.toString\(\)\}`;/);
  assert.match(page, /from "\.\/lib\/configuracoes-account-backup-actions";/);
  assert.match(page, /from "\.\/lib\/configuracoes-route-utils";/);
  assert.doesNotMatch(page, /async function copiarTexto\(/);
  assert.doesNotMatch(page, /function criarLoginHrefConfiguracoes\(/);
  assert.equal((page.match(/criarLoginHrefConfiguracoes\(/g) || []).length, 4);
  assert.match(
    backupActions,
    /await copiarTextoConfiguracoes\(criarBackupLocal\(usuarioIdLogado\)\)/,
  );
});
