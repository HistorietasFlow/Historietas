"use client";

import { useEffect, useRef, useState, type SetStateAction } from "react";
import { supabase } from "../../../lib/supabase/client";
import { encontrarLinkObraComConteudoEmBreve } from "../loaders/encontrar-link-obra-com-conteudo-em-breve";
import { pegarParametro } from "../lib/em-breve-route-utils";
import {
  SAVED_RELEASES_STORAGE_KEY,
  carregarJsonUsuarioEmBreve,
  salvarJsonUsuarioEmBreve,
} from "../lib/em-breve-storage-utils";
import { normalizarListaIdsEmBreve } from "../lib/em-breve-work-list-utils";
import { carregarLancamentosSalvosSupabaseEmBreve } from "../loaders/carregar-lancamentos-salvos-supabase-em-breve";

type EmBreveReplaceRouter = {
  replace: (href: string) => void;
};

export function useEmBreveLancamentosSalvosIniciais(
  router: EmBreveReplaceRouter
) {
  const [nomeObra, setNomeObra] = useState("");
  const [obraIdConsultada, setObraIdConsultada] = useState("");
  const [obrasSalvas, setObrasSalvas] = useState<string[]>([]);
  const [usuarioIdLogado, setUsuarioIdLogado] = useState("");

  const alterarRevisaoRef = useRef<(valor: SetStateAction<string[]>) => void>(() => {});
  const atualizarObrasSalvas: typeof setObrasSalvas = (valor) => {
    alterarRevisaoRef.current(valor);
    setObrasSalvas(valor);
  };

  useEffect(() => {
    let componenteAtivo = true;
    let geracao = 0;
    let alteracoes: SetStateAction<string[]>[] = [];
    let usuarioAtual: string | undefined;
    const parametros = new URLSearchParams(window.location.search);
    const obraIdParam = pegarParametro(parametros.get("obraId"));
    const nomeObraParam = pegarParametro(parametros.get("obra"));

    async function carregarLancamentosSalvos(userId: string, atual: number) {
      if (!componenteAtivo || atual !== geracao) return;
      usuarioAtual = userId;
      const locais = normalizarListaIdsEmBreve(
        carregarJsonUsuarioEmBreve(SAVED_RELEASES_STORAGE_KEY, userId) || []
      );
      setUsuarioIdLogado(userId);
      setObrasSalvas(locais);
      alteracoes = [];
      try {
        const remotas = await carregarLancamentosSalvosSupabaseEmBreve(userId);
        if (!componenteAtivo || atual !== geracao) return;
        let combinadas = normalizarListaIdsEmBreve([...locais, ...remotas]);
        for (const alterar of alteracoes) combinadas = typeof alterar === "function" ? alterar(combinadas) : alterar;
        salvarJsonUsuarioEmBreve(SAVED_RELEASES_STORAGE_KEY, userId, combinadas);
        setObrasSalvas(combinadas);
      } catch {
        // O cache da conta já está em memória; falha remota não o apaga.
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_evento, sessao) => {
      const proximo = sessao?.user?.id || "";
      if (usuarioAtual === proximo) return;
      usuarioAtual = proximo;
      const atual = ++geracao;
      queueMicrotask(() => {
        if (!componenteAtivo || atual !== geracao) return;
        setUsuarioIdLogado(""); setObrasSalvas([]);
        if (sessao?.user) void carregarLancamentosSalvos(sessao.user.id, atual);
        carregarDestino(atual);
      });
    });
    const inicial = geracao;
    void (async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (!componenteAtivo || inicial !== geracao) return;
        if (!error && data.user) await carregarLancamentosSalvos(data.user.id, inicial);
      } catch { /* Uma falha de autenticação não mistura contas. */ }
    })();
    queueMicrotask(() => {
      if (!componenteAtivo) return;
      setObraIdConsultada(obraIdParam); setNomeObra(nomeObraParam);
    });
    function carregarDestino(atual: number) {
      if (!obraIdParam && !nomeObraParam) return;
      void encontrarLinkObraComConteudoEmBreve(obraIdParam, nomeObraParam)
        .then(linkObraComConteudo => {
          if (componenteAtivo && atual === geracao && linkObraComConteudo) router.replace(linkObraComConteudo);
        }).catch(() => { /* Rede indisponível: permanece na página. */ });
    }
    carregarDestino(geracao);
    alterarRevisaoRef.current = valor => { alteracoes.push(valor); };
    return () => {
      componenteAtivo = false;
      ++geracao;
      subscription.unsubscribe();
    };
  }, [router]);

  return {
    nomeObra,
    obraIdConsultada,
    obrasSalvas,
    setObrasSalvas: atualizarObrasSalvas,
    usuarioIdLogado,
    setUsuarioIdLogado,
  };
}
