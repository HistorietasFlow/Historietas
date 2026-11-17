import { randomBytes, randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { hasAuthorCredentials, loginAsAuthor } from "./helpers.mjs";

// Somente o banco local descartável pode receber fixtures deste teste.
const api = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
const publicKey = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
const adminKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
const workId = (process.env.E2E_PUBLIC_WORK_ID || "").trim();
const workSlug = (process.env.E2E_PUBLIC_WORK_SLUG || "").trim();

function exigirAmbienteLocal(baseURL) {
  expect(api && publicKey && adminKey && workId && workSlug).toBeTruthy();
  for (const value of [api, baseURL]) {
    const parsed = new URL(value);
    expect(parsed.protocol).toBe("http:");
    expect(["127.0.0.1", "localhost", "[::1]"]).toContain(parsed.hostname);
  }
}

function administrador() {
  return createClient(api, adminKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

async function alvoDescartavel(admin) {
  const id = randomUUID(), email = "qa-comum-ui-" + id + "@historietas.test";
  const password = randomBytes(24).toString("base64url");
  const created = await admin.auth.admin.createUser({
    id, email, password, email_confirm: true,
  });
  expect(created.error).toBeNull();
  try {
    const profile = await admin.from("profiles").insert({
      id, user_id: id, nome: "Perfil público de teste", tipo: "leitor",
      username: "qa.comum.ui." + randomBytes(5).toString("hex"),
    });
    expect(profile.error).toBeNull();
    const prefs = await admin.from("preferencias_privacidade").upsert({
      user_id: id, visibilidade_biblioteca: "publico",
      mostrar_favoritos: true, perfil_privado: false,
    }, { onConflict: "user_id" });
    expect(prefs.error).toBeNull();
  } catch (error) {
    await admin.auth.admin.deleteUser(id);
    throw error;
  }
  return id;
}

for (const [dispositivo, viewport] of [
  ["desktop", { width: 1440, height: 900 }],
  ["mobile", { width: 390, height: 844 }],
]) {
  test("Histórias em Comum: seção visível, revalidação e falha fechada - " + dispositivo,
    async ({ page, baseURL }) => {
      test.skip(!hasAuthorCredentials, "Requer conta Auth E2E local");
      exigirAmbienteLocal(baseURL);
      const admin = administrador();
      const alvo = await alvoDescartavel(admin);
      try {
        await page.setViewportSize(viewport);
        await loginAsAuthor(page);

        let modo = "publico";
        let chamadas = 0;
        await page.route("**/rest/v1/rpc/listar_historias_em_comum", async route => {
          chamadas++;
          if (modo === "erro") {
            await route.fulfill({
              status: 403, contentType: "application/json",
              body: JSON.stringify({ code: "42501", message: "acesso negado" }),
            });
            return;
          }
          const obras = modo === "vazio" ? [] : [{
            obra_id: workId,
            slug: workSlug,
            titulo: "História em comum de teste",
            autor: "Autoria pública",
            capa_url: null,
          }];
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(obras),
          });
        });

        await page.goto("/perfil-autor?userId=" + encodeURIComponent(alvo), {
          waitUntil: "domcontentloaded",
        });
        const painel = page.getByRole("region", { name: "Histórias em comum" });
        await expect(painel).toBeVisible({ timeout: 30_000 });
        await expect(painel.getByText("História em comum de teste")).toBeVisible();
        await expect(painel.getByRole("link")).toHaveAttribute(
          "href", "/obra/" + workSlug,
        );
        expect(chamadas).toBeGreaterThanOrEqual(1);
        const area = await painel.boundingBox();
        expect(area?.width).toBeGreaterThan(100);
        expect(area?.width).toBeLessThanOrEqual(viewport.width);

        modo = "vazio";
        await page.evaluate(() => window.dispatchEvent(new Event("focus")));
        await expect(painel).toHaveCount(0);
        modo = "publico";
        await page.evaluate(() => window.dispatchEvent(new Event("focus")));
        await expect(painel).toBeVisible();

        modo = "erro";
        await page.evaluate(() => window.dispatchEvent(new Event("focus")));
        await expect(painel).toHaveCount(0);
        await expect(page.locator("main:visible")).toHaveCount(1);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1))
          .toBe(true);
      } finally {
        const deleted = await admin.auth.admin.deleteUser(alvo);
        expect(deleted.error).toBeNull();
      }
    });
}
