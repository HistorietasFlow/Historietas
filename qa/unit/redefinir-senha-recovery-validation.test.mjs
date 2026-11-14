import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { loadApplicationModule as load } from "../helpers/load-application-module.mjs";

const { obterMensagemErro } = load("app/redefinir-senha/lib/redefinir-senha-recovery-utils.ts", {
  "../../../lib/supabase/client": { supabase: {} },
});
test("mensagens remotas preservam trim e fallback sem expor objetos", () => {
  for (const error of [null, undefined, "texto", {}, { message: 1 }, { message: "  " }]) {
    assert.equal(obterMensagemErro(error, "fallback"), "fallback");
  }
  assert.equal(obterMensagemErro({ message: "  Falha temporária  " }, "fallback"), "Falha temporária");
});

test("página compartilha o contexto validado com o submit e limpa senhas ao invalidar", () => {
  const source = readFileSync(new URL("../../app/redefinir-senha/page.tsx", import.meta.url), "utf8");
  assert.match(source, /const contextoRecuperacaoRef = useRedefinirSenhaRecoveryValidation\(setEstadoLink, limparCamposRecuperacao\)/);
  assert.match(source, /useRedefinirSenhaSaveAction\(\{[\s\S]*?contextoRecuperacaoRef,/);
  assert.match(source, /setNovaSenha\(""\);\s*setConfirmacao\(""\);\s*setErro\(""\);/);
  assert.doesNotMatch(source, /supabase\.auth\./);
});
