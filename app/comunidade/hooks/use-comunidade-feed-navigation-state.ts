"use client";

import { useState } from "react";
import type { CategoriaComunidade } from "../components/community-category";
import type { AbaFeedComunidade } from "../components/community-feed-tab";
import type { TipoPublicacaoFiltro } from "../components/community-publication-filter";
import type { GrupoPublicacaoObra } from "../components/community-publication-group";
import type { OrdenacaoComunidade } from "../components/community-sort-order";

export function useComunidadeFeedNavigationState() {
  const [categoriaAtiva, setCategoriaAtiva] = useState<
    CategoriaComunidade | "Todos"
  >("Todos");
  const [tipoPublicacaoAtiva, setTipoPublicacaoAtiva] =
    useState<TipoPublicacaoFiltro>("Todos");
  const [obraRelacionadaFiltro, setObraRelacionadaFiltro] = useState("");
  const [grupoPublicacaoObra, setGrupoPublicacaoObra] =
    useState<GrupoPublicacaoObra>("");
  const [termoBusca, setTermoBusca] = useState("");
  const [ordenacaoAtiva, setOrdenacaoAtiva] =
    useState<OrdenacaoComunidade>("Recentes");
  const [abaFeedAtiva, setAbaFeedAtiva] =
    useState<AbaFeedComunidade>("Para você");
  const [mostrarApenasSalvos, setMostrarApenasSalvos] = useState(false);

  return {
    categoriaAtiva,
    setCategoriaAtiva,
    tipoPublicacaoAtiva,
    setTipoPublicacaoAtiva,
    obraRelacionadaFiltro,
    setObraRelacionadaFiltro,
    grupoPublicacaoObra,
    setGrupoPublicacaoObra,
    termoBusca,
    setTermoBusca,
    ordenacaoAtiva,
    setOrdenacaoAtiva,
    abaFeedAtiva,
    setAbaFeedAtiva,
    mostrarApenasSalvos,
    setMostrarApenasSalvos,
  };
}
