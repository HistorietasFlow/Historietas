export function obterRedirectToSeguro(valor: string | null, fallback: string) {
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
    const pathname = urlDestino.pathname.replace(/\/+$/, "") || "/";

    if (
      urlDestino.origin !== "https://historietas.local" ||
      pathname === "/login" ||
      pathname.startsWith("/login/")
    ) {
      return fallback;
    }

    return `${urlDestino.pathname}${urlDestino.search}${urlDestino.hash}`;
  } catch {
    return fallback;
  }
}

export function obterRedirectToAtual(fallback: string) {
  if (typeof window === "undefined") {
    return fallback;
  }

  const params = new URLSearchParams(window.location.search);

  return obterRedirectToSeguro(params.get("redirectTo"), fallback);
}
