import type { ModoConteudoExplorar } from "../components/explorar-section-components";

export function calcularTotalResultadosExplorar(
  modoConteudo: ModoConteudoExplorar,
  totalAutores: number,
  totalObras: number
) {
  return modoConteudo === "autores" ? totalAutores : totalObras;
}
