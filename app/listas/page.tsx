"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { useListasActionMessage } from "./hooks/use-listas-action-message";
import { useListasDiaryCommentsSheetLifecycle } from "./hooks/use-listas-diary-comments-sheet-lifecycle";
import { useListasDiaryCommentsControls } from "./hooks/use-listas-diary-comments-controls";
import { useListasDesktopMode } from "./hooks/use-listas-desktop-mode";
import { useListasDiaryInteractionsSync } from "./hooks/use-listas-diary-interactions-sync";
import { useListasPageDataLoader } from "./hooks/use-listas-page-data-loader";
import { useListasRouteUiSync } from "./hooks/use-listas-route-ui-sync";
import { useListasTargetWorkFocus } from "./hooks/use-listas-target-work-focus";
import { useListasWorkMenuLifecycle } from "./hooks/use-listas-work-menu-lifecycle";
import { useListasWorkMenuActions } from "./hooks/use-listas-work-menu-actions";
import { useListasDiaryAnnotationActions } from "./hooks/use-listas-diary-annotation-actions";
import { useListasDiaryInteractionActions } from "./hooks/use-listas-diary-interaction-actions";
import ListasRatingDetail from "./components/listas-rating-detail";
import { ListasPageHeader } from "./components/listas-page-header";
import { ListasProfileCategoryControls } from "./components/listas-profile-category-controls";
import { ListasResultsSection } from "./components/listas-results-section";
import { ListasDiaryReportModal } from "./components/listas-diary-report-modal";
import { ListasWorkActionSheet } from "./components/listas-work-action-sheet";
import { ListasAuthorRow } from "./components/listas-author-row";
import { ListasProfileWorkItem } from "./components/listas-profile-work-item";
import { ListasDiaryCommentsPanel } from "./components/listas-diary-comments-panel";
import { ListasPublicWorkRow } from "./components/listas-public-work-row";
import { formatarLeituraMesAno, formatarNotaListas } from "./lib/listas-format-utils";
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
} from "./lib/listas-work-styles";
import {
  criarAvatarPerfilDiarioListasStyle,
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
} from "./lib/listas-diary-comments-styles";
import { criarAvatarStyle, criarCapaStyle } from "./lib/listas-row-media-utils";
import {
  criarInteracaoAnotacaoListasVazia,
} from "./lib/listas-diary-comment-utils";
import { type InteracoesAnotacoesListasEstado } from "./lib/listas-diary-interactions-loader";
import {
  obterHrefContinuarLeituraListas,
} from "./lib/listas-profile-items-utils";
import { carregarAvaliacaoDiarioListas } from "./lib/listas-profile-records-loader";
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
  AVALIACAO_DIARIO_LISTAS_VAZIA,
  calcularProximaAvaliacaoDiarioListas,
  normalizarAvaliacaoDiarioListas,
  obterPreenchimentoEstrelaListas,
  obterProximaNotaAvaliacaoListas,
  type AvaliacaoDiarioListasEstado,
} from "./lib/listas-diary-rating-utils";
import { criarLoginHrefListas } from "./lib/listas-storage-utils";
import {
  idUsuarioValido,
  obterMensagemErroListas,
  pegarTexto,
} from "./lib/listas-value-utils";
import {
  normalizarCategoriaPerfil,
  normalizarModoLista,
  normalizarOrdenacao,
  normalizarOrigemPerfil,
} from "./lib/listas-route-utils";
import { supabase } from "../../lib/supabase/client";
import {
  historietasThemeCss,
  useHistorietasTheme,
} from "../../lib/historietasTheme";
import {
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

  useListasPageDataLoader({
    modo,
    origemPerfil,
    userIdUrl,
    secao,
    genero,
    listasPerfilVazias: LISTAS_PERFIL_VAZIAS,
    permissoesProprioPerfil: PERMISSOES_PROPRIO_PERFIL,
    storageKeys: {
      seguindo: LIBRARY_FOLLOW_STORAGE_KEY,
      favoritas: FAVORITES_STORAGE_KEY,
      concluidas: COMPLETED_STORAGE_KEY,
    },
    avaliacaoDiarioVazia: AVALIACAO_DIARIO_LISTAS_VAZIA,
    setCarregando,
    setBloqueado,
    setErro,
    setAvaliacaoDiario,
    setUsuarioAtualId,
    setUsuarioAtualPerfil,
    setPerfil,
    setListasPerfil,
    setPreferenciasPerfil,
    setRelacionamentoPerfil,
    setObrasPublicas,
    setAutores,
  });

  useListasDiaryCommentsSheetLifecycle({
    comentariosDiarioItem,
    setComentariosDiarioItem,
    setComentariosDiarioExpandido,
    setMenuOrdenacaoComentariosDiarioAberto,
  });

  useListasDiaryInteractionsSync({
    listasPerfil,
    modo,
    usuarioAtualId,
    setInteracoesAnotacoes,
  });

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

  const {
    abrirMenuObra,
    fecharMenuObra,
    alternarObraNoQueroLer,
    compartilharObraDoMenu,
  } = useListasWorkMenuActions({
    editorAnotacao,
    editorAnotacaoVazio: EDITOR_ANOTACAO_LISTAS_VAZIO,
    obraMenuAberta,
    obraMenuNoQueroLer,
    router,
    salvandoQueroLer,
    setCategoriaMenuAberta,
    setEditorAnotacao,
    setItemPerfilMenuAberto,
    setObraMenuAberta,
    setObraMenuNoQueroLer,
    setSalvandoQueroLer,
    storageKey: LIBRARY_FOLLOW_STORAGE_KEY,
    usuarioAtualId,
  });

  const perfilEhProprio = Boolean(
    modo === "perfil" &&
      usuarioAtualId &&
      perfil?.userId &&
      usuarioAtualId === perfil.userId,
  );

  const {
    alternarCurtidaAnotacaoListas,
    alternarCurtidaComentarioAnotacaoListas,
    alterarOrdenacaoComentariosAnotacaoListas,
    atualizarComentarioAnotacaoListas,
    cancelarRespostaComentarioAnotacaoListas,
    enviarComentarioAnotacaoListas,
    iniciarRespostaComentarioAnotacaoListas,
    removerComentarioAnotacaoListas,
  } = useListasDiaryInteractionActions({
    comentarioCurtindoId,
    diarioComentarioMaxLength: DIARIO_COMENTARIO_MAX_LENGTH,
    interacoesAnotacoes,
    perfilEhProprio,
    preferenciasPerfil,
    relacionamentoPerfil,
    router,
    setComentarioCurtindoId,
    setComentarioRemovendoId,
    setInteracoesAnotacoes,
    setMensagemAcao,
    setRespostasVisiveisComentariosDiario,
    usuarioAtualId,
    usuarioAtualPerfil,
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

  const {
    abrirEditorAnotacaoListas,
    removerAnotacaoListas,
    salvarAnotacaoListas,
  } = useListasDiaryAnnotationActions({
    categoriaMenuAberta,
    diarioAnotacaoMaxLength: DIARIO_ANOTACAO_MAX_LENGTH,
    editorAnotacao,
    editorAnotacaoVazio: EDITOR_ANOTACAO_LISTAS_VAZIO,
    interacoesAnotacoes,
    itemPerfilMenuAberto,
    obraMenuAberta,
    perfilEhProprio,
    preferenciasPerfil,
    setAnotacoesAbertas,
    setAnotacoesSpoilerReveladas,
    setEditorAnotacao,
    setInteracoesAnotacoes,
    setItemPerfilMenuAberto,
    setListasPerfil,
    setMensagemAcao,
    usuarioAtualId,
  });

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


  const {
    abrirComentariosDiario,
    alternarExpansaoComentariosDiario,
    comentariosSheetRef,
    fecharComentariosDiario,
    finalizarArrasteComentariosDiario,
    iniciarArrasteComentariosDiario,
    inserirNoComentarioDiario,
    moverArrasteComentariosDiario,
  } = useListasDiaryCommentsControls({
    comentariosDiarioExpandido,
    comentariosDiarioItem,
    criarInteracaoVazia: criarInteracaoAnotacaoListasVazia,
    interacoesAnotacoes,
    isDesktop,
    obterPermissoes: (item) =>
      obterPermissoesAnotacaoListas({
        item,
        perfilEhProprio,
        relacionamentoPerfil,
        quemPodeComentarDiario: preferenciasPerfil.quemPodeComentarDiario,
      }),
    setComentariosDiarioExpandido,
    setComentariosDiarioItem,
    setMenuOrdenacaoComentariosDiarioAberto,
    setMensagemAcao,
    setRespostasVisiveisComentariosDiario,
    atualizarComentario: atualizarComentarioAnotacaoListas,
  });

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
      <ListasProfileWorkItem
        key={item.chave}
        annotation={item.anotacao || ""}
        annotationId={anotacaoId}
        annotationOpen={anotacaoAberta}
        annotationSpoiler={Boolean(item.anotacaoSpoiler)}
        authorName={perfil?.nome || "usuário"}
        autor={obra.autor}
        canLikeAnnotation={permissoesAnotacao.podeCurtirAnotacao}
        canSeeComments={permissoesAnotacao.podeVerComentarios}
        className={`historietas-list-row${
          obraDestacadaId === obra.id
            ? " historietas-list-row-highlight"
            : ""
        }`}
        commentCount={interacao.comentarios.length}
        coverStyle={criarCapaStyle(obra.capa)}
        detalhe={detalheVisivel}
        genero={obra.genero}
        hasAnnotation={Boolean(item.anotacao)}
        href={obra.link}
        isAnnotationLiked={interacao.curtiu}
        isSavingAnnotationLike={interacao.salvandoCurtida}
        nota={item.nota}
        onLikeAnnotation={() => void alternarCurtidaAnotacaoListas(item)}
        onOpenComments={() => abrirComentariosDiario(item)}
        onOpenOptions={() => void abrirMenuObra(obra, item, categoriaAtual)}
        onSetSpoilerRevealed={(revelado) =>
          setAnotacoesSpoilerReveladas((atuais) => ({
            ...atuais,
            [chaveAnotacao]: revelado,
          }))
        }
        onToggleAnnotation={alternarExibicaoAnotacao}
        showRating={item.nota > 0 && categoriaAtual !== "avaliacoes"}
        spoilerRevealed={spoilerRevelado}
        titulo={obra.titulo}
        totalCurtidasAnnotation={interacao.totalCurtidas}
        workId={obra.id}
      />
    );
  }


  function renderizarComentariosDiarioSheet() {
    const item = comentariosDiarioItem;

    if (!item) {
      return null;
    }

    const permissoes = obterPermissoesAnotacaoListas({
      item,
      perfilEhProprio,
      relacionamentoPerfil,
      quemPodeComentarDiario: preferenciasPerfil.quemPodeComentarDiario,
    });

    return (
      <ListasDiaryCommentsPanel
        comentarioCurtindoId={comentarioCurtindoId}
        comentarioRemovendoId={comentarioRemovendoId}
        comentariosDiarioExpandido={comentariosDiarioExpandido}
        comentariosDiarioItem={item}
        diarioComentarioMaxLength={DIARIO_COMENTARIO_MAX_LENGTH}
        interacoesAnotacoes={interacoesAnotacoes}
        isDesktop={isDesktop}
        menuOrdenacaoComentariosDiarioAberto={menuOrdenacaoComentariosDiarioAberto}
        onAlterarOrdenacao={alterarOrdenacaoComentariosAnotacaoListas}
        onAlternarCurtida={(anotacaoId, comentario) => void alternarCurtidaComentarioAnotacaoListas(anotacaoId, comentario)}
        onCancelReply={cancelarRespostaComentarioAnotacaoListas}
        onChangeComentario={atualizarComentarioAnotacaoListas}
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
        onOpenReport={abrirDenunciaDiario}
        onRemoveComment={(itemSelecionado, comentario) => void removerComentarioAnotacaoListas(itemSelecionado, comentario)}
        onReply={iniciarRespostaComentarioAnotacaoListas}
        onSend={(itemSelecionado) => void enviarComentarioAnotacaoListas(itemSelecionado)}
        onToggleExpand={alternarExpansaoComentariosDiario}
        onToggleOrdenacao={() => setMenuOrdenacaoComentariosDiarioAberto((aberto) => !aberto)}
        permissoes={permissoes}
        respostasVisiveis={respostasVisiveisComentariosDiario}
        setMenuOrdenacaoComentariosDiarioAberto={setMenuOrdenacaoComentariosDiarioAberto}
        setRespostasVisiveis={setRespostasVisiveisComentariosDiario}
        sheetRef={comentariosSheetRef}
        usuarioAtualId={usuarioAtualId}
        usuarioAtualPerfil={usuarioAtualPerfil}
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
