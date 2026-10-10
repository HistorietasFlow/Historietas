export function criarUrlAbsolutaCompartilhamentoPerfilAutor(href: string) {
  const hrefLimpo = href.trim();

  if (typeof window === "undefined") {
    return hrefLimpo;
  }

  try {
    return new URL(hrefLimpo || window.location.href, window.location.origin).toString();
  } catch {
    return window.location.href;
  }
}

export async function copiarTextoComFallbackPerfilAutor(texto: string) {
  const textoLimpo = texto.trim();

  if (!textoLimpo || typeof window === "undefined" || typeof document === "undefined") {
    return false;
  }

  try {
    if (
      window.isSecureContext &&
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === "function"
    ) {
      await navigator.clipboard.writeText(textoLimpo);
      return true;
    }
  } catch {
    // Continua para o fallback abaixo.
  }

  let campoTemporario: HTMLTextAreaElement | null = null;

  try {
    campoTemporario = document.createElement("textarea");
    campoTemporario.value = textoLimpo;
    campoTemporario.setAttribute("readonly", "true");
    campoTemporario.style.position = "fixed";
    campoTemporario.style.top = "-9999px";
    campoTemporario.style.left = "-9999px";
    campoTemporario.style.width = "1px";
    campoTemporario.style.height = "1px";
    campoTemporario.style.opacity = "0";

    document.body.appendChild(campoTemporario);
    campoTemporario.focus();
    campoTemporario.select();
    campoTemporario.setSelectionRange(0, campoTemporario.value.length);

    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    if (campoTemporario?.parentNode) {
      campoTemporario.parentNode.removeChild(campoTemporario);
    }
  }
}

export function erroCompartilhamentoFoiCanceladoPerfilAutor(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const nomeErro = "name" in error ? String((error as { name?: unknown }).name || "") : "";

  return nomeErro === "AbortError";
}
