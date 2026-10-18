"use client";

import { useState } from "react";

export function useSeguindoSearchState() {
  const [busca, setBusca] = useState("");
  const [buscaSeguindoAberta, setBuscaSeguindoAberta] = useState(false);

  return { busca, setBusca, buscaSeguindoAberta, setBuscaSeguindoAberta };
}
