import { ehClassificacao18 } from "../../../lib/historietasAdultContent";
import { normalizarTexto } from "../../../lib/utils";
import { supabase } from "../../../lib/supabase/client";
import type { ComunidadePerfilEstado, PublicacaoComunidadePerfil } from "../types";
import { pegarTexto } from "./data-normalizers";
import { idAutorSupabaseValido } from "./profile-formatters";
import { normalizarPublicacaoComunidadePerfil } from "./profile-community-publication-utils";

export async function carregarComunidadePerfilSupabase(
  userId: string,
  incluirObrasRelacionadasSemFiltro = false,
): Promise<Omit<ComunidadePerfilEstado, "carregando" | "erro">> {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo || !idAutorSupabaseValido(userIdLimpo)) {
    return {
      totalPublicacoes: 0,
      totalTeorias: 0,
      totalReviews: 0,
      publicacoesRecentes: [],
    };
  }

  const [publicacoesResposta, teoriasResposta, reviewsResposta] =
    await Promise.all([
      supabase
        .from("comunidade_posts")
        .select(
          "id, categoria, tipo_publicacao, tem_spoiler, texto, obra_relacionada, criado_em",
          { count: "exact" },
        )
        .eq("autor_id", userIdLimpo)
        .order("criado_em", { ascending: false })
        .limit(12),
      supabase
        .from("comunidade_posts")
        .select("id", { count: "exact", head: true })
        .eq("autor_id", userIdLimpo)
        .eq("tipo_publicacao", "Teoria"),
      supabase
        .from("comunidade_posts")
        .select("id", { count: "exact", head: true })
        .eq("autor_id", userIdLimpo)
        .eq("tipo_publicacao", "Review"),
    ]);

  if (publicacoesResposta.error) {
    throw publicacoesResposta.error;
  }

  let publicacoesRecentes = (publicacoesResposta.data || [])
    .map((registro) => normalizarPublicacaoComunidadePerfil(registro))
    .filter(
      (publicacao): publicacao is PublicacaoComunidadePerfil =>
        Boolean(publicacao),
    );

  if (!incluirObrasRelacionadasSemFiltro) {
    const titulosObrasRelacionadas = Array.from(
      new Set(
        publicacoesRecentes
          .map((publicacao) => publicacao.obraRelacionada.trim())
          .filter(Boolean),
      ),
    );

    if (titulosObrasRelacionadas.length > 0) {
      const { data: obrasRelacionadasData, error: obrasRelacionadasError } =
        await supabase
          .from("obras")
          .select("titulo, classificacao_indicativa")
          .eq("publicado", true)
          .in("titulo", titulosObrasRelacionadas)
          .limit(titulosObrasRelacionadas.length);

      const titulosPermitidos = new Set<string>();

      if (!obrasRelacionadasError && Array.isArray(obrasRelacionadasData)) {
        obrasRelacionadasData.forEach((registroObra) => {
          const titulo = pegarTexto(registroObra.titulo);
          const classificacao = pegarTexto(registroObra.classificacao_indicativa);
          const classificacaoNormalizada = normalizarTexto(classificacao);

          if (
            titulo &&
            classificacaoNormalizada &&
            !classificacaoNormalizada.startsWith("nao informad") &&
            !ehClassificacao18(classificacao)
          ) {
            titulosPermitidos.add(normalizarTexto(titulo));
          }
        });
      }

      publicacoesRecentes = publicacoesRecentes.map((publicacao) => {
        if (!publicacao.obraRelacionada) {
          return publicacao;
        }

        return titulosPermitidos.has(normalizarTexto(publicacao.obraRelacionada))
          ? publicacao
          : { ...publicacao, obraRelacionada: "" };
      });
    }
  }

  const totalTeoriasLocal = publicacoesRecentes.filter(
    (publicacao) => publicacao.tipoPublicacao === "Teoria",
  ).length;
  const totalReviewsLocal = publicacoesRecentes.filter(
    (publicacao) => publicacao.tipoPublicacao === "Review",
  ).length;

  return {
    totalPublicacoes: publicacoesResposta.count ?? publicacoesRecentes.length,
    totalTeorias: teoriasResposta.error
      ? totalTeoriasLocal
      : teoriasResposta.count ?? totalTeoriasLocal,
    totalReviews: reviewsResposta.error
      ? totalReviewsLocal
      : reviewsResposta.count ?? totalReviewsLocal,
    publicacoesRecentes,
  };
}
