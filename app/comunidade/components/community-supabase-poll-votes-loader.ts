import { supabase } from "../../../lib/supabase/client";

type ResultadoVotosEnquete = Record<string, Record<string, number>>;

export async function carregarVotosEnquetesSupabase(
  postIds: string[],
  usuarioId: string
) {
  const postIdsUnicos = Array.from(
    new Set(postIds.map((postId) => postId.trim()).filter(Boolean))
  );
  const usuarioIdLimpo = usuarioId.trim();

  if (postIdsUnicos.length === 0 || !usuarioIdLimpo) {
    return null;
  }

  try {
    const { data: meusVotosData, error: meusVotosError } = await supabase
      .from("comunidade_enquete_votos")
      .select("post_id, user_id, opcao")
      .in("post_id", postIdsUnicos)
      .eq("user_id", usuarioIdLimpo)
      .limit(5000);

    if (meusVotosError || !Array.isArray(meusVotosData)) {
      return null;
    }

    const meusVotos: Record<string, string> = {};

    meusVotosData.forEach((voto) => {
      const postId = typeof voto.post_id === "string" ? voto.post_id : "";
      const opcao = typeof voto.opcao === "string" ? voto.opcao : "";

      if (postId && opcao) {
        meusVotos[postId] = opcao;
      }
    });

    const postIdsJaVotados = Object.keys(meusVotos);

    if (postIdsJaVotados.length === 0) {
      return {
        resultados: {},
        meusVotos,
      };
    }

    const { data, error } = await supabase
      .from("comunidade_enquete_votos")
      .select("post_id, user_id, opcao")
      .in("post_id", postIdsJaVotados)
      .limit(5000);

    if (error || !Array.isArray(data)) {
      return {
        resultados: {},
        meusVotos,
      };
    }

    const resultados: ResultadoVotosEnquete = {};

    data.forEach((voto) => {
      const postId = typeof voto.post_id === "string" ? voto.post_id : "";
      const opcao = typeof voto.opcao === "string" ? voto.opcao : "";

      if (!postId || !opcao || !postIdsJaVotados.includes(postId)) {
        return;
      }

      resultados[postId] = {
        ...(resultados[postId] || {}),
        [opcao]: (resultados[postId]?.[opcao] || 0) + 1,
      };
    });

    return {
      resultados,
      meusVotos,
    };
  } catch {
    return null;
  }
}
