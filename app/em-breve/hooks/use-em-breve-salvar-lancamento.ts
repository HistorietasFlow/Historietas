"use client";

import {
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { supabase } from "../../../lib/supabase/client";
import { sincronizarAvisoLancamentoSupabaseEmBreve } from "../actions/sincronizar-aviso-lancamento-supabase-em-breve";
import { criarLoginHrefEmBreve } from "../lib/em-breve-route-utils";
import {
  SAVED_RELEASES_STORAGE_KEY,
  salvarJsonUsuarioEmBreve,
} from "../lib/em-breve-storage-utils";
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
  obrasSalvasNormalizadas,
  obrasReaisEmBreve,
  setUsuarioIdLogado,
  setObrasSalvas,
}: {
  router: EmBrevePushRouter;
  obrasSalvasNormalizadas: string[];
  obrasReaisEmBreve: ObraEmBreveCard[];
  setUsuarioIdLogado: Dispatch<SetStateAction<string>>;
  setObrasSalvas: Dispatch<SetStateAction<string[]>>;
}) {
  const [avisoAcesso, setAvisoAcesso] = useState("");
  const [obraProcessandoId, setObraProcessandoId] = useState("");

  async function salvarLancamento(obra: ObraEmBreveCard) {
    const identificadoresObra = obterIdentificadoresObraEmBreve(obra);

    if (identificadoresObra.length === 0 || obraProcessandoId) {
      return;
    }

    setAvisoAcesso("");
    setObraProcessandoId(obra.id);

    try {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        setAvisoAcesso("Entre na sua conta para ativar aviso de lançamento.");
        router.push(criarLoginHrefEmBreve());
        return;
      }

      const avisoAtivo = listaTemObraEmBreve(obra, obrasSalvasNormalizadas);
      const deveAtivar = !avisoAtivo;
      const sincronizou = await sincronizarAvisoLancamentoSupabaseEmBreve(
        data.user.id,
        obra.id,
        deveAtivar
      );

      if (!sincronizou) {
        setAvisoAcesso(
          "Não consegui salvar o aviso agora. Tente novamente em instantes."
        );
        return;
      }

      const novasObrasSalvas = deveAtivar
        ? adicionarObraNaListaEmBreve(obra, obrasSalvasNormalizadas)
        : removerObraDaListaEmBreve(obra, obrasSalvasNormalizadas);
      const obrasNormalizadas = normalizarLancamentosSalvosComObrasEmBreve(
        novasObrasSalvas,
        obrasReaisEmBreve
      );

      setUsuarioIdLogado(data.user.id);
      salvarJsonUsuarioEmBreve(
        SAVED_RELEASES_STORAGE_KEY,
        data.user.id,
        obrasNormalizadas
      );
      setObrasSalvas(obrasNormalizadas);
    } catch {
      setAvisoAcesso("Não consegui confirmar sua conta agora. Tente novamente.");
    } finally {
      setObraProcessandoId("");
    }
  }

  return {
    avisoAcesso,
    obraProcessandoId,
    salvarLancamento,
  };
}
