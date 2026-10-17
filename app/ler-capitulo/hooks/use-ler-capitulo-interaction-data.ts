import { useEffect, useEffectEvent } from "react";
import type { Dispatch, RefObject, SetStateAction } from "react";
import type { ComentarioCapituloPublico } from "../components/ler-capitulo-comments-sheet";
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

    async function carregarComentariosCapitulo() {
      if (!capituloAtual?.id) {
        window.setTimeout(() => {
          if (!cancelado) {
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

      if (!cancelado) {
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
  }, [capituloAtual?.id, usuarioIdLogado]);

  useEffect(() => {
    let cancelado = false;

    async function carregarMetricasCapituloAtual() {
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

      if (cancelado) {
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
  ]);
}
