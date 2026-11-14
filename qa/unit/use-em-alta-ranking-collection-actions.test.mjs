import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const fonte=readFileSync(new URL("../../app/em-alta/hooks/use-em-alta-ranking-collection-actions.ts",import.meta.url),"utf8");
const pagina=readFileSync(new URL("../../app/em-alta/page.tsx",import.meta.url),"utf8");
test("ações conservam fronteiras e exigem confirmação antes de cache e Diário",()=>{
  assert.match(fonte,/async function alternarFavorito\(obraId: string\)/);
  assert.match(fonte,/async function alternarConcluido\(obraId: string\)/);
  assert.ok(fonte.indexOf("if (!resultado.ok)")<fonte.indexOf("salvarListaIdsLocalEmAlta(tabela"));
  assert.match(fonte,/contexto\.filas\[tabela\]\.then/);
  assert.match(fonte,/registrarColecaoRankingNoDiario\(tabela === "favoritos"/);
  assert.doesNotMatch(fonte,/lib\/supabase\/client|localStorage/);
});
test("página delega coleções e expõe erro e pendência acessíveis",()=>{
  assert.match(pagina,/useEmAltaRankingCollectionActions\(/);
  assert.match(pagina,/salvandoColecao && <p role="status"/);
  assert.match(pagina,/mensagemColecao && <p role="alert"/);
  assert.doesNotMatch(pagina,/async function alternarFavorito\(/);
});
