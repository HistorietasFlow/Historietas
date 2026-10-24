"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase/client";
import { criarSlugBase, idObraSupabaseValido } from "../../lib/utils";
import { historietasThemeCss, useHistorietasTheme } from "../../lib/historietasTheme";
import { useHistorietasLanguage } from "../../components/HistorietasLanguageProvider";
import { PainelAutorLanguageBridge } from "./components/painel-autor-language-bridge";
import { LoadingSpinner } from "./components/painel-autor-loading-spinner";
import { usePainelAutorAuthSession } from "./hooks/use-painel-autor-auth-session";
import { usePainelAutorDesktopMode } from "./hooks/use-painel-autor-desktop-mode";
import { usePainelAutorFiltersBodyLock } from "./hooks/use-painel-autor-filters-body-lock";
import { usePainelAutorFilterState } from "./hooks/use-painel-autor-filter-state";
import { usePainelAutorWorkActionsBodyLock } from "./hooks/use-painel-autor-work-actions-body-lock";
import { usePainelAutorSummaryPreference } from "./hooks/use-painel-autor-summary-preference";
import { painelAutorPageCss } from "./lib/painel-autor-page-css";
import {
  filtrarObrasDoUsuarioPainel,
  marcarObrasComDonoPainel,
  normalizarIdUsuarioPainel,
} from "./lib/painel-autor-ownership-utils";
import { carregarComentariosCapitulosUsuarioPainel } from "./lib/painel-autor-chapter-comments-loader";
import { converterObraSupabaseParaLocalPainel } from "./lib/painel-autor-supabase-work-converter";
import { obterChavesBackupArquivoPainel } from "./lib/painel-autor-file-backup-key-utils";
import {
  FILE_BACKUP_STORAGE_KEY,
  carregarBackupArquivosObras,
  sincronizarBackupArquivosObras,
} from "./lib/painel-autor-file-backup-storage";
import { restaurarArquivoObraComBackup } from "./lib/painel-autor-file-backup-restore-utils";
import {
  criarPainelCoverDesktopStyle,
  criarPainelCoverStyle,
} from "./lib/painel-autor-cover-style-utils";
import {
  containerStyle,
  desktopTopWaterFadeStyle,
  mobileTopWaterFadeStyle,
  pageStyle,
  topStyle,
} from "./lib/painel-autor-layout-style-utils";
import {
  desktopCommunityFilterButtonStyle,
  desktopCommunitySearchIconStyle,
  desktopCommunitySearchInputStyle,
  desktopCommunitySearchShellStyle,
  desktopCommunityTopActionsStyle,
  desktopCommunityTopStyle,
  desktopCommunityTopTitleStyle,
} from "./lib/painel-autor-desktop-header-style-utils";
import {
  topFilterButtonStyle,
  topFilterIconStyle,
  topSearchButtonStyle,
  topSearchInputStyle,
  topSearchShellStyle,
} from "./lib/painel-autor-top-controls-style-utils";
import {
  statCardStyle,
  statLabelStyle,
  statNumberStyle,
  statsBoxStyle,
  studioClearButtonStyle,
  studioControlsStyle,
} from "./lib/painel-autor-summary-style-utils";
import {
  criarFilterSheetOptionStyle,
  criarFilterSheetRadioStyle,
  desktopFilterSheetStyle,
  filterSheetClearDividerStyle,
  filterSheetClearStyle,
  filterSheetContentStyle,
  filterSheetHandleStyle,
  filterSheetOverlayStyle,
  filterSheetSectionLabelStyle,
  filterSheetStyle,
  filterSheetTitleStyle,
} from "./lib/painel-autor-filter-sheet-style-utils";
import {
  coverGlowStyle,
  coverLinkStyle,
  draftStatusStyle,
  publishedStatusStyle,
  statusRowStyle,
  workCardStyle,
  workContentStyle,
} from "./lib/painel-autor-work-card-layout-style-utils";
import {
  authorStyle,
  workCardCommentMetaStyle,
  workCardHeartMetaStyle,
  workMetaLineStyle,
  workTitleStyle,
} from "./lib/painel-autor-work-card-info-style-utils";
import {
  sheetStatHeartIconStyle,
  sheetStatIconStyle,
  sheetStatInlineStyle,
  sheetStatValueStyle,
  sheetStatsRowStyle,
} from "./lib/painel-autor-work-card-stats-style-utils";
import {
  actionsGridStyle,
  chapterButtonStyle,
  deleteButtonStyle,
  editButtonStyle,
  fileButtonStyle,
  openButtonStyle,
  readButtonStyle,
  shareButtonStyle,
  workCardDotsButtonStyle,
} from "./lib/painel-autor-work-actions-style-utils";
import {
  workActionSheetHandleStyle,
  workActionSheetHeaderStyle,
  workActionSheetOverlayStyle,
  workActionSheetStyle,
  workActionSheetTextBlockStyle,
  workActionSheetTitleStyle,
} from "./lib/painel-autor-work-action-sheet-style-utils";
import {
  desktopCardActionsGridStyle,
  desktopContainerStyle,
  desktopSheetStatsRowStyle,
  desktopStatsBoxStyle,
  desktopStudioControlsStyle,
  desktopWorkCardStyle,
  desktopWorkContentStyle,
} from "./lib/painel-autor-desktop-compositions-style-utils";
import {
  emptyMiniBoxStyle,
  emptyMiniButtonStyle,
  emptyMiniTextStyle,
  emptyMiniTitleStyle,
} from "./lib/painel-autor-empty-state-style-utils";
import {
  aplicarNomeProfileNasObrasPainel,
  obterNomeProfilePainelAutor,
} from "./lib/painel-autor-profile-utils";
import { carregarProfilePainelAutor } from "./lib/painel-autor-profile-loader";
import { PainelSecao } from "./components/painel-autor-section";
import {
  obraPublicadaComConteudoPainel,
  obterStatusPainelAutor,
} from "./lib/painel-autor-work-status-utils";
import {
  caminhoStoragePertenceAoUsuarioPainel,
  obterCaminhoStoragePainel,
} from "./lib/painel-autor-file-storage-path-utils";
import {
  criarHrefLeituraCapituloPainel,
  criarLoginHrefPainelAutor,
  criarPerfilAutorHref,
} from "./lib/painel-autor-route-utils";
import {
  FILTROS_PAINEL,
  ORDENACOES_PAINEL,
} from "./lib/painel-autor-filter-options";
import {
  carregarListaIdsPainel,
  lerStorageUsuarioPainel,
  lerListaIdsStoragePainel,
  normalizarListaIds,
  salvarColecaoAposExcluirPainel,
  salvarJsonStorageUsuarioPainel,
  salvarListaIdsUsuarioPainel,
} from "./lib/painel-autor-storage-utils";
import {
  filtrarListaPorObrasDoUsuario,
  removerObraDaColecaoPainel,
} from "./lib/painel-autor-collection-utils";
import {
  obterObrasComMetricasPainel,
  type ObraComMetricasPainel,
} from "./lib/painel-autor-work-metrics";
import { obterObrasFiltradasPainel } from "./lib/painel-autor-work-filtering";
import { obterResumoMetricasPainel } from "./lib/painel-autor-summary-metrics";
import { normalizarObraPainel } from "./lib/painel-autor-work-normalizer";
import { obterCapitulosPublicadosPainel } from "./lib/painel-autor-reading-progress-utils";
import { traduzirTextoPainelAutor } from "./lib/painel-autor-translations";
import { compartilharObraPainel } from "./lib/painel-autor-share-action";
import { abrirArquivoObraPainel } from "./lib/painel-autor-open-file-action";
import {
  removerArquivosStorageObraExcluidaPainel,
  type ArquivoStoragePainel,
} from "./lib/painel-autor-deleted-work-storage-cleanup";
import { removerReferenciasSupabaseObraExcluidaPainel } from "./lib/painel-autor-deleted-work-supabase-cleanup";
import { carregarCapitulosPainelAutorSupabase } from "./lib/painel-autor-supabase-chapters-loader";
import { carregarObrasPainelAutorSupabase } from "./lib/painel-autor-supabase-works-loader";
import { prepararEstadoMetricasPainel } from "./lib/painel-autor-metrics-state";
import { mesclarResultadoSupabasePainelAutor } from "./lib/painel-autor-supabase-result-merge";
import { carregarMetricasConteudos } from "../../lib/metricas";

type CapituloLocal = {
  id: string;
  titulo: string;
  texto: string;
  curtiu: boolean;
  salvo: boolean;
  comentario: string;
  criadoEm: string;
  lido: boolean;
  lidoEm: string;
  publicado?: boolean;
};

type ArquivoObraLocal = {
  nome: string;
  tipo: string;
  tamanho: number;
  conteudo: string;
  categoria: "texto" | "documento" | "imagem" | "outro";
  criadoEm: string;
};

type ObraLocal = {
  id: string;
  autorId?: string;
  titulo: string;
  autor: string;
  genero: string;
  formato: string;
  classificacaoIndicativa: string;
  sinopse: string;
  tags: string[];
  capa: string;
  capaNome: string;
  arquivoObra?: ArquivoObraLocal | null;
  publicado: boolean;
  capitulos: CapituloLocal[];
  criadaEm: string;
  ultimoCapituloLidoId: string;
  ultimaLeituraEm: string;
  progressoLeitura: number;
  visualizacoes: number;
  slug: string;
  link: string;
  totalCurtidasPainel?: number;
  totalComentariosPainel?: number;
  totalSalvosPainel?: number;
  totalLidosPainel?: number;
};


type ObraComMetricas = ObraComMetricasPainel<ObraLocal>;


const STORAGE_KEY = "historietas-obras";
const FOLLOW_STORAGE_KEY = "historietas-obras-seguidas";
const FAVORITES_STORAGE_KEY = "historietas-obras-favoritas";
const COMPLETED_STORAGE_KEY = "historietas-obras-concluidas";

function limparReferenciasLocaisObraExcluidaPainel(
  obra: Pick<ObraLocal, "id" | "slug" | "titulo"> &
    Partial<Pick<ObraLocal, "link">>,
  userId: string
) {
  [FOLLOW_STORAGE_KEY, FAVORITES_STORAGE_KEY, COMPLETED_STORAGE_KEY].forEach(
    (chave) => {
      try {
        const listaUsuario = removerObraDaColecaoPainel(
          lerListaIdsStoragePainel(chave, userId),
          obra
        );

        salvarJsonStorageUsuarioPainel(chave, userId, listaUsuario);
      } catch {
        // A limpeza local não pode impedir a exclusão da obra.
      }
    }
  );

  try {
    const backupAtual = carregarBackupArquivosObras(userId);

    obterChavesBackupArquivoPainel(obra).forEach((chave) => {
      delete backupAtual[chave];
    });

    salvarJsonStorageUsuarioPainel(
      FILE_BACKUP_STORAGE_KEY,
      userId,
      backupAtual
    );
  } catch {
    // O backup antigo não pode impedir a exclusão da obra.
  }
}

async function carregarPainelAutorSupabase(
  obrasLocais: ObraLocal[],
  obrasFavoritasLocais: string[],
  obrasConcluidasLocais: string[]
) {
  try {
    const { data: usuarioData } = await supabase.auth.getUser();
    const userId = usuarioData.user?.id || "";

    if (!userId) {
      return {
        obras: [],
        favoritas: [],
        concluidas: [],
      };
    }

    const profileAutor = await carregarProfilePainelAutor(userId);
    const nomeProfileAutor = obterNomeProfilePainelAutor(profileAutor);
    const obrasLocaisComDono = marcarObrasComDonoPainel(obrasLocais, userId);
    const obrasLocaisUsuario = aplicarNomeProfileNasObrasPainel(
      filtrarObrasDoUsuarioPainel(obrasLocaisComDono, userId),
      userId,
      nomeProfileAutor
    );
    const obrasFavoritasUsuario = filtrarListaPorObrasDoUsuario(
      obrasFavoritasLocais,
      obrasLocaisUsuario
    );
    const obrasConcluidasUsuario = filtrarListaPorObrasDoUsuario(
      obrasConcluidasLocais,
      obrasLocaisUsuario
    );

    const obrasSupabaseBanco = await carregarObrasPainelAutorSupabase(userId);
    const obraIds = obrasSupabaseBanco
      .map((obra) => obra.id)
      .filter((obraId) => Boolean(obraId));

    if (obraIds.length === 0) {
      return {
        obras: obrasLocaisUsuario,
        favoritas: obrasFavoritasUsuario,
        concluidas: obrasConcluidasUsuario,
      };
    }

    const capitulosSupabaseBanco = await carregarCapitulosPainelAutorSupabase(
      userId,
      obraIds
    );

    const capituloIds = capitulosSupabaseBanco
      .map((capitulo) => capitulo.id)
      .filter(Boolean);

    const [metricas, comentariosCapitulos] = await Promise.all([
      carregarMetricasConteudos({
        obraIds,
        capituloIds,
      }),
      carregarComentariosCapitulosUsuarioPainel(userId, capituloIds),
    ]);
    const { favoritosSupabase, concluidasSupabase, capitulosSalvos, capitulosCurtidos, progressoPorCapitulo, progressoCarregado, capitulosComMetricas } = prepararEstadoMetricasPainel(metricas);
    const obrasSupabase = obrasSupabaseBanco.map((obraBanco, index) => {
      const obraLocal = obrasLocaisUsuario.find((obraAtual) => {
        const slugLocal = obraAtual.slug || criarSlugBase(obraAtual.titulo);
        const slugBanco = obraBanco.slug?.trim() || criarSlugBase(obraBanco.titulo || "");

        return obraAtual.id === obraBanco.id || slugLocal === slugBanco;
      });

      const capitulosDaObra = capitulosSupabaseBanco.filter(
        (capitulo) => capitulo.obra_id === obraBanco.id
      );

      const obraNormalizada = converterObraSupabaseParaLocalPainel({
        obraBanco,
        capitulosBanco: capitulosDaObra,
        obraLocal,
        capitulosSalvos,
        capitulosCurtidos,
        progressoPorCapitulo,
        progressoCarregado,
        capitulosComMetricas,
        comentariosCapitulos,
        index,
      });

      const metrica = metricas.obras.get(obraBanco.id);

      return {
        ...obraNormalizada,
        totalCurtidasPainel: metrica?.audiencia.curtidoresUnicos || 0,
        totalComentariosPainel: metrica?.audiencia.comentaristasUnicos || 0,
        totalSalvosPainel: metrica?.audiencia.salvadoresUnicos || 0,
      };
    });

    return mesclarResultadoSupabasePainelAutor({ obrasLocaisUsuario, obrasSupabase, userId, nomeProfileAutor, obrasFavoritasUsuario, obrasConcluidasUsuario, favoritosSupabase, concluidasSupabase });
  } catch (error) {
    console.warn("Não consegui acessar o Supabase no Painel do Autor:", error);

    return {
      obras: obrasLocais,
      favoritas: normalizarListaIds(obrasFavoritasLocais),
      concluidas: normalizarListaIds(obrasConcluidasLocais),
    };
  }
}

export default function PainelAutorPage() {
  const router = useRouter();
  const { language } = useHistorietasLanguage();

  const [obras, setObras] = useState<ObraLocal[]>([]);
  const [obrasFavoritas, setObrasFavoritas] = useState<string[]>([]);
  const [obrasConcluidas, setObrasConcluidas] = useState<string[]>([]);
  const [carregandoDados, setCarregandoDados] = useState(true);
  const {
    busca,
    setBusca,
    buscaPainelAberta,
    setBuscaPainelAberta,
    filtro,
    setFiltro,
    ordenacao,
    setOrdenacao,
    mostrarFiltrosPainel,
    setMostrarFiltrosPainel,
    filtrosAtivos,
    limparFiltros,
  } = usePainelAutorFilterState();

  const { pageThemeStyle } = useHistorietasTheme(pageStyle);


  const isDesktop = usePainelAutorDesktopMode();

  const { usuarioIdLogado, verificandoUsuario } =
    usePainelAutorAuthSession();

  const { mostrarResumoPainel, alternarResumoPainel } =
    usePainelAutorSummaryPreference(usuarioIdLogado);

  usePainelAutorFiltersBodyLock(mostrarFiltrosPainel);

  useEffect(() => {
    if (!verificandoUsuario && !usuarioIdLogado) {
      router.replace(criarLoginHrefPainelAutor());
    }
  }, [router, usuarioIdLogado, verificandoUsuario]);

  useEffect(() => {
    if (verificandoUsuario || !usuarioIdLogado) {
      return;
    }

    let componenteAtivo = true;

    async function carregarDadosPainelAutor() {
      await Promise.resolve();

      if (!componenteAtivo) {
        return;
      }

      setCarregandoDados(true);

      try {
        const obrasSalvasTexto = lerStorageUsuarioPainel(
          STORAGE_KEY,
          usuarioIdLogado
        );
        const obrasSalvasJson: unknown = obrasSalvasTexto
          ? JSON.parse(obrasSalvasTexto)
          : [];

        const backupArquivosObras = carregarBackupArquivosObras(usuarioIdLogado);

        const obrasNormalizadas: ObraLocal[] = Array.isArray(obrasSalvasJson)
          ? obrasSalvasJson.map((obra, obraIndex) =>
              restaurarArquivoObraComBackup(
                normalizarObraPainel(obra, obraIndex),
                backupArquivosObras
              )
            )
          : [];
        const profileAutorPainel = await carregarProfilePainelAutor(usuarioIdLogado);
        const nomeProfileAutorPainel = obterNomeProfilePainelAutor(profileAutorPainel);
        const obrasNormalizadasComDono = marcarObrasComDonoPainel(
          obrasNormalizadas,
          usuarioIdLogado
        );
        const obrasUsuarioLogado = aplicarNomeProfileNasObrasPainel(
          filtrarObrasDoUsuarioPainel(obrasNormalizadasComDono, usuarioIdLogado),
          usuarioIdLogado,
          nomeProfileAutorPainel
        );

        const obrasFavoritasNormalizadas = carregarListaIdsPainel(
          FAVORITES_STORAGE_KEY,
          usuarioIdLogado
        );

        const obrasConcluidasNormalizadas = carregarListaIdsPainel(
          COMPLETED_STORAGE_KEY,
          usuarioIdLogado
        );

        const obrasFavoritasUsuario = filtrarListaPorObrasDoUsuario(
          obrasFavoritasNormalizadas,
          obrasUsuarioLogado
        );
        const obrasConcluidasUsuario = filtrarListaPorObrasDoUsuario(
          obrasConcluidasNormalizadas,
          obrasUsuarioLogado
        );

        if (!componenteAtivo) {
          return;
        }

        setObras(obrasUsuarioLogado);
        setObrasFavoritas(obrasFavoritasUsuario);
        setObrasConcluidas(obrasConcluidasUsuario);

        const dadosSupabase = await carregarPainelAutorSupabase(
          obrasUsuarioLogado,
          obrasFavoritasUsuario,
          obrasConcluidasUsuario
        );

        if (!componenteAtivo) {
          return;
        }

        const obrasFinais = dadosSupabase.obras.map((obra, index) =>
          normalizarObraPainel(obra, index)
        );

        sincronizarBackupArquivosObras(obrasFinais, usuarioIdLogado);
        salvarJsonStorageUsuarioPainel(STORAGE_KEY, usuarioIdLogado, obrasFinais);
        salvarListaIdsUsuarioPainel(
          FAVORITES_STORAGE_KEY,
          usuarioIdLogado,
          dadosSupabase.favoritas
        );
        salvarListaIdsUsuarioPainel(
          COMPLETED_STORAGE_KEY,
          usuarioIdLogado,
          dadosSupabase.concluidas
        );

        setObras(obrasFinais);
        setObrasFavoritas(dadosSupabase.favoritas);
        setObrasConcluidas(dadosSupabase.concluidas);
      } catch (error) {
        if (!componenteAtivo) {
          return;
        }

        console.warn("Não consegui atualizar o Painel do Autor:", error);
      } finally {
        if (componenteAtivo) {
          setCarregandoDados(false);
        }
      }
    }

    void carregarDadosPainelAutor();

    return () => {
      componenteAtivo = false;
    };
  }, [usuarioIdLogado, verificandoUsuario]);

  const obrasComMetricas = useMemo<ObraComMetricas[]>(
    () => obterObrasComMetricasPainel(obras),
    [obras]
  );

  const obrasFiltradas = useMemo<ObraComMetricas[]>(
    () =>
      obterObrasFiltradasPainel({
        obrasComMetricas,
        busca,
        filtro,
        ordenacao,
        obrasFavoritas,
        obrasConcluidas,
      }),
    [
      obrasComMetricas,
      busca,
      filtro,
      ordenacao,
      obrasFavoritas,
      obrasConcluidas,
    ]
  );

  const {
    obrasPublicadas,
    obrasRascunhos,
    totalCapitulos,
    totalCurtidas,
    totalComentarios,
    totalSalvos,
    totalArquivos,
  } = obterResumoMetricasPainel(obrasComMetricas);

  const usuarioLogado = Boolean(usuarioIdLogado);
  function abrirArquivoObra(obra: ObraLocal) {
    return abrirArquivoObraPainel(obra, language);
  }

  function compartilharObra(obra: ObraLocal) {
    return compartilharObraPainel(obra, language);
  }

  async function excluirObra(obraId: string, tituloObra: string) {
    const confirmar = window.confirm(
      traduzirTextoPainelAutor(
        `Tem certeza que deseja excluir a obra "${tituloObra}"? Todos os capítulos e registros dessa obra serão removidos. Essa ação não pode ser desfeita.`,
        language,
      ),
    );

    if (!confirmar) {
      return;
    }

    try {
      const { data: dadosUsuario, error: erroUsuario } =
        await supabase.auth.getUser();
      const userId = dadosUsuario.user?.id || usuarioIdLogado;

      if (erroUsuario || !userId) {
        router.replace(criarLoginHrefPainelAutor());
        return;
      }

      const obraExcluida = obras.find((obra) => obra.id === obraId) || {
        id: obraId,
        slug: criarSlugBase(tituloObra),
        titulo: tituloObra,
        link: `/obra/${criarSlugBase(tituloObra)}`,
        capa: "",
        arquivoObra: null,
        capitulos: [] as CapituloLocal[],
      };

      if (idObraSupabaseValido(obraId)) {
        const { data: obraEncontrada, error: erroAutorizacao } = await supabase
          .from("obras")
          .select("id,user_id,capa_url,arquivo_url")
          .eq("id", obraId)
          .limit(1)
          .maybeSingle();

        if (erroAutorizacao) {
          throw new Error(
            `Não consegui confirmar sua permissão para excluir esta obra: ${erroAutorizacao.message}`
          );
        }

        const obraStorage =
          obraEncontrada;

        /*
         * Uma obra local também pode possuir um ID no formato UUID.
         * Nesse caso, ela não existe em public.obras e deve ser removida
         * apenas do armazenamento local, sem gerar erro de permissão.
         */
        if (obraStorage?.id) {
          const donoObraId = normalizarIdUsuarioPainel(
            obraStorage.user_id || ""
          );
          const usuarioAtualId = normalizarIdUsuarioPainel(userId);

          if (!donoObraId || donoObraId !== usuarioAtualId) {
            window.alert(
              traduzirTextoPainelAutor(
                "Você não tem permissão para excluir esta obra.",
                language
              )
            );
            return;
          }

          const caminhoCapa = obterCaminhoStoragePainel(
            "capas-obras",
            obraStorage.capa_url?.trim() || obraExcluida.capa || ""
          );
          const caminhoArquivoObra = obterCaminhoStoragePainel(
            "arquivos-obras",
            obraStorage.arquivo_url?.trim() ||
              obraExcluida.arquivoObra?.conteudo ||
              ""
          );
          const arquivosStorageParaRemover: ArquivoStoragePainel[] = [
            {
              bucket: "capas-obras",
              caminho: caminhoStoragePertenceAoUsuarioPainel(
                caminhoCapa,
                userId
              )
                ? caminhoCapa
                : "",
            },
            {
              bucket: "arquivos-obras",
              caminho: caminhoStoragePertenceAoUsuarioPainel(
                caminhoArquivoObra,
                userId
              )
                ? caminhoArquivoObra
                : "",
            },
          ];

          await removerReferenciasSupabaseObraExcluidaPainel(
            userId,
            obraId,
            obraExcluida.capitulos.map((capitulo) => capitulo.id)
          );

          const { error: erroCapitulos } = await supabase
            .from("capitulos")
            .delete()
            .eq("obra_id", obraId)
            .eq("user_id", userId);

          if (erroCapitulos) {
            throw new Error(
              `Não consegui excluir os capítulos da obra: ${erroCapitulos.message}`
            );
          }

          const { data: obraRemovida, error: erroObra } = await supabase
            .from("obras")
            .delete()
            .eq("id", obraId)
            .eq("user_id", userId)
            .select("id")
            .maybeSingle();

          if (erroObra) {
            throw new Error(
              `Não consegui concluir a exclusão da obra: ${erroObra.message}`
            );
          }

          if (!obraRemovida?.id) {
            throw new Error(
              "A exclusão da obra não foi confirmada pelo banco de dados."
            );
          }

          await removerArquivosStorageObraExcluidaPainel(
            arquivosStorageParaRemover
          );
        }
      }

      const novasObras = obras.filter((obra) => obra.id !== obraId);
      const novasObrasFavoritas = removerObraDaColecaoPainel(
        obrasFavoritas,
        obraExcluida
      );
      const novasObrasConcluidas = removerObraDaColecaoPainel(
        obrasConcluidas,
        obraExcluida
      );

      limparReferenciasLocaisObraExcluidaPainel(obraExcluida, userId);
      salvarJsonStorageUsuarioPainel(STORAGE_KEY, userId, novasObras);
      salvarColecaoAposExcluirPainel(
        FAVORITES_STORAGE_KEY,
        userId,
        novasObrasFavoritas
      );
      salvarColecaoAposExcluirPainel(
        COMPLETED_STORAGE_KEY,
        userId,
        novasObrasConcluidas
      );

      setObras(novasObras);
      setObrasFavoritas(novasObrasFavoritas);
      setObrasConcluidas(novasObrasConcluidas);
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Não consegui excluir a obra agora.";

      console.warn(
        `Não consegui excluir a obra no Estúdio: ${mensagem}`
      );
      window.alert(traduzirTextoPainelAutor(mensagem, language));
    }
  }

  if (verificandoUsuario || !usuarioLogado || carregandoDados) {
    return (
      <main data-historietas-painel-autor-root="true" style={pageThemeStyle}>
        <style>{`${historietasThemeCss}${painelAutorPageCss}`}</style>
        <PainelAutorLanguageBridge />

        {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
        {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}

        <LoadingSpinner label="Carregando Painel do Autor" />
      </main>
    );
  }


  return (
    <main data-historietas-painel-autor-root="true" style={pageThemeStyle}>
      <style>{`${historietasThemeCss}${painelAutorPageCss}`}</style>
      <PainelAutorLanguageBridge />

      {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
      {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}

      <section style={isDesktop ? desktopContainerStyle : containerStyle}>
        {isDesktop ? (
          <header style={desktopCommunityTopStyle}>
            <h1 style={desktopCommunityTopTitleStyle}>Painel do autor</h1>

            <div style={desktopCommunityTopActionsStyle}>
              <label style={desktopCommunitySearchShellStyle}>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                  style={desktopCommunitySearchIconStyle}
                >
                  <circle
                    cx="10.85"
                    cy="10.85"
                    r="6.65"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M16.05 16.05L20.25 20.25"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>

                <input
                  value={busca}
                  onChange={(event) => setBusca(event.target.value)}
                  aria-label="Buscar obra..."
                  placeholder="Buscar obra..."
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  maxLength={90}
                  style={desktopCommunitySearchInputStyle}
                  type="text"
                />
              </label>

              <button
                type="button"
                onClick={() => setMostrarFiltrosPainel(true)}
                style={desktopCommunityFilterButtonStyle}
                aria-label="Abrir painel do autor"
              >
                <span>Filtros</span>
                <span aria-hidden="true">+</span>
              </button>
            </div>
          </header>
        ) : (
          <header style={topStyle}>
            <button
              type="button"
              onClick={() => setMostrarFiltrosPainel(true)}
              style={topFilterButtonStyle}
              aria-label="Abrir painel do autor"
            >
              <span>Painel do autor</span>
              <span style={topFilterIconStyle} aria-hidden="true">
                +
              </span>
            </button>

            {buscaPainelAberta ? (
              <>
                <label style={topSearchShellStyle}>
                  <input
                    value={busca}
                    onChange={(event) => setBusca(event.target.value)}
                    aria-label="Buscar obra..."
                  placeholder="Buscar obra..."
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    maxLength={90}
                    style={topSearchInputStyle}
                    type="text"
                    autoFocus
                  />
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setBusca("");
                    setBuscaPainelAberta(false);
                  }}
                  aria-label="Fechar busca"
                  aria-expanded="true"
                  style={topSearchButtonStyle}
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
              </>
            ) : (
              <button
                type="button"
                onClick={() => setBuscaPainelAberta(true)}
                aria-label="Abrir busca"
                aria-expanded="false"
                style={topSearchButtonStyle}
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
            )}
          </header>
        )}

        <section style={isDesktop ? desktopStudioControlsStyle : studioControlsStyle}>
          {mostrarResumoPainel && (
            <section style={isDesktop ? desktopStatsBoxStyle : statsBoxStyle}>
          <div style={statCardStyle}>
            <strong style={statNumberStyle}>{obrasComMetricas.length}</strong>
            <span style={statLabelStyle}>
              {obrasComMetricas.length === 1 ? "obra" : "obras"}
            </span>
          </div>

          <div style={statCardStyle}>
            <strong style={statNumberStyle}>{obrasPublicadas.length}</strong>
            <span style={statLabelStyle}>
              {obrasPublicadas.length === 1 ? "publicada" : "publicadas"}
            </span>
          </div>

          <div style={statCardStyle}>
            <strong style={statNumberStyle}>{obrasRascunhos.length}</strong>
            <span style={statLabelStyle}>
              {obrasRascunhos.length === 1 ? "rascunho" : "rascunhos"}
            </span>
          </div>

          <div style={statCardStyle}>
            <strong style={statNumberStyle}>{totalCapitulos}</strong>
            <span style={statLabelStyle}>
              {totalCapitulos === 1 ? "capítulo" : "capítulos"}
            </span>
          </div>


          <div style={statCardStyle}>
            <strong style={statNumberStyle}>{totalCurtidas}</strong>
            <span style={statLabelStyle}>
              {totalCurtidas === 1 ? "curtida" : "curtidas"}
            </span>
          </div>

          <div style={statCardStyle}>
            <strong style={statNumberStyle}>{totalComentarios}</strong>
            <span style={statLabelStyle}>
              {totalComentarios === 1 ? "comentário" : "comentários"}
            </span>
          </div>

          <div style={statCardStyle}>
            <strong style={statNumberStyle}>{totalSalvos}</strong>
            <span style={statLabelStyle}>
              {totalSalvos === 1 ? "salvo" : "salvos"}
            </span>
          </div>

          <div style={statCardStyle}>
            <strong style={statNumberStyle}>{totalArquivos}</strong>
            <span style={statLabelStyle}>
              {totalArquivos === 1 ? "arquivo" : "arquivos"}
            </span>
          </div>
            </section>
          )}

          {filtrosAtivos && (
            <button type="button" onClick={limparFiltros} style={studioClearButtonStyle}>
              Limpar filtros
            </button>
          )}
        </section>

        {mostrarFiltrosPainel && (
          <div
            style={filterSheetOverlayStyle}
            onClick={() => setMostrarFiltrosPainel(false)}
          >
            <section
              style={isDesktop ? desktopFilterSheetStyle : filterSheetStyle}
              onClick={(event) => event.stopPropagation()}
              aria-label="Painel do autor"
            >
              <span style={filterSheetHandleStyle} aria-hidden="true" />

              <h2 style={filterSheetTitleStyle}>Painel do autor</h2>

              <div style={filterSheetContentStyle}>
                <p style={filterSheetSectionLabelStyle}>MOSTRAR</p>

                {FILTROS_PAINEL.map((opcao) => {
                  const ativo = filtro === opcao.valor;

                  return (
                    <button
                      key={opcao.valor}
                      type="button"
                      onClick={() => {
                        setFiltro(opcao.valor);
                        setMostrarFiltrosPainel(false);
                      }}
                      style={criarFilterSheetOptionStyle(ativo)}
                    >
                      <span>{opcao.rotulo}</span>
                      <span
                        style={criarFilterSheetRadioStyle(ativo)}
                        aria-hidden="true"
                      >
                        {ativo ? "✓" : ""}
                      </span>
                    </button>
                  );
                })}

                <p style={filterSheetSectionLabelStyle}>ORDENAR</p>

                {ORDENACOES_PAINEL.map((opcao) => {
                  const ativo = ordenacao === opcao.valor;

                  return (
                    <button
                      key={opcao.valor}
                      type="button"
                      onClick={() => {
                        setOrdenacao(opcao.valor);
                        setMostrarFiltrosPainel(false);
                      }}
                      style={criarFilterSheetOptionStyle(ativo)}
                    >
                      <span>{opcao.rotulo}</span>
                      <span
                        style={criarFilterSheetRadioStyle(ativo)}
                        aria-hidden="true"
                      >
                        {ativo ? "✓" : ""}
                      </span>
                    </button>
                  );
                })}

                <p style={filterSheetSectionLabelStyle}>RESUMO</p>

                <button
                  type="button"
                  onClick={alternarResumoPainel}
                  style={criarFilterSheetOptionStyle(mostrarResumoPainel)}
                  aria-pressed={mostrarResumoPainel}
                >
                  <span>Mostrar os 8 mini cards</span>
                  <span
                    style={criarFilterSheetRadioStyle(mostrarResumoPainel)}
                    aria-hidden="true"
                  >
                    {mostrarResumoPainel ? "✓" : ""}
                  </span>
                </button>

                {filtrosAtivos && (
                  <>
                    <span style={filterSheetClearDividerStyle} aria-hidden="true" />

                    <button type="button" onClick={limparFiltros} style={filterSheetClearStyle}>
                      Limpar filtros
                    </button>
                  </>
                )}
              </div>
            </section>
          </div>
        )}

        {obrasComMetricas.length === 0 ? (
          <p
            style={{
              margin: "10px 0 0",
              color: "#FFFFFF",
              fontSize: "12px",
              fontWeight: 800,
              textAlign: "center",
            }}
          >
            Não tem obra criada
          </p>
        ) : obrasFiltradas.length === 0 ? (
          <section style={emptyMiniBoxStyle}>
            <strong style={emptyMiniTitleStyle}>Nenhuma obra encontrada</strong>
            <span style={emptyMiniTextStyle}>
              Ajuste a busca ou limpe os filtros para voltar a ver suas obras.
            </span>
            <button type="button" onClick={limparFiltros} style={emptyMiniButtonStyle}>
              Limpar filtros
            </button>
          </section>
        ) : (
          <PainelSecao<ObraComMetricas>
            obras={obrasFiltradas}
            isDesktop={isDesktop}
            onAbrirArquivo={abrirArquivoObra}
            onCompartilhar={compartilharObra}
            onExcluirObra={excluirObra}
            Card={ObraPainelCard}
          />
        )}
      </section>
    </main>
  );
}

function ObraPainelCard({
  obra,
  isDesktop,
  onAbrirArquivo,
  onCompartilhar,
  onExcluirObra,
}: {
  obra: ObraComMetricas;
  isDesktop: boolean;
  onAbrirArquivo: (obra: ObraComMetricas) => void | Promise<void>;
  onCompartilhar: (obra: ObraComMetricas) => void | Promise<void>;
  onExcluirObra: (obraId: string, tituloObra: string) => void | Promise<void>;
}) {
  const [acoesAbertas, setAcoesAbertas] = useState(false);
  const slugObraPainel = obra.slug?.trim() || criarSlugBase(obra.titulo);
  const linkObraPainel = obra.link?.trim();
  const obraHref = linkObraPainel || `/obra/${encodeURIComponent(slugObraPainel)}`;
  const editarHref = `/editar-obra?obraId=${obra.id}`;
  const capituloHref = `/adicionar-capitulo?obraId=${obra.id}`;
  const capitulosPublicados = obterCapitulosPublicadosPainel(obra.capitulos);
  const capituloParaContinuar = obra.ultimoCapituloLido;
  const capituloParaLer =
    capituloParaContinuar || capitulosPublicados[0] || null;
  const capituloParaEditar = obra.capitulos[0] || null;
  const editarCapituloHref = capituloParaEditar
    ? `/editar-capitulo?obraId=${obra.id}&capituloId=${capituloParaEditar.id}`
    : `/editar-capitulo?obraId=${obra.id}`;
  const indiceCapituloParaLer = capituloParaLer
    ? obra.capitulos.findIndex((capitulo) => capitulo.id === capituloParaLer.id)
    : -1;
  const numeroCapituloParaLer = indiceCapituloParaLer >= 0 ? indiceCapituloParaLer + 1 : 1;
  const leituraCapituloHref = capituloParaLer
    ? criarHrefLeituraCapituloPainel(obra, capituloParaLer, numeroCapituloParaLer)
    : "";
  const perfilAutorHref = criarPerfilAutorHref(obra.autor, obra.autorId, obra.autorId);
  const visualizacoesPainel = Math.max(0, obra.visualizacoes);
  const statusTexto = obterStatusPainelAutor(obra);
  const obraComStatusPublicado = obraPublicadaComConteudoPainel(obra);
  const obraTemCapitulos = obra.capitulos.length > 0;
  const indicadorPrimarioIcone = obraTemCapitulos ? "📚" : obra.arquivoObra ? "📄" : "📚";
  const indicadorPrimarioValor = obraTemCapitulos ? obra.capitulos.length : obra.arquivoObra ? 1 : 0;

  usePainelAutorWorkActionsBodyLock(acoesAbertas);

  return (
    <>
      <article style={isDesktop ? desktopWorkCardStyle : workCardStyle}>
        <Link
          href={obraHref}
          style={coverLinkStyle}
          aria-label={`Abrir ${obra.titulo}`}
        >
          <div
            style={
              isDesktop
                ? criarPainelCoverDesktopStyle(obra.capa)
                : criarPainelCoverStyle(obra.capa)
            }
          >
            <div style={coverGlowStyle} />

            <div style={statusRowStyle}>
              <span style={obraComStatusPublicado ? publishedStatusStyle : draftStatusStyle}>
                {statusTexto}
              </span>

            </div>

            <div style={isDesktop ? desktopWorkContentStyle : workContentStyle}>
              <h3 style={workTitleStyle}>{obra.titulo}</h3>

              <span style={workMetaLineStyle}>
                <span>👁 {visualizacoesPainel}</span>
                <span>
                  <span style={workCardHeartMetaStyle}>❤️</span>{" "}
                  {obra.totalCurtidas}
                </span>
                <span>
                  <span style={workCardCommentMetaStyle}>💬</span>{" "}
                  {obra.totalComentarios}
                </span>
                <span>
                  {indicadorPrimarioIcone} {indicadorPrimarioValor}
                </span>
              </span>
            </div>
          </div>
        </Link>

        <button
          type="button"
          onClick={() => setAcoesAbertas(true)}
          style={workCardDotsButtonStyle}
          aria-label={`Abrir opções de ${obra.titulo}`}
          aria-expanded={acoesAbertas}
        >
          ⋮
        </button>
      </article>

      {acoesAbertas && (
        <div
          style={workActionSheetOverlayStyle}
          role="presentation"
          onClick={() => setAcoesAbertas(false)}
        >
          <section
            style={workActionSheetStyle}
            role="dialog"
            aria-label={`Ações de ${obra.titulo}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={workActionSheetHandleStyle} aria-hidden="true" />

            <div style={workActionSheetHeaderStyle}>
              <div style={workActionSheetTextBlockStyle}>
                <strong style={workActionSheetTitleStyle}>{obra.titulo}</strong>

                <Link
                  href={perfilAutorHref}
                  onClick={() => setAcoesAbertas(false)}
                  style={authorStyle}
                >
                  Por {obra.autor}
                </Link>


              </div>
            </div>

            <div style={isDesktop ? desktopSheetStatsRowStyle : sheetStatsRowStyle}>
              <span style={sheetStatInlineStyle}>
                <span style={sheetStatIconStyle}>👁</span>
                <span style={sheetStatValueStyle}>{visualizacoesPainel}</span>
              </span>

              <span style={sheetStatInlineStyle}>
                <span style={sheetStatHeartIconStyle}>❤️</span>
                <span style={sheetStatValueStyle}>{obra.totalCurtidas}</span>
              </span>

              <span style={sheetStatInlineStyle}>
                <span style={sheetStatIconStyle}>💬</span>
                <span style={sheetStatValueStyle}>{obra.totalComentarios}</span>
              </span>

              <span style={sheetStatInlineStyle}>
                <span style={sheetStatIconStyle}>🔖</span>
                <span style={sheetStatValueStyle}>{obra.totalSalvos}</span>
              </span>

              <span style={sheetStatInlineStyle}>
                <span style={sheetStatIconStyle}>{indicadorPrimarioIcone}</span>
                <span style={sheetStatValueStyle}>{indicadorPrimarioValor}</span>
              </span>
            </div>

            <div style={isDesktop ? desktopCardActionsGridStyle : actionsGridStyle}>
              <Link
                href={editarCapituloHref}
                onClick={() => setAcoesAbertas(false)}
                style={openButtonStyle}
              >
                Editar capítulo
              </Link>

              {capituloParaLer && (
                <Link
                  href={leituraCapituloHref}
                  onClick={() => setAcoesAbertas(false)}
                  style={readButtonStyle}
                >
                  {capituloParaContinuar ? "Continuar leitura" : "Ler capítulo"}
                </Link>
              )}

              <Link
                href={editarHref}
                onClick={() => setAcoesAbertas(false)}
                style={editButtonStyle}
              >
                Editar obra
              </Link>

              <Link
                href={capituloHref}
                onClick={() => setAcoesAbertas(false)}
                style={chapterButtonStyle}
              >
                Adicionar capítulo
              </Link>


              {obra.arquivoObra && (
                <button
                  type="button"
                  onClick={() => {
                    setAcoesAbertas(false);
                    void onAbrirArquivo(obra);
                  }}
                  style={fileButtonStyle}
                >
                  Ver arquivo
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  void onCompartilhar(obra);
                  setAcoesAbertas(false);
                }}
                style={shareButtonStyle}
              >
                Compartilhar
              </button>

              <button
                type="button"
                onClick={() => {
                  setAcoesAbertas(false);
                  void onExcluirObra(obra.id, obra.titulo);
                }}
                style={deleteButtonStyle}
              >
                Excluir
              </button>
            </div>

          </section>
        </div>
      )}
    </>
  );
}
