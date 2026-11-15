import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const fonte=readFileSync(new URL("../../app/em-alta/hooks/use-em-alta-ranking-loader.ts",import.meta.url),"utf8");
const pagina=readFileSync(new URL("../../app/em-alta/page.tsx",import.meta.url),"utf8");
test("loader usa identidade confirmada, resultado independente e finally protegido",()=>{
  assert.match(fonte,/if \(!autenticacaoCarregada\) return/);
  assert.match(fonte,/Promise\.allSettled/);
  assert.match(fonte,/identidadeSessaoRef\.current\.versao === versaoIdentidade/);
  assert.match(fonte,/finally[\s\S]*if \(atual\(\)\)[\s\S]*setCarregandoRanking\(false\)/);
  assert.doesNotMatch(fonte,/auth\.getUser|\.insert\(|\.update\(|\.delete\(/);
});
test("página oculta snapshot de outra identidade e oferece recuperação",()=>{
  assert.match(pagina,/useEmAltaRankingLoader\(/);
  assert.match(pagina,/carregandoRanking \|\| !dadosDaIdentidadeAtual/);
  assert.match(pagina,/onClick=\{tentarCarregarRanking\}/);
  assert.match(fonte,/obterVersaoColecoesEmAlta\(usuarioLogadoId\)/);
});
