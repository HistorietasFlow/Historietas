"use client";

import { useState } from "react";

export function useLerCapituloRouteIdentityState({
  obraIdInicial = "",
  capituloIdInicial = "",
}: {
  obraIdInicial?: string;
  capituloIdInicial?: string;
} = {}) {
  const [obraId, setObraId] = useState(obraIdInicial);
  const [capituloId, setCapituloId] = useState(capituloIdInicial);

  return { obraId, setObraId, capituloId, setCapituloId };
}
