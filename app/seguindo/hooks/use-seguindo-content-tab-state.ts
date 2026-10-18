"use client";

import { useState } from "react";
import type { AbaConteudoSeguindo } from "../lib/seguindo-page-types";

export function useSeguindoContentTabState() {
  const [abaConteudo, setAbaConteudo] =
    useState<AbaConteudoSeguindo>("obras");

  return { abaConteudo, setAbaConteudo };
}
