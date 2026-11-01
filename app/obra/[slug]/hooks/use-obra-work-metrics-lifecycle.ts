import { useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import { carregarMetricasConteudos } from "../../../../lib/metricas";
import { idObraSupabaseValido } from "../../../../lib/utils";
import type { ObraDinamica } from "../lib/obra-data-utils";
import { salvarListaLocalObraPublica } from "../lib/obra-interaction-utils";
import {
  criarMetricasBaseObra,
  metricasComunidadeObraVazias,
  metricasObraVazias,
  type MetricasComunidadeObra,
  type MetricasObraPublica,
} from "../lib/obra-metric-utils";
import {
  carregarListaLocalObraPublica,
  lerStorageUsuarioObraPublica,
  salvarStorageUsuarioObraPublica,
} from "../lib/obra-user-storage";

type UseObraWorkMetricsLifecycleParams = {
  obra: ObraDinamica | null;
  obraNormalizada: string;
  usuarioIdLogado: string;
  followedWorksStorageKey: string;
  likedWorksStorageKey: string;
  favoritesStorageKey: string;
  completedStorageKey: string;
  setObraSeguida: Dispatch<SetStateAction<boolean>>;
  setObraFavoritada: Dispatch<SetStateAction<boolean>>;
  setObraConcluida: Dispatch<SetStateAction<boolean>>;
  setMetricasObra: Dispatch<SetStateAction<MetricasObraPublica>>;
  setMetricasComunidadeObra: Dispatch<
    SetStateAction<MetricasComunidadeObra>
  >;
  setTotalComentariosObra: Dispatch<SetStateAction<number>>;
};

export function useObraWorkMetricsLifecycle({
  obra,
  obraNormalizada,
  usuarioIdLogado,
  followedWorksStorageKey,
  likedWorksStorageKey,
  favoritesStorageKey,
  completedStorageKey,
  setObraSeguida,
  setObraFavoritada,
  setObraConcluida,
  setMetricasObra,
  setMetricasComunidadeObra,
  setTotalComentariosObra,
}: UseObraWorkMetricsLifecycleParams) {
  useEffect(() => {
    if (!obra) {
      const resetMetricasTimer = window.setTimeout(() => {
        setMetricasObra(metricasObraVazias);
        setTotalComentariosObra(0);
      }, 0);

      return () => {
        window.clearTimeout(resetMetricasTimer);
      };
    }

    const obraAtual = obra;
    const obraId = obraAtual.id;
    const metricasBase = criarMetricasBaseObra(obraAtual);
    let curtidaLocalAtiva = false;
    let seguindoLocalAtivo = false;
    try {
      const curtidasTexto = lerStorageUsuarioObraPublica(
        likedWorksStorageKey,
        usuarioIdLogado,
      );
      const curtidasJson: unknown = curtidasTexto
        ? JSON.parse(curtidasTexto)
        : [];
      const obrasCurtidas = Array.isArray(curtidasJson)
        ? curtidasJson.filter(
            (titulo): titulo is string =>
              typeof titulo === "string" && Boolean(titulo.trim()),
          )
        : [];

      curtidaLocalAtiva = obrasCurtidas.includes(obraNormalizada);
    } catch {
      curtidaLocalAtiva = false;
    }

    try {
      const seguidasTexto = lerStorageUsuarioObraPublica(
        followedWorksStorageKey,
        usuarioIdLogado,
      );
      const seguidasJson: unknown = seguidasTexto
        ? JSON.parse(seguidasTexto)
        : [];
      const obrasSeguidas = Array.isArray(seguidasJson)
        ? seguidasJson.filter(
            (titulo): titulo is string =>
              typeof titulo === "string" && Boolean(titulo.trim()),
          )
        : [];

      seguindoLocalAtivo = obrasSeguidas.includes(obraNormalizada);
    } catch {
      seguindoLocalAtivo = false;
    }

    const aplicarMetricasLocaisTimer = window.setTimeout(() => {
      setObraSeguida(seguindoLocalAtivo);
      setMetricasComunidadeObra({
        ...metricasComunidadeObraVazias,
        carregado: true,
      });
      setMetricasObra({
        ...metricasBase,
        curtidaAtiva: curtidaLocalAtiva,
        curtidas: Math.max(
          metricasBase.curtidas,
          curtidaLocalAtiva ? 1 : 0,
        ),
        seguidores: Math.max(
          metricasBase.seguidores,
          seguindoLocalAtivo ? 1 : 0,
        ),
        carregado: true,
      });
      setTotalComentariosObra(metricasBase.comentarios);
    }, 0);

    if (
      obraAtual.origem !== "local" ||
      !obraId ||
      !idObraSupabaseValido(obraId)
    ) {
      return () => {
        window.clearTimeout(aplicarMetricasLocaisTimer);
      };
    }

    let cancelado = false;

    async function carregarMetricasReaisObra() {
      try {
        const contrato = await carregarMetricasConteudos({
          obraIds: [obraId],
        });
        const metrica = contrato.obras.get(obraId);

        if (!contrato.carregado || !metrica) {
          throw new Error("Métricas da obra indisponíveis.");
        }

        const curtidaAtiva = metrica.usuario.curtiu;
        const seguindoAtivo = metrica.usuario.seguiu;
        const favoritadaAtiva = metrica.usuario.favoritou;
        const concluidaAtiva = metrica.usuario.concluiu;

        if (cancelado) {
          return;
        }

        if (usuarioIdLogado) {
          const obrasCurtidas = carregarListaLocalObraPublica(
            likedWorksStorageKey,
            usuarioIdLogado,
          );
          const novasObrasCurtidas = curtidaAtiva
            ? Array.from(new Set([...obrasCurtidas, obraNormalizada]))
            : obrasCurtidas.filter((titulo) => titulo !== obraNormalizada);

          salvarStorageUsuarioObraPublica(
            likedWorksStorageKey,
            usuarioIdLogado,
            novasObrasCurtidas,
          );

          const obrasSeguidas = carregarListaLocalObraPublica(
            followedWorksStorageKey,
            usuarioIdLogado,
          );
          const chavesObraAtual = Array.from(
            new Set(
              [
                obraNormalizada,
                obraAtual.id || "",
                obraAtual.slug || "",
                obraAtual.link || "",
              ].filter((chave) => Boolean(chave.trim())),
            ),
          );
          const novasObrasSeguidas = seguindoAtivo
            ? Array.from(new Set([...obrasSeguidas, ...chavesObraAtual]))
            : obrasSeguidas.filter(
                (chave) => !chavesObraAtual.includes(chave),
              );

          salvarStorageUsuarioObraPublica(
            followedWorksStorageKey,
            usuarioIdLogado,
            novasObrasSeguidas,
          );
          salvarListaLocalObraPublica(
            obraAtual,
            favoritesStorageKey,
            favoritadaAtiva,
            usuarioIdLogado,
          );
          salvarListaLocalObraPublica(
            obraAtual,
            completedStorageKey,
            concluidaAtiva,
            usuarioIdLogado,
          );
        }

        setObraSeguida(seguindoAtivo);
        setObraFavoritada(favoritadaAtiva);
        setObraConcluida(concluidaAtiva);
        setMetricasObra({
          visualizacoes: metrica.visualizacoes,
          curtidas: metrica.interacoesDiretas.curtidas,
          comentarios: metrica.interacoesDiretas.comentarios,
          seguidores: metrica.interacoesDiretas.seguidores,
          curtidaAtiva,
          carregado: true,
        });
        setTotalComentariosObra(metrica.interacoesDiretas.comentarios);
        setMetricasComunidadeObra({
          teorias: metrica.comunidade.teorias,
          reviews: metrica.comunidade.reviews,
          posts: metrica.comunidade.posts,
          carregado: true,
        });
      } catch {
        if (!cancelado) {
          setMetricasObra((metricasAtuais) => ({
            ...metricasAtuais,
            carregado: true,
          }));
        }
      }
    }

    void carregarMetricasReaisObra();

    return () => {
      cancelado = true;
      window.clearTimeout(aplicarMetricasLocaisTimer);
    };
  }, [
    obra,
    obraNormalizada,
    usuarioIdLogado,
    followedWorksStorageKey,
    likedWorksStorageKey,
    favoritesStorageKey,
    completedStorageKey,
    setObraSeguida,
    setObraFavoritada,
    setObraConcluida,
    setMetricasObra,
    setMetricasComunidadeObra,
    setTotalComentariosObra,
  ]);
}
