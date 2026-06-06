import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const rotasProtegidas = [
  "/publicar",
  "/painel-autor",
  "/minhas-obras",
  "/minha-obra",
  "/editar-obra",
  "/editar-capitulo",
  "/adicionar-capitulo",
  "/ver-arquivo",
  "/biblioteca",
  "/seguindo",
  "/notificacoes",
  "/configuracoes",
  "/admin",
];

type CookieParaSalvar = {
  name: string;
  value: string;
  options: CookieOptions;
};

function rotaEstaProtegida(pathname: string) {
  return rotasProtegidas.some((rota) => {
    return pathname === rota || pathname.startsWith(`${rota}/`);
  });
}

function obterRedirectToSeguro(valor: string | null, fallback: string) {
  const destino = typeof valor === "string" ? valor.trim() : "";

  if (!destino) {
    return fallback;
  }

  if (!destino.startsWith("/") || destino.startsWith("//")) {
    return fallback;
  }

  if (destino === "/login" || destino.startsWith("/login?")) {
    return fallback;
  }

  return destino;
}

function obterPathComBusca(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  return `${pathname}${search}`;
}

function criarRedirectSeguro(request: NextRequest, destino: string) {
  const destinoSeguro = obterRedirectToSeguro(destino, "/");
  const destinoUrl = new URL(destinoSeguro, request.url);
  const redirectUrl = request.nextUrl.clone();

  redirectUrl.pathname = destinoUrl.pathname;
  redirectUrl.search = destinoUrl.search;

  return redirectUrl;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const precisaLogin = rotaEstaProtegida(pathname);
  const estaNoLogin = pathname === "/login";

  if (!precisaLogin && !estaNoLogin) {
    return NextResponse.next();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() || "";

  if (!supabaseUrl || !supabasePublishableKey) {
    if (precisaLogin) {
      const redirectUrl = request.nextUrl.clone();

      redirectUrl.pathname = "/login";
      redirectUrl.search = "";
      redirectUrl.searchParams.set("redirectTo", obterPathComBusca(request));

      return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.next();
  }

  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieParaSalvar[]) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({
          request,
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (precisaLogin && !user) {
    const redirectUrl = request.nextUrl.clone();

    redirectUrl.pathname = "/login";
    redirectUrl.search = "";
    redirectUrl.searchParams.set("redirectTo", obterPathComBusca(request));

    return NextResponse.redirect(redirectUrl);
  }

  if (estaNoLogin && user) {
    const redirectTo = request.nextUrl.searchParams.get("redirectTo");

    return NextResponse.redirect(
      criarRedirectSeguro(request, obterRedirectToSeguro(redirectTo, "/"))
    );
  }

  return response;
}

export const config = {
  matcher: [
    "/publicar/:path*",
    "/painel-autor/:path*",
    "/minhas-obras/:path*",
    "/minha-obra/:path*",
    "/editar-obra/:path*",
    "/editar-capitulo/:path*",
    "/adicionar-capitulo/:path*",
    "/ver-arquivo/:path*",
    "/biblioteca/:path*",
    "/seguindo/:path*",
    "/notificacoes/:path*",
    "/configuracoes/:path*",
    "/admin/:path*",
    "/login",
  ],
};