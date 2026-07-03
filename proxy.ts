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
  "/ver-arquivo",
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

function criarRedirectLogin(request: NextRequest) {
  const redirectUrl = request.nextUrl.clone();

  redirectUrl.pathname = "/login";
  redirectUrl.search = "";
  redirectUrl.searchParams.set("redirectTo", obterPathComBusca(request));

  return NextResponse.redirect(redirectUrl);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const estaNoLogin = pathname === "/login";
  const precisaLogin = rotaEstaProtegida(pathname);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
  const supabasePublicKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    "";

  if (!supabaseUrl || !supabasePublicKey) {
    if (precisaLogin) {
      return criarRedirectLogin(request);
    }

    return NextResponse.next();
  }

  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(supabaseUrl, supabasePublicKey, {
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
    return criarRedirectLogin(request);
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
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|xml|json)$).*)",
  ],
};