"use client";

import { useState } from "react";
import {
  avaliacaoAutorVazia,
  avaliacaoDiarioVazia,
} from "../constants";
import type {
  AvaliacaoAutorPublica,
  AvaliacaoDiarioPublica,
} from "../types";

export function usePerfilAutorRatingState() {
  const [avaliacaoAutor, setAvaliacaoAutor] =
    useState<AvaliacaoAutorPublica>(avaliacaoAutorVazia);
  const [avaliacaoDiario, setAvaliacaoDiario] =
    useState<AvaliacaoDiarioPublica>(avaliacaoDiarioVazia);

  return {
    avaliacaoAutor,
    setAvaliacaoAutor,
    avaliacaoDiario,
    setAvaliacaoDiario,
  };
}
