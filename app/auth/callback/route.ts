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

export async function GET(request: Request) {
  const url = new URL(request.url);
  const codigo = url.searchParams.get("code");
  const destino = obterDestinoSeguro(url.searchParams.get("next"));

  if (!codigo) {
    return NextResponse.redirect(
      new URL("/redefinir-senha?erro=link-invalido", url.origin),
    );
  }

  const supabase = await criarSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(codigo);

  if (error) {
    return NextResponse.redirect(
      new URL("/redefinir-senha?erro=link-invalido", url.origin),
    );
  }

  const destinoUrl = new URL(destino, url.origin);
  destinoUrl.searchParams.set("recuperacao", "1");

  return NextResponse.redirect(destinoUrl);
}