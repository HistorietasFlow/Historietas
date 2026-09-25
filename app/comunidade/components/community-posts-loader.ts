import type { Dispatch, SetStateAction } from "react";
import { supabase } from "../../../lib/supabase/client";
import {
  calcularIntervaloPaginaSupabase,
  carregarTodasPaginasSupabase,
  dividirEmLotesSupabase,
} from "../../../lib/supabase/paginacao.mjs";
import { normalizarCategoria } from "./community-category-normalizer";
import {
  IDS_COMENTARIOS_POR_LOTE,
  OBRAS_RELACIONADAS_POR_PAGINA,
  POSTS_COMUNIDADE_POR_PAGINA,
  REGISTROS_COMUNIDADE_POR_PAGINA,
} from "./community-pagination-constants";
import type { PostComunidade } from "./community-post-model";
import { obterAvatarProfileComunidade } from "./community-profile-avatar";
import { obterNomeProfileComunidade } from "./community-profile-name";
import { obterTextoProfileComunidade } from "./community-profile-text";
import { normalizarTipoPublicacao } from "./community-publication-type-normalizer";
import { separarObraECapituloRelacionados } from "./community-related-chapter-utils";
import { removerSugestoesObrasDuplicadas } from "./community-related-work-deduplicator";
import {
  normalizarSugestaoObraSupabase,
  type SupabaseObraPublicaRow,
} from "./community-related-work-supabase-normalizer";
import type { ObraRelacionadaSugestao } from "./community-related-work-suggestion";
import type { SupabaseComentarioCurtidaRow } from "./community-supabase-comment-like-row";
import type { SupabaseComentarioRow } from "./community-supabase-comment-row";
import { formatarErroSupabase } from "./community-supabase-error-formatter";
import { idSupabaseValidoComunidade } from "./community-supabase-id-validator";
import type { SupabaseCurtidaRow } from "./community-supabase-like-row";
import { carregarProfilesComunidadePorUsuarios } from "./community-supabase-profiles-loader";
import { mapearPostsSupabase } from "./community-supabase-posts-mapper";
import { normalizarVisibilidadePostComunidade } from "./community-post-visibility-normalizer";

type CarregarPostsComunidadeParams = {
  mostrarCarregamento?: boolean;
  pagina?: number;
  obraFiltro: string;
  setCarregandoFeed: Dispatch<SetStateAction<boolean>>;
  setCarregandoMaisPostsComunidade: Dispatch<SetStateAction<boolean>>;
  setPosts: Dispatch<SetStateAction<PostComunidade[]>>;
  setTemMaisPostsComunidade: Dispatch<SetStateAction<boolean>>;
  setPaginaFeedComunidade: Dispatch<SetStateAction<number>>;
  setObrasRelacionadasSugestoes: Dispatch<
    SetStateAction<ObraRelacionadaSugestao[]>
  >;
  setErro: Dispatch<SetStateAction<string>>;
};

export async function carregarPostsComunidade({
  mostrarCarregamento = false,
  pagina = 0,
  obraFiltro,
  setCarregandoFeed,
  setCarregandoMaisPostsComunidade,
  setPosts,
  setTemMaisPostsComunidade,
  setPaginaFeedComunidade,
  setObrasRelacionadasSugestoes,
  setErro,
}: CarregarPostsComunidadeParams) {
  const carregandoPaginaInicial = mostrarCarregamento;
  const carregandoPaginaSeguinte = pagina > 0;

  if (carregandoPaginaInicial) {
    setCarregandoFeed(true);
  }

  if (carregandoPaginaSeguinte) {
    setCarregandoMaisPostsComunidade(true);
  }

  const { inicio, fim } = calcularIntervaloPaginaSupabase(
    pagina,
    POSTS_COMUNIDADE_POR_PAGINA,
  );

  try {
    let consultaPosts = supabase
      .from("comunidade_posts")
      .select(
        "id, autor_id, autor_nome, categoria, tipo_publicacao, tem_spoiler, texto, obra_relacionada, criado_em, fixado, fixado_em, fixado_por, visibilidade"
      );

    const obraFiltroLimpa = obraFiltro.trim().slice(0, 90);

    if (obraFiltroLimpa) {
      const obraFiltroLike = obraFiltroLimpa.replace(/[%_]/g, "\\$&");

      consultaPosts = consultaPosts.like(
        "obra_relacionada",
        `${obraFiltroLike}%`,
      );
    }

    const postsResposta = await consultaPosts
      .order("criado_em", { ascending: false })
      .order("id", { ascending: false })
      .range(inicio, fim);

    if (postsResposta.error) {
      throw postsResposta.error;
    }

    const postsPagina = postsResposta.data || [];
    const postIds = postsPagina
      .map((post) => post.id)
      .filter((postId): postId is string => Boolean(postId));

    if (postIds.length === 0) {
      if (pagina === 0) {
        setPosts([]);
      }

      setTemMaisPostsComunidade(false);
      setPaginaFeedComunidade(pagina);
      return;
    }

    const titulosObrasRelacionadasPagina = Array.from(
      new Set(
        postsPagina
          .map((post) =>
            separarObraECapituloRelacionados(post.obra_relacionada || "")
              .obraRelacionada.trim()
          )
          .filter(Boolean)
      )
    );

    if (titulosObrasRelacionadasPagina.length > 0) {
      try {
        const obrasRelacionadasPagina =
          await carregarTodasPaginasSupabase<SupabaseObraPublicaRow>({
            nomeColecao: "obras relacionadas da Comunidade",
            tamanhoPagina: OBRAS_RELACIONADAS_POR_PAGINA,
            buscarPagina: async (inicioPagina, fimPagina) =>
              supabase
                .from("obras")
                .select(
                  "id, user_id, titulo, autor, classificacao_indicativa, publicado, slug, link",
                )
                .eq("publicado", true)
                .in("titulo", titulosObrasRelacionadasPagina)
                .order("titulo", { ascending: true })
                .order("id", { ascending: true })
                .range(inicioPagina, fimPagina),
          });
        const sugestoesObrasRelacionadasPagina = (
          obrasRelacionadasPagina
        )
          .map((obra, index) => normalizarSugestaoObraSupabase(obra, index))
          .filter((obra): obra is ObraRelacionadaSugestao => Boolean(obra));

        if (sugestoesObrasRelacionadasPagina.length > 0) {
          setObrasRelacionadasSugestoes((obrasAtuais) =>
            removerSugestoesObrasDuplicadas([
              ...obrasAtuais,
              ...sugestoesObrasRelacionadasPagina,
            ])
          );
        }
      } catch {
        // A obra relacionada é complementar; os posts continuam disponíveis.
      }
    }

    const [comentariosSupabase, curtidasSupabase] = await Promise.all([
      carregarTodasPaginasSupabase<SupabaseComentarioRow>({
        nomeColecao: "comentários da Comunidade",
        tamanhoPagina: REGISTROS_COMUNIDADE_POR_PAGINA,
        buscarPagina: async (inicioPagina, fimPagina) =>
          supabase
            .from("comunidade_comentarios")
            .select(
              "id, post_id, autor_id, autor_nome, texto, comentario_pai_id, criado_em",
            )
            .in("post_id", postIds)
            .order("criado_em", { ascending: true })
            .order("id", { ascending: true })
            .range(inicioPagina, fimPagina),
      }),
      carregarTodasPaginasSupabase<SupabaseCurtidaRow>({
        nomeColecao: "curtidas de posts da Comunidade",
        tamanhoPagina: REGISTROS_COMUNIDADE_POR_PAGINA,
        buscarPagina: async (inicioPagina, fimPagina) =>
          supabase
            .from("comunidade_curtidas")
            .select("post_id, usuario_id")
            .in("post_id", postIds)
            .order("post_id", { ascending: true })
            .order("usuario_id", { ascending: true })
            .range(inicioPagina, fimPagina),
      }),
    ]);

    const comentarioIds = comentariosSupabase
      .map((comentario) => comentario.id)
      .filter((comentarioId): comentarioId is string => Boolean(comentarioId));

    const comentarioCurtidasSupabase: SupabaseComentarioCurtidaRow[] = [];

    for (const loteComentarioIds of dividirEmLotesSupabase(
      comentarioIds,
      IDS_COMENTARIOS_POR_LOTE,
    )) {
      const curtidasDoLote =
        await carregarTodasPaginasSupabase<SupabaseComentarioCurtidaRow>({
          nomeColecao: "curtidas de comentários da Comunidade",
          tamanhoPagina: REGISTROS_COMUNIDADE_POR_PAGINA,
          buscarPagina: async (inicioPagina, fimPagina) =>
            supabase
              .from("comunidade_comentario_curtidas")
              .select("comentario_id, usuario_id")
              .in("comentario_id", loteComentarioIds)
              .order("comentario_id", { ascending: true })
              .order("usuario_id", { ascending: true })
              .range(inicioPagina, fimPagina),
        });

      comentarioCurtidasSupabase.push(...curtidasDoLote);
    }

    const autoresIdsComunidade = Array.from(
      new Set(
        [
          ...postsPagina.map((post) => post.autor_id),
          ...comentariosSupabase.map((comentario) => comentario.autor_id),
        ].filter((id): id is string => idSupabaseValidoComunidade(id || ""))
      )
    );
    const profilesPorUsuario = await carregarProfilesComunidadePorUsuarios(
      autoresIdsComunidade,
      obterTextoProfileComunidade
    );

    const postsSupabase = mapearPostsSupabase(
      postsPagina,
      comentariosSupabase,
      curtidasSupabase,
      comentarioCurtidasSupabase,
      profilesPorUsuario,
      obterNomeProfileComunidade,
      obterAvatarProfileComunidade,
      normalizarCategoria,
      normalizarTipoPublicacao,
      normalizarVisibilidadePostComunidade
    );

    setPosts((postsAtuais) => {
      if (pagina === 0) {
        return postsSupabase;
      }

      const postsPorId = new Map(
        postsAtuais.map((postAtual) => [postAtual.id, postAtual])
      );

      postsSupabase.forEach((post) => {
        postsPorId.set(post.id, post);
      });

      return Array.from(postsPorId.values());
    });

    setTemMaisPostsComunidade(
      postsPagina.length === POSTS_COMUNIDADE_POR_PAGINA
    );
    setPaginaFeedComunidade(pagina);
  } catch (error) {
    setErro(formatarErroSupabase("Erro ao carregar Comunidade", error));

    if (pagina === 0) {
      setPosts([]);
      setTemMaisPostsComunidade(false);
    }
  } finally {
    if (carregandoPaginaInicial) {
      setCarregandoFeed(false);
    }

    if (carregandoPaginaSeguinte) {
      setCarregandoMaisPostsComunidade(false);
    }
  }
}
