"use client";

import { useState } from "react";

export function useLerCapituloRouteIdentityState() {
  const [obraId, setObraId] = useState("");
  const [capituloId, setCapituloId] = useState("");

  return { obraId, setObraId, capituloId, setCapituloId };
}
