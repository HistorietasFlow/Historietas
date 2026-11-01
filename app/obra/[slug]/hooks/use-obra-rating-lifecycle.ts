import { useEffect, useRef } from "react";
import type { Dispatch, SetStateAction } from "react";
import { idObraSupabaseValido } from "../../../../lib/utils";
import type { IdentidadeAutenticadaObra } from "../lib/obra-auth-identity";
import type { ObraDinamica } from "../lib/obra-data-utils";
import {
  registrarAtividadeDiarioObra,
  removerAtividadeDiarioObra,
} from "../lib/obra-supabase-diary-activity-persistence";
import {
  avaliacaoObraVazia,
  calcularProximaAvaliacao,
  type AvaliacaoObraPublica,
} from "../lib/obra-rating-utils";
import {
  obterAvaliacaoLocalInicialObra,
  salvarAvaliacaoLocal,
} from "../lib/obra-local-rating-storage-utils";
import { carregarSnapshotRemotoAvaliacaoObra } from "../lib/obra-supabase-rating-loader";
import { salvarAvaliacaoRemotaObra } from "../lib/obra-supabase-rating-persistence";

type UseObraRatingLifecycleParams = {
  obra: ObraDinamica | null;
  obraNormalizada: string;
  usuarioIdLogado: string;
  autorObraId: string;
  avaliacaoObra: AvaliacaoObraPublica;
  obterIdentidadeLogadaParaAcao: (
    mensagem: string,
  ) => Promise<IdentidadeAutenticadaObra | null>;
  criarGuardIdentidadeAcao: (
    identidadeEsperada: IdentidadeAutenticadaObra,
  ) => () => boolean;
  setAvaliacaoObra: Dispatch<SetStateAction<AvaliacaoObraPublica>>;
  setMensagemAcao: Dispatch<SetStateAction<string>>;
};

export function useObraRatingLifecycle({
  obra,
  obraNormalizada,
  usuarioIdLogado,
  autorObraId,
  avaliacaoObra,
  obterIdentidadeLogadaParaAcao,
  criarGuardIdentidadeAcao,
  setAvaliacaoObra,
  setMensagemAcao,
}: UseObraRatingLifecycleParams) {
  const avaliacaoVersaoRef = useRef(0);

  function invalidarAvaliacaoObra() {
    avaliacaoVersaoRef.current += 1;
  }

  useEffect(() => {
    if (!obra) {
      const resetAvaliacaoTimer = window.setTimeout(() => {
        setAvaliacaoObra(avaliacaoObraVazia);
      }, 0);

      return () => {
        window.clearTimeout(resetAvaliacaoTimer);
      };
    }

    const obraAtual = obra;
    const versaoAoIniciar = avaliacaoVersaoRef.current;
    const avaliacaoLocalInicial = obterAvaliacaoLocalInicialObra(
      obraAtual,
      usuarioIdLogado,
    );

    const aplicarAvaliacaoLocalTimer = window.setTimeout(() => {
      if (avaliacaoVersaoRef.current !== versaoAoIniciar) {
        return;
      }

      setAvaliacaoObra({
        media: avaliacaoLocalInicial.nota > 0 ? avaliacaoLocalInicial.nota : 0,
        total: avaliacaoLocalInicial.nota > 0 ? 1 : 0,
        minhaNota: avaliacaoLocalInicial.nota,
        carregado: true,
        salvando: false,
      });
    }, 0);

    if (!obraAtual.id || !idObraSupabaseValido(obraAtual.id)) {
      return () => {
        window.clearTimeout(aplicarAvaliacaoLocalTimer);
      };
    }

    let cancelado = false;

    async function carregarAvaliacaoRealObra() {
      try {
        const snapshotRemoto = await carregarSnapshotRemotoAvaliacaoObra({
          obra: obraAtual,
          usuarioIdLogado,
        });

        if (!snapshotRemoto) {
          return;
        }

        if (
          cancelado ||
          avaliacaoVersaoRef.current !== versaoAoIniciar
        ) {
          return;
        }

        if (
          snapshotRemoto.userId &&
          !snapshotRemoto.usuarioEhAutorDaObraAtual
        ) {
          salvarAvaliacaoLocal(
            obraAtual,
            snapshotRemoto.minhaNotaRemota,
            snapshotRemoto.userId,
          );
        }

        setAvaliacaoObra({
          media: snapshotRemoto.media,
          total: snapshotRemoto.total,
          minhaNota: snapshotRemoto.minhaNota,
          carregado: true,
          salvando: false,
        });
      } catch (error) {
        console.warn("Não consegui carregar a avaliação da obra:", error);

        if (
          !cancelado &&
          avaliacaoVersaoRef.current === versaoAoIniciar
        ) {
          setAvaliacaoObra((avaliacaoAtual) => ({
            ...avaliacaoAtual,
            carregado: true,
            salvando: false,
          }));
        }
      }
    }

    void carregarAvaliacaoRealObra();

    return () => {
      cancelado = true;
      window.clearTimeout(aplicarAvaliacaoLocalTimer);
    };
  }, [
    obra,
    obraNormalizada,
    usuarioIdLogado,
    setAvaliacaoObra,
  ]);

  async function avaliarObra(nota: number) {
    if (!obra || nota < 0 || nota > 5) {
      return;
    }

    const identidadeAcao = await obterIdentidadeLogadaParaAcao(
      "Entre na sua conta para avaliar esta obra."
    );

    if (!identidadeAcao) {
      return;
    }

    const userId = identidadeAcao.usuarioId;
    const execucaoAcaoEstaAtual = criarGuardIdentidadeAcao(identidadeAcao);

    if (!execucaoAcaoEstaAtual()) {
      return;
    }

    if (autorObraId && userId === autorObraId) {
      return;
    }

    if (!execucaoAcaoEstaAtual()) {
      return;
    }

    const notaNormalizada = nota <= 0 ? 0 : Math.round(nota * 2) / 2;
    const avaliacaoAnterior = avaliacaoObra;
    const versaoAvaliacao = avaliacaoVersaoRef.current + 1;
    avaliacaoVersaoRef.current = versaoAvaliacao;
    const execucaoAvaliacaoEstaAtual = () =>
      execucaoAcaoEstaAtual() &&
      avaliacaoVersaoRef.current === versaoAvaliacao;

    if (!execucaoAvaliacaoEstaAtual()) {
      return;
    }

    const proximaAvaliacao = calcularProximaAvaliacao(
      avaliacaoAnterior,
      notaNormalizada
    );

    if (!execucaoAvaliacaoEstaAtual()) {
      return;
    }

    setAvaliacaoObra(proximaAvaliacao);

    if (!execucaoAvaliacaoEstaAtual()) {
      return;
    }

    setMensagemAcao("");

    if (!execucaoAvaliacaoEstaAtual()) {
      return;
    }

    salvarAvaliacaoLocal(obra, notaNormalizada, userId);

    if (!obra.id || !idObraSupabaseValido(obra.id)) {
      if (execucaoAvaliacaoEstaAtual()) {
        setAvaliacaoObra((avaliacaoAtual) => {
          if (!execucaoAvaliacaoEstaAtual()) {
            return avaliacaoAtual;
          }

          return {
            ...avaliacaoAtual,
            salvando: false,
          };
        });
      }
      return;
    }

    try {
      if (!execucaoAvaliacaoEstaAtual()) {
        return;
      }

      await salvarAvaliacaoRemotaObra({
        obraId: obra.id,
        userId,
        nota: notaNormalizada,
      });

      if (!execucaoAvaliacaoEstaAtual()) {
        return;
      }
    } catch (error) {
      if (!execucaoAvaliacaoEstaAtual()) {
        return;
      }

      console.warn("Não consegui salvar a avaliação da obra:", error);

      salvarAvaliacaoLocal(
        obra,
        avaliacaoAnterior.minhaNota,
        userId,
      );
      setAvaliacaoObra({
        ...avaliacaoAnterior,
        carregado: true,
        salvando: false,
      });
      setMensagemAcao("Não foi possível salvar a avaliação agora.");
      return;
    }

    if (!execucaoAvaliacaoEstaAtual()) {
      return;
    }

    setMensagemAcao("");

    try {
      if (!execucaoAvaliacaoEstaAtual()) {
        return;
      }

      if (notaNormalizada > 0) {
        await registrarAtividadeDiarioObra({
          userId,
          obra,
          tipo: "avaliou_obra",
          nota: notaNormalizada,
          visibilidade: "publico",
          texto: `Avaliou ${obra.titulo} com ${notaNormalizada.toFixed(1).replace(".", ",")} estrelas.`,
          execucaoAtual: execucaoAvaliacaoEstaAtual,
        });
      } else {
        await removerAtividadeDiarioObra({
          userId,
          obra,
          tipo: "avaliou_obra",
          execucaoAtual: execucaoAvaliacaoEstaAtual,
        });
      }

      if (!execucaoAvaliacaoEstaAtual()) {
        return;
      }
    } catch (error) {
      if (!execucaoAvaliacaoEstaAtual()) {
        return;
      }

      console.warn(
        "A avaliação foi salva, mas não consegui sincronizar o Diário:",
        error,
      );
    }

    if (!execucaoAvaliacaoEstaAtual()) {
      return;
    }

    setAvaliacaoObra((avaliacaoAtual) => {
      if (!execucaoAvaliacaoEstaAtual()) {
        return avaliacaoAtual;
      }

      return {
        ...avaliacaoAtual,
        salvando: false,
      };
    });
  }

  return {
    avaliarObra,
    invalidarAvaliacaoObra,
  };
}
