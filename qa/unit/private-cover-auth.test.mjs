import assert from "node:assert/strict";
import test from "node:test";
import { loadApplicationModule as load } from "../helpers/load-application-module.mjs";

test("autenticação SSR consulta getUser a cada chamada, cookies do request e fetch no-store", async () => {
  const old = { ...process.env }; const originalFetch = globalThis.fetch;
  try {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://supabase.test";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "chave-publica-teste";
    let calls = 0, identity = "A", options;
    const jar = { getAll: () => [{ name: "sb-auth", value: "cookie-teste" }], set() {} };
    const { autenticarUsuarioCapa } = load("lib/server/capas/autenticar-usuario.ts", { "server-only": {},
      "next/headers": { cookies: async () => jar },
      "@supabase/ssr": { createServerClient(url, key, opts) {
        assert.equal(url, "https://supabase.test"); assert.equal(key, "chave-publica-teste"); options = opts;
        return { auth: { async getUser() { calls++; return { data: { user: identity ? { id: identity } : null }, error: null }; } } };
      } },
    });
    assert.deepEqual(await autenticarUsuarioCapa(), { usuarioId: "A" });
    identity = null; assert.equal(await autenticarUsuarioCapa(), null); assert.equal(calls, 2);
    assert.deepEqual(options.cookies.getAll(), jar.getAll());
    globalThis.fetch = async (_input, init) => { assert.equal(init.cache, "no-store"); assert.equal(init.redirect, "error"); return new Response(); };
    await options.global.fetch("https://supabase.test/auth/v1/user", { cache: "force-cache", redirect: "follow" });
  } finally { process.env = old; globalThis.fetch = originalFetch; }
});

test("credencial ausente/rejeitada não autentica; erro de rede/servidor não vira visitante autorizado", async () => {
  const old = { ...process.env };
  try {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://supabase.test";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "chave-publica-teste";
    for (const status of [400, 401, 403, 500, undefined]) {
      const { autenticarUsuarioCapa } = load("lib/server/capas/autenticar-usuario.ts", { "server-only": {},
        "next/headers": { cookies: async () => ({}) },
        "@supabase/ssr": { createServerClient: () => ({ auth: { getUser: async () => ({ data: { user: { id: "A" } }, error: { status } }) } }) },
      });
      if (status && status < 500) assert.equal(await autenticarUsuarioCapa(), null);
      else await assert.rejects(autenticarUsuarioCapa, /autenticacao_indisponivel/);
    }
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    const { autenticarUsuarioCapa } = load("lib/server/capas/autenticar-usuario.ts", { "server-only": {},
      "next/headers": { cookies: async () => { throw new Error("não consultar"); } }, "@supabase/ssr": {},
    });
    await assert.rejects(autenticarUsuarioCapa, /autenticacao_indisponivel/);
  } finally { process.env = old; }
});
