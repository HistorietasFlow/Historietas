import { useEffect, useRef, useState } from "react";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import { idObraSupabaseValido } from "../../../lib/utils";
import {
  execucaoIdentidadeLeitorEstaAtual,
  type IdentidadeAutenticadaLeitor,
} from "../lib/ler-capitulo-auth-identity";
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
  autenticacaoCarregada: boolean;
  usuarioIdLogado: string;
  identidadeAutenticadaLeitorRef: MutableRefObject<IdentidadeAutenticadaLeitor>;
  setObraId: Dispatch<SetStateAction<string>>;
  setCapituloId: Dispatch<SetStateAction<string>>;
  setObras: Dispatch<SetStateAction<ObraLocal[]>>;
  setCarregando: Dispatch<SetStateAction<boolean>>;
  setErroCarregamento: Dispatch<SetStateAction<boolean>>;
  versaoCarregamento: number;
  obraIdInicial?: string;
  capituloIdInicial?: string;
};

export function useLerCapituloInitialLoad({
  autenticacaoCarregada,
  usuarioIdLogado,
  identidadeAutenticadaLeitorRef,
  setObraId,
  setCapituloId,
  setObras,
  setCarregando,
  setErroCarregamento,
  versaoCarregamento,
  obraIdInicial = "",
  capituloIdInicial = "",
}: InicializacaoLeitor) {
  const [identidadeDadosAplicada, setIdentidadeDadosAplicada] =
    useState<IdentidadeAutenticadaLeitor | null>(null);
  const versaoExecucaoCarregamentoRef = useRef(0);

  useEffect(() => {
    if (!autenticacaoCarregada) {
      return;
    }

    let cancelado = false;
    const identidadeEsperada = identidadeAutenticadaLeitorRef.current;

    if (identidadeEsperada.usuarioId !== usuarioIdLogado.trim()) {
      return;
    }

    const versaoExecucao = versaoExecucaoCarregamentoRef.current + 1;
    versaoExecucaoCarregamentoRef.current = versaoExecucao;
    const possuiDadosIniciais = Boolean(obraIdInicial && capituloIdInicial);

    if (!possuiDadosIniciais) {
      setCarregando(true);
    }
    setErroCarregamento(false);
    setIdentidadeDadosAplicada(null);

    function execucaoCarregamentoEstaAtual() {
      return (
        versaoExecucao === versaoExecucaoCarregamentoRef.current &&
        execucaoIdentidadeLeitorEstaAtual({
          cancelada: cancelado,
          identidadeEsperada,
          identidadeAtual: identidadeAutenticadaLeitorRef.current,
        })
      );
    }

    async function carregarDados() {
      const params = new URLSearchParams(window.location.search);
      const obraIdParam = possuiDadosIniciais
        ? obraIdInicial
        : params.get("obraId") || "";
      const capituloIdParam = possuiDadosIniciais
        ? capituloIdInicial
        : params.get("capituloId") || "";

      window.setTimeout(() => {
        if (execucaoCarregamentoEstaAtual()) {
          window.dispatchEvent(new CustomEvent("historietas:history-probe", { detail: { source: "initial-load-timer", obraId: obraIdParam, capituloId: capituloIdParam } }));
          setObraId(obraIdParam);
          setCapituloId(capituloIdParam);
        }
      }, 0);

      let obrasLocaisDisponiveis: ObraLocal[] | null = null;

      try {
        const userId = identidadeEsperada.usuarioId;
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
        obrasLocaisDisponiveis = obrasLocais;
        let obrasAtualizadas = obrasLocais;

        if (obraIdParam) {
          const obraLocal =
            obrasLocais.find((obra) => obra.id === obraIdParam) || null;
          const obraSupabase = await carregarObraSupabase(
            obraIdParam,
            obraLocal,
            userId
          );

          if (!execucaoCarregamentoEstaAtual()) {
            return;
          }

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

        if (userId) {
          const obraParaInteracoes = obrasAtualizadas.find(
            (obra) => obra.id === obraIdParam
          );

          if (obraParaInteracoes) {
            const obraComInteracoes = await aplicarInteracoesCapitulosSupabase(
              obraParaInteracoes,
              userId
            );

            if (!execucaoCarregamentoEstaAtual()) {
              return;
            }

            obrasAtualizadas = [
              obraComInteracoes,
              ...obrasAtualizadas.filter(
                (obra) => obra.id !== obraComInteracoes.id
              ),
            ];
          }
        }

        if (!execucaoCarregamentoEstaAtual()) {
          return;
        }

        salvarObrasPreservandoContas(obrasAtualizadas, userId);

        if (execucaoCarregamentoEstaAtual()) {
          setObras(obrasAtualizadas);
          setIdentidadeDadosAplicada(identidadeEsperada);
        }
      } catch {
        if (execucaoCarregamentoEstaAtual()) {
          const obrasFallback = obrasLocaisDisponiveis;

          if (obrasFallback) {
            setObras((obrasAtuais) =>
              obrasAtuais.length > 0 ? obrasAtuais : obrasFallback,
            );
          }

          setErroCarregamento(true);
        }
      } finally {
        if (execucaoCarregamentoEstaAtual()) {
          setCarregando(false);
        }
      }
    }

    void carregarDados();

    return () => {
      cancelado = true;
    };
  }, [
    autenticacaoCarregada,
    usuarioIdLogado,
    identidadeAutenticadaLeitorRef,
    setObraId,
    setCapituloId,
    setObras,
    setCarregando,
    setErroCarregamento,
    versaoCarregamento,
    obraIdInicial,
    capituloIdInicial,
  ]);

  return { identidadeDadosAplicada };
}
