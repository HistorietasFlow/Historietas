import type { HistorietasLanguage } from "../../../lib/i18n";
import { criarSlugBase } from "../../../lib/utils";
import { traduzirTextoPainelAutor } from "./painel-autor-translations";

type ObraCompartilhavelPainel = {
  titulo: string;
  autor: string;
  slug: string;
  link: string;
};

export function copiarTextoComFallback(texto: string) {
  const campoTemporario = document.createElement("textarea");

  campoTemporario.value = texto;
  campoTemporario.setAttribute("readonly", "true");
  campoTemporario.style.position = "fixed";
  campoTemporario.style.left = "-9999px";
  document.body.appendChild(campoTemporario);
  campoTemporario.select();

  try {
    document.execCommand("copy");
  } catch {
    // O compartilhamento e a cópia permanecem silenciosos.
  } finally {
    document.body.removeChild(campoTemporario);
  }
}

export async function compartilharObraPainel(
  obra: ObraCompartilhavelPainel,
  language: HistorietasLanguage,
) {
  const href =
    obra.link || `/obra/${obra.slug || criarSlugBase(obra.titulo)}`;
  const linkAbsoluto = new URL(href, window.location.origin).toString();
  const dadosCompartilhamento: ShareData = {
    title: traduzirTextoPainelAutor(`${obra.titulo} no HISTORIETAS`, language),
    text: traduzirTextoPainelAutor(
      `Confira a obra ${obra.titulo} de ${obra.autor} no HISTORIETAS.`,
      language,
    ),
    url: linkAbsoluto,
  };

  if (typeof navigator.share === "function") {
    try {
      await navigator.share(dadosCompartilhamento);
      return;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
    }
  }

  try {
    if (
      window.isSecureContext &&
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === "function"
    ) {
      await navigator.clipboard.writeText(linkAbsoluto);
      return;
    }
  } catch {
    // Continua para o fallback silencioso abaixo.
  }

  copiarTextoComFallback(linkAbsoluto);
}
