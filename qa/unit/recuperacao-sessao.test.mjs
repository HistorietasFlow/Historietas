import assert from "node:assert/strict";
import test from "node:test";
import {
  erroExigeLimpezaSessaoLocal,
  obterChaveSessaoSupabase,
  obterNomesCookiesSessaoSupabase,
} from "../../lib/supabase/session-recovery.mjs";

test("reconhece refresh token removido pelo código oficial", () => {
  assert.equal(
    erroExigeLimpezaSessaoLocal({ code: "refresh_token_not_found" }),
    true,
  );
});

test("mantém compatibilidade com a mensagem do AuthApiError", () => {
  assert.equal(
    erroExigeLimpezaSessaoLocal({
      message: "Invalid Refresh Token: Refresh Token Not Found",
    }),
    true,
  );
});

test("reconhece sessão revogada e refresh token já utilizado", () => {
  assert.equal(
    erroExigeLimpezaSessaoLocal({ code: "session_not_found" }),
    true,
  );
  assert.equal(
    erroExigeLimpezaSessaoLocal({ code: "refresh_token_already_used" }),
    true,
  );
  assert.equal(erroExigeLimpezaSessaoLocal({ code: "session_expired" }), true);
  assert.equal(erroExigeLimpezaSessaoLocal({ code: "bad_jwt" }), true);
  assert.equal(erroExigeLimpezaSessaoLocal({ code: "user_banned" }), true);
  assert.equal(erroExigeLimpezaSessaoLocal({ code: "user_not_found" }), true);
});

test("não encerra a sessão em erros temporários ou de credenciais", () => {
  assert.equal(erroExigeLimpezaSessaoLocal(new Error("fetch failed")), false);
  assert.equal(
    erroExigeLimpezaSessaoLocal({ code: "over_request_rate_limit", status: 429 }),
    false,
  );
  assert.equal(
    erroExigeLimpezaSessaoLocal({ code: "invalid_credentials", status: 400 }),
    false,
  );
  assert.equal(
    erroExigeLimpezaSessaoLocal({ message: "Internal Server Error", status: 500 }),
    false,
  );
});

test("deriva a chave Auth do projeto Supabase", () => {
  assert.equal(
    obterChaveSessaoSupabase("https://drqqgfxrchnymetmpabd.supabase.co"),
    "sb-drqqgfxrchnymetmpabd-auth-token",
  );
  assert.equal(obterChaveSessaoSupabase("não-é-url"), "");
});

test("seleciona apenas os cookies Auth do projeto atual", () => {
  const url = "https://drqqgfxrchnymetmpabd.supabase.co";
  const chave = "sb-drqqgfxrchnymetmpabd-auth-token";

  assert.deepEqual(
    obterNomesCookiesSessaoSupabase(
      [
        chave,
        `${chave}.0`,
        `${chave}.1`,
        `${chave}-code-verifier`,
        "historietas-configuracoes-conta",
        "sb-outroprojeto-auth-token",
        chave,
      ],
      url,
    ),
    [chave, `${chave}.0`, `${chave}.1`, `${chave}-code-verifier`],
  );
});
