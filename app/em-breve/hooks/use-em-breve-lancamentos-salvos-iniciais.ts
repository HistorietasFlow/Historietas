"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    let componenteAtivo = true;

    async function carregarLancamentosSalvos() {
      const parametros = new URLSearchParams(window.location.search);
      const obraIdParam = pegarParametro(parametros.get("obraId"));
      const nomeObraParam = pegarParametro(parametros.get("obra"));

      window.setTimeout(() => {
        if (componenteAtivo) {
          setObraIdConsultada(obraIdParam);
          setNomeObra(nomeObraParam);
        }
      }, 0);

      if (obraIdParam || nomeObraParam) {
        const linkObraComConteudo = await encontrarLinkObraComConteudoEmBreve(
          obraIdParam,
          nomeObraParam
        );

        if (componenteAtivo && linkObraComConteudo) {
          router.replace(linkObraComConteudo);
          return;
        }
      }

      try {
        const { data } = await supabase.auth.getUser();

        if (!data.user) {
          window.setTimeout(() => {
            if (componenteAtivo) {
              setUsuarioIdLogado("");
              setObrasSalvas([]);
            }
          }, 0);

          return;
        }

        window.setTimeout(() => {
          if (componenteAtivo) {
            setUsuarioIdLogado(data.user.id);
          }
        }, 0);

        const salvasJson: unknown =
          carregarJsonUsuarioEmBreve(SAVED_RELEASES_STORAGE_KEY, data.user.id) ||
          [];
        const salvasLocaisNormalizadas = normalizarListaIdsEmBreve(salvasJson);
        const salvasSupabase = await carregarLancamentosSalvosSupabaseEmBreve(
          data.user.id
        );
        const salvasNormalizadas = normalizarListaIdsEmBreve([
          ...salvasLocaisNormalizadas,
          ...salvasSupabase,
        ]);

        salvarJsonUsuarioEmBreve(
          SAVED_RELEASES_STORAGE_KEY,
          data.user.id,
          salvasNormalizadas
        );

        window.setTimeout(() => {
          if (componenteAtivo) {
            setObrasSalvas(salvasNormalizadas);
          }
        }, 0);
      } catch {
        window.setTimeout(() => {
          if (componenteAtivo) {
            setUsuarioIdLogado("");
            setObrasSalvas([]);
          }
        }, 0);
      }
    }

    void carregarLancamentosSalvos();

    return () => {
      componenteAtivo = false;
    };
  }, [router]);

  return {
    nomeObra,
    obraIdConsultada,
    obrasSalvas,
    setObrasSalvas,
    usuarioIdLogado,
    setUsuarioIdLogado,
  };
}
