import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { loginAsVisitor, visitorEmail, visitorPassword } from "./helpers.mjs";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const workId = process.env.E2E_PUBLIC_WORK_ID;
const chapterId = process.env.E2E_PUBLIC_CHAPTER_ID;
const client = () => createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

test.beforeEach(async ({ baseURL }) => {
  for (const origin of [url, baseURL]) {
    expect(["127.0.0.1", "localhost", "[::1]"]).toContain(new URL(origin).hostname);
  }
  expect(workId).toBeTruthy();
  expect(chapterId).toBeTruthy();
});

test("Data API nega RPCs de visualizacao a anon e authenticated, inclusive legadas", async () => {
  const anonymous = client(), visitor = client();
  const session = await visitor.auth.signInWithPassword({ email: visitorEmail, password: visitorPassword });
  expect(session.error).toBeNull();
  try {
    for (const supabase of [anonymous, visitor]) {
      for (const [type, id] of [["obra", workId], ["capitulo", chapterId]]) {
        const args = { [`p_${type}_id`]: id };
        const current = await supabase.rpc(`registrar_visualizacao_${type}`, { ...args, p_chave_visitante: "a".repeat(64) });
        expect(current.error?.code).toBe("42501");
        const legacy = await supabase.rpc(`incrementar_visualizacao_${type}`, { [`${type}_id_param`]: id });
        expect(legacy.error?.code).toBe("42501");
      }
    }
  } finally {
    await visitor.auth.signOut({ scope: "local" });
  }
});

test("endpoint autenticado registra e deduplica obra/capitulo sem liberar origem externa", async ({ page, baseURL }) => {
  await loginAsVisitor(page);
  const headers = { Origin: new URL(baseURL).origin };
  for (const [tipo, conteudoId] of [["obra", workId], ["capitulo", chapterId]]) {
    const data = { tipo, conteudoId };
    const denied = await page.request.post("/api/visualizacoes", { data, headers: { Origin: "https://invalid.example" } });
    expect(denied.status()).toBe(403);
    const first = await page.request.post("/api/visualizacoes", { data, headers });
    expect(first.status()).toBe(200);
    const result = await first.json();
    expect(result).toMatchObject({ ok: true, registrada: true });
    expect(Number.isInteger(result.total)).toBe(true);
    const repeated = await page.request.post("/api/visualizacoes", { data, headers });
    expect(repeated.status()).toBe(200);
    expect(await repeated.json()).toEqual(result);
  }
});
