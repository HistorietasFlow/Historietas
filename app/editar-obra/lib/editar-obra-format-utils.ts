import { normalizarTexto } from "../../../lib/utils";

export function formatarFormatoEdicaoObra(formato: string) {
  const formatoLimpo = formato.trim();
  const formatoSemAcento = formatoLimpo
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

  if (
    formatoSemAcento === "hq/manga" ||
    formatoSemAcento === "hq manga" ||
    formatoSemAcento === "hq-manga"
  ) {
    return "HQ";
  }

  return formatoLimpo || "Não informado";
}

export function formatarGeneroEdicaoObra(genero: string) {
  const generoLimpo = genero.trim();
  const generoNormalizado = normalizarTexto(generoLimpo);

  if (generoNormalizado === "fantasia sombria") {
    return "Fantasia";
  }

  if (generoNormalizado === "sci-fi" || generoNormalizado === "sci fi") {
    return "Ficção";
  }

  return generoLimpo || "Não informado";
}
