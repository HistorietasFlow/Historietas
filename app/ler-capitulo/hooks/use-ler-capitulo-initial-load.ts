import { useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import { supabase } from "../../../lib/supabase/client";
import { idObraSupabaseValido } from "../../../lib/utils";
import {
  carregarObrasLocaisNormalizadas,
  obterAutorIdSeguro,
  salvarObrasPreservandoContas,
  usuarioPodeAbrirObraNoLeitor,
} from "../lib/ler-capitulo-local-storage";
import {
  aplicarInteracoesCapitulosSupabase,
  carregarObraSupabase,
} from "../lib/ler-capitulo-work-read-loader";
import type { ObraLocal } from "../lib/ler-capitulo-work-normalization";

type InicializacaoLeitor = {
  setObraId: Dispatch<SetStateAction<string>>;
  setCapituloId: Dispatch<SetStateAction<string>>;
  setObras: Dispatch<SetStateAction<ObraLocal[]>>;
  setCarregando: Dispatch<SetStateAction<boolean>>;
};

export function useLerCapituloInitialLoad({
  setObraId,
  setCapituloId,
  setObras,
  setCarregando,
}: InicializacaoLeitor) {
  useEffect(() => {
    let cancelado = false;

    async function carregarDados() {
      const params = new URLSearchParams(window.location.search);
      const obraIdParam = params.get("obraId") || "";
      const capituloIdParam = params.get("capituloId") || "";

      window.setTimeout(() => {
        if (!cancelado) {
          setObraId(obraIdParam);
          setCapituloId(capituloIdParam);
        }
      }, 0);

      try {
        const { data: dadosUsuario } = await supabase.auth.getUser();
        const userId = dadosUsuario.user?.id || "";
        const obrasLocaisTodas = carregarObrasLocaisNormalizadas(userId);
        const obrasLocais = obrasLocaisTodas
          .filter((obra) => usuarioPodeAbrirObraNoLeitor(obra, userId))
          .map((obra) => {
            const autorId = obterAutorIdSeguro(obra);
            const usuarioEhDono = Boolean(userId && autorId === userId);

            if (usuarioEhDono) {
              return obra;
            }

            return {
              ...obra,
              capitulos: obra.capitulos.filter(
                (capitulo) => capitulo.publicado !== false
              ),
            };
          });
        let obrasAtualizadas = obrasLocais;

        if (obraIdParam) {
          const obraLocal =
            obrasLocais.find((obra) => obra.id === obraIdParam) || null;
          const obraSupabase = await carregarObraSupabase(
            obraIdParam,
            obraLocal,
            userId
          );

          if (obraSupabase && usuarioPodeAbrirObraNoLeitor(obraSupabase, userId)) {
            obrasAtualizadas = [
              obraSupabase,
              ...obrasLocais.filter((obra) => obra.id !== obraSupabase.id),
            ];
          } else if (
            idObraSupabaseValido(obraIdParam) &&
            !Boolean(obraLocal && userId && obterAutorIdSeguro(obraLocal) === userId)
          ) {
            obrasAtualizadas = obrasLocais.filter((obra) => obra.id !== obraIdParam);
          }
        }

        if (dadosUsuario.user) {
          const obraParaInteracoes = obrasAtualizadas.find(
            (obra) => obra.id === obraIdParam
          );

          if (obraParaInteracoes) {
            const obraComInteracoes = await aplicarInteracoesCapitulosSupabase(
              obraParaInteracoes,
              dadosUsuario.user.id
            );

            obrasAtualizadas = [
              obraComInteracoes,
              ...obrasAtualizadas.filter(
                (obra) => obra.id !== obraComInteracoes.id
              ),
            ];
          }
        }

        salvarObrasPreservandoContas(obrasAtualizadas, userId);

        if (!cancelado) {
          setObras(obrasAtualizadas);
        }
      } catch {
        if (!cancelado) {
          setObras([]);
        }
      } finally {
        if (!cancelado) {
          setCarregando(false);
        }
      }
    }

    void carregarDados();

    return () => {
      cancelado = true;
    };
    // Os setters vêm de useState e são estáveis; o carregamento continua ocorrendo apenas na montagem.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
