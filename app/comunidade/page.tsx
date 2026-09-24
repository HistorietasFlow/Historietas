"use client";

import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from "react";
import type { FormEvent } from "react";
import { supabase } from "../../lib/supabase/client";
import { normalizarTexto } from "../../lib/utils";
import { useHistorietasTheme } from "../../lib/historietasTheme";
import { useHistorietasLanguage } from "../../components/HistorietasLanguageProvider";
import DenunciaModal from "../../components/DenunciaModal";
import type { CategoriaComunidade } from "./components/community-category";
import { CATEGORIAS_COMUNIDADE } from "./components/community-categories";
import { normalizarCategoria } from "./components/community-category-normalizer";
import type { VisibilidadePostComunidade } from "./components/community-post-visibility";
import { VISIBILIDADES_POST_COMUNIDADE } from "./components/community-post-visibility-options";
import type { TipoPublicacaoComunidade } from "./components/community-publication-type";
import { TIPOS_PUBLICACAO_COMUNIDADE } from "./components/community-publication-types";
import type { TipoPublicacaoFiltro } from "./components/community-publication-filter";
import type { OrdenacaoComunidade } from "./components/community-sort-order";
import type { AbaFeedComunidade } from "./components/community-feed-tab";
import { ABAS_FEED_COMUNIDADE } from "./components/community-feed-tabs";
import type {
  AlvoDenunciaComunidade,
  DenunciaAlvoComunidade,
} from "./components/community-report-target";
import type {
  UsuarioBuscaComunidade,
  UsuarioComunidade,
} from "./components/community-user";
import { obterNomeUsuario } from "./components/community-user-name";
import { obterNomeSeguroUsuarioComunidade } from "./components/community-safe-user-name";
import type { ObraRelacionadaSugestao } from "./components/community-related-work-suggestion";
import type { SugestaoPublicacaoComunidade } from "./components/community-publication-suggestion";
import { SUGESTOES_PUBLICACAO_COMUNIDADE } from "./components/community-publication-suggestions";
import type { PostComunidade } from "./components/community-post-model";
import { CommunityLoadingSpinner } from "./components/community-loading-spinner";
import { CommunityFeedLoadingState } from "./components/community-feed-loading-state";
import { communityPageStyle } from "./components/community-page-style";
import {
  juntarObraECapituloRelacionados,
  separarObraECapituloRelacionados,
} from "./components/community-related-chapter-utils";
import { criarLinkObraRelacionada } from "./components/community-related-work-link";
import { obterTipoPublicacaoPorParametro } from "./components/community-publication-type-parameter";
import type { GrupoPublicacaoObra } from "./components/community-publication-group";
import { obterGrupoPublicacaoObraPorParametro } from "./components/community-publication-group-parameter";
import { normalizarSugestaoObraLocal } from "./components/community-related-work-local-normalizer";
import {
  normalizarSugestaoObraSupabase,
  type SupabaseObraPublicaRow,
} from "./components/community-related-work-supabase-normalizer";
import { mapearComentarioSupabase } from "./components/community-supabase-comment-mapper";
import type { SupabaseComentarioRow } from "./components/community-supabase-comment-row";
import type { SupabaseComentarioCurtidaRow } from "./components/community-supabase-comment-like-row";
import { mapearPostSupabase } from "./components/community-supabase-post-mapper";
import type { SupabasePostRow } from "./components/community-supabase-post-row";
import type { SupabaseCurtidaRow } from "./components/community-supabase-like-row";
import type { PerfilComunidadeRow } from "./components/community-supabase-profile-row";
import { obterTextoProfileComunidade } from "./components/community-profile-text";
import { obterNomeProfileComunidade } from "./components/community-profile-name";
import { obterAvatarProfileComunidade } from "./components/community-profile-avatar";
import { buscarUsuariosComunidadeSupabase } from "./components/community-supabase-user-search";
import { buscarUsuariosComunidadeNosPosts } from "./components/community-post-user-search";
import { carregarUsuariosSeguidosComunidade } from "./components/community-supabase-followed-users-loader";
import { salvarSeguindoUsuarioComunidade } from "./components/community-follow-user-saver";
import { criarLoginHrefComunidade } from "./components/community-login-link";
import { mapearPostsSupabase } from "./components/community-supabase-posts-mapper";
import { formatarErroSupabase } from "./components/community-supabase-error-formatter";
import { carregarPostsSalvosSupabaseComunidade } from "./components/community-supabase-saved-posts-loader";
import { salvarPostSalvoSupabaseComunidade } from "./components/community-supabase-saved-post-saver";
import { erroEhSessaoAusenteComunidade } from "./components/community-supabase-missing-session-error-check";
import { idSupabaseValidoComunidade } from "./components/community-supabase-id-validator";
import { obterUsuarioAutenticadoComunidadeAtual } from "./components/community-supabase-current-user-loader";
import { carregarProfilesComunidadePorUsuarios } from "./components/community-supabase-profiles-loader";
import { removerSugestoesObrasDuplicadas } from "./components/community-related-work-deduplicator";
import { obterObraRelacionadaPermitida } from "./components/community-related-work-allowed-finder";
import { removerReviewComunidadeDoDiario } from "./components/community-diary-review-remover";
import { registrarReviewComunidadeNoDiario } from "./components/community-diary-review-registrar";
import { obterLinhasTexto } from "./components/community-text-lines";
import { obterTodasOpcoesEnquete } from "./components/community-all-poll-options";
import { obterPerguntaEnquete } from "./components/community-poll-question";
import { obterOpcoesEnquete } from "./components/community-valid-poll-options";
import { carregarVotosEnquetesLocais } from "./components/community-local-poll-votes-loader";
import type { ResultadoVotosEnquete } from "./components/community-poll-votes-result";
import { carregarVotosEnquetesSupabase } from "./components/community-supabase-poll-votes-loader";
import { criarNotificacaoComunidadeSupabase } from "./components/community-supabase-notification-creator";
import { contarCurtidasUnicasPostComunidade } from "./components/community-unique-post-likes-count";
import { contarComentaristasUnicosPostComunidade } from "./components/community-unique-post-commenters-count";
import { obterPontuacaoPost } from "./components/community-post-score";
import { criarPerfilHrefComunidade } from "./components/community-profile-link";
import { obterLinkPublicacaoComunidade } from "./components/community-post-link";
import { copiarTextoComFallback } from "./components/community-clipboard-copy";
import type { ComentarioComunidade } from "./components/community-comment";
import { obterIdsComentarioComRespostasComunidade } from "./components/community-comment-response-ids";
import { ComentariosSheet } from "./components/community-comments-sheet";
import { salvarVotosEnquetesLocais } from "./components/community-local-poll-votes-saver";
import { calcularTotalVotosEnquete } from "./components/community-poll-total-votes";
import { calcularPorcentagemOpcaoEnquete } from "./components/community-poll-option-percentage";
import { postEhEnquete } from "./components/community-post-poll-check";
import { obterTipoVisualPublicacao } from "./components/community-publication-visual-type";
import {
  MAX_OPCOES_ENQUETE,
  MIN_OPCOES_ENQUETE,
  MODELO_ENQUETE_COMUNIDADE,
} from "./components/community-poll-constants";
import {
  CHAVE_POSTS_SALVOS_COMUNIDADE,
} from "./components/community-storage-keys";
import {
  IDS_COMENTARIOS_POR_LOTE,
  OBRAS_RELACIONADAS_POR_PAGINA,
  POSTS_COMUNIDADE_POR_PAGINA,
  REGISTROS_COMUNIDADE_POR_PAGINA,
} from "./components/community-pagination-constants";
import { CommunityThemeStyles } from "./components/community-theme-styles";
import { CommunityPageContainer } from "./components/community-page-container";
import { CommunityContentContainer } from "./components/community-content-container";
import { CommunityTopWaterFade } from "./components/community-top-water-fade";
import { CommunityDesktopHeader } from "./components/community-desktop-header";
import { CommunityDesktopTitle } from "./components/community-desktop-title";
import { CommunityDesktopHeaderActions } from "./components/community-desktop-header-actions";
import { CommunityDesktopSearchContainer } from "./components/community-desktop-search-container";
import { CommunityDesktopSearchIcon } from "./components/community-desktop-search-icon";
import { CommunityDesktopSearchInput } from "./components/community-desktop-search-input";
import { CommunityDesktopFilterButton } from "./components/community-desktop-filter-button";
import { CommunityMainLayout } from "./components/community-main-layout";
import { CommunityFeedColumn } from "./components/community-feed-column";
import { CommunityFeedErrorNotice } from "./components/community-feed-error-notice";
import { CommunityFeedFiltersContainer } from "./components/community-feed-filters-container";
import { CommunityFilterControlsRow } from "./components/community-filter-controls-row";
import { CommunitySearchContainer } from "./components/community-search-container";
import { CommunitySearchInput } from "./components/community-search-input";
import { CommunitySearchToggleButton } from "./components/community-search-toggle-button";
import { CommunitySearchIcon } from "./components/community-search-icon";
import { CommunityAdvancedFiltersButton } from "./components/community-advanced-filters-button";
import { CommunityAdvancedFiltersIcon } from "./components/community-advanced-filters-icon";
import { CommunityFeedTabsContainer } from "./components/community-feed-tabs-container";
import { CommunityFeedTabButton } from "./components/community-feed-tab-button";
import { CommunitySheetOverlay } from "./components/community-sheet-overlay";
import { CommunitySheetSurface } from "./components/community-sheet-surface";
import { CommunitySheetHandle } from "./components/community-sheet-handle";
import { CommunitySheetTitle } from "./components/community-sheet-title";
import { CommunitySheetSectionLabel } from "./components/community-sheet-section-label";
import { CommunitySheetFilterOption } from "./components/community-sheet-filter-option";
import { CommunitySheetPrimaryAction } from "./components/community-sheet-primary-action";
import { CommunitySheetMenuAction } from "./components/community-sheet-menu-action";
import { CommunitySheetDangerAction } from "./components/community-sheet-danger-action";
import { CommunitySheetVisibilityMenu } from "./components/community-sheet-visibility-menu";
import { CommunitySheetVisibilityTitle } from "./components/community-sheet-visibility-title";
import { CommunitySheetVisibilityOption } from "./components/community-sheet-visibility-option";
import { CommunityUserSearchSection } from "./components/community-user-search-section";
import { CommunitySearchResultsHeader } from "./components/community-search-results-header";
import { CommunitySearchResultsTitle } from "./components/community-search-results-title";
import { CommunitySearchResultsCount } from "./components/community-search-results-count";
import { CommunitySearchResultsEmpty } from "./components/community-search-results-empty";
import { CommunityUserSearchLoading } from "./components/community-user-search-loading";
import { CommunityUserSearchList } from "./components/community-user-search-list";
import { CommunityUserSearchCard } from "./components/community-user-search-card";
import { CommunityUserSearchAvatar } from "./components/community-user-search-avatar";
import { CommunityUserSearchInfo } from "./components/community-user-search-info";
import { CommunityUserSearchName } from "./components/community-user-search-name";
import { CommunityUserSearchUsername } from "./components/community-user-search-username";
import { CommunityUserSearchFollowButton } from "./components/community-user-search-follow-button";
import { CommunityUserSearchSelfBadge } from "./components/community-user-search-self-badge";
import { CommunityPostsList } from "./components/community-posts-list";
import { CommunityFeedEmptyMessage } from "./components/community-feed-empty-message";
import { CommunityPostComposerOverlay } from "./components/community-post-composer-overlay";
import { CommunityPostComposerBackdrop } from "./components/community-post-composer-backdrop";
import { CommunityPostComposerPanel } from "./components/community-post-composer-panel";
import { CommunityPostComposerHeader } from "./components/community-post-composer-header";
import { CommunityPostComposerForm } from "./components/community-post-composer-form";
import { CommunityPostComposerFields } from "./components/community-post-composer-fields";
import { CommunityPostComposerField } from "./components/community-post-composer-field";
import { CommunityPostComposerFieldLabel } from "./components/community-post-composer-field-label";
import { CommunityPostComposerSelect } from "./components/community-post-composer-select";
import { CommunityPostComposerInput } from "./components/community-post-composer-input";
import { getCommunityPostComposerRelatedChapterInputStyle } from "./components/community-post-composer-related-chapter-input-style";
import { CommunityPostComposerRelatedWorkSearch } from "./components/community-post-composer-related-work-search";
import { CommunityPostComposerRelatedWorkSuggestions } from "./components/community-post-composer-related-work-suggestions";
import { CommunityPostComposerRelatedWorkSuggestionButton } from "./components/community-post-composer-related-work-suggestion-button";
import { CommunityPostComposerRelatedWorkSuggestionContent } from "./components/community-post-composer-related-work-suggestion-content";
import { CommunityPostComposerRelatedWorkSuggestionTitle } from "./components/community-post-composer-related-work-suggestion-title";
import { CommunityPostComposerRelatedWorkSuggestionAuthor } from "./components/community-post-composer-related-work-suggestion-author";
import { CommunityPostComposerRelatedWorkSuggestionBadge } from "./components/community-post-composer-related-work-suggestion-badge";
import { CommunityPostComposerPublicationHeader } from "./components/community-post-composer-publication-header";
import { CommunityPostComposerPublicationTools } from "./components/community-post-composer-publication-tools";
import { CommunityPostComposerPollTemplateButton } from "./components/community-post-composer-poll-template-button";
import { CommunityPostComposerCharacterCount } from "./components/community-post-composer-character-count";
import { CommunityPostComposerSuggestionsSection } from "./components/community-post-composer-suggestions-section";
import { CommunityPostComposerSuggestionsLabel } from "./components/community-post-composer-suggestions-label";
import { CommunityPostComposerSuggestionsList } from "./components/community-post-composer-suggestions-list";
import { CommunityPostComposerSuggestionButton } from "./components/community-post-composer-suggestion-button";
import { CommunityPostComposerTextarea } from "./components/community-post-composer-textarea";
import { CommunityPostComposerErrorMessage } from "./components/community-post-composer-error-message";
import { CommunityPostComposerActionRow } from "./components/community-post-composer-action-row";
import { CommunityPostComposerSpoilerButton } from "./components/community-post-composer-spoiler-button";
import { CommunityPostComposerSpoilerLabel } from "./components/community-post-composer-spoiler-label";
import { CommunityPostComposerSpoilerIndicator } from "./components/community-post-composer-spoiler-indicator";
import { CommunityPostComposerPublishButton } from "./components/community-post-composer-publish-button";
import { CommunityActionFeedbackToast } from "./components/community-action-feedback-toast";
import { CommunityLoadMorePostsContainer } from "./components/community-load-more-posts-container";
import { CommunityLoadMorePostsButton } from "./components/community-load-more-posts-button";
import { CommunityPostCard } from "./components/community-post-card";
import { CommunityPostHeader } from "./components/community-post-header";
import { CommunityPostAuthorAvatar } from "./components/community-post-author-avatar";
import { CommunityPostAuthorMeta } from "./components/community-post-author-meta";
import { CommunityPostAuthorLink } from "./components/community-post-author-link";
import { CommunityPostStatusLine } from "./components/community-post-status-line";
import { CommunityPostStatusSeparator } from "./components/community-post-status-separator";
import { CommunityPostBadgesRow } from "./components/community-post-badges-row";
import { CommunityPostBadgeSeparator } from "./components/community-post-badge-separator";
import { CommunityPostOptionsContainer } from "./components/community-post-options-container";
import { CommunityPostOptionsButton } from "./components/community-post-options-button";
import { CommunityPostPinnedBadge } from "./components/community-post-pinned-badge";
import { CommunityPostVisibilityBadge } from "./components/community-post-visibility-badge";
import { CommunityPostTypeBadge } from "./components/community-post-type-badge";
import { CommunitySpoilerHiddenTitle } from "./components/community-spoiler-hidden-title";
import { CommunityPostText } from "./components/community-post-text";
import { CommunityPostActions } from "./components/community-post-actions";
import { CommunityPostLikeButton } from "./components/community-post-like-button";
import { CommunityPostCommentsButton } from "./components/community-post-comments-button";
import { CommunityPostSpoilerButton } from "./components/community-post-spoiler-button";
import { CommunityPollBox } from "./components/community-poll-box";
import { CommunityPollOptions } from "./components/community-poll-options";
import { CommunityPollOptionButton } from "./components/community-poll-option-button";
import { CommunityPollResultBar } from "./components/community-poll-result-bar";
import { CommunityPollOptionText } from "./components/community-poll-option-text";
import { CommunityPollOptionStatus } from "./components/community-poll-option-status";
import { CommunityRelatedWorkBadge } from "./components/community-related-work-badge";
import { CommunityRelatedChapterBadge } from "./components/community-related-chapter-badge";
import { traduzirTextoComunidade } from "./components/community-text-translator";
import { traduzirContagemResultadosComunidade } from "./components/community-results-count-translator";
import { formatarDataComunidade } from "./components/community-post-date-formatter";
import { carregarJsonUsuarioComunidade } from "./components/community-user-json-loader";
import { salvarJsonUsuarioComunidade } from "./components/community-user-json-saver";
import {
  criarHrefAceiteTermos,
  verificarAceiteTermosPublicacao,
} from "../../lib/aceiteTermos";
import {
  calcularIntervaloPaginaSupabase,
  carregarTodasPaginasSupabase,
  dividirEmLotesSupabase,
} from "../../lib/supabase/paginacao.mjs";

function CommunityLanguageBridge() {
  const { language } = useHistorietasLanguage();

  useEffect(() => {
    if (typeof document === "undefined" || !document.body) {
      return;
    }

    type EstadoTraducaoComunidade = {
      original: string;
      traduzido: string;
    };

    const estadosTexto: WeakMap<Text, EstadoTraducaoComunidade> =
      new WeakMap();
    const estadosAtributos: WeakMap<
      Element,
      Map<string, EstadoTraducaoComunidade>
    > = new WeakMap();
    const textosAlterados = new Set<Text>();
    const atributosAlterados = new Set<{ elemento: Element; atributo: string }>();
    const atributosTraduziveis = ["aria-label", "title", "placeholder", "alt"];
    let aplicando = false;

    function deveIgnorarElemento(elemento: Element | null) {
      if (!elemento) {
        return true;
      }

      const tag = elemento.tagName.toLowerCase();

      return (
        tag === "script" ||
        tag === "style" ||
        tag === "textarea" ||
        Boolean(elemento.closest("[data-historietas-user-content='true']"))
      );
    }

    function aplicarTexto(no: Text) {
      const elementoPai = no.parentElement;

      if (deveIgnorarElemento(elementoPai)) {
        return;
      }

      const atual = no.data;
      let estado = estadosTexto.get(no);

      if (!estado) {
        estado = { original: atual, traduzido: atual };
        estadosTexto.set(no, estado);
        textosAlterados.add(no);
      } else if (atual !== estado.traduzido && atual !== estado.original) {
        estado.original = atual;
      }

      const proximo = traduzirTextoComunidade(estado.original, language);
      estado.traduzido = proximo;

      if (no.data !== proximo) {
        no.data = proximo;
      }
    }

    function aplicarAtributo(elemento: Element, atributo: string) {
      if (deveIgnorarElemento(elemento) || !elemento.hasAttribute(atributo)) {
        return;
      }

      const atual = elemento.getAttribute(atributo) || "";
      let mapaElemento = estadosAtributos.get(elemento);

      if (!mapaElemento) {
        mapaElemento = new Map();
        estadosAtributos.set(elemento, mapaElemento);
      }

      let estado = mapaElemento.get(atributo);

      if (!estado) {
        estado = { original: atual, traduzido: atual };
        mapaElemento.set(atributo, estado);
        atributosAlterados.add({ elemento, atributo });
      } else if (atual !== estado.traduzido && atual !== estado.original) {
        estado.original = atual;
      }

      const proximo = traduzirTextoComunidade(estado.original, language);
      estado.traduzido = proximo;

      if (atual !== proximo) {
        elemento.setAttribute(atributo, proximo);
      }
    }

    function aplicarNo(no: Node) {
      if (no.nodeType === Node.TEXT_NODE) {
        aplicarTexto(no as Text);
        return;
      }

      if (!(no instanceof Element) || deveIgnorarElemento(no)) {
        return;
      }

      atributosTraduziveis.forEach((atributo) =>
        aplicarAtributo(no, atributo)
      );

      const walker = document.createTreeWalker(
        no,
        NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT
      );

      let atual: Node | null = walker.nextNode();

      while (atual) {
        if (atual.nodeType === Node.TEXT_NODE) {
          aplicarTexto(atual as Text);
        } else if (atual instanceof Element && !deveIgnorarElemento(atual)) {
          atributosTraduziveis.forEach((atributo) =>
            aplicarAtributo(atual as Element, atributo)
          );
        }

        atual = walker.nextNode();
      }
    }

    function aplicarTudo() {
      if (aplicando) {
        return;
      }

      aplicando = true;

      try {
        aplicarNo(document.body);
      } finally {
        aplicando = false;
      }
    }

    aplicarTudo();

    const observador = new MutationObserver((mutacoes) => {
      if (aplicando) {
        return;
      }

      aplicando = true;

      try {
        mutacoes.forEach((mutacao) => {
          if (mutacao.type === "characterData") {
            aplicarTexto(mutacao.target as Text);
            return;
          }

          if (mutacao.type === "attributes" && mutacao.target instanceof Element) {
            if (
              mutacao.attributeName &&
              atributosTraduziveis.includes(mutacao.attributeName)
            ) {
              aplicarAtributo(mutacao.target, mutacao.attributeName);
            }

            return;
          }

          mutacao.addedNodes.forEach((no) => aplicarNo(no));
        });
      } finally {
        aplicando = false;
      }
    });

    observador.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: atributosTraduziveis,
    });

    return () => {
      observador.disconnect();

      textosAlterados.forEach((no) => {
        const estado = estadosTexto.get(no);

        if (estado && no.isConnected && no.data === estado.traduzido) {
          no.data = estado.original;
        }
      });

      atributosAlterados.forEach((registro) => {
        const estado = estadosAtributos
          .get(registro.elemento)
          ?.get(registro.atributo);

        if (
          estado &&
          registro.elemento.isConnected &&
          registro.elemento.getAttribute(registro.atributo) === estado.traduzido
        ) {
          registro.elemento.setAttribute(registro.atributo, estado.original);
        }
      });
    };
  }, [language]);

  return null;
}

function normalizarTipoPublicacao(valor: unknown): TipoPublicacaoComunidade {
  return TIPOS_PUBLICACAO_COMUNIDADE.includes(valor as TipoPublicacaoComunidade)
    ? (valor as TipoPublicacaoComunidade)
    : "Discussão";
}

function normalizarVisibilidadePostComunidade(
  valor: unknown,
): VisibilidadePostComunidade {
  return VISIBILIDADES_POST_COMUNIDADE.some((opcao) => opcao.valor === valor)
    ? (valor as VisibilidadePostComunidade)
    : "publico";
}

function obterRotuloVisibilidadePostComunidade(
  visibilidade: VisibilidadePostComunidade,
) {
  return (
    VISIBILIDADES_POST_COMUNIDADE.find(
      (opcao) => opcao.valor === visibilidade,
    )?.rotulo || "Público"
  );
}

function carregarSugestoesObrasLocais(userId = "") {
  try {
    const obrasJson: unknown =
      carregarJsonUsuarioComunidade("historietas-obras", userId) || [];

    if (!Array.isArray(obrasJson)) {
      return [];
    }

    return obrasJson
      .map((obra, index) => normalizarSugestaoObraLocal(obra, index))
      .filter((obra): obra is ObraRelacionadaSugestao => Boolean(obra));
  } catch {
    return [];
  }
}








export default function ComunidadePage() {
  const router = useRouter();
  const { language } = useHistorietasLanguage();
  const [usuario, setUsuario] = useState<UsuarioComunidade | null>(null);
  const [usuarioEhAdmin, setUsuarioEhAdmin] = useState(false);
  const [carregandoUsuario, setCarregandoUsuario] = useState(true);
  const [posts, setPosts] = useState<PostComunidade[]>([]);
  const [categoriaAtiva, setCategoriaAtiva] = useState<CategoriaComunidade | "Todos">(
    "Todos"
  );
  const [tipoPublicacaoAtiva, setTipoPublicacaoAtiva] =
    useState<TipoPublicacaoFiltro>("Todos");
  const [obraRelacionadaFiltro, setObraRelacionadaFiltro] = useState("");
  const [grupoPublicacaoObra, setGrupoPublicacaoObra] =
    useState<GrupoPublicacaoObra>("");
  const [categoriaPost, setCategoriaPost] =
    useState<CategoriaComunidade>("Geral");
  const [tipoPublicacaoPost, setTipoPublicacaoPost] =
    useState<TipoPublicacaoComunidade>("Discussão");
  const [visibilidadePost, setVisibilidadePost] =
    useState<VisibilidadePostComunidade>("publico");
  const [temSpoilerPost, setTemSpoilerPost] = useState(false);
  const [spoilersReveladosIds, setSpoilersReveladosIds] = useState<string[]>([]);
  const [termoBusca, setTermoBusca] = useState("");
  const termoBuscaAdiado = useDeferredValue(termoBusca);
  const [ordenacaoAtiva, setOrdenacaoAtiva] =
    useState<OrdenacaoComunidade>("Recentes");
  const [abaFeedAtiva, setAbaFeedAtiva] =
    useState<AbaFeedComunidade>("Para você");
  const [mostrarApenasSalvos, setMostrarApenasSalvos] = useState(false);
  const [postsSalvosIds, setPostsSalvosIds] = useState<string[]>([]);
  const [votosEnquetes, setVotosEnquetes] = useState<Record<string, string>>({});
  const [resultadosEnquetes, setResultadosEnquetes] =
    useState<ResultadoVotosEnquete>({});
  const [votandoEnqueteId, setVotandoEnqueteId] = useState<string | null>(null);
  const [feedbackAcao, setFeedbackAcao] = useState("");
  const [publicandoPost, setPublicandoPost] = useState(false);
  const [postCurtindoId, setPostCurtindoId] = useState<string | null>(null);
  const [postSalvandoId, setPostSalvandoId] = useState<string | null>(null);
  const [postCompartilhandoId, setPostCompartilhandoId] = useState<
    string | null
  >(null);
  const [postRemovendoId, setPostRemovendoId] = useState<string | null>(null);
  const [postFixandoId, setPostFixandoId] = useState<string | null>(null);
  const [postVisibilidadeAtualizandoId, setPostVisibilidadeAtualizandoId] =
    useState<string | null>(null);
  const [postMenuAbertoId, setPostMenuAbertoId] = useState<string | null>(null);
  const [denunciaAlvo, setDenunciaAlvo] =
    useState<DenunciaAlvoComunidade | null>(null);
  const [carregandoFeed, setCarregandoFeed] = useState(true);
  const [paginaFeedComunidade, setPaginaFeedComunidade] = useState(0);
  const [temMaisPostsComunidade, setTemMaisPostsComunidade] = useState(false);
  const [carregandoMaisPostsComunidade, setCarregandoMaisPostsComunidade] = useState(false);
  const [erro, setErro] = useState("");
  const [comentariosPostId, setComentariosPostId] = useState<string | null>(null);
  const [obraRelacionadaBusca, setObraRelacionadaBusca] = useState("");
  const [capituloRelacionadoPost, setCapituloRelacionadoPost] = useState("");
  const [obrasRelacionadasSugestoes, setObrasRelacionadasSugestoes] = useState<
    ObraRelacionadaSugestao[]
  >([]);
  const [sugestoesObrasAbertas, setSugestoesObrasAbertas] = useState(false);
  const textoPostRef = useRef<HTMLTextAreaElement | null>(null);
  const obraRelacionadaRef = useRef<HTMLInputElement | null>(null);
  const feedbackTimerRef = useRef<number | null>(null);
  const autenticacaoComunidadeVersaoRef = useRef(0);
  const reviewsDiarioSincronizadasRef = useRef<Set<string>>(new Set<string>());
  const usuarioReviewsDiarioRef = useRef("");
  const acoesComunidadeRef = useRef<Set<string>>(new Set<string>());
  const parametrosComunidadeAplicadosRef = useRef(false);
  const comentarioUrlAplicadoRef = useRef(false);
  const [composerAberto, setComposerAberto] = useState(false);
  const [menuAcoesRapidasComunidadeAberto, setMenuAcoesRapidasComunidadeAberto] =
    useState(false);
  const [buscaComunidadeAberta, setBuscaComunidadeAberta] = useState(false);
  const [usuariosBuscaComunidade, setUsuariosBuscaComunidade] = useState<
    UsuarioBuscaComunidade[]
  >([]);
  const [carregandoUsuariosBuscaComunidade, setCarregandoUsuariosBuscaComunidade] =
    useState(false);
  const [usuariosSeguidosIds, setUsuariosSeguidosIds] = useState<string[]>([]);
  const [usuarioSeguindoId, setUsuarioSeguindoId] = useState<string | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const { pageThemeStyle } = useHistorietasTheme(communityPageStyle);
  const carregarPostsComunidadeNoEfeito = useEffectEvent(
    (mostrarCarregamento: boolean, pagina: number, obraFiltro: string) =>
      carregarPostsComunidade(mostrarCarregamento, pagina, obraFiltro),
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");

    const atualizarModoDesktop = () => {
      setIsDesktop(mediaQuery.matches);
    };

    const atualizarModoDesktopTimer = window.setTimeout(
      atualizarModoDesktop,
      0
    );

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", atualizarModoDesktop);

      return () => {
        window.clearTimeout(atualizarModoDesktopTimer);
        mediaQuery.removeEventListener("change", atualizarModoDesktop);
      };
    }

    mediaQuery.addListener(atualizarModoDesktop);

    return () => {
      window.clearTimeout(atualizarModoDesktopTimer);
      mediaQuery.removeListener(atualizarModoDesktop);
    };
  }, []);

  useEffect(() => {
    const userId = usuario?.id || "";
    let cancelado = false;

    const carregarLocaisTimer = window.setTimeout(() => {
      try {
        const postsSalvosParseados =
          carregarJsonUsuarioComunidade(CHAVE_POSTS_SALVOS_COMUNIDADE, userId) ||
          [];

        if (Array.isArray(postsSalvosParseados)) {
          setPostsSalvosIds(
            postsSalvosParseados.filter(
              (postId): postId is string => typeof postId === "string"
            )
          );
        } else {
          setPostsSalvosIds([]);
        }
      } catch {
        setPostsSalvosIds([]);
      }

      setVotosEnquetes(carregarVotosEnquetesLocais(carregarJsonUsuarioComunidade, userId));

      if (!userId) {
        return;
      }

      void carregarPostsSalvosSupabaseComunidade(userId).then((postsSalvosReais) => {
        if (cancelado || !postsSalvosReais) {
          return;
        }

        setPostsSalvosIds(postsSalvosReais);
        salvarJsonUsuarioComunidade(
          CHAVE_POSTS_SALVOS_COMUNIDADE,
          userId,
          postsSalvosReais
        );
      });
    }, 0);

    return () => {
      cancelado = true;
      window.clearTimeout(carregarLocaisTimer);
    };
  }, [usuario?.id]);

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) {
        window.clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let cancelado = false;

    async function carregarVotosReaisEnquetes() {
      const postsEnqueteIds = posts
        .filter((post) => postEhEnquete(post))
        .map((post) => post.id)
        .filter(Boolean);

      if (postsEnqueteIds.length === 0) {
        window.setTimeout(() => {
          if (!cancelado) {
            setResultadosEnquetes({});
          }
        }, 0);
        return;
      }

      const votosLocais = carregarVotosEnquetesLocais(
        carregarJsonUsuarioComunidade,
        usuario?.id || ""
      );

      window.setTimeout(() => {
        if (!cancelado) {
          setVotosEnquetes((votosAtuais) => ({
            ...votosLocais,
            ...votosAtuais,
          }));
        }
      }, 0);

      if (!usuario?.id) {
        return;
      }

      const votosReais = await carregarVotosEnquetesSupabase(
        postsEnqueteIds,
        usuario.id
      );

      if (cancelado || !votosReais) {
        return;
      }

      window.setTimeout(() => {
        if (cancelado) {
          return;
        }

        setResultadosEnquetes(votosReais.resultados);

        setVotosEnquetes((votosAtuais) => {
          const votosAtualizados = {
            ...votosAtuais,
            ...votosReais.meusVotos,
          };

          salvarVotosEnquetesLocais(
            salvarJsonUsuarioComunidade,
            votosAtualizados,
            usuario.id
          );

          return votosAtualizados;
        });
      }, 0);
    }

    void carregarVotosReaisEnquetes();

    return () => {
      cancelado = true;
    };
  }, [posts, usuario?.id]);

  useEffect(() => {
    let cancelado = false;
    const timersAutenticacao = new Set<number>();

    function limparEstadoContaAnterior() {
      setUsuario(null);
      setUsuarioEhAdmin(false);
      setPostMenuAbertoId(null);
      setMenuAcoesRapidasComunidadeAberto(false);
      setComposerAberto(false);
      setComentariosPostId(null);
      setPostsSalvosIds([]);
      setVotosEnquetes({});
      setResultadosEnquetes({});
      setUsuariosSeguidosIds([]);
      setUsuarioSeguindoId(null);
      setPostCurtindoId(null);
      setPostSalvandoId(null);
      setPostCompartilhandoId(null);
      setPostRemovendoId(null);
      setPostFixandoId(null);
      setDenunciaAlvo(null);
      setFeedbackAcao("");
      setObraRelacionadaBusca("");
      setCapituloRelacionadoPost("");
      setSugestoesObrasAbertas(false);
      reviewsDiarioSincronizadasRef.current.clear();
      usuarioReviewsDiarioRef.current = "";
      acoesComunidadeRef.current.clear();

      if (textoPostRef.current) {
        textoPostRef.current.value = "";
      }

      if (obraRelacionadaRef.current) {
        obraRelacionadaRef.current.value = "";
      }
    }

    async function carregarUsuario() {
      const versaoCarregamento =
        autenticacaoComunidadeVersaoRef.current + 1;

      autenticacaoComunidadeVersaoRef.current = versaoCarregamento;
      setCarregandoUsuario(true);

      try {
        const { data, error: usuarioErro } = await supabase.auth.getUser();

        if (
          cancelado ||
          versaoCarregamento !== autenticacaoComunidadeVersaoRef.current
        ) {
          return;
        }

        if (usuarioErro) {
          if (!erroEhSessaoAusenteComunidade(usuarioErro)) {
            console.warn(
              "Não consegui carregar usuário da Comunidade:",
              usuarioErro.message
            );
          }

          setUsuario(null);
          setUsuarioEhAdmin(false);
          return;
        }

        const user = data.user || null;

        if (!user) {
          setUsuario(null);
          setUsuarioEhAdmin(false);
          return;
        }

        let nomeProfile = "";
        let avatarProfile = "";
        let usuarioAdmin = false;

        try {
          const profilesPorUsuario =
            await carregarProfilesComunidadePorUsuarios(
              [user.id],
              obterTextoProfileComunidade
            );
          const profile = profilesPorUsuario.get(user.id);

          nomeProfile = obterNomeProfileComunidade(profile);
          avatarProfile = obterAvatarProfileComunidade(profile);
        } catch {
          nomeProfile = "";
          avatarProfile = "";
        }

        try {
          const { data: adminData, error: adminError } = await supabase.rpc(
            "usuario_e_admin"
          );

          usuarioAdmin = !adminError && adminData === true;
        } catch {
          usuarioAdmin = false;
        }

        if (
          cancelado ||
          versaoCarregamento !== autenticacaoComunidadeVersaoRef.current
        ) {
          return;
        }

        const usuarioConfirmado = await obterUsuarioAutenticadoComunidadeAtual();

        if (
          cancelado ||
          versaoCarregamento !== autenticacaoComunidadeVersaoRef.current ||
          !usuarioConfirmado ||
          usuarioConfirmado.id !== user.id
        ) {
          return;
        }

        setUsuarioEhAdmin(usuarioAdmin);
        setUsuario({
          id: user.id,
          email: user.email || "",
          nome: obterNomeUsuario(user.email || "", nomeProfile),
          avatar: avatarProfile,
        });
      } catch (error) {
        if (!erroEhSessaoAusenteComunidade(error)) {
          console.warn("Não consegui iniciar usuário da Comunidade:", error);
        }

        if (
          !cancelado &&
          versaoCarregamento === autenticacaoComunidadeVersaoRef.current
        ) {
          setUsuario(null);
          setUsuarioEhAdmin(false);
        }
      } finally {
        if (
          !cancelado &&
          versaoCarregamento === autenticacaoComunidadeVersaoRef.current
        ) {
          setCarregandoUsuario(false);
        }
      }
    }

    void carregarUsuario();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      autenticacaoComunidadeVersaoRef.current += 1;
      limparEstadoContaAnterior();
      setCarregandoUsuario(true);
      setPosts([]);
      setCarregandoFeed(true);

      const timer = window.setTimeout(() => {
        timersAutenticacao.delete(timer);

        if (cancelado) {
          return;
        }

        void carregarUsuario();

        const obraFiltroUrl = (
          new URLSearchParams(window.location.search).get("obra") || ""
        )
          .trim()
          .slice(0, 90);

        void carregarPostsComunidadeNoEfeito(true, 0, obraFiltroUrl);
      }, 0);

      timersAutenticacao.add(timer);
    });

    return () => {
      cancelado = true;
      autenticacaoComunidadeVersaoRef.current += 1;
      timersAutenticacao.forEach((timer) => window.clearTimeout(timer));
      timersAutenticacao.clear();
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let cancelado = false;

    async function carregarObrasRelacionadas() {
      const obrasLocais = carregarSugestoesObrasLocais(usuario?.id || "");

      try {
        const { data, error } = await supabase
          .from("obras")
          .select("id, user_id, titulo, autor, classificacao_indicativa, publicado, slug, link")
          .eq("publicado", true)
          .order("criada_em", { ascending: false })
          .limit(120);

        if (error) {
          throw error;
        }

        const obrasSupabase = (data || [])
          .map((obra, index) => normalizarSugestaoObraSupabase(obra, index))
          .filter((obra): obra is ObraRelacionadaSugestao => Boolean(obra));

        if (!cancelado) {
          setObrasRelacionadasSugestoes(
            removerSugestoesObrasDuplicadas([...obrasSupabase, ...obrasLocais])
          );
        }
      } catch {
        if (!cancelado) {
          setObrasRelacionadasSugestoes(
            removerSugestoesObrasDuplicadas(obrasLocais)
          );
        }
      }
    }

    void carregarObrasRelacionadas();

    return () => {
      cancelado = true;
    };
  }, [usuario?.id]);

  useEffect(() => {
    const userId = usuario?.id.trim() || "";

    if (!userId) {
      reviewsDiarioSincronizadasRef.current.clear();
      usuarioReviewsDiarioRef.current = "";
      return;
    }

    if (usuarioReviewsDiarioRef.current !== userId) {
      reviewsDiarioSincronizadasRef.current.clear();
      usuarioReviewsDiarioRef.current = userId;
    }

    const reviewsPendentes = posts.filter((post) => {
      return (
        post.autorId.trim() === userId &&
        post.tipoPublicacao === "Review" &&
        !reviewsDiarioSincronizadasRef.current.has(post.id)
      );
    });

    if (reviewsPendentes.length === 0) {
      return;
    }

    let cancelado = false;

    reviewsPendentes.forEach((post) => {
      reviewsDiarioSincronizadasRef.current.add(post.id);
    });

    async function sincronizarReviewsPendentes() {
      for (const post of reviewsPendentes) {
        if (cancelado) {
          return;
        }

        const sincronizou = await registrarReviewComunidadeNoDiario({
          userId,
          texto: post.texto,
          obraRelacionada: post.obraRelacionada,
          postId: post.id,
          criadaEm: post.criadoEm,
          sugestoesObras: obrasRelacionadasSugestoes,
          visibilidade: post.visibilidade,
        });

        if (!sincronizou) {
          reviewsDiarioSincronizadasRef.current.delete(post.id);
        }
      }
    }

    void sincronizarReviewsPendentes();

    return () => {
      cancelado = true;
    };
  }, [usuario?.id, posts, obrasRelacionadasSugestoes]);

  useEffect(() => {
    if (composerAberto) {
      return;
    }

    const fecharSugestoesTimer = window.setTimeout(() => {
      setSugestoesObrasAbertas(false);
      setObraRelacionadaBusca("");
      setVisibilidadePost("publico");
    }, 0);

    return () => {
      window.clearTimeout(fecharSugestoesTimer);
    };
  }, [composerAberto]);

  useEffect(() => {
    if (!menuAcoesRapidasComunidadeAberto && !postMenuAbertoId) {
      return;
    }

    const overflowAnterior = document.body.style.getPropertyValue("overflow");
    const overscrollAnterior = document.documentElement.style.getPropertyValue(
      "overscroll-behavior"
    );

    document.body.style.setProperty("overflow", "hidden");
    document.documentElement.style.setProperty("overscroll-behavior", "none");

    return () => {
      if (overflowAnterior) {
        document.body.style.setProperty("overflow", overflowAnterior);
      } else {
        document.body.style.removeProperty("overflow");
      }

      if (overscrollAnterior) {
        document.documentElement.style.setProperty(
          "overscroll-behavior",
          overscrollAnterior
        );
      } else {
        document.documentElement.style.removeProperty("overscroll-behavior");
      }
    };
  }, [menuAcoesRapidasComunidadeAberto, postMenuAbertoId]);

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });

    const parametrosUrl = new URLSearchParams(window.location.search);
    const obraUrl = (parametrosUrl.get("obra") || "").trim().slice(0, 90);

    const carregarFeedTimer = window.setTimeout(() => {
      void carregarPostsComunidadeNoEfeito(true, 0, obraUrl);
    }, 0);

    return () => {
      window.clearTimeout(carregarFeedTimer);
    };
  }, []);

  useEffect(() => {
    if (parametrosComunidadeAplicadosRef.current) {
      return;
    }

    parametrosComunidadeAplicadosRef.current = true;

    const parametrosUrl = new URLSearchParams(window.location.search);
    const buscaUrl = (parametrosUrl.get("busca") || "").trim();
    const obraUrl = (parametrosUrl.get("obra") || "").trim().slice(0, 90);
    const tipoUrl = obterTipoPublicacaoPorParametro(
      parametrosUrl.get("tipo") || ""
    );
    const grupoObraUrl = obterGrupoPublicacaoObraPorParametro(
      parametrosUrl.get("grupo") || ""
    );

    if (!buscaUrl && !obraUrl && !tipoUrl && !grupoObraUrl) {
      return;
    }

    const aplicarParametrosTimer = window.setTimeout(() => {
      if (buscaUrl) {
        setTermoBusca(buscaUrl.slice(0, 90));
      }

      setObraRelacionadaFiltro(obraUrl);
      setGrupoPublicacaoObra(tipoUrl ? "" : grupoObraUrl);

      if (tipoUrl) {
        setTipoPublicacaoAtiva(tipoUrl);
        setAbaFeedAtiva(
          tipoUrl === "Teoria"
            ? "Teorias"
            : tipoUrl === "Review"
              ? "Reviews"
              : "Recentes"
        );
        setMenuAcoesRapidasComunidadeAberto(true);
      } else if (grupoObraUrl) {
        setTipoPublicacaoAtiva("Todos");
      }

      setMostrarApenasSalvos(false);
      setOrdenacaoAtiva("Recentes");
    }, 0);

    return () => {
      window.clearTimeout(aplicarParametrosTimer);
    };
  }, []);

  useEffect(() => {
    if (comentarioUrlAplicadoRef.current || comentariosPostId || posts.length === 0) {
      return;
    }

    const postIdUrl = new URLSearchParams(window.location.search).get("post");

    if (postIdUrl && posts.some((post) => post.id === postIdUrl)) {
      comentarioUrlAplicadoRef.current = true;

      const abrirComentariosTimer = window.setTimeout(() => {
        setComentariosPostId(postIdUrl);
      }, 0);

      return () => {
        window.clearTimeout(abrirComentariosTimer);
      };
    }
  }, [comentariosPostId, posts]);

  const termoBuscaNormalizado = useMemo(
    () => normalizarTexto(termoBuscaAdiado),
    [termoBuscaAdiado]
  );

  useEffect(() => {
    let cancelado = false;
    const userId = usuario?.id || "";

    if (!userId) {
      const limparUsuariosSeguidosTimer = window.setTimeout(() => {
        if (!cancelado) {
          setUsuariosSeguidosIds([]);
        }
      }, 0);

      return () => {
        cancelado = true;
        window.clearTimeout(limparUsuariosSeguidosTimer);
      };
    }

    void carregarUsuariosSeguidosComunidade(userId).then((idsSeguidos) => {
      if (!cancelado) {
        setUsuariosSeguidosIds(idsSeguidos);
      }
    });

    return () => {
      cancelado = true;
    };
  }, [usuario?.id]);

  useEffect(() => {
    let cancelado = false;
    const termoLimpo = termoBuscaAdiado.trim().replace(/^@+/, "");

    if (!buscaComunidadeAberta || termoLimpo.length < 2) {
      const limparBuscaUsuariosTimer = window.setTimeout(() => {
        if (!cancelado) {
          setUsuariosBuscaComunidade([]);
          setCarregandoUsuariosBuscaComunidade(false);
        }
      }, 0);

      return () => {
        cancelado = true;
        window.clearTimeout(limparBuscaUsuariosTimer);
      };
    }

    const buscaTimer = window.setTimeout(() => {
      if (cancelado) {
        return;
      }

      setCarregandoUsuariosBuscaComunidade(true);

      const usuariosLocais = buscarUsuariosComunidadeNosPosts(
        posts,
        termoLimpo
      );

      void buscarUsuariosComunidadeSupabase(termoLimpo)
        .then((usuariosSupabase) => {
          if (cancelado) {
            return;
          }

          const usuariosPorId = new Map<string, UsuarioBuscaComunidade>();

          [...usuariosSupabase, ...usuariosLocais].forEach((usuarioBusca) => {
            const usuarioExistente = usuariosPorId.get(usuarioBusca.id);

            usuariosPorId.set(usuarioBusca.id, {
              id: usuarioBusca.id,
              nome: usuarioBusca.nome || usuarioExistente?.nome || "Usuário",
              username:
                usuarioBusca.username || usuarioExistente?.username || "",
              avatar: usuarioBusca.avatar || usuarioExistente?.avatar || "",
            });
          });

          const termoNormalizado = normalizarTexto(termoLimpo);
          const usuariosOrdenados = Array.from(usuariosPorId.values())
            .sort((usuarioA, usuarioB) => {
              const textoA = normalizarTexto(
                `${usuarioA.nome} ${usuarioA.username}`
              );
              const textoB = normalizarTexto(
                `${usuarioB.nome} ${usuarioB.username}`
              );
              const prefixoA = textoA.startsWith(termoNormalizado);
              const prefixoB = textoB.startsWith(termoNormalizado);

              if (prefixoA !== prefixoB) {
                return prefixoA ? -1 : 1;
              }

              return usuarioA.nome.localeCompare(usuarioB.nome, "pt-BR");
            })
            .slice(0, 12);

          setUsuariosBuscaComunidade(usuariosOrdenados);
        })
        .finally(() => {
          if (!cancelado) {
            setCarregandoUsuariosBuscaComunidade(false);
          }
        });
    }, 220);

    return () => {
      cancelado = true;
      window.clearTimeout(buscaTimer);
    };
  }, [buscaComunidadeAberta, posts, termoBuscaAdiado]);

  const postsVisiveis = useMemo(() => {
    const postsFiltrados = posts.filter((post) => {
      const categoriaCombina =
        categoriaAtiva === "Todos" || post.categoria === categoriaAtiva;
      const tipoVisualPublicacao = obterTipoVisualPublicacao(post);
      const tipoPublicacaoCombina =
        tipoPublicacaoAtiva === "Todos" ||
        tipoVisualPublicacao === tipoPublicacaoAtiva;
      const obraRelacionadaCombina =
        !obraRelacionadaFiltro.trim() ||
        normalizarTexto(post.obraRelacionada) ===
          normalizarTexto(obraRelacionadaFiltro);
      const grupoPublicacaoCombina =
        grupoPublicacaoObra !== "posts" ||
        (tipoVisualPublicacao !== "Teoria" &&
          tipoVisualPublicacao !== "Review");
      const abaFeedCombina =
        abaFeedAtiva === "Seguindo"
          ? usuariosSeguidosIds.includes(post.autorId)
          : abaFeedAtiva === "Teorias"
            ? tipoVisualPublicacao === "Teoria"
            : abaFeedAtiva === "Reviews"
              ? tipoVisualPublicacao === "Review"
              : true;

      if (
        !categoriaCombina ||
        !tipoPublicacaoCombina ||
        !obraRelacionadaCombina ||
        !grupoPublicacaoCombina ||
        !abaFeedCombina
      ) {
        return false;
      }

      if (mostrarApenasSalvos && !postsSalvosIds.includes(post.id)) {
        return false;
      }

      if (!termoBuscaNormalizado) {
        return true;
      }

      const textoBuscaPost = normalizarTexto(
        [
          post.texto,
          post.autorNome,
          post.categoria,
          obterTipoVisualPublicacao(post),
          post.obraRelacionada,
          post.capituloRelacionado,
        ]
          .filter(Boolean)
          .join(" ")
      );

      return textoBuscaPost.includes(termoBuscaNormalizado);
    });

    return [...postsFiltrados].sort((postA, postB) => {
      const dataA = new Date(postA.criadoEm).getTime();
      const dataB = new Date(postB.criadoEm).getTime();
      const dataOrdenacaoA = Number.isNaN(dataA) ? 0 : dataA;
      const dataOrdenacaoB = Number.isNaN(dataB) ? 0 : dataB;

      if (postA.fixado !== postB.fixado) {
        return postA.fixado ? -1 : 1;
      }

      if (postA.fixado && postB.fixado) {
        const fixadoA = new Date(postA.fixadoEm || postA.criadoEm).getTime();
        const fixadoB = new Date(postB.fixadoEm || postB.criadoEm).getTime();
        const fixadoOrdenacaoA = Number.isNaN(fixadoA) ? dataOrdenacaoA : fixadoA;
        const fixadoOrdenacaoB = Number.isNaN(fixadoB) ? dataOrdenacaoB : fixadoB;

        return fixadoOrdenacaoB - fixadoOrdenacaoA;
      }

      if (abaFeedAtiva === "Para você" && ordenacaoAtiva === "Recentes") {
        const seguindoA = usuariosSeguidosIds.includes(postA.autorId) ? 1 : 0;
        const seguindoB = usuariosSeguidosIds.includes(postB.autorId) ? 1 : 0;

        if (seguindoA !== seguindoB) {
          return seguindoB - seguindoA;
        }

        const pontuacaoA = obterPontuacaoPost(postA);
        const pontuacaoB = obterPontuacaoPost(postB);

        return pontuacaoB - pontuacaoA || dataOrdenacaoB - dataOrdenacaoA;
      }

      if (ordenacaoAtiva === "Mais comentadas") {
        const diferencaComentarios =
          contarComentaristasUnicosPostComunidade(postB) -
          contarComentaristasUnicosPostComunidade(postA);

        return diferencaComentarios || dataOrdenacaoB - dataOrdenacaoA;
      }

      if (ordenacaoAtiva === "Em alta") {
        const pontuacaoA = obterPontuacaoPost(postA);
        const pontuacaoB = obterPontuacaoPost(postB);

        return pontuacaoB - pontuacaoA || dataOrdenacaoB - dataOrdenacaoA;
      }

      return dataOrdenacaoB - dataOrdenacaoA;
    });
  }, [
    abaFeedAtiva,
    categoriaAtiva,
    tipoPublicacaoAtiva,
    obraRelacionadaFiltro,
    grupoPublicacaoObra,
    mostrarApenasSalvos,
    ordenacaoAtiva,
    posts,
    postsSalvosIds,
    termoBuscaNormalizado,
    usuariosSeguidosIds,
  ]);

  const postComentariosAberto = useMemo(() => {
    if (!comentariosPostId) {
      return null;
    }

    return posts.find((post) => post.id === comentariosPostId) || null;
  }, [comentariosPostId, posts]);

  const sugestoesObrasRelacionadasVisiveis = useMemo(() => {
    const buscaNormalizada = normalizarTexto(obraRelacionadaBusca);

    if (!buscaNormalizada) {
      return [];
    }

    return obrasRelacionadasSugestoes
      .filter((obra) => {
        const tituloObra = normalizarTexto(obra.titulo);

        return tituloObra.startsWith(buscaNormalizada);
      })
      .slice(0, 8);
  }, [obraRelacionadaBusca, obrasRelacionadasSugestoes]);

  useEffect(() => {
    if (!comentariosPostId) {
      return;
    }

    const overflowAnterior = document.body.style.getPropertyValue("overflow");
    const overscrollAnterior = document.documentElement.style.getPropertyValue(
      "overscroll-behavior"
    );

    document.body.style.setProperty("overflow", "hidden");
    document.documentElement.style.setProperty("overscroll-behavior", "none");

    return () => {
      if (overflowAnterior) {
        document.body.style.setProperty("overflow", overflowAnterior);
      } else {
        document.body.style.removeProperty("overflow");
      }

      if (overscrollAnterior) {
        document.documentElement.style.setProperty(
          "overscroll-behavior",
          overscrollAnterior
        );
      } else {
        document.documentElement.style.removeProperty("overscroll-behavior");
      }
    };
  }, [comentariosPostId]);

  useEffect(() => {
    if (!composerAberto) {
      return;
    }

    const overflowAnterior = document.body.style.getPropertyValue("overflow");
    const overscrollAnterior = document.documentElement.style.getPropertyValue(
      "overscroll-behavior"
    );

    document.body.style.setProperty("overflow", "hidden");
    document.documentElement.style.setProperty("overscroll-behavior", "none");

    const focoTimer = window.setTimeout(() => {
      textoPostRef.current?.focus();
    }, 80);

    return () => {
      window.clearTimeout(focoTimer);

      if (overflowAnterior) {
        document.body.style.setProperty("overflow", overflowAnterior);
      } else {
        document.body.style.removeProperty("overflow");
      }

      if (overscrollAnterior) {
        document.documentElement.style.setProperty(
          "overscroll-behavior",
          overscrollAnterior
        );
      } else {
        document.documentElement.style.removeProperty("overscroll-behavior");
      }
    };
  }, [composerAberto]);

  const filtrosAtivos =
    categoriaAtiva !== "Todos" ||
    tipoPublicacaoAtiva !== "Todos" ||
    Boolean(obraRelacionadaFiltro.trim()) ||
    Boolean(grupoPublicacaoObra) ||
    Boolean(termoBuscaNormalizado) ||
    mostrarApenasSalvos ||
    ordenacaoAtiva !== "Recentes";
  const textoBotaoFiltrosAvancadosComunidade = "Comunidade";

  function iniciarAcaoComunidade(chave: string) {
    if (acoesComunidadeRef.current.has(chave)) {
      return false;
    }

    acoesComunidadeRef.current.add(chave);
    return true;
  }

  function finalizarAcaoComunidade(chave: string) {
    acoesComunidadeRef.current.delete(chave);
  }

  function selecionarAbaFeedComunidade(aba: AbaFeedComunidade) {
    setAbaFeedAtiva(aba);
    setCategoriaAtiva("Todos");
    setTipoPublicacaoAtiva("Todos");
    setObraRelacionadaFiltro("");
    setGrupoPublicacaoObra("");
    setMostrarApenasSalvos(false);
    setOrdenacaoAtiva("Recentes");
    setMenuAcoesRapidasComunidadeAberto(false);

    window.history.replaceState(null, "", "/comunidade");
  }

  function limparFiltrosComunidade() {
    setAbaFeedAtiva("Para você");
    setCategoriaAtiva("Todos");
    setTipoPublicacaoAtiva("Todos");
    setObraRelacionadaFiltro("");
    setGrupoPublicacaoObra("");
    setTermoBusca("");
    setOrdenacaoAtiva("Recentes");
    setMostrarApenasSalvos(false);

    window.history.replaceState(null, "", "/comunidade");
    void carregarPostsComunidade(true, 0, "");
  }

  function emitirFeedbackAcao(mensagem: string) {
    setFeedbackAcao(mensagem);

    if (feedbackTimerRef.current) {
      window.clearTimeout(feedbackTimerRef.current);
    }

    feedbackTimerRef.current = window.setTimeout(() => {
      setFeedbackAcao("");
      feedbackTimerRef.current = null;
    }, 2600);
  }


  function aplicarSugestaoPublicacaoComunidade(
    sugestao: SugestaoPublicacaoComunidade,
  ) {
    if (publicandoPost) {
      return;
    }

    setErro("");
    setCategoriaPost(sugestao.categoria);
    setTipoPublicacaoPost(sugestao.tipo);

    window.setTimeout(() => {
      const campoTexto = textoPostRef.current;

      if (!campoTexto) {
        return;
      }

      const textoSugestao = traduzirTextoComunidade(sugestao.texto, language);
      const textoAtualSemEspacosFinais = campoTexto.value.replace(/\s+$/, "");
      const proximoTexto = textoAtualSemEspacosFinais.trim()
        ? `${textoAtualSemEspacosFinais}\n\n${textoSugestao}`
        : textoSugestao;

      // Preserva o que já foi digitado: a sugestão é acrescentada, nunca sobrescreve.
      campoTexto.value = proximoTexto.slice(0, 700);
      campoTexto.focus();
      campoTexto.setSelectionRange(
        campoTexto.value.length,
        campoTexto.value.length,
      );
    }, 0);
  }

  async function prepararEnqueteComunidade() {
    if (!(await garantirAceiteAntesDePublicarComunidade())) {
      return;
    }

    setErro("");
    setCategoriaPost("Discussão");
    setTipoPublicacaoPost("Enquete");
    setTemSpoilerPost(false);
    setComposerAberto(true);

    window.setTimeout(() => {
      if (!textoPostRef.current) {
        return;
      }

      textoPostRef.current.value = MODELO_ENQUETE_COMUNIDADE;
      textoPostRef.current.focus();
      textoPostRef.current.setSelectionRange(
        textoPostRef.current.value.length,
        textoPostRef.current.value.length
      );
    }, 0);
  }

  function selecionarTipoPublicacaoPost(tipo: TipoPublicacaoComunidade) {
    setTipoPublicacaoPost(tipo);

    if (tipo !== "Enquete") {
      return;
    }

    window.setTimeout(() => {
      if (!textoPostRef.current) {
        return;
      }

      const textoAtual = textoPostRef.current.value.trim();

      if (textoAtual && !/^enquete\s*[:\-]/i.test(textoAtual)) {
        return;
      }

      textoPostRef.current.value = MODELO_ENQUETE_COMUNIDADE;
      textoPostRef.current.focus();
      textoPostRef.current.setSelectionRange(
        textoPostRef.current.value.length,
        textoPostRef.current.value.length
      );
    }, 0);
  }

  async function votarEnquete(postId: string, opcao: string) {
    if (votandoEnqueteId === postId) {
      return;
    }

    if (votosEnquetes[postId]) {
      emitirFeedbackAcao("Você já votou nesta enquete.");
      return;
    }

    if (!exigirLogin() || !usuario) {
      return;
    }

    setVotandoEnqueteId(postId);
    setErro("");

    try {
      const { error } = await supabase.from("comunidade_enquete_votos").insert({
        post_id: postId,
        user_id: usuario.id,
        opcao,
      });

      if (error) {
        const codigoErro = (error as { code?: string }).code;

        if (codigoErro === "23505") {
          emitirFeedbackAcao("Você já votou nesta enquete.");

          const votosReais = await carregarVotosEnquetesSupabase(
            [postId],
            usuario.id
          );

          if (votosReais) {
            setResultadosEnquetes((resultadosAtuais) => ({
              ...resultadosAtuais,
              ...votosReais.resultados,
            }));

            setVotosEnquetes((votosAtuais) => {
              const votosAtualizados = {
                ...votosAtuais,
                ...votosReais.meusVotos,
              };

              salvarVotosEnquetesLocais(
                salvarJsonUsuarioComunidade,
                votosAtualizados,
                usuario.id
              );

              return votosAtualizados;
            });
          }

          return;
        }

        setErro(formatarErroSupabase("Erro ao votar na enquete", error));
        return;
      }

      setVotosEnquetes((votosAtuais) => {
        const votosAtualizados = {
          ...votosAtuais,
          [postId]: opcao,
        };

        salvarVotosEnquetesLocais(
          salvarJsonUsuarioComunidade,
          votosAtualizados,
          usuario.id
        );

        return votosAtualizados;
      });

      const votosReais = await carregarVotosEnquetesSupabase(
        [postId],
        usuario.id
      );

      if (votosReais) {
        setResultadosEnquetes((resultadosAtuais) => ({
          ...resultadosAtuais,
          ...votosReais.resultados,
        }));

        setVotosEnquetes((votosAtuais) => {
          const votosAtualizados = {
            ...votosAtuais,
            ...votosReais.meusVotos,
          };

          salvarVotosEnquetesLocais(
            salvarJsonUsuarioComunidade,
            votosAtualizados,
            usuario.id
          );

          return votosAtualizados;
        });
      } else {
        setResultadosEnquetes((resultadosAtuais) => ({
          ...resultadosAtuais,
          [postId]: {
            ...(resultadosAtuais[postId] || {}),
            [opcao]: (resultadosAtuais[postId]?.[opcao] || 0) + 1,
          },
        }));
      }

      emitirFeedbackAcao("Voto registrado.");
    } finally {
      setVotandoEnqueteId((postAtualId) =>
        postAtualId === postId ? null : postAtualId
      );
    }
  }

  function alternarSpoilerRevelado(postId: string) {
    setSpoilersReveladosIds((idsAtuais) =>
      idsAtuais.includes(postId)
        ? idsAtuais.filter((id) => id !== postId)
        : [...idsAtuais, postId]
    );
  }

  async function abrirPublicacaoRapidaComunidade() {
    setMenuAcoesRapidasComunidadeAberto(false);

    if (
      carregandoUsuario ||
      !(await garantirAceiteAntesDePublicarComunidade())
    ) {
      return;
    }

    setErro("");
    setComposerAberto(true);
  }

  async function alternarPostSalvo(postId: string) {
    const chaveAcao = `salvar-post:${postId}`;

    if (!iniciarAcaoComunidade(chaveAcao)) {
      return;
    }

    setErro("");

    try {
      if (!exigirLogin() || !usuario) {
        return;
      }

      setPostSalvandoId(postId);

      const postJaSalvo = postsSalvosIds.includes(postId);
      const postsSalvosAtualizados = postJaSalvo
        ? postsSalvosIds.filter((postSalvoId) => postSalvoId !== postId)
        : [...postsSalvosIds, postId];

      setPostsSalvosIds(postsSalvosAtualizados);
      salvarJsonUsuarioComunidade(
        CHAVE_POSTS_SALVOS_COMUNIDADE,
        usuario.id,
        postsSalvosAtualizados
      );

      const salvouNoSupabase = await salvarPostSalvoSupabaseComunidade(
        usuario.id,
        postId,
        !postJaSalvo
      );

      if (salvouNoSupabase) {
        const postsSalvosReais = await carregarPostsSalvosSupabaseComunidade(
          usuario.id
        );

        if (postsSalvosReais) {
          setPostsSalvosIds(postsSalvosReais);
          salvarJsonUsuarioComunidade(
            CHAVE_POSTS_SALVOS_COMUNIDADE,
            usuario.id,
            postsSalvosReais
          );
        }
      }

      emitirFeedbackAcao(
        postJaSalvo
          ? "Publicação removida dos salvos."
          : salvouNoSupabase
            ? "Publicação salva."
            : "Publicação salva neste navegador."
      );
    } finally {
      finalizarAcaoComunidade(chaveAcao);
      setPostSalvandoId((postAtualId) =>
        postAtualId === postId ? null : postAtualId
      );
    }
  }

  async function compartilharPublicacao(post: PostComunidade) {
    const chaveAcao = `compartilhar-post:${post.id}`;

    if (!iniciarAcaoComunidade(chaveAcao)) {
      return;
    }

    setPostCompartilhandoId(post.id);

    try {
      const linkPublicacao = obterLinkPublicacaoComunidade(post.id);
      const navegador = navigator as Navigator & {
        share?: (data: ShareData) => Promise<void>;
      };
      const textoPublicacao =
        post.texto.trim().slice(0, 160) ||
        `Confira a publicação de ${post.autorNome} no HISTORIETAS.`;

      if (typeof navegador.share === "function") {
        try {
          await navegador.share({
            title: `${post.autorNome} na Comunidade HISTORIETAS`,
            text: textoPublicacao,
            url: linkPublicacao,
          });
          emitirFeedbackAcao("Compartilhamento da publicação aberto.");
          return;
        } catch (error) {
          if (
            error instanceof DOMException &&
            error.name === "AbortError"
          ) {
            return;
          }
        }
      }

      const linkCopiado = await copiarTextoComFallback(linkPublicacao);

      if (linkCopiado) {
        emitirFeedbackAcao("Link da publicação copiado.");
        return;
      }

      setErro(
        "Não consegui compartilhar nem copiar o link da publicação neste navegador."
      );
    } finally {
      finalizarAcaoComunidade(chaveAcao);
      setPostCompartilhandoId((postAtualId) =>
        postAtualId === post.id ? null : postAtualId
      );
    }
  }

  async function carregarPostsComunidade(
    mostrarCarregamento = false,
    pagina = 0,
    obraFiltro = obraRelacionadaFiltro
  ) {
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

  async function carregarMaisPostsComunidade() {
    if (carregandoFeed || carregandoMaisPostsComunidade || !temMaisPostsComunidade) {
      return;
    }

    await carregarPostsComunidade(false, paginaFeedComunidade + 1);
  }


  function exigirLogin() {
    if (usuario) {
      return true;
    }

    setErro("Entre na sua conta para participar da Comunidade.");
    router.push(criarLoginHrefComunidade());
    return false;
  }

  async function garantirAceiteAntesDePublicarComunidade() {
    if (!exigirLogin() || !usuario) {
      return false;
    }

    const statusAceite = await verificarAceiteTermosPublicacao();

    if (statusAceite.aceito) {
      return true;
    }

    router.push(criarHrefAceiteTermos("/comunidade"));
    return false;
  }

  async function alternarSeguirUsuarioBusca(
    usuarioAlvo: UsuarioBuscaComunidade
  ) {
    if (!exigirLogin() || !usuario) {
      return;
    }

    if (usuarioAlvo.id === usuario.id) {
      return;
    }

    const chaveAcao = `seguir-usuario:${usuarioAlvo.id}`;

    if (!iniciarAcaoComunidade(chaveAcao)) {
      return;
    }

    const estavaSeguindo = usuariosSeguidosIds.includes(usuarioAlvo.id);
    const deveSeguir = !estavaSeguindo;
    const idsAnteriores = usuariosSeguidosIds;

    setUsuarioSeguindoId(usuarioAlvo.id);
    setUsuariosSeguidosIds((idsAtuais) =>
      deveSeguir
        ? Array.from(new Set([...idsAtuais, usuarioAlvo.id]))
        : idsAtuais.filter((id) => id !== usuarioAlvo.id)
    );

    try {
      const resultado = await salvarSeguindoUsuarioComunidade(
        usuario.id,
        usuarioAlvo.id,
        deveSeguir
      );

      if (!resultado.ok) {
        setUsuariosSeguidosIds(idsAnteriores);
        setErro(
          resultado.erro || "Não foi possível atualizar este usuário agora."
        );
        return;
      }

      const seguindoAgora = resultado.estado === "seguindo";

      setUsuariosSeguidosIds((idsAtuais) =>
        seguindoAgora
          ? Array.from(new Set([...idsAtuais, usuarioAlvo.id]))
          : idsAtuais.filter((id) => id !== usuarioAlvo.id)
      );
      setErro("");
      emitirFeedbackAcao(
        resultado.estado === "solicitado"
          ? `Solicitação para seguir ${usuarioAlvo.nome} enviada.`
          : seguindoAgora
          ? `Você começou a seguir ${usuarioAlvo.nome}.`
          : `Você deixou de seguir ${usuarioAlvo.nome}.`
      );
    } finally {
      finalizarAcaoComunidade(chaveAcao);
      setUsuarioSeguindoId((idAtual) =>
        idAtual === usuarioAlvo.id ? null : idAtual
      );
    }
  }

  function selecionarObraRelacionada(titulo: string) {
    setObraRelacionadaBusca(titulo);
    setSugestoesObrasAbertas(false);

    if (obraRelacionadaRef.current) {
      obraRelacionadaRef.current.value = titulo;
      obraRelacionadaRef.current.focus();
    }
  }

  async function publicarPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const chaveAcao = "publicar-post";

    if (!iniciarAcaoComunidade(chaveAcao)) {
      return;
    }

    setPublicandoPost(true);
    setErro("");

    try {
      if (!exigirLogin() || !usuario) {
        return;
      }

      if (!(await garantirAceiteAntesDePublicarComunidade())) {
        return;
      }

      const usuarioAutenticado = await obterUsuarioAutenticadoComunidadeAtual();
      const usuarioAutenticadoId = usuarioAutenticado?.id?.trim() || "";
      const usuarioEstadoId = usuario.id.trim();

      if (
        !usuarioAutenticadoId ||
        usuarioAutenticadoId !== usuarioEstadoId
      ) {
        setUsuario(null);
        setUsuarioEhAdmin(false);
        setErro(
          "Sua sessão expirou ou a conta mudou. Entre novamente antes de publicar."
        );
        return;
      }

      const visibilidadeSegura =
        normalizarVisibilidadePostComunidade(visibilidadePost);
      const textoLimpo = textoPostRef.current?.value.trim() || "";
      const obraLimpa = obraRelacionadaRef.current?.value.trim() || "";
      const capituloLimpo = capituloRelacionadoPost.trim();
      let obraRelacionadaPermitida = obraLimpa
        ? obterObraRelacionadaPermitida(
            obraLimpa,
            obrasRelacionadasSugestoes
          )
        : null;

      if (capituloLimpo && !obraLimpa) {
        setErro("Selecione uma obra antes de informar o capítulo.");
        return;
      }

      if (obraLimpa && !obraRelacionadaPermitida) {
        const { data: obrasEncontradas, error: erroObraRelacionada } =
          await supabase
            .from("obras")
            .select("id, user_id, titulo, autor, classificacao_indicativa, publicado, slug, link")
            .eq("publicado", true)
            .eq("titulo", obraLimpa)
            .limit(5);

        if (!erroObraRelacionada) {
          obraRelacionadaPermitida = (
            obrasEncontradas || []
          )
            .map((obra, index) => normalizarSugestaoObraSupabase(obra, index))
            .find((obra): obra is ObraRelacionadaSugestao => Boolean(obra)) || null;

          if (obraRelacionadaPermitida) {
            setObrasRelacionadasSugestoes((obrasAtuais) =>
              removerSugestoesObrasDuplicadas([
                obraRelacionadaPermitida as ObraRelacionadaSugestao,
                ...obrasAtuais,
              ])
            );
          }
        }
      }

      if (obraLimpa && !obraRelacionadaPermitida) {
        setErro("Selecione uma obra publicada disponível nas sugestões.");
        return;
      }

      if (textoLimpo.length < 8) {
        setErro("Escreva uma publicação com pelo menos 8 caracteres.");
        return;
      }

      const linhasPost = obterLinhasTexto(textoLimpo);
      const primeiraLinhaPost = linhasPost[0] || "";
      const publicacaoEhEnquete =
        tipoPublicacaoPost === "Enquete" || /^enquete\s*[:\-]/i.test(primeiraLinhaPost);

      if (publicacaoEhEnquete) {
        const perguntaEnquete = obterPerguntaEnquete(textoLimpo);
        const opcoesEnquete = obterTodasOpcoesEnquete(textoLimpo);

        if (!/^enquete\s*[:\-]/i.test(primeiraLinhaPost) || !perguntaEnquete.trim()) {
          setErro("Escreva a pergunta da enquete na primeira linha.");
          return;
        }

        if (opcoesEnquete.length < MIN_OPCOES_ENQUETE) {
          setErro("A enquete precisa ter pelo menos 2 opções preenchidas.");
          return;
        }

        if (opcoesEnquete.length > MAX_OPCOES_ENQUETE) {
          setErro("A enquete pode ter no máximo 4 opções.");
          return;
        }
      }

      const autorNomeSeguro = await obterNomeSeguroUsuarioComunidade(usuario);

      const textoPostBanco = textoLimpo.slice(0, 700);
      const obraPostBanco = juntarObraECapituloRelacionados(
        obraRelacionadaPermitida?.titulo || "",
        capituloLimpo,
      );

      // Não use INSERT ... RETURNING aqui. O RETURNING também passa pela
      // política SELECT da tabela e pode fazer um INSERT válido ser rejeitado.
      const { error } = await supabase
        .from("comunidade_posts")
        .insert({
          autor_id: usuarioAutenticadoId,
          autor_nome: autorNomeSeguro,
          categoria: categoriaPost,
          tipo_publicacao: publicacaoEhEnquete ? "Discussão" : tipoPublicacaoPost,
          tem_spoiler: temSpoilerPost,
          texto: textoPostBanco,
          obra_relacionada: obraPostBanco,
          visibilidade: visibilidadeSegura,
        });

      if (error) {
        setErro(formatarErroSupabase("Erro ao publicar", error));
        return;
      }

      // A leitura é feita em uma consulta separada, depois que o INSERT termina.
      const { data: postCriado } = await supabase
        .from("comunidade_posts")
        .select(
          "id, autor_id, autor_nome, categoria, tipo_publicacao, tem_spoiler, texto, obra_relacionada, criado_em, fixado, fixado_em, fixado_por, visibilidade"
        )
        .eq("autor_id", usuarioAutenticadoId)
        .eq("texto", textoPostBanco)
        .order("criado_em", { ascending: false })
        .limit(1)
        .maybeSingle();

      let novoPost: PostComunidade | null = null;

      if (postCriado) {
        const profilesPostNovo = new Map<string, PerfilComunidadeRow>([
          [
            usuarioAutenticadoId,
            {
              nome: autorNomeSeguro,
              avatar_url: usuario.avatar,
            },
          ],
        ]);

        novoPost = mapearPostSupabase(
          postCriado as SupabasePostRow,
          new Map<string, ComentarioComunidade[]>(),
          new Map<string, string[]>(),
          profilesPostNovo,
          obterNomeProfileComunidade,
          obterAvatarProfileComunidade,
          normalizarCategoria,
          normalizarTipoPublicacao,
          normalizarVisibilidadePostComunidade
        );

        setPosts((postsAtuais) => [novoPost as PostComunidade, ...postsAtuais]);
      } else {
        await carregarPostsComunidade(false, 0, obraRelacionadaFiltro);
      }

      if (
        novoPost &&
        !publicacaoEhEnquete &&
        tipoPublicacaoPost === "Review"
      ) {
        reviewsDiarioSincronizadasRef.current.add(novoPost.id);

        const reviewSincronizada = await registrarReviewComunidadeNoDiario({
          userId: usuarioAutenticadoId,
          texto: textoLimpo,
          obraRelacionada: obraLimpa,
          postId: novoPost.id,
          criadaEm: novoPost.criadoEm,
          sugestoesObras: obrasRelacionadasSugestoes,
          visibilidade: novoPost.visibilidade,
        });

        if (!reviewSincronizada) {
          reviewsDiarioSincronizadasRef.current.delete(novoPost.id);
        }
      }

      if (textoPostRef.current) {
        textoPostRef.current.value = "";
      }

      if (obraRelacionadaRef.current) {
        obraRelacionadaRef.current.value = "";
      }

      setObraRelacionadaBusca("");
      setCapituloRelacionadoPost("");
      setSugestoesObrasAbertas(false);
      setCategoriaPost("Geral");
      setTipoPublicacaoPost("Discussão");
      setVisibilidadePost("publico");
      setTemSpoilerPost(false);
      setComposerAberto(false);
      emitirFeedbackAcao("Publicação enviada para a Comunidade.");
    } finally {
      finalizarAcaoComunidade(chaveAcao);
      setPublicandoPost(false);
    }
  }

  async function alternarCurtida(postId: string) {
    const chaveAcao = `curtir-post:${postId}`;

    if (!iniciarAcaoComunidade(chaveAcao)) {
      return;
    }

    setPostCurtindoId(postId);
    setErro("");

    try {
      if (!exigirLogin() || !usuario) {
        return;
      }

      const postAtual = posts.find((post) => post.id === postId);
      const jaCurtiu = Boolean(postAtual?.curtidas.includes(usuario.id));

      const { error: erroLimparCurtida } = await supabase
        .from("comunidade_curtidas")
        .delete()
        .eq("post_id", postId)
        .eq("usuario_id", usuario.id);

      if (erroLimparCurtida) {
        setErro(formatarErroSupabase("Erro ao atualizar curtida", erroLimparCurtida));
        return;
      }

      if (!jaCurtiu) {
        const { error: erroInserirCurtida } = await supabase
          .from("comunidade_curtidas")
          .insert({
            post_id: postId,
            usuario_id: usuario.id,
          });

        if (erroInserirCurtida) {
          setErro(formatarErroSupabase("Erro ao curtir", erroInserirCurtida));
          return;
        }

        if (postAtual?.autorId) {
          await criarNotificacaoComunidadeSupabase({
            destinatarioId: postAtual.autorId,
            tipo: "comunidade-curtida-post",
            titulo: "Nova curtida na Comunidade",
            mensagem: `${usuario.nome} curtiu sua publicação.`,
            link: `/comunidade?post=${encodeURIComponent(postId)}`,
            notificacaoId: `comunidade-curtida-post:${postId}:${usuario.id}`,
          }, idSupabaseValidoComunidade);
        }
      }

      setPosts((postsAtuais) => {
        return postsAtuais.map((post) => {
          if (post.id !== postId) {
            return post;
          }

          return {
            ...post,
            curtidas: jaCurtiu
              ? post.curtidas.filter((curtidaId) => curtidaId !== usuario.id)
              : Array.from(new Set([...post.curtidas, usuario.id])),
          };
        });
      });

    } finally {
      finalizarAcaoComunidade(chaveAcao);
      setPostCurtindoId((postAtualId) =>
        postAtualId === postId ? null : postAtualId
      );
    }
  }

  function abrirComentarios(postId: string) {
    setErro("");
    comentarioUrlAplicadoRef.current = true;
    setComentariosPostId(postId);

    try {
      const url = new URL(window.location.href);
      url.pathname = "/comunidade";
      url.search = `?post=${encodeURIComponent(postId)}`;
      url.hash = "";
      window.history.replaceState(null, "", url.toString());
    } catch {
      // Se o navegador bloquear a URL, os comentários continuam abrindo em estado local.
    }
  }

  function fecharComentarios() {
    setComentariosPostId(null);
  }

  async function comentarPost(
    postId: string,
    textoRecebido: string,
    comentarioPaiId = ""
  ) {
    const chaveAcao = `comentar-post:${postId}`;

    if (!iniciarAcaoComunidade(chaveAcao)) {
      return false;
    }

    setErro("");

    try {
      if (!exigirLogin() || !usuario) {
        return false;
      }

      const textoComentario = textoRecebido.trim();

      if (textoComentario.length < 1) {
        setErro("Escreva um comentário antes de enviar.");
        return false;
      }

      const autorNomeSeguro = await obterNomeSeguroUsuarioComunidade(usuario);
      const postAtual = posts.find((post) => post.id === postId) || null;
      const comentarioPaiIdLimpo = comentarioPaiId.trim();
      const comentarioPai = comentarioPaiIdLimpo
        ? postAtual?.comentarios.find(
            (comentario) => comentario.id === comentarioPaiIdLimpo
          ) || null
        : null;

      if (comentarioPaiIdLimpo && !comentarioPai) {
        setErro("O comentário respondido não foi encontrado.");
        return false;
      }

      const { data, error } = await supabase
        .from("comunidade_comentarios")
        .insert({
          post_id: postId,
          autor_id: usuario.id,
          autor_nome: autorNomeSeguro,
          texto: textoComentario.slice(0, 420),
          comentario_pai_id: comentarioPaiIdLimpo || null,
        })
        .select(
          "id, post_id, autor_id, autor_nome, texto, comentario_pai_id, criado_em"
        )
        .single();

      if (error || !data) {
        setErro(
          error
            ? formatarErroSupabase("Erro ao comentar", error)
            : "Erro ao comentar: o Supabase não retornou o comentário criado."
        );
        return false;
      }

      const profilesComentarioNovo = new Map<string, PerfilComunidadeRow>([
        [
          usuario.id,
          {
            nome: autorNomeSeguro,
            avatar_url: usuario.avatar,
          },
        ],
      ]);
      const novoComentario = mapearComentarioSupabase(
        data as SupabaseComentarioRow,
        new Map<string, string[]>(),
        profilesComentarioNovo,
        obterNomeProfileComunidade,
        obterAvatarProfileComunidade
      );

      if (!comentarioPaiIdLimpo && postAtual?.autorId) {
        await criarNotificacaoComunidadeSupabase({
          destinatarioId: postAtual.autorId,
          tipo: "comunidade-comentario-post",
          titulo: "Novo comentário na Comunidade",
          mensagem: `${autorNomeSeguro} comentou na sua publicação.`,
          link: `/comunidade?post=${encodeURIComponent(postId)}`,
          notificacaoId: `comunidade-comentario-post:${postId}:${novoComentario.id}`,
        }, idSupabaseValidoComunidade);
      }

      setPosts((postsAtuais) =>
        postsAtuais.map((post) =>
          post.id === postId
            ? {
                ...post,
                comentarios: [...post.comentarios, novoComentario],
              }
            : post
        )
      );

      emitirFeedbackAcao("Comentário enviado.");
      return true;
    } finally {
      finalizarAcaoComunidade(chaveAcao);
    }
  }

  function denunciarConteudo(
    alvoTipo: AlvoDenunciaComunidade,
    alvoId: string
  ) {
    if (!exigirLogin() || !usuario) {
      return;
    }

    const alvoIdLimpo = alvoId.trim();

    if (!alvoIdLimpo) {
      setErro("O conteúdo que você tentou denunciar é inválido.");
      return;
    }

    let alvoTitulo = "";

    if (alvoTipo === "post") {
      const postAlvo = posts.find((post) => post.id === alvoIdLimpo);

      alvoTitulo = postAlvo
        ? `Publicação de ${postAlvo.autorNome}`
        : "Publicação da Comunidade";
    } else {
      const comentarioAlvo = posts
        .flatMap((post) => post.comentarios)
        .find((comentario) => comentario.id === alvoIdLimpo);

      alvoTitulo = comentarioAlvo
        ? `Comentário de ${comentarioAlvo.autorNome}`
        : "Comentário da Comunidade";
    }

    setErro("");
    setPostMenuAbertoId(null);
    setDenunciaAlvo({
      alvoTipo,
      alvoId: alvoIdLimpo,
      alvoTitulo,
    });
  }

  async function removerComentario(postId: string, comentarioId: string) {
    const chaveAcao = `remover-comentario:${comentarioId}`;

    if (!iniciarAcaoComunidade(chaveAcao)) {
      return;
    }

    setErro("");

    try {
      if (!exigirLogin() || !usuario) {
        return;
      }

      const usuarioAutenticado = await obterUsuarioAutenticadoComunidadeAtual();
      const usuarioAutenticadoId = usuarioAutenticado?.id?.trim() || "";
      const usuarioEstadoId = usuario.id.trim();

      if (
        !usuarioAutenticadoId ||
        usuarioAutenticadoId !== usuarioEstadoId
      ) {
        setUsuario(null);
        setUsuarioEhAdmin(false);
        setPostMenuAbertoId(null);
        setErro(
          "Sua conta mudou. Aguarde a Comunidade atualizar antes de tentar novamente."
        );
        return;
      }

      const comentariosDoPost =
        posts.find((post) => post.id === postId)?.comentarios || [];
      const comentarioAtual = comentariosDoPost.find(
        (comentario) => comentario.id === comentarioId
      );

      if (
        !comentarioAtual ||
        comentarioAtual.autorId.trim() !== usuarioAutenticadoId
      ) {
        setErro("Você só pode remover seus próprios comentários.");
        return;
      }

      const { data: comentarioBanco, error: comentarioBancoError } =
        await supabase
          .from("comunidade_comentarios")
          .select("id, post_id, autor_id")
          .eq("id", comentarioId)
          .maybeSingle();

      if (comentarioBancoError) {
        setErro(
          formatarErroSupabase(
            "Erro ao conferir comentário",
            comentarioBancoError
          )
        );
        return;
      }

      if (!comentarioBanco) {
        setPosts((postsAtuais) =>
          postsAtuais.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  comentarios: post.comentarios.filter(
                    (comentario) => comentario.id !== comentarioId
                  ),
                }
              : post
          )
        );
        setErro("Este comentário já não existe.");
        return;
      }

      if (comentarioBanco.autor_id !== usuarioAutenticadoId) {
        setErro("Você só pode remover seus próprios comentários.");
        return;
      }

      if (
        !window.confirm(
          traduzirTextoComunidade("Remover este comentário?", language)
        )
      ) {
        return;
      }

      const idsParaRemover = obterIdsComentarioComRespostasComunidade(
        comentariosDoPost,
        comentarioId
      );

      const { data: comentariosRemovidos, error } = await supabase
        .from("comunidade_comentarios")
        .delete()
        .eq("id", comentarioId)
        .eq("autor_id", usuarioAutenticadoId)
        .select("id");

      if (error) {
        setErro(formatarErroSupabase("Erro ao remover comentário", error));
        return;
      }

      if (!Array.isArray(comentariosRemovidos) || comentariosRemovidos.length === 0) {
        setErro(
          "O comentário não foi removido. A conta atual não possui permissão para essa ação."
        );
        await carregarPostsComunidade(false, 0, obraRelacionadaFiltro);
        return;
      }

      setPosts((postsAtuais) =>
        postsAtuais.map((post) =>
          post.id === postId
            ? {
                ...post,
                comentarios: post.comentarios.filter(
                  (comentario) => !idsParaRemover.has(comentario.id)
                ),
              }
            : post
        )
      );

      emitirFeedbackAcao("Comentário removido.");
    } finally {
      finalizarAcaoComunidade(chaveAcao);
    }
  }

  async function alternarCurtidaComentario(postId: string, comentarioId: string) {
    const chaveAcao = `curtir-comentario:${comentarioId}`;

    if (!iniciarAcaoComunidade(chaveAcao)) {
      return;
    }

    setErro("");

    try {
      if (!exigirLogin() || !usuario) {
        return;
      }

      const postAtual = posts.find((post) => post.id === postId);
      const comentarioAtual = postAtual?.comentarios.find(
        (comentario) => comentario.id === comentarioId
      );
      const jaCurtiu = Boolean(comentarioAtual?.curtidas.includes(usuario.id));

      const { error: erroLimparCurtida } = await supabase
        .from("comunidade_comentario_curtidas")
        .delete()
        .eq("comentario_id", comentarioId)
        .eq("usuario_id", usuario.id);

      if (erroLimparCurtida) {
        setErro(
          formatarErroSupabase(
            "Erro ao atualizar curtida do comentário",
            erroLimparCurtida
          )
        );
        return;
      }

      if (!jaCurtiu) {
        const { error: erroInserirCurtida } = await supabase
          .from("comunidade_comentario_curtidas")
          .insert({
            comentario_id: comentarioId,
            usuario_id: usuario.id,
          });

        if (erroInserirCurtida) {
          setErro(formatarErroSupabase("Erro ao curtir comentário", erroInserirCurtida));
          return;
        }

        if (comentarioAtual?.autorId) {
          await criarNotificacaoComunidadeSupabase({
            destinatarioId: comentarioAtual.autorId,
            tipo: "comunidade-curtida-comentario",
            titulo: "Nova curtida no seu comentário",
            mensagem: `${usuario.nome} curtiu seu comentário na Comunidade.`,
            link: `/comunidade?post=${encodeURIComponent(postId)}`,
            notificacaoId: `comunidade-curtida-comentario:${comentarioId}:${usuario.id}`,
          }, idSupabaseValidoComunidade);
        }
      }

      setPosts((postsAtuais) =>
        postsAtuais.map((post) => {
          if (post.id !== postId) {
            return post;
          }

          return {
            ...post,
            comentarios: post.comentarios.map((comentario) => {
              if (comentario.id !== comentarioId) {
                return comentario;
              }

              return {
                ...comentario,
                curtidas: jaCurtiu
                  ? comentario.curtidas.filter((curtidaId) => curtidaId !== usuario.id)
                  : Array.from(new Set([...comentario.curtidas, usuario.id])),
              };
            }),
          };
        })
      );

      emitirFeedbackAcao(
        jaCurtiu ? "Curtida do comentário removida." : "Comentário curtido."
      );
      await carregarPostsComunidade();
    } finally {
      finalizarAcaoComunidade(chaveAcao);
    }
  }

  async function atualizarVisibilidadePost(
    post: PostComunidade,
    novaVisibilidade: VisibilidadePostComunidade,
  ) {
    const chaveAcao = `visibilidade-post:${post.id}`;

    if (!iniciarAcaoComunidade(chaveAcao)) {
      return;
    }

    setPostVisibilidadeAtualizandoId(post.id);
    setErro("");

    try {
      if (!exigirLogin() || !usuario) {
        return;
      }

      if (post.autorId.trim() !== usuario.id.trim()) {
        return;
      }

      const visibilidadeSegura = normalizarVisibilidadePostComunidade(
        novaVisibilidade,
      );

      if (post.visibilidade === visibilidadeSegura) {
        return;
      }

      const reviewPrecisaSerProtegidaAntes =
        post.tipoPublicacao === "Review" && visibilidadeSegura !== "publico";

      if (reviewPrecisaSerProtegidaAntes) {
        const reviewSincronizada = await registrarReviewComunidadeNoDiario({
          userId: usuario.id,
          texto: post.texto,
          obraRelacionada: post.obraRelacionada,
          postId: post.id,
          criadaEm: post.criadoEm,
          sugestoesObras: obrasRelacionadasSugestoes,
          visibilidade: visibilidadeSegura,
        });

        if (!reviewSincronizada) {
          setErro(
            "Não foi possível atualizar a privacidade da review no Diário.",
          );
          return;
        }
      }

      const { data, error } = await supabase
        .from("comunidade_posts")
        .update({ visibilidade: visibilidadeSegura })
        .eq("id", post.id)
        .eq("autor_id", usuario.id)
        .select("id, visibilidade")
        .maybeSingle();

      if (error || !data) {
        if (post.tipoPublicacao === "Review") {
          reviewsDiarioSincronizadasRef.current.delete(post.id);
        }

        setErro(
          error
            ? formatarErroSupabase("Erro ao atualizar visibilidade", error)
            : "Erro ao atualizar visibilidade: a publicação não foi retornada.",
        );
        return;
      }

      if (post.tipoPublicacao === "Review") {
        if (reviewPrecisaSerProtegidaAntes) {
          reviewsDiarioSincronizadasRef.current.add(post.id);
        } else {
          reviewsDiarioSincronizadasRef.current.delete(post.id);
        }
      }

      setPosts((postsAtuais) =>
        postsAtuais.map((postAtual) =>
          postAtual.id === post.id
            ? { ...postAtual, visibilidade: visibilidadeSegura }
            : postAtual,
        ),
      );
      setPostMenuAbertoId(null);
      emitirFeedbackAcao("Visibilidade da publicação atualizada.");
    } finally {
      finalizarAcaoComunidade(chaveAcao);
      setPostVisibilidadeAtualizandoId((postAtualId) =>
        postAtualId === post.id ? null : postAtualId,
      );
    }
  }

  async function alternarFixadoPost(post: PostComunidade) {
    if (!usuarioEhAdmin) {
      setErro("Apenas administradores podem fixar publicações.");
      return;
    }

    if (postFixandoId === post.id) {
      return;
    }

    setPostFixandoId(post.id);
    setErro("");

    try {
      const novoEstadoFixado = !post.fixado;

      const { data, error } = await supabase
        .from("comunidade_posts")
        .update({ fixado: novoEstadoFixado })
        .eq("id", post.id)
        .select("fixado, fixado_em, fixado_por")
        .single();

      if (error) {
        setErro(formatarErroSupabase("Erro ao atualizar fixado", error));
        return;
      }

      const dadosFixado = data as {
        fixado?: boolean | null;
        fixado_em?: string | null;
        fixado_por?: string | null;
      } | null;

      setPosts((postsAtuais) =>
        postsAtuais.map((postAtual) => {
          if (postAtual.id !== post.id) {
            return postAtual;
          }

          return {
            ...postAtual,
            fixado: Boolean(dadosFixado?.fixado),
            fixadoEm: dadosFixado?.fixado_em || "",
            fixadoPor: dadosFixado?.fixado_por || "",
          };
        })
      );

      emitirFeedbackAcao(
        novoEstadoFixado
          ? "Publicação fixada no topo."
          : "Publicação desafixada."
      );
    } finally {
      setPostFixandoId((postAtualId) =>
        postAtualId === post.id ? null : postAtualId
      );
    }
  }

  async function removerPost(postId: string) {
    const chaveAcao = `remover-post:${postId}`;

    if (!iniciarAcaoComunidade(chaveAcao)) {
      return;
    }

    setPostRemovendoId(postId);
    setErro("");

    try {
      if (!exigirLogin() || !usuario) {
        return;
      }

      const usuarioAutenticado = await obterUsuarioAutenticadoComunidadeAtual();
      const usuarioAutenticadoId = usuarioAutenticado?.id?.trim() || "";
      const usuarioEstadoId = usuario.id.trim();

      if (
        !usuarioAutenticadoId ||
        usuarioAutenticadoId !== usuarioEstadoId
      ) {
        setUsuario(null);
        setUsuarioEhAdmin(false);
        setPostMenuAbertoId(null);
        setErro(
          "Sua conta mudou. Aguarde a Comunidade atualizar antes de tentar novamente."
        );
        return;
      }

      let usuarioAtualEhAdmin = false;

      try {
        const { data: adminData, error: adminError } = await supabase.rpc(
          "usuario_e_admin"
        );

        usuarioAtualEhAdmin = !adminError && adminData === true;
      } catch {
        usuarioAtualEhAdmin = false;
      }

      const { data: postBanco, error: postBancoError } = await supabase
        .from("comunidade_posts")
        .select("id, autor_id, tipo_publicacao")
        .eq("id", postId)
        .maybeSingle();

      if (postBancoError) {
        setErro(
          formatarErroSupabase(
            "Erro ao conferir publicação",
            postBancoError
          )
        );
        return;
      }

      if (!postBanco) {
        setPosts((postsAtuais) =>
          postsAtuais.filter((post) => post.id !== postId)
        );
        setPostMenuAbertoId(null);
        setErro("Esta publicação já não existe.");
        return;
      }

      const autorPostId = postBanco.autor_id?.trim() || "";

      if (
        !usuarioAtualEhAdmin &&
        autorPostId !== usuarioAutenticadoId
      ) {
        setPostMenuAbertoId(null);
        setErro("Você só pode remover suas próprias publicações.");
        return;
      }

      if (
        !window.confirm(
          traduzirTextoComunidade("Remover esta publicação?", language)
        )
      ) {
        return;
      }

      let removerPostQuery = supabase
        .from("comunidade_posts")
        .delete()
        .eq("id", postId);

      if (!usuarioAtualEhAdmin) {
        removerPostQuery = removerPostQuery.eq(
          "autor_id",
          usuarioAutenticadoId
        );
      }

      const { data: postsRemovidos, error } = await removerPostQuery.select(
        "id, autor_id, tipo_publicacao"
      );

      if (error) {
        setErro(formatarErroSupabase("Erro ao remover publicação", error));
        return;
      }

      if (!Array.isArray(postsRemovidos) || postsRemovidos.length === 0) {
        setErro(
          "A publicação não foi removida. A conta atual não possui permissão para essa ação."
        );
        await carregarPostsComunidade(false, 0, obraRelacionadaFiltro);
        return;
      }

      const postRemovido = postsRemovidos[0];

      if (postRemovido.tipo_publicacao === "Review") {
        await removerReviewComunidadeDoDiario({
          userId: postRemovido.autor_id || autorPostId,
          postId,
        });
        reviewsDiarioSincronizadasRef.current.delete(postId);
      }

      setUsuarioEhAdmin(usuarioAtualEhAdmin);
      setPosts((postsAtuais) =>
        postsAtuais.filter((post) => post.id !== postId)
      );

      const postsSalvosAtualizados = postsSalvosIds.filter(
        (postSalvoId) => postSalvoId !== postId
      );

      setPostsSalvosIds(postsSalvosAtualizados);

      salvarJsonUsuarioComunidade(
        CHAVE_POSTS_SALVOS_COMUNIDADE,
        usuarioAutenticadoId,
        postsSalvosAtualizados
      );

      emitirFeedbackAcao("Publicação removida.");
      await carregarPostsComunidade(false, 0, obraRelacionadaFiltro);
    } finally {
      finalizarAcaoComunidade(chaveAcao);
      setPostRemovendoId((postAtualId) =>
        postAtualId === postId ? null : postAtualId
      );
    }
  }

  if (carregandoFeed) {
    return (
      <CommunityFeedLoadingState style={pageThemeStyle}>
        <CommunityLanguageBridge />
      </CommunityFeedLoadingState>
    );
  }

  return (
    <CommunityPageContainer style={pageThemeStyle}>
      <CommunityLanguageBridge />
      <CommunityThemeStyles />

      <CommunityTopWaterFade isDesktop={isDesktop} />

      <CommunityContentContainer isDesktop={isDesktop}>
        {isDesktop ? (
          <CommunityDesktopHeader>
            <CommunityDesktopTitle>Comunidade</CommunityDesktopTitle>

            <CommunityDesktopHeaderActions>
              <CommunityDesktopSearchContainer>
                <CommunityDesktopSearchIcon />

                <CommunityDesktopSearchInput
                  value={termoBusca}
                  onChange={(event) => setTermoBusca(event.target.value)}
                />
              </CommunityDesktopSearchContainer>

              <CommunityDesktopFilterButton
                onClick={() =>
                  setMenuAcoesRapidasComunidadeAberto((aberto) => !aberto)
                }
                expanded={menuAcoesRapidasComunidadeAberto}
              />

            </CommunityDesktopHeaderActions>
          </CommunityDesktopHeader>
        ) : null}

        <CommunityMainLayout isDesktop={isDesktop}>
          <CommunityFeedColumn isDesktop={isDesktop}>
            {usuario && erro && !composerAberto && (
              <CommunityFeedErrorNotice>{erro}</CommunityFeedErrorNotice>
            )}

            <CommunityFeedFiltersContainer isDesktop={isDesktop}>
              <CommunityFilterControlsRow>
                <CommunityAdvancedFiltersButton
                  type="button"
                  aria-label="Abrir filtros, ordenação e ações da comunidade"
                  aria-expanded={menuAcoesRapidasComunidadeAberto}
                  onClick={() =>
                    setMenuAcoesRapidasComunidadeAberto((aberto) => !aberto)
                  }
                >
                  <span>{textoBotaoFiltrosAvancadosComunidade}</span>
                  <CommunityAdvancedFiltersIcon>
                    +
                  </CommunityAdvancedFiltersIcon>
                </CommunityAdvancedFiltersButton>

                {buscaComunidadeAberta || Boolean(termoBusca.trim()) ? (
                  <>
                    <CommunitySearchContainer>
                      <CommunitySearchInput
                        aria-label="Buscar publicações ou usuários"
                        value={termoBusca}
                        onChange={(event) => setTermoBusca(event.target.value)}
                        placeholder="Buscar publicações ou usuários"
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck={false}
                        maxLength={90}
                        autoFocus
                      />
                    </CommunitySearchContainer>

                    <CommunitySearchToggleButton
                      type="button"
                      onClick={() => {
                        setTermoBusca("");
                        setBuscaComunidadeAberta(false);
                      }}
                      aria-label="Fechar busca"
                      aria-expanded="true"
                    >
                      <CommunitySearchIcon />
                    </CommunitySearchToggleButton>
                  </>
                ) : (
                  <CommunitySearchToggleButton
                    type="button"
                    onClick={() => setBuscaComunidadeAberta(true)}
                    aria-label="Abrir busca"
                    aria-expanded="false"
                  >
                    <CommunitySearchIcon />
                  </CommunitySearchToggleButton>
                )}
              </CommunityFilterControlsRow>

            </CommunityFeedFiltersContainer>

            <CommunityFeedTabsContainer isDesktop={isDesktop}>
              {ABAS_FEED_COMUNIDADE.map((aba) => {
                const ativa = abaFeedAtiva === aba;

                return (
                  <CommunityFeedTabButton
                    key={aba}
                    active={ativa}
                    onClick={() => selecionarAbaFeedComunidade(aba)}
                  >
                    {aba}
                  </CommunityFeedTabButton>
                );
              })}
            </CommunityFeedTabsContainer>

            {menuAcoesRapidasComunidadeAberto && (
              <CommunitySheetOverlay
                ariaLabel="Filtros, ordenação e ações da comunidade"
                closeAriaLabel="Fechar filtros e ações da comunidade"
                onClose={() => setMenuAcoesRapidasComunidadeAberto(false)}
              >
                <CommunitySheetSurface>
                  <CommunitySheetHandle />

                  <CommunitySheetTitle>
                    Filtrar e ordenar
                  </CommunitySheetTitle>

                  <CommunitySheetSectionLabel>
                    Ações
                  </CommunitySheetSectionLabel>

                  <CommunitySheetPrimaryAction
                    onClick={abrirPublicacaoRapidaComunidade}
                  >
                    Publicar
                  </CommunitySheetPrimaryAction>

                  <CommunitySheetSectionLabel>
                    Mostrar
                  </CommunitySheetSectionLabel>

                  <CommunitySheetFilterOption
                    active={!filtrosAtivos}
                    onClick={() => {
                      limparFiltrosComunidade();
                      setMenuAcoesRapidasComunidadeAberto(false);
                    }}
                  >
                    Todas
                  </CommunitySheetFilterOption>

                  <CommunitySheetFilterOption
                    active={mostrarApenasSalvos}
                    onClick={() => {
                      setMostrarApenasSalvos(true);
                      setMenuAcoesRapidasComunidadeAberto(false);
                    }}
                  >
                    Posts salvos
                  </CommunitySheetFilterOption>

                  <CommunitySheetSectionLabel>
                    Ordenar
                  </CommunitySheetSectionLabel>

                  <CommunitySheetFilterOption
                    active={
                      ordenacaoAtiva === "Recentes" && !mostrarApenasSalvos
                    }
                    onClick={() => {
                      setOrdenacaoAtiva("Recentes");
                      setMostrarApenasSalvos(false);
                      setMenuAcoesRapidasComunidadeAberto(false);
                    }}
                  >
                    Recentes
                  </CommunitySheetFilterOption>

                  <CommunitySheetFilterOption
                    active={
                      ordenacaoAtiva === "Em alta" && !mostrarApenasSalvos
                    }
                    onClick={() => {
                      setOrdenacaoAtiva("Em alta");
                      setMostrarApenasSalvos(false);
                      setMenuAcoesRapidasComunidadeAberto(false);
                    }}
                  >
                    Em alta
                  </CommunitySheetFilterOption>

                  <CommunitySheetFilterOption
                    active={
                      ordenacaoAtiva === "Mais comentadas" && !mostrarApenasSalvos
                    }
                    onClick={() => {
                      setOrdenacaoAtiva("Mais comentadas");
                      setMostrarApenasSalvos(false);
                      setMenuAcoesRapidasComunidadeAberto(false);
                    }}
                  >
                    Mais comentadas
                  </CommunitySheetFilterOption>

                </CommunitySheetSurface>
              </CommunitySheetOverlay>
            )}

            {termoBuscaNormalizado ? (
              <CommunityUserSearchSection ariaLabel="Usuários encontrados">
                <CommunitySearchResultsHeader>
                  <CommunitySearchResultsTitle>
                    Usuários
                  </CommunitySearchResultsTitle>
                  <CommunitySearchResultsCount>
                    {carregandoUsuariosBuscaComunidade
                      ? traduzirTextoComunidade("Buscando...", language)
                      : traduzirContagemResultadosComunidade(
                          usuariosBuscaComunidade.length,
                          "usuarios",
                          language
                        )}
                  </CommunitySearchResultsCount>
                </CommunitySearchResultsHeader>

                {termoBusca.trim().replace(/^@+/, "").length < 2 ? (
                  <CommunitySearchResultsEmpty>
                    Digite pelo menos 2 caracteres para encontrar usuários.
                  </CommunitySearchResultsEmpty>
                ) : carregandoUsuariosBuscaComunidade ? (
                  <CommunityUserSearchLoading>
                    <CommunityLoadingSpinner
                      compacto
                      label="Buscando usuários"
                    />
                  </CommunityUserSearchLoading>
                ) : usuariosBuscaComunidade.length > 0 ? (
                  <CommunityUserSearchList>
                    {usuariosBuscaComunidade.map((usuarioBusca) => {
                      const ehUsuarioAtual = usuario?.id === usuarioBusca.id;
                      const seguindoUsuario = usuariosSeguidosIds.includes(
                        usuarioBusca.id
                      );
                      const atualizandoSeguindo =
                        usuarioSeguindoId === usuarioBusca.id;

                      return (
                        <CommunityUserSearchCard key={usuarioBusca.id}>
                          <CommunityUserSearchAvatar
                            href={criarPerfilHrefComunidade(
                              usuarioBusca.id,
                              usuarioBusca.nome
                            )}
                            ariaLabel={`Abrir perfil de ${usuarioBusca.nome}`}
                            avatar={usuarioBusca.avatar}
                          >
                            {!usuarioBusca.avatar &&
                              (usuarioBusca.nome.slice(0, 1).toUpperCase() ||
                                "U")}
                          </CommunityUserSearchAvatar>

                          <CommunityUserSearchInfo>
                            <CommunityUserSearchName
                              href={criarPerfilHrefComunidade(
                                usuarioBusca.id,
                                usuarioBusca.nome
                              )}
                            >
                              {usuarioBusca.nome}
                            </CommunityUserSearchName>

                            <CommunityUserSearchUsername>
                              {usuarioBusca.username
                                ? `@${usuarioBusca.username}`
                                : "Perfil da comunidade"}
                            </CommunityUserSearchUsername>
                          </CommunityUserSearchInfo>

                          {ehUsuarioAtual ? (
                            <CommunityUserSearchSelfBadge>
                              Você
                            </CommunityUserSearchSelfBadge>
                          ) : (
                            <CommunityUserSearchFollowButton
                              onClick={() =>
                                alternarSeguirUsuarioBusca(usuarioBusca)
                              }
                              disabled={atualizandoSeguindo}
                              following={seguindoUsuario}
                            >
                              {atualizandoSeguindo
                                ? "..."
                                : seguindoUsuario
                                  ? "Seguindo"
                                  : "Seguir"}
                            </CommunityUserSearchFollowButton>
                          )}
                        </CommunityUserSearchCard>
                      );
                    })}
                  </CommunityUserSearchList>
                ) : (
                  <CommunitySearchResultsEmpty>
                    Nenhum usuário encontrado.
                  </CommunitySearchResultsEmpty>
                )}
              </CommunityUserSearchSection>
            ) : null}

            {termoBuscaNormalizado ? (
              <CommunitySearchResultsHeader>
                <CommunitySearchResultsTitle>
                  Publicações
                </CommunitySearchResultsTitle>
                <CommunitySearchResultsCount>
                  {traduzirContagemResultadosComunidade(
                    postsVisiveis.length,
                    "publicacoes",
                    language
                  )}
                </CommunitySearchResultsCount>
              </CommunitySearchResultsHeader>
            ) : null}

            <CommunityPostsList isDesktop={isDesktop}>
              {!carregandoFeed && (
                postsVisiveis.length > 0 ? (
                postsVisiveis.map((post) => {
                  const usuarioCurtiu = Boolean(
                    usuario && post.curtidas.includes(usuario.id)
                  );
                  const postSalvo = postsSalvosIds.includes(post.id);
                  const usuarioAtualId = usuario?.id.trim() || "";
                  const autorPostId = post.autorId.trim();
                  const podeRemover = Boolean(
                    !carregandoUsuario &&
                      usuarioAtualId &&
                      (autorPostId === usuarioAtualId || usuarioEhAdmin)
                  );
                  const podeDenunciarPost = Boolean(
                    !carregandoUsuario &&
                      usuarioAtualId &&
                      autorPostId !== usuarioAtualId
                  );
                  const postCurtindo = postCurtindoId === post.id;
                  const postSalvando = postSalvandoId === post.id;
                  const postCompartilhando = postCompartilhandoId === post.id;
                  const postRemovendo = postRemovendoId === post.id;
                  const postFixando = postFixandoId === post.id;
                  const postVisibilidadeAtualizando =
                    postVisibilidadeAtualizandoId === post.id;
                  const podeAlterarVisibilidade = Boolean(
                    !carregandoUsuario &&
                      usuarioAtualId &&
                      autorPostId === usuarioAtualId
                  );
                  const postDenunciando = Boolean(
                    denunciaAlvo?.alvoTipo === "post" &&
                      denunciaAlvo.alvoId === post.id
                  );
                  const spoilerRevelado = spoilersReveladosIds.includes(post.id);
                  const ocultarTextoSpoiler = post.temSpoiler && !spoilerRevelado;
                  const obraRelacionadaPermitida = obterObraRelacionadaPermitida(
                    post.obraRelacionada,
                    obrasRelacionadasSugestoes
                  );
                  const opcoesPublicacao = (
                    <CommunityPostOptionsContainer>
                      <CommunityPostOptionsButton
                        type="button"
                        aria-label="Abrir opções da publicação"
                        aria-haspopup="menu"
                        aria-expanded={postMenuAbertoId === post.id}
                        onClick={() =>
                          setPostMenuAbertoId((postIdAtual) =>
                            postIdAtual === post.id ? null : post.id
                          )
                        }
                        menuOpen={Boolean(postMenuAbertoId)}
                      >
                        ⋮
                      </CommunityPostOptionsButton>

                      {postMenuAbertoId === post.id && typeof document !== "undefined"
                        ? createPortal(
                        <CommunitySheetOverlay
                          ariaLabel="Ações da publicação"
                          closeAriaLabel="Fechar ações da publicação"
                          onClose={() => setPostMenuAbertoId(null)}
                        >
                          <CommunitySheetSurface role="menu">
                            <CommunitySheetHandle />

                            <CommunitySheetTitle>
                              Ações da publicação
                            </CommunitySheetTitle>

                            <CommunitySheetMenuAction
                              onClick={() => {
                                setPostMenuAbertoId(null);
                                alternarPostSalvo(post.id);
                              }}
                              disabled={postSalvando}
                            >
                              {postSalvando
                                ? "Salvando..."
                                : postSalvo
                                  ? "Remover dos salvos"
                                  : "Salvar publicação"}
                            </CommunitySheetMenuAction>

                            <CommunitySheetMenuAction
                              onClick={() => {
                                setPostMenuAbertoId(null);
                                compartilharPublicacao(post);
                              }}
                              disabled={postCompartilhando}
                            >
                              {postCompartilhando ? "Compartilhando..." : "Compartilhar"}
                            </CommunitySheetMenuAction>

                            {podeAlterarVisibilidade && (
                              <CommunitySheetVisibilityMenu>
                                <CommunitySheetVisibilityTitle>
                                  Quem pode ver esta publicação?
                                </CommunitySheetVisibilityTitle>

                                {VISIBILIDADES_POST_COMUNIDADE.map((opcao) => {
                                  const ativa = post.visibilidade === opcao.valor;

                                  return (
                                    <CommunitySheetVisibilityOption
                                      key={`${post.id}-visibilidade-${opcao.valor}`}
                                      active={ativa}
                                      onClick={() =>
                                        void atualizarVisibilidadePost(
                                          post,
                                          opcao.valor,
                                        )
                                      }
                                      disabled={postVisibilidadeAtualizando}
                                    >
                                      {opcao.rotulo}
                                    </CommunitySheetVisibilityOption>
                                  );
                                })}
                              </CommunitySheetVisibilityMenu>
                            )}

                            {usuarioEhAdmin && (
                              <CommunitySheetMenuAction
                                onClick={() => {
                                  setPostMenuAbertoId(null);
                                  alternarFixadoPost(post);
                                }}
                                disabled={postFixando}
                              >
                                {postFixando
                                  ? "Atualizando..."
                                  : post.fixado
                                    ? "Desfixar publicação"
                                    : "Fixar publicação"}
                              </CommunitySheetMenuAction>
                            )}

                            {podeRemover && (
                              <CommunitySheetDangerAction
                                onClick={() => {
                                  setPostMenuAbertoId(null);
                                  removerPost(post.id);
                                }}
                                disabled={postRemovendo}
                              >
                                {postRemovendo ? "Removendo..." : "Remover publicação"}
                              </CommunitySheetDangerAction>
                            )}

                            {podeDenunciarPost && (
                              <CommunitySheetDangerAction
                                onClick={() => {
                                  setPostMenuAbertoId(null);
                                  denunciarConteudo("post", post.id);
                                }}
                                disabled={postDenunciando}
                              >
                                {postDenunciando ? "Enviando..." : "Denunciar"}
                              </CommunitySheetDangerAction>
                            )}
                          </CommunitySheetSurface>
                        </CommunitySheetOverlay>,
                            document.body
                          )
                        : null}
                    </CommunityPostOptionsContainer>
                  );

                  return (
                    <CommunityPostCard key={post.id} isDesktop={isDesktop}>
                      <CommunityPostHeader>
                        <CommunityPostAuthorAvatar
                          href={criarPerfilHrefComunidade(
                            post.autorId,
                            post.autorNome
                          )}
                          ariaLabel={`Abrir perfil de ${post.autorNome}`}
                          avatar={post.autorAvatar}
                        >
                          {!post.autorAvatar && post.autorNome.slice(0, 1).toUpperCase()}
                        </CommunityPostAuthorAvatar>

                        <CommunityPostAuthorMeta>
                          <CommunityPostAuthorLink
                            href={criarPerfilHrefComunidade(
                              post.autorId,
                              post.autorNome
                            )}
                          >
                            {post.autorNome}
                          </CommunityPostAuthorLink>
                          <CommunityPostStatusLine>
                            {formatarDataComunidade(post.criadoEm)}
                            {post.fixado && (
                              <>
                                {" "}
                                <CommunityPostStatusSeparator />
                                {" "}
                                <CommunityPostPinnedBadge>Fixado</CommunityPostPinnedBadge>
                              </>
                            )}
                            {post.visibilidade !== "publico" && (
                              <>
                                {" "}
                                <CommunityPostStatusSeparator />
                                {" "}
                                <CommunityPostVisibilityBadge>
                                  {obterRotuloVisibilidadePostComunidade(
                                    post.visibilidade,
                                  )}
                                </CommunityPostVisibilityBadge>
                              </>
                            )}
                          </CommunityPostStatusLine>
                        </CommunityPostAuthorMeta>

                        {opcoesPublicacao}
                      </CommunityPostHeader>

                      <CommunityPostBadgesRow>
                        {obraRelacionadaPermitida && (
                          <>
                            <CommunityRelatedWorkBadge
                              href={criarLinkObraRelacionada(
                                obraRelacionadaPermitida.titulo,
                                obrasRelacionadasSugestoes
                              )}
                            >
                              {obraRelacionadaPermitida.titulo}
                            </CommunityRelatedWorkBadge>

                            <CommunityPostBadgeSeparator />
                          </>
                        )}

                        {obraRelacionadaPermitida && post.capituloRelacionado && (
                          <>
                            <CommunityRelatedChapterBadge>
                              {post.capituloRelacionado}
                            </CommunityRelatedChapterBadge>

                            <CommunityPostBadgeSeparator />
                          </>
                        )}

                        <CommunityPostTypeBadge
                          isPoll={postEhEnquete(post)}
                        >
                          {postEhEnquete(post)
                            ? obterPerguntaEnquete(post.texto)
                            : obterTipoVisualPublicacao(post)}
                        </CommunityPostTypeBadge>
                      </CommunityPostBadgesRow>

                      {ocultarTextoSpoiler ? (
                        <CommunitySpoilerHiddenTitle>
                          Conteúdo com spoiler oculto
                        </CommunitySpoilerHiddenTitle>
                      ) : (
                        <>
                          {postEhEnquete(post) ? (
                            <CommunityPollBox>
                              <CommunityPollOptions>
                                {obterOpcoesEnquete(post.texto).map((opcao) => {
                                  const votoAtual = votosEnquetes[post.id] || "";
                                  const selecionada = votoAtual === opcao;
                                  const usuarioVotouNaEnquete = Boolean(votoAtual);
                                  const totalVotos = usuarioVotouNaEnquete
                                    ? calcularTotalVotosEnquete(
                                        resultadosEnquetes,
                                        post.id
                                      )
                                    : 0;
                                  const porcentagem = usuarioVotouNaEnquete
                                    ? calcularPorcentagemOpcaoEnquete(
                                        resultadosEnquetes,
                                        post.id,
                                        opcao
                                      )
                                    : 0;
                                  const larguraResultado =
                                    usuarioVotouNaEnquete && totalVotos > 0
                                      ? `${porcentagem}%`
                                      : usuarioVotouNaEnquete && selecionada
                                        ? "100%"
                                        : "0%";

                                  return (
                                    <CommunityPollOptionButton
                                      key={opcao}
                                      onClick={() => votarEnquete(post.id, opcao)}
                                      disabled={Boolean(votoAtual) || votandoEnqueteId === post.id}
                                      selected={selecionada}
                                    >
                                      <CommunityPollResultBar
                                        width={larguraResultado}
                                        visible={usuarioVotouNaEnquete}
                                      />

                                      <CommunityPollOptionText
                                        selected={selecionada}
                                      >
                                        {opcao}
                                      </CommunityPollOptionText>

                                      <CommunityPollOptionStatus
                                        selected={selecionada}
                                      >
                                        {usuarioVotouNaEnquete
                                          ? selecionada
                                            ? `${totalVotos > 0 ? porcentagem : 100}%`
                                            : `${porcentagem}%`
                                          : votandoEnqueteId === post.id
                                            ? "..."
                                            : "Votar"}
                                      </CommunityPollOptionStatus>
                                    </CommunityPollOptionButton>
                                  );
                                })}
                              </CommunityPollOptions>
                            </CommunityPollBox>
                          ) : (
                            <CommunityPostText>{post.texto}</CommunityPostText>
                          )}
                        </>
                      )}

                      <CommunityPostActions desktop={isDesktop}>
                        <CommunityPostLikeButton
                          onClick={() => alternarCurtida(post.id)}
                          disabled={postCurtindo}
                          liked={usuarioCurtiu}
                          count={contarCurtidasUnicasPostComunidade(post)}
                          ariaLabel={`${usuarioCurtiu
                              ? "Remover curtida da publicação"
                              : "Curtir publicação"
                          }. ${contarCurtidasUnicasPostComunidade(post)} ${contarCurtidasUnicasPostComunidade(post) === 1
                              ? "curtida"
                              : "curtidas"
                          }`}
                        />

                        <CommunityPostCommentsButton
                          onClick={() => abrirComentarios(post.id)}
                          count={contarComentaristasUnicosPostComunidade(post)}
                          ariaLabel={`${contarComentaristasUnicosPostComunidade(post)} comentários`}
                        />

                        {post.temSpoiler && (
                          <CommunityPostSpoilerButton
                            onClick={() => alternarSpoilerRevelado(post.id)}
                          >
                            {ocultarTextoSpoiler ? "REVELAR" : "OCULTAR"}
                          </CommunityPostSpoilerButton>
                        )}
                      </CommunityPostActions>
                    </CommunityPostCard>
                  );
                })
              ) : (
                <CommunityFeedEmptyMessage desktop={isDesktop}>
                  {abaFeedAtiva === "Seguindo"
                    ? usuario
                      ? "Nenhuma publicação de pessoas que você segue."
                      : "Entre na sua conta para ver publicações de quem você segue."
                    : mostrarApenasSalvos
                      ? "Nenhuma publicação salva"
                      : filtrosAtivos
                        ? "Nenhuma publicação encontrada"
                        : "Nenhuma publicação ainda"}
                </CommunityFeedEmptyMessage>
              )
              )}
            </CommunityPostsList>

            {!carregandoFeed && postsVisiveis.length > 0 && temMaisPostsComunidade && (
              <CommunityLoadMorePostsContainer>
                <CommunityLoadMorePostsButton
                  onClick={carregarMaisPostsComunidade}
                  disabled={carregandoMaisPostsComunidade}
                >
                  {carregandoMaisPostsComunidade ? (
                    <CommunityLoadingSpinner
                      compacto
                      label="Carregando mais publicações"
                    />
                  ) : (
                    "Carregar mais publicações"
                  )}
                </CommunityLoadMorePostsButton>
              </CommunityLoadMorePostsContainer>
            )}

          </CommunityFeedColumn>

        </CommunityMainLayout>
      </CommunityContentContainer>

      {composerAberto && usuario && typeof document !== "undefined"
        ? createPortal(
            <CommunityPostComposerOverlay>
          <CommunityPostComposerBackdrop
            onClick={() => {
              if (!publicandoPost) {
                setErro("");
                setComposerAberto(false);
              }
            }}
          />

          <CommunityPostComposerPanel desktop={isDesktop}>
            <CommunitySheetHandle />

            <CommunityPostComposerHeader>
              Nova publicação
            </CommunityPostComposerHeader>

            <CommunityPostComposerForm onSubmit={publicarPost}>
              <CommunityPostComposerFields desktop={isDesktop}>
                <CommunityPostComposerField>
                  <CommunityPostComposerFieldLabel>Categoria</CommunityPostComposerFieldLabel>

                  <CommunityPostComposerSelect
                    disabled={publicandoPost}
                    value={categoriaPost}
                    onChange={(event) =>
                      setCategoriaPost(event.target.value as CategoriaComunidade)
                    }
                  >
                    {CATEGORIAS_COMUNIDADE.map((categoria) => (
                      <option key={categoria} value={categoria}>
                        {categoria}
                      </option>
                    ))}
                  </CommunityPostComposerSelect>
                </CommunityPostComposerField>

                <CommunityPostComposerField>
                  <CommunityPostComposerFieldLabel>Tipo</CommunityPostComposerFieldLabel>

                  <CommunityPostComposerSelect
                    disabled={publicandoPost}
                    value={tipoPublicacaoPost}
                    onChange={(event) =>
                      selecionarTipoPublicacaoPost(
                        event.target.value as TipoPublicacaoComunidade
                      )
                    }
                  >
                    {TIPOS_PUBLICACAO_COMUNIDADE.map((tipo) => (
                      <option key={tipo} value={tipo}>
                        {tipo}
                      </option>
                    ))}
                  </CommunityPostComposerSelect>
                </CommunityPostComposerField>

                <CommunityPostComposerField>
                  <CommunityPostComposerFieldLabel>Quem pode ver esta publicação?</CommunityPostComposerFieldLabel>

                  <CommunityPostComposerSelect
                    disabled={publicandoPost}
                    value={visibilidadePost}
                    onChange={(event) =>
                      setVisibilidadePost(
                        normalizarVisibilidadePostComunidade(event.target.value),
                      )
                    }
                  >
                    {VISIBILIDADES_POST_COMUNIDADE.map((opcao) => (
                      <option key={opcao.valor} value={opcao.valor}>
                        {opcao.rotulo}
                      </option>
                    ))}
                  </CommunityPostComposerSelect>
                </CommunityPostComposerField>

                <CommunityPostComposerField>
                  <CommunityPostComposerFieldLabel>Obra relacionada</CommunityPostComposerFieldLabel>

                  <CommunityPostComposerRelatedWorkSearch>
                    <CommunityPostComposerInput
                      ref={obraRelacionadaRef}
                      disabled={publicandoPost}
                      value={obraRelacionadaBusca}
                      onChange={(event) => {
                        const valorDigitado = event.target.value;

                        setObraRelacionadaBusca(valorDigitado);

                        if (!valorDigitado.trim()) {
                          setCapituloRelacionadoPost("");
                        }

                        setSugestoesObrasAbertas(Boolean(valorDigitado.trim()));
                      }}
                      onFocus={() => {
                        setSugestoesObrasAbertas(
                          Boolean(obraRelacionadaBusca.trim())
                        );
                      }}
                      onBlur={() => {
                        window.setTimeout(() => {
                          setSugestoesObrasAbertas(false);
                        }, 120);
                      }}
                      placeholder="Opcional: nome da obra"
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck={false}
                      maxLength={90}
                    />

                    {sugestoesObrasAbertas &&
                      sugestoesObrasRelacionadasVisiveis.length > 0 && (
                        <CommunityPostComposerRelatedWorkSuggestions>
                          {sugestoesObrasRelacionadasVisiveis.map((obra) => (
                            <CommunityPostComposerRelatedWorkSuggestionButton
                              key={obra.id}
                              type="button"
                              onMouseDown={(event) => {
                                event.preventDefault();
                                selecionarObraRelacionada(obra.titulo);
                              }}
                            >
                              <CommunityPostComposerRelatedWorkSuggestionContent>
                                <CommunityPostComposerRelatedWorkSuggestionTitle>
                                  {obra.titulo}
                                </CommunityPostComposerRelatedWorkSuggestionTitle>

                                <CommunityPostComposerRelatedWorkSuggestionAuthor>
                                  {obra.autor}
                                </CommunityPostComposerRelatedWorkSuggestionAuthor>
                              </CommunityPostComposerRelatedWorkSuggestionContent>

                              <CommunityPostComposerRelatedWorkSuggestionBadge>
                                OBRA
                              </CommunityPostComposerRelatedWorkSuggestionBadge>
                            </CommunityPostComposerRelatedWorkSuggestionButton>
                          ))}
                        </CommunityPostComposerRelatedWorkSuggestions>
                      )}
                  </CommunityPostComposerRelatedWorkSearch>
                </CommunityPostComposerField>

                <CommunityPostComposerField>
                  <CommunityPostComposerFieldLabel>Capítulo relacionado</CommunityPostComposerFieldLabel>

                  <CommunityPostComposerInput
                    disabled={publicandoPost || !obraRelacionadaBusca.trim()}
                    value={capituloRelacionadoPost}
                    onChange={(event) =>
                      setCapituloRelacionadoPost(event.target.value)
                    }
                    placeholder="Opcional: número ou título do capítulo"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    maxLength={60}
                    style={getCommunityPostComposerRelatedChapterInputStyle(
                      Boolean(obraRelacionadaBusca.trim()),
                    )}
                  />
                </CommunityPostComposerField>
              </CommunityPostComposerFields>

              <CommunityPostComposerField>
                <CommunityPostComposerPublicationHeader>
                  <CommunityPostComposerFieldLabel>Publicação</CommunityPostComposerFieldLabel>

                  <CommunityPostComposerPublicationTools>
                    <CommunityPostComposerPollTemplateButton
                      disabled={publicandoPost}
                      onClick={prepararEnqueteComunidade}
                    >
                      Modelo de enquete
                    </CommunityPostComposerPollTemplateButton>

                    <CommunityPostComposerCharacterCount>
                      máx. 700
                    </CommunityPostComposerCharacterCount>
                  </CommunityPostComposerPublicationTools>
                </CommunityPostComposerPublicationHeader>

                <CommunityPostComposerSuggestionsSection>
                  <CommunityPostComposerSuggestionsLabel>
                    Sugestões para começar
                  </CommunityPostComposerSuggestionsLabel>

                  <CommunityPostComposerSuggestionsList>
                    {SUGESTOES_PUBLICACAO_COMUNIDADE.map((sugestao) => (
                      <CommunityPostComposerSuggestionButton
                        key={sugestao.rotulo}
                        disabled={publicandoPost}
                        onClick={() =>
                          aplicarSugestaoPublicacaoComunidade(sugestao)
                        }
                      >
                        {sugestao.rotulo}
                      </CommunityPostComposerSuggestionButton>
                    ))}
                  </CommunityPostComposerSuggestionsList>
                </CommunityPostComposerSuggestionsSection>

                <CommunityPostComposerTextarea
                  ref={textoPostRef}
                  disabled={publicandoPost}
                />
              </CommunityPostComposerField>

              {erro && (
                <CommunityPostComposerErrorMessage>
                  {erro}
                </CommunityPostComposerErrorMessage>
              )}

              <CommunityPostComposerActionRow>
                <CommunityPostComposerSpoilerButton
                  active={temSpoilerPost}
                  disabled={publicandoPost}
                  onClick={() => setTemSpoilerPost((valorAtual) => !valorAtual)}
                >
                  <CommunityPostComposerSpoilerLabel>
                    Este post contém spoiler
                  </CommunityPostComposerSpoilerLabel>

                  <CommunityPostComposerSpoilerIndicator
                    active={temSpoilerPost}
                  >
                    {temSpoilerPost ? "✓" : ""}
                  </CommunityPostComposerSpoilerIndicator>
                </CommunityPostComposerSpoilerButton>

                <CommunityPostComposerPublishButton
                  disabled={publicandoPost}
                >
                  {publicandoPost ? "Publicando..." : "Publicar"}
                </CommunityPostComposerPublishButton>
              </CommunityPostComposerActionRow>
            </CommunityPostComposerForm>
          </CommunityPostComposerPanel>
            </CommunityPostComposerOverlay>,
            document.body
          )
        : null}

      <ComentariosSheet
        key={postComentariosAberto?.id || "comentarios-fechados"}
        post={postComentariosAberto}
        podeComentar={Boolean(usuario)}
        usuarioId={usuario?.id || ""}
        usuarioNome={usuario?.nome || "Usuário"}
        usuarioAvatar={usuario?.avatar || ""}
        erroInteracao={erro}
        isDesktop={isDesktop}
        onFechar={fecharComentarios}
        onEnviar={comentarPost}
        onCurtirComentario={alternarCurtidaComentario}
        onRemoverComentario={removerComentario}
        onDenunciarComentario={(comentarioId) =>
          denunciarConteudo("comentario", comentarioId)
        }
      />

      <DenunciaModal
        aberto={Boolean(denunciaAlvo)}
        alvoTipo={denunciaAlvo?.alvoTipo || "post"}
        alvoId={denunciaAlvo?.alvoId || ""}
        alvoTitulo={denunciaAlvo?.alvoTitulo || ""}
        onFechar={() => setDenunciaAlvo(null)}
        onEnviada={() => {
          setErro("");
          emitirFeedbackAcao("Denúncia enviada para análise.");
        }}
      />

      {feedbackAcao && (
        <CommunityActionFeedbackToast>
          {feedbackAcao}
        </CommunityActionFeedbackToast>
      )}
    </CommunityPageContainer>
  );
}



















































































































































