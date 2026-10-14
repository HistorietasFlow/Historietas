"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import type { TouchEvent } from "react";
import { useListasActionMessage } from "./hooks/use-listas-action-message";
import { useListasDiaryCommentsSheetLifecycle } from "./hooks/use-listas-diary-comments-sheet-lifecycle";
import { useListasDesktopMode } from "./hooks/use-listas-desktop-mode";
import { useListasRouteUiSync } from "./hooks/use-listas-route-ui-sync";
import { useListasTargetWorkFocus } from "./hooks/use-listas-target-work-focus";
import { useListasWorkMenuLifecycle } from "./hooks/use-listas-work-menu-lifecycle";
import ListasRatingDetail from "./components/listas-rating-detail";
import { ListasPageHeader } from "./components/listas-page-header";
import { ListasProfileCategoryControls } from "./components/listas-profile-category-controls";
import { ListasResultsSection } from "./components/listas-results-section";
import { ListasDiaryReportModal } from "./components/listas-diary-report-modal";
import { ListasWorkActionSheet } from "./components/listas-work-action-sheet";
import { ListasAuthorRow } from "./components/listas-author-row";
import { ListasDiaryAnnotationCard } from "./components/listas-diary-annotation-card";
import { ListasProfileWorkRow } from "./components/listas-profile-work-row";
import { ListasPublicWorkRow } from "./components/listas-public-work-row";
import {
  ListasDiaryComment,
  type ListasDiaryCommentStyles,
} from "./components/listas-diary-comment";
import {
  ListasDiaryCommentThread,
  type ListasDiaryCommentThreadStyles,
} from "./components/listas-diary-comment-thread";
import {
  ListasDiaryCommentsSheet,
  type ListasDiaryCommentsSheetStyles,
} from "./components/listas-diary-comments-sheet";
import {
  compactarNumero,
  formatarDataCurta,
  formatarLeituraMesAno,
  formatarNotaListas,
} from "./lib/listas-format-utils";
import { listasPageCss } from "./lib/listas-page-css";
import {
  pageStyle,
  headerStyle,
  headerInnerStyle,
  pageTitleStyle,
  controlsStyle,
  listDiaryControlsStyle,
  desktopControlsStyle,
  desktopListDiaryControlsStyle,
  tabsStyle,
  desktopTabsStyle,
  tabStyle,
  tabActiveStyle,
  tabCountStyle,
  listSectionStyle,
  desktopListSectionStyle,
  rowsStyle,
  desktopWorksRowsStyle,
  rowMainLinkStyle,
  rowAuthorLinkStyle,
  rowTextStyle,
  rowTitleStyle,
  rowMetaStyle,
  rowDetailStyle,
  rowOptionsButtonStyle,
  moreOptionsStyle,
  moreDotStyle,
  monthGroupStyle,
  monthTitleStyle,
  stateStyle,
  stateIconStyle,
  stateTextStyle,
  stateLinkStyle,
  loadMoreButtonStyle,
  actionMessageStyle,
  footerStyle,
} from "./lib/listas-layout-styles";
import {
  actionSheetOverlayStyle,
  actionSheetStyle,
  actionSheetHandleStyle,
  actionSheetHeaderStyle,
  actionSheetTitleStyle,
  actionSheetMetaStyle,
  actionSheetDetailStyle,
  actionSheetActionsStyle,
  actionSheetButtonStyle,
  actionSheetButtonDisabledStyle,
  actionSheetButtonIconStyle,
  actionSheetSelectionDotStyle,
  actionSheetSelectionDotActiveStyle,
  rowSignalsStyle,
  rowSignalStyle,
  rowRatingSignalStyle,
  rowRatingSignalStarStyle,
  rowSignalAnnotationToggleStyle,
  listDiaryActionSheetReportStyle,
  listDiaryActionSheetEditorStyle,
  listDiaryAnnotationTextareaWrapStyle,
  listDiaryAnnotationTextareaStyle,
  listDiaryAnnotationEditorMetaStyle,
  listDiaryAnnotationMetaActionsStyle,
  listDiaryAnnotationSpoilerLabelStyle,
  listDiaryAnnotationSpoilerCheckboxStyle,
  listDiaryAnnotationCounterStyle,
  listDiaryAnnotationErrorStyle,
  listDiaryAnnotationSaveStyle,
  listDiaryAnnotationCancelStyle,
  listDiaryAnnotationRemoveStyle,
  listDiaryCardAnnotationStyle,
  listDiaryCardAnnotationHeaderStyle,
  listDiaryCardAnnotationTitleStyle,
  listDiaryCardAnnotationHeaderActionsStyle,
  listDiaryCardAnnotationLikeButtonStyle,
  listDiaryCardAnnotationLikeIconStyle,
  listDiaryCardAnnotationLikeCountStyle,
  listDiaryCardAnnotationTextStyle,
  listDiaryCardSpoilerStyle,
  listDiaryCardSpoilerTextStyle,
  listDiaryCardSpoilerButtonStyle,
  listDiaryCardAnnotationTitleGroupStyle,
} from "./lib/listas-work-styles";
import {
  criarAvatarPerfilDiarioListasStyle,
  criarAvatarComentarioDiarioListasStyle,
  listDiaryProfileHeaderStyle,
  listDiaryProfileHeaderTopStyle,
  listDiaryProfileTitleAreaStyle,
  listDiaryProfileTitleStyle,
  listDiaryHeaderRatingBoxStyle,
  listDiaryHeaderRatingStarsRowStyle,
  listDiaryHeaderRatingStarButtonStyle,
  listDiaryHeaderRatingStarActiveStyle,
  listDiaryHeaderRatingStarVisualStyle,
  listDiaryHeaderRatingStarBaseStyle,
  listDiaryHeaderRatingStarFillStyle,
  listDiaryRatingSummaryStyle,
  listDiaryRatingNumberStyle,
  listDiaryRatingSummaryStarsStyle,
  listDiaryRatingSummaryStarVisualStyle,
  listDiaryRatingSummaryStarBaseStyle,
  listDiaryRatingSummaryStarFillStyle,
  listDiaryRatingTotalStyle,
  listDiaryCardAnnotationCommentButtonStyle,
  listDiaryCardAnnotationCommentIconStyle,
  listDiaryCardAnnotationCommentCountStyle,
  commentsSheetOverlayStyle,
  commentsSheetBackdropStyle,
  commentsSheetStyle,
  commentsSheetCompactStyle,
  commentsSheetExpandedStyle,
  desktopCommentsSheetStyle,
  commentsSheetHandleWrapStyle,
  commentsSheetHandleStyle,
  commentsSheetHeaderStyle,
  commentsSheetHeaderSpacerStyle,
  commentsSheetTitleStyle,
  commentsSortMenuWrapStyle,
  commentsSortMenuTriggerStyle,
  commentsSortMenuStyle,
  commentsSortMenuItemStyle,
  commentsSortMenuItemActiveStyle,
  commentsSortMenuDividerStyle,
  commentsSheetListStyle,
  commentThreadStyle,
  commentItemStyle,
  commentRepliesListStyle,
  commentReplyItemStyle,
  commentRepliesToggleStyle,
  commentRepliesControlsStyle,
  commentRepliesHideButtonStyle,
  commentRepliesLineStyle,
  commentAvatarLinkStyle,
  commentReplyAvatarLinkStyle,
  commentContentStyle,
  commentTopLineStyle,
  commentAuthorLinkStyle,
  commentTimeStyle,
  commentTextStyle,
  commentActionsRowStyle,
  commentReplyButtonStyle,
  commentRemoveButtonStyle,
  commentReportButtonStyle,
  commentLikeWrapStyle,
  commentLikeButtonStyle,
  commentLikeCountStyle,
  commentHeartIconStyle,
  commentsLoadingStyle,
  emptyCommentsStyle,
  commentsSheetErrorStyle,
  commentsReplyingBannerStyle,
  commentsReplyingCancelStyle,
  commentsToolsStyle,
  commentsQuickReactionsStyle,
  commentsQuickReactionButtonStyle,
  commentsSheetFormStyle,
  commentsInputAvatarStyle,
  commentsInputBoxStyle,
  commentsSheetInputStyle,
  commentsInputIconButtonStyle,
  commentsSheetSendStyle,
} from "./lib/listas-diary-comments-styles";
import { criarAvatarStyle, criarCapaStyle } from "./lib/listas-row-media-utils";
import {
  removerAnotacaoLocalListas,
  salvarAnotacaoLocalListas,
} from "./lib/listas-diary-annotation-utils";
import {
  criarInteracaoAnotacaoListasVazia,
  obterRespostasComentarioDiarioListas,
  ordenarComentariosRaizDiarioListas,
  type ComentarioAnotacaoListas,
  type InteracaoAnotacaoListas,
} from "./lib/listas-diary-comment-utils";
import {
  colecaoTemObraListas,
  removerObraDaColecaoListas,
} from "./lib/listas-local-work-utils";
import {
  obterHrefContinuarLeituraListas,
} from "./lib/listas-profile-items-utils";
import {
  carregarAvaliacaoDiarioListas,
  carregarPerfil,
} from "./lib/listas-profile-records-loader";
import {
  carregarObrasPublicadas,
} from "./lib/listas-published-works-loader";
import {
  carregarAutoresPublicos,
  carregarIdsInteracoesUsuario,
} from "./lib/listas-public-catalog-loader";
import {
  carregarInteracoesAnotacoesListas,
  type InteracoesAnotacoesListasEstado,
} from "./lib/listas-diary-interactions-loader";
import { carregarListasDoPerfil } from "./lib/listas-profile-loader";
import { ordenarObrasDaSecao, ordenarRecomendacoes } from "./lib/listas-public-catalog-utils";
import {
  textoSecundarioItem,
} from "./lib/listas-profile-text-utils";
import {
  filtrarOrdenarAutoresListas,
  filtrarOrdenarItensPerfilListas,
  filtrarOrdenarObrasPublicasListas,
} from "./lib/listas-filter-sort-utils";
import {
  agruparItensPerfilPorMesListas,
  calcularTotalResultadosListas,
  deveAgruparPorMesListas,
  obterTituloPaginaListas,
} from "./lib/listas-presentation-utils";
import { obterPermissoesAnotacaoListas } from "./lib/listas-diary-annotation-permissions-utils";
import {
  normalizarQuemPodeComentarAnotacaoListas,
  normalizarTipoDiarioListas,
  normalizarVisibilidadeAnotacaoListas,
  normalizarVisibilidadeComentariosAnotacaoListas,
  obterTipoDiarioDoItemListas,
} from "./lib/listas-diary-normalizer-utils";
import {
  AVALIACAO_DIARIO_LISTAS_VAZIA,
  calcularProximaAvaliacaoDiarioListas,
  normalizarAvaliacaoDiarioListas,
  obterPreenchimentoEstrelaListas,
  obterProximaNotaAvaliacaoListas,
  type AvaliacaoDiarioListasEstado,
} from "./lib/listas-diary-rating-utils";
import {
  carregarListaIdsListas,
  criarLoginHrefListas,
  salvarListaIdsListas,
} from "./lib/listas-storage-utils";
import {
  idUsuarioValido,
  obterMensagemErroListas,
  pegarBooleanoListas,
  pegarTexto,
} from "./lib/listas-value-utils";
import {
  normalizarCategoriaPerfil,
  normalizarModoLista,
  normalizarOrdenacao,
  normalizarOrigemPerfil,
} from "./lib/listas-route-utils";
import { supabase } from "../../lib/supabase/client";
import { normalizarTexto } from "../../lib/utils";
import {
  historietasThemeCss,
  useHistorietasTheme,
} from "../../lib/historietasTheme";
import { ehClassificacao18 } from "../../lib/historietasAdultContent";
import {
  carregarEstadoRelacionamentoPerfil,
  carregarPermissoesAbasPerfil,
  carregarPreferenciasPrivacidade,
  preferenciasPrivacidadePadrao,
  type EstadoRelacionamentoPerfil,
  type PermissoesAbasPerfil,
  type PreferenciasPrivacidadeHistorietas,
} from "../../lib/historietasPrivacy";
import { type TipoAlvoDenuncia } from "../../components/DenunciaModal";

type ModoLista = "perfil" | "obras" | "autores";
type OrigemPerfil = "diario" | "biblioteca";
type CategoriaPerfil =
  | "tudo"
  | "lendo"
  | "quero-ler"
  | "favoritas"
  | "concluidas"
  | "avaliacoes"
  | "historico";
type OrdenacaoLista = "recentes" | "titulo" | "avaliacao" | "popularidade";
type VisibilidadeAnotacaoListas = "publico" | "parcial" | "privado";
type QuemPodeComentarAnotacaoListas =
  | "herdar"
  | "todos"
  | "seguidores"
  | "ninguem";
type VisibilidadeComentariosAnotacaoListas =
  | "herdar"
  | "publico"
  | "seguidores"
  | "somente_eu";
type OrdenacaoComentariosDiarioListas = "relevantes" | "recentes";
type TipoDiarioListas =
  | "lendo"
  | "quero_ler"
  | "favorita"
  | "concluida"
  | "avaliacao"
  | "review"
  | "atividade";

type CapituloLista = {
  id: string;
  obraId: string;
  titulo: string;
  ordem: number;
  criadoEm: string;
};

type ObraLista = {
  id: string;
  autorId: string;
  titulo: string;
  autor: string;
  genero: string;
  formato: string;
  classificacaoIndicativa: string;
  capa: string;
  slug: string;
  link: string;
  publicadaEm: string;
  visualizacoes: number;
  totalCurtidas: number;
  totalComentarios: number;
  capitulos: CapituloLista[];
  notaMedia: number;
  totalAvaliacoes: number;
};

type PerfilLista = {
  userId: string;
  nome: string;
  username: string;
  avatar: string;
  bio: string;
};

type ItemObraLista = {
  chave: string;
  obra: ObraLista;
  categorias: CategoriaPerfil[];
  data: string;
  ultimaLeituraEm?: string;
  nota: number;
  progresso: number;
  capituloAtual: string;
  capituloAtualId: string;
  capitulosLidosIds: string[];
  anotacao?: string;
  anotacaoId?: string;
  anotacaoTipo?: TipoDiarioListas;
  anotacaoVisibilidade?: VisibilidadeAnotacaoListas;
  anotacaoQuemPodeComentar?: QuemPodeComentarAnotacaoListas;
  anotacaoVisibilidadeComentarios?: VisibilidadeComentariosAnotacaoListas;
  anotacaoPermitirCurtidas?: boolean;
  anotacaoSpoiler?: boolean;
};

type AutorLista = {
  id: string;
  nome: string;
  username: string;
  avatar: string;
  bio: string;
  totalObras: number;
  totalCurtidas: number;
  totalComentarios: number;
  notaMedia: number;
  totalAvaliacoes: number;
  generos: string[];
  criadaEm: string;
};

type ListasPerfilEstado = Record<CategoriaPerfil, ItemObraLista[]>;

type RegistroGenerico = Record<string, unknown>;

type EditorAnotacaoListasEstado = {
  aberto: boolean;
  obraId: string;
  anotacaoId: string;
  tipo: TipoDiarioListas;
  texto: string;
  visibilidade: VisibilidadeAnotacaoListas;
  quemPodeComentar: QuemPodeComentarAnotacaoListas;
  visibilidadeComentarios: VisibilidadeComentariosAnotacaoListas;
  permitirCurtidas: boolean;
  contemSpoiler: boolean;
  salvando: boolean;
  erro: string;
};

type AlvoDenunciaDiarioListas = {
  tipo: Extract<
    TipoAlvoDenuncia,
    "diario_anotacao" | "comentario_diario"
  >;
  id: string;
  titulo: string;
};

const LISTAS_PERFIL_VAZIAS: ListasPerfilEstado = {
  tudo: [],
  lendo: [],
  "quero-ler": [],
  favoritas: [],
  concluidas: [],
  avaliacoes: [],
  historico: [],
};

const PERMISSOES_PROPRIO_PERFIL: PermissoesAbasPerfil = {
  obras: true,
  sobre: true,
  diario: true,
  comunidade: true,
  biblioteca: true,
  atividades: true,
};

const CATEGORIAS_PERFIL: Array<{
  valor: CategoriaPerfil;
  rotulo: string;
}> = [
  { valor: "tudo", rotulo: "Tudo" },
  { valor: "lendo", rotulo: "Lendo" },
  { valor: "quero-ler", rotulo: "Quero ler" },
  { valor: "favoritas", rotulo: "Favoritas" },
  { valor: "concluidas", rotulo: "Concluídas" },
  { valor: "avaliacoes", rotulo: "Avaliações" },
  { valor: "historico", rotulo: "Histórico" },
];

const LIBRARY_FOLLOW_STORAGE_KEY = "historietas-obras-seguidas";
const FAVORITES_STORAGE_KEY = "historietas-obras-favoritas";
const COMPLETED_STORAGE_KEY = "historietas-obras-concluidas";
const DIARIO_ANOTACAO_MAX_LENGTH = 700;
const DIARIO_COMENTARIO_MAX_LENGTH = 700;
const NOTAS_AVALIACAO_LISTAS = [1, 2, 3, 4, 5] as const;

const EDITOR_ANOTACAO_LISTAS_VAZIO: EditorAnotacaoListasEstado = {
  aberto: false,
  obraId: "",
  anotacaoId: "",
  tipo: "atividade",
  texto: "",
  visibilidade: "privado",
  quemPodeComentar: "herdar",
  visibilidadeComentarios: "herdar",
  permitirCurtidas: true,
  contemSpoiler: false,
  salvando: false,
  erro: "",
};

async function sincronizarQueroLerListas(
  userId: string,
  obraId: string,
  ativo: boolean,
) {
  try {
    if (!userId.trim() || !obraId.trim()) {
      return;
    }

    const { error: erroDelete } = await supabase
      .from("seguindo_obras")
      .delete()
      .eq("user_id", userId)
      .eq("obra_id", obraId);

    if (erroDelete) {
      throw erroDelete;
    }

    if (!ativo) {
      return;
    }

    const payloadBase = {
      user_id: userId,
      obra_id: obraId,
    };

    const { error: erroComVisibilidade } = await supabase
      .from("seguindo_obras")
      .insert({
        ...payloadBase,
        visibilidade: "publico",
      });

    if (!erroComVisibilidade) {
      return;
    }

    const { error: erroSemVisibilidade } = await supabase
      .from("seguindo_obras")
      .insert(payloadBase);

    if (erroSemVisibilidade) {
      throw erroSemVisibilidade;
    }
  } catch (error) {
    console.warn("Não consegui sincronizar Quero ler na Lista Page:", error);
    // Assim como no perfil, a ação local permanece funcionando.
  }
}




function ListasUniversaisContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);
  const queryAtual = searchParams.toString();

  const modo: ModoLista = normalizarModoLista(searchParams.get("modo"));
  const origemPerfil: OrigemPerfil = normalizarOrigemPerfil(
    searchParams.get("origem"),
  );
  const categoriaUrl = normalizarCategoriaPerfil(searchParams.get("categoria"));
  const userIdUrl =
    searchParams.get("usuario") ||
    searchParams.get("userId") ||
    searchParams.get("autorId") ||
    "";
  const secao = pegarTexto(searchParams.get("secao"), "catalogo");
  const genero = pegarTexto(searchParams.get("genero"));
  const tituloPersonalizado = pegarTexto(searchParams.get("titulo"));
  const obraAlvoId = pegarTexto(
    searchParams.get("obra") || searchParams.get("obraId"),
  );

  const [usuarioAtualId, setUsuarioAtualId] = useState("");
  const [usuarioAtualPerfil, setUsuarioAtualPerfil] =
    useState<PerfilLista | null>(null);
  const [perfil, setPerfil] = useState<PerfilLista | null>(null);
  const [listasPerfil, setListasPerfil] =
    useState<ListasPerfilEstado>(LISTAS_PERFIL_VAZIAS);
  const [obrasPublicas, setObrasPublicas] = useState<ObraLista[]>([]);
  const [autores, setAutores] = useState<AutorLista[]>([]);
  const [categoria, setCategoria] = useState<CategoriaPerfil>(categoriaUrl);
  const busca = "";
  const ordenacao: OrdenacaoLista = normalizarOrdenacao(
    searchParams.get("ordem"),
  );
  const [quantidadeVisivel, setQuantidadeVisivel] = useState(40);
  const [carregando, setCarregando] = useState(true);
  const [bloqueado, setBloqueado] = useState(false);
  const [erro, setErro] = useState("");
  const [obraMenuAberta, setObraMenuAberta] = useState<ObraLista | null>(null);
  const [itemPerfilMenuAberto, setItemPerfilMenuAberto] =
    useState<ItemObraLista | null>(null);
  const [categoriaMenuAberta, setCategoriaMenuAberta] =
    useState<CategoriaPerfil>("tudo");
  const [salvandoQueroLer, setSalvandoQueroLer] = useState(false);
  const [obraMenuNoQueroLer, setObraMenuNoQueroLer] = useState(false);
  const [editorAnotacao, setEditorAnotacao] =
    useState<EditorAnotacaoListasEstado>(EDITOR_ANOTACAO_LISTAS_VAZIO);
  const [interacoesAnotacoes, setInteracoesAnotacoes] =
    useState<InteracoesAnotacoesListasEstado>({});
  const [anotacoesAbertas, setAnotacoesAbertas] =
    useState<Record<string, boolean>>({});
  const [anotacoesSpoilerReveladas, setAnotacoesSpoilerReveladas] =
    useState<Record<string, boolean>>({});
  const [preferenciasPerfil, setPreferenciasPerfil] =
    useState<PreferenciasPrivacidadeHistorietas>(preferenciasPrivacidadePadrao);
  const [relacionamentoPerfil, setRelacionamentoPerfil] =
    useState<EstadoRelacionamentoPerfil>("nenhum");
  const [avaliacaoDiario, setAvaliacaoDiario] =
    useState<AvaliacaoDiarioListasEstado>(AVALIACAO_DIARIO_LISTAS_VAZIA);
  const [comentarioCurtindoId, setComentarioCurtindoId] = useState("");
  const [comentarioRemovendoId, setComentarioRemovendoId] = useState("");
  const { mensagemAcao, setMensagemAcao } = useListasActionMessage();
  const [alvoDenunciaDiario, setAlvoDenunciaDiario] =
    useState<AlvoDenunciaDiarioListas | null>(null);
  const [comentariosDiarioItem, setComentariosDiarioItem] =
    useState<ItemObraLista | null>(null);
  const [comentariosDiarioExpandido, setComentariosDiarioExpandido] =
    useState(false);
  const [menuOrdenacaoComentariosDiarioAberto, setMenuOrdenacaoComentariosDiarioAberto] =
    useState(false);
  const [respostasVisiveisComentariosDiario, setRespostasVisiveisComentariosDiario] =
    useState<Record<string, number>>({});
  const comentariosSheetRef = useRef<HTMLElement | null>(null);
  const comentariosDragStartYRef = useRef(0);
  const comentariosDragOffsetYRef = useRef(0);
  const comentariosDragIgnorarCliqueRef = useRef(false);
  const comentariosDragResetTimerRef = useRef<number | null>(null);
  const isDesktop = useListasDesktopMode();
  const [obraDestacadaId, setObraDestacadaId] = useState("");

  useListasRouteUiSync({
    categoriaUrl,
    setCategoria,
    categoria,
    busca,
    ordenacao,
    modo,
    secao,
    genero,
    setQuantidadeVisivel,
  });

  useListasWorkMenuLifecycle({
    obraMenuAberta,
    setObraMenuAberta,
    setItemPerfilMenuAberto,
    setObraMenuNoQueroLer,
    setEditorAnotacao,
    editorAnotacaoVazio: EDITOR_ANOTACAO_LISTAS_VAZIO,
  });

  useEffect(() => {
    let cancelado = false;

    async function iniciar() {
      setCarregando(true);
      setBloqueado(false);
      setErro("");
      setAvaliacaoDiario((atual) => ({
        ...AVALIACAO_DIARIO_LISTAS_VAZIA,
        carregando: modo === "perfil" && origemPerfil === "diario",
        configuracoesAbertas: atual.configuracoesAbertas,
      }));

      try {
        const { data: authData } = await supabase.auth.getUser();
        const usuarioLogadoId = authData.user?.id || "";

        if (cancelado) {
          return;
        }

        setUsuarioAtualId(usuarioLogadoId);

        if (usuarioLogadoId) {
          try {
            const perfilUsuarioAtual = await carregarPerfil(
              usuarioLogadoId,
              pegarTexto(authData.user?.user_metadata?.nome) ||
                pegarTexto(authData.user?.email) ||
                "Usuário",
            );

            if (!cancelado) {
              setUsuarioAtualPerfil(perfilUsuarioAtual);
            }
          } catch {
            if (!cancelado) {
              setUsuarioAtualPerfil({
                userId: usuarioLogadoId,
                nome:
                  pegarTexto(authData.user?.user_metadata?.nome) ||
                  pegarTexto(authData.user?.email) ||
                  "Usuário",
                username: pegarTexto(
                  authData.user?.user_metadata?.username,
                ).replace(/^@/, ""),
                avatar: pegarTexto(
                  authData.user?.user_metadata?.avatar_url ??
                    authData.user?.user_metadata?.avatar,
                ),
                bio: "",
              });
            }
          }
        } else {
          setUsuarioAtualPerfil(null);
        }

        if (modo === "perfil") {
          const perfilIdRecebido = userIdUrl.trim() || usuarioLogadoId;

          if (!perfilIdRecebido || !idUsuarioValido(perfilIdRecebido)) {
            setPerfil(null);
            setListasPerfil(LISTAS_PERFIL_VAZIAS);
            setErro("Não foi possível identificar o perfil desta lista.");
            return;
          }

          const perfilInicialmenteProprio =
            perfilIdRecebido === usuarioLogadoId;
          const perfilCarregado = await carregarPerfil(
            perfilIdRecebido,
            perfilInicialmenteProprio
              ? pegarTexto(authData.user?.user_metadata?.nome) ||
                  pegarTexto(authData.user?.email)
              : "",
          );
          const perfilUserId =
            perfilCarregado.userId.trim() || perfilIdRecebido;
          const proprioPerfil =
            Boolean(usuarioLogadoId) &&
            (perfilUserId === usuarioLogadoId ||
              perfilIdRecebido === usuarioLogadoId);
          const preferencias = await carregarPreferenciasPrivacidade(
            perfilUserId,
            {
              usarFallbackLocal: proprioPerfil,
            },
          );
          const permissoes = proprioPerfil
            ? PERMISSOES_PROPRIO_PERFIL
            : await carregarPermissoesAbasPerfil(perfilUserId, preferencias);
          const permitido =
            origemPerfil === "biblioteca"
              ? permissoes.biblioteca
              : permissoes.diario;
          const relacionamento = proprioPerfil
            ? "proprio_perfil"
            : await carregarEstadoRelacionamentoPerfil(
                perfilUserId,
                usuarioLogadoId,
              );

          if (cancelado) {
            return;
          }

          setPerfil(perfilCarregado);
          setPreferenciasPerfil(preferencias);
          setRelacionamentoPerfil(relacionamento);

          if (origemPerfil === "diario") {
            try {
              const avaliacaoCarregada = await carregarAvaliacaoDiarioListas(
                perfilUserId,
              );

              if (!cancelado) {
                setAvaliacaoDiario(avaliacaoCarregada);
              }
            } catch (error) {
              if (!cancelado) {
                setAvaliacaoDiario((atual) => ({
                  ...atual,
                  carregando: false,
                  erro: obterMensagemErroListas(
                    error,
                    "Não foi possível carregar a Avaliação do Diário.",
                  ),
                }));
              }
            }
          }

          if (!permitido) {
            setBloqueado(true);
            setListasPerfil(LISTAS_PERFIL_VAZIAS);
            return;
          }

          const listas = await carregarListasDoPerfil<
            CategoriaPerfil,
            ItemObraLista
          >(perfilUserId, proprioPerfil, {
            seguindo: LIBRARY_FOLLOW_STORAGE_KEY,
            favoritas: FAVORITES_STORAGE_KEY,
            concluidas: COMPLETED_STORAGE_KEY,
          });

          if (!cancelado) {
            setListasPerfil(listas);
          }

          return;
        }

        const catalogo = await carregarObrasPublicadas();

        if (cancelado) {
          return;
        }

        let obrasPreparadas = catalogo.filter(
          (obra) => !ehClassificacao18(obra.classificacaoIndicativa),
        );

        if (genero) {
          const generoNormalizado = normalizarTexto(genero);
          obrasPreparadas = obrasPreparadas.filter((obra) =>
            normalizarTexto(obra.genero).includes(generoNormalizado),
          );
        }

        if (secao === "recomendacoes") {
          const idsInteracoes = await carregarIdsInteracoesUsuario(usuarioLogadoId);
          obrasPreparadas = ordenarRecomendacoes(obrasPreparadas, idsInteracoes);
        } else {
          obrasPreparadas = ordenarObrasDaSecao(obrasPreparadas, secao);
        }

        setObrasPublicas(obrasPreparadas);

        if (modo === "autores") {
          const autoresCarregados = await carregarAutoresPublicos(obrasPreparadas);

          if (!cancelado) {
            setAutores(autoresCarregados);
          }
        }
      } catch (error) {
        if (!cancelado) {
          setErro(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar esta lista agora.",
          );
        }
      } finally {
        if (!cancelado) {
          setCarregando(false);
        }
      }
    }

    void iniciar();

    return () => {
      cancelado = true;
    };
  }, [modo, origemPerfil, userIdUrl, secao, genero]);

  useListasDiaryCommentsSheetLifecycle({
    comentariosDiarioItem,
    setComentariosDiarioItem,
    setComentariosDiarioExpandido,
    setMenuOrdenacaoComentariosDiarioAberto,
  });

  useEffect(() => {
    let cancelado = false;

    if (modo !== "perfil") {
      setInteracoesAnotacoes({});
      return;
    }

    const anotacaoIds = Array.from(
      new Set(
        (Object.values(listasPerfil) as ItemObraLista[][])
          .flat()
          .map((item) => item.anotacaoId?.trim() || "")
          .filter(Boolean),
      ),
    );

    void carregarInteracoesAnotacoesListas(
      anotacaoIds,
      usuarioAtualId,
    ).then((carregadas) => {
      if (cancelado) return;

      setInteracoesAnotacoes((atuais) => {
        const proximo: InteracoesAnotacoesListasEstado = {};

        Object.entries(carregadas).forEach(([id, interacao]) => {
          proximo[id] = {
            ...interacao,
            novoComentario: atuais[id]?.novoComentario || "",
            respondendoComentarioId:
              atuais[id]?.respondendoComentarioId || "",
            respondendoAutorNome: atuais[id]?.respondendoAutorNome || "",
            ordenacaoComentarios:
              atuais[id]?.ordenacaoComentarios || "relevantes",
          };
        });

        return proximo;
      });
    });

    return () => {
      cancelado = true;
    };
  }, [listasPerfil, modo, usuarioAtualId]);

  useListasTargetWorkFocus({
    obraAlvoId,
    carregando,
    categoria,
    listasPerfil,
    modo,
    queryAtual,
    router,
    setCategoria,
    setObraDestacadaId,
  });

  const itensPerfilFiltrados = useMemo(
    () =>
      filtrarOrdenarItensPerfilListas(
        listasPerfil[categoria],
        busca,
        ordenacao,
      ),
    [busca, categoria, listasPerfil, ordenacao],
  );

  const obrasFiltradas = useMemo(
    () =>
      filtrarOrdenarObrasPublicasListas(
        obrasPublicas,
        busca,
        ordenacao,
        secao,
      ),
    [busca, obrasPublicas, ordenacao, secao],
  );

  const autoresFiltrados = useMemo(
    () => filtrarOrdenarAutoresListas(autores, busca, ordenacao),
    [autores, busca, ordenacao],
  );

  const totalResultados = calcularTotalResultadosListas({
    modo,
    itensPerfil: itensPerfilFiltrados,
    autores: autoresFiltrados,
    obras: obrasFiltradas,
  });
  const tituloPagina = obterTituloPaginaListas({
    tituloPersonalizado,
    modo,
    origemPerfil,
    perfilNome: perfil?.nome || "",
    secao,
    genero,
  });
  const agruparPorMes = deveAgruparPorMesListas(modo, categoria);
  const itensPerfilVisiveis = itensPerfilFiltrados.slice(0, quantidadeVisivel);
  const obrasVisiveis = obrasFiltradas.slice(0, quantidadeVisivel);
  const autoresVisiveis = autoresFiltrados.slice(0, quantidadeVisivel);

  const gruposPerfil = useMemo(
    () => agruparItensPerfilPorMesListas(itensPerfilVisiveis),
    [itensPerfilVisiveis],
  );

  const controlesCategoriasPerfilAtualStyle = isDesktop
    ? origemPerfil === "diario"
      ? desktopListDiaryControlsStyle
      : desktopControlsStyle
    : origemPerfil === "diario"
      ? listDiaryControlsStyle
      : controlsStyle;
  const abasCategoriasPerfilAtualStyle = isDesktop ? desktopTabsStyle : tabsStyle;
  const secaoResultadosAtualStyle = isDesktop
    ? desktopListSectionStyle
    : listSectionStyle;
  const linhasObrasAtualStyle = isDesktop ? desktopWorksRowsStyle : rowsStyle;

  function trocarCategoria(novaCategoria: CategoriaPerfil) {
    setCategoria(novaCategoria);
    const params = new URLSearchParams(queryAtual);
    params.set("categoria", novaCategoria);
    router.replace(`/listas?${params.toString()}`, { scroll: false });
  }

  async function abrirMenuObra(
    obra: ObraLista,
    item: ItemObraLista | null = null,
    categoriaAtual: CategoriaPerfil = "tudo",
  ) {
    setObraMenuAberta(obra);
    setItemPerfilMenuAberto(item);
    setCategoriaMenuAberta(categoriaAtual);
    setObraMenuNoQueroLer(false);
    setEditorAnotacao(EDITOR_ANOTACAO_LISTAS_VAZIO);

    try {
      const userId =
        usuarioAtualId ||
        (await supabase.auth.getUser()).data.user?.id ||
        "";

      if (!userId) {
        return;
      }

      const listaLocal = carregarListaIdsListas(
        LIBRARY_FOLLOW_STORAGE_KEY,
        userId,
      );
      const salvoLocalmente = colecaoTemObraListas(listaLocal, obra);

      setObraMenuNoQueroLer(salvoLocalmente);

      const { data, error } = await supabase
        .from("seguindo_obras")
        .select("obra_id")
        .eq("user_id", userId)
        .eq("obra_id", obra.id)
        .limit(1);

      if (error) {
        return;
      }

      const salvoRemotamente = Array.isArray(data) && data.length > 0;
      const salvo = salvoLocalmente || salvoRemotamente;

      setObraMenuNoQueroLer(salvo);

      if (salvoRemotamente && !salvoLocalmente) {
        salvarListaIdsListas(
          LIBRARY_FOLLOW_STORAGE_KEY,
          userId,
          Array.from(new Set([...listaLocal, obra.id])),
        );
      }
    } catch {
      // O estado local continua disponível mesmo sem resposta do Supabase.
    }
  }

  function fecharMenuObra() {
    if (salvandoQueroLer || editorAnotacao.salvando) {
      return;
    }

    setObraMenuAberta(null);
    setItemPerfilMenuAberto(null);
    setObraMenuNoQueroLer(false);
    setEditorAnotacao(EDITOR_ANOTACAO_LISTAS_VAZIO);
  }

  async function alternarObraNoQueroLer() {
    if (!obraMenuAberta || salvandoQueroLer) {
      return;
    }

    const obra = obraMenuAberta;
    setSalvandoQueroLer(true);

    try {
      const userId =
        usuarioAtualId ||
        (await supabase.auth.getUser()).data.user?.id ||
        "";

      if (!userId) {
        setObraMenuAberta(null);
        router.push(criarLoginHrefListas());
        return;
      }

      const listaAtual = carregarListaIdsListas(
        LIBRARY_FOLLOW_STORAGE_KEY,
        userId,
      );
      const jaEstaSalva =
        obraMenuNoQueroLer || colecaoTemObraListas(listaAtual, obra);
      const proximoEstado = !jaEstaSalva;
      const listaAtualizada = proximoEstado
        ? Array.from(new Set([...listaAtual, obra.id]))
        : removerObraDaColecaoListas(listaAtual, obra);

      salvarListaIdsListas(
        LIBRARY_FOLLOW_STORAGE_KEY,
        userId,
        listaAtualizada,
      );
      setObraMenuNoQueroLer(proximoEstado);
      setObraMenuAberta(null);
      setItemPerfilMenuAberto(null);

      await sincronizarQueroLerListas(userId, obra.id, proximoEstado);
    } finally {
      setSalvandoQueroLer(false);
    }
  }

  function copiarTextoComFallback(texto: string) {
    const campo = document.createElement("textarea");
    campo.value = texto;
    campo.setAttribute("readonly", "true");
    campo.style.position = "fixed";
    campo.style.left = "-9999px";
    document.body.appendChild(campo);
    campo.select();

    let copiado = false;

    try {
      copiado = document.execCommand("copy");
    } catch {
      copiado = false;
    }

    document.body.removeChild(campo);
    return copiado;
  }

  async function compartilharObraDoMenu() {
    if (!obraMenuAberta) {
      return;
    }

    const link = new URL(obraMenuAberta.link, window.location.origin).toString();
    const dados: ShareData = {
      title: `${obraMenuAberta.titulo} no HISTORIETAS`,
      text: `Confira ${obraMenuAberta.titulo} de ${obraMenuAberta.autor} no HISTORIETAS.`,
      url: link,
    };

    if (typeof navigator.share === "function") {
      try {
        await navigator.share(dados);
        fecharMenuObra();
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    }

    try {
      let copiado = false;

      if (
        window.isSecureContext &&
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === "function"
      ) {
        try {
          await navigator.clipboard.writeText(link);
          copiado = true;
        } catch {
          copiado = copiarTextoComFallback(link);
        }
      } else {
        copiado = copiarTextoComFallback(link);
      }

      if (!copiado) {
        throw new Error("Não foi possível copiar o link.");
      }

      fecharMenuObra();
    } catch {
      // Mantém a ação silenciosa quando o compartilhamento não estiver disponível.
    }
  }


  const perfilEhProprio = Boolean(
    modo === "perfil" &&
      usuarioAtualId &&
      perfil?.userId &&
      usuarioAtualId === perfil.userId,
  );
  async function salvarAvaliacaoDiarioPerfil(novaNota: number) {
    const perfilUserId = perfil?.userId.trim() || "";

    if (!perfilUserId || avaliacaoDiario.salvando || perfilEhProprio) {
      return;
    }

    if (!usuarioAtualId) {
      router.push(criarLoginHrefListas());
      return;
    }

    if (!avaliacaoDiario.visivel || !avaliacaoDiario.podeAvaliar) {
      return;
    }

    const nota =
      novaNota <= 0
        ? 0
        : Math.max(0.5, Math.min(5, Math.round(novaNota * 2) / 2));
    const avaliacaoAnterior = avaliacaoDiario;
    const avaliacaoOtimista = calcularProximaAvaliacaoDiarioListas(
      avaliacaoDiario,
      nota,
    );

    setAvaliacaoDiario(avaliacaoOtimista);
    setMensagemAcao("");

    try {
      const nomeRpc =
        nota > 0 ? "salvar_avaliacao_diario" : "remover_avaliacao_diario";
      const parametros =
        nota > 0
          ? { p_diario_user_id: perfilUserId, p_nota: nota }
          : { p_diario_user_id: perfilUserId };
      const { data, error } = await supabase.rpc(nomeRpc, parametros);

      if (error) {
        throw error;
      }

      if (data && typeof data === "object") {
        setAvaliacaoDiario((atual) =>
          normalizarAvaliacaoDiarioListas(data, atual),
        );
      } else {
        const avaliacaoAtualizada = await carregarAvaliacaoDiarioListas(
          perfilUserId,
        );
        setAvaliacaoDiario(avaliacaoAtualizada);
      }
    } catch (error) {
      setAvaliacaoDiario({
        ...avaliacaoAnterior,
        salvando: false,
        erro: obterMensagemErroListas(
          error,
          "Não foi possível salvar a Avaliação do Diário.",
        ),
      });
    }
  }


  function atualizarAnotacaoNosItensListas(
    obraId: string,
    atualizacao: Pick<
      ItemObraLista,
      | "anotacao"
      | "anotacaoId"
      | "anotacaoTipo"
      | "anotacaoVisibilidade"
      | "anotacaoQuemPodeComentar"
      | "anotacaoVisibilidadeComentarios"
      | "anotacaoPermitirCurtidas"
      | "anotacaoSpoiler"
    >,
  ) {
    setListasPerfil((estadoAtual) => {
      const proximo = { ...estadoAtual };

      (Object.keys(proximo) as CategoriaPerfil[]).forEach((categoriaEstado) => {
        proximo[categoriaEstado] = proximo[categoriaEstado].map((item) =>
          item.obra.id === obraId ? { ...item, ...atualizacao } : item,
        );
      });

      return proximo;
    });

    setItemPerfilMenuAberto((itemAtual) =>
      itemAtual?.obra.id === obraId
        ? { ...itemAtual, ...atualizacao }
        : itemAtual,
    );
  }

  function abrirEditorAnotacaoListas() {
    const item = itemPerfilMenuAberto;
    const obra = obraMenuAberta;

    if (!item || !obra || !perfilEhProprio || !idUsuarioValido(obra.id)) {
      setMensagemAcao("Você só pode editar anotações da sua própria lista.");
      return;
    }

    setEditorAnotacao({
      aberto: true,
      obraId: obra.id,
      anotacaoId: item.anotacaoId?.trim() || "",
      tipo:
        item.anotacaoTipo ||
        obterTipoDiarioDoItemListas(categoriaMenuAberta, item),
      texto: item.anotacao || "",
      visibilidade:
        item.anotacaoVisibilidade ||
        (preferenciasPerfil.anotacoesPrivadasPorPadrao
          ? "privado"
          : preferenciasPerfil.visibilidadeDiario === "publico"
            ? "publico"
            : "parcial"),
      quemPodeComentar: item.anotacaoQuemPodeComentar || "herdar",
      visibilidadeComentarios:
        item.anotacaoVisibilidadeComentarios || "herdar",
      permitirCurtidas: item.anotacaoPermitirCurtidas !== false,
      contemSpoiler: Boolean(item.anotacaoSpoiler),
      salvando: false,
      erro: "",
    });
  }

  async function salvarAnotacaoListas() {
    const userId = usuarioAtualId.trim();
    const obraId = editorAnotacao.obraId.trim();
    const textoAnotacao = editorAnotacao.texto.trim();

    if (!perfilEhProprio || !userId || !idUsuarioValido(userId)) {
      setEditorAnotacao((atual) => ({
        ...atual,
        erro: "Entre na sua conta para salvar a anotação.",
      }));
      return;
    }

    if (!obraId || !idUsuarioValido(obraId)) {
      setEditorAnotacao((atual) => ({
        ...atual,
        erro: "A obra ainda não possui um ID válido no Supabase.",
      }));
      return;
    }

    if (!textoAnotacao) {
      setEditorAnotacao((atual) => ({
        ...atual,
        erro: "Escreva uma anotação antes de salvar.",
      }));
      return;
    }

    setEditorAnotacao((atual) => ({ ...atual, salvando: true, erro: "" }));

    try {
      const atualizadoEm = new Date().toISOString();
      const visibilidadeHerdada: VisibilidadeAnotacaoListas =
        editorAnotacao.visibilidade;
      const payload = {
        user_id: userId,
        obra_id: obraId,
        tipo: editorAnotacao.tipo,
        texto: textoAnotacao.slice(0, DIARIO_ANOTACAO_MAX_LENGTH),
        visibilidade: visibilidadeHerdada,
        quem_pode_comentar: editorAnotacao.quemPodeComentar,
        visibilidade_comentarios: editorAnotacao.visibilidadeComentarios,
        permitir_curtidas: editorAnotacao.permitirCurtidas,
        contem_spoiler: editorAnotacao.contemSpoiler,
        atualizado_em: atualizadoEm,
      };
      const camposComSpoiler =
        "id,obra_id,tipo,texto,visibilidade,quem_pode_comentar,visibilidade_comentarios,permitir_curtidas,contem_spoiler,atualizado_em";

      async function atualizarRegistroAnotacao(id: string) {
    const resposta = await supabase
      .from("diario_anotacoes")
      .update({
        texto: payload.texto,
        visibilidade: payload.visibilidade,
        quem_pode_comentar: payload.quem_pode_comentar,
        visibilidade_comentarios: payload.visibilidade_comentarios,
        permitir_curtidas: payload.permitir_curtidas,
        contem_spoiler: payload.contem_spoiler,
        atualizado_em: payload.atualizado_em,
      })
      .eq("id", id)
      .eq("user_id", userId)
      .select(camposComSpoiler)
      .maybeSingle();

    if (resposta.error) {
      throw resposta.error;
    }

    return resposta.data
      ? resposta.data
      : null;
  }

  async function buscarRegistroAnotacaoExistente() {
    const resposta = await supabase
      .from("diario_anotacoes")
      .select(camposComSpoiler)
      .eq("user_id", userId)
      .eq("obra_id", obraId)
      .order("atualizado_em", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (resposta.error) {
      throw resposta.error;
    }

    return resposta.data
      ? resposta.data
      : null;
  }

  async function inserirRegistroAnotacao() {
    const resposta = await supabase
      .from("diario_anotacoes")
      .insert(payload)
      .select(camposComSpoiler)
      .single();

    if (resposta.error || !resposta.data) {
      throw (
        resposta.error ||
        new Error("O banco nao confirmou a anotacao salva.")
      );
    }

    return resposta.data;
  }

  let registroSalvo: RegistroGenerico | null = null;

      if (editorAnotacao.anotacaoId) {
        registroSalvo = await atualizarRegistroAnotacao(
          editorAnotacao.anotacaoId,
        );
      }

      if (!registroSalvo) {
        const anotacaoExistente = await buscarRegistroAnotacaoExistente();
        const idExistente = pegarTexto(anotacaoExistente?.id);

        registroSalvo = idExistente
          ? await atualizarRegistroAnotacao(idExistente)
          : await inserirRegistroAnotacao();
      }

      if (!registroSalvo) {
        throw new Error("O banco não confirmou a anotação salva.");
      }

      const anotacaoId = pegarTexto(registroSalvo.id);
      const tipoSalvo =
        normalizarTipoDiarioListas(registroSalvo.tipo) || editorAnotacao.tipo;
      const visibilidadeSalva = normalizarVisibilidadeAnotacaoListas(
        registroSalvo.visibilidade,
        visibilidadeHerdada,
      );
      const textoSalvo = pegarTexto(registroSalvo.texto, payload.texto);
      const quemPodeComentarSalvo = normalizarQuemPodeComentarAnotacaoListas(
        registroSalvo.quem_pode_comentar ?? registroSalvo.quemPodeComentar,
        editorAnotacao.quemPodeComentar,
      );
      const visibilidadeComentariosSalva =
        normalizarVisibilidadeComentariosAnotacaoListas(
          registroSalvo.visibilidade_comentarios ??
            registroSalvo.visibilidadeComentarios,
          editorAnotacao.visibilidadeComentarios,
        );
      const permitirCurtidasSalvo = pegarBooleanoListas(
        registroSalvo.permitir_curtidas ?? registroSalvo.permitirCurtidas,
        editorAnotacao.permitirCurtidas,
      );
      const contemSpoilerSalvo = pegarBooleanoListas(
        registroSalvo.contem_spoiler ?? registroSalvo.contemSpoiler,
        editorAnotacao.contemSpoiler,
      );

      if (anotacaoId) {
        const { error: erroDuplicadas } = await supabase
          .from("diario_anotacoes")
          .delete()
          .eq("user_id", userId)
          .eq("obra_id", obraId)
          .neq("id", anotacaoId);

        if (erroDuplicadas) {
          console.warn(
            "Não consegui remover anotações duplicadas:",
            erroDuplicadas.message,
          );
        }
      }

      salvarAnotacaoLocalListas(userId, {
        id: anotacaoId,
        user_id: userId,
        obra_id: obraId,
        tipo: tipoSalvo,
        texto: textoSalvo,
        visibilidade: visibilidadeSalva,
        quem_pode_comentar: quemPodeComentarSalvo,
        visibilidade_comentarios: visibilidadeComentariosSalva,
        permitir_curtidas: permitirCurtidasSalvo,
        contem_spoiler: contemSpoilerSalvo,
        atualizado_em: pegarTexto(registroSalvo.atualizado_em, atualizadoEm),
      });

      atualizarAnotacaoNosItensListas(obraId, {
        anotacao: textoSalvo,
        anotacaoId,
        anotacaoTipo: tipoSalvo,
        anotacaoVisibilidade: visibilidadeSalva,
        anotacaoQuemPodeComentar: quemPodeComentarSalvo,
        anotacaoVisibilidadeComentarios: visibilidadeComentariosSalva,
        anotacaoPermitirCurtidas: permitirCurtidasSalvo,
        anotacaoSpoiler: contemSpoilerSalvo,
      });

      const chaveAnotacaoSalva = anotacaoId || obraId;
      setAnotacoesAbertas((atuais) => ({
        ...atuais,
        [chaveAnotacaoSalva]: false,
      }));
      setAnotacoesSpoilerReveladas((atuais) => ({
        ...atuais,
        [chaveAnotacaoSalva]: false,
      }));

      if (anotacaoId && !interacoesAnotacoes[anotacaoId]) {
        setInteracoesAnotacoes((atual) => ({
          ...atual,
          [anotacaoId]: criarInteracaoAnotacaoListasVazia(),
        }));
      }

      setEditorAnotacao(EDITOR_ANOTACAO_LISTAS_VAZIO);
      setMensagemAcao("Anotação salva.");
    } catch (error) {
      setEditorAnotacao((atual) => ({
        ...atual,
        salvando: false,
        erro:
          error instanceof Error
            ? error.message
            : "Não foi possível salvar a anotação.",
      }));
    }
  }

  async function removerAnotacaoListas() {
    const userId = usuarioAtualId.trim();
    const obraId = editorAnotacao.obraId.trim();

    if (
      !perfilEhProprio ||
      !userId ||
      !obraId ||
      !window.confirm("Remover esta anotação?")
    ) {
      return;
    }

    setEditorAnotacao((atual) => ({ ...atual, salvando: true, erro: "" }));

    try {
      const { error } = await supabase
        .from("diario_anotacoes")
        .delete()
        .eq("user_id", userId)
        .eq("obra_id", obraId);

      if (error) throw error;

      removerAnotacaoLocalListas(userId, obraId);
      atualizarAnotacaoNosItensListas(obraId, {
        anotacao: undefined,
        anotacaoId: undefined,
        anotacaoTipo: undefined,
        anotacaoVisibilidade: undefined,
        anotacaoQuemPodeComentar: undefined,
        anotacaoVisibilidadeComentarios: undefined,
        anotacaoPermitirCurtidas: undefined,
        anotacaoSpoiler: undefined,
      });
      const chaveAnotacaoRemovida =
        editorAnotacao.anotacaoId || obraId;
      setAnotacoesAbertas((atuais) => {
        const proximo = { ...atuais };
        delete proximo[chaveAnotacaoRemovida];
        return proximo;
      });
      setAnotacoesSpoilerReveladas((atuais) => {
        const proximo = { ...atuais };
        delete proximo[chaveAnotacaoRemovida];
        return proximo;
      });
      setEditorAnotacao(EDITOR_ANOTACAO_LISTAS_VAZIO);
      setMensagemAcao("Anotação removida.");
    } catch (error) {
      setEditorAnotacao((atual) => ({
        ...atual,
        salvando: false,
        erro:
          error instanceof Error
            ? error.message
            : "Não foi possível remover a anotação.",
      }));
    }
  }

  function abrirDenunciaDiario(
    tipo: AlvoDenunciaDiarioListas["tipo"],
    id: string,
    titulo: string,
    autorId: string,
  ) {
    const alvoId = id.trim();
    const autorIdLimpo = autorId.trim();

    if (!alvoId || !idUsuarioValido(alvoId)) {
      setMensagemAcao("Não foi possível identificar este conteúdo.");
      return;
    }

    if (
      autorIdLimpo &&
      usuarioAtualId.trim() &&
      autorIdLimpo === usuarioAtualId.trim()
    ) {
      setMensagemAcao("Você não pode denunciar seu próprio conteúdo.");
      return;
    }

    if (tipo === "comentario_diario") {
      fecharComentariosDiario();
    }

    setAlvoDenunciaDiario({
      tipo,
      id: alvoId,
      titulo: titulo.trim() || "Conteúdo do Diário",
    });
  }

  function atualizarInteracaoAnotacaoListas(
    anotacaoId: string,
    atualizar: (estado: InteracaoAnotacaoListas) => InteracaoAnotacaoListas,
  ) {
    setInteracoesAnotacoes((estadoAtual) => ({
      ...estadoAtual,
      [anotacaoId]: atualizar(
        estadoAtual[anotacaoId] || criarInteracaoAnotacaoListasVazia(),
      ),
    }));
  }

  async function alternarCurtidaAnotacaoListas(item: ItemObraLista) {
    const anotacaoId = item.anotacaoId?.trim() || "";
    const userId = usuarioAtualId.trim();

    if (!anotacaoId) return;

    const permissoes = obterPermissoesAnotacaoListas({
      item,
      perfilEhProprio,
      relacionamentoPerfil,
      quemPodeComentarDiario: preferenciasPerfil.quemPodeComentarDiario,
    });

    if (!permissoes.podeCurtirAnotacao) {
      setMensagemAcao("As curtidas estão desativadas nesta anotação.");
      return;
    }

    if (!userId) {
      router.push(criarLoginHrefListas());
      return;
    }

    const interacao =
      interacoesAnotacoes[anotacaoId] || criarInteracaoAnotacaoListasVazia();

    if (interacao.salvandoCurtida) return;

    atualizarInteracaoAnotacaoListas(anotacaoId, (atual) => ({
      ...atual,
      salvandoCurtida: true,
      erro: "",
    }));

    try {
      if (interacao.curtiu) {
        const { error } = await supabase
          .from("diario_anotacao_curtidas")
          .delete()
          .eq("anotacao_id", anotacaoId)
          .eq("user_id", userId);
        if (error) throw error;

        atualizarInteracaoAnotacaoListas(anotacaoId, (atual) => ({
          ...atual,
          curtiu: false,
          totalCurtidas: Math.max(0, atual.totalCurtidas - 1),
          salvandoCurtida: false,
        }));
      } else {
        const { error } = await supabase
          .from("diario_anotacao_curtidas")
          .insert({ anotacao_id: anotacaoId, user_id: userId });
        if (error) throw error;

        atualizarInteracaoAnotacaoListas(anotacaoId, (atual) => ({
          ...atual,
          curtiu: true,
          totalCurtidas: atual.totalCurtidas + 1,
          salvandoCurtida: false,
        }));
      }
    } catch (error) {
      atualizarInteracaoAnotacaoListas(anotacaoId, (atual) => ({
        ...atual,
        salvandoCurtida: false,
        erro:
          error instanceof Error
            ? error.message
            : "Não foi possível atualizar a curtida.",
      }));
    }
  }

  function atualizarComentarioAnotacaoListas(anotacaoId: string, texto: string) {
    atualizarInteracaoAnotacaoListas(anotacaoId, (atual) => ({
      ...atual,
      novoComentario: texto.slice(0, DIARIO_COMENTARIO_MAX_LENGTH),
      erro: "",
    }));
  }

  function iniciarRespostaComentarioAnotacaoListas(
    anotacaoId: string,
    comentario: ComentarioAnotacaoListas,
  ) {
    atualizarInteracaoAnotacaoListas(anotacaoId, (atual) => ({
      ...atual,
      respondendoComentarioId: comentario.parentId || comentario.id,
      respondendoAutorNome: comentario.autorNome,
      erro: "",
    }));
  }

  function cancelarRespostaComentarioAnotacaoListas(anotacaoId: string) {
    atualizarInteracaoAnotacaoListas(anotacaoId, (atual) => ({
      ...atual,
      respondendoComentarioId: "",
      respondendoAutorNome: "",
    }));
  }

  function alterarOrdenacaoComentariosAnotacaoListas(
    anotacaoId: string,
    ordenacao: OrdenacaoComentariosDiarioListas,
  ) {
    atualizarInteracaoAnotacaoListas(anotacaoId, (atual) => ({
      ...atual,
      ordenacaoComentarios: ordenacao,
    }));
  }

  async function alternarCurtidaComentarioAnotacaoListas(
    anotacaoId: string,
    comentario: ComentarioAnotacaoListas,
  ) {
    const userId = usuarioAtualId.trim();

    if (!userId) {
      router.push(criarLoginHrefListas());
      return;
    }

    if (!comentario.id || comentarioCurtindoId) return;
    const curtiu = comentario.curtidas.includes(userId);
    setComentarioCurtindoId(comentario.id);

    try {
      if (curtiu) {
        const { error } = await supabase
          .from("diario_comentario_curtidas")
          .delete()
          .eq("comentario_id", comentario.id)
          .eq("user_id", userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("diario_comentario_curtidas")
          .insert({ comentario_id: comentario.id, user_id: userId });
        if (error) throw error;
      }

      atualizarInteracaoAnotacaoListas(anotacaoId, (atual) => ({
        ...atual,
        comentarios: atual.comentarios.map((itemComentario) =>
          itemComentario.id === comentario.id
            ? {
                ...itemComentario,
                curtidas: curtiu
                  ? itemComentario.curtidas.filter((id) => id !== userId)
                  : Array.from(new Set([...itemComentario.curtidas, userId])),
              }
            : itemComentario,
        ),
        erro: "",
      }));
    } catch (error) {
      atualizarInteracaoAnotacaoListas(anotacaoId, (atual) => ({
        ...atual,
        erro: obterMensagemErroListas(
          error,
          "Não foi possível atualizar a curtida do comentário.",
        ),
      }));
    } finally {
      setComentarioCurtindoId("");
    }
  }

  async function enviarComentarioAnotacaoListas(item: ItemObraLista) {
    const anotacaoId = item.anotacaoId?.trim() || "";
    const userId = usuarioAtualId.trim();

    if (!anotacaoId) return;

    const permissoes = obterPermissoesAnotacaoListas({
      item,
      perfilEhProprio,
      relacionamentoPerfil,
      quemPodeComentarDiario: preferenciasPerfil.quemPodeComentarDiario,
    });

    if (!permissoes.podeComentar) {
      setMensagemAcao("Você não tem permissão para comentar nesta anotação.");
      return;
    }

    if (!userId) {
      router.push(criarLoginHrefListas());
      return;
    }

    const interacao =
      interacoesAnotacoes[anotacaoId] || criarInteracaoAnotacaoListasVazia();
    const textoComentario = interacao.novoComentario.trim();

    if (!textoComentario) {
      atualizarInteracaoAnotacaoListas(anotacaoId, (atual) => ({
        ...atual,
        erro: "Escreva um comentário antes de enviar.",
      }));
      return;
    }

    if (interacao.enviandoComentario) return;

    atualizarInteracaoAnotacaoListas(anotacaoId, (atual) => ({
      ...atual,
      enviandoComentario: true,
      erro: "",
    }));

    try {
      const { data, error } = await supabase
        .from("diario_anotacao_comentarios")
        .insert({
          anotacao_id: anotacaoId,
          user_id: userId,
          texto: textoComentario.slice(0, DIARIO_COMENTARIO_MAX_LENGTH),
          parent_id: interacao.respondendoComentarioId || null,
        })
        .select(
          "id,anotacao_id,user_id,texto,parent_id,criado_em,atualizado_em",
        )
        .maybeSingle();

      if (error) throw error;

      const registro = data;
      const comentario: ComentarioAnotacaoListas = {
        id: pegarTexto(registro?.id),
        anotacaoId,
        userId,
        autorNome: usuarioAtualPerfil?.nome || "Você",
        autorUsername: usuarioAtualPerfil?.username || "",
        autorAvatar: usuarioAtualPerfil?.avatar || "",
        texto: pegarTexto(registro?.texto, textoComentario),
        criadoEm: pegarTexto(registro?.criado_em, new Date().toISOString()),
        atualizadoEm: pegarTexto(
          registro?.atualizado_em ?? registro?.criado_em,
          new Date().toISOString(),
        ),
        parentId: pegarTexto(
          registro?.parent_id,
          interacao.respondendoComentarioId,
        ),
        curtidas: [],
      };

      atualizarInteracaoAnotacaoListas(anotacaoId, (atual) => ({
        ...atual,
        comentarios: comentario.id
          ? [...atual.comentarios, comentario]
          : atual.comentarios,
        novoComentario: "",
        respondendoComentarioId: "",
        respondendoAutorNome: "",
        enviandoComentario: false,
      }));

      if (comentario.parentId) {
        setRespostasVisiveisComentariosDiario((atuais) => ({
          ...atuais,
          [comentario.parentId]: Math.max(
            5,
            atuais[comentario.parentId] || 0,
          ),
        }));
      }
    } catch (error) {
      atualizarInteracaoAnotacaoListas(anotacaoId, (atual) => ({
        ...atual,
        enviandoComentario: false,
        erro:
          error instanceof Error
            ? error.message
            : "Não foi possível enviar o comentário.",
      }));
    }
  }

  async function removerComentarioAnotacaoListas(
    item: ItemObraLista,
    comentario: ComentarioAnotacaoListas,
  ) {
    const anotacaoId = item.anotacaoId?.trim() || "";

    if (
      !anotacaoId ||
      !comentario.id ||
      comentario.userId !== usuarioAtualId ||
      !window.confirm("Remover este comentário?")
    ) {
      return;
    }

    setComentarioRemovendoId(comentario.id);

    try {
      const { error } = await supabase
        .from("diario_anotacao_comentarios")
        .delete()
        .eq("id", comentario.id)
        .eq("user_id", usuarioAtualId);

      if (error) throw error;

      atualizarInteracaoAnotacaoListas(anotacaoId, (atual) => ({
        ...atual,
        comentarios: atual.comentarios.filter(
          (itemComentario) =>
            itemComentario.id !== comentario.id &&
            itemComentario.parentId !== comentario.id,
        ),
        respondendoComentarioId:
          atual.respondendoComentarioId === comentario.id
            ? ""
            : atual.respondendoComentarioId,
        respondendoAutorNome:
          atual.respondendoComentarioId === comentario.id
            ? ""
            : atual.respondendoAutorNome,
        erro: "",
      }));
    } catch (error) {
      atualizarInteracaoAnotacaoListas(anotacaoId, (atual) => ({
        ...atual,
        erro: obterMensagemErroListas(
          error,
          "Não foi possível remover o comentário.",
        ),
      }));
    } finally {
      setComentarioRemovendoId("");
    }
  }



  function abrirComentariosDiario(item: ItemObraLista) {
    const anotacaoId = item.anotacaoId?.trim() || "";

    if (!anotacaoId) {
      return;
    }

    const permissoes = obterPermissoesAnotacaoListas({
      item,
      perfilEhProprio,
      relacionamentoPerfil,
      quemPodeComentarDiario: preferenciasPerfil.quemPodeComentarDiario,
    });

    if (!permissoes.podeVerComentarios) {
      setMensagemAcao("Os comentários desta anotação não estão disponíveis.");
      return;
    }

    comentariosDragOffsetYRef.current = 0;
    comentariosDragIgnorarCliqueRef.current = false;
    setComentariosDiarioItem(item);
    setComentariosDiarioExpandido(false);
    setMenuOrdenacaoComentariosDiarioAberto(false);
    setRespostasVisiveisComentariosDiario({});
  }

  function fecharComentariosDiario() {
    setComentariosDiarioItem(null);
    setComentariosDiarioExpandido(false);
    setMenuOrdenacaoComentariosDiarioAberto(false);
    comentariosDragOffsetYRef.current = 0;
  }

  function iniciarArrasteComentariosDiario(
    event: TouchEvent<HTMLDivElement>,
  ) {
    if (isDesktop) {
      return;
    }

    comentariosDragStartYRef.current = event.touches[0]?.clientY || 0;
    comentariosDragOffsetYRef.current = 0;
    comentariosDragIgnorarCliqueRef.current = false;

    if (comentariosDragResetTimerRef.current !== null) {
      window.clearTimeout(comentariosDragResetTimerRef.current);
      comentariosDragResetTimerRef.current = null;
    }

    if (comentariosSheetRef.current) {
      comentariosSheetRef.current.style.transition = "none";
    }
  }

  function moverArrasteComentariosDiario(
    event: TouchEvent<HTMLDivElement>,
  ) {
    if (isDesktop) {
      return;
    }

    const posicaoAtual =
      event.touches[0]?.clientY || comentariosDragStartYRef.current;
    const limiteSuperior = comentariosDiarioExpandido ? -46 : -58;
    const limiteInferior = comentariosDiarioExpandido ? 112 : 132;
    const deslocamento = Math.max(
      limiteSuperior,
      Math.min(
        limiteInferior,
        posicaoAtual - comentariosDragStartYRef.current,
      ),
    );

    comentariosDragOffsetYRef.current = deslocamento;

    if (Math.abs(deslocamento) > 6) {
      comentariosDragIgnorarCliqueRef.current = true;
    }

    const handle = comentariosSheetRef.current?.querySelector(
      "[data-comments-sheet-handle='true']",
    ) as HTMLElement | null;

    if (handle) {
      handle.style.transform = `translate3d(0, ${deslocamento}px, 0)`;
    }
  }

  function finalizarArrasteComentariosDiario() {
    if (isDesktop) {
      return;
    }

    const deslocamento = comentariosDragOffsetYRef.current;

    if (comentariosSheetRef.current) {
      comentariosSheetRef.current.style.transition = "height 220ms ease";
    }

    const handle = comentariosSheetRef.current?.querySelector(
      "[data-comments-sheet-handle='true']",
    ) as HTMLElement | null;

    if (handle) {
      handle.style.transition = "transform 160ms ease";
      handle.style.transform = "";
    }

    if (comentariosDragIgnorarCliqueRef.current) {
      comentariosDragResetTimerRef.current = window.setTimeout(() => {
        comentariosDragIgnorarCliqueRef.current = false;
        comentariosDragResetTimerRef.current = null;
      }, 350);
    }

    if (deslocamento < -34) {
      setComentariosDiarioExpandido(true);
      return;
    }

    if (deslocamento > 52 && comentariosDiarioExpandido) {
      setComentariosDiarioExpandido(false);
      return;
    }

    if (deslocamento > 118 && !comentariosDiarioExpandido) {
      fecharComentariosDiario();
    }
  }

  function alternarExpansaoComentariosDiario() {
    if (isDesktop || comentariosDragIgnorarCliqueRef.current) {
      return;
    }

    setComentariosDiarioExpandido((expandido) => !expandido);
  }

  function inserirNoComentarioDiario(texto: string) {
    const anotacaoId = comentariosDiarioItem?.anotacaoId?.trim() || "";

    if (!anotacaoId) {
      return;
    }

    const interacao =
      interacoesAnotacoes[anotacaoId] || criarInteracaoAnotacaoListasVazia();
    const separador = interacao.novoComentario && texto !== "@" ? " " : "";

    atualizarComentarioAnotacaoListas(
      anotacaoId,
      `${interacao.novoComentario}${separador}${texto}`,
    );
  }

  function renderizarItemObra(
    item: ItemObraLista,
    categoriaAtual: CategoriaPerfil,
  ) {
    const obra = item.obra;
    const detalheVisivel =
      categoriaAtual === "avaliacoes"
        ? <ListasRatingDetail nota={item.nota} data={item.data} />
        : categoriaAtual === "tudo"
          ? formatarLeituraMesAno(item.ultimaLeituraEm || "")
          : textoSecundarioItem(item, categoriaAtual);
    const anotacaoId = item.anotacaoId?.trim() || "";
    const chaveAnotacao = anotacaoId || obra.id;
    const anotacaoAberta = Boolean(anotacoesAbertas[chaveAnotacao]);
    const spoilerRevelado = Boolean(
      anotacoesSpoilerReveladas[chaveAnotacao],
    );

    function alternarExibicaoAnotacao() {
      const proximoEstado = !anotacaoAberta;

      setAnotacoesAbertas((atuais) => ({
        ...atuais,
        [chaveAnotacao]: proximoEstado,
      }));

      if (!proximoEstado) {
        setAnotacoesSpoilerReveladas((atuais) => ({
          ...atuais,
          [chaveAnotacao]: false,
        }));
      }
    }
    const interacao = anotacaoId
      ? interacoesAnotacoes[anotacaoId] ||
        criarInteracaoAnotacaoListasVazia()
      : criarInteracaoAnotacaoListasVazia();
    const permissoesAnotacao = obterPermissoesAnotacaoListas({
      item,
      perfilEhProprio,
      relacionamentoPerfil,
      quemPodeComentarDiario: preferenciasPerfil.quemPodeComentarDiario,
    });
    return (
      <ListasProfileWorkRow
        key={item.chave}
        annotation={
          item.anotacao && anotacaoAberta ? (
            <ListasDiaryAnnotationCard
                annotation={item.anotacao}
                annotationId={anotacaoId}
                authorName={perfil?.nome || "usuário"}
                canLike={permissoesAnotacao.podeCurtirAnotacao}
                canSeeComments={permissoesAnotacao.podeVerComentarios}
                commentAriaLabel={`Abrir ${interacao.comentarios.length} ${
                  interacao.comentarios.length === 1
                    ? "comentário"
                    : "comentários"
                } da anotação`}
                commentCount={compactarNumero(interacao.comentarios.length)}
                containsSpoiler={Boolean(item.anotacaoSpoiler)}
                isLiked={interacao.curtiu}
                isSavingLike={interacao.salvandoCurtida}
                likeAriaLabel={`${
                  interacao.curtiu
                    ? "Remover curtida da anotação"
                    : "Curtir anotação"
                }. ${compactarNumero(interacao.totalCurtidas)} ${
                  interacao.totalCurtidas === 1 ? "curtida" : "curtidas"
                }`}
                likeCount={compactarNumero(interacao.totalCurtidas)}
                onLike={() => void alternarCurtidaAnotacaoListas(item)}
                onOpenComments={() => abrirComentariosDiario(item)}
                onSetSpoilerRevealed={(revelado) =>
                  setAnotacoesSpoilerReveladas((atuais) => ({
                    ...atuais,
                    [chaveAnotacao]: revelado,
                  }))
                }
                spoilerRevealed={spoilerRevelado}
                styles={{
                  annotation: listDiaryCardAnnotationStyle,
                  annotationCommentButton: listDiaryCardAnnotationCommentButtonStyle,
                  annotationCommentCount: listDiaryCardAnnotationCommentCountStyle,
                  annotationCommentIcon: listDiaryCardAnnotationCommentIconStyle,
                  annotationHeader: listDiaryCardAnnotationHeaderStyle,
                  annotationHeaderActions: listDiaryCardAnnotationHeaderActionsStyle,
                  annotationLikeButton: listDiaryCardAnnotationLikeButtonStyle,
                  annotationLikeCount: listDiaryCardAnnotationLikeCountStyle,
                  annotationLikeIcon: listDiaryCardAnnotationLikeIconStyle,
                  annotationText: listDiaryCardAnnotationTextStyle,
                  annotationTitle: listDiaryCardAnnotationTitleStyle,
                  annotationTitleGroup: listDiaryCardAnnotationTitleGroupStyle,
                  spoiler: listDiaryCardSpoilerStyle,
                  spoilerButton: listDiaryCardSpoilerButtonStyle,
                  spoilerText: listDiaryCardSpoilerTextStyle,
                }}
              workId={obra.id}
            />
          ) : null
        }
        annotationOpen={anotacaoAberta}
        autor={obra.autor}
        className={`historietas-list-row${
          obraDestacadaId === obra.id
            ? " historietas-list-row-highlight"
            : ""
        }`}
        coverStyle={criarCapaStyle(obra.capa)}
        detalhe={detalheVisivel}
        genero={obra.genero}
        hasAnnotation={Boolean(item.anotacao)}
        href={obra.link}
        notaFormatada={formatarNotaListas(item.nota)}
        onOpenOptions={() => void abrirMenuObra(obra, item, categoriaAtual)}
        onToggleAnnotation={alternarExibicaoAnotacao}
        showRating={item.nota > 0 && categoriaAtual !== "avaliacoes"}
        styles={{
          detail: rowDetailStyle,
          mainLink: rowMainLinkStyle,
          meta: rowMetaStyle,
          moreDot: moreDotStyle,
          moreOptions: moreOptionsStyle,
          optionsButton: rowOptionsButtonStyle,
          ratingSignal: rowRatingSignalStyle,
          ratingSignalStar: rowRatingSignalStarStyle,
          signal: rowSignalStyle,
          signalAnnotationToggle: rowSignalAnnotationToggleStyle,
          signals: rowSignalsStyle,
          text: rowTextStyle,
          title: rowTitleStyle,
        }}
        titulo={obra.titulo}
        workId={obra.id}
      />
    );
  }


  function renderizarComentariosDiarioSheet() {
    const item = comentariosDiarioItem;

    if (!item || typeof document === "undefined") {
      return null;
    }

    const itemSelecionado = item;
    const anotacaoId = itemSelecionado.anotacaoId?.trim() || "";

    if (!anotacaoId) {
      return null;
    }

    const interacao =
      interacoesAnotacoes[anotacaoId] || criarInteracaoAnotacaoListasVazia();
    const permissoes = obterPermissoesAnotacaoListas({
      item: itemSelecionado,
      perfilEhProprio,
      relacionamentoPerfil,
      quemPodeComentarDiario: preferenciasPerfil.quemPodeComentarDiario,
    });
    const comentariosRaiz = ordenarComentariosRaizDiarioListas(
      interacao.comentarios,
      interacao.ordenacaoComentarios,
    );

    const commentStyles: ListasDiaryCommentStyles = {
      actionsRow: commentActionsRowStyle,
      authorLink: commentAuthorLinkStyle,
      content: commentContentStyle,
      heartIcon: commentHeartIconStyle,
      item: commentItemStyle,
      likeButton: commentLikeButtonStyle,
      likeCount: commentLikeCountStyle,
      likeWrap: commentLikeWrapStyle,
      removeButton: commentRemoveButtonStyle,
      replyButton: commentReplyButtonStyle,
      replyItem: commentReplyItemStyle,
      reportButton: commentReportButtonStyle,
      text: commentTextStyle,
      time: commentTimeStyle,
      topLine: commentTopLineStyle,
    };
    const threadStyles: ListasDiaryCommentThreadStyles = {
      controls: commentRepliesControlsStyle,
      hideButton: commentRepliesHideButtonStyle,
      line: commentRepliesLineStyle,
      repliesList: commentRepliesListStyle,
      thread: commentThreadStyle,
      toggle: commentRepliesToggleStyle,
    };
    const sheetStyles: ListasDiaryCommentsSheetStyles = {
      backdrop: commentsSheetBackdropStyle,
      compact: commentsSheetCompactStyle,
      desktop: desktopCommentsSheetStyle,
      empty: emptyCommentsStyle,
      error: commentsSheetErrorStyle,
      expanded: commentsSheetExpandedStyle,
      form: commentsSheetFormStyle,
      handle: commentsSheetHandleStyle,
      handleWrap: commentsSheetHandleWrapStyle,
      header: commentsSheetHeaderStyle,
      headerSpacer: commentsSheetHeaderSpacerStyle,
      input: commentsSheetInputStyle,
      inputBox: commentsInputBoxStyle,
      inputIconButton: commentsInputIconButtonStyle,
      list: commentsSheetListStyle,
      loading: commentsLoadingStyle,
      overlay: commentsSheetOverlayStyle,
      panel: commentsSheetStyle,
      quickReactionButton: commentsQuickReactionButtonStyle,
      quickReactions: commentsQuickReactionsStyle,
      replyingBanner: commentsReplyingBannerStyle,
      replyingCancel: commentsReplyingCancelStyle,
      send: commentsSheetSendStyle,
      sortMenu: commentsSortMenuStyle,
      sortMenuDivider: commentsSortMenuDividerStyle,
      sortMenuItem: commentsSortMenuItemStyle,
      sortMenuItemActive: commentsSortMenuItemActiveStyle,
      sortMenuTrigger: commentsSortMenuTriggerStyle,
      sortMenuWrap: commentsSortMenuWrapStyle,
      title: commentsSheetTitleStyle,
      tools: commentsToolsStyle,
    };

    function renderizarComentarioSheet(
      comentario: ComentarioAnotacaoListas,
      resposta = false,
    ) {
      const comentarioEhProprio =
        Boolean(usuarioAtualId) && comentario.userId === usuarioAtualId;
      const comentarioCurtiu = Boolean(
        usuarioAtualId && comentario.curtidas.includes(usuarioAtualId),
      );
      const hrefPerfil = idUsuarioValido(comentario.userId)
        ? `/perfil-autor?autorId=${encodeURIComponent(comentario.userId)}`
        : "/perfil-autor";
      const carregandoCurtida = comentarioCurtindoId === comentario.id;
      const removendoComentario = comentarioRemovendoId === comentario.id;
      const avatarBaseStyle = resposta
        ? commentReplyAvatarLinkStyle
        : commentAvatarLinkStyle;

      return (
        <ListasDiaryComment
          key={comentario.id}
          avatarContent={
            !comentario.autorAvatar &&
            (comentario.autorNome.slice(0, 1).toUpperCase() || "U")
          }
          avatarStyle={criarAvatarComentarioDiarioListasStyle(
            avatarBaseStyle,
            comentario.autorAvatar,
          )}
          carregandoCurtida={carregandoCurtida}
          comentario={comentario}
          comentarioCurtiu={comentarioCurtiu}
          comentarioEhProprio={comentarioEhProprio}
          formatarData={formatarDataCurta}
          hrefPerfil={hrefPerfil}
          onLike={() =>
            void alternarCurtidaComentarioAnotacaoListas(
              anotacaoId,
              comentario,
            )
          }
          onRemove={() =>
            void removerComentarioAnotacaoListas(itemSelecionado, comentario)
          }
          onReply={() =>
            iniciarRespostaComentarioAnotacaoListas(anotacaoId, comentario)
          }
          onReport={() =>
            abrirDenunciaDiario(
              "comentario_diario",
              comentario.id,
              `Comentário de ${comentario.autorNome} em ${itemSelecionado.obra.titulo}`,
              comentario.userId,
            )
          }
          podeResponder={permissoes.podeComentar}
          removendoComentario={removendoComentario}
          resposta={resposta}
          styles={commentStyles}
        />
      );
    }

    function renderizarThreadComentarioSheet(
      comentario: ComentarioAnotacaoListas,
    ) {
      const respostas = obterRespostasComentarioDiarioListas(
        interacao.comentarios,
        comentario.id,
      );
      const quantidadeVisivel = Math.min(
        respostas.length,
        respostasVisiveisComentariosDiario[comentario.id] || 0,
      );
      const respostasVisiveis = respostas.slice(0, quantidadeVisivel);
      const respostasOcultas = Math.max(
        0,
        respostas.length - quantidadeVisivel,
      );
      const respostasExpandidas = quantidadeVisivel > 0;

      return (
        <ListasDiaryCommentThread
          key={comentario.id}
          comentario={renderizarComentarioSheet(comentario)}
          onCollapseReplies={() =>
            setRespostasVisiveisComentariosDiario((atuais) => ({
              ...atuais,
              [comentario.id]: 0,
            }))
          }
          onExpandReplies={() =>
            setRespostasVisiveisComentariosDiario((atuais) => ({
              ...atuais,
              [comentario.id]: Math.min(5, respostas.length),
            }))
          }
          onShowMoreReplies={() =>
            setRespostasVisiveisComentariosDiario((atuais) => ({
              ...atuais,
              [comentario.id]: Math.min(
                respostas.length,
                (atuais[comentario.id] || 0) + 5,
              ),
            }))
          }
          quantidadeRespostas={respostas.length}
          quantidadeRespostasOcultas={respostasOcultas}
          respostas={respostasVisiveis.map((resposta) =>
            renderizarComentarioSheet(resposta, true),
          )}
          respostasExpandidas={respostasExpandidas}
          styles={threadStyles}
        />
      );
    }

    return (
      <ListasDiaryCommentsSheet
        ariaLabelTextarea={
          permissoes.podeComentar
            ? interacao.respondendoComentarioId
              ? "Adicionar resposta"
              : "Adicionar comentário"
            : "Comentários limitados pelo dono do Diário"
        }
        avatar={
          <div
            style={criarAvatarComentarioDiarioListasStyle(
              commentsInputAvatarStyle,
              permissoes.podeComentar ? usuarioAtualPerfil?.avatar || "" : "",
            )}
          >
            {!(permissoes.podeComentar && usuarioAtualPerfil?.avatar) &&
              (permissoes.podeComentar
                ? usuarioAtualPerfil?.nome || "U"
                : "H"
              )
                .slice(0, 1)
                .toUpperCase()}
          </div>
        }
        comentario={interacao.novoComentario}
        comentarioEmEnvio={interacao.enviandoComentario}
        comentarios={comentariosRaiz.map(renderizarThreadComentarioSheet)}
        comentariosCarregando={interacao.carregando}
        comentariosErro={interacao.erro}
        comentariosExpandido={comentariosDiarioExpandido}
        comentariosTemPermissao={permissoes.podeComentar}
        comentariosTemRaiz={comentariosRaiz.length > 0}
        comentariosTotal={interacao.comentarios.length}
        isDesktop={isDesktop}
        maxLength={DIARIO_COMENTARIO_MAX_LENGTH}
        menuOrdenacaoAberto={menuOrdenacaoComentariosDiarioAberto}
        onCancelReply={() =>
          cancelarRespostaComentarioAnotacaoListas(anotacaoId)
        }
        onChangeComentario={(texto) =>
          atualizarComentarioAnotacaoListas(anotacaoId, texto)
        }
        onClose={fecharComentariosDiario}
        onHandleKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            alternarExpansaoComentariosDiario();
          }
        }}
        onHandleTouchCancel={finalizarArrasteComentariosDiario}
        onHandleTouchEnd={finalizarArrasteComentariosDiario}
        onHandleTouchMove={moverArrasteComentariosDiario}
        onHandleTouchStart={iniciarArrasteComentariosDiario}
        onInsertReaction={inserirNoComentarioDiario}
        onSelectOrdenacao={(ordenacao) => {
          alterarOrdenacaoComentariosAnotacaoListas(anotacaoId, ordenacao);
          setMenuOrdenacaoComentariosDiarioAberto(false);
        }}
        onSubmit={(event) => {
          event.preventDefault();
          void enviarComentarioAnotacaoListas(itemSelecionado);
        }}
        onToggleExpand={alternarExpansaoComentariosDiario}
        onToggleOrdenacao={() =>
          setMenuOrdenacaoComentariosDiarioAberto((aberto) => !aberto)
        }
        ordenacao={interacao.ordenacaoComentarios}
        placeholderTextarea={
          permissoes.podeComentar
            ? interacao.respondendoComentarioId
              ? "Adicionar resposta..."
              : "Adicionar comentário..."
            : "Comentários limitados pelo dono do Diário."
        }
        quickReactions={["💜", "🔥", "😂", "😮", "😭", "👏"]}
        respondendoAutorNome={interacao.respondendoAutorNome}
        respondendoComentarioId={interacao.respondendoComentarioId}
        sheetRef={comentariosSheetRef}
        styles={sheetStyles}
        tituloObra={itemSelecionado.obra.titulo}
      />
    );
  }


  function renderizarObraPublica(obra: ObraLista) {
    return (
      <ListasPublicWorkRow
        key={obra.id}
        coverStyle={criarCapaStyle(obra.capa)}
        genero={obra.genero}
        href={obra.link}
        onOpenOptions={() => void abrirMenuObra(obra, null, "tudo")}
        styles={{
          mainLink: rowMainLinkStyle,
          meta: rowMetaStyle,
          moreDot: moreDotStyle,
          moreOptions: moreOptionsStyle,
          optionsButton: rowOptionsButtonStyle,
          text: rowTextStyle,
          title: rowTitleStyle,
        }}
        titulo={obra.titulo}
      />
    );
  }

  function renderizarAutor(autor: AutorLista) {
    const href = idUsuarioValido(autor.id)
      ? `/perfil-autor?autorId=${encodeURIComponent(autor.id)}`
      : `/perfil-autor?autor=${encodeURIComponent(autor.nome)}`;

    return (
      <ListasAuthorRow
        key={autor.id || autor.nome}
        avatar={autor.avatar}
        avatarStyle={criarAvatarStyle(autor.avatar)}
        href={href}
        nome={autor.nome}
        styles={{
          authorLink: rowAuthorLinkStyle,
          meta: rowMetaStyle,
          text: rowTextStyle,
          title: rowTitleStyle,
        }}
        totalObras={autor.totalObras}
        username={autor.username}
      />
    );
  }

  return (
    <main style={pageThemeStyle}>
      <style>{`${historietasThemeCss}${listasPageCss}`}</style>


      <ListasPageHeader
        avaliacaoDiario={avaliacaoDiario}
        criarAvatarStyle={criarAvatarPerfilDiarioListasStyle}
        formatarNota={formatarNotaListas}
        headerInnerStyle={headerInnerStyle}
        headerStyle={headerStyle}
        isDiaryProfile={modo === "perfil" && origemPerfil === "diario"}
        listDiaryHeaderRatingBoxStyle={listDiaryHeaderRatingBoxStyle}
        listDiaryHeaderRatingStarActiveStyle={listDiaryHeaderRatingStarActiveStyle}
        listDiaryHeaderRatingStarBaseStyle={listDiaryHeaderRatingStarBaseStyle}
        listDiaryHeaderRatingStarButtonStyle={listDiaryHeaderRatingStarButtonStyle}
        listDiaryHeaderRatingStarFillStyle={listDiaryHeaderRatingStarFillStyle}
        listDiaryHeaderRatingStarVisualStyle={listDiaryHeaderRatingStarVisualStyle}
        listDiaryHeaderRatingStarsRowStyle={listDiaryHeaderRatingStarsRowStyle}
        listDiaryProfileHeaderStyle={listDiaryProfileHeaderStyle}
        listDiaryProfileHeaderTopStyle={listDiaryProfileHeaderTopStyle}
        listDiaryProfileTitleAreaStyle={listDiaryProfileTitleAreaStyle}
        listDiaryProfileTitleStyle={listDiaryProfileTitleStyle}
        listDiaryRatingNumberStyle={listDiaryRatingNumberStyle}
        listDiaryRatingSummaryStarBaseStyle={listDiaryRatingSummaryStarBaseStyle}
        listDiaryRatingSummaryStarFillStyle={listDiaryRatingSummaryStarFillStyle}
        listDiaryRatingSummaryStarVisualStyle={listDiaryRatingSummaryStarVisualStyle}
        listDiaryRatingSummaryStarsStyle={listDiaryRatingSummaryStarsStyle}
        listDiaryRatingSummaryStyle={listDiaryRatingSummaryStyle}
        listDiaryRatingTotalStyle={listDiaryRatingTotalStyle}
        notasAvaliacao={NOTAS_AVALIACAO_LISTAS}
        obterPreenchimentoEstrela={obterPreenchimentoEstrelaListas}
        obterProximaNota={obterProximaNotaAvaliacaoListas}
        onAvaliarDiario={(nota) => void salvarAvaliacaoDiarioPerfil(nota)}
        pageTitleStyle={pageTitleStyle}
        perfil={perfil}
        perfilEhProprio={perfilEhProprio}
        tituloPagina={tituloPagina}
      />

      {mensagemAcao && (
        <div role="status" style={actionMessageStyle}>
          {mensagemAcao}
        </div>
      )}

      <ListasProfileCategoryControls
        bloqueado={bloqueado}
        categoriaAtiva={categoria}
        categorias={CATEGORIAS_PERFIL}
        contagens={listasPerfil}
        controlsStyle={controlesCategoriasPerfilAtualStyle}
        modo={modo}
        onTrocarCategoria={trocarCategoria}
        tabActiveStyle={tabActiveStyle}
        tabCountStyle={tabCountStyle}
        tabStyle={tabStyle}
        tabsStyle={abasCategoriasPerfilAtualStyle}
      />

      <ListasResultsSection
        agruparPorMes={agruparPorMes}
        autoresVisiveis={autoresVisiveis}
        bloqueado={bloqueado}
        erro={erro}
        gruposPerfil={gruposPerfil}
        hasMore={quantidadeVisivel < totalResultados}
        itensPerfilVisiveis={itensPerfilVisiveis}
        listSectionStyle={secaoResultadosAtualStyle}
        loadMoreButtonStyle={loadMoreButtonStyle}
        carregando={carregando}
        modo={modo}
        monthGroupStyle={monthGroupStyle}
        monthTitleStyle={monthTitleStyle}
        obrasVisiveis={obrasVisiveis}
        onCarregarMais={() =>
          setQuantidadeVisivel((quantidade) => quantidade + 40)
        }
        renderizarAutor={renderizarAutor}
        renderizarItemPerfil={(item) => renderizarItemObra(item, categoria)}
        renderizarObraPublica={renderizarObraPublica}
        rowsStyle={rowsStyle}
        stateIconStyle={stateIconStyle}
        stateLinkStyle={stateLinkStyle}
        stateStyle={stateStyle}
        stateTextStyle={stateTextStyle}
        totalResultados={totalResultados}
        worksRowsStyle={linhasObrasAtualStyle}
      />

      <footer style={footerStyle}>
        <span>Historietas</span>
      </footer>

      <ListasDiaryReportModal
        alvo={alvoDenunciaDiario}
        onClose={() => setAlvoDenunciaDiario(null)}
        onSent={() => {
          setAlvoDenunciaDiario(null);
          setMensagemAcao("Denúncia enviada para análise.");
        }}
      />

      {obraMenuAberta && (
        <ListasWorkActionSheet
          detalhe={
            itemPerfilMenuAberto
              ? textoSecundarioItem(itemPerfilMenuAberto, categoriaMenuAberta)
              : ""
          }
          editor={editorAnotacao}
          editorStyles={{
            cancel: listDiaryAnnotationCancelStyle,
            counter: listDiaryAnnotationCounterStyle,
            editor: listDiaryActionSheetEditorStyle,
            editorMeta: listDiaryAnnotationEditorMetaStyle,
            error: listDiaryAnnotationErrorStyle,
            metaActions: listDiaryAnnotationMetaActionsStyle,
            remove: listDiaryAnnotationRemoveStyle,
            save: listDiaryAnnotationSaveStyle,
            spoilerCheckbox: listDiaryAnnotationSpoilerCheckboxStyle,
            spoilerLabel: listDiaryAnnotationSpoilerLabelStyle,
            textarea: listDiaryAnnotationTextareaStyle,
            textareaWrap: listDiaryAnnotationTextareaWrapStyle,
          }}
          hrefPrincipal={
            itemPerfilMenuAberto
              ? obterHrefContinuarLeituraListas(itemPerfilMenuAberto)
              : obraMenuAberta.link
          }
          item={itemPerfilMenuAberto}
          maxAnnotationLength={DIARIO_ANOTACAO_MAX_LENGTH}
          onCancelAnnotation={() => setEditorAnotacao(EDITOR_ANOTACAO_LISTAS_VAZIO)}
          onClose={fecharMenuObra}
          onEditAnnotation={abrirEditorAnotacaoListas}
          onRemoveAnnotation={() => void removerAnotacaoListas()}
          onReportAnnotation={() => {
            const anotacaoId = itemPerfilMenuAberto?.anotacaoId?.trim() || "";

            if (!anotacaoId) {
              return;
            }

            setObraMenuAberta(null);
            setItemPerfilMenuAberto(null);
            setObraMenuNoQueroLer(false);
            abrirDenunciaDiario(
              "diario_anotacao",
              anotacaoId,
              `Anotação de ${perfil?.nome || "usuário"} em ${obraMenuAberta.titulo}`,
              perfil?.userId || "",
            );
          }}
          onSaveAnnotation={() => void salvarAnotacaoListas()}
          onShare={() => void compartilharObraDoMenu()}
          onToggleWantToRead={() => void alternarObraNoQueroLer()}
          obra={obraMenuAberta}
          perfilEhProprio={perfilEhProprio}
          podeContinuar={Boolean(
            itemPerfilMenuAberto && itemPerfilMenuAberto.progresso > 0,
          )}
          queroLer={obraMenuNoQueroLer}
          salvandoQueroLer={salvandoQueroLer}
          setEditor={setEditorAnotacao}
          styles={{
            actions: actionSheetActionsStyle,
            button: actionSheetButtonStyle,
            buttonDisabled: actionSheetButtonDisabledStyle,
            buttonIcon: actionSheetButtonIconStyle,
            detail: actionSheetDetailStyle,
            handle: actionSheetHandleStyle,
            header: actionSheetHeaderStyle,
            meta: actionSheetMetaStyle,
            overlay: actionSheetOverlayStyle,
            panel: actionSheetStyle,
            report: listDiaryActionSheetReportStyle,
            selection: actionSheetSelectionDotStyle,
            selectionActive: actionSheetSelectionDotActiveStyle,
            title: actionSheetTitleStyle,
          }}
        />
      )}

      {renderizarComentariosDiarioSheet()}
    </main>
  );
}
export default function ListasUniversaisPage() {
  return (
    <Suspense
      fallback={
        <main style={pageStyle}>
          <div style={stateStyle}>Carregando lista...</div>
        </main>
      }
    >
      <ListasUniversaisContent />
    </Suspense>
  );
}
