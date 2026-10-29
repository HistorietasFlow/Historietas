import { supabase } from "../../../../lib/supabase/client";
import { carregarObrasSupabaseTop5 } from "./top5-supabase-works-loader";

export async function carregarDadosIniciaisTop5() {
  const [{ data: authData }, obrasSupabase] = await Promise.all([
    supabase.auth.getUser(),
    carregarObrasSupabaseTop5(),
  ]);

  return {
    authData,
    obrasSupabase,
  };
}
