import { supabase } from "../../../../lib/supabase/client";

export async function buscarPerfisProblemasTecnicosAdmin(ids: string[]) {
  const [porUserId, porId] = await Promise.all([
    supabase
      .from("profiles")
      .select("id,user_id,nome,username")
      .in("user_id", ids)
      .limit(1000),
    supabase
      .from("profiles")
      .select("id,user_id,nome,username")
      .in("id", ids)
      .limit(1000),
  ]);

  return { porUserId, porId };
}
