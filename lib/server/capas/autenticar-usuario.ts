import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** getUser valida a identidade; não comprova existência de auth.sessions.
 * A sessão ativa precisa ser validada pelo futuro adaptador de autorização.
 * Somente cookies SSR; não aceitar JWT/identidade enviados na query string.
 */
export async function autenticarUsuarioCapa() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || "";
  if (!url || !key) throw new Error("autenticacao_indisponivel");
  const cookieStore = await cookies();
  const client = createServerClient(url, key, {
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store", redirect: "error" }) },
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (valores) => valores.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
    },
  });
  const { data, error } = await client.auth.getUser();
  if (error) {
    if (error.status === 400 || error.status === 401 || error.status === 403) return null;
    throw new Error("autenticacao_indisponivel");
  }
  return data.user?.id ? { usuarioId: data.user.id } : null;
}
