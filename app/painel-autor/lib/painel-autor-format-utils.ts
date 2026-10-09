import { normalizarTexto } from "../../../lib/utils";

export function formatarGeneroPainelAutor(genero: string) {
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

export function obterTimestamp(dataIso: string) {
  const timestamp = new Date(dataIso).getTime();

  return Number.isNaN(timestamp) ? 0 : timestamp;
}
