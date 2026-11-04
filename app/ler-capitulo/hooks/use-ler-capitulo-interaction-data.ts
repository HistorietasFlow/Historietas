import { useEffect, useEffectEvent } from "react";
import type { Dispatch, RefObject, SetStateAction } from "react";
import type { ComentarioCapituloPublico } from "../components/ler-capitulo-comments-sheet";
import {
  execucaoIdentidadeLeitorEstaAtual,
  type IdentidadeAutenticadaLeitor,
} from "../lib/ler-capitulo-auth-identity";
import { carregarComentariosCapituloSupabase } from "../lib/ler-capitulo-comments-read-loader";
import { aplicarCurtidasComentariosCapitulosLocais } from "../lib/ler-capitulo-local-storage";
import type { CapituloLocal } from "../lib/ler-capitulo-work-normalization";

export type MetricasCapituloLeitor = {
  totalVisualizacoes: number;
  totalCurtidas: number;
  totalSalvos: number;
  totalComentarios: number;
  curtiu: boolean;
  salvo: boolean;
  carregado: boolean;
};

type DadosInteracaoCapitulo = {
  capituloAtual: CapituloLocal | null;
  comentariosCapitulo: ComentarioCapituloPublico[];
  usuarioIdLogado: string;
  identidadeDadosAplicada: IdentidadeAutenticadaLeitor | null;
  identidadeAutenticadaLeitorRef: RefObject<IdentidadeAutenticadaLeitor>;
  comentariosCapituloCarregadoIdRef: RefObject<string>;
  curtidaCapituloSalvandoRef: RefObject<boolean>;
  salvoCapituloSalvandoRef: RefObject<boolean>;
  setComentariosCapitulo: Dispatch<SetStateAction<ComentarioCapituloPublico[]>>;
  setComentariosCarregando: Dispatch<SetStateAction<boolean>>;
  setMetricasCapitulo: Dispatch<SetStateAction<MetricasCapituloLeitor>>;
  metricasCapituloVazias: MetricasCapituloLeitor;
  criarMetricasCapituloLocais: (capitulo: CapituloLocal | null, totalComentarios?: number) => MetricasCapituloLeitor;
  carregarMetricasCapituloSupabase: (capitulo: CapituloLocal, totalComentariosFallback: number) => Promise<MetricasCapituloLeitor>;
  atualizarCapitulo: (dados: Partial<CapituloLocal>) => void;
  TABELA_COMENTARIOS_CAPITULOS_CURTIDAS: "comentarios_capitulos_curtidas";
};

export function useLerCapituloInteractionData({
  capituloAtual,
  comentariosCapitulo,
  usuarioIdLogado,
  identidadeDadosAplicada,
  identidadeAutenticadaLeitorRef,
  comentariosCapituloCarregadoIdRef,
  curtidaCapituloSalvandoRef,
  salvoCapituloSalvandoRef,
  setComentariosCapitulo,
  setComentariosCarregando,
  setMetricasCapitulo,
  metricasCapituloVazias,
  criarMetricasCapituloLocais,
  carregarMetricasCapituloSupabase,
  atualizarCapitulo,
  TABELA_COMENTARIOS_CAPITULOS_CURTIDAS,
}: DadosInteracaoCapitulo) {
  const atualizarCapituloPorMetricas = useEffectEvent(
    (dados: Partial<CapituloLocal>) => atualizarCapitulo(dados),
  );

  useEffect(() => {
    let cancelado = false;
    const identidadeEsperada = identidadeDadosAplicada;

    function execucaoInteracaoEstaAtual() {
      return Boolean(
        identidadeEsperada &&
        execucaoIdentidadeLeitorEstaAtual({
          cancelada: cancelado,
          identidadeEsperada,
          identidadeAtual: identidadeAutenticadaLeitorRef.current,
        }),
      );
    }

    async function carregarComentariosCapitulo() {
      if (!execucaoInteracaoEstaAtual()) {
        comentariosCapituloCarregadoIdRef.current = "";
        setComentariosCapitulo([]);
        setComentariosCarregando(Boolean(capituloAtual?.id));
        return;
      }

      if (!capituloAtual?.id) {
        window.setTimeout(() => {
          if (execucaoInteracaoEstaAtual()) {
            setComentariosCapitulo([]);
            setComentariosCarregando(false);
          }
        }, 0);
        return;
      }

      const deveExibirCarregamentoInicial =
        comentariosCapituloCarregadoIdRef.current !== capituloAtual.id;

      if (deveExibirCarregamentoInicial) {
        setComentariosCarregando(true);
      }

      const comentarios = await carregarComentariosCapituloSupabase(
        capituloAtual.id,
        usuarioIdLogado,
        {
          aplicarCurtidasComentariosCapitulosLocais,
          TABELA_COMENTARIOS_CAPITULOS_CURTIDAS,
        },
      );

      if (execucaoInteracaoEstaAtual()) {
        comentariosCapituloCarregadoIdRef.current = capituloAtual.id;
        setComentariosCapitulo(comentarios);
        setComentariosCarregando(false);
      }
    }

    void carregarComentariosCapitulo();

    return () => {
      cancelado = true;
    };
    // O ref e os setters pertencem à página e são estáveis; preserva-se a dependência original.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    capituloAtual?.id,
    usuarioIdLogado,
    identidadeDadosAplicada,
    identidadeAutenticadaLeitorRef,
  ]);

  useEffect(() => {
    let cancelado = false;
    const identidadeEsperada = identidadeDadosAplicada;

    function execucaoInteracaoEstaAtual() {
      return Boolean(
        identidadeEsperada &&
        execucaoIdentidadeLeitorEstaAtual({
          cancelada: cancelado,
          identidadeEsperada,
          identidadeAtual: identidadeAutenticadaLeitorRef.current,
        }),
      );
    }

    async function carregarMetricasCapituloAtual() {
      if (!execucaoInteracaoEstaAtual()) {
        setMetricasCapitulo((metricasAtuais) => ({
          ...metricasAtuais,
          curtiu: false,
          salvo: false,
          carregado: false,
        }));
        return;
      }

      if (
        curtidaCapituloSalvandoRef.current ||
        salvoCapituloSalvandoRef.current
      ) {
        return;
      }

      if (!capituloAtual) {
        setMetricasCapitulo(metricasCapituloVazias);
        return;
      }

      const metricasLocais = criarMetricasCapituloLocais(
        capituloAtual,
        comentariosCapitulo.length
      );

      setMetricasCapitulo(metricasLocais);

      const metricasReais = await carregarMetricasCapituloSupabase(
        capituloAtual,
        comentariosCapitulo.length
      );

      if (!execucaoInteracaoEstaAtual()) {
        return;
      }

      setMetricasCapitulo((metricasAtuais) => ({
        ...metricasReais,
        totalVisualizacoes: Math.max(
          metricasAtuais.totalVisualizacoes,
          metricasReais.totalVisualizacoes
        ),
      }));

      if (
        metricasReais.curtiu !== capituloAtual.curtiu ||
        metricasReais.salvo !== capituloAtual.salvo
      ) {
        atualizarCapituloPorMetricas({
          curtiu: metricasReais.curtiu,
          salvo: metricasReais.salvo,
        });
      }
    }

    void carregarMetricasCapituloAtual();

    return () => {
      cancelado = true;
    };
    // Helpers de módulo, refs e setters são estáveis; preservam-se as dependências originais.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    capituloAtual,
    comentariosCapitulo.length,
    usuarioIdLogado,
    identidadeDadosAplicada,
    identidadeAutenticadaLeitorRef,
  ]);
}
