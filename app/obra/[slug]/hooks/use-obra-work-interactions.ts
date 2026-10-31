import type { Dispatch, SetStateAction } from "react";
import { idObraSupabaseValido } from "../../../../lib/utils";
import type { IdentidadeAutenticadaObra } from "../lib/obra-auth-identity";
import type { ObraDinamica } from "../lib/obra-data-utils";
import {
  registrarAtividadeDiarioObra,
  removerAtividadeDiarioObra,
} from "../lib/obra-supabase-diary-activity-persistence";
import {
  inserirSeguimentoObraPublicaSupabase,
  removerSeguimentoObraPublicaSupabase,
  salvarCurtidaObraPublicaSupabase,
  salvarRegistroObraPublicaSupabase,
} from "../lib/obra-supabase-interaction-persistence";
import {
  lerStorageUsuarioObraPublica,
  salvarStorageUsuarioObraPublica,
} from "../lib/obra-user-storage";
import { salvarListaLocalObraPublica } from "../lib/obra-interaction-utils";
import type { MetricasObraPublica } from "../lib/obra-metric-utils";

type UseObraWorkInteractionsParams = {
  obra: ObraDinamica | null;
  obraNormalizada: string;
  obraSeguida: boolean;
  obraFavoritada: boolean;
  obraConcluida: boolean;
  metricasObra: MetricasObraPublica;
  followedWorksStorageKey: string;
  likedWorksStorageKey: string;
  favoritesStorageKey: string;
  completedStorageKey: string;
  obterIdentidadeLogadaParaAcao: (
    mensagem: string,
  ) => Promise<IdentidadeAutenticadaObra | null>;
  criarGuardIdentidadeAcao: (
    identidadeEsperada: IdentidadeAutenticadaObra,
  ) => () => boolean;
  setObraSeguida: Dispatch<SetStateAction<boolean>>;
  setObraFavoritada: Dispatch<SetStateAction<boolean>>;
  setObraConcluida: Dispatch<SetStateAction<boolean>>;
  setMetricasObra: Dispatch<SetStateAction<MetricasObraPublica>>;
  setMensagemAcao: Dispatch<SetStateAction<string>>;
};

export function useObraWorkInteractions({
  obra,
  obraNormalizada,
  obraSeguida,
  obraFavoritada,
  obraConcluida,
  metricasObra,
  followedWorksStorageKey,
  likedWorksStorageKey,
  favoritesStorageKey,
  completedStorageKey,
  obterIdentidadeLogadaParaAcao,
  criarGuardIdentidadeAcao,
  setObraSeguida,
  setObraFavoritada,
  setObraConcluida,
  setMetricasObra,
  setMensagemAcao,
}: UseObraWorkInteractionsParams) {
  async function alternarSeguirObra() {
    if (!obraNormalizada) {
      return;
    }

    const identidadeAcao = await obterIdentidadeLogadaParaAcao(
      "Entre na sua conta para seguir esta obra."
    );

    if (!identidadeAcao) {
      return;
    }

    const userId = identidadeAcao.usuarioId;
    const execucaoAcaoEstaAtual = criarGuardIdentidadeAcao(identidadeAcao);

    if (!execucaoAcaoEstaAtual()) {
      return;
    }

    const seguindo = !obraSeguida;
    const obraAtual = obra;
    const seguidoresDelta = seguindo ? 1 : -1;

    try {
      const obrasSeguidasTexto = lerStorageUsuarioObraPublica(
        followedWorksStorageKey,
        userId
      );
      const obrasSeguidasJson: unknown = obrasSeguidasTexto
        ? JSON.parse(obrasSeguidasTexto)
        : [];

      const obrasSeguidas = Array.isArray(obrasSeguidasJson)
        ? obrasSeguidasJson.filter(
            (titulo): titulo is string =>
              typeof titulo === "string" && Boolean(titulo.trim())
          )
        : [];

      const chavesObraAtual = Array.from(
        new Set(
          [
            obraNormalizada,
            obraAtual?.id || "",
            obraAtual?.slug || "",
            obraAtual?.link || "",
          ].filter((chave) => Boolean(chave.trim()))
        )
      );

      const novasObrasSeguidas = seguindo
        ? Array.from(new Set([...obrasSeguidas, ...chavesObraAtual]))
        : obrasSeguidas.filter((titulo) => !chavesObraAtual.includes(titulo));

      salvarStorageUsuarioObraPublica(
        followedWorksStorageKey,
        userId,
        novasObrasSeguidas
      );

      setObraSeguida(seguindo);
      setMetricasObra((metricasAtuais) => ({
        ...metricasAtuais,
        seguidores: Math.max(0, metricasAtuais.seguidores + seguidoresDelta),
      }));
      setMensagemAcao("");

      if (
        !obraAtual ||
        obraAtual.origem !== "local" ||
        !obraAtual.id ||
        !idObraSupabaseValido(obraAtual.id)
      ) {
        return;
      }

      const obraId = obraAtual.id;

      if (!execucaoAcaoEstaAtual()) {
        return;
      }

      if (seguindo) {
        const inserirResposta = await inserirSeguimentoObraPublicaSupabase(
          obraId,
          userId,
        );

        if (inserirResposta.error) {
          throw inserirResposta.error;
        }
      } else {
        const removerResposta = await removerSeguimentoObraPublicaSupabase(
          obraId,
          userId,
        );

        if (removerResposta.error) {
          throw removerResposta.error;
        }
      }

      if (!execucaoAcaoEstaAtual()) {
        return;
      }

      if (seguindo) {
        await registrarAtividadeDiarioObra({
          userId,
          obra: obraAtual,
          tipo: "salvou_obra",
          visibilidade: "publico",
          texto: `Adicionou ${obraAtual.titulo} para acompanhar.`,
          execucaoAtual: execucaoAcaoEstaAtual,
        });
      } else {
        await removerAtividadeDiarioObra({
          userId,
          obra: obraAtual,
          tipo: "salvou_obra",
          execucaoAtual: execucaoAcaoEstaAtual,
        });
      }
    } catch (error) {
      console.warn("Não consegui salvar seguimento da obra no Supabase:", error);

      if (!execucaoAcaoEstaAtual()) {
        return;
      }

      setMensagemAcao(
        seguindo
          ? "Obra salva no navegador. Verifique o Supabase/RLS se não sincronizar online."
          : "Obra removida da lista no navegador. Verifique o Supabase/RLS se voltar depois."
      );
    }
  }

  async function alternarCurtidaObra() {
    if (!obraNormalizada) {
      return;
    }

    const identidadeAcao = await obterIdentidadeLogadaParaAcao(
      "Entre na sua conta para curtir esta obra."
    );

    if (!identidadeAcao) {
      return;
    }

    const userId = identidadeAcao.usuarioId;
    const execucaoAcaoEstaAtual = criarGuardIdentidadeAcao(identidadeAcao);

    if (!execucaoAcaoEstaAtual()) {
      return;
    }

    const proximaCurtidaAtiva = !metricasObra.curtidaAtiva;

    setMetricasObra((metricasAtuais) => ({
      ...metricasAtuais,
      curtidaAtiva: proximaCurtidaAtiva,
      curtidas: Math.max(
        0,
        metricasAtuais.curtidas + (proximaCurtidaAtiva ? 1 : -1)
      ),
    }));
    setMensagemAcao("");

    if (!obra || obra.origem !== "local" || !obra.id || !idObraSupabaseValido(obra.id)) {
      try {
        const curtidasTexto = lerStorageUsuarioObraPublica(
          likedWorksStorageKey,
          userId
        );
        const curtidasJson: unknown = curtidasTexto ? JSON.parse(curtidasTexto) : [];
        const obrasCurtidas = Array.isArray(curtidasJson)
          ? curtidasJson.filter(
              (titulo): titulo is string =>
                typeof titulo === "string" && Boolean(titulo.trim())
            )
          : [];

        const novasObrasCurtidas = proximaCurtidaAtiva
          ? Array.from(new Set([...obrasCurtidas, obraNormalizada]))
          : obrasCurtidas.filter((titulo) => titulo !== obraNormalizada);

        salvarStorageUsuarioObraPublica(
          likedWorksStorageKey,
          userId,
          novasObrasCurtidas
        );
      } catch {
        if (!execucaoAcaoEstaAtual()) {
          return;
        }

        setMetricasObra((metricasAtuais) => ({
          ...metricasAtuais,
          curtidaAtiva: !proximaCurtidaAtiva,
          curtidas: Math.max(
            0,
            metricasAtuais.curtidas + (proximaCurtidaAtiva ? -1 : 1)
          ),
        }));
        setMensagemAcao("Não foi possível salvar a curtida agora.");
      }

      return;
    }

    const obraId = obra.id;

    try {
      await salvarCurtidaObraPublicaSupabase(
        userId,
        obraId,
        proximaCurtidaAtiva,
        execucaoAcaoEstaAtual,
      );

      if (execucaoAcaoEstaAtual()) {
        setMensagemAcao("");
      }
    } catch {
      if (!execucaoAcaoEstaAtual()) {
        return;
      }

      setMetricasObra((metricasAtuais) => ({
        ...metricasAtuais,
        curtidaAtiva: !proximaCurtidaAtiva,
        curtidas: Math.max(
          0,
          metricasAtuais.curtidas + (proximaCurtidaAtiva ? -1 : 1)
        ),
      }));
      setMensagemAcao("Não foi possível salvar a curtida agora.");
    }
  }

  async function alternarFavoritoObra() {
    if (!obra) {
      return;
    }

    const identidadeAcao = await obterIdentidadeLogadaParaAcao(
      "Entre na sua conta para salvar esta obra."
    );

    if (!identidadeAcao) {
      return;
    }

    const userId = identidadeAcao.usuarioId;
    const execucaoAcaoEstaAtual = criarGuardIdentidadeAcao(identidadeAcao);

    if (!execucaoAcaoEstaAtual()) {
      return;
    }

    const proximoFavorito = !obraFavoritada;
    const favoritoAnterior = obraFavoritada;

    setObraFavoritada(proximoFavorito);
    salvarListaLocalObraPublica(
      obra,
      favoritesStorageKey,
      proximoFavorito,
      userId
    );
    setMensagemAcao("");

    try {
      if (obra.id && idObraSupabaseValido(obra.id)) {
        await salvarRegistroObraPublicaSupabase(
          "favoritos",
          userId,
          obra.id,
          proximoFavorito
        );
      }

      if (!execucaoAcaoEstaAtual()) {
        return;
      }

      if (proximoFavorito) {
        await registrarAtividadeDiarioObra({
          userId,
          obra,
          tipo: "favoritou_obra",
          visibilidade: "parcial",
          texto: `Adicionou ${obra.titulo} à lista.`,
          execucaoAtual: execucaoAcaoEstaAtual,
        });
      } else {
        await removerAtividadeDiarioObra({
          userId,
          obra,
          tipo: "favoritou_obra",
          execucaoAtual: execucaoAcaoEstaAtual,
        });
      }

      if (!execucaoAcaoEstaAtual()) {
        return;
      }

      setMensagemAcao(
        proximoFavorito ? "" : "Obra removida da lista."
      );
    } catch (error) {
      console.warn("Não consegui salvar favorito da obra:", error);

      if (!execucaoAcaoEstaAtual()) {
        return;
      }

      setObraFavoritada(favoritoAnterior);
      salvarListaLocalObraPublica(
        obra,
        favoritesStorageKey,
        favoritoAnterior,
        userId
      );
      setMensagemAcao("Não foi possível salvar na lista agora.");
    }
  }

  async function alternarConcluirObra() {
    if (!obra) {
      return;
    }

    const identidadeAcao = await obterIdentidadeLogadaParaAcao(
      "Entre na sua conta para marcar esta obra como concluída."
    );

    if (!identidadeAcao) {
      return;
    }

    const userId = identidadeAcao.usuarioId;
    const execucaoAcaoEstaAtual = criarGuardIdentidadeAcao(identidadeAcao);

    if (!execucaoAcaoEstaAtual()) {
      return;
    }

    const proximaConcluida = !obraConcluida;
    const concluidaAnterior = obraConcluida;

    setObraConcluida(proximaConcluida);
    salvarListaLocalObraPublica(
      obra,
      completedStorageKey,
      proximaConcluida,
      userId
    );
    setMensagemAcao("");

    try {
      if (obra.id && idObraSupabaseValido(obra.id)) {
        await salvarRegistroObraPublicaSupabase(
          "concluidas",
          userId,
          obra.id,
          proximaConcluida
        );
      }

      if (!execucaoAcaoEstaAtual()) {
        return;
      }

      if (proximaConcluida) {
        await registrarAtividadeDiarioObra({
          userId,
          obra,
          tipo: "concluiu_obra",
          visibilidade: "parcial",
          texto: `Concluiu ${obra.titulo}.`,
          execucaoAtual: execucaoAcaoEstaAtual,
        });
      } else {
        await removerAtividadeDiarioObra({
          userId,
          obra,
          tipo: "concluiu_obra",
          execucaoAtual: execucaoAcaoEstaAtual,
        });
      }

      if (!execucaoAcaoEstaAtual()) {
        return;
      }

      setMensagemAcao(
        proximaConcluida ? "Obra marcada como concluída." : "Obra removida das concluídas."
      );
    } catch (error) {
      console.warn("Não consegui salvar conclusão da obra:", error);

      if (!execucaoAcaoEstaAtual()) {
        return;
      }

      setObraConcluida(concluidaAnterior);
      salvarListaLocalObraPublica(
        obra,
        completedStorageKey,
        concluidaAnterior,
        userId
      );
      setMensagemAcao("Não foi possível marcar como concluída agora.");
    }
  }

  return {
    alternarSeguirObra,
    alternarCurtidaObra,
    alternarFavoritoObra,
    alternarConcluirObra,
  };
}
