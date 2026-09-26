import type { HistorietasLanguage } from "../../../lib/i18n";
import { traduzirTextoComunidade } from "./community-text-translator";

export function traduzirContagemResultadosComunidade(
  total: number,
  tipo: "usuarios" | "publicacoes",
  idioma: HistorietasLanguage
) {
  if (idioma === "en") {
    return `${total} found`;
  }

  if (idioma === "es") {
    if (tipo === "publicacoes") {
      return `${total} ${total === 1 ? "encontrada" : "encontradas"}`;
    }

    return `${total} ${total === 1 ? "encontrado" : "encontrados"}`;
  }

  if (tipo === "publicacoes") {
    return `${total} ${total === 1 ? "encontrada" : "encontradas"}`;
  }

  return `${total} ${total === 1 ? "encontrado" : "encontrados"}`;
}

export function obterTextoContagemUsuariosBuscaComunidade(
  carregando: boolean,
  total: number,
  idioma: HistorietasLanguage
) {
  return carregando
    ? traduzirTextoComunidade("Buscando...", idioma)
    : traduzirContagemResultadosComunidade(total, "usuarios", idioma);
}
