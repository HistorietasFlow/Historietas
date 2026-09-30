import { normalizarTexto } from "../../../../lib/utils";

export function formatarGeneroObraPublica(genero: string) {
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

export function obterTextoPerfilObra(
  registro: Record<string, unknown>,
  chave: string,
) {
  const valor = registro[chave];

  return typeof valor === "string" && valor.trim() ? valor.trim() : "";
}
