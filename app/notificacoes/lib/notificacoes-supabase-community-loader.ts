import { ehClassificacao18 } from "../../../lib/historietasAdultContent";
import { supabase } from "../../../lib/supabase/client";
import {
  criarSlugBase,
  normalizarTexto,
  obterNumeroSeguro,
} from "../../../lib/utils";
import { dataNotificacao } from "./notificacoes-filter-utils";
import {
  pegarBooleano,
  pegarTexto,
} from "./notificacoes-data-normalizers";
import type {
  NotificacaoLocal,
  ObraLocal,
} from "./notificacoes-models";
import {
  criarHrefLeituraCapitulo,
  criarPerfilHrefNotificacao,
} from "./notificacoes-navigation-utils";
import { obterPerfilNotificacao } from "./notificacoes-profile-utils";
import { carregarPerfisNotificacoes } from "./notificacoes-supabase-profile-loader";
import { obterTextoStatusDenunciaComunidadeNotificacao } from "./notificacoes-status-text-utils";

export async function carregarNotificacoesComunidadeSupabase(
  userId: string,
  notificacoesLidasIds: string[]
): Promise<NotificacaoLocal[]> {
  const idsLidos = new Set(notificacoesLidasIds);
  const notificacoesSociais: NotificacaoLocal[] = [];
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

  const perfis = await carregarPerfisNotificacoes(Array.from(userIdsParaProfiles));

  comentariosComunidade.forEach((registro) => {
    const comentarioId = pegarTexto(registro.id);
    const postId = pegarTexto(registro.post_id);

    if (!comentarioId || !postId) {
      return;
    }

    const autorId = pegarTexto(registro.autor_id);
    const perfilAutor = obterPerfilNotificacao(
      perfis,
      autorId,
      pegarTexto(registro.autor_nome, "Alguém")
    );
    const id = `comunidade-comentario-${comentarioId}`;
    const textoComentario = pegarTexto(registro.texto);
    const post = postsPorId.get(postId);
    const trechoPost = post?.texto
      ? post.texto.slice(0, 90)
      : "uma publicação sua";

    notificacoesSociais.push({
      id,
      obraId: "",
      capituloId: "",
      link: `/comunidade?post=${encodeURIComponent(postId)}`,
      titulo: "Novo comentário na Comunidade",
      mensagem: `${perfilAutor.nome} comentou em "${trechoPost}${
        trechoPost.length >= 90 ? "..." : ""
      }"${textoComentario ? `: ${textoComentario.slice(0, 90)}` : "."}`,
      tipo: "comentario-comunidade",
      lida: idsLidos.has(id),
      criadaEm: pegarTexto(registro.criado_em, new Date().toISOString()),
      autorId,
      autorNome: perfilAutor.nome,
      autorAvatar: perfilAutor.avatar,
    });
  });

  seguidoresPerfil.forEach((registro) => {
    const seguidorId = pegarTexto(registro.seguidor_id);

    if (!seguidorId) {
      return;
    }

    const perfilSeguidor = obterPerfilNotificacao(perfis, seguidorId, "Usuário");
    const id = `novo-seguidor-${pegarTexto(registro.id, seguidorId)}`;

    notificacoesSociais.push({
      id,
      obraId: "",
      capituloId: "",
      link: criarPerfilHrefNotificacao(seguidorId, perfilSeguidor.nome),
      titulo: "Novo seguidor",
      mensagem: `${perfilSeguidor.nome} começou a seguir seu perfil.`,
      tipo: "novo-seguidor",
      lida: idsLidos.has(id),
      criadaEm: pegarTexto(registro.criado_em, new Date().toISOString()),
      autorId: seguidorId,
      autorNome: perfilSeguidor.nome,
      autorAvatar: perfilSeguidor.avatar,
    });
  });

  solicitacoesSeguidoresPerfil.forEach((registro) => {
    const solicitacaoId = pegarTexto(registro.id);
    const solicitanteId = pegarTexto(registro.solicitante_id);

    if (!solicitacaoId || !solicitanteId) {
      return;
    }

    const perfilSolicitante = obterPerfilNotificacao(
      perfis,
      solicitanteId,
      "Usuário"
    );
    const id = `solicitacao-seguidor-${solicitacaoId}`;

    notificacoesSociais.push({
      id,
      obraId: "",
      capituloId: "",
      link: "/seguindo?aba=seguidores&conteudo=seguidores",
      titulo: "Nova solicitação para seguir",
      mensagem: `${perfilSolicitante.nome} quer seguir seu perfil.`,
      tipo: "solicitacao-seguidor",
      lida: idsLidos.has(id),
      criadaEm: pegarTexto(
        registro.criado_em ?? registro.atualizado_em,
        new Date().toISOString()
      ),
      autorId: solicitanteId,
      autorNome: perfilSolicitante.nome,
      autorAvatar: perfilSolicitante.avatar,
      solicitacaoId,
    });
  });

  comentariosCapitulos.forEach((registro) => {
    const capituloId = pegarTexto(registro.capitulo_id);
    const capitulo = capitulosAutor.get(capituloId);

    if (!capitulo) {
      return;
    }

    const autorId = pegarTexto(registro.user_id);
    const perfilAutor = obterPerfilNotificacao(perfis, autorId, "Leitor");
    const comentarioId =
      pegarTexto(registro.id) ||
      `${capituloId}-${autorId}-${pegarTexto(registro.atualizado_em ?? registro.criado_em)}`;
    const id = `capitulo-comentario-${comentarioId}`;
    const textoComentario = pegarTexto(registro.comentario ?? registro.texto);

    notificacoesSociais.push({
      id,
      obraId: capitulo.obraId,
      capituloId,
      link: criarHrefLeituraCapitulo(
        {
          id: capitulo.obraId,
          slug: capitulo.obraSlug,
          titulo: capitulo.obraTitulo,
          publicado: capitulo.obraPublicada,
        },
        capituloId,
        capitulo.numero
      ),
      titulo: "Novo comentário no capítulo",
      mensagem: `${perfilAutor.nome} comentou em ${capitulo.titulo}${
        textoComentario ? `: ${textoComentario.slice(0, 90)}` : "."
      }`,
      tipo: "comentario-capitulo",
      lida: idsLidos.has(id),
      criadaEm: pegarTexto(
        registro.criado_em ?? registro.atualizado_em,
        new Date().toISOString()
      ),
      autorId,
      autorNome: perfilAutor.nome,
      autorAvatar: perfilAutor.avatar,
    });
  });

  reviewsComunidade.forEach((registro) => {
    const postId = pegarTexto(registro.id);

    if (!postId) {
      return;
    }

    const autorId = pegarTexto(registro.autor_id);
    const perfilAutor = obterPerfilNotificacao(
      perfis,
      autorId,
      pegarTexto(registro.autor_nome, "Leitor")
    );
    const obraId = pegarTexto(registro.obra_id_validado);
    const obraRelacionada = pegarTexto(
      registro.obra_titulo_validado,
      "sua obra"
    );
    const textoReview = pegarTexto(registro.texto);
    const id = `comunidade-review-${postId}`;

    notificacoesSociais.push({
      id,
      obraId,
      capituloId: "",
      link: `/comunidade?post=${encodeURIComponent(postId)}`,
      titulo: "Nova review publicada",
      mensagem: `${perfilAutor.nome} publicou uma review sobre ${obraRelacionada}${
        textoReview ? `: ${textoReview.slice(0, 90)}` : "."
      }`,
      tipo: "review-comunidade",
      lida: idsLidos.has(id),
      criadaEm: pegarTexto(registro.criado_em, new Date().toISOString()),
      autorId,
      autorNome: perfilAutor.nome,
      autorAvatar: perfilAutor.avatar,
    });
  });

  denunciasComunidade.forEach((registro) => {
    const denunciaId = pegarTexto(registro.denuncia_id);
    const status = pegarTexto(registro.status, "em_analise");

    if (!denunciaId) {
      return;
    }

    const id = `comunidade-denuncia-${denunciaId}-${status}`;
    const statusTexto = obterTextoStatusDenunciaComunidadeNotificacao(status);
    const alvoTipo = pegarTexto(registro.alvo_tipo, "conteúdo");
    const alvoId = pegarTexto(registro.alvo_id);
    const link =
      alvoTipo === "post" && alvoId
        ? `/comunidade?post=${encodeURIComponent(alvoId)}`
        : "/comunidade";

    notificacoesSociais.push({
      id,
      obraId: "",
      capituloId: "",
      link,
      titulo: `Denúncia ${statusTexto}`,
      mensagem: `A moderação marcou sua denúncia como ${statusTexto}.`,
      tipo: "denuncia-comunidade",
      lida: idsLidos.has(id),
      criadaEm: pegarTexto(
        registro.analisado_em ?? registro.criado_em,
        new Date().toISOString()
      ),
      autorId: "",
      autorNome: "Moderação",
      autorAvatar: "",
    });
  });

  return notificacoesSociais.sort(
    (a, b) => dataNotificacao(b) - dataNotificacao(a)
  );
}
