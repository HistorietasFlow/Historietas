import { normalizarTexto } from "../../../lib/utils";

export function normalizarNomeAutor(nome: string) {
  return nome.trim().replace(/\s+/g, " ").toLowerCase();
}

export function formatarGeneroSeguindo(genero: string) {
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

export function normalizarListaTexto(lista: string[]) {
  return Array.from(
    new Set(
      lista
        .map((item) => item.trim())
        .filter((item) => Boolean(item)),
    ),
  );
}

export function normalizarNumeroSeguindo(valor: unknown, fallback = 0) {
  if (typeof valor === "number" && Number.isFinite(valor)) {
    return Math.max(0, Math.round(valor));
  }

  if (typeof valor === "string" && valor.trim()) {
    const numero = Number(valor.replace(/\./g, "").replace(",", "."));

    if (Number.isFinite(numero)) {
      return Math.max(0, Math.round(numero));
    }
  }

  return fallback;
}
