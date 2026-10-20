import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(
  new URL("../../app/seguindo/page.tsx", import.meta.url),
  "utf8",
);
const hook = readFileSync(
  new URL("../../app/seguindo/hooks/use-seguindo-page-actions.ts", import.meta.url),
  "utf8",
);

test("Seguindo agrupa somente a orquestração das ações existentes", () => {
  assert.match(hook, /^"use client";/);
  assert.match(
    page,
    /import \{ useSeguindoPageActions \} from "\.\/hooks\/use-seguindo-page-actions";/,
  );
  assert.match(page, /\} = useSeguindoPageActions\(\{[\s\S]*?\}\);/);

  const followerAction = hook.indexOf("useSeguindoFollowerActions({");
  const userAction = hook.indexOf("useSeguindoUserFollowActions({");
  const workAction = hook.indexOf("useSeguindoWorkAuthorActions({");
  assert.ok(followerAction >= 0);
  assert.ok(userAction > followerAction);
  assert.ok(workAction > userAction);

  for (const action of [
    "removerSeguidorUsuario",
    "responderSolicitacaoSeguidor",
    "deixarDeSeguirUsuario",
    "seguirUsuarioSugestao",
    "deixarDeSeguirObra",
    "deixarDeSeguirAutor",
  ]) {
    assert.match(hook, new RegExp(action));
  }
  assert.doesNotMatch(hook, /useEffect|localStorage|\.rpc\(/);
});
