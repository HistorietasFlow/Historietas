import type { Dispatch, SetStateAction } from "react";
import type { CapituloLocal, ObraLocal } from "./ler-capitulo-work-normalization";

type MetricasInteracoes = {
  totalCurtidas: number;
  totalSalvos: number;
  curtiu: boolean;
  salvo: boolean;
  carregado: boolean;
};

type DependenciasAcoesInteracoes<T extends MetricasInteracoes> = {
  obraAtual: ObraLocal | null;
  capituloAtual: CapituloLocal | null;
  usuarioIdLogado: string;
  numeroCapitulo: number;
  metricasCapitulo: T;
  curtidaCapituloSalvandoRef: { current: boolean };
  salvoCapituloSalvandoRef: { current: boolean };
  exigirLogin: (mensagem: string) => Promise<boolean>;
  obterUsuarioLogadoIdAtual: () => Promise<string>;
  atualizarCapitulo: (dados: Partial<CapituloLocal>) => void;
  salvarRegistroCapituloSupabase: (
    tabela: "curtidas_capitulos" | "salvos_capitulos",
    capituloId: string,
    ativo: boolean
  ) => Promise<boolean>;
  recarregarMetricasCapituloAtual: () => Promise<void>;
  carregarPerfilComentarioLeitor: (userId: string) => Promise<{ nome: string }>;
  registrarNotificacaoInteracaoCapituloSupabase: (args: {
    tipo: "curtida-capitulo";
    obra: ObraLocal | null;
    capitulo: CapituloLocal | null;
    titulo: string;
    mensagem: string;
    link: string;
  }) => Promise<boolean>;
  criarHrefLeituraCapituloLeitor: (obra: ObraLocal, capituloId: string) => string;
  registrarAtividadeDiarioLeitor: (args: {
    userId: string;
    tipo: "salvou_obra";
    obra: ObraLocal;
    capituloId?: string;
    visibilidade: "publico";
    texto?: string;
    metadata?: Record<string, unknown>;
  }) => Promise<boolean>;
  setCurtidaCapituloSalvando: Dispatch<SetStateAction<boolean>>;
  setSalvoCapituloSalvando: Dispatch<SetStateAction<boolean>>;
  setMensagemAcao: Dispatch<SetStateAction<string>>;
  setMetricasCapitulo: Dispatch<SetStateAction<T>>;
};

export function criarAcoesInteracoesCapitulo<T extends MetricasInteracoes>({
  obraAtual,
  capituloAtual,
  usuarioIdLogado,
  numeroCapitulo,
  metricasCapitulo,
  curtidaCapituloSalvandoRef,
  salvoCapituloSalvandoRef,
  exigirLogin,
  obterUsuarioLogadoIdAtual,
  atualizarCapitulo,
  salvarRegistroCapituloSupabase,
  recarregarMetricasCapituloAtual,
  carregarPerfilComentarioLeitor,
  registrarNotificacaoInteracaoCapituloSupabase,
  criarHrefLeituraCapituloLeitor,
  registrarAtividadeDiarioLeitor,
  setCurtidaCapituloSalvando,
  setSalvoCapituloSalvando,
  setMensagemAcao,
  setMetricasCapitulo,
}: DependenciasAcoesInteracoes<T>) {
  async function alternarCurtida() {
    if (!capituloAtual || curtidaCapituloSalvandoRef.current) {
      return;
    }

    if (!(await exigirLogin("Entre na sua conta para curtir este capítulo."))) {
      return;
    }

    const userIdAtual = usuarioIdLogado || (await obterUsuarioLogadoIdAtual());

    if (!userIdAtual) {
      return;
    }

    const estadoAnteriorCurtida = metricasCapitulo.curtiu;
    const totalAnteriorCurtidas = metricasCapitulo.totalCurtidas;
    const novoStatusCurtida = !estadoAnteriorCurtida;

    curtidaCapituloSalvandoRef.current = true;
    setCurtidaCapituloSalvando(true);
    setMensagemAcao("");

    atualizarCapitulo({
      curtiu: novoStatusCurtida,
    });
    setMetricasCapitulo((metricasAtuais) => ({
      ...metricasAtuais,
      curtiu: novoStatusCurtida,
      totalCurtidas: Math.max(
        0,
        metricasAtuais.totalCurtidas + (novoStatusCurtida ? 1 : -1)
      ),
      carregado: true,
    }));

    try {
      const curtidaSalva = await salvarRegistroCapituloSupabase(
        "curtidas_capitulos",
        capituloAtual.id,
        novoStatusCurtida
      );

      if (!curtidaSalva) {
        atualizarCapitulo({
          curtiu: estadoAnteriorCurtida,
        });
        setMetricasCapitulo((metricasAtuais) => ({
          ...metricasAtuais,
          curtiu: estadoAnteriorCurtida,
          totalCurtidas: totalAnteriorCurtidas,
          carregado: true,
        }));
        setMensagemAcao("Não foi possível atualizar a curtida agora.");
        return;
      }

      await recarregarMetricasCapituloAtual();
      setMensagemAcao("");

      if (novoStatusCurtida && obraAtual) {
        const perfilAtual = await carregarPerfilComentarioLeitor(userIdAtual);

        void registrarNotificacaoInteracaoCapituloSupabase({
          tipo: "curtida-capitulo",
          obra: obraAtual,
          capitulo: capituloAtual,
          titulo: "Nova curtida no capítulo",
          mensagem: `${perfilAtual.nome || "Um leitor"} curtiu ${capituloAtual.titulo}.`,
          link: criarHrefLeituraCapituloLeitor(obraAtual, capituloAtual.id),
        });
      }
    } finally {
      curtidaCapituloSalvandoRef.current = false;
      setCurtidaCapituloSalvando(false);
    }
  }

  async function alternarSalvo() {
    if (!capituloAtual || salvoCapituloSalvandoRef.current) {
      return;
    }

    if (!(await exigirLogin("Entre na sua conta para salvar este capítulo."))) {
      return;
    }

    const userIdAtual = usuarioIdLogado || (await obterUsuarioLogadoIdAtual());

    if (!userIdAtual) {
      return;
    }

    const estadoAnteriorSalvo = metricasCapitulo.salvo;
    const totalAnteriorSalvos = metricasCapitulo.totalSalvos;
    const novoStatusSalvo = !estadoAnteriorSalvo;

    salvoCapituloSalvandoRef.current = true;
    setSalvoCapituloSalvando(true);
    setMensagemAcao("");

    atualizarCapitulo({
      salvo: novoStatusSalvo,
    });
    setMetricasCapitulo((metricasAtuais) => ({
      ...metricasAtuais,
      salvo: novoStatusSalvo,
      totalSalvos: Math.max(
        0,
        metricasAtuais.totalSalvos + (novoStatusSalvo ? 1 : -1)
      ),
      carregado: true,
    }));

    try {
      const salvoSincronizado = await salvarRegistroCapituloSupabase(
        "salvos_capitulos",
        capituloAtual.id,
        novoStatusSalvo
      );

      if (!salvoSincronizado) {
        atualizarCapitulo({
          salvo: estadoAnteriorSalvo,
        });
        setMetricasCapitulo((metricasAtuais) => ({
          ...metricasAtuais,
          salvo: estadoAnteriorSalvo,
          totalSalvos: totalAnteriorSalvos,
          carregado: true,
        }));
        setMensagemAcao("Não foi possível atualizar o capítulo salvo agora.");
        return;
      }

      await recarregarMetricasCapituloAtual();
      setMensagemAcao("");

      if (novoStatusSalvo && obraAtual) {
        void registrarAtividadeDiarioLeitor({
          userId: userIdAtual,
          tipo: "salvou_obra",
          obra: obraAtual,
          capituloId: capituloAtual.id,
          visibilidade: "publico",
          texto: `Salvou ${capituloAtual.titulo}`,
          metadata: {
            capitulo_titulo: capituloAtual.titulo,
            capitulo_numero: numeroCapitulo,
            origem: "salvar_capitulo",
          },
        });
      }
    } finally {
      salvoCapituloSalvandoRef.current = false;
      setSalvoCapituloSalvando(false);
    }
  }

  return { alternarCurtida, alternarSalvo };
}
