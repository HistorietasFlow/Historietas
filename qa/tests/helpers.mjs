import { expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

export const authorEmail = (process.env.E2E_USER_EMAIL || "").trim();
export const authorPassword = process.env.E2E_USER_PASSWORD || "";
export const destructiveEnabled = process.env.E2E_ALLOW_DESTRUCTIVE === "true";
export const hasAuthorCredentials = Boolean(authorEmail && authorPassword);

export function monitorRuntime(page) {
  const pageErrors = [];
  const consoleErrors = [];

  page.on("pageerror", (error) => {
    const text = String(error?.message || error);
    if (!/ResizeObserver loop/i.test(text)) pageErrors.push(text);
  });

  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = message.text();
    if (/net::ERR_ABORTED/i.test(text)) return;
    consoleErrors.push(text);
  });

  return {
    assertClean() {
      expect(pageErrors, `Erros JavaScript da página:\n${pageErrors.join("\n")}`).toEqual([]);
      expect(consoleErrors, `Erros de console:\n${consoleErrors.join("\n")}`).toEqual([]);
    }
  };
}

export async function loginAsAuthor(page) {
  if (!hasAuthorCredentials) {
    throw new Error("Defina E2E_USER_EMAIL e E2E_USER_PASSWORD em qa/.env.e2e.");
  }

  await page.goto("/login", { waitUntil: "domcontentloaded" });
  const form = page.locator("form");
  await form.getByPlaceholder("seuemail@email.com").fill(authorEmail);
  await form.getByPlaceholder("Mínimo de 6 caracteres").fill(authorPassword);
  await Promise.all([
    page.waitForURL((url) => !url.pathname.endsWith("/login"), { timeout: 30_000 }),
    form.getByRole("button", { name: "ENTRAR", exact: true }).click()
  ]);
}

export async function openWorkActions(page, title) {
  await page.getByRole("button", { name: `Abrir opções de ${title}` }).click();
  const sheet = page.locator('[aria-label^="Ações de "]').filter({ hasText: title });
  await expect(sheet).toBeVisible();
  return sheet;
}

export async function cleanupWorkByTitle(title) {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const key = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ""
  ).trim();

  if (!url || !key || !hasAuthorCredentials) return;

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });

  const { error: authError } = await supabase.auth.signInWithPassword({
    email: authorEmail,
    password: authorPassword
  });
  if (authError) return;

  const { data: works } = await supabase
    .from("obras")
    .select("id")
    .eq("titulo", title)
    .limit(10);

  for (const work of works || []) {
    await supabase.from("capitulos").delete().eq("obra_id", work.id);
    await supabase.from("obras").delete().eq("id", work.id);
  }

  await supabase.auth.signOut();
}
