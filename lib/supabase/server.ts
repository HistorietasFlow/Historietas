import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
  "";

export const supabaseServerConfigurado = Boolean(
  supabaseUrl && supabasePublishableKey
);

function criarErroSupabaseNaoConfigurado() {
  return new Error(
    "Supabase não configurado. Verifique NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY."
  );
}

function criarRespostaErro(data: unknown = null) {
  return Promise.resolve({
    data,
    error: criarErroSupabaseNaoConfigurado(),
    count: null,
    status: 0,
    statusText: "Supabase não configurado",
  });
}

function criarQueryBuilderIndisponivel(): unknown {
  const proxy: unknown = new Proxy(
    {},
    {
      get(_target, propriedade) {
        const resposta = criarRespostaErro();

        if (propriedade === "then") {
          return resposta.then.bind(resposta);
        }

        if (propriedade === "catch") {
          return resposta.catch.bind(resposta);
        }

        if (propriedade === "finally") {
          return resposta.finally.bind(resposta);
        }

        return () => proxy;
      },
    }
  );

  return proxy;
}

function criarClienteSupabaseServerIndisponivel(): SupabaseClient {
  return {
    auth: {
      getUser: async () => ({
        data: { user: null },
        error: criarErroSupabaseNaoConfigurado(),
      }),
      getSession: async () => ({
        data: { session: null },
        error: criarErroSupabaseNaoConfigurado(),
      }),
      onAuthStateChange: () => ({
        data: {
          subscription: {
            id: "supabase-server-nao-configurado",
            callback: () => undefined,
            unsubscribe: () => undefined,
          },
        },
      }),
      signOut: async () => ({
        error: criarErroSupabaseNaoConfigurado(),
      }),
    },
    from: () => criarQueryBuilderIndisponivel(),
    rpc: () => criarQueryBuilderIndisponivel(),
    storage: {
      from: () => ({
        upload: async () => ({
          data: null,
          error: criarErroSupabaseNaoConfigurado(),
        }),
        update: async () => ({
          data: null,
          error: criarErroSupabaseNaoConfigurado(),
        }),
        remove: async () => ({
          data: null,
          error: criarErroSupabaseNaoConfigurado(),
        }),
        download: async () => ({
          data: null,
          error: criarErroSupabaseNaoConfigurado(),
        }),
        list: async () => ({
          data: null,
          error: criarErroSupabaseNaoConfigurado(),
        }),
        getPublicUrl: () => ({
          data: { publicUrl: "" },
        }),
      }),
    },
  } as unknown as SupabaseClient;
}

export async function criarSupabaseServerClient(): Promise<SupabaseClient> {
  if (!supabaseServerConfigurado) {
    return criarClienteSupabaseServerIndisponivel();
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components não conseguem gravar cookies.
          // Middleware/Route Handlers conseguem atualizar quando necessário.
        }
      },
    },
  });
}

export const createClient = criarSupabaseServerClient;