"use client";

import { useState } from "react";
import type { ObraLocal } from "../lib/seguindo-page-types";

export function useSeguindoWorkFollowState() {
  const [obras, setObras] = useState<ObraLocal[]>([]);
  const [obrasSeguidas, setObrasSeguidas] = useState<string[]>([]);
  const [autoresSeguidos, setAutoresSeguidos] = useState<string[]>([]);

  return {
    obras, setObras,
    obrasSeguidas, setObrasSeguidas,
    autoresSeguidos, setAutoresSeguidos,
  };
}
