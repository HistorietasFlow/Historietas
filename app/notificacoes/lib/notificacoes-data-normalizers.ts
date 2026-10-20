import { limparTextoExibicao } from "./notificacoes-text-utils";

export function pegarTexto(valor: unknown, fallback = "") {
  const texto = typeof valor === "string" && valor.trim() ? valor.trim() : fallback;

  return limparTextoExibicao(texto);
}

export function pegarBooleano(valor: unknown, fallback = false) {
  return typeof valor === "boolean" ? valor : fallback;
}

export function pegarTagsSupabase(valor: unknown): string[] {
  if (Array.isArray(valor)) {
    const tags = valor
      .filter((tag): tag is string => typeof tag === "string" && Boolean(tag.trim()))
      .map((tag) => limparTextoExibicao(tag));

    return tags.length > 0 ? tags : ["sem tags"];
  }

  if (typeof valor === "string" && valor.trim()) {
    const tags = valor
      .split(",")
      .map((tag) => limparTextoExibicao(tag))
      .filter(Boolean);

    return tags.length > 0 ? tags : ["sem tags"];
  }

  return ["sem tags"];
}
