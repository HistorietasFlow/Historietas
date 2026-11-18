import assert from "node:assert/strict";
import { createHmac } from "node:crypto";

function cabecalhosQA(chave, slug, sessao, prazo) {
  const jwt = sessao && JSON.parse(Buffer.from(sessao.access_token.split(".")[1], "base64url"));
  const identidade = jwt ? jwt.sub + "/" + jwt.session_id : "anon";
  const valor = ["historietas/previa/v1", prazo, identidade, slug].join("\n");
  return {
    "x-historietas-previa-exp": String(prazo),
    "x-historietas-previa-prova": createHmac("sha256", Buffer.from(chave, "hex")).update(valor).digest("hex"),
  };
}

export async function conferirProvas(t, api, chaveApi, chaveProva, slug, leitor, outraSessao, esperado) {
  async function pedir(sessao, prova, status) {
    const resposta = await fetch(new URL("/rest/v1/rpc/previa_abertura_assinada", api), {
      method: "POST", redirect: "error",
      headers: { apikey: chaveApi, Authorization: "Bearer " + (sessao?.access_token ?? chaveApi),
        "Content-Type": "application/json", ...prova },
      body: JSON.stringify({ p_slug: slug }),
    });
    assert.equal(resposta.status, status);
    const dados = await resposta.json();
    if (status === 200) assert.deepEqual(dados, [esperado]);
    else {
      assert.equal(dados.code, "PT403");
      assert.equal(dados.message, "Prévia indisponível.");
      assert.equal(dados.details, null);
      assert.equal(dados.hint, null);
      assert.equal("trecho" in dados, false);
    }
  }
  const agora = () => Math.floor(Date.now() / 1000);
  await t.test("Data API direta, sem prova: visitante e leitor autenticado recebem 403 sem trecho", async () => {
    await pedir(null, {}, 403);
    await pedir(leitor, {}, 403);
  });
  await t.test("Data API mantém o schema interno fora das interfaces expostas", async () => {
    for (const token of [chaveApi, leitor.access_token]) {
      const resposta = await fetch(new URL("/rest/v1/chave_ativa?select=unica", api), {
        headers: { apikey: chaveApi, Authorization: "Bearer " + token, "Accept-Profile": "previa_assinatura" },
      });
      assert.equal(resposta.status, 406);
      assert.equal((await resposta.json()).code, "PGRST106");
    }
  });
  await t.test("a prova confere somente para a obra e a sessão a que foi emitida", async () => {
    const exp = agora() + 20;
    const prova = cabecalhosQA(chaveProva, slug, leitor, exp);
    await pedir(leitor, prova, 200);
    await pedir(outraSessao, prova, 403);
    await pedir(null, prova, 403);
    await pedir(leitor, cabecalhosQA(chaveProva, slug, null, exp), 403);
    await pedir(leitor, cabecalhosQA(chaveProva, slug + "-outra", leitor, exp), 403);
  });
  await t.test("prova vencida, futura demais ou assinada com outra chave é recusada", async () => {
    await pedir(null, cabecalhosQA(chaveProva, slug, null, agora() - 1), 403);
    await pedir(null, cabecalhosQA(chaveProva, slug, null, agora() + 120), 403);
    await pedir(null, cabecalhosQA("00".repeat(32), slug, null, agora() + 20), 403);
  });
}
