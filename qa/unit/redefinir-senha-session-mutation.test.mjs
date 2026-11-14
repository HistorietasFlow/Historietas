import assert from "node:assert/strict";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";
import { loadApplicationModule as load } from "../helpers/load-application-module.mjs";

const usuario = { id: "00000000-0000-4000-8000-000000000001", aud: "authenticated", email: "fixture@example.test" };
const token = [ { alg: "HS256", typ: "JWT" }, { sub: usuario.id, exp: Math.floor(Date.now() / 1000) + 3600, amr: [{ method: "recovery" }] }, "fixture" ]
  .map(part => Buffer.from(typeof part === "string" ? part : JSON.stringify(part)).toString("base64url")).join(".");
const sessao = { usuarioId: usuario.id, sessaoId: "sessao-A", accessToken: token, refreshToken: "refresh-fixture", expiraEm: Date.now() / 1000 + 3600 };

for (const caso of ["valido", "trocado", "token-invalido", "outro-usuario"]) {
  const trocar = caso === "trocado";
  test(`SDK real fixa o JWT da alteração e descarta mudança durante setSession: ${caso}`, async t => {
    const vars = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"];
    const original = vars.map(key => process.env[key]);
    process.env[vars[0]] = "https://auth-fixture.invalid"; process.env[vars[1]] = "public-fixture";
    t.after(() => vars.forEach((key, i) => { if (original[i] === undefined) delete process.env[key]; else process.env[key] = original[i]; }));
    let atual = true; const requests = []; let options;
    const { atualizarSenhaNaSessaoRecuperacao, ContextoRecuperacaoObsoleto } = load("app/redefinir-senha/lib/redefinir-senha-session-mutation.ts", {
      "@supabase/supabase-js": { createClient: (url, key, config) => {
        options = config.auth;
        return createClient(url, key, { ...config, global: { fetch: async (url, init) => {
          requests.push({ url: String(url), method: init?.method || "GET", authorization: new Headers(init?.headers).get("authorization"), body: init?.body });
          if (trocar) atual = false;
          const body = caso === "token-invalido" ? { message: "invalid JWT", error_code: "bad_jwt" } :
            caso === "outro-usuario" ? { ...usuario, id: "00000000-0000-4000-8000-000000000002" } : usuario;
          return new Response(JSON.stringify(body), { status: caso === "token-invalido" ? 401 : 200, headers: { "Content-Type": "application/json" } });
        } } });
      } },
    });
    const executar = () => atualizarSenhaNaSessaoRecuperacao(sessao, "NovaSenha123", () => atual);
    if (trocar || caso === "outro-usuario") await assert.rejects(executar, ContextoRecuperacaoObsoleto);
    else if (caso === "token-invalido") await assert.rejects(executar, /invalid JWT/);
    else { const result = await executar(); assert.equal(result.error, null); assert.equal(result.data.user.id, usuario.id); }
    assert.deepEqual(options, { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false });
    assert.ok(requests.every(req => req.url === "https://auth-fixture.invalid/auth/v1/user" && req.authorization === `Bearer ${token}`));
    const puts = requests.filter(req => req.method === "PUT");
    assert.equal(puts.length, caso === "valido" ? 1 : 0);
    if (caso === "valido") assert.equal(JSON.parse(puts[0].body).password, "NovaSenha123");
  });
}
