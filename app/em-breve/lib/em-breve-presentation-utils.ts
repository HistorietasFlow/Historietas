import { normalizarTexto } from "../../../lib/utils";

export function obterIconeTematicaEmBreve(genero: string) {
  const generoNormalizado = normalizarTexto(genero);

  if (generoNormalizado.includes("romance")) {
    return "♡";
  }

  if (generoNormalizado.includes("terror")) {
    return "☾";
  }

  if (generoNormalizado.includes("fantasia")) {
    return "✦";
  }

  if (generoNormalizado.includes("acao")) {
    return "⚡";
  }

  if (generoNormalizado.includes("aventura")) {
    return "⌖";
  }

  if (generoNormalizado.includes("comedia")) {
    return "☺";
  }

  if (
    generoNormalizado.includes("ficcao") ||
    generoNormalizado.includes("sci-fi") ||
    generoNormalizado.includes("sci fi")
  ) {
    return "⌬";
  }

  if (generoNormalizado.includes("misterio")) {
    return "◇";
  }

  if (generoNormalizado.includes("suspense")) {
    return "◌";
  }

  if (generoNormalizado.includes("sobrenatural")) {
    return "✧";
  }

  return "✦";
}
