import { ehClassificacao18 } from "../../../lib/historietasAdultContent";
import { supabase } from "../../../lib/supabase/client";
import {
  criarSlugBase,
  normalizarTexto,
  obterNumeroSeguro,
} from "../../../lib/utils";
import {
  pegarBooleano,
  pegarTexto,
} from "./notificacoes-data-normalizers";
import type { ObraLocal } from "./notificacoes-models";
import type { PerfilNotificacao } from "./notificacoes-profile-utils";
import { carregarPerfisNotificacoes } from "./notificacoes-supabase-profile-loader";

type DadosNotificacoesComunidadeSupabase = {
  postsPorId: Map<string, { texto: string; autorNome: string }>;
  comentariosComunidade: Record<string, unknown>[];
  denunciasComunidade: Record<string, unknown>[];
  seguidoresPerfil: Record<string, unknown>[];
  solicitacoesSeguidoresPerfil: Record<string, unknown>[];
  comentariosCapitulos: Record<string, unknown>[];
  reviewsComunidade: Record<string, unknown>[];
  capitulosAutor: Map<
    string,
    {
      id: string;
      titulo: string;
      obraId: string;
      obraTitulo: string;
      obraSlug: string;
      obraPublicada: boolean;
      numero: number;
    }
  >;
  perfis: Map<string, PerfilNotificacao>;
};

export async function carregarDadosNotificacoesComunidadeSupabase(
  userId: string
): Promise<DadosNotificacoesComunidadeSupabase> {
  const userIdsParaProfiles = new Set<string>();
  const postsPorId = new Map<string, { texto: string; autorNome: string }>();
  const comentariosComunidade: Record<string, unknown>[] = [];
  const denunciasComunidade: Record<string, unknown>[] = [];
  const seguidoresPerfil: Record<string, unknown>[] = [];
  const solicitacoesSeguidoresPerfil: Record<string, unknown>[] = [];
  const comentariosCapitulos: Record<string, unknown>[] = [];
  const reviewsComunidade: Record<string, unknown>[] = [];
  const obrasAutor = new Map<
    string,
    Pick<
      ObraLocal,
      "id" | "titulo" | "slug" | "publicado" | "classificacaoIndicativa"
    >
  >();
  const capitulosAutor = new Map<
    string,
    {
      id: string;
      titulo: string;
      obraId: string;
      obraTitulo: string;
      obraSlug: string;
      obraPublicada: boolean;
      numero: number;
    }
  >();

  try {
    const { data: postsData } = await supabase
      .from("comunidade_posts")
      .select("id, texto, autor_id, autor_nome, criado_em")
      .eq("autor_id", userId)
      .limit(120);

    const posts = Array.isArray(postsData) ? postsData : [];
    const postIds = posts
      .map((post) => pegarTexto((post as Record<string, unknown>).id))
      .filter(Boolean);

    posts.forEach((post) => {
      const registro = post as Record<string, unknown>;
      const postId = pegarTexto(registro.id);

      if (!postId) {
        return;
      }

      postsPorId.set(postId, {
        texto: pegarTexto(registro.texto, "sua publicação"),
        autorNome: pegarTexto(registro.autor_nome, "Você"),
      });
    });

    if (postIds.length > 0) {
      const { data: comentariosData } = await supabase
        .from("comunidade_comentarios")
        .select("id, post_id, autor_id, autor_nome, texto, criado_em")
        .in("post_id", postIds)
        .neq("autor_id", userId)
        .order("criado_em", { ascending: false })
        .limit(160);

      if (Array.isArray(comentariosData)) {
        comentariosData.forEach((comentario) => {
          const registro = comentario as Record<string, unknown>;
          const autorId = pegarTexto(registro.autor_id);

          comentariosComunidade.push(registro);

          if (autorId) {
            userIdsParaProfiles.add(autorId);
          }
        });
      }
    }
  } catch {
    // A página continua com notificações locais e de capítulos se a Comunidade falhar.
  }

  try {
    const { data: denunciasData } = await supabase.rpc(
      "listar_minhas_denuncias",
      {
        p_limite: 80,
      }
    );

    if (Array.isArray(denunciasData)) {
      denunciasData.forEach((denuncia) => {
        const registro = denuncia as Record<string, unknown>;
        const status = pegarTexto(registro.status);

        if (!["em_analise", "resolvida", "rejeitada"].includes(status)) {
          return;
        }

        denunciasComunidade.push(registro);
      });
    }
  } catch {
    // Denúncias continuam opcionais para não bloquear as notificações.
  }

  try {
    const { data: seguidoresData } = await supabase
      .from("seguindo_usuarios")
      .select("id, seguidor_id, seguido_id, criado_em")
      .eq("seguido_id", userId)
      .order("criado_em", { ascending: false })
      .limit(60);

    if (Array.isArray(seguidoresData)) {
      seguidoresData.forEach((seguidor) => {
        const registro = seguidor as Record<string, unknown>;
        const seguidorId = pegarTexto(registro.seguidor_id);

        seguidoresPerfil.push(registro);

        if (seguidorId) {
          userIdsParaProfiles.add(seguidorId);
        }
      });
    }
  } catch {
    // Seguir usuário é social; se falhar, as outras notificações continuam.
  }

  try {
    const { data: solicitacoesData } = await supabase
      .from("solicitacoes_seguidores")
      .select(
        "id, solicitante_id, destinatario_id, criado_em, atualizado_em"
      )
      .eq("destinatario_id", userId)
      .order("criado_em", { ascending: false })
      .limit(60);

    if (Array.isArray(solicitacoesData)) {
      solicitacoesData.forEach((solicitacao) => {
        const registro = solicitacao as Record<string, unknown>;
        const solicitanteId = pegarTexto(registro.solicitante_id);

        solicitacoesSeguidoresPerfil.push(registro);

        if (solicitanteId) {
          userIdsParaProfiles.add(solicitanteId);
        }
      });
    }
  } catch {
    // Solicitações são opcionais; as demais notificações continuam funcionando.
  }

  try {
    const { data: obrasAutorData } = await supabase
      .from("obras")
      .select("id, titulo, slug, publicado, user_id, classificacao_indicativa")
      .eq("user_id", userId)
      .limit(80);

    const obrasAutorRows = Array.isArray(obrasAutorData)
      ? (obrasAutorData as Record<string, unknown>[])
      : [];

    obrasAutorRows.forEach((obra, index) => {
      const obraId = pegarTexto(obra.id, `obra-autor-${index + 1}`);
      const titulo = pegarTexto(obra.titulo, "Obra sem título");
      const slug = pegarTexto(obra.slug, criarSlugBase(titulo));

      if (!obraId) {
        return;
      }

      obrasAutor.set(obraId, {
        id: obraId,
        titulo,
        slug,
        publicado: pegarBooleano(obra.publicado, true),
        classificacaoIndicativa: pegarTexto(
          obra.classificacao_indicativa,
          "Não informada"
        ),
      });
    });

    const obraIds = Array.from(obrasAutor.keys());

    if (obraIds.length > 0) {
      const { data: capitulosData } = await supabase
        .from("capitulos")
        .select("id, obra_id, titulo, ordem, publicado, criado_em")
        .in("obra_id", obraIds)
        .eq("publicado", true)
        .order("ordem", { ascending: true })
        .limit(600);

      if (Array.isArray(capitulosData)) {
        capitulosData.forEach((capitulo, index) => {
          const registro = capitulo as Record<string, unknown>;
          const capituloId = pegarTexto(registro.id);
          const obraId = pegarTexto(registro.obra_id);
          const obra = obrasAutor.get(obraId);

          if (!capituloId || !obra) {
            return;
          }

          capitulosAutor.set(capituloId, {
            id: capituloId,
            titulo: pegarTexto(registro.titulo, `Capítulo ${index + 1}`),
            obraId,
            obraTitulo: obra.titulo,
            obraSlug: obra.slug,
            obraPublicada: obra.publicado,
            numero: obterNumeroSeguro(registro.ordem, index + 1),
          });
        });
      }

      const capituloIds = Array.from(capitulosAutor.keys());

      if (capituloIds.length > 0) {
        const { data: comentariosCapitulosData } = await supabase
          .from("comentarios_capitulos")
          .select("id,capitulo_id,user_id,comentario,criado_em,atualizado_em")
          .in("capitulo_id", capituloIds)
          .neq("user_id", userId)
          .order("atualizado_em", { ascending: false })
          .limit(200);

        if (Array.isArray(comentariosCapitulosData)) {
          comentariosCapitulosData.forEach((comentario) => {
            const registro = comentario as Record<string, unknown>;
            const autorId = pegarTexto(registro.user_id);

            comentariosCapitulos.push(registro);

            if (autorId) {
              userIdsParaProfiles.add(autorId);
            }
          });
        }
      }

      const { data: reviewsData } = await supabase
        .from("comunidade_posts")
        .select("id, autor_id, autor_nome, texto, obra_relacionada, tipo_publicacao, criado_em")
        .eq("tipo_publicacao", "Review")
        .neq("autor_id", userId)
        .order("criado_em", { ascending: false })
        .limit(80);

      if (Array.isArray(reviewsData)) {
        reviewsData.forEach((review) => {
          const registro = review as Record<string, unknown>;
          const obraRelacionada = normalizarTexto(
            pegarTexto(registro.obra_relacionada)
          );
          const obraDoAutor = Array.from(obrasAutor.values()).find((obra) => {
            const tituloNormalizado = normalizarTexto(obra.titulo);

            return (
              obraRelacionada &&
              tituloNormalizado &&
              (obraRelacionada === tituloNormalizado ||
                obraRelacionada.includes(tituloNormalizado) ||
                tituloNormalizado.includes(obraRelacionada))
            );
          });

          const classificacaoNormalizada = normalizarTexto(
            obraDoAutor?.classificacaoIndicativa || ""
          );

          if (
            !obraDoAutor ||
            !obraDoAutor.publicado ||
            !classificacaoNormalizada ||
            classificacaoNormalizada.startsWith("nao informad") ||
            ehClassificacao18(obraDoAutor.classificacaoIndicativa)
          ) {
            return;
          }

          registro.obra_id_validado = obraDoAutor.id;
          registro.obra_titulo_validado = obraDoAutor.titulo;

          const autorId = pegarTexto(registro.autor_id);
          reviewsComunidade.push(registro);

          if (autorId) {
            userIdsParaProfiles.add(autorId);
          }
        });
      }
    }
  } catch {
    // Comentários de capítulo/reviews são extras; não bloqueiam a página.
  }

  const perfis = await carregarPerfisNotificacoes(
    Array.from(userIdsParaProfiles)
  );

  return {
    postsPorId,
    comentariosComunidade,
    denunciasComunidade,
    seguidoresPerfil,
    solicitacoesSeguidoresPerfil,
    comentariosCapitulos,
    reviewsComunidade,
    capitulosAutor,
    perfis,
  };
}
