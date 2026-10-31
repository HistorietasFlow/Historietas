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
  const [usuarioIdLogado, setUsuarioIdLogado] = useState("");
  const [autenticacaoCarregada, setAutenticacaoCarregada] = useState(false);
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
        onIdentidadeMudou();
        setUsuarioIdLogado(resultado.identidade.usuarioId);
      }

      setAutenticacaoCarregada(true);
    }

    async function carregarUsuarioLogado() {
      const versaoConsulta = versaoConsultaAutenticacaoObraRef.current + 1;
      versaoConsultaAutenticacaoObraRef.current = versaoConsulta;

      try {
        const { data } = await supabase.auth.getUser();
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
        }
      }
    }

    void carregarUsuarioLogado();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (componenteAtivo) {
        versaoConsultaAutenticacaoObraRef.current += 1;
        aplicarIdentidadeAutenticada(session?.user?.id || "");
      }
    });

    return () => {
      componenteAtivo = false;
      versaoConsultaAutenticacaoObraRef.current += 1;
      subscription.unsubscribe();
    };
  }, [onIdentidadeMudou]);

  return {
    usuarioIdLogado,
    autenticacaoCarregada,
    identidadeAutenticadaObraRef,
  };
}
