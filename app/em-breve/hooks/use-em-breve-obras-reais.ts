"use client";

import { useEffect, useState } from "react";
import { carregarObrasReaisEmBreve } from "../loaders/carregar-obras-reais-em-breve";
import { type ObraEmBreveCard } from "../lib/em-breve-work-normalizers";

export function useEmBreveObrasReais() {
  const [obrasReaisEmBreve, setObrasReaisEmBreve] =
    useState<ObraEmBreveCard[]>([]);

  useEffect(() => {
    let componenteAtivo = true;

    async function carregarObrasReais() {
      const obrasSemConteudo = await carregarObrasReaisEmBreve();

      window.setTimeout(() => {
        if (componenteAtivo) {
          setObrasReaisEmBreve(obrasSemConteudo);
        }
      }, 0);
    }

    void carregarObrasReais();

    return () => {
      componenteAtivo = false;
    };
  }, []);

  return obrasReaisEmBreve;
}
