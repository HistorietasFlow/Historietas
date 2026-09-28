import type { OrdenacaoComunidade } from "./community-sort-order";

type SelecionarOrdenacaoFeedComunidadeParams = {
  setOrdenacaoAtiva: (ordenacaoAtiva: OrdenacaoComunidade) => void;
  setMostrarApenasSalvos: (mostrarApenasSalvos: boolean) => void;
  setMenuAcoesRapidasComunidadeAberto: (
    menuAcoesRapidasComunidadeAberto: boolean
  ) => void;
};

export function selecionarOrdenacaoRecentesComunidade({
  setOrdenacaoAtiva,
  setMostrarApenasSalvos,
  setMenuAcoesRapidasComunidadeAberto,
}: SelecionarOrdenacaoFeedComunidadeParams): void {
  setOrdenacaoAtiva("Recentes");
  setMostrarApenasSalvos(false);
  setMenuAcoesRapidasComunidadeAberto(false);
}

export function selecionarOrdenacaoEmAltaComunidade({
  setOrdenacaoAtiva,
  setMostrarApenasSalvos,
  setMenuAcoesRapidasComunidadeAberto,
}: SelecionarOrdenacaoFeedComunidadeParams): void {
  setOrdenacaoAtiva("Em alta");
  setMostrarApenasSalvos(false);
  setMenuAcoesRapidasComunidadeAberto(false);
}

export function selecionarOrdenacaoMaisComentadasComunidade({
  setOrdenacaoAtiva,
  setMostrarApenasSalvos,
  setMenuAcoesRapidasComunidadeAberto,
}: SelecionarOrdenacaoFeedComunidadeParams): void {
  setOrdenacaoAtiva("Mais comentadas");
  setMostrarApenasSalvos(false);
  setMenuAcoesRapidasComunidadeAberto(false);
}
