import { useCallback, useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { supabase } from "../../../lib/supabase/client";
import {
  atualizarIdentidadeAutenticadaLeitor,
  execucaoAutenticacaoLeitorEstaAtual,
  type IdentidadeAutenticadaLeitor,
} from "../lib/ler-capitulo-auth-identity";

type UseLerCapituloAuthIdentityLifecycleParams = {
  onIdentidadeMudou: () => void;
  setUsuarioIdLogado: Dispatch<SetStateAction<string>>;
};

export function useLerCapituloAuthIdentityLifecycle({
  onIdentidadeMudou,
  setUsuarioIdLogado,
}: UseLerCapituloAuthIdentityLifecycleParams) {
  const [autenticacaoCarregada, setAutenticacaoCarregada] = useState(false);
  const [erroAutenticacao, setErroAutenticacao] = useState(false);
  const [versaoTentativaAutenticacao, setVersaoTentativaAutenticacao] =
    useState(0);
  const identidadeAutenticadaLeitorRef =
    useRef<IdentidadeAutenticadaLeitor>({
      usuarioId: "",
      versao: 0,
    });
  const versaoConsultaAutenticacaoLeitorRef = useRef(0);

  useEffect(() => {
    let componenteAtivo = true;

    function aplicarIdentidadeAutenticada(usuarioId: string) {
      const resultado = atualizarIdentidadeAutenticadaLeitor(
        identidadeAutenticadaLeitorRef.current,
        usuarioId,
      );

      if (resultado.mudou) {
        identidadeAutenticadaLeitorRef.current = resultado.identidade;
        onIdentidadeMudou();
        setUsuarioIdLogado(resultado.identidade.usuarioId);
      }

      setErroAutenticacao(false);
      setAutenticacaoCarregada(true);
    }

    async function carregarUsuarioLogado() {
      const versaoConsulta = versaoConsultaAutenticacaoLeitorRef.current + 1;
      versaoConsultaAutenticacaoLeitorRef.current = versaoConsulta;

      try {
        const { data, error } = await supabase.auth.getUser();

        if (error) {
          throw error;
        }

        if (
          execucaoAutenticacaoLeitorEstaAtual({
            cancelada: !componenteAtivo,
            versaoEsperada: versaoConsulta,
            versaoAtual: versaoConsultaAutenticacaoLeitorRef.current,
          })
        ) {
          aplicarIdentidadeAutenticada(data.user?.id || "");
        }
      } catch {
        if (
          execucaoAutenticacaoLeitorEstaAtual({
            cancelada: !componenteAtivo,
            versaoEsperada: versaoConsulta,
            versaoAtual: versaoConsultaAutenticacaoLeitorRef.current,
          })
        ) {
          setAutenticacaoCarregada(false);
          setErroAutenticacao(true);
        }
      }
    }

    void carregarUsuarioLogado();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (componenteAtivo) {
        versaoConsultaAutenticacaoLeitorRef.current += 1;
        aplicarIdentidadeAutenticada(session?.user?.id || "");
      }
    });

    return () => {
      componenteAtivo = false;
      versaoConsultaAutenticacaoLeitorRef.current += 1;
      subscription.unsubscribe();
    };
  }, [
    onIdentidadeMudou,
    setUsuarioIdLogado,
    versaoTentativaAutenticacao,
  ]);

  const tentarCarregarAutenticacaoNovamente = useCallback(() => {
    setErroAutenticacao(false);
    setAutenticacaoCarregada(false);
    setVersaoTentativaAutenticacao((versaoAtual) => versaoAtual + 1);
  }, []);

  return {
    autenticacaoCarregada,
    erroAutenticacao,
    identidadeAutenticadaLeitorRef,
    tentarCarregarAutenticacaoNovamente,
  };
}
