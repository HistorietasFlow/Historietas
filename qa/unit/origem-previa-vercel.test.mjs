import assert from "node:assert/strict";
import test from "node:test";
import { configuracaoPreviaVercel } from "../../lib/server/origem-previa-vercel.mjs";

const origemPreviaVercel = (env) => configuracaoPreviaVercel(env)?.origem ?? null;
const projeto = "abcdefghijklmnopqrst";
const origem = "https://" + projeto + ".supabase.co";
const preview = {
  NODE_ENV: "production", VERCEL: "1", VERCEL_ENV: "preview",
  HISTORIETAS_PREVIA_CHAVE_PREVIEW: "a".repeat(64),
  HISTORIETAS_PREVIA_PROJETO_PREVIEW: projeto, NEXT_PUBLIC_SUPABASE_URL: origem,
};

test("aceita somente a origem do projeto selecionado", () => {
  assert.equal(origemPreviaVercel(preview), origem);
  assert.equal(origemPreviaVercel({ ...preview, NEXT_PUBLIC_SUPABASE_URL: origem + "/" }), origem);
  for (const url of ["", origem + "/rest", origem + ":444", origem + "?ref=x",
    origem.replace("https:", "http:"), origem.replace(projeto, "outraorigem"),
    origem.replace("https://", "https://usuario@")]) {
    assert.equal(origemPreviaVercel({ ...preview, NEXT_PUBLIC_SUPABASE_URL: url }), null);
  }
});

test("produção, desenvolvimento e configuração ausente ficam desativados", () => {
  for (const alteracao of [
    { VERCEL_ENV: "production", HISTORIETAS_PREVIA_LOCAL: "1" },
    { VERCEL_ENV: "development" }, { VERCEL_ENV: undefined }, { VERCEL: undefined },
    { NODE_ENV: "development" }, { HISTORIETAS_PREVIA_PROJETO_PREVIEW: undefined },
    { HISTORIETAS_PREVIA_PROJETO_PREVIEW: projeto + "." },
  ]) {
    assert.equal(origemPreviaVercel({ ...preview, ...alteracao }), null);
  }
});

test("cada ambiente exige a própria chave, o projeto e a flag de interface", () => {
  const projetoProd = "abcdefghijklmnopqrsx";
  const origemProd = "https://" + projetoProd + ".supabase.co";
  const chaveProd = "b".repeat(64);
  const producao = {
    ...preview, VERCEL_ENV: "production", NEXT_PUBLIC_SUPABASE_URL: origemProd,
    HISTORIETAS_PREVIA_INTERFACE: "1", HISTORIETAS_PREVIA_CHAVE_PRODUCAO: chaveProd,
    HISTORIETAS_PREVIA_PROJETO_PRODUCAO: projetoProd,
  };
  assert.deepEqual(configuracaoPreviaVercel(producao), { origem: origemProd, chaveProva: chaveProd, mostrarInterface: false });
  const ativo = { ...producao, HISTORIETAS_PREVIA_INTERFACE_PRODUCAO: "1" };
  assert.equal(configuracaoPreviaVercel(ativo).mostrarInterface, true);
  for (const alteracao of [{ HISTORIETAS_PREVIA_CHAVE_PRODUCAO: undefined }, { HISTORIETAS_PREVIA_CHAVE_PRODUCAO: "abc" },
    { HISTORIETAS_PREVIA_PROJETO_PRODUCAO: undefined }, { NEXT_PUBLIC_SUPABASE_URL: origem }, { VERCEL_ENV: "preview" }]) {
    assert.equal(configuracaoPreviaVercel({ ...ativo, ...alteracao }), null);
  }
  const homologacao = { ...ativo, VERCEL_ENV: "preview", NEXT_PUBLIC_SUPABASE_URL: origem, HISTORIETAS_PREVIA_INTERFACE: undefined };
  assert.deepEqual(configuracaoPreviaVercel(homologacao), { origem, chaveProva: preview.HISTORIETAS_PREVIA_CHAVE_PREVIEW, mostrarInterface: false });
  assert.equal(configuracaoPreviaVercel({ ...homologacao, HISTORIETAS_PREVIA_CHAVE_PREVIEW: undefined }), null);
});
