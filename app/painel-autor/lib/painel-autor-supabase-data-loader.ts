import { supabase } from "../../../lib/supabase/client";
import { criarSlugBase } from "../../../lib/utils";
import { carregarMetricasConteudos } from "../../../lib/metricas";
import { carregarComentariosCapitulosUsuarioPainel } from "./painel-autor-chapter-comments-loader";
import { converterObraSupabaseParaLocalPainel } from "./painel-autor-supabase-work-converter";
import {
  aplicarNomeProfileNasObrasPainel,
  obterNomeProfilePainelAutor,
} from "./painel-autor-profile-utils";
import { carregarProfilePainelAutor } from "./painel-autor-profile-loader";
import {
  filtrarObrasDoUsuarioPainel,
  marcarObrasComDonoPainel,
} from "./painel-autor-ownership-utils";
import { filtrarListaPorObrasDoUsuario } from "./painel-autor-collection-utils";
import { carregarObrasPainelAutorSupabase } from "./painel-autor-supabase-works-loader";
import { carregarCapitulosPainelAutorSupabase } from "./painel-autor-supabase-chapters-loader";
import { prepararEstadoMetricasPainel } from "./painel-autor-metrics-state";
import { mesclarResultadoSupabasePainelAutor } from "./painel-autor-supabase-result-merge";
import { normalizarListaIds } from "./painel-autor-storage-utils";
import type { ObraLocal } from "./painel-autor-types";

export async function carregarPainelAutorSupabase(
  obrasLocais: ObraLocal[],
  obrasFavoritasLocais: string[],
  obrasConcluidasLocais: string[]
) {
  try {
    const { data: usuarioData } = await supabase.auth.getUser();
    const userId = usuarioData.user?.id || "";

    if (!userId) {
      return {
        obras: [],
        favoritas: [],
        concluidas: [],
      };
    }

    const profileAutor = await carregarProfilePainelAutor(userId);
    const nomeProfileAutor = obterNomeProfilePainelAutor(profileAutor);
    const obrasLocaisComDono = marcarObrasComDonoPainel(obrasLocais, userId);
    const obrasLocaisUsuario = aplicarNomeProfileNasObrasPainel(
      filtrarObrasDoUsuarioPainel(obrasLocaisComDono, userId),
      userId,
      nomeProfileAutor
    );
    const obrasFavoritasUsuario = filtrarListaPorObrasDoUsuario(
      obrasFavoritasLocais,
      obrasLocaisUsuario
    );
    const obrasConcluidasUsuario = filtrarListaPorObrasDoUsuario(
      obrasConcluidasLocais,
      obrasLocaisUsuario
    );

    const obrasSupabaseBanco = await carregarObrasPainelAutorSupabase(userId);
    const obraIds = obrasSupabaseBanco
      .map((obra) => obra.id)
      .filter((obraId) => Boolean(obraId));

    if (obraIds.length === 0) {
      return {
        obras: obrasLocaisUsuario,
        favoritas: obrasFavoritasUsuario,
        concluidas: obrasConcluidasUsuario,
      };
    }

    const capitulosSupabaseBanco = await carregarCapitulosPainelAutorSupabase(
      userId,
      obraIds
    );

    const capituloIds = capitulosSupabaseBanco
      .map((capitulo) => capitulo.id)
      .filter(Boolean);

    const [metricas, comentariosCapitulos] = await Promise.all([
      carregarMetricasConteudos({
        obraIds,
        capituloIds,
      }),
      carregarComentariosCapitulosUsuarioPainel(userId, capituloIds),
    ]);
    const { favoritosSupabase, concluidasSupabase, capitulosSalvos, capitulosCurtidos, progressoPorCapitulo, progressoCarregado, capitulosComMetricas } = prepararEstadoMetricasPainel(metricas);
    const obrasSupabase = obrasSupabaseBanco.map((obraBanco, index) => {
      const obraLocal = obrasLocaisUsuario.find((obraAtual) => {
        const slugLocal = obraAtual.slug || criarSlugBase(obraAtual.titulo);
        const slugBanco = obraBanco.slug?.trim() || criarSlugBase(obraBanco.titulo || "");

        return obraAtual.id === obraBanco.id || slugLocal === slugBanco;
      });

      const capitulosDaObra = capitulosSupabaseBanco.filter(
        (capitulo) => capitulo.obra_id === obraBanco.id
      );

      const obraNormalizada = converterObraSupabaseParaLocalPainel({
        obraBanco,
        capitulosBanco: capitulosDaObra,
        obraLocal,
        capitulosSalvos,
        capitulosCurtidos,
        progressoPorCapitulo,
        progressoCarregado,
        capitulosComMetricas,
        comentariosCapitulos,
        index,
      });

      const metrica = metricas.obras.get(obraBanco.id);

      return {
        ...obraNormalizada,
        totalCurtidasPainel: metrica?.audiencia.curtidoresUnicos || 0,
        totalComentariosPainel: metrica?.audiencia.comentaristasUnicos || 0,
        totalSalvosPainel: metrica?.audiencia.salvadoresUnicos || 0,
      };
    });

    return mesclarResultadoSupabasePainelAutor({ obrasLocaisUsuario, obrasSupabase, userId, nomeProfileAutor, obrasFavoritasUsuario, obrasConcluidasUsuario, favoritosSupabase, concluidasSupabase });
  } catch (error) {
    console.warn("Não consegui acessar o Supabase no Painel do Autor:", error);

    return {
      obras: obrasLocais,
      favoritas: normalizarListaIds(obrasFavoritasLocais),
      concluidas: normalizarListaIds(obrasConcluidasLocais),
    };
  }
}
