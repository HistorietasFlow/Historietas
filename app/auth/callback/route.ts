import { NextResponse } from "next/server";
import { criarSupabaseServerClient } from "../../../lib/supabase/server";

function obterDestinoSeguro(valor: string | null) {
  const destino = typeof valor === "string" ? valor.trim() : "";

  if (
    !destino ||
    !destino.startsWith("/") ||
    destino.startsWith("//") ||
    destino.includes("\\") ||
    /[\u0000-\u001F\u007F]/.test(destino)
  ) {
    return "/redefinir-senha";
  }

  try {
    const url = new URL(destino, "https://historietas.local");

    if (url.origin !== "https://historietas.local") {
      return "/redefinir-senha";
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/redefinir-senha";
  }
}

function claimsTemRecuperacao(claims: unknown) {
  if (!claims || typeof claims !== "object") {
    return false;
  }

  const amr = (claims as { amr?: unknown }).amr;

  if (!Array.isArray(amr)) {
    return false;
  }

  return amr.some((item) => {
    if (!item || typeof item !== "object") {
      return false;
    }

    const metodo = (item as { method?: unknown }).method;

    return (
      typeof metodo === "string" &&
      metodo.trim().toLowerCase() === "recovery"
    );
  });
}

function respostaLinkInvalido(origem: string) {
  return NextResponse.redirect(
    new URL("/redefinir-senha?erro=link-invalido", origem),
  );
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const codigo = url.searchParams.get("code");
  const destino = obterDestinoSeguro(url.searchParams.get("next"));

  if (!codigo) {
    return respostaLinkInvalido(url.origin);
  }

  const supabase = await criarSupabaseServerClient();
  const { data, error } =
    await supabase.auth.exchangeCodeForSession(codigo);

  if (error || !data.user || !data.session) {
    return respostaLinkInvalido(url.origin);
  }

  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims(data.session.access_token);

  if (
    claimsError ||
    !claimsData ||
    !claimsTemRecuperacao(claimsData.claims)
  ) {
    try {
      await supabase.auth.signOut();
    } catch {
      // A rejeicao continua valida mesmo se a limpeza da sessao falhar.
    }

    return respostaLinkInvalido(url.origin);
  }

  const destinoUrl = new URL(destino, url.origin);
  destinoUrl.searchParams.set("recuperacao", "1");

  return NextResponse.redirect(destinoUrl);
}
