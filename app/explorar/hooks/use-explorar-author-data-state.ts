"use client";

import { useState } from "react";
import type {
  AvaliacoesAutoresExplorar,
  PerfisAutoresExplorar,
} from "../lib/explorar-author-profile-utils";

export function useExplorarAuthorDataState() {
  const [perfisAutores, setPerfisAutores] =
    useState<PerfisAutoresExplorar>({});
  const [avaliacoesAutores, setAvaliacoesAutores] =
    useState<AvaliacoesAutoresExplorar>({});

  return {
    perfisAutores,
    setPerfisAutores,
    avaliacoesAutores,
    setAvaliacoesAutores,
  };
}
