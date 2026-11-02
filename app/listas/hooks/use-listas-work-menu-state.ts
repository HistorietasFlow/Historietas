"use client";

import { useState } from "react";
import type {
  CategoriaPerfil,
  ItemObraLista,
  ObraLista,
} from "../types";

export function useListasWorkMenuState() {
  const [obraMenuAberta, setObraMenuAberta] = useState<ObraLista | null>(null);
  const [itemPerfilMenuAberto, setItemPerfilMenuAberto] =
    useState<ItemObraLista | null>(null);
  const [categoriaMenuAberta, setCategoriaMenuAberta] =
    useState<CategoriaPerfil>("tudo");
  const [salvandoQueroLer, setSalvandoQueroLer] = useState(false);
  const [obraMenuNoQueroLer, setObraMenuNoQueroLer] = useState(false);

  return {
    obraMenuAberta,
    setObraMenuAberta,
    itemPerfilMenuAberto,
    setItemPerfilMenuAberto,
    categoriaMenuAberta,
    setCategoriaMenuAberta,
    salvandoQueroLer,
    setSalvandoQueroLer,
    obraMenuNoQueroLer,
    setObraMenuNoQueroLer,
  };
}
