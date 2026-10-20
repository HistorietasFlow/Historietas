"use client";

import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase/client";
import { useHistorietasTheme } from "../../lib/historietasTheme";
import {
  acessoConteudo18Confirmado,
  ehClassificacao18,
} from "../../lib/historietasAdultContent";
import {
  dataNotificacao,
  filtrarEOrdenarNotificacoes,
  notificacaoEhCapitulo,
  type FiltroNotificacao,
  type OrdenacaoNotificacao,
} from "./lib/notificacoes-filter-utils";
import { useNotificacoes } from "../../components/NotificacoesProvider";
import { criarSlugBase, idObraSupabaseValido, normalizarTexto, obterNumeroSeguro } from "../../lib/utils";
import { useEffect, useMemo, useState } from "react";
import NotificacoesLoadingSpinner from "./components/notificacoes-loading-spinner";
import NotificacoesSortingSheet from "./components/notificacoes-sorting-sheet";
import NotificacoesTopControls from "./components/notificacoes-top-controls";
import NotificacoesActionsSheet from "./components/notificacoes-actions-sheet";
import NotificacoesFeed from "./components/notificacoes-feed";
import NotificacoesPageShell from "./components/notificacoes-page-shell";
import { useNotificacoesDesktopMode } from "./hooks/use-notificacoes-desktop-mode";
import { useNotificacoesOverlayBodyLock } from "./hooks/use-notificacoes-overlay-body-lock";
import {
  containerStyle,
  desktopContainerStyle,
  desktopNotificationsControlsStyle,
  loadingPageStyle,
  loadingSpinnerStyle,
  notificationClearButtonStyle,
  notificacoesTopFilterBoxStyle,
  notificationsControlsStyle,
  pageStyle,
} from "./lib/notificacoes-shell-styles";
import {
  criarHrefLeituraCapitulo,
  criarLoginHrefNotificacoes,
  criarPerfilHrefNotificacao,
} from "./lib/notificacoes-navigation-utils";
import {
  apagarNotificacaoSupabase,
  apagarNotificacoesSupabase,
  excluirNotificacoesLidasSupabase,
  sincronizarNotificacaoLidaSupabase,
  sincronizarNotificacoesLidasSupabase,
} from "./lib/notificacoes-supabase-sync";
import { carregarEstadoSupabaseNotificacoes } from "./lib/notificacoes-supabase-state-loader";
import {
  mesclarNotificacoes,
  notificacoesRepresentamMesmoEvento,
} from "./lib/notificacoes-merge-utils";
import {
  pegarBooleano,
  pegarTexto,
} from "./lib/notificacoes-data-normalizers";
import {
  obterPerfilNotificacao,
} from "./lib/notificacoes-profile-utils";
import {
  criarNotificacoesDeCapitulos,
  notificacaoCapituloPertenceAObraSeguida,
} from "./lib/notificacoes-followed-chapters-utils";
import {
  carregarIdsNotificacoesApagadas,
  carregarNotificacoes,
  carregarObras,
  filtrarNotificacoesApagadas,
  prepararNotificacaoTexto,
  registrarNotificacoesApagadas,
  salvarNotificacoes,
} from "./lib/notificacoes-local-state-utils";
import { obterTextoStatusDenunciaComunidadeNotificacao } from "./lib/notificacoes-status-text-utils";
import {
  mesclarObrasPorIdSlug,
} from "./lib/notificacoes-record-normalizers";
import {
  CHAVE_OBRAS,
  CHAVE_OBRAS_SEGUIDAS,
  lerIdsLocalStorage,
  salvarJsonStorageUsuarioNotificacoes,
} from "./lib/notificacoes-storage-utils";
import type {
  NotificacaoLocal,
  ObraLocal,
} from "./lib/notificacoes-models";
import {
  carregarObrasDasNotificacoesDiretasSupabase,
  carregarObrasPublicadasSupabase,
} from "./lib/notificacoes-supabase-work-loader";
import { carregarPerfisNotificacoes } from "./lib/notificacoes-supabase-profile-loader";
import { carregarNotificacoesProblemasTecnicosSupabase } from "./lib/notificacoes-supabase-technical-issues-loader";
import { carregarNotificacoesDiretasSupabase } from "./lib/notificacoes-supabase-direct-loader";
import { carregarNotificacoesDiarioSupabase } from "./lib/notificacoes-supabase-diary-loader";

async function carregarNotificacoesComunidadeSupabase(
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


export default function NotificacoesPage() {
  const router = useRouter();
  const [obras, setObras] = useState<ObraLocal[]>([]);
  const [notificacoes, setNotificacoes] = useState<NotificacaoLocal[]>([]);
  const [busca, setBusca] = useState("");
  const [buscaTopoAberta, setBuscaTopoAberta] = useState(false);
  const [filtro, setFiltro] = useState<FiltroNotificacao>("todas");
  const [ordenacao, setOrdenacao] = useState<OrdenacaoNotificacao>("recentes");
  const [carregando, setCarregando] = useState(true);
  const [usuarioNotificacoesId, setUsuarioNotificacoesId] = useState("");
  const [menuNotificacaoAbertoId, setMenuNotificacaoAbertoId] = useState("");
  const [solicitacaoRespondendoId, setSolicitacaoRespondendoId] = useState("");
  const [mostrarPainelOrdenacao, setMostrarPainelOrdenacao] = useState(false);
  const { definirNotificacoesNaoLidas } = useNotificacoes();
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);
  const isDesktop = useNotificacoesDesktopMode();

  useEffect(() => {
    let componenteAtivo = true;

    async function carregarDados() {
      let manterCarregando = false;
      let usuarioAutenticado = false;
      let usuarioAtualId = "";

      try {
        const { data: dadosUsuario, error: erroUsuario } =
          await supabase.auth.getUser();

        if (!componenteAtivo) {
          return;
        }

        if (erroUsuario || !dadosUsuario.user) {
          manterCarregando = true;
          router.replace(criarLoginHrefNotificacoes());
          return;
        }

        usuarioAtualId = dadosUsuario.user.id;
        usuarioAutenticado = true;
        const obrasLocais = carregarObras(usuarioAtualId);
        const notificacoesLocais = carregarNotificacoes(usuarioAtualId);
        const obrasSupabase = await carregarObrasPublicadasSupabase();
        const estadoSupabase = await carregarEstadoSupabaseNotificacoes(
          carregarNotificacoesDiretasSupabase
        );
        const notificacoesDiretasSupabase = estadoSupabase?.notificacoesDiretas || [];
        const obrasDiretasSupabase =
          await carregarObrasDasNotificacoesDiretasSupabase(
            notificacoesDiretasSupabase
          );
        const idsNotificacoesApagadas =
          carregarIdsNotificacoesApagadas(usuarioAtualId);
        const obrasMescladas = mesclarObrasPorIdSlug(obrasLocais, [
          ...obrasSupabase,
          ...obrasDiretasSupabase,
        ]);
        const obrasSeguidasLocais = lerIdsLocalStorage(
          CHAVE_OBRAS_SEGUIDAS,
          usuarioAtualId
        );
        const obrasSeguidasIds = Array.from(
          new Set([
            ...obrasSeguidasLocais,
            ...(estadoSupabase?.obrasSeguidasIds || []),
          ])
        );
        const idsSeguidos = new Set(
          obrasSeguidasIds
            .map((id) => id.trim())
            .filter((id) => Boolean(id))
        );
        const obrasPorIdMescladas = new Map(
          obrasMescladas.map((obra) => [obra.id, obra])
        );
        const notificacoesLocaisFiltradas = notificacoesLocais.filter(
          (notificacao) =>
            !notificacaoEhCapitulo(notificacao) ||
            notificacaoCapituloPertenceAObraSeguida(
              notificacao,
              obrasPorIdMescladas,
              idsSeguidos,
              usuarioAtualId
            )
        );
        const notificacoesLidasIds = estadoSupabase?.notificacoesLidasIds || [];
        const notificacoesCapitulosSupabase = criarNotificacoesDeCapitulos(
          obrasMescladas,
          obrasSeguidasIds,
          notificacoesLidasIds,
          usuarioAtualId
        );
        const [
          notificacoesComunidadeSupabase,
          notificacoesDiarioSupabase,
          notificacoesProblemasTecnicosSupabase,
        ] = await Promise.all([
          carregarNotificacoesComunidadeSupabase(
            usuarioAtualId,
            notificacoesLidasIds
          ),
          carregarNotificacoesDiarioSupabase(
            usuarioAtualId,
            notificacoesLidasIds
          ),
          carregarNotificacoesProblemasTecnicosSupabase(
            usuarioAtualId,
            notificacoesLidasIds
          ),
        ]);
        const notificacoesMescladas = filtrarNotificacoesApagadas(
          mesclarNotificacoes(notificacoesLocaisFiltradas, [
            ...notificacoesCapitulosSupabase,
            ...notificacoesDiretasSupabase,
            ...notificacoesComunidadeSupabase,
            ...notificacoesDiarioSupabase,
            ...notificacoesProblemasTecnicosSupabase,
          ]),
          idsNotificacoesApagadas
        ).map((notificacao) => prepararNotificacaoTexto(notificacao));

        try {
          salvarJsonStorageUsuarioNotificacoes(
            CHAVE_OBRAS,
            usuarioAtualId,
            obrasMescladas
          );
          salvarNotificacoes(notificacoesMescladas, usuarioAtualId);
        } catch {
          // Se o navegador bloquear localStorage, a página continua com o estado em memória.
        }

        if (!componenteAtivo) {
          return;
        }

        setUsuarioNotificacoesId(usuarioAtualId);
        setObras(obrasMescladas);
        setNotificacoes(notificacoesMescladas);
        definirNotificacoesNaoLidas(
          notificacoesMescladas.filter((notificacao) => !notificacao.lida).length
        );
      } catch {
        if (!componenteAtivo) {
          return;
        }

        if (!usuarioAutenticado || !usuarioAtualId) {
          manterCarregando = true;
          router.replace(criarLoginHrefNotificacoes());
          return;
        }

        const obrasLocais = carregarObras(usuarioAtualId);
        const notificacoesLocais = carregarNotificacoes(usuarioAtualId);

        setUsuarioNotificacoesId(usuarioAtualId);
        setObras(obrasLocais);
        setNotificacoes(notificacoesLocais);
        definirNotificacoesNaoLidas(
          notificacoesLocais.filter((notificacao) => !notificacao.lida).length
        );
      } finally {
        if (componenteAtivo && !manterCarregando) {
          setCarregando(false);
        }
      }
    }

    void carregarDados();

    return () => {
      componenteAtivo = false;
    };
  }, [router, definirNotificacoesNaoLidas]);


  const obrasPorId = useMemo(() => {
    return new Map(obras.map((obra) => [obra.id, obra]));
  }, [obras]);

  const totalNotificacoes = notificacoes.length;

  const totalNaoLidas = useMemo(() => {
    return notificacoes.filter((notificacao) => !notificacao.lida).length;
  }, [notificacoes]);

  const totalLidas = Math.max(totalNotificacoes - totalNaoLidas, 0);
  const termoBusca = normalizarTexto(busca);

  const acessoConteudo18Liberado = acessoConteudo18Confirmado();

  const notificacoesFiltradas = useMemo(() => {
    return filtrarEOrdenarNotificacoes({
      notificacoes,
      obrasPorId,
      termoBusca,
      filtro,
      ordenacao,
      acessoConteudo18Liberado,
    });
  }, [
    notificacoes,
    obrasPorId,
    termoBusca,
    filtro,
    ordenacao,
    acessoConteudo18Liberado,
  ]);

  const filtrosAtivos = Boolean(
    busca.trim() || filtro !== "todas" || ordenacao !== "recentes"
  );

  const opcoesFiltro: Array<{ valor: FiltroNotificacao; rotulo: string }> = [
    { valor: "todas", rotulo: "Todas" },
    { valor: "nao-lidas", rotulo: "Novas" },
    { valor: "lidas", rotulo: "Lidas" },
    { valor: "capitulos", rotulo: "Capítulos" },
    { valor: "comunidade", rotulo: "Comunidade" },
  ];

  const opcoesOrdenacao: Array<{ valor: OrdenacaoNotificacao; rotulo: string }> = [
    { valor: "recentes", rotulo: "Mais recentes" },
    { valor: "antigas", rotulo: "Mais antigas" },
  ];

  function encontrarObra(obraId: string) {
    return obrasPorId.get(obraId) || null;
  }

  function encontrarCapitulo(obraId: string, capituloId: string) {
    const obra = encontrarObra(obraId);

    if (!obra) {
      return null;
    }

    return obra.capitulos.find((capitulo) => capitulo.id === capituloId) || null;
  }

  function atualizarNotificacoes(novasNotificacoes: NotificacaoLocal[]) {
    const notificacoesNormalizadas = mesclarNotificacoes(
      [],
      novasNotificacoes
    ).map((notificacao) => prepararNotificacaoTexto(notificacao));

    setNotificacoes(notificacoesNormalizadas);
    definirNotificacoesNaoLidas(
      notificacoesNormalizadas.filter((notificacao) => !notificacao.lida).length
    );
    salvarNotificacoes(notificacoesNormalizadas, usuarioNotificacoesId);
  }

  function marcarComoLida(id: string) {
    const notificacaoAtual = notificacoes.find((notificacao) => notificacao.id === id);
    const novasNotificacoes = notificacoes.map((notificacao) => {
      if (notificacao.id !== id) {
        return notificacao;
      }

      return {
        ...notificacao,
        lida: true,
      };
    });

    atualizarNotificacoes(novasNotificacoes);

    if (notificacaoAtual) {
      void sincronizarNotificacaoLidaSupabase(notificacaoAtual, true, usuarioNotificacoesId);
    }
  }

  function marcarComoNaoLida(id: string) {
    const notificacaoAtual = notificacoes.find((notificacao) => notificacao.id === id);
    const novasNotificacoes = notificacoes.map((notificacao) => {
      if (notificacao.id !== id) {
        return notificacao;
      }

      return {
        ...notificacao,
        lida: false,
      };
    });

    atualizarNotificacoes(novasNotificacoes);

    if (notificacaoAtual) {
      void sincronizarNotificacaoLidaSupabase(notificacaoAtual, false, usuarioNotificacoesId);
    }
  }

  function abrirNotificacao(id: string) {
    marcarComoLida(id);
  }

  async function responderSolicitacaoSeguidorNotificacao(
    notificacao: NotificacaoLocal,
    aceitar: boolean
  ) {
    const solicitacaoId = notificacao.solicitacaoId?.trim() || "";

    if (
      !solicitacaoId ||
      !idObraSupabaseValido(solicitacaoId) ||
      solicitacaoRespondendoId
    ) {
      return;
    }

    setSolicitacaoRespondendoId(solicitacaoId);

    try {
      const { data, error } = await supabase.rpc(
        "responder_solicitacao_seguidor",
        {
          p_solicitacao_id: solicitacaoId,
          p_aceitar: aceitar,
        }
      );

      if (error || (data !== "aceita" && data !== "recusada")) {
        window.alert(
          error?.message || "Não foi possível responder esta solicitação."
        );
        return;
      }

      const notificacoesRelacionadas = notificacoes.filter(
        (notificacaoAtual) =>
          notificacaoAtual.tipo === "solicitacao-seguidor" &&
          (notificacaoAtual.solicitacaoId?.trim() === solicitacaoId ||
            notificacoesRepresentamMesmoEvento(
              notificacaoAtual,
              notificacao
            ))
      );
      const idsRelacionados = new Set(
        notificacoesRelacionadas.map((notificacaoAtual) =>
          notificacaoAtual.id.trim()
        )
      );

      registrarNotificacoesApagadas(
        usuarioNotificacoesId,
        Array.from(idsRelacionados)
      );
      atualizarNotificacoes(
        notificacoes.filter(
          (notificacaoAtual) => !idsRelacionados.has(notificacaoAtual.id.trim())
        )
      );

      if (notificacoesRelacionadas.length > 0) {
        void apagarNotificacoesSupabase(
          notificacoesRelacionadas,
          usuarioNotificacoesId
        );
      }

      fecharMenuNotificacao();
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "Não foi possível responder esta solicitação."
      );
    } finally {
      setSolicitacaoRespondendoId("");
    }
  }

  function marcarTodasComoLidas() {
    const notificacoesParaSincronizar = notificacoes.filter(
      (notificacao) => !notificacao.lida
    );
    const novasNotificacoes = notificacoes.map((notificacao) => ({
      ...notificacao,
      lida: true,
    }));

    atualizarNotificacoes(novasNotificacoes);
    void sincronizarNotificacoesLidasSupabase(
      notificacoesParaSincronizar,
      true,
      usuarioNotificacoesId
    );
  }

  function marcarFiltradasComoLidas() {
    const idsFiltrados = new Set(
      notificacoesFiltradas.map((notificacao) => notificacao.id)
    );
    const notificacoesParaSincronizar = notificacoes.filter((notificacao) => {
      return idsFiltrados.has(notificacao.id) && !notificacao.lida;
    });

    const novasNotificacoes = notificacoes.map((notificacao) => {
      if (!idsFiltrados.has(notificacao.id)) {
        return notificacao;
      }

      return {
        ...notificacao,
        lida: true,
      };
    });

    atualizarNotificacoes(novasNotificacoes);
    void sincronizarNotificacoesLidasSupabase(
      notificacoesParaSincronizar,
      true,
      usuarioNotificacoesId
    );
  }

  function apagarNotificacao(id: string) {
    const notificacaoAtual = notificacoes.find((notificacao) => notificacao.id === id);
    const novasNotificacoes = notificacoes.filter((notificacao) => {
      return notificacao.id !== id;
    });

    if (notificacaoAtual) {
      registrarNotificacoesApagadas(usuarioNotificacoesId, [notificacaoAtual.id]);
    }

    atualizarNotificacoes(novasNotificacoes);

    if (notificacaoAtual) {
      void apagarNotificacaoSupabase(notificacaoAtual, usuarioNotificacoesId);
    }
  }

  function limparTodas() {
    const notificacoesParaApagar = [...notificacoes];

    registrarNotificacoesApagadas(
      usuarioNotificacoesId,
      notificacoesParaApagar.map((notificacao) => notificacao.id)
    );
    atualizarNotificacoes([]);
    void apagarNotificacoesSupabase(
      notificacoesParaApagar,
      usuarioNotificacoesId
    );
  }

  function limparLidas() {
    const notificacoesLidas = notificacoes.filter((notificacao) => notificacao.lida);
    const novasNotificacoes = notificacoes.filter(
      (notificacao) => !notificacao.lida
    );

    registrarNotificacoesApagadas(
      usuarioNotificacoesId,
      notificacoesLidas.map((notificacao) => notificacao.id)
    );
    atualizarNotificacoes(novasNotificacoes);
    void excluirNotificacoesLidasSupabase(usuarioNotificacoesId).then((excluiu) => {
      if (!excluiu) {
        void apagarNotificacoesSupabase(
          notificacoesLidas,
          usuarioNotificacoesId
        );
      }
    });
  }

  function alternarMenuNotificacao(id: string) {
    setMostrarPainelOrdenacao(false);
    setMenuNotificacaoAbertoId((idAtual) => (idAtual === id ? "" : id));
  }

  function fecharMenuNotificacao() {
    setMenuNotificacaoAbertoId("");
  }

  function fecharMenusNotificacoes() {
    setMenuNotificacaoAbertoId("");
    setMostrarPainelOrdenacao(false);
  }

  function limparFiltros() {
    fecharMenusNotificacoes();
    setBusca("");
    setBuscaTopoAberta(false);
    setFiltro("todas");
    setOrdenacao("recentes");
  }

  const notificacaoMenuAberta = menuNotificacaoAbertoId
    ? notificacoes.find((notificacao) => notificacao.id === menuNotificacaoAbertoId) || null
    : null;

  const menuOverlayAberto = Boolean(
    mostrarPainelOrdenacao || notificacaoMenuAberta
  );
  useNotificacoesOverlayBodyLock(menuOverlayAberto);

  if (carregando) {
    return (
      <NotificacoesPageShell
        isDesktop={isDesktop}
        pageThemeStyle={pageThemeStyle}
      >
        <NotificacoesLoadingSpinner
          label="Carregando notificações"
          pageStyle={loadingPageStyle}
          spinnerStyle={loadingSpinnerStyle}
        />
      </NotificacoesPageShell>
    );
  }

  return (
    <NotificacoesPageShell
      isDesktop={isDesktop}
      pageThemeStyle={pageThemeStyle}
    >
      <section style={isDesktop ? desktopContainerStyle : containerStyle}>
        <section style={notificacoesTopFilterBoxStyle}>
          <NotificacoesTopControls
            isDesktop={isDesktop}
            busca={busca}
            buscaTopoAberta={buscaTopoAberta}
            mostrarPainelOrdenacao={mostrarPainelOrdenacao}
            onBuscaChange={(proximaBusca) => {
              fecharMenusNotificacoes();
              setBusca(proximaBusca);
            }}
            onAlternarPainelOrdenacao={() => {
              fecharMenusNotificacoes();
              setMostrarPainelOrdenacao((aberto) => !aberto);
            }}
            onAbrirBusca={() => {
              fecharMenusNotificacoes();
              setBuscaTopoAberta(true);
            }}
            onFecharBusca={() => {
              fecharMenusNotificacoes();
              setBusca("");
              setBuscaTopoAberta(false);
            }}
          />
        </section>

        {totalNotificacoes > 0 && filtrosAtivos && (
          <section
            style={
              isDesktop
                ? desktopNotificationsControlsStyle
                : notificationsControlsStyle
            }
          >
            <button
              type="button"
              onClick={limparFiltros}
              style={notificationClearButtonStyle}
            >
              Limpar busca e filtros
            </button>
          </section>
        )}

        {mostrarPainelOrdenacao && (
          <NotificacoesSortingSheet
            isDesktop={isDesktop}
            filtro={filtro}
            ordenacao={ordenacao}
            opcoesFiltro={opcoesFiltro}
            opcoesOrdenacao={opcoesOrdenacao}
            totalNotificacoes={notificacoes.length}
            totalNotificacoesFiltradas={notificacoesFiltradas.length}
            totalLidas={totalLidas}
            onClose={() => setMostrarPainelOrdenacao(false)}
            onFiltroChange={(proximoFiltro) => {
              setFiltro(proximoFiltro);
              setMostrarPainelOrdenacao(false);
            }}
            onOrdenacaoChange={(proximaOrdenacao) => {
              setOrdenacao(proximaOrdenacao);
              setMostrarPainelOrdenacao(false);
            }}
            onMarcarTodasComoLidas={() => {
              marcarTodasComoLidas();
              setMostrarPainelOrdenacao(false);
            }}
            onMarcarFiltradasComoLidas={() => {
              marcarFiltradasComoLidas();
              setMostrarPainelOrdenacao(false);
            }}
            onLimparLidas={() => {
              limparLidas();
              setMostrarPainelOrdenacao(false);
            }}
            onLimparTodas={() => {
              limparTodas();
              setMostrarPainelOrdenacao(false);
            }}
          />
        )}

        <NotificacoesFeed
          isDesktop={isDesktop}
          notificacoes={notificacoes}
          notificacoesFiltradas={notificacoesFiltradas}
          menuNotificacaoAbertoId={menuNotificacaoAbertoId}
          solicitacaoRespondendoId={solicitacaoRespondendoId}
          encontrarObra={encontrarObra}
          encontrarCapitulo={encontrarCapitulo}
          onAlternarMenuNotificacao={alternarMenuNotificacao}
          onResponderSolicitacaoSeguidor={(notificacao, aceitar) => {
            void responderSolicitacaoSeguidorNotificacao(notificacao, aceitar);
          }}
        />

        {notificacaoMenuAberta && (
          <NotificacoesActionsSheet
            isDesktop={isDesktop}
            notificacaoOriginal={notificacaoMenuAberta}
            encontrarObra={encontrarObra}
            solicitacaoRespondendoId={solicitacaoRespondendoId}
            onClose={fecharMenuNotificacao}
            onAbrirNotificacao={abrirNotificacao}
            onResponderSolicitacaoSeguidor={(notificacao, aceitar) => {
              void responderSolicitacaoSeguidorNotificacao(notificacao, aceitar);
            }}
            onMarcarComoLida={marcarComoLida}
            onMarcarComoNaoLida={marcarComoNaoLida}
            onApagarNotificacao={apagarNotificacao}
          />
        )}
      </section>
    </NotificacoesPageShell>
  );
}
