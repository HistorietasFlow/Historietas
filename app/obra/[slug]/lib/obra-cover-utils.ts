export function capaObraPodeSerOtimizada(capa: string) {
  const capaLimpa = capa.trim();
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";

  if (!capaLimpa || !supabaseUrl) {
    return false;
  }

  try {
    const urlCapa = new URL(capaLimpa);
    const urlSupabase = new URL(supabaseUrl);

    return (
      urlSupabase.protocol === "https:" &&
      urlCapa.origin === urlSupabase.origin &&
      urlCapa.pathname.startsWith(
        "/storage/v1/object/public/capas-obras/",
      )
    );
  } catch {
    return false;
  }
}
export function obterIniciaisCapaObra(titulo: string) {
  return titulo
    .split(" ")
    .map((parte) => parte[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
