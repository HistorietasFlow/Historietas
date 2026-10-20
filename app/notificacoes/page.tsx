"use client";

import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase/client";
import { useHistorietasTheme } from "../../lib/historietasTheme";
import { acessoConteudo18Confirmado } from "../../lib/historietasAdultContent";
import {
  filtrarEOrdenarNotificacoes,
  notificacaoEhCapitulo,
  type FiltroNotificacao,
  type OrdenacaoNotificacao,
} from "./lib/notificacoes-filter-utils";
import { useNotificacoes } from "../../components/NotificacoesProvider";
import { idObraSupabaseValido, normalizarTexto } from "../../lib/utils";
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
  criarLoginHrefNotificacoes,
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
import { carregarNotificacoesProblemasTecnicosSupabase } from "./lib/notificacoes-supabase-technical-issues-loader";
import { carregarNotificacoesDiretasSupabase } from "./lib/notificacoes-supabase-direct-loader";
import { carregarNotificacoesDiarioSupabase } from "./lib/notificacoes-supabase-diary-loader";
import { carregarNotificacoesComunidadeSupabase } from "./lib/notificacoes-supabase-community-loader";

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
