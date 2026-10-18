import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../../app/seguindo/page.tsx", import.meta.url), "utf8");
const helper = readFileSync(new URL("../../app/seguindo/lib/seguindo-filtered-follower-requests.ts", import.meta.url), "utf8");

test("solicitações mantêm restrição de proprietário, busca e ordem", () => {
  assert.match(page, /filtrarSolicitacoesSeguidores\(\s*abaConteudo, listaSocialEhDoUsuarioLogado, solicitacoesSeguidores, termoBusca,/);
  assert.match(helper, /!listaSocialEhDoUsuarioLogado \|\| abaConteudo !== "seguidores"/);
  assert.match(helper, /solicitacao\.usuario\.nome/);
  assert.match(helper, /solicitacao\.usuario\.handle/);
  assert.match(helper, /solicitacao\.usuario\.bio/);
  assert.match(helper, /textoSolicitacao\.includes\(termoBusca\)/);
  assert.match(helper, /new Date\(solicitacaoB\.criadoEm\)\.getTime\(\)/);
  assert.match(page, /\[abaConteudo, listaSocialEhDoUsuarioLogado, solicitacoesSeguidores, termoBusca\]/);
});
