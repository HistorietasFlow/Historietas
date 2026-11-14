"use client";

import {
  useState, useRef, useEffect,
  type Dispatch,
  type SetStateAction,
} from "react";
import { supabase } from "../../../lib/supabase/client";
import { sincronizarAvisoLancamentoSupabaseEmBreve } from "../actions/sincronizar-aviso-lancamento-supabase-em-breve";
import { criarLoginHrefEmBreve } from "../lib/em-breve-route-utils";
import { type ObraEmBreveCard } from "../lib/em-breve-work-normalizers";
import {
  adicionarObraNaListaEmBreve,
  listaTemObraEmBreve,
  normalizarLancamentosSalvosComObrasEmBreve,
  obterIdentificadoresObraEmBreve,
  removerObraDaListaEmBreve,
} from "../lib/em-breve-work-list-utils";

type EmBrevePushRouter = {
  push: (href: string) => void;
};

export function useEmBreveSalvarLancamento({
  router,
  usuarioIdLogado,
  obrasSalvasNormalizadas,
  obrasReaisEmBreve,
  setUsuarioIdLogado,
  setObrasSalvas,
}: {
  router: EmBrevePushRouter;
  usuarioIdLogado: string;
  obrasSalvasNormalizadas: string[];
  obrasReaisEmBreve: ObraEmBreveCard[];
  setUsuarioIdLogado: Dispatch<SetStateAction<string>>;
  setObrasSalvas: Dispatch<SetStateAction<string[]>>;
}) {
  const [avisoAcesso, setAvisoAcesso] = useState("");
  const [obraProcessandoId, setObraProcessandoId] = useState("");

  const ocupado = useRef(false);
  const contexto = useRef({ ativo: true, userId: usuarioIdLogado });
  const listaAtual = useRef(obrasSalvasNormalizadas);
  useEffect(() => { listaAtual.current = obrasSalvasNormalizadas; }, [obrasSalvasNormalizadas]);
  useEffect(() => {
    const atual = { ativo: true, userId: usuarioIdLogado };
    contexto.current = atual;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_evento, sessao) => {
      if ((sessao?.user?.id || "") !== atual.userId) atual.ativo = false;
    });
    return () => { atual.ativo = false; subscription.unsubscribe(); };
  }, [usuarioIdLogado]);

  async function salvarLancamento(obra: ObraEmBreveCard) {
    const identificadoresObra = obterIdentificadoresObraEmBreve(obra);

    if (identificadoresObra.length === 0 || ocupado.current) {
      return;
    }

    const atual = contexto.current;
    if (!atual.ativo) return;
    ocupado.current = true;
    setAvisoAcesso("");
    setObraProcessandoId(obra.id);

    try {
      const { data, error } = await supabase.auth.getUser();

      if (!atual.ativo || contexto.current !== atual) return;
      if (error || !data.user) {
        setAvisoAcesso("Entre na sua conta para ativar aviso de lançamento.");
        router.push(criarLoginHrefEmBreve());
        return;
      }

      if (data.user.id !== atual.userId) return;
      const avisoAtivo = listaTemObraEmBreve(obra, listaAtual.current);
      const deveAtivar = !avisoAtivo;
      const sincronizou = await sincronizarAvisoLancamentoSupabaseEmBreve(
        data.user.id,
        obra.id,
        deveAtivar
      );

      if (!atual.ativo || contexto.current !== atual) return;
      if (!sincronizou) {
        setAvisoAcesso(
          "Não consegui salvar o aviso agora. Tente novamente em instantes."
        );
        return;
      }

      const novasObrasSalvas = deveAtivar
        ? adicionarObraNaListaEmBreve(obra, listaAtual.current)
        : removerObraDaListaEmBreve(obra, listaAtual.current);
      const obrasNormalizadas = normalizarLancamentosSalvosComObrasEmBreve(
        novasObrasSalvas,
        obrasReaisEmBreve
      );

      setUsuarioIdLogado(data.user.id);
      listaAtual.current = obrasNormalizadas;
      setObrasSalvas(anteriores => normalizarLancamentosSalvosComObrasEmBreve(
        deveAtivar ? adicionarObraNaListaEmBreve(obra, anteriores) : removerObraDaListaEmBreve(obra, anteriores),
        obrasReaisEmBreve
      ));
    } catch {
      if (!atual.ativo || contexto.current !== atual) return;
      setAvisoAcesso("Não consegui confirmar sua conta agora. Tente novamente.");
    } finally {
      ocupado.current = false;
      setObraProcessandoId("");
    }
  }

  return {
    avisoAcesso,
    obraProcessandoId,
    salvarLancamento,
  };
}
