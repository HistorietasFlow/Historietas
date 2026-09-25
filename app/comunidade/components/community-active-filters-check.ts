import type { CategoriaComunidade } from "./community-category";
import type { TipoPublicacaoFiltro } from "./community-publication-filter";
import type { GrupoPublicacaoObra } from "./community-publication-group";
import type { OrdenacaoComunidade } from "./community-sort-order";

type TemFiltrosAtivosComunidadeParams = {
  categoriaAtiva: CategoriaComunidade | "Todos";
  tipoPublicacaoAtiva: TipoPublicacaoFiltro;
  obraRelacionadaFiltro: string;
  grupoPublicacaoObra: GrupoPublicacaoObra;
  termoBuscaNormalizado: string;
  mostrarApenasSalvos: boolean;
  ordenacaoAtiva: OrdenacaoComunidade;
};

export function temFiltrosAtivosComunidade({
  categoriaAtiva,
  tipoPublicacaoAtiva,
  obraRelacionadaFiltro,
  grupoPublicacaoObra,
  termoBuscaNormalizado,
  mostrarApenasSalvos,
  ordenacaoAtiva,
}: TemFiltrosAtivosComunidadeParams): boolean {
  return (
    categoriaAtiva !== "Todos" ||
    tipoPublicacaoAtiva !== "Todos" ||
    Boolean(obraRelacionadaFiltro.trim()) ||
    Boolean(grupoPublicacaoObra) ||
    Boolean(termoBuscaNormalizado) ||
    mostrarApenasSalvos ||
    ordenacaoAtiva !== "Recentes"
  );
}
