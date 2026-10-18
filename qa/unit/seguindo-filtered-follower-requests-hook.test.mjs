import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../../app/seguindo/page.tsx", import.meta.url), "utf8");
const hook = readFileSync(new URL("../../app/seguindo/hooks/use-seguindo-filtered-follower-requests.ts", import.meta.url), "utf8");

test("hook preserva argumentos e dependências das solicitações filtradas", () => {
  assert.match(page, /useSeguindoFilteredFollowerRequests\(\s*abaConteudo, listaSocialEhDoUsuarioLogado, solicitacoesSeguidores, termoBusca,/);
  assert.match(hook, /filtrarSolicitacoesSeguidores\(\s*abaConteudo, listaSocialEhDoUsuarioLogado, solicitacoesSeguidores, termoBusca,/);
  assert.match(hook, /\[abaConteudo, listaSocialEhDoUsuarioLogado, solicitacoesSeguidores, termoBusca\]/);
  assert.match(hook, /return solicitacoesSeguidoresFiltradas;/);
});
