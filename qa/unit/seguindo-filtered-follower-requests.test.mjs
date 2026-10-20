import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hook = readFileSync(new URL("../../app/seguindo/hooks/use-seguindo-filtered-follower-requests.ts", import.meta.url), "utf8");
const helper = readFileSync(new URL("../../app/seguindo/lib/seguindo-filtered-follower-requests.ts", import.meta.url), "utf8");

test("solicitações mantêm restrição de proprietário, busca e ordem", () => {
  assert.match(hook, /filtrarSolicitacoesSeguidores\(\s*abaConteudo, listaSocialEhDoUsuarioLogado, solicitacoesSeguidores, termoBusca,/);
  assert.match(helper, /!listaSocialEhDoUsuarioLogado \|\| abaConteudo !== "seguidores"/);
  assert.match(helper, /solicitacao\.usuario\.nome/);
  assert.match(helper, /solicitacao\.usuario\.handle/);
  assert.match(helper, /solicitacao\.usuario\.bio/);
  assert.match(helper, /textoSolicitacao\.includes\(termoBusca\)/);
  assert.match(helper, /new Date\(solicitacaoB\.criadoEm\)\.getTime\(\)/);
  assert.match(hook, /\[abaConteudo, listaSocialEhDoUsuarioLogado, solicitacoesSeguidores, termoBusca\]/);
});
