import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

const supabaseUrlFinal =
  supabaseUrl || "https://historietas-env-nao-configurada.supabase.co";

const supabasePublishableKeyFinal =
  supabasePublishableKey || "historietas-env-nao-configurada";

if ((!supabaseUrl || !supabasePublishableKey) && process.env.NODE_ENV !== "production") {
  console.error(
    "Supabase não configurado. Verifique NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY no .env.local."
  );
}

export const supabase = createClient(
  supabaseUrlFinal,
  supabasePublishableKeyFinal
);