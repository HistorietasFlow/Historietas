import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import {loadApplicationModule as load} from "../helpers/load-application-module.mjs";
import {denunciaModeracao} from "../helpers/admin-moderacao-harness.mjs";

for (const patch of [{arquivada: true}, {status: "rejeitada"}, {alvoId: "outro"}]) {
  test(`remoção valida o snapshot antes de qualquer operação: ${JSON.stringify(patch)}`, async () => {
    let writes = 0;
    const {removerConteudoDenunciadoModeracao} = load("app/admin/comunidade/actions/remover-conteudo-denunciado-moderacao.ts", {
      "../../../../lib/supabase/client": {supabase: {from() {writes++; throw new Error("consulta inesperada");}, rpc() {writes++;}}},
    });
    await assert.rejects(() => removerConteudoDenunciadoModeracao({alvoTipo: "post", alvoId: "post1", usuarioId: "A", observacaoFinal: "Nota",
      esperada: denunciaModeracao(patch), denunciasIds: ["d1"], vigente: () => true}), error => error.estado === "conflito");
    assert.equal(writes, 0);
  });
}
test("remoção preserva RPC transacional e não escreve diretamente em conteúdo ou auditoria", () => {
  const source = readFileSync(new URL("../../app/admin/comunidade/actions/remover-conteudo-denunciado-moderacao.ts", import.meta.url), "utf8");
  assert.match(source, /rpc\("remover_conteudo_denunciado_transacional"/);
  assert.match(source, /p_observacao_admin: observacaoFinal\.slice\(0, 800\)/);
  assert.doesNotMatch(source, /\.delete\(|\.insert\(|moderacao_historico/);
});
