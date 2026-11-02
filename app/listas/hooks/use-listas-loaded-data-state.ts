"use client";

import { useState } from "react";
import { LISTAS_PERFIL_VAZIAS } from "../lib/listas-page-constants";
import type {
  AutorLista,
  ListasPerfilEstado,
  ObraLista,
} from "../types";

export function useListasLoadedDataState() {
  const [listasPerfil, setListasPerfil] =
    useState<ListasPerfilEstado>(LISTAS_PERFIL_VAZIAS);
  const [obrasPublicas, setObrasPublicas] = useState<ObraLista[]>([]);
  const [autores, setAutores] = useState<AutorLista[]>([]);

  return {
    listasPerfil,
    setListasPerfil,
    obrasPublicas,
    setObrasPublicas,
    autores,
    setAutores,
  };
}
