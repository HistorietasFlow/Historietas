import type { AutorPerfil } from "../types";
import {
  formatarGeneroPerfilAutor,
  normalizarNumeroPerfilAutor,
} from "./profile-formatters";

export function obterResumoEstatisticasPerfilAutor(
  perfilParaMostrar: AutorPerfil | null,
) {
  if (!perfilParaMostrar) {
    return {
      generosPrincipaisPerfil: [] as string[],
      generosEspecialidadesPerfil: ["Histórias variadas"],
      totalVisualizacoesPerfil: 0,
      totalRascunhosPerfil: 0,
      totalObrasSemCapitulosPerfil: 0,
    };
  }

  const contagemGeneros = new Map<string, number>();

  perfilParaMostrar.obras.forEach((obra) => {
    const genero = formatarGeneroPerfilAutor(obra.genero);

    if (!genero || genero === "Não informado") {
      return;
    }

    contagemGeneros.set(genero, (contagemGeneros.get(genero) || 0) + 1);
  });

  const generosPrincipaisPerfil = Array.from(contagemGeneros.entries())
    .sort((generoA, generoB) => {
      if (generoA[1] !== generoB[1]) {
        return generoB[1] - generoA[1];
      }

      return generoA[0].localeCompare(generoB[0]);
    })
    .slice(0, 5)
    .map(([genero]) => genero);

  return {
    generosPrincipaisPerfil,
    generosEspecialidadesPerfil:
      generosPrincipaisPerfil.length > 0
        ? generosPrincipaisPerfil
        : ["Histórias variadas"],
    totalVisualizacoesPerfil: perfilParaMostrar.obras.reduce(
      (total, obra) =>
        total + normalizarNumeroPerfilAutor(obra.visualizacoes),
      0,
    ),
    totalRascunhosPerfil: Math.max(
      0,
      perfilParaMostrar.obras.length - perfilParaMostrar.totalPublicadas,
    ),
    totalObrasSemCapitulosPerfil: perfilParaMostrar.obras.filter(
      (obra) => obra.capitulos.length === 0,
    ).length,
  };
}
