"use client";

import { supabase } from "../../../lib/supabase/client";
import { useEffect, useState } from "react";
import { carregarObrasReaisEmBreve } from "../loaders/carregar-obras-reais-em-breve";
import { type ObraEmBreveCard } from "../lib/em-breve-work-normalizers";

export function useEmBreveObrasReais() {
  const [obrasReaisEmBreve, setObrasReaisEmBreve] =
    useState<ObraEmBreveCard[]>([]);

  useEffect(() => {
    let componenteAtivo = true;
    let geracao = 0;
    async function carregarObrasReais() {
      const atual = ++geracao;
      try {
        const obrasSemConteudo = await carregarObrasReaisEmBreve();
        if (componenteAtivo && atual === geracao) setObrasReaisEmBreve(obrasSemConteudo);
      } catch {
        if (componenteAtivo && atual === geracao) setObrasReaisEmBreve([]);
      }
    }
    void carregarObrasReais();
    let usuario: string | undefined;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_evento, sessao) => {
      const proximo = sessao?.user?.id || "";
      if (usuario === proximo) return;
      usuario = proximo;
      const atual = ++geracao;
      queueMicrotask(() => {
        if (!componenteAtivo || atual !== geracao) return;
        setObrasReaisEmBreve([]);
        void carregarObrasReais();
      });
    });
    return () => { componenteAtivo = false; ++geracao; subscription.unsubscribe(); };
  }, []);

  return obrasReaisEmBreve;
}
