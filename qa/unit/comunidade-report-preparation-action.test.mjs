import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const acao = readFileSync(new URL("../../app/comunidade/components/community-report-preparation-action.ts", import.meta.url), "utf8");
const pagina = readFileSync(new URL("../../app/comunidade/page.tsx", import.meta.url), "utf8");
test("denunciarConteudoComunidade preserva guardas, normalizacao e modal", () => {
  assert.match(acao, /export function denunciarConteudoComunidade/);
  assert.match(acao, /if \(!exigirLogin\(\) \|\| !usuario\) return;/);
  assert.match(acao, /const alvoIdLimpo = alvoId\.trim\(\);/);
  assert.match(acao, /O conteúdo que você tentou denunciar é inválido\./);
  assert.match(acao, /obterTituloDenunciaComunidade\(alvoTipo, alvoIdLimpo, posts\)/);
  assert.match(acao, /setPostMenuAbertoId\(null\);/);
  assert.match(acao, /setDenunciaAlvo\(\{ alvoTipo, alvoId: alvoIdLimpo, alvoTitulo \}\)/);
  assert.match(pagina, /denunciarConteudoComunidade\(\{/);
  assert.doesNotMatch(pagina, /function denunciarConteudo\(/);
  assert.match(pagina, /function denunciarPostComunidade\(/);
});
