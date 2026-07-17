import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

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

const supabaseConfigurado = Boolean(
  urlSupabaseValida(supabaseUrl) && supabasePublishableKey,
);

function criarErroSupabaseNaoConfigurado() {
  return new Error(
    "Supabase não configurado. Verifique NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
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
    },
  );

  return proxy;
}

function criarCanalSupabaseIndisponivel() {
  const canal = {
    on: () => canal,
    subscribe: () => canal,
    unsubscribe: async () => ({
      error: criarErroSupabaseNaoConfigurado(),
    }),
  };

  return canal;
}

function criarClienteSupabaseIndisponivel(): SupabaseClient {
  const criarRespostaAuthVazia = () => ({
    data: {
      user: null,
      session: null,
    },
    error: criarErroSupabaseNaoConfigurado(),
  });

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
      signUp: async () => criarRespostaAuthVazia(),
      signInWithPassword: async () => criarRespostaAuthVazia(),
      updateUser: async () => ({
        data: { user: null },
        error: criarErroSupabaseNaoConfigurado(),
      }),
      signOut: async () => ({
        error: criarErroSupabaseNaoConfigurado(),
      }),
    },
    from: () => criarQueryBuilderIndisponivel(),
    rpc: () => criarQueryBuilderIndisponivel(),
    channel: () => criarCanalSupabaseIndisponivel(),
    removeChannel: async () => "ok",
    removeAllChannels: async () => [],
    getChannels: () => [],
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
        createSignedUrl: async () => ({
          data: null,
          error: criarErroSupabaseNaoConfigurado(),
        }),
        createSignedUrls: async () => ({
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

if (!supabaseConfigurado && typeof window !== "undefined") {
  console.error(
    "Supabase não configurado. Verifique NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
  );
}

export const supabase: SupabaseClient = supabaseConfigurado
  ? createBrowserClient(supabaseUrl, supabasePublishableKey)
  : criarClienteSupabaseIndisponivel();