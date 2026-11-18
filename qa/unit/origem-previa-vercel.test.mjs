import assert from "node:assert/strict";
import test from "node:test";
import { origemPreviaVercel } from "../../lib/server/origem-previa-vercel.mjs";

const projeto = "abcdefghijklmnopqrst";
const origem = "https://" + projeto + ".supabase.co";
const preview = {
  NODE_ENV: "production", VERCEL: "1", VERCEL_ENV: "preview",
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
