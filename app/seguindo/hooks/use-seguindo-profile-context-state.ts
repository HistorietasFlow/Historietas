"use client";

import { useState } from "react";

export function useSeguindoProfileContextState() {
  const [perfilSocialId, setPerfilSocialId] = useState("");
  const [perfilSocialNome, setPerfilSocialNome] = useState("");

  return { perfilSocialId, setPerfilSocialId, perfilSocialNome, setPerfilSocialNome };
}
