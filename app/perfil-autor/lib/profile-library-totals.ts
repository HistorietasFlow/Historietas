import type { ObraLocal } from "../types";
import { colecaoTemObraPerfilBiblioteca } from "./library-normalizers";

export function obterTotaisBibliotecaPerfilAutor({
  obras,
  obrasSeguidasBiblioteca,
  obrasConcluidas,
  itensBibliotecaQueroLerTotal,
  itensBibliotecaConcluidasTotal,
  obrasConcluidasPerfilPorObrasDoAutor,
}: {
  obras: ObraLocal[];
  obrasSeguidasBiblioteca: string[];
  obrasConcluidas: string[];
  itensBibliotecaQueroLerTotal: number;
  itensBibliotecaConcluidasTotal: number;
  obrasConcluidasPerfilPorObrasDoAutor: number;
}) {
  const totalSeguidasPorObrasCarregadas = obras.filter((obra) =>
    colecaoTemObraPerfilBiblioteca(obrasSeguidasBiblioteca, obra),
  ).length;

  const totalConcluidasPorObrasCarregadas = obras.filter((obra) =>
    colecaoTemObraPerfilBiblioteca(obrasConcluidas, obra),
  ).length;

  return {
    obrasSeguidasPerfilTotal: Math.max(
      totalSeguidasPorObrasCarregadas,
      itensBibliotecaQueroLerTotal,
    ),
    obrasConcluidasPerfilTotal: Math.max(
      obrasConcluidasPerfilPorObrasDoAutor,
      totalConcluidasPorObrasCarregadas,
      itensBibliotecaConcluidasTotal,
    ),
  };
}
