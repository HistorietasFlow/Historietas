import type { Dispatch, SetStateAction } from "react";
import type { CategoriaComunidade } from "./community-category";
import type { AbaFeedComunidade } from "./community-feed-tab";
import type { GrupoPublicacaoObra } from "./community-publication-group";
import type { TipoPublicacaoFiltro } from "./community-publication-filter";
import type { OrdenacaoComunidade } from "./community-sort-order";

export const ABAS_FEED_COMUNIDADE: AbaFeedComunidade[] = [
  "Para você",
  "Seguindo",
  "Recentes",
  "Teorias",
  "Reviews",
];

type SelecionarAbaFeedComunidadeParams = {
  aba: AbaFeedComunidade;
  setAbaFeedAtiva: Dispatch<SetStateAction<AbaFeedComunidade>>;
  setCategoriaAtiva: Dispatch<SetStateAction<CategoriaComunidade | "Todos">>;
  setTipoPublicacaoAtiva: Dispatch<SetStateAction<TipoPublicacaoFiltro>>;
  setObraRelacionadaFiltro: Dispatch<SetStateAction<string>>;
  setGrupoPublicacaoObra: Dispatch<SetStateAction<GrupoPublicacaoObra>>;
  setMostrarApenasSalvos: Dispatch<SetStateAction<boolean>>;
  setOrdenacaoAtiva: Dispatch<SetStateAction<OrdenacaoComunidade>>;
  setMenuAcoesRapidasComunidadeAberto: Dispatch<SetStateAction<boolean>>;
};

export function selecionarAbaFeedComunidade({
  aba,
  setAbaFeedAtiva,
  setCategoriaAtiva,
  setTipoPublicacaoAtiva,
  setObraRelacionadaFiltro,
  setGrupoPublicacaoObra,
  setMostrarApenasSalvos,
  setOrdenacaoAtiva,
  setMenuAcoesRapidasComunidadeAberto,
}: SelecionarAbaFeedComunidadeParams) {
  setAbaFeedAtiva(aba);
  setCategoriaAtiva("Todos");
  setTipoPublicacaoAtiva("Todos");
  setObraRelacionadaFiltro("");
  setGrupoPublicacaoObra("");
  setMostrarApenasSalvos(false);
  setOrdenacaoAtiva("Recentes");
  setMenuAcoesRapidasComunidadeAberto(false);

  window.history.replaceState(null, "", "/comunidade");
}
