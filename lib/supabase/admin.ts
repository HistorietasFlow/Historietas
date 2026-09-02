import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";

function urlSupabaseValida(url: string) {
  if (!url) {
    return false;
  }

  try {
    const urlValidada = new URL(url);

    return (
      (urlValidada.protocol === "https:" ||
        urlValidada.protocol === "http:") &&
      Boolean(urlValidada.hostname)
    );
  } catch {
    return false;
  }
}

export const supabaseAdminConfigurado = Boolean(
  urlSupabaseValida(supabaseUrl) && supabaseServiceRoleKey,
);

export function criarSupabaseAdminClient(): SupabaseClient<Database> {
  if (!supabaseAdminConfigurado) {
    throw new Error(
      "Supabase Admin não configurado. Defina SUPABASE_SERVICE_ROLE_KEY somente no servidor.",
    );
  }

  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}
