"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase/client";
import { formatarData } from "../../../lib/utils";
import {
  historietasThemeCss,
  useHistorietasTheme,
} from "../../../lib/historietasTheme";
import { useNotificacoes } from "../../../components/NotificacoesProvider";
import { useHistorietasLanguage } from "../../../components/HistorietasLanguageProvider";
import { useAdminComunidadeDesktopMode } from "./hooks/use-admin-comunidade-desktop-mode";
import { adminComunidadePageCss } from "./lib/admin-comunidade-page-css";
import {
  pageStyle,
  containerStyle,
  desktopContainerStyle,
  titleHeaderStyle,
  desktopTitleHeaderStyle,
  titleHeaderActionsStyle,
  desktopTechnicalSupportButtonStyle,
  mobileTechnicalSupportButtonStyle,
  desktopNotificationButtonStyle,
  desktopNotificationBadgeStyle,
  titleSearchButtonStyle,
  mobileTopWaterFadeStyle,
  desktopTopWaterFadeStyle,
  statsGridStyle,
  statCardStyle,
  statNumberStyle,
  statLabelStyle,
  toolsStyle,
  adminSearchShellStyle,
  adminSearchIconStyle,
  adminSearchInputStyle,
  adminFilterLabelButtonStyle,
  adminFilterActionIconStyle,
  statusFilterWrapStyle,
  filterButtonsStyle,
  filterButtonStyle,
  activeFilterButtonStyle,
  feedbackWrapStyle,
  errorStyle,
  successStyle,
  summaryStyle,
  summaryTitleStyle,
  clearButtonStyle,
  listStyle,
  reportCardStyle,
  reportHeaderStyle,
  reportTitleWrapStyle,
  reportMetaLineStyle,
  reportDotStyle,
  targetBadgeStyle,
  postTargetBadgeStyle,
  commentTargetBadgeStyle,
  reportTitleStyle,
  reportDateStyle,
  statusInlineStyle,
  archivedInlineStyle,
  reportHeaderRightStyle,
  reportMenuWrapStyle,
  reportMenuButtonStyle,
  adminFiltersSheetOverlayStyle,
  adminFiltersSheetBackdropStyle,
  adminFiltersSheetStyle,
  adminFiltersSheetHandleStyle,
  adminFiltersSheetTitleStyle,
  adminFiltersSheetSectionLabelStyle,
  adminFiltersSheetOptionStyle,
  adminFiltersSheetOptionActiveStyle,
  adminFiltersSheetRadioStyle,
  adminFiltersSheetRadioActiveStyle,
  adminFiltersSheetClearButtonStyle,
  reportMenuOverlayStyle,
  reportMenuBackdropStyle,
  reportMenuStyle,
  reportMenuHandleStyle,
  reportMenuTitleStyle,
  reportMenuItemStyle,
  reportMenuItemLinkStyle,
  reportMenuItemActiveStyle,
  reportMenuDangerItemStyle,
  reportMenuDividerStyle,
  reportBodyStyle,
  contentBoxStyle,
  sectionHeaderLineStyle,
  sectionHintStyle,
  boxLabelStyle,
  adminObservationLabelStyle,
  reportedTextStyle,
  reportedTextCompactStyle,
  metaGridStyle,
  metaItemStyle,
  recurrenceMetaItemStyle,
  spoilerMetaItemStyle,
  reasonGridStyle,
  reasonItemStyle,
  detailTextStyle,
  mutedTextStyle,
  adminNoteStyle,
  textareaStyle,
  analysisMetaStyle,
} from "./lib/admin-comunidade-styles";
import {
  criarHrefDiarioDenunciado,
  criarLoginHrefAdminModeracao,
} from "./lib/admin-comunidade-route-utils";
import {
  type StatusDenuncia,
  type StatusDenunciaPerfil,
  STATUS_DENUNCIAS,
  STATUS_DENUNCIAS_PERFIS,
  STATUS_LABEL,
  STATUS_PERFIL_LABEL,
} from "./lib/admin-comunidade-status-utils";
import {
  type TipoAlvoDenuncia,
  formatarMotivoDenunciaPerfil,
  rotuloRemocaoAlvoDenuncia,
  rotuloSucessoRemocaoAlvo,
  rotuloTipoAlvoDenuncia,
} from "./lib/admin-comunidade-report-label-utils";
import {
  criarMensagemErro,
} from "./lib/admin-comunidade-error-utils";
import { criarMapaNomesPerfisModeracao } from "./lib/admin-comunidade-profile-utils";
import {
  localeAdminComunidade,
  textoConfirmacaoRemocaoAdminComunidade,
} from "./lib/admin-comunidade-text-utils";
import { conteudoDenunciadoIndisponivel } from "./lib/admin-comunidade-content-utils";
import { buscarReincidenciasModeracao } from "./loaders/carregar-reincidencias-moderacao";
import {
  buscarDenunciasPerfisModeracao,
  type DenunciaPerfilComContexto,
} from "./loaders/carregar-denuncias-perfis-moderacao";
import {
  buscarDenunciasBaseModeracao,
  type DenunciaComunidade,
} from "./loaders/carregar-denuncias-base-moderacao";
import {
  type StatusFiltroDenuncia,
  filtrarDenunciasModeracao,
  filtrarDenunciasPerfisModeracao,
  obterDenunciasAtivas,
} from "./lib/admin-comunidade-filter-utils";
import { calcularTotaisModeracao } from "./lib/admin-comunidade-stats-utils";
import { AdminComunidadeLanguageBridge } from "./components/admin-comunidade-language-bridge";

type DenunciaComContexto = DenunciaComunidade & {
  denuncianteNome: string;
  alvoResumo: string;
  alvoAutor: string;
  alvoData: string;
  alvoPostId: string;
  alvoCategoria?: string;
  alvoTipoPublicacao?: string;
  alvoTemSpoiler?: boolean;
  alvoObra?: string;
  alvoCapituloId?: string;
  alvoObraId?: string;
  alvoObraSlug?: string;
  alvoCapituloTitulo?: string;
  alvoPerfilUserId?: string;
  alvoAnotacaoId?: string;
};

export default function AdminComunidadePage() {
  const { language } = useHistorietasLanguage();
  const [carregando, setCarregando] = useState(true);
  const [usuarioId, setUsuarioId] = useState("");
  const [ehAdmin, setEhAdmin] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [denuncias, setDenuncias] = useState<DenunciaComContexto[]>([]);
  const [denunciasPerfis, setDenunciasPerfis] = useState<DenunciaPerfilComContexto[]>([]);
  const [reincidenciasPorUsuario, setReincidenciasPorUsuario] = useState<Record<string, number>>({});
  const [statusFiltro, setStatusFiltro] = useState<StatusFiltroDenuncia>(
    "todas"
  );
  const [busca, setBusca] = useState("");
  const [buscaModeracaoAberta, setBuscaModeracaoAberta] = useState(false);
  const [mostrarFiltrosModeracao, setMostrarFiltrosModeracao] = useState(false);
  const [acaoEmAndamento, setAcaoEmAndamento] = useState("");
  const [observacoes, setObservacoes] = useState<Record<string, string>>({});
  const [menuDenunciaAbertoId, setMenuDenunciaAbertoId] = useState("");
  const isDesktop = useAdminComunidadeDesktopMode();
  const router = useRouter();
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);
  const { notificacoesNaoLidas } = useNotificacoes();



  async function carregarDenuncias() {
    setErro("");

    const denunciasMapeadas = await buscarDenunciasBaseModeracao();

    const idsPorTipo = <T extends TipoAlvoDenuncia>(tipo: T) =>
      Array.from(
        new Set(
          denunciasMapeadas
            .filter((denuncia) => denuncia.alvoTipo === tipo)
            .map((denuncia) => denuncia.alvoId)
            .filter(Boolean)
        )
      );

    const postIds = idsPorTipo("post");
    const comentarioIds = idsPorTipo("comentario");
    const comentarioCapituloIds = idsPorTipo("comentario_capitulo");
    const obraIdsDenunciadas = idsPorTipo("obra");
    const capituloIdsDenunciados = idsPorTipo("capitulo");
    const comentarioObraIds = idsPorTipo("comentario_obra");
    const diarioAnotacaoIds = idsPorTipo("diario_anotacao");
    const comentarioDiarioIds = idsPorTipo("comentario_diario");

    const [
      postsResposta,
      comentariosResposta,
      comentariosCapitulosResposta,
      comentariosObrasResposta,
      comentariosDiarioResposta,
    ] = await Promise.all([
      postIds.length > 0
        ? supabase
            .from("comunidade_posts")
            .select(
              "id, autor_nome, categoria, tipo_publicacao, tem_spoiler, texto, obra_relacionada, criado_em"
            )
            .in("id", postIds)
            .limit(500)
        : Promise.resolve({ data: [], error: null }),
      comentarioIds.length > 0
        ? supabase
            .from("comunidade_comentarios")
            .select("id, post_id, autor_nome, texto, criado_em")
            .in("id", comentarioIds)
            .limit(500)
        : Promise.resolve({ data: [], error: null }),
      comentarioCapituloIds.length > 0
        ? supabase
            .from("comentarios_capitulos")
            .select("id, capitulo_id, user_id, comentario, criado_em")
            .in("id", comentarioCapituloIds)
            .limit(500)
        : Promise.resolve({ data: [], error: null }),
      comentarioObraIds.length > 0
        ? supabase
            .from("comentarios_obras")
            .select("id, obra_id, user_id, comentario, criado_em")
            .in("id", comentarioObraIds)
            .limit(500)
        : Promise.resolve({ data: [], error: null }),
      comentarioDiarioIds.length > 0
        ? supabase
            .from("diario_anotacao_comentarios")
            .select(
              "id, anotacao_id, user_id, texto, criado_em, atualizado_em"
            )
            .in("id", comentarioDiarioIds)
            .limit(500)
        : Promise.resolve({ data: [], error: null }),
    ]);

    const posts = postsResposta.error
      ? []
      : (postsResposta.data || []);
    const comentarios = comentariosResposta.error
      ? []
      : (comentariosResposta.data || []);
    const comentariosCapitulos = comentariosCapitulosResposta.error
      ? []
      : (comentariosCapitulosResposta.data ||
          []);
    const comentariosObras = comentariosObrasResposta.error
      ? []
      : (comentariosObrasResposta.data ||
          []);
    const comentariosDiario = comentariosDiarioResposta.error
      ? []
      : (comentariosDiarioResposta.data ||
          []);

    const diarioAnotacaoIdsContexto = Array.from(
      new Set([
        ...diarioAnotacaoIds,
        ...comentariosDiario
          .map((comentario) => comentario.anotacao_id)
          .filter(Boolean),
      ])
    );

    const {
      data: diarioAnotacoesResposta,
      error: diarioAnotacoesErro,
    } =
      diarioAnotacaoIdsContexto.length > 0
        ? await supabase
            .from("diario_anotacoes")
            .select(
              "id, obra_id, user_id, tipo, texto, visibilidade, contem_spoiler, criado_em, atualizado_em"
            )
            .in("id", diarioAnotacaoIdsContexto)
            .limit(500)
        : { data: [], error: null };

    const diarioAnotacoes = diarioAnotacoesErro
      ? []
      : (diarioAnotacoesResposta ||
          []);

    const capituloIdsContexto = Array.from(
      new Set([
        ...capituloIdsDenunciados,
        ...comentariosCapitulos
          .map((comentario) => comentario.capitulo_id)
          .filter(Boolean),
      ])
    );

    const { data: capitulosResposta, error: capitulosErro } =
      capituloIdsContexto.length > 0
        ? await supabase
            .from("capitulos")
            .select(
              "id, obra_id, user_id, titulo, texto, ordem, publicado, criado_em"
            )
            .in("id", capituloIdsContexto)
            .limit(500)
        : { data: [], error: null };

    const capitulos = capitulosErro
      ? []
      : (capitulosResposta || []);

    const obraIdsContexto = Array.from(
      new Set([
        ...obraIdsDenunciadas,
        ...capitulos.map((capitulo) => capitulo.obra_id).filter(Boolean),
        ...comentariosObras
          .map((comentario) => comentario.obra_id)
          .filter(Boolean),
        ...diarioAnotacoes
          .map((anotacao) => anotacao.obra_id)
          .filter(Boolean),
      ])
    );

    const { data: obrasResposta, error: obrasErro } =
      obraIdsContexto.length > 0
        ? await supabase
            .from("obras")
            .select(
              "id, user_id, titulo, autor, slug, link, publicado, criada_em"
            )
            .in("id", obraIdsContexto)
            .limit(500)
        : { data: [], error: null };

    const obras = obrasErro
      ? []
      : (obrasResposta || []);

    const perfilIds = Array.from(
      new Set(
        [
          ...denunciasMapeadas.map((denuncia) => denuncia.denuncianteId),
          ...comentariosCapitulos.map((comentario) => comentario.user_id),
          ...comentariosObras.map((comentario) => comentario.user_id),
          ...comentariosDiario.map((comentario) => comentario.user_id),
          ...diarioAnotacoes.map((anotacao) => anotacao.user_id),
          ...capitulos.map((capitulo) => capitulo.user_id),
          ...obras.map((obra) => obra.user_id),
        ].filter(Boolean)
      )
    );

    const [perfisPorUserIdResposta, perfisPorIdResposta] = await Promise.all([
      perfilIds.length > 0
        ? supabase
            .from("profiles")
            .select("id, user_id, nome")
            .in("user_id", perfilIds)
            .limit(1000)
        : Promise.resolve({ data: [], error: null }),
      perfilIds.length > 0
        ? supabase
            .from("profiles")
            .select("id, user_id, nome")
            .in("id", perfilIds)
            .limit(1000)
        : Promise.resolve({ data: [], error: null }),
    ]);

    const perfis = [
  ...(perfisPorUserIdResposta.error
    ? []
    : (perfisPorUserIdResposta.data || [])),
  ...(perfisPorIdResposta.error
    ? []
    : (perfisPorIdResposta.data || [])),
];

const perfisPorId = criarMapaNomesPerfisModeracao(perfis);
    const postsPorId = new Map(posts.map((post) => [post.id, post]));
    const comentariosPorId = new Map(
      comentarios.map((comentario) => [comentario.id, comentario])
    );
    const comentariosCapitulosPorId = new Map(
      comentariosCapitulos.map((comentario) => [comentario.id, comentario])
    );
    const comentariosObrasPorId = new Map(
      comentariosObras.map((comentario) => [comentario.id, comentario])
    );
    const comentariosDiarioPorId = new Map(
      comentariosDiario.map((comentario) => [comentario.id, comentario])
    );
    const diarioAnotacoesPorId = new Map(
      diarioAnotacoes.map((anotacao) => [anotacao.id, anotacao])
    );
    const capitulosPorId = new Map(
      capitulos.map((capitulo) => [capitulo.id, capitulo])
    );
    const obrasPorId = new Map(obras.map((obra) => [obra.id, obra]));

    const nomeDenunciante = (denuncia: DenunciaComunidade) =>
      perfisPorId.get(denuncia.denuncianteId) || "Usuário";

    const denunciasComContexto: DenunciaComContexto[] =
      denunciasMapeadas.map((denuncia) => {
        if (denuncia.alvoTipo === "post") {
          const post = postsPorId.get(denuncia.alvoId);

          return {
            ...denuncia,
            denuncianteNome: nomeDenunciante(denuncia),
            alvoResumo:
              post?.texto || "Publicação não encontrada ou removida.",
            alvoAutor: post?.autor_nome || "Autor não encontrado",
            alvoData: post?.criado_em || "",
            alvoPostId: post?.id || denuncia.alvoId,
            alvoCategoria: post?.categoria || "",
            alvoTipoPublicacao: post?.tipo_publicacao || "Discussão",
            alvoTemSpoiler: Boolean(post?.tem_spoiler),
            alvoObra: post?.obra_relacionada || "",
          };
        }

        if (denuncia.alvoTipo === "comentario") {
          const comentario = comentariosPorId.get(denuncia.alvoId);

          return {
            ...denuncia,
            denuncianteNome: nomeDenunciante(denuncia),
            alvoResumo:
              comentario?.texto ||
              "Comentário não encontrado ou removido.",
            alvoAutor: comentario?.autor_nome || "Autor não encontrado",
            alvoData: comentario?.criado_em || "",
            alvoPostId: comentario?.post_id || "",
          };
        }

        if (denuncia.alvoTipo === "comentario_capitulo") {
          const comentario = comentariosCapitulosPorId.get(denuncia.alvoId);
          const capitulo = comentario
            ? capitulosPorId.get(comentario.capitulo_id)
            : undefined;
          const obra = capitulo
            ? obrasPorId.get(capitulo.obra_id)
            : undefined;

          return {
            ...denuncia,
            denuncianteNome: nomeDenunciante(denuncia),
            alvoResumo:
              comentario?.comentario ||
              "Comentário de capítulo não encontrado ou removido.",
            alvoAutor: comentario
              ? perfisPorId.get(comentario.user_id) ||
                "Autor não encontrado"
              : "Autor não encontrado",
            alvoData: comentario?.criado_em || "",
            alvoPostId: "",
            alvoObra: obra?.titulo?.trim() || "",
            alvoObraId: obra?.id || capitulo?.obra_id || "",
            alvoObraSlug: obra?.slug?.trim() || "",
            alvoCapituloId: comentario?.capitulo_id || "",
            alvoCapituloTitulo: capitulo?.titulo?.trim() || "",
          };
        }

        if (denuncia.alvoTipo === "obra") {
          const obra = obrasPorId.get(denuncia.alvoId);

          return {
            ...denuncia,
            denuncianteNome: nomeDenunciante(denuncia),
            alvoResumo:
              obra?.titulo?.trim() || "Obra não encontrada ou removida.",
            alvoAutor:
              obra?.autor?.trim() ||
              (obra
                ? perfisPorId.get(obra.user_id) || "Autor não encontrado"
                : "Autor não encontrado"),
            alvoData: obra?.criada_em || "",
            alvoPostId: "",
            alvoObraId: obra?.id || denuncia.alvoId,
            alvoObraSlug: obra?.slug?.trim() || "",
          };
        }

        if (denuncia.alvoTipo === "capitulo") {
          const capitulo = capitulosPorId.get(denuncia.alvoId);
          const obra = capitulo
            ? obrasPorId.get(capitulo.obra_id)
            : undefined;
          const textoCapitulo = capitulo?.texto?.trim() || "";

          return {
            ...denuncia,
            denuncianteNome: nomeDenunciante(denuncia),
            alvoResumo:
              textoCapitulo.slice(0, 5000) ||
              capitulo?.titulo?.trim() ||
              "Capítulo não encontrado ou removido.",
            alvoAutor: capitulo
              ? perfisPorId.get(capitulo.user_id) ||
                obra?.autor?.trim() ||
                "Autor não encontrado"
              : "Autor não encontrado",
            alvoData: capitulo?.criado_em || "",
            alvoPostId: "",
            alvoObra: obra?.titulo?.trim() || "",
            alvoObraId: obra?.id || capitulo?.obra_id || "",
            alvoObraSlug: obra?.slug?.trim() || "",
            alvoCapituloId: capitulo?.id || denuncia.alvoId,
            alvoCapituloTitulo: capitulo?.titulo?.trim() || "",
          };
        }

        if (denuncia.alvoTipo === "diario_anotacao") {
          const anotacao = diarioAnotacoesPorId.get(denuncia.alvoId);
          const obra = anotacao
            ? obrasPorId.get(anotacao.obra_id)
            : undefined;

          return {
            ...denuncia,
            denuncianteNome: nomeDenunciante(denuncia),
            alvoResumo:
              anotacao?.texto ||
              "Anotação do Diário não encontrada ou removida.",
            alvoAutor: anotacao
              ? perfisPorId.get(anotacao.user_id) ||
                "Autor não encontrado"
              : "Autor não encontrado",
            alvoData:
              anotacao?.atualizado_em ||
              anotacao?.criado_em ||
              "",
            alvoPostId: "",
            alvoCategoria: "Diário",
            alvoTipoPublicacao: anotacao?.tipo?.trim() || "",
            alvoTemSpoiler: Boolean(anotacao?.contem_spoiler),
            alvoObra: obra?.titulo?.trim() || "",
            alvoObraId: obra?.id || anotacao?.obra_id || "",
            alvoObraSlug: obra?.slug?.trim() || "",
            alvoPerfilUserId: anotacao?.user_id || "",
            alvoAnotacaoId: anotacao?.id || denuncia.alvoId,
          };
        }

        if (denuncia.alvoTipo === "comentario_diario") {
          const comentarioDiario = comentariosDiarioPorId.get(
            denuncia.alvoId
          );
          const anotacao = comentarioDiario
            ? diarioAnotacoesPorId.get(comentarioDiario.anotacao_id)
            : undefined;
          const obra = anotacao
            ? obrasPorId.get(anotacao.obra_id)
            : undefined;

          return {
            ...denuncia,
            denuncianteNome: nomeDenunciante(denuncia),
            alvoResumo:
              comentarioDiario?.texto ||
              "Comentário do Diário não encontrado ou removido.",
            alvoAutor: comentarioDiario
              ? perfisPorId.get(comentarioDiario.user_id) ||
                "Autor não encontrado"
              : "Autor não encontrado",
            alvoData:
              comentarioDiario?.atualizado_em ||
              comentarioDiario?.criado_em ||
              "",
            alvoPostId: "",
            alvoCategoria: "Diário",
            alvoTemSpoiler: Boolean(anotacao?.contem_spoiler),
            alvoObra: obra?.titulo?.trim() || "",
            alvoObraId: obra?.id || anotacao?.obra_id || "",
            alvoObraSlug: obra?.slug?.trim() || "",
            alvoPerfilUserId: anotacao?.user_id || "",
            alvoAnotacaoId:
              comentarioDiario?.anotacao_id ||
              anotacao?.id ||
              "",
          };
        }

        const comentarioObra = comentariosObrasPorId.get(
          denuncia.alvoId
        );
        const obra = comentarioObra
          ? obrasPorId.get(comentarioObra.obra_id)
          : undefined;

        return {
          ...denuncia,
          denuncianteNome: nomeDenunciante(denuncia),
          alvoResumo:
            comentarioObra?.comentario ||
            "Comentário da obra não encontrado ou removido.",
          alvoAutor: comentarioObra
            ? perfisPorId.get(comentarioObra.user_id) ||
              "Autor não encontrado"
            : "Autor não encontrado",
          alvoData: comentarioObra?.criado_em || "",
          alvoPostId: "",
          alvoObra: obra?.titulo?.trim() || "",
          alvoObraId: obra?.id || comentarioObra?.obra_id || "",
          alvoObraSlug: obra?.slug?.trim() || "",
        };
      });

    setDenuncias(denunciasComContexto);
    setObservacoes((observacoesAtuais) => {
      const proximasObservacoes = { ...observacoesAtuais };

      denunciasComContexto.forEach((denuncia) => {
        if (!(denuncia.id in proximasObservacoes)) {
          proximasObservacoes[denuncia.id] =
            denuncia.observacaoAdmin;
        }
      });

      return proximasObservacoes;
    });
  }

  async function carregarReincidenciasModeracao() {
    const proximoMapa = await buscarReincidenciasModeracao();
    setReincidenciasPorUsuario(proximoMapa);
  }

  async function carregarDenunciasPerfis() {
    const denunciasComContexto = await buscarDenunciasPerfisModeracao();
    setDenunciasPerfis(denunciasComContexto);
  }


  useEffect(() => {
    let cancelado = false;

    async function iniciarModeracao() {
      setCarregando(true);
      setErro("");
      setSucesso("");

      try {
        const { data: usuarioResposta, error: usuarioErro } =
          await supabase.auth.getUser();

        if (usuarioErro) {
          throw usuarioErro;
        }

        const user = usuarioResposta.user || null;

        if (!user) {
          if (!cancelado) {
            setUsuarioId("");
            setEhAdmin(false);
            setDenuncias([]);
            setDenunciasPerfis([]);
            setReincidenciasPorUsuario({});
            router.replace(criarLoginHrefAdminModeracao());
          }

          return;
        }

        const { data: adminResposta, error: adminErro } =
          await supabase.rpc("usuario_e_admin");

        if (adminErro) {
          throw adminErro;
        }

        const adminConfirmado = adminResposta === true;

        if (!cancelado) {
          setUsuarioId(user.id);
          setEhAdmin(adminConfirmado);
        }

        if (adminConfirmado) {
          await Promise.all([
            carregarDenuncias(),
            carregarDenunciasPerfis(),
            carregarReincidenciasModeracao(),
          ]);
        }
      } catch (error) {
        if (!cancelado) {
          setErro(criarMensagemErro("Erro ao carregar moderação", error));
        }
      } finally {
        if (!cancelado) {
          setCarregando(false);
        }
      }
    }

    iniciarModeracao();

    return () => {
      cancelado = true;
    };
  }, [router]);

  const denunciasAtivas = useMemo(
    () => obterDenunciasAtivas(denuncias),
    [denuncias]
  );

  const denunciasFiltradas = useMemo(
    () => filtrarDenunciasModeracao(denuncias, statusFiltro, busca),
    [busca, denuncias, statusFiltro]
  );

  const denunciasPerfisFiltradas = useMemo(
    () =>
      filtrarDenunciasPerfisModeracao(
        denunciasPerfis,
        statusFiltro,
        busca
      ),
    [busca, denunciasPerfis, statusFiltro]
  );

  useEffect(() => {
    const fecharMenuTimer = window.setTimeout(() => {
      setMenuDenunciaAbertoId("");
    }, 0);

    return () => {
      window.clearTimeout(fecharMenuTimer);
    };
  }, [busca, statusFiltro]);

  const {
    totalPendentes,
    totalEmAnalise,
    totalResolvidas,
    totalRejeitadas,
    totalPerfisPendentes,
  } = calcularTotaisModeracao(denunciasAtivas, denunciasPerfis);

  async function atualizarStatusDenunciaPerfil(
    denunciaId: string,
    novoStatus: StatusDenunciaPerfil
  ) {
    if (!usuarioId || !ehAdmin) {
      setErro("Apenas moderadores podem atualizar denúncias de perfis.");
      return;
    }

    const chaveAcao = `perfil-${denunciaId}-${novoStatus}`;

    if (acaoEmAndamento) {
      return;
    }

    setAcaoEmAndamento(chaveAcao);
    setErro("");
    setSucesso("");

    const atualizadoEm = new Date().toISOString();

    try {
      const { data, error } = await supabase
        .from("denuncias_perfis")
        .update({
          status: novoStatus,
          atualizado_em: atualizadoEm,
        })
        .eq("id", denunciaId)
        .select("id")
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data?.id) {
        throw new Error(
          "A denúncia de perfil não foi encontrada ou não pôde ser atualizada."
        );
      }

      setDenunciasPerfis((denunciasAtuais) =>
        denunciasAtuais.map((denuncia) =>
          denuncia.id === denunciaId
            ? {
                ...denuncia,
                status: novoStatus,
                atualizadoEm,
              }
            : denuncia
        )
      );

      setSucesso(
        `Denúncia de perfil marcada como ${STATUS_PERFIL_LABEL[
          novoStatus
        ].toLowerCase()}.`
      );
    } catch (error) {
      setErro(criarMensagemErro("Erro ao atualizar denúncia de perfil", error));
    } finally {
      setAcaoEmAndamento("");
    }
  }

  async function atualizarStatusDenuncia(
    denunciaId: string,
    novoStatus: StatusDenuncia
  ) {
    if (!usuarioId || !ehAdmin) {
      setErro("Apenas moderadores podem atualizar denúncias.");
      return;
    }

    const chaveAcao = `${denunciaId}-${novoStatus}`;

    if (acaoEmAndamento) {
      return;
    }

    setAcaoEmAndamento(chaveAcao);
    setErro("");
    setSucesso("");

    const observacaoAtual = observacoes[denunciaId]?.trim() || "";
    const analisadoEm = new Date().toISOString();

    try {
      const { data, error } = await supabase
        .from("comunidade_denuncias")
        .update({
          status: novoStatus,
          observacao_admin: observacaoAtual.slice(0, 800),
          analisado_por: usuarioId,
          analisado_em: analisadoEm,
        })
        .eq("id", denunciaId)
        .select("id")
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data?.id) {
        throw new Error(
          "A denúncia não foi encontrada ou não pôde ser atualizada."
        );
      }

      setDenuncias((denunciasAtuais) =>
        denunciasAtuais.map((denuncia) =>
          denuncia.id === denunciaId
            ? {
                ...denuncia,
                status: novoStatus,
                observacaoAdmin: observacaoAtual.slice(0, 800),
                analisadoPor: usuarioId,
                analisadoEm,
              }
            : denuncia
        )
      );

      setSucesso(`Denúncia marcada como ${STATUS_LABEL[novoStatus].toLowerCase()}.`);
    } catch (error) {
      setErro(criarMensagemErro("Erro ao atualizar denúncia", error));
    } finally {
      setAcaoEmAndamento("");
    }
  }

  async function removerConteudoDenunciado(denuncia: DenunciaComContexto) {
    if (!usuarioId || !ehAdmin) {
      setErro("Apenas moderadores podem remover conteúdo denunciado.");
      return;
    }

    if (
      denuncia.arquivada ||
      (denuncia.status !== "pendente" && denuncia.status !== "em_analise")
    ) {
      setErro(
        "Somente den\u00fancias ativas e n\u00e3o arquivadas podem remover conte\u00fado."
      );
      return;
    }
    if (acaoEmAndamento) {
      return;
    }

    if (
      !window.confirm(
        textoConfirmacaoRemocaoAdminComunidade(denuncia.alvoTipo, language)
      )
    ) {
      return;
    }

    const chaveAcao = `${denuncia.id}-remover-conteudo`;
    const observacaoAtual = observacoes[denuncia.id]?.trim() || "";
    const observacaoFinal =
      observacaoAtual ||
      `Conteúdo removido pela moderação em ${new Date().toLocaleDateString(
        localeAdminComunidade(language)
      )}.`;
    const analisadoEm = new Date().toISOString();

    setAcaoEmAndamento(chaveAcao);
    setErro("");
    setSucesso("");

    try {
      // A RPC executa a exclusão do conteúdo e a resolução de todas as
      // denúncias correspondentes dentro da mesma transação do PostgreSQL.
      // Se qualquer etapa falhar, nenhuma alteração é confirmada no banco.
      const { error: erroRemocaoTransacional } = await supabase.rpc(
        "remover_conteudo_denunciado_transacional",
        {
          p_alvo_tipo: denuncia.alvoTipo,
          p_alvo_id: denuncia.alvoId,
          p_observacao_admin: observacaoFinal.slice(0, 800),
        }
      );

      if (erroRemocaoTransacional) {
        throw erroRemocaoTransacional;
      }
    } catch (error) {
      setErro(criarMensagemErro("Erro ao remover conteúdo denunciado", error));
      return;
    } finally {
      setAcaoEmAndamento("");
    }

    setDenuncias((denunciasAtuais) =>
      denunciasAtuais.map((denunciaAtual) =>
        denunciaAtual.alvoTipo === denuncia.alvoTipo &&
        denunciaAtual.alvoId === denuncia.alvoId
          ? {
              ...denunciaAtual,
              status: "resolvida",
              observacaoAdmin: observacaoFinal.slice(0, 800),
              analisadoPor: usuarioId,
              analisadoEm,
              alvoResumo: `Conteúdo removido pela moderação. Registro anterior: ${denunciaAtual.alvoResumo}`,
            }
          : denunciaAtual
      )
    );

    setObservacoes((observacoesAtuais) => ({
      ...observacoesAtuais,
      [denuncia.id]: observacaoFinal.slice(0, 800),
    }));

    setSucesso(
      `${rotuloSucessoRemocaoAlvo(
        denuncia.alvoTipo
      )} e denúncia marcada como resolvida.`
    );
  }

  async function arquivarDenuncia(denunciaId: string) {
    if (!usuarioId || !ehAdmin) {
      setErro("Apenas moderadores podem arquivar denúncias.");
      return;
    }

    if (acaoEmAndamento) {
      return;
    }

    const chaveAcao = `${denunciaId}-arquivar`;

    setMenuDenunciaAbertoId("");
    setAcaoEmAndamento(chaveAcao);
    setErro("");
    setSucesso("");

    try {
      const { data, error } = await supabase
        .from("comunidade_denuncias")
        .update({ arquivada: true })
        .eq("id", denunciaId)
        .select("id")
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data?.id) {
        throw new Error(
          "A denúncia não foi encontrada ou não pôde ser arquivada."
        );
      }

      setDenuncias((denunciasAtuais) =>
        denunciasAtuais.map((denuncia) =>
          denuncia.id === denunciaId
            ? {
                ...denuncia,
                arquivada: true,
              }
            : denuncia
        )
      );

      setSucesso("Denúncia arquivada e ocultada do painel principal.");
    } catch (error) {
      setErro(criarMensagemErro("Erro ao arquivar denúncia", error));
    } finally {
      setAcaoEmAndamento("");
    }
  }

  async function restaurarDenunciaArquivada(denunciaId: string) {
    if (!usuarioId || !ehAdmin) {
      setErro("Apenas moderadores podem restaurar denúncias.");
      return;
    }

    if (acaoEmAndamento) {
      return;
    }

    const chaveAcao = `${denunciaId}-restaurar`;

    setMenuDenunciaAbertoId("");
    setAcaoEmAndamento(chaveAcao);
    setErro("");
    setSucesso("");

    try {
      const { data, error } = await supabase
        .from("comunidade_denuncias")
        .update({ arquivada: false })
        .eq("id", denunciaId)
        .select("id")
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data?.id) {
        throw new Error(
          "A denúncia não foi encontrada ou não pôde ser restaurada."
        );
      }

      setDenuncias((denunciasAtuais) =>
        denunciasAtuais.map((denuncia) =>
          denuncia.id === denunciaId
            ? {
                ...denuncia,
                arquivada: false,
              }
            : denuncia
        )
      );

      setSucesso("Denúncia restaurada para o painel principal.");
    } catch (error) {
      setErro(criarMensagemErro("Erro ao restaurar denúncia", error));
    } finally {
      setAcaoEmAndamento("");
    }
  }

  async function removerDenunciaResolvida(denunciaId: string) {
    if (!usuarioId || !ehAdmin) {
      setErro("Apenas moderadores podem remover denúncias resolvidas.");
      return;
    }

    if (acaoEmAndamento) {
      return;
    }

    const denuncia = denuncias.find((item) => item.id === denunciaId);

    if (!denuncia || denuncia.status !== "resolvida") {
      setErro("Somente denúncias resolvidas podem ser removidas do painel.");
      return;
    }

    const chaveAcao = `${denunciaId}-remover-denuncia`;

    setMenuDenunciaAbertoId("");
    setAcaoEmAndamento(chaveAcao);
    setErro("");
    setSucesso("");

    try {
      const { data, error } = await supabase
        .from("comunidade_denuncias")
        .delete()
        .eq("id", denunciaId)
        .eq("status", "resolvida")
        .select("id")
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data?.id) {
        throw new Error(
          "A denúncia resolvida não foi encontrada ou não pôde ser removida."
        );
      }

      setDenuncias((denunciasAtuais) =>
        denunciasAtuais.filter((denunciaAtual) => denunciaAtual.id !== denunciaId)
      );
      setObservacoes((observacoesAtuais) => {
        const proximasObservacoes = { ...observacoesAtuais };
        delete proximasObservacoes[denunciaId];
        return proximasObservacoes;
      });
      setSucesso("Denúncia resolvida removida do painel.");
    } catch (error) {
      setErro(criarMensagemErro("Erro ao remover denúncia resolvida", error));
    } finally {
      setAcaoEmAndamento("");
    }
  }


  async function removerDenunciaPerfilResolvida(denunciaId: string) {
    if (!usuarioId || !ehAdmin) {
      setErro("Apenas moderadores podem remover denúncias de perfis resolvidas.");
      return;
    }

    if (acaoEmAndamento) {
      return;
    }

    const denuncia = denunciasPerfis.find((item) => item.id === denunciaId);

    if (!denuncia || denuncia.status !== "resolvida") {
      setErro("Somente denúncias de perfis resolvidas podem ser removidas do painel.");
      return;
    }

    const chaveAcao = `perfil-${denunciaId}-remover-denuncia`;

    setMenuDenunciaAbertoId("");
    setAcaoEmAndamento(chaveAcao);
    setErro("");
    setSucesso("");

    try {
      const { data, error } = await supabase
        .from("denuncias_perfis")
        .delete()
        .eq("id", denunciaId)
        .eq("status", "resolvida")
        .select("id")
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data?.id) {
        throw new Error(
          "A denúncia de perfil resolvida não foi encontrada ou não pôde ser removida."
        );
      }

      setDenunciasPerfis((denunciasAtuais) =>
        denunciasAtuais.filter((denunciaAtual) => denunciaAtual.id !== denunciaId)
      );

      setSucesso("Denúncia de perfil resolvida removida do painel.");
    } catch (error) {
      setErro(criarMensagemErro("Erro ao remover denúncia de perfil resolvida", error));
    } finally {
      setAcaoEmAndamento("");
    }
  }

  function limparFiltros() {
    setStatusFiltro("todas");
    setBusca("");
    setBuscaModeracaoAberta(false);
    setMostrarFiltrosModeracao(false);
  }

  if (carregando) {
    return (
      <main data-historietas-admin-comunidade-root="true" style={pageThemeStyle}>
        <AdminComunidadeLanguageBridge />
        <style>{`${historietasThemeCss}${adminComunidadePageCss}`}</style>

        {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
        {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}
      </main>
    );
  }

  if (!usuarioId) {
    return (
      <main data-historietas-admin-comunidade-root="true" style={pageThemeStyle}>
        <AdminComunidadeLanguageBridge />
        <style>{`${historietasThemeCss}${adminComunidadePageCss}`}</style>

        {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
        {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}

        <section style={isDesktop ? desktopContainerStyle : containerStyle}>
          <p
            style={{
              margin: "10px 0 0",
              color: "#FFFFFF",
              fontSize: "12px",
              fontWeight: 800,
              textAlign: "center",
            }}
          >
            Área restrita
          </p>

          {erro && <span style={errorStyle}>{erro}</span>}
        </section>
      </main>
    );
  }

  if (!ehAdmin) {
    return (
      <main data-historietas-admin-comunidade-root="true" style={pageThemeStyle}>
        <AdminComunidadeLanguageBridge />
        <style>{`${historietasThemeCss}${adminComunidadePageCss}`}</style>

        {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
        {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}

        <section style={isDesktop ? desktopContainerStyle : containerStyle}>
          <p
            style={{
              margin: "10px 0 0",
              color: "#FFFFFF",
              fontSize: "12px",
              fontWeight: 800,
              textAlign: "center",
            }}
          >
            Acesso negado
          </p>

          {erro && <span style={errorStyle}>{erro}</span>}
        </section>
      </main>
    );
  }

  return (
    <main data-historietas-admin-comunidade-root="true" style={pageThemeStyle}>
        <AdminComunidadeLanguageBridge />
      <style>{`${historietasThemeCss}${adminComunidadePageCss}`}</style>

      {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
      {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}

      <section style={isDesktop ? desktopContainerStyle : containerStyle}>
        <header style={isDesktop ? desktopTitleHeaderStyle : titleHeaderStyle}>
          <button
            type="button"
            onClick={() => setMostrarFiltrosModeracao(true)}
            style={adminFilterLabelButtonStyle}
          >
            <span>Moderação</span>
            <span style={adminFilterActionIconStyle}>⇅</span>
          </button>

          <div style={titleHeaderActionsStyle}>
            <Link
              href="/admin/problemas-tecnicos"
              style={
                isDesktop
                  ? desktopTechnicalSupportButtonStyle
                  : mobileTechnicalSupportButtonStyle
              }
              aria-label="Abrir problemas técnicos"
              title="Problemas técnicos"
            >
              {isDesktop ? "Problemas técnicos" : "T"}
            </Link>

            <button
              type="button"
              aria-label={buscaModeracaoAberta ? "Fechar busca" : "Abrir busca"}
              aria-expanded={buscaModeracaoAberta || Boolean(busca.trim())}
              onClick={() => setBuscaModeracaoAberta((aberta) => !aberta)}
              style={titleSearchButtonStyle}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <circle
                  cx="10.85"
                  cy="10.85"
                  r="6.65"
                  stroke="currentColor"
                  strokeWidth="2.15"
                />
                <path
                  d="M16.05 16.05L20.25 20.25"
                  stroke="currentColor"
                  strokeWidth="2.15"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            {isDesktop ? (
              <Link
                href="/notificacoes"
                style={desktopNotificationButtonStyle}
                aria-label={
                  notificacoesNaoLidas > 0
                    ? `Notificações: ${notificacoesNaoLidas} não lidas`
                    : "Notificações"
                }
              >
                N

                {notificacoesNaoLidas > 0 ? (
                  <span style={desktopNotificationBadgeStyle}>
                    {notificacoesNaoLidas > 99
                      ? "99+"
                      : notificacoesNaoLidas}
                  </span>
                ) : null}
              </Link>
            ) : null}
          </div>
        </header>

        <section style={toolsStyle}>
          {(buscaModeracaoAberta || busca.trim()) && (
            <label style={adminSearchShellStyle}>
              <span style={adminSearchIconStyle}>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <circle
                    cx="10.85"
                    cy="10.85"
                    r="6.65"
                    stroke="currentColor"
                    strokeWidth="2.15"
                  />
                  <path
                    d="M16.05 16.05L20.25 20.25"
                    stroke="currentColor"
                    strokeWidth="2.15"
                    strokeLinecap="round"
                  />
                </svg>
              </span>

              <input
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                aria-label="Buscar denúncias..."
                placeholder="Buscar denúncias..."
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                maxLength={100}
                style={adminSearchInputStyle}
              />
            </label>
          )}

          <section className="admin-comunidade-stats" style={statsGridStyle}>
            <div style={statCardStyle}>
              <strong style={statNumberStyle}>{denunciasAtivas.length}</strong>
              <span style={statLabelStyle}>total</span>
            </div>

            <div style={statCardStyle}>
              <strong style={statNumberStyle}>{totalPendentes}</strong>
              <span style={statLabelStyle}>pendentes</span>
            </div>

            <div style={statCardStyle}>
              <strong style={statNumberStyle}>{totalEmAnalise}</strong>
              <span style={statLabelStyle}>em análise</span>
            </div>

            <div style={statCardStyle}>
              <strong style={statNumberStyle}>{totalResolvidas}</strong>
              <span style={statLabelStyle}>resolvidas</span>
            </div>

            <div style={statCardStyle}>
              <strong style={statNumberStyle}>{totalRejeitadas}</strong>
              <span style={statLabelStyle}>rejeitadas</span>
            </div>

            <div style={statCardStyle}>
              <strong style={statNumberStyle}>{denunciasPerfis.length}</strong>
              <span style={statLabelStyle}>perfis</span>
            </div>

            <div style={statCardStyle}>
              <strong style={statNumberStyle}>{totalPerfisPendentes}</strong>
              <span style={statLabelStyle}>perfis pend.</span>
            </div>
          </section>

          <div style={statusFilterWrapStyle}>
            <div className="admin-comunidade-filter-buttons" style={filterButtonsStyle}>
              {(["todas", ...STATUS_DENUNCIAS, "arquivadas"] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFiltro(status)}
                  style={
                    statusFiltro === status
                      ? activeFilterButtonStyle
                      : filterButtonStyle
                  }
                >
                  {status === "todas"
                    ? "Todas"
                    : status === "arquivadas"
                      ? "Arquivadas"
                      : STATUS_LABEL[status]}
                </button>
              ))}
            </div>

            {(busca || statusFiltro !== "todas") && (
              <button type="button" onClick={limparFiltros} style={clearButtonStyle}>
                Limpar filtros
              </button>
            )}
          </div>
        </section>

        {mostrarFiltrosModeracao && (
          <section
            style={adminFiltersSheetOverlayStyle}
            aria-label="Filtrar denúncias"
          >
            <button
              type="button"
              aria-label="Fechar filtros"
              onClick={() => setMostrarFiltrosModeracao(false)}
              style={adminFiltersSheetBackdropStyle}
            />

            <article style={adminFiltersSheetStyle}>
              <div style={adminFiltersSheetHandleStyle} />

              <strong style={adminFiltersSheetTitleStyle}>
                Moderação
              </strong>

              <span style={adminFiltersSheetSectionLabelStyle}>Status</span>

              {(["todas", ...STATUS_DENUNCIAS, "arquivadas"] as const).map(
                (status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => {
                      setStatusFiltro(status);
                      setMostrarFiltrosModeracao(false);
                    }}
                    style={
                      statusFiltro === status
                        ? adminFiltersSheetOptionActiveStyle
                        : adminFiltersSheetOptionStyle
                    }
                  >
                    <span>
                      {status === "todas"
                        ? "Todas"
                        : status === "arquivadas"
                          ? "Arquivadas"
                          : STATUS_LABEL[status]}
                    </span>

                    <span
                      style={
                        statusFiltro === status
                          ? adminFiltersSheetRadioActiveStyle
                          : adminFiltersSheetRadioStyle
                      }
                    >
                      {statusFiltro === status ? "✓" : ""}
                    </span>
                  </button>
                )
              )}

              {(busca || statusFiltro !== "todas") && (
                <button
                  type="button"
                  onClick={limparFiltros}
                  style={adminFiltersSheetClearButtonStyle}
                >
                  Limpar filtros
                </button>
              )}
            </article>
          </section>
        )}

        {(erro || sucesso) && (
          <section style={feedbackWrapStyle}>
            {erro && <span style={errorStyle}>{erro}</span>}
            {sucesso && <span style={successStyle}>{sucesso}</span>}
          </section>
        )}

        {denunciasPerfisFiltradas.length > 0 && (
          <section style={listStyle}>
            <section style={summaryStyle}>
              <strong style={summaryTitleStyle}>
                {denunciasPerfisFiltradas.length === 1
                  ? "1 denúncia de perfil encontrada"
                  : `${denunciasPerfisFiltradas.length} denúncias de perfis encontradas`}
              </strong>
            </section>

            {denunciasPerfisFiltradas.map((denuncia) => {
              const acaoAtiva = acaoEmAndamento.startsWith(`perfil-${denuncia.id}`);
              const menuIdPerfil = `perfil-${denuncia.id}`;
              const menuAberto = menuDenunciaAbertoId === menuIdPerfil;
              const totalReincidencias =
                reincidenciasPorUsuario[denuncia.denunciadoId] || 0;

              return (
                <article key={denuncia.id} style={reportCardStyle}>
                  <div className="admin-comunidade-report-header" style={reportHeaderStyle}>
                    <div style={reportTitleWrapStyle}>
                      <div style={reportMetaLineStyle}>
                        <span
                          style={{
                            ...targetBadgeStyle,
                            ...commentTargetBadgeStyle,
                          }}
                        >
                          Perfil
                        </span>

                        <span style={reportDotStyle}>•</span>

                        <span style={reportDateStyle}>
                          Denunciado em {formatarData(denuncia.criadoEm)}
                        </span>

                        <span style={reportDotStyle}>•</span>

                        <span style={statusInlineStyle}>
                          {STATUS_PERFIL_LABEL[denuncia.status]}
                        </span>
                      </div>

                      <strong style={reportTitleStyle}>
                        {formatarMotivoDenunciaPerfil(denuncia.motivo)}
                      </strong>
                    </div>

                    <div style={reportHeaderRightStyle}>
                      <div style={reportMenuWrapStyle}>
                        <button
                          type="button"
                          aria-label={
                            menuAberto
                              ? "Fechar ações da denúncia de perfil"
                              : "Abrir ações da denúncia de perfil"
                          }
                          aria-expanded={menuAberto}
                          onClick={() =>
                            setMenuDenunciaAbertoId((denunciaAbertaId) =>
                              denunciaAbertaId === menuIdPerfil ? "" : menuIdPerfil
                            )
                          }
                          disabled={acaoAtiva}
                          style={{
                            ...reportMenuButtonStyle,
                            opacity: acaoAtiva ? 0.58 : 1,
                            cursor: acaoAtiva ? "not-allowed" : "pointer",
                          }}
                        >
                          ⋮
                        </button>

                        {menuAberto && (
                          <section
                            style={reportMenuOverlayStyle}
                            aria-label="Ações da denúncia de perfil"
                          >
                            <button
                              type="button"
                              aria-label="Fechar ações da denúncia de perfil"
                              onClick={() => setMenuDenunciaAbertoId("")}
                              style={reportMenuBackdropStyle}
                            />

                            <article role="menu" style={reportMenuStyle}>
                              <div style={reportMenuHandleStyle} />

                              <strong style={reportMenuTitleStyle}>
                                Ações da denúncia
                              </strong>

                              <Link
                                href={denuncia.perfilHref}
                                onClick={() => setMenuDenunciaAbertoId("")}
                                style={reportMenuItemLinkStyle}
                              >
                                Abrir perfil denunciado
                              </Link>

                              {denuncia.status === "resolvida" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    void removerDenunciaPerfilResolvida(denuncia.id)
                                  }
                                  disabled={acaoAtiva}
                                  style={reportMenuDangerItemStyle}
                                >
                                  {acaoEmAndamento ===
                                  `perfil-${denuncia.id}-remover-denuncia`
                                    ? "Removendo..."
                                    : "Remover do painel"}
                                </button>
                              )}

                              {denuncia.status === "pendente" && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMenuDenunciaAbertoId("");
                                    void atualizarStatusDenunciaPerfil(
                                      denuncia.id,
                                      "analisada"
                                    );
                                  }}
                                  disabled={acaoAtiva}
                                  style={reportMenuItemStyle}
                                >
                                  {acaoEmAndamento ===
                                  `perfil-${denuncia.id}-analisada`
                                    ? "Assumindo..."
                                    : "Assumir análise"}
                                </button>
                              )}

                              <div style={reportMenuDividerStyle} />

                              {STATUS_DENUNCIAS_PERFIS.map((status) => (
                                <button
                                  key={status}
                                  type="button"
                                  onClick={() => {
                                    setMenuDenunciaAbertoId("");
                                    void atualizarStatusDenunciaPerfil(
                                      denuncia.id,
                                      status
                                    );
                                  }}
                                  disabled={acaoAtiva || denuncia.status === status}
                                  style={
                                    denuncia.status === status
                                      ? reportMenuItemActiveStyle
                                      : reportMenuItemStyle
                                  }
                                >
                                  {acaoEmAndamento ===
                                  `perfil-${denuncia.id}-${status}`
                                    ? "Salvando..."
                                    : `Marcar como ${STATUS_PERFIL_LABEL[
                                        status
                                      ].toLowerCase()}`}
                                </button>
                              ))}
                            </article>
                          </section>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="admin-comunidade-report-body" style={reportBodyStyle}>
                    <section style={contentBoxStyle}>
                      <div style={sectionHeaderLineStyle}>
                        <span style={boxLabelStyle}>Perfil denunciado</span>
                      </div>

                      <p style={reportedTextCompactStyle}>{denuncia.denunciadoNome}</p>

                      <div style={metaGridStyle}>
                        <span style={metaItemStyle}>
                          Denunciante: <strong>{denuncia.denuncianteNome}</strong>
                        </span>

                        {totalReincidencias > 1 && (
                          <span style={recurrenceMetaItemStyle}>
                            Reincidências: <strong>{totalReincidencias}</strong>
                          </span>
                        )}
                      </div>
                    </section>

                    <section style={contentBoxStyle}>
                      <div style={sectionHeaderLineStyle}>
                        <span style={boxLabelStyle}>Denúncia</span>
                        <span style={sectionHintStyle}>Registro interno</span>
                      </div>

                      {denuncia.descricao ? (
                        <p style={detailTextStyle}>{denuncia.descricao}</p>
                      ) : (
                        <p style={mutedTextStyle}>Sem descrição adicional.</p>
                      )}
                    </section>
                  </div>

                  {denuncia.atualizadoEm && denuncia.atualizadoEm !== denuncia.criadoEm && (
                    <span style={analysisMetaStyle}>
                      Última atualização em {formatarData(denuncia.atualizadoEm)}
                    </span>
                  )}
                </article>
              );
            })}
          </section>
        )}

        <section style={summaryStyle}>
          <strong style={summaryTitleStyle}>
            {denunciasFiltradas.length === 1
              ? "1 denúncia de conteúdo encontrada"
              : `${denunciasFiltradas.length} denúncias de conteúdo encontradas`}
          </strong>
        </section>

        <section style={listStyle}>
          {denunciasFiltradas.length > 0 ? (
            denunciasFiltradas.map((denuncia) => {
              const acaoAtiva = acaoEmAndamento.startsWith(denuncia.id);
              const observacao = observacoes[denuncia.id] || "";
              const menuAberto = menuDenunciaAbertoId === denuncia.id;
              const denunciaArquivada = denuncia.arquivada;
              const conteudoIndisponivel =
                conteudoDenunciadoIndisponivel(denuncia);
              const denunciaResolvidaComConteudoIndisponivel =
                denuncia.status === "resolvida" && conteudoIndisponivel;
              const totalReincidencias = denuncia.alvoAutorId
                ? reincidenciasPorUsuario[denuncia.alvoAutorId] || 0
                : 0;

              return (
                <article key={denuncia.id} style={reportCardStyle}>
                  <div className="admin-comunidade-report-header" style={reportHeaderStyle}>
                    <div style={reportTitleWrapStyle}>
                      <div style={reportMetaLineStyle}>
                        <span
                          style={{
                            ...targetBadgeStyle,
                            ...(denuncia.alvoTipo === "post"
                              ? postTargetBadgeStyle
                              : commentTargetBadgeStyle),
                          }}
                        >
                          {rotuloTipoAlvoDenuncia(denuncia.alvoTipo)}
                        </span>

                        <span style={reportDotStyle}>•</span>

                        <span style={reportDateStyle}>
                          Denunciado em {formatarData(denuncia.criadoEm)}
                        </span>

                        <span style={reportDotStyle}>•</span>

                        <span style={statusInlineStyle}>
                          {STATUS_LABEL[denuncia.status]}
                        </span>

                        {denunciaArquivada && (
                          <>
                            <span style={reportDotStyle}>•</span>
                            <span style={archivedInlineStyle}>Arquivada</span>
                          </>
                        )}
                      </div>

                      <strong style={reportTitleStyle}>{denuncia.motivo}</strong>
                    </div>

                    <div style={reportHeaderRightStyle}>
                      <div style={reportMenuWrapStyle}>
                        <button
                          type="button"
                          aria-label={
                            menuAberto
                              ? "Fechar ações da denúncia"
                              : "Abrir ações da denúncia"
                          }
                          aria-expanded={menuAberto}
                          onClick={() =>
                            setMenuDenunciaAbertoId((denunciaAbertaId) =>
                              denunciaAbertaId === denuncia.id ? "" : denuncia.id
                            )
                          }
                          disabled={acaoAtiva}
                          style={{
                            ...reportMenuButtonStyle,
                            opacity: acaoAtiva ? 0.58 : 1,
                            cursor: acaoAtiva ? "not-allowed" : "pointer",
                          }}
                        >
                          ⋮
                        </button>

                        {menuAberto && (
                          <section
                            style={reportMenuOverlayStyle}
                            aria-label="Ações da denúncia"
                          >
                            <button
                              type="button"
                              aria-label="Fechar ações da denúncia"
                              onClick={() => setMenuDenunciaAbertoId("")}
                              style={reportMenuBackdropStyle}
                            />

                            <article role="menu" style={reportMenuStyle}>
                              <div style={reportMenuHandleStyle} />

                              <strong style={reportMenuTitleStyle}>
                                Ações da denúncia
                              </strong>
                            {denuncia.alvoPostId && (
                              <Link
                                href={`/comunidade?post=${encodeURIComponent(
                                  denuncia.alvoPostId
                                )}`}
                                onClick={() => setMenuDenunciaAbertoId("")}
                                style={reportMenuItemLinkStyle}
                              >
                                Abrir publicação na Comunidade
                              </Link>
                            )}

                            {(denuncia.alvoTipo === "comentario_capitulo" ||
                              denuncia.alvoTipo === "capitulo") &&
                              denuncia.alvoObraId &&
                              denuncia.alvoCapituloId && (
                                <Link
                                  href={`/ler-capitulo?obraId=${encodeURIComponent(
                                    denuncia.alvoObraId
                                  )}&capituloId=${encodeURIComponent(
                                    denuncia.alvoCapituloId
                                  )}`}
                                  onClick={() => setMenuDenunciaAbertoId("")}
                                  style={reportMenuItemLinkStyle}
                                >
                                  Abrir capítulo denunciado
                                </Link>
                              )}

                            {(denuncia.alvoTipo === "obra" ||
                              denuncia.alvoTipo === "comentario_obra") &&
                              denuncia.alvoObraSlug && (
                                <Link
                                  href={`/obra/${encodeURIComponent(
                                    denuncia.alvoObraSlug
                                  )}`}
                                  onClick={() =>
                                    setMenuDenunciaAbertoId("")
                                  }
                                  style={reportMenuItemLinkStyle}
                                >
                                  Abrir obra denunciada
                                </Link>
                              )}

                            {(denuncia.alvoTipo === "diario_anotacao" ||
                              denuncia.alvoTipo === "comentario_diario") &&
                              denuncia.alvoPerfilUserId && (
                                <Link
                                  href={criarHrefDiarioDenunciado(denuncia)}
                                  onClick={() =>
                                    setMenuDenunciaAbertoId("")
                                  }
                                  style={reportMenuItemLinkStyle}
                                >
                                  Abrir conteúdo no Diário
                                </Link>
                              )}

                            {denunciaArquivada ? (
                              <button
                                type="button"
                                onClick={() => void restaurarDenunciaArquivada(denuncia.id)}
                                disabled={acaoAtiva}
                                style={reportMenuItemStyle}
                              >
                                Restaurar para o painel
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => void arquivarDenuncia(denuncia.id)}
                                disabled={acaoAtiva}
                                style={reportMenuItemStyle}
                              >
                                Arquivar denúncia
                              </button>
                            )}

                            {denuncia.status === "resolvida" && (
                              <button
                                type="button"
                                onClick={() => void removerDenunciaResolvida(denuncia.id)}
                                disabled={acaoAtiva}
                                style={reportMenuDangerItemStyle}
                              >
                                {acaoEmAndamento === `${denuncia.id}-remover-denuncia`
                                  ? "Removendo..."
                                  : "Remover do painel"}
                              </button>
                            )}

                            {denuncia.status === "pendente" && (
                              <button
                                type="button"
                                onClick={() => {
                                  setMenuDenunciaAbertoId("");
                                  void atualizarStatusDenuncia(
                                    denuncia.id,
                                    "em_analise"
                                  );
                                }}
                                disabled={acaoAtiva}
                                style={reportMenuItemStyle}
                              >
                                {acaoEmAndamento === `${denuncia.id}-em_analise`
                                  ? "Assumindo..."
                                  : "Assumir análise"}
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setMenuDenunciaAbertoId("");
                                void removerConteudoDenunciado(denuncia);
                              }}
                              disabled={
                                acaoAtiva ||
                                conteudoIndisponivel ||
                                denunciaArquivada ||
                                (denuncia.status !== "pendente" &&
                                  denuncia.status !== "em_analise")
                              }
                              style={reportMenuDangerItemStyle}
                            >
                              {acaoEmAndamento ===
                              `${denuncia.id}-remover-conteudo`
                                ? "Removendo..."
                                : rotuloRemocaoAlvoDenuncia(
                                    denuncia.alvoTipo
                                  )}
                            </button>

                            <div style={reportMenuDividerStyle} />

                            {STATUS_DENUNCIAS.map((status) => (
                              <button
                                key={status}
                                type="button"
                                onClick={() => {
                                  setMenuDenunciaAbertoId("");
                                  void atualizarStatusDenuncia(
                                    denuncia.id,
                                    status
                                  );
                                }}
                                disabled={acaoAtiva || denuncia.status === status}
                                style={
                                  denuncia.status === status
                                    ? reportMenuItemActiveStyle
                                    : reportMenuItemStyle
                                }
                              >
                                {acaoEmAndamento === `${denuncia.id}-${status}`
                                  ? "Salvando..."
                                  : `Marcar como ${STATUS_LABEL[
                                      status
                                    ].toLowerCase()}`}
                              </button>
                            ))}

                            </article>
                          </section>
                        )}</div>
                    </div>
                  </div>

                  <div className="admin-comunidade-report-body" style={reportBodyStyle}>
                    <section style={contentBoxStyle}>
                      <div style={sectionHeaderLineStyle}>
                        <span style={boxLabelStyle}>Conteúdo denunciado</span>
                        <span style={sectionHintStyle}>
                          {conteudoIndisponivel
                            ? "Indisponível"
                            : rotuloTipoAlvoDenuncia(denuncia.alvoTipo)}
                        </span>
                      </div>

                      <p
                        style={
                          denunciaResolvidaComConteudoIndisponivel
                            ? reportedTextCompactStyle
                            : reportedTextStyle
                        }
                      >
                        {conteudoIndisponivel
                          ? "Conteúdo removido ou indisponível."
                          : denuncia.alvoResumo}
                      </p>

                      {!conteudoIndisponivel && (
                        <div style={metaGridStyle}>
                        <span style={metaItemStyle}>
                          Autor: <strong>{denuncia.alvoAutor}</strong>
                        </span>

                        {totalReincidencias > 1 && (
                          <span style={recurrenceMetaItemStyle}>
                            Reincidências: <strong>{totalReincidencias}</strong>
                          </span>
                        )}

                        <span style={metaItemStyle}>
                          Data: <strong>{formatarData(denuncia.alvoData)}</strong>
                        </span>

                        {denuncia.alvoCategoria && (
                          <span style={metaItemStyle}>
                            Categoria: <strong>{denuncia.alvoCategoria}</strong>
                          </span>
                        )}

                        {(denuncia.alvoTipo === "post" ||
                          denuncia.alvoTipo === "diario_anotacao") &&
                          denuncia.alvoTipoPublicacao && (
                            <span style={metaItemStyle}>
                              Tipo: <strong>{denuncia.alvoTipoPublicacao}</strong>
                            </span>
                          )}

                        {(denuncia.alvoTipo === "post" ||
                          denuncia.alvoTipo === "diario_anotacao" ||
                          denuncia.alvoTipo === "comentario_diario") && (
                          <span
                            style={
                              denuncia.alvoTemSpoiler
                                ? spoilerMetaItemStyle
                                : metaItemStyle
                            }
                          >
                            Spoiler:{" "}
                            <strong>
                              {denuncia.alvoTemSpoiler ? "Sim" : "Não"}
                            </strong>
                          </span>
                        )}

                          {denuncia.alvoObra && (
                            <span style={metaItemStyle}>
                              Obra: <strong>{denuncia.alvoObra}</strong>
                            </span>
                          )}

                          {(denuncia.alvoTipo === "comentario_capitulo" ||
                            denuncia.alvoTipo === "capitulo") &&
                            denuncia.alvoCapituloId && (
                              <span style={metaItemStyle}>
                                Capítulo:{" "}
                                <strong>
                                  {denuncia.alvoCapituloTitulo ||
                                    denuncia.alvoCapituloId}
                                </strong>
                              </span>
                            )}
                        </div>
                      )}
                    </section>

                    <section style={contentBoxStyle}>
                      <div style={sectionHeaderLineStyle}>
                        <span style={boxLabelStyle}>Denúncia</span>
                        <span style={sectionHintStyle}>Registro interno</span>
                      </div>

                      <div style={reasonGridStyle}>
                        <span style={reasonItemStyle}>
                          Denunciante: <strong>{denuncia.denuncianteNome}</strong>
                        </span>
                      </div>

                      {denuncia.detalhe ? (
                        <p style={detailTextStyle}>{denuncia.detalhe}</p>
                      ) : (
                        <p style={mutedTextStyle}>Sem detalhe adicional.</p>
                      )}
                    </section>

                    <label style={adminNoteStyle}>
                      <div style={sectionHeaderLineStyle}>
                        <span style={adminObservationLabelStyle}>
                          Observação interna
                        </span>
                        <span style={sectionHintStyle}>Até 800 caracteres</span>
                      </div>

                      <textarea
                        value={observacao}
                        onChange={(event) =>
                          setObservacoes((observacoesAtuais) => ({
                            ...observacoesAtuais,
                            [denuncia.id]: event.target.value,
                          }))
                        }
                        disabled={acaoAtiva}
                        placeholder="Ex.: conteúdo analisado, ação tomada, manter observação interna..."
                        maxLength={800}
                        rows={2}
                        style={textareaStyle}
                      />
                    </label>
                  </div>

                  {denuncia.analisadoEm && (
                    <span style={analysisMetaStyle}>
                      Última análise em {formatarData(denuncia.analisadoEm)}
                    </span>
                  )}
                </article>
              );
            })
          ) : (
            <p
              style={{
                margin: "10px 0 0",
                color: "#FFFFFF",
                fontSize: "12px",
                fontWeight: 800,
                textAlign: "center",
              }}
            >
              Nenhuma denúncia encontrada
            </p>
          )}
        </section>
      </section>
    </main>
  );
}
