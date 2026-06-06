import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() || "";

const supabaseConfigurado = Boolean(supabaseUrl && supabasePublishableKey);

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
  let proxy: unknown;

  proxy = new Proxy(
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

function criarClienteSupabaseIndisponivel(): SupabaseClient {
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
            id: "supabase-nao-configurado",
            callback: () => undefined,
            unsubscribe: () => undefined,
          },
        },
      }),
      signUp: async () => ({
        data: { user: null, session: null },
        error: criarErroSupabaseNaoConfigurado(),
      }),
      signInWithPassword: async () => ({
        data: { user: null, session: null },
        error: criarErroSupabaseNaoConfigurado(),
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

if (!supabaseConfigurado) {
  console.error(
    "Supabase não configurado. Verifique NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY."
  );
}

export const supabase: SupabaseClient = supabaseConfigurado
  ? createBrowserClient(supabaseUrl, supabasePublishableKey)
  : criarClienteSupabaseIndisponivel();