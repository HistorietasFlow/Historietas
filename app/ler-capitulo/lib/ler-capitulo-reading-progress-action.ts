import type { Dispatch, SetStateAction } from "react";
import type { CapituloLocal, ObraLocal } from "./ler-capitulo-work-normalization";

type DependenciasAcaoProgresso = {
  obraAtual: ObraLocal | null;
  capituloAtual: CapituloLocal | null;
  obras: ObraLocal[];
  usuarioIdLogado: string;
  numeroCapitulo: number;
  lidoCapituloSalvandoRef: { current: boolean };
  exigirLogin: (mensagem: string) => Promise<boolean>;
  obterUsuarioLogadoIdAtual: () => Promise<string>;
  normalizarObra: (obra: Partial<ObraLocal>, index: number) => ObraLocal;
  calcularProgressoLeitura: (capitulos: CapituloLocal[]) => number;
  salvarObras: (obras: ObraLocal[]) => void;
  salvarProgressoLeituraSupabase: (
    obra: ObraLocal,
    capituloId: string,
    lido: boolean
  ) => Promise<boolean>;
  marcarNotificacaoCapituloComoLidaSupabase: (
    userId: string,
    obraId: string,
    capituloId: string
  ) => Promise<void>;
  registrarAtividadeDiarioLeitor: (args: {
    userId: string;
    tipo: "leu_capitulo";
    obra: ObraLocal;
    capituloId?: string;
    visibilidade: "publico";
    texto?: string;
    metadata?: Record<string, unknown>;
  }) => Promise<boolean>;
  setLidoCapituloSalvando: Dispatch<SetStateAction<boolean>>;
  setMensagemAcao: Dispatch<SetStateAction<string>>;
};

export function criarAcaoProgressoLeituraCapitulo({
  obraAtual,
  capituloAtual,
  obras,
  usuarioIdLogado,
  numeroCapitulo,
  lidoCapituloSalvandoRef,
  exigirLogin,
  obterUsuarioLogadoIdAtual,
  normalizarObra,
  calcularProgressoLeitura,
  salvarObras,
  salvarProgressoLeituraSupabase,
  marcarNotificacaoCapituloComoLidaSupabase,
  registrarAtividadeDiarioLeitor,
  setLidoCapituloSalvando,
  setMensagemAcao,
}: DependenciasAcaoProgresso) {
  async function alternarLido() {
    if (
      !obraAtual ||
      !capituloAtual ||
      lidoCapituloSalvandoRef.current
    ) {
      return;
    }

    if (!(await exigirLogin("Entre na sua conta para marcar este capítulo como lido."))) {
      return;
    }

    const userIdAtual = usuarioIdLogado || (await obterUsuarioLogadoIdAtual());

    if (!userIdAtual) {
      return;
    }

    const obrasAnteriores = obras;
    const novoStatusLido = !capituloAtual.lido;
    const novaDataLeitura = novoStatusLido ? new Date().toISOString() : "";
    let obraAtualizadaParaSupabase: ObraLocal | null = null;

    lidoCapituloSalvandoRef.current = true;
    setLidoCapituloSalvando(true);
    setMensagemAcao("");

    const novasObras = obras.map((obra, obraIndex) => {
      const obraNormalizada = normalizarObra(obra, obraIndex);

      if (obraNormalizada.id !== obraAtual.id) {
        return obraNormalizada;
      }

      const capitulosAtualizados = obraNormalizada.capitulos.map((capitulo) =>
        capitulo.id === capituloAtual.id
          ? {
              ...capitulo,
              lido: novoStatusLido,
              lidoEm: novaDataLeitura,
            }
          : capitulo
      );

      const outroUltimoCapituloLido = [...capitulosAtualizados]
        .reverse()
        .find((capitulo) => capitulo.lido) || null;
      const ultimoCapituloLido = novoStatusLido
        ? capitulosAtualizados.find(
            (capitulo) => capitulo.id === capituloAtual.id
          ) || null
        : outroUltimoCapituloLido;

      obraAtualizadaParaSupabase = {
        ...obraNormalizada,
        capitulos: capitulosAtualizados,
        ultimoCapituloLidoId: ultimoCapituloLido?.id || "",
        ultimaLeituraEm: ultimoCapituloLido?.lidoEm || "",
        progressoLeitura: calcularProgressoLeitura(capitulosAtualizados),
      };

      return obraAtualizadaParaSupabase;
    });

    const obraAtualizada = obraAtualizadaParaSupabase as ObraLocal | null;

    if (!obraAtualizada) {
      lidoCapituloSalvandoRef.current = false;
      setLidoCapituloSalvando(false);
      return;
    }

    salvarObras(novasObras);

    try {
      const progressoSincronizado = await salvarProgressoLeituraSupabase(
        obraAtualizada,
        capituloAtual.id,
        novoStatusLido
      );

      if (!progressoSincronizado) {
        salvarObras(obrasAnteriores);
        setMensagemAcao("Não foi possível atualizar o status de leitura agora.");
        return;
      }

      setMensagemAcao("");

      if (novoStatusLido) {
        void marcarNotificacaoCapituloComoLidaSupabase(
          userIdAtual,
          obraAtual.id,
          capituloAtual.id
        );

        void registrarAtividadeDiarioLeitor({
          userId: userIdAtual,
          tipo: "leu_capitulo",
          obra: obraAtualizada,
          capituloId: capituloAtual.id,
          visibilidade: "publico",
          texto: `Leu ${capituloAtual.titulo}`,
          metadata: {
            capitulo_titulo: capituloAtual.titulo,
            capitulo_numero: numeroCapitulo,
            progresso_obra: obraAtualizada.progressoLeitura,
            origem: "botao_lido",
          },
        });
      }
    } finally {
      lidoCapituloSalvandoRef.current = false;
      setLidoCapituloSalvando(false);
    }
  }

  return { alternarLido };
}
