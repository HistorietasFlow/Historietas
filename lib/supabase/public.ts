import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
  "";

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

export const supabasePublicoConfigurado = Boolean(
  urlSupabaseValida(supabaseUrl) && supabasePublishableKey,
);

export function criarSupabasePublicClient(): SupabaseClient<Database> {
  if (!supabasePublicoConfigurado) {
    throw new Error(
      "Supabase público não configurado. Verifique NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  return createClient<Database>(supabaseUrl, supabasePublishableKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}
