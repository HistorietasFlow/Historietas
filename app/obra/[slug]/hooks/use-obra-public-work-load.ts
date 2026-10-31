import { useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import {
  execucaoIdentidadeObraEstaAtual,
  type IdentidadeAutenticadaObra,
} from "../lib/obra-auth-identity";
import type { ObraLocal } from "../lib/obra-data-utils";
import { carregarObrasLocaisComBackup } from "../lib/obra-local-works-utils";
import { carregarObraSupabasePorSlug } from "../lib/obra-public-work-loader";

type UseObraPublicWorkLoadParams = {
  autenticacaoCarregada: boolean;
  slug: string;
  usuarioIdLogado: string;
  identidadeAutenticadaObraRef: {
    current: IdentidadeAutenticadaObra;
  };
  setObrasLocais: Dispatch<SetStateAction<ObraLocal[]>>;
  setCarregandoObras: Dispatch<SetStateAction<boolean>>;
  setErroCarregamentoObra: Dispatch<SetStateAction<boolean>>;
};

export function useObraPublicWorkLoad({
  autenticacaoCarregada,
  slug,
  usuarioIdLogado,
  identidadeAutenticadaObraRef,
  setObrasLocais,
  setCarregandoObras,
  setErroCarregamentoObra,
}: UseObraPublicWorkLoadParams) {
  useEffect(() => {
    if (!autenticacaoCarregada) {
      return;
    }

    let cancelado = false;
    const identidadeEsperada = identidadeAutenticadaObraRef.current;

    if (identidadeEsperada.usuarioId !== usuarioIdLogado.trim()) {
      return;
    }

    function execucaoCarregamentoEstaAtual() {
      return execucaoIdentidadeObraEstaAtual({
        cancelada: cancelado,
        identidadeEsperada,
        identidadeAtual: identidadeAutenticadaObraRef.current,
      });
    }

    async function carregarObraPublica() {
      window.setTimeout(() => {
        if (execucaoCarregamentoEstaAtual()) {
          setCarregandoObras(true);
          setErroCarregamentoObra(false);
        }
      }, 0);

      try {
        const obrasNormalizadas = carregarObrasLocaisComBackup(
          identidadeEsperada.usuarioId,
        );

        if (!execucaoCarregamentoEstaAtual()) {
          return;
        }

        window.setTimeout(() => {
          if (execucaoCarregamentoEstaAtual()) {
            setObrasLocais(obrasNormalizadas);
          }
        }, 0);

        const resultadoSupabase = await carregarObraSupabasePorSlug(
          slug,
          obrasNormalizadas,
          identidadeEsperada.usuarioId,
          execucaoCarregamentoEstaAtual,
        );

        if (!execucaoCarregamentoEstaAtual()) {
          return;
        }

        window.setTimeout(() => {
          if (execucaoCarregamentoEstaAtual()) {
            setObrasLocais(resultadoSupabase.obras);
            setErroCarregamentoObra(resultadoSupabase.status === "erro");
          }
        }, 0);
      } catch {
        if (!execucaoCarregamentoEstaAtual()) {
          return;
        }

        window.setTimeout(() => {
          if (execucaoCarregamentoEstaAtual()) {
            setErroCarregamentoObra(true);
          }
        }, 0);
      } finally {
        if (!execucaoCarregamentoEstaAtual()) {
          return;
        }

        window.setTimeout(() => {
          if (execucaoCarregamentoEstaAtual()) {
            setCarregandoObras(false);
          }
        }, 0);
      }
    }

    void carregarObraPublica();

    return () => {
      cancelado = true;
    };
  }, [
    autenticacaoCarregada,
    slug,
    usuarioIdLogado,
    identidadeAutenticadaObraRef,
    setObrasLocais,
    setCarregandoObras,
    setErroCarregamentoObra,
  ]);
}
