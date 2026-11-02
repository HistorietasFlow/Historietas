"use client";

import { useState } from "react";
import type { ResultadoVotosEnquete } from "../components/community-poll-votes-result";

export function useComunidadePollState() {
  const [votosEnquetes, setVotosEnquetes] = useState<Record<string, string>>({});
  const [resultadosEnquetes, setResultadosEnquetes] =
    useState<ResultadoVotosEnquete>({});
  const [votandoEnqueteId, setVotandoEnqueteId] = useState<string | null>(null);

  return {
    votosEnquetes,
    setVotosEnquetes,
    resultadosEnquetes,
    setResultadosEnquetes,
    votandoEnqueteId,
    setVotandoEnqueteId,
  };
}
