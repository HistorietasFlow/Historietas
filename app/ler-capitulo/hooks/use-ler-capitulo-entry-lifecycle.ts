import { useEffect } from "react";
import type { Dispatch, RefObject, SetStateAction } from "react";
import { idObraSupabaseValido } from "../../../lib/utils";
import type { MetricasCapituloLeitor } from "./use-ler-capitulo-interaction-data";
import type { CapituloLocal, ObraLocal } from "../lib/ler-capitulo-work-normalization";

type RegistroVisualizacao = {
  capituloAtual: CapituloLocal | null;
  statusAcesso18: "verificando" | "permitido" | "bloqueado";
  visualizacaoCapituloRegistradaRef: RefObject<string>;
  setMetricasCapitulo: Dispatch<SetStateAction<MetricasCapituloLeitor>>;
  incrementarVisualizacaoCapituloSupabase: (capituloId: string) => Promise<number | null>;
};

export function useLerCapituloViewRegistration({
  capituloAtual,
  statusAcesso18,
  visualizacaoCapituloRegistradaRef,
  setMetricasCapitulo,
  incrementarVisualizacaoCapituloSupabase,
}: RegistroVisualizacao) {
  useEffect(() => {
    if (
      statusAcesso18 !== "permitido" ||
      !capituloAtual ||
      !idObraSupabaseValido(capituloAtual.id)
    ) {
      return;
    }

    const capituloIdAtual = capituloAtual.id;

    if (visualizacaoCapituloRegistradaRef.current === capituloIdAtual) {
      return;
    }

    visualizacaoCapituloRegistradaRef.current = capituloIdAtual;

    async function registrarVisualizacaoCapituloAtual() {
      const totalVisualizacoes =
        await incrementarVisualizacaoCapituloSupabase(capituloIdAtual);

      if (totalVisualizacoes === null) {
        return;
      }

      setMetricasCapitulo((metricasAtuais) => ({
        ...metricasAtuais,
        totalVisualizacoes: Math.max(
          metricasAtuais.totalVisualizacoes,
          totalVisualizacoes
        ),
      }));
    }

    void registrarVisualizacaoCapituloAtual();
    // Ref, setter e helper de módulo são estáveis na página; preserva-se a dependência original.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [capituloAtual, statusAcesso18]);
}

type RegistroEntrada = {
  usuarioIdLogado: string;
  obraAtual: ObraLocal | null;
  capituloAtual: CapituloLocal | null;
  numeroCapitulo: number;
  statusAcesso18: "verificando" | "permitido" | "bloqueado";
  atividadeDiarioRegistradaRef: RefObject<string>;
  marcarNotificacaoCapituloComoLidaSupabase: (userId: string, obraId: string, capituloId: string) => Promise<void>;
  registrarAtividadeDiarioLeitor: (dados: {
    userId: string;
    tipo: "comecou_ler";
    obra: ObraLocal;
    capituloId: string;
    visibilidade: "publico";
    texto: string;
    metadata: Record<string, unknown>;
  }) => Promise<boolean>;
};

export function useLerCapituloEntryActivity({
  usuarioIdLogado,
  obraAtual,
  capituloAtual,
  numeroCapitulo,
  statusAcesso18,
  atividadeDiarioRegistradaRef,
  marcarNotificacaoCapituloComoLidaSupabase,
  registrarAtividadeDiarioLeitor,
}: RegistroEntrada) {
  useEffect(() => {
    if (
      statusAcesso18 !== "permitido" ||
      !usuarioIdLogado ||
      !obraAtual ||
      !capituloAtual
    ) {
      return;
    }

    const chaveAtividade = `${usuarioIdLogado}:${obraAtual.id}:${capituloAtual.id}`;

    if (atividadeDiarioRegistradaRef.current === chaveAtividade) {
      return;
    }

    atividadeDiarioRegistradaRef.current = chaveAtividade;

    void marcarNotificacaoCapituloComoLidaSupabase(
      usuarioIdLogado,
      obraAtual.id,
      capituloAtual.id
    );

    const obraJaIniciada =
      obraAtual.progressoLeitura > 0 ||
      Boolean(obraAtual.ultimoCapituloLidoId) ||
      obraAtual.capitulos.some((capitulo) => capitulo.lido);

    if (obraJaIniciada) {
      return;
    }

    void registrarAtividadeDiarioLeitor({
      userId: usuarioIdLogado,
      tipo: "comecou_ler",
      obra: obraAtual,
      capituloId: capituloAtual.id,
      visibilidade: "publico",
      texto: `Começou a ler ${obraAtual.titulo}`,
      metadata: {
        capitulo_titulo: capituloAtual.titulo,
        capitulo_numero: numeroCapitulo,
        progresso_obra: obraAtual.progressoLeitura,
        origem: "abertura_capitulo",
      },
    });
    // Ref e helpers de módulo são estáveis na página; preservam-se as dependências originais.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuarioIdLogado, obraAtual, capituloAtual, numeroCapitulo, statusAcesso18]);
}
