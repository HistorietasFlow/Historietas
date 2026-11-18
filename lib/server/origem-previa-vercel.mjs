// Um único projeto Supabase é autorizado por deployment. Nenhuma entrada HTTP escolhe o destino.
export function origemPreviaVercel(env) {
  if (env.VERCEL !== "1" || env.VERCEL_ENV !== "preview" || env.NODE_ENV !== "production") return null;
  const projeto = env.HISTORIETAS_PREVIA_PROJETO_PREVIEW;
  if (!projeto || !/^[a-z0-9]{20}$/.test(projeto)) return null;
  const origem = "https://" + projeto + ".supabase.co";
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  return url === origem || url === origem + "/" ? origem : null;
}
