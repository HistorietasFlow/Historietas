import { supabase } from "../../../lib/supabase/client";
import { removerReviewComunidadeDoDiario } from "./community-diary-review-remover";
import { obterObraRelacionadaPermitida } from "./community-related-work-allowed-finder";
import { normalizarSugestaoObraSupabase } from "./community-related-work-supabase-normalizer";
import { obterUsuarioAutenticadoComunidadeAtual } from "./community-supabase-current-user-loader";
import { idSupabaseValidoComunidade } from "./community-supabase-id-validator";

type ObraRelacionadaSugestao = {
  id: string;
  titulo: string;
  autor: string;
  autorId: string;
  slug: string;
  link: string;
};

type VisibilidadePostComunidade =
  | "publico"
  | "seguidores"
  | "seguindo"
  | "somente_eu";

function obterVisibilidadeReviewNoDiario(
  visibilidade: VisibilidadePostComunidade,
): "publico" | "privado" {
  return visibilidade === "publico" ? "publico" : "privado";
}

export async function registrarReviewComunidadeNoDiario({
  userId,
  texto,
  obraRelacionada,
  postId,
  criadaEm,
  sugestoesObras,
  visibilidade,
}: {
  userId: string;
  texto: string;
  obraRelacionada: string;
  postId: string;
  criadaEm: string;
  sugestoesObras: ObraRelacionadaSugestao[];
  visibilidade: VisibilidadePostComunidade;
}) {
  const userIdLimpo = userId.trim();
  const postIdLimpo = postId.trim();

  if (!userIdLimpo || !postIdLimpo) {
    return false;
  }

  try {
    const usuarioAutenticado = await obterUsuarioAutenticadoComunidadeAtual();

    if (!usuarioAutenticado || usuarioAutenticado.id !== userIdLimpo) {
      return false;
    }

    await removerReviewComunidadeDoDiario({
      userId: userIdLimpo,
      postId: postIdLimpo,
    });

    let obraDiario = obterObraRelacionadaPermitida(
      obraRelacionada,
      sugestoesObras
    );
    const obraRelacionadaLimpa = obraRelacionada.trim();

    if (obraRelacionadaLimpa && !obraDiario) {
      const { data: obrasEncontradas, error: erroObraRelacionada } =
        await supabase
          .from("obras")
          .select("id, user_id, titulo, autor, classificacao_indicativa, publicado, slug, link")
          .eq("publicado", true)
          .eq("titulo", obraRelacionadaLimpa)
          .limit(5);

      if (!erroObraRelacionada) {
        obraDiario =
          (obrasEncontradas || [])
            .map((obra, index) => normalizarSugestaoObraSupabase(obra, index))
            .find((obra): obra is ObraRelacionadaSugestao => Boolean(obra)) || null;
      }
    }

    if (obraRelacionadaLimpa && !obraDiario) {
      return true;
    }

    const obraId = obraDiario?.id?.trim() || "";
    const dataReview = new Date(criadaEm);
    const criadaEmValida = Number.isNaN(dataReview.getTime())
      ? ""
      : dataReview.toISOString();
    const visibilidadeDiario = obterVisibilidadeReviewNoDiario(visibilidade);
    const registroDiario: {
      user_id: string;
      tipo: "publicou_review";
      texto: string;
      visibilidade: "publico" | "privado";
      metadata: {
        post_id: string;
        obra_relacionada: string;
        origem: "comunidade";
        visibilidade_post: VisibilidadePostComunidade;
      };
      obra_id?: string;
      criado_em?: string;
      atualizado_em?: string;
    } = {
      user_id: userIdLimpo,
      tipo: "publicou_review",
      texto: texto.trim().slice(0, 420),
      visibilidade: visibilidadeDiario,
      metadata: {
        post_id: postIdLimpo,
        obra_relacionada: obraDiario?.titulo.trim().slice(0, 90) || "",
        origem: "comunidade",
        visibilidade_post: visibilidade,
      },
    };

    if (obraId && idSupabaseValidoComunidade(obraId)) {
      registroDiario.obra_id = obraId;
    }

    if (criadaEmValida) {
      registroDiario.criado_em = criadaEmValida;
      registroDiario.atualizado_em = criadaEmValida;
    }

    const { error } = await supabase
      .from("diario_atividades")
      .insert(registroDiario);

    if (!error) {
      return true;
    }

    const registroFallback = {
      user_id: registroDiario.user_id,
      tipo: registroDiario.tipo,
      texto: registroDiario.texto,
      visibilidade: registroDiario.visibilidade,
      metadata: registroDiario.metadata,
      ...(registroDiario.obra_id ? { obra_id: registroDiario.obra_id } : {}),
    };
    const { error: erroFallback } = await supabase
      .from("diario_atividades")
      .insert(registroFallback);

    if (erroFallback) {
      console.warn(
        "Não consegui registrar a review no Diário:",
        erroFallback.message
      );
      return false;
    }

    return true;
  } catch (error) {
    console.warn("Não consegui registrar a review no Diário:", error);
    return false;
  }
}
