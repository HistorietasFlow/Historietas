import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const rotasProtegidas = [
  "/adicionar-capitulo",
  "/admin",
  "/configuracoes",
  "/editar-capitulo",
  "/editar-obra",
  "/notificacoes",
  "/painel-autor",
  "/publicar",
  "/seguindo",
] as const;

type CookieParaSalvar = {
  name: string;
  value: string;
  options: CookieOptions;
};

function normalizarPathname(pathname: string) {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname || "/";
}

function rotaEstaProtegida(pathname: string) {
  const caminho = normalizarPathname(pathname);

  return rotasProtegidas.some((rota) => {
    return caminho === rota || caminho.startsWith(`${rota}/`);
  });
}

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

function obterRedirectToSeguro(valor: string | null, fallback: string) {
  const destino = typeof valor === "string" ? valor.trim() : "";

  if (
    !destino ||
    !destino.startsWith("/") ||
    destino.startsWith("//") ||
    destino.includes("\\") ||
    /[\u0000-\u001F\u007F]/.test(destino)
  ) {
    return fallback;
  }

  try {
    const urlDestino = new URL(destino, "https://historietas.local");
    const caminho = normalizarPathname(urlDestino.pathname);

    if (urlDestino.origin !== "https://historietas.local") {
      return fallback;
    }

    if (caminho === "/login" || caminho.startsWith("/login/")) {
      return fallback;
    }

    return `${urlDestino.pathname}${urlDestino.search}${urlDestino.hash}`;
  } catch {
    return fallback;
  }
}

function obterPathComBusca(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  return `${pathname}${search}`;
}

function aplicarCookiesNaResposta(
  resposta: NextResponse,
  cookiesParaSalvar: CookieParaSalvar[],
) {
  cookiesParaSalvar.forEach(({ name, value, options }) => {
    resposta.cookies.set(name, value, options);
  });

  return resposta;
}

function criarRespostaContinuar(
  request: NextRequest,
  cookiesParaSalvar: CookieParaSalvar[] = [],
) {
  return aplicarCookiesNaResposta(
    NextResponse.next({
      request: {
        headers: request.headers,
      },
    }),
    cookiesParaSalvar,
  );
}

function criarRedirectSeguro(
  request: NextRequest,
  destino: string,
  cookiesParaSalvar: CookieParaSalvar[] = [],
) {
  const destinoSeguro = obterRedirectToSeguro(destino, "/");
  const destinoUrl = new URL(destinoSeguro, request.url);
  const redirectUrl = request.nextUrl.clone();

  redirectUrl.pathname = destinoUrl.pathname;
  redirectUrl.search = destinoUrl.search;
  redirectUrl.hash = destinoUrl.hash;

  return aplicarCookiesNaResposta(
    NextResponse.redirect(redirectUrl),
    cookiesParaSalvar,
  );
}

function criarRedirectLogin(
  request: NextRequest,
  cookiesParaSalvar: CookieParaSalvar[] = [],
) {
  const redirectUrl = request.nextUrl.clone();
  const redirectTo = obterRedirectToSeguro(obterPathComBusca(request), "/");

  redirectUrl.pathname = "/login";
  redirectUrl.search = "";
  redirectUrl.hash = "";
  redirectUrl.searchParams.set("redirectTo", redirectTo);

  return aplicarCookiesNaResposta(
    NextResponse.redirect(redirectUrl),
    cookiesParaSalvar,
  );
}

function chaveCookie(cookie: CookieParaSalvar) {
  return [
    cookie.name,
    cookie.options.path || "",
    cookie.options.domain || "",
  ].join(":");
}

export async function proxy(request: NextRequest) {
  const pathname = normalizarPathname(request.nextUrl.pathname);
  const estaNoLogin = pathname === "/login";
  const precisaLogin = rotaEstaProtegida(pathname);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
  const supabasePublicKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    "";

  if (!urlSupabaseValida(supabaseUrl) || !supabasePublicKey) {
    return precisaLogin
      ? criarRedirectLogin(request)
      : criarRespostaContinuar(request);
  }

  let cookiesPendentes: CookieParaSalvar[] = [];
  let response = criarRespostaContinuar(request);

  function recriarRespostaComCookies() {
    response = criarRespostaContinuar(request, cookiesPendentes);
  }

  const supabase = createServerClient(supabaseUrl, supabasePublicKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieParaSalvar[]) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        const cookiesPorChave = new Map(
          cookiesPendentes.map((cookie) => [chaveCookie(cookie), cookie]),
        );

        cookiesToSet.forEach((cookie) => {
          cookiesPorChave.set(chaveCookie(cookie), cookie);
        });

        cookiesPendentes = Array.from(cookiesPorChave.values());
        recriarRespostaComCookies();
      },
    },
  });

  let user = null;
  let erroUsuario = null;

  try {
    const resultadoUsuario = await supabase.auth.getUser();
    user = resultadoUsuario.data.user;
    erroUsuario = resultadoUsuario.error;
  } catch {
    erroUsuario = new Error("Não foi possível validar a sessão.");
  }

  if (precisaLogin && (erroUsuario || !user)) {
    return criarRedirectLogin(request, cookiesPendentes);
  }

  if (estaNoLogin && user) {
    const redirectTo = request.nextUrl.searchParams.get("redirectTo");

    return criarRedirectSeguro(
      request,
      obterRedirectToSeguro(redirectTo, "/"),
      cookiesPendentes,
    );
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|xml|json)$).*)",
  ],
};