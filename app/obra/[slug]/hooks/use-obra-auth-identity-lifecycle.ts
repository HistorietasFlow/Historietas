import { useEffect, useRef, useState } from "react";
import { supabase } from "../../../../lib/supabase/client";
import {
  atualizarIdentidadeAutenticadaObra,
  execucaoAutenticacaoObraEstaAtual,
  type IdentidadeAutenticadaObra,
} from "../lib/obra-auth-identity";

type UseObraAuthIdentityLifecycleParams = {
  onIdentidadeMudou: () => void;
};

export function useObraAuthIdentityLifecycle({
  onIdentidadeMudou,
}: UseObraAuthIdentityLifecycleParams) {
  const [erroAutenticacao, setErroAutenticacao] = useState(false);
  const [retry, setRetry] = useState(0);
  const [usuarioIdLogado, setUsuarioIdLogado] = useState("");
  const [autenticacaoCarregada, setAutenticacaoCarregada] = useState(false);
  const [versaoIdentidade, setVersaoIdentidade] = useState(0);
  const identidadeAutenticadaObraRef =
    useRef<IdentidadeAutenticadaObra>({
      usuarioId: "",
      versao: 0,
    });
  const versaoConsultaAutenticacaoObraRef = useRef(0);

  useEffect(() => {
    let componenteAtivo = true;

    function aplicarIdentidadeAutenticada(usuarioId: string) {
      const resultado = atualizarIdentidadeAutenticadaObra(
        identidadeAutenticadaObraRef.current,
        usuarioId,
      );

      if (resultado.mudou) {
        identidadeAutenticadaObraRef.current = resultado.identidade;
        setVersaoIdentidade(resultado.identidade.versao);
        onIdentidadeMudou();
        setUsuarioIdLogado(resultado.identidade.usuarioId);
      }

      setErroAutenticacao(false);
      setAutenticacaoCarregada(true);
    }

    async function carregarUsuarioLogado() {
      const versaoConsulta = versaoConsultaAutenticacaoObraRef.current + 1;
      versaoConsultaAutenticacaoObraRef.current = versaoConsulta;

      try {
        const { data, error } = await supabase.auth.getUser();
        if (error && error.name !== "AuthSessionMissingError") throw error;
        const userId = data.user?.id || "";

        if (
          execucaoAutenticacaoObraEstaAtual({
            cancelada: !componenteAtivo,
            versaoEsperada: versaoConsulta,
            versaoAtual: versaoConsultaAutenticacaoObraRef.current,
          })
        ) {
          aplicarIdentidadeAutenticada(userId);
        }
      } catch {
        if (
          execucaoAutenticacaoObraEstaAtual({
            cancelada: !componenteAtivo,
            versaoEsperada: versaoConsulta,
            versaoAtual: versaoConsultaAutenticacaoObraRef.current,
          })
        ) {
          aplicarIdentidadeAutenticada("");
          setAutenticacaoCarregada(false);
          setErroAutenticacao(true);
        }
      }
    }

    void carregarUsuarioLogado();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (componenteAtivo && _event !== "INITIAL_SESSION") {
        versaoConsultaAutenticacaoObraRef.current += 1;
        aplicarIdentidadeAutenticada(session?.user?.id || "");
      }
    });

    return () => {
      componenteAtivo = false;
      versaoConsultaAutenticacaoObraRef.current += 1;
      subscription.unsubscribe();
    };
  }, [onIdentidadeMudou, retry]);

  return {
    erroAutenticacao,
    tentarAutenticacaoNovamente: () => setRetry(valor => valor + 1),
    usuarioIdLogado,
    autenticacaoCarregada,
    versaoIdentidade,
    identidadeAutenticadaObraRef,
  };
}
