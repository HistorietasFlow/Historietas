import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hook = readFileSync(
  new URL(
    "../../app/seguindo/hooks/use-seguindo-follower-actions.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/seguindo/page.tsx", import.meta.url),
  "utf8",
);

test("hook preserva remoção de seguidor e resposta de solicitação", () => {
  assert.match(hook, /^"use client";/);
  assert.match(
    hook,
    /const { data, error } = await supabase\.rpc\("remover_seguidor", \{[\s\S]*?p_seguidor_id: usuarioIdLimpo/,
  );
  assert.match(
    hook,
    /if \(error \|\| data !== true\) \{[\s\S]*?Não consegui remover o seguidor/,
  );
  assert.match(
    hook,
    /setUsuariosSeguidores\(\(usuariosAtuais\) =>[\s\S]*?usuarioSeguidor\.id !== usuarioIdLimpo/,
  );
  assert.match(
    hook,
    /await supabase\.rpc\([\s\S]*?"responder_solicitacao_seguidor",[\s\S]*?p_solicitacao_id: solicitacao\.id,[\s\S]*?p_aceitar: aceitar/,
  );
  assert.match(
    hook,
    /data === "aceita"[\s\S]*?criadoEm: new Date\(\)\.toISOString\(\)/,
  );
  assert.match(
    hook,
    /setSolicitacaoRespondendoId\(\(idAtual\) =>[\s\S]*?idAtual === solicitacao\.id \? null : idAtual/,
  );
});

test("página delega as ações de seguidores ao hook", () => {
  assert.match(
    pagina,
    /import \{ useSeguindoFollowerActions \} from "\.\/hooks\/use-seguindo-follower-actions";/,
  );
  assert.match(
    pagina,
    /const \{[\s\S]*?removerSeguidorUsuario,[\s\S]*?responderSolicitacaoSeguidor,[\s\S]*?\} = useSeguindoFollowerActions\(\{[\s\S]*?usuarioLogadoId,[\s\S]*?usuarioListaAlterandoId,[\s\S]*?solicitacaoRespondendoId,[\s\S]*?setUsuariosSeguidores,[\s\S]*?setSolicitacoesSeguidores,[\s\S]*?\}\);/,
  );
  assert.doesNotMatch(
    pagina,
    /async function removerSeguidorUsuario\(/,
  );
  assert.doesNotMatch(
    pagina,
    /async function responderSolicitacaoSeguidor\(/,
  );
  assert.doesNotMatch(pagina, /supabase\.rpc\("remover_seguidor"/);
  assert.doesNotMatch(pagina, /"responder_solicitacao_seguidor"/);
});
