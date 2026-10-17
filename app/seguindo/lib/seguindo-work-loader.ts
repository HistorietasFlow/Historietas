import {
  criarResultadoColecoesSeguindo,
  finalizarObrasSeguindo,
} from "./seguindo-work-collection-utils";
import {
  converterObrasSupabaseParaLocais,
  type ObraLocalConversao,
} from "./seguindo-work-converter-utils";
import { prepararMetricasSeguindo } from "./seguindo-work-metrics-utils";
import {
  criarMapaComentariosPorCapitulo,
  criarSetObrasPorRegistro,
  extrairIdsRegistrosSeguindo,
} from "./seguindo-record-utils";
import {
  carregarCapitulosPublicadosSeguindoSupabase,
  carregarDadosRelacionadosObrasSeguindoSupabase,
  carregarObrasPublicadasSeguindoSupabase,
  carregarUsuarioAtualSeguindoSupabase,
} from "./seguindo-work-query-utils";
import { obterUsuarioObrasSeguidasSeguindo } from "./seguindo-route-utils";

export async function carregarSeguindoSupabase(
  obrasLocais: ObraLocalConversao[],
  obrasSeguidasLocais: string[],
  obrasFavoritasLocais: string[],
  obrasConcluidasLocais: string[],
  perfilSocialId = "",
) {
  try {
    const userId = await carregarUsuarioAtualSeguindoSupabase();

    const userIdObrasSeguidas = obterUsuarioObrasSeguidasSeguindo(
      perfilSocialId,
      userId,
    );

    const obrasSupabaseBanco =
      await carregarObrasPublicadasSeguindoSupabase();
    const obraIds = extrairIdsRegistrosSeguindo(obrasSupabaseBanco);

    if (obraIds.length === 0) {
      return criarResultadoColecoesSeguindo({
        obras: obrasLocais,
        obrasSeguidasLocais,
        obrasFavoritasLocais,
        obrasConcluidasLocais,
      });
    }

    const capitulosSupabaseBanco =
      await carregarCapitulosPublicadosSeguindoSupabase(obraIds);
    const capituloIds = extrairIdsRegistrosSeguindo(
      capitulosSupabaseBanco,
    );
    const {
      seguidasBanco,
      comentariosCapitulosBanco,
      metricas,
    } = await carregarDadosRelacionadosObrasSeguindoSupabase({
      userId,
      userIdObrasSeguidas,
      obraIds,
      capituloIds,
    });

    const seguidasSupabase = criarSetObrasPorRegistro(seguidasBanco);
    const comentariosCapitulos = criarMapaComentariosPorCapitulo(
      comentariosCapitulosBanco,
    );
    const {
      favoritasSupabase,
      concluidasSupabase,
      capitulosSalvos,
      capitulosCurtidos,
      progressoPorCapitulo,
      progressoCarregado,
      totaisReais,
    } = prepararMetricasSeguindo(metricas, userId);

    const obrasSupabase = converterObrasSupabaseParaLocais({
      obrasBanco: obrasSupabaseBanco,
      capitulosBanco: capitulosSupabaseBanco,
      obrasLocais,
      capitulosSalvos,
      capitulosCurtidos,
      progressoPorCapitulo,
      progressoCarregado,
      comentariosCapitulos,
      totaisReais,
    });

    return finalizarObrasSeguindo({
      obrasLocais,
      obrasRemotas: obrasSupabase,
      obrasSeguidasLocais,
      obrasFavoritasLocais,
      obrasConcluidasLocais,
      obrasSeguidasRemotas: seguidasSupabase,
      obrasFavoritasRemotas: favoritasSupabase,
      obrasConcluidasRemotas: concluidasSupabase,
    });
  } catch (error) {
    console.warn("Não consegui acessar o Supabase no Seguindo:", error);

    return criarResultadoColecoesSeguindo({
      obras: obrasLocais,
      obrasSeguidasLocais,
      obrasFavoritasLocais,
      obrasConcluidasLocais,
    });
  }
}
