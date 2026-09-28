import type { OrdenacaoComunidade } from "./community-sort-order";

export function ordenacaoRecentesEstaAtivaComunidade(
  ordenacaoAtiva: OrdenacaoComunidade,
  mostrarApenasSalvos: boolean
): boolean {
  return ordenacaoAtiva === "Recentes" && !mostrarApenasSalvos;
}

export function ordenacaoEmAltaEstaAtivaComunidade(
  ordenacaoAtiva: OrdenacaoComunidade,
  mostrarApenasSalvos: boolean
): boolean {
  return ordenacaoAtiva === "Em alta" && !mostrarApenasSalvos;
}

export function ordenacaoMaisComentadasEstaAtivaComunidade(
  ordenacaoAtiva: OrdenacaoComunidade,
  mostrarApenasSalvos: boolean
): boolean {
  return ordenacaoAtiva === "Mais comentadas" && !mostrarApenasSalvos;
}
