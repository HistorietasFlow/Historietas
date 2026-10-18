"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { historietasThemeCss, useHistorietasTheme } from "../../lib/historietasTheme";
import { criarSlugBase, normalizarTexto } from "../../lib/utils";
import { ehClassificacao18 } from "../../lib/historietasAdultContent";
import { SeguindoLanguageBridge } from "./components/seguindo-language-bridge";
import { LoadingSpinner } from "./components/seguindo-loading-spinner";
import { useSeguindoAccessSync } from "./hooks/use-seguindo-access-sync";
import { useSeguindoContentTabNavigation } from "./hooks/use-seguindo-content-tab-navigation";
import { useSeguindoDataLoader } from "./hooks/use-seguindo-data-loader";
import { useSeguindoDataLoadTrigger } from "./hooks/use-seguindo-data-load-trigger";
import { useSeguindoDesktopMode } from "./hooks/use-seguindo-desktop-mode";
import { useSeguindoFollowerActions } from "./hooks/use-seguindo-follower-actions";
import { useSeguindoSortingSheetBodyLock } from "./hooks/use-seguindo-sorting-sheet-body-lock";
import { useSeguindoUserFollowActions } from "./hooks/use-seguindo-user-follow-actions";
import { useSeguindoUserSearchSync } from "./hooks/use-seguindo-user-search-sync";
import { useSeguindoWorkAuthorActions } from "./hooks/use-seguindo-work-author-actions";
import { seguindoPageCss } from "./lib/seguindo-page-css";
import { buscaSugestoesUsuariosEstaAtiva } from "./lib/seguindo-social-search-eligibility";
import { obterPermissoesListaSocial } from "./lib/seguindo-social-list-permissions";
import { obterRotulosListaSocial } from "./lib/seguindo-social-list-labels";
import type {
  ObraLocal,
  AutorSeguido,
  UsuarioSeguido,
  SolicitacaoSeguidor,
  AtividadeSeguindo,
  FiltroSeguindo,
  AbaSeguimentoPagina,
  OrdenacaoSeguindo,
  AbaConteudoSeguindo,
} from "./lib/seguindo-page-types";
import { authorNameStyle } from "./lib/seguindo-author-name-style";
import { desktopAuthorAvatarStyle, desktopAuthorFollowedCardStyle, desktopAuthorFollowedAvatarStyle } from "./lib/seguindo-desktop-author-avatar-styles";
import {
  desktopSocialTabsStyle,
  desktopSocialTabStyle,
  desktopSocialTabActiveStyle,
  desktopSectionHeaderTextStyle,
  desktopSectionTitleStyle,
  desktopSectionCounterStyle,
} from "./lib/seguindo-desktop-social-section-styles";
import {
  authorContentStyle,
  authorBadgeRowStyle,
  authorActionsGridStyle,
  desktopAuthorActionsGridStyle,
} from "./lib/seguindo-author-content-styles";
import { authorCardStyle, desktopAuthorCardStyle, authorAvatarStyle } from "./lib/seguindo-author-card-styles";
import { actionsStyle, readButtonStyle, unfollowButtonStyle } from "./lib/seguindo-card-action-styles";
import { cardTitleStyle, authorLinkStyle } from "./lib/seguindo-card-title-link-styles";
import {
  badgeRowStyle,
  classificationBadgeStyle,
  authorWorksMetaStyle,
  authorReadingMetaStyle,
} from "./lib/seguindo-card-badges-styles";
import {
  overlayStyle,
  genreStyle,
  contentStyle,
  desktopContentStyle,
} from "./lib/seguindo-card-overlay-styles";
import {
  cardStyle,
  desktopCardStyle,
  coverStyle,
  desktopCoverStyle,
} from "./lib/seguindo-card-base-styles";
import {
  gridStyle,
  desktopGridStyle,
  authorsGridStyle,
  desktopAuthorsGridStyle,
} from "./lib/seguindo-grid-layout-styles";
import {
  sectionStyle,
  desktopSectionStyle,
  sectionHeaderStyle,
  desktopSectionHeaderStyle,
  sectionHeaderTextStyle,
  sectionTitleStyle,
  sectionCounterStyle,
} from "./lib/seguindo-section-header-styles";
import {
  sortingHandleStyle,
  sortingTitleStyle,
  sortingOptionsListStyle,
  sortingOptionStyle,
  sortingOptionActiveStyle,
  sortingOptionRadioStyle,
  sortingOptionRadioActiveStyle,
} from "./lib/seguindo-sorting-controls-styles";
import {
  sortingBackdropStyle,
  sortingSheetStyle,
  desktopSortingSheetStyle,
} from "./lib/seguindo-sorting-sheet-base-styles";
import {
  seguindoHeaderSearchShellStyle,
  desktopSeguindoHeaderSearchShellStyle,
  seguindoHeaderSearchInputStyle,
} from "./lib/seguindo-search-shell-styles";
import {
  socialToolbarStyle,
  desktopSocialToolbarStyle,
  socialTabsStyle,
  socialTabStyle,
  socialTabActiveStyle,
  mobileThreeSocialTabStyle,
  socialTabCountStyle,
  mobileThreeSocialTabCountStyle,
} from "./lib/seguindo-social-toolbar-styles";
import {
  suggestedUserFollowButtonStyle,
  suggestedUserRequestPendingButtonStyle,
  followRequestContentStyle,
  followRequestActionsStyle,
  followRequestAcceptButtonStyle,
  followRequestDeclineButtonStyle,
} from "./lib/seguindo-suggested-user-action-styles";
import { suggestedUsersLoadingStyle, suggestedUserInfoStyle, suggestedUserNameStyle, suggestedUserHandleStyle } from "./lib/seguindo-suggested-user-text-styles";
import { seguindoHeaderFilterIconStyle } from "./lib/seguindo-header-icon-style";
import { seguindoSearchToggleStyle, seguindoHeaderFilterButtonStyle, desktopSeguindoHeaderFilterButtonStyle } from "./lib/seguindo-header-controls-styles";
import { desktopSeguindoHeaderSearchIconStyle, desktopSeguindoHeaderSearchInputStyle } from "./lib/seguindo-header-search-styles";
import { desktopSeguindoHeaderActionsStyle, desktopSeguindoHeaderTitleStyle } from "./lib/seguindo-header-typography-styles";
import { desktopSeguindoHeaderStyle, seguindoHeaderStyle } from "./lib/seguindo-header-base-styles";
import { containerStyle, desktopContainerStyle, pageStyle } from "./lib/seguindo-layout-styles";
import {
  desktopTopWaterFadeStyle,
  mobileTopWaterFadeStyle,
} from "./lib/seguindo-surface-styles";
import { obraEstaNaLista } from "./lib/seguindo-work-collection-utils";
import {
  formatarGeneroSeguindo,
  normalizarNomeAutor,
} from "./lib/seguindo-format-utils";
import {
  criarAvatarUsuarioSeguindoStyle,
  criarCoverStyle,
} from "./lib/seguindo-image-style-utils";
import {
  calcularProgressoLeitura,
  obraEmLeitura,
  obterTotalComentariosObraSeguindo,
  obterTotalCurtidasObraSeguindo,
  obterTotalLidosObraSeguindo,
  obterTotalSalvosObraSeguindo,
} from "./lib/seguindo-work-metrics-utils";
import {
  dataAtividadeObra,
  mostrarClassificacao,
  textoBuscaObra,
} from "./lib/seguindo-work-presentation-utils";
import {
  criarHrefPerfilAutorSeguindo,
  criarHrefPerfilUsuarioSeguindo,
} from "./lib/seguindo-route-utils";

export default function SeguindoPage() {
  const router = useRouter();
  const [obras, setObras] = useState<ObraLocal[]>([]);
  const [obrasSeguidas, setObrasSeguidas] = useState<string[]>([]);
  const [autoresSeguidos, setAutoresSeguidos] = useState<string[]>([]);
  const [usuariosSeguidos, setUsuariosSeguidos] = useState<UsuarioSeguido[]>([]);
  const [usuariosSeguidores, setUsuariosSeguidores] = useState<UsuarioSeguido[]>([]);
  const [solicitacoesSeguidores, setSolicitacoesSeguidores] = useState<
    SolicitacaoSeguidor[]
  >([]);
  const [solicitacoesEnviadasIds, setSolicitacoesEnviadasIds] = useState<
    string[]
  >([]);
  const [solicitacaoRespondendoId, setSolicitacaoRespondendoId] = useState<
    string | null
  >(null);
  const [usuarioListaAlterandoId, setUsuarioListaAlterandoId] = useState<
    string | null
  >(null);
  const [, setAtividadesSeguindo] = useState<AtividadeSeguindo[]>([]);
  const [obrasFavoritas, setObrasFavoritas] = useState<string[]>([]);
  const [obrasConcluidas, setObrasConcluidas] = useState<string[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [buscaSeguindoAberta, setBuscaSeguindoAberta] = useState(false);
  const [usuariosSugestoesBusca, setUsuariosSugestoesBusca] = useState<
    UsuarioSeguido[]
  >([]);
  const [carregandoUsuariosSugestoes, setCarregandoUsuariosSugestoes] =
    useState(false);
  const [usuarioSugestaoSeguindoId, setUsuarioSugestaoSeguindoId] =
    useState<string | null>(null);
  const [filtro, setFiltro] = useState<FiltroSeguindo>("todos");
  const [ordenacao, setOrdenacao] =
    useState<OrdenacaoSeguindo>("padrao");
  const [abaConteudo, setAbaConteudo] =
    useState<AbaConteudoSeguindo>("obras");
  const [mostrarPainelOrdenacao, setMostrarPainelOrdenacao] = useState(false);
  const isDesktop = useSeguindoDesktopMode();
  const [verificandoAcesso, setVerificandoAcesso] = useState(true);
  const [usuarioLogadoId, setUsuarioLogadoId] = useState("");
  const [, setAbaSeguimento] =
    useState<AbaSeguimentoPagina>("seguindo");
  const [perfilSocialId, setPerfilSocialId] = useState("");
  const [perfilSocialNome, setPerfilSocialNome] = useState("");
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);

  useSeguindoSortingSheetBodyLock(mostrarPainelOrdenacao);

  useSeguindoAccessSync({
    setUsuarioLogadoId,
    setAbaSeguimento,
    setAbaConteudo,
    setPerfilSocialId,
    setPerfilSocialNome,
    setVerificandoAcesso,
  });



  const carregarDadosSeguindo = useSeguindoDataLoader({
    perfilSocialId,
    usuarioLogadoId,
    setObras,
    setObrasSeguidas,
    setAutoresSeguidos,
    setUsuariosSeguidos,
    setUsuariosSeguidores,
    setSolicitacoesSeguidores,
    setSolicitacoesEnviadasIds,
    setAtividadesSeguindo,
    setObrasFavoritas,
    setObrasConcluidas,
    setCarregando,
  });


  useSeguindoDataLoadTrigger({
    usuarioLogadoId,
    carregarDadosSeguindo,
  });

  const {
    removerSeguidorUsuario,
    responderSolicitacaoSeguidor,
  } = useSeguindoFollowerActions({
    usuarioLogadoId,
    usuarioListaAlterandoId,
    solicitacaoRespondendoId,
    setUsuarioListaAlterandoId,
    setSolicitacaoRespondendoId,
    setUsuariosSeguidores,
    setSolicitacoesSeguidores,
  });

  const {
    deixarDeSeguirUsuario,
    seguirUsuarioSugestao,
  } = useSeguindoUserFollowActions({
    usuarioLogadoId,
    usuarioListaAlterandoId,
    usuarioSugestaoSeguindoId,
    solicitacoesEnviadasIds,
    setUsuarioListaAlterandoId,
    setUsuarioSugestaoSeguindoId,
    setUsuariosSeguidos,
    setAtividadesSeguindo,
    setSolicitacoesEnviadasIds,
    setUsuariosSugestoesBusca,
  });

  const {
    deixarDeSeguirObra,
    deixarDeSeguirAutor,
  } = useSeguindoWorkAuthorActions({
    usuarioLogadoId,
    obrasSeguidas,
    autoresSeguidos,
    setObrasSeguidas,
    setAutoresSeguidos,
  });

  const termoBusca = normalizarTexto(busca);
  const listaSocialEhDoUsuarioLogado = Boolean(
    usuarioLogadoId && (!perfilSocialId || perfilSocialId === usuarioLogadoId),
  );
  const visualizandoListaSocialDoPerfil = Boolean(
    perfilSocialId && perfilSocialId !== usuarioLogadoId,
  );
  const trocarAbaConteudo = useSeguindoContentTabNavigation({
    perfilSocialId,
    perfilSocialNome,
    usuarioLogadoId,
    visualizandoListaSocialDoPerfil,
    setAbaConteudo,
    setAbaSeguimento,
    setBusca,
    setFiltro,
    setOrdenacao,
  });
  const buscaSugestoesUsuariosAtiva = buscaSugestoesUsuariosEstaAtiva(
    buscaSeguindoAberta,
    termoBusca,
    visualizandoListaSocialDoPerfil,
    abaConteudo,
  );
  const usuariosBaseSocial =
    abaConteudo === "seguidores" ? usuariosSeguidores : usuariosSeguidos;
  const { descricaoListaSocial } = obterRotulosListaSocial(
    abaConteudo,
    perfilSocialNome,
  );
  const { podeRemoverUsuariosDaLista, podeRemoverSeguidoresDaLista } =
    obterPermissoesListaSocial(listaSocialEhDoUsuarioLogado, abaConteudo);

  useSeguindoUserSearchSync({
    busca,
    buscaSugestoesUsuariosAtiva,
    usuarioLogadoId,
    usuariosSeguidos,
    setUsuariosSugestoesBusca,
    setCarregandoUsuariosSugestoes,
  });


  const obrasVisiveisSeguindo = useMemo(() => {
    return obras.filter(
      (obra) => !ehClassificacao18(obra.classificacaoIndicativa),
    );
  }, [obras]);

  const obrasSeguidasBase = useMemo(() => {
    return obrasVisiveisSeguindo.filter((obra) =>
      obraEstaNaLista(obra, obrasSeguidas),
    );
  }, [obrasVisiveisSeguindo, obrasSeguidas]);

  const autoresBase = useMemo<AutorSeguido[]>(() => {
    const mapa = new Map<string, { nome: string; obras: ObraLocal[] }>();

    obrasVisiveisSeguindo.forEach((obra) => {
      const nomeAutor = obra.autor.trim() || "Autor não informado";
      const chaveAutor = normalizarNomeAutor(nomeAutor);

      if (!autoresSeguidos.includes(chaveAutor)) {
        return;
      }

      const autorExistente = mapa.get(chaveAutor);

      if (autorExistente) {
        mapa.set(chaveAutor, {
          ...autorExistente,
          obras: [...autorExistente.obras, obra],
        });

        return;
      }

      mapa.set(chaveAutor, {
        nome: nomeAutor,
        obras: [obra],
      });
    });

    return Array.from(mapa.entries())
      .map(([chave, grupoAutor]) => {
        const obrasDoAutor = grupoAutor.obras;

        const totalCapitulos = obrasDoAutor.reduce(
          (total, obra) => total + obra.capitulos.length,
          0
        );

        const totalCurtidas = obrasDoAutor.reduce((total, obra) => {
          return total + obterTotalCurtidasObraSeguindo(obra);
        }, 0);

        const totalComentarios = obrasDoAutor.reduce((total, obra) => {
          return total + obterTotalComentariosObraSeguindo(obra);
        }, 0);

        const totalSalvos = obrasDoAutor.reduce((total, obra) => {
          return total + obterTotalSalvosObraSeguindo(obra);
        }, 0);

        const totalFavoritas = obrasDoAutor.filter((obra) =>
          obraEstaNaLista(obra, obrasFavoritas)
        ).length;

        const totalConcluidas = obrasDoAutor.filter((obra) =>
          obraEstaNaLista(obra, obrasConcluidas)
        ).length;

        const totalComClassificacao = obrasDoAutor.filter((obra) =>
          mostrarClassificacao(obra)
        ).length;

        const totalLidos = obrasDoAutor.reduce((total, obra) => {
          return total + obterTotalLidosObraSeguindo(obra);
        }, 0);

        const totalEmLeitura = obrasDoAutor.filter((obra) =>
          obraEmLeitura(obra)
        ).length;

        const progressoMedio =
          obrasDoAutor.length > 0
            ? Math.round(
                obrasDoAutor.reduce((total, obra) => {
                  return total + calcularProgressoLeitura(obra.capitulos);
                }, 0) / obrasDoAutor.length
              )
            : 0;

        return {
          chave,
          nome: grupoAutor.nome,
          autorId:
            obrasDoAutor.find((obra) => Boolean(obra.autorId?.trim()))
              ?.autorId?.trim() || "",
          obras: obrasDoAutor,
          totalCapitulos,
          totalPublicadas: obrasDoAutor.filter((obra) => obra.publicado).length,
          totalRascunhos: obrasDoAutor.filter((obra) => !obra.publicado).length,
          totalCurtidas,
          totalComentarios,
          totalSalvos,
          totalFavoritas,
          totalConcluidas,
          totalComClassificacao,
          totalLidos,
          totalEmLeitura,
          progressoMedio,
        };
      })
      .sort((autorA, autorB) => autorA.nome.localeCompare(autorB.nome));
  }, [
    obrasVisiveisSeguindo,
    autoresSeguidos,
    obrasFavoritas,
    obrasConcluidas,
  ]);

  const obrasFiltradas = useMemo(() => {
    if (abaConteudo !== "obras") {
      return [] as ObraLocal[];
    }

    const filtradas = obrasSeguidasBase.filter((obra) => {
      if (filtro === "autores" || filtro === "usuarios") {
        return false;
      }

      const passaBusca = termoBusca
        ? textoBuscaObra(obra).includes(termoBusca)
        : true;

      const passaFiltro =
        filtro === "todos" ||
        filtro === "obras" ||
        (filtro === "em-leitura" && obraEmLeitura(obra)) ||
        (filtro === "favoritas" && obraEstaNaLista(obra, obrasFavoritas)) ||
        (filtro === "concluidas" && obraEstaNaLista(obra, obrasConcluidas));

      return passaBusca && passaFiltro;
    });

    return [...filtradas].sort((obraA, obraB) => {
      if (ordenacao === "titulo") {
        return obraA.titulo.localeCompare(obraB.titulo);
      }

      if (ordenacao === "progresso") {
        return (
          calcularProgressoLeitura(obraB.capitulos) -
          calcularProgressoLeitura(obraA.capitulos)
        );
      }

      if (ordenacao === "capitulos") {
        return obraB.capitulos.length - obraA.capitulos.length;
      }

      if (ordenacao === "antigos") {
        return dataAtividadeObra(obraA) - dataAtividadeObra(obraB);
      }

      return dataAtividadeObra(obraB) - dataAtividadeObra(obraA);
    });
  }, [
    obrasSeguidasBase,
    termoBusca,
    filtro,
    ordenacao,
    obrasFavoritas,
    obrasConcluidas,
    abaConteudo,
  ]);

  const autoresFiltrados = useMemo<AutorSeguido[]>(() => {
    if (visualizandoListaSocialDoPerfil || abaConteudo !== "pessoas") {
      return [] as AutorSeguido[];
    }

    const filtrados = autoresBase.filter((autor) => {
      if (filtro === "obras" || filtro === "usuarios") {
        return false;
      }

      const textoAutor = normalizarTexto(
        [
          autor.nome,
          autor.obras.map((obra) => obra.titulo).join(" "),
          autor.obras.map((obra) => obra.genero).join(" "),
          autor.obras.map((obra) => formatarGeneroSeguindo(obra.genero)).join(" "),
          autor.obras.map((obra) => obra.tags.join(" ")).join(" "),
        ].join(" ")
      );

      const passaBusca = termoBusca ? textoAutor.includes(termoBusca) : true;

      const passaFiltro =
        filtro === "todos" ||
        filtro === "autores" ||
        (filtro === "em-leitura" && autor.totalEmLeitura > 0) ||
        (filtro === "favoritas" && autor.totalFavoritas > 0) ||
        (filtro === "concluidas" && autor.totalConcluidas > 0);

      return passaBusca && passaFiltro;
    });

    return [...filtrados].sort((autorA, autorB) => {
      if (ordenacao === "progresso") {
        return autorB.progressoMedio - autorA.progressoMedio;
      }

      if (ordenacao === "capitulos") {
        return autorB.totalCapitulos - autorA.totalCapitulos;
      }

      return autorA.nome.localeCompare(autorB.nome);
    });
  }, [autoresBase, termoBusca, filtro, ordenacao, abaConteudo, visualizandoListaSocialDoPerfil]);

  const usuariosFiltrados = useMemo<UsuarioSeguido[]>(() => {
    const filtrados = usuariosBaseSocial.filter((usuarioSeguido) => {
      if (
        abaConteudo !== "pessoas" &&
        abaConteudo !== "seguidores"
      ) {
        return false;
      }

      if (
        !visualizandoListaSocialDoPerfil &&
        filtro !== "todos" &&
        filtro !== "usuarios"
      ) {
        return false;
      }

      const textoUsuario = normalizarTexto(
        [usuarioSeguido.nome, usuarioSeguido.handle, usuarioSeguido.bio].join(" ")
      );

      return termoBusca ? textoUsuario.includes(termoBusca) : true;
    });

    return [...filtrados].sort((usuarioA, usuarioB) => {
      if (ordenacao === "titulo") {
        return usuarioA.nome.localeCompare(usuarioB.nome);
      }

      if (ordenacao === "antigos") {
        return (
          new Date(usuarioA.criadoEm).getTime() -
          new Date(usuarioB.criadoEm).getTime()
        );
      }

      return (
        new Date(usuarioB.criadoEm).getTime() - new Date(usuarioA.criadoEm).getTime()
      );
    });
  }, [usuariosBaseSocial, termoBusca, filtro, ordenacao, abaConteudo, visualizandoListaSocialDoPerfil]);

  const solicitacoesSeguidoresFiltradas = useMemo(() => {
    if (!listaSocialEhDoUsuarioLogado || abaConteudo !== "seguidores") {
      return [] as SolicitacaoSeguidor[];
    }

    const filtradas = solicitacoesSeguidores.filter((solicitacao) => {
      if (!termoBusca) {
        return true;
      }

      const textoSolicitacao = normalizarTexto(
        [
          solicitacao.usuario.nome,
          solicitacao.usuario.handle,
          solicitacao.usuario.bio,
        ].join(" "),
      );

      return textoSolicitacao.includes(termoBusca);
    });

    return [...filtradas].sort(
      (solicitacaoA, solicitacaoB) =>
        new Date(solicitacaoB.criadoEm).getTime() -
        new Date(solicitacaoA.criadoEm).getTime(),
    );
  }, [
    abaConteudo,
    listaSocialEhDoUsuarioLogado,
    solicitacoesSeguidores,
    termoBusca,
  ]);

  const totalDisponivelGeral =
    obrasSeguidasBase.length +
    usuariosSeguidos.length +
    usuariosSeguidores.length +
    solicitacoesSeguidores.length +
    (visualizandoListaSocialDoPerfil ? 0 : autoresBase.length);

  const totalSemFiltros =
    abaConteudo === "seguidores"
      ? usuariosSeguidores.length +
        (listaSocialEhDoUsuarioLogado ? solicitacoesSeguidores.length : 0)
      : abaConteudo === "obras"
        ? obrasSeguidasBase.length
        : usuariosSeguidos.length +
          (visualizandoListaSocialDoPerfil ? 0 : autoresBase.length);

  const totalSeguindo =
    abaConteudo === "seguidores"
      ? usuariosFiltrados.length + solicitacoesSeguidoresFiltradas.length
      : abaConteudo === "obras"
        ? obrasFiltradas.length
        : usuariosFiltrados.length +
          (visualizandoListaSocialDoPerfil ? 0 : autoresFiltrados.length);


  const opcoesOrdenacao: Array<{ valor: OrdenacaoSeguindo; rotulo: string }> =
    abaConteudo === "obras"
      ? [
          { valor: "padrao", rotulo: "Padrão" },
          { valor: "recentes", rotulo: "Mais recentes" },
          { valor: "antigos", rotulo: "Mais antigos" },
          { valor: "titulo", rotulo: "A-Z" },
          { valor: "progresso", rotulo: "Maior progresso" },
          { valor: "capitulos", rotulo: "Mais capítulos" },
        ]
      : [
          { valor: "padrao", rotulo: "Padrão" },
          { valor: "recentes", rotulo: "Mais recentes" },
          { valor: "antigos", rotulo: "Mais antigos" },
          { valor: "titulo", rotulo: "A-Z" },
        ];







  if (verificandoAcesso || carregando) {
    return (
      <main data-historietas-seguindo-root="true" style={pageThemeStyle}>
        <style>{`${historietasThemeCss}${seguindoPageCss}`}</style>
        <SeguindoLanguageBridge />

        {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}

        {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}

        <LoadingSpinner label="Carregando seguindo" />
      </main>
    );
  }

  return (
    <main data-historietas-seguindo-root="true" style={pageThemeStyle}>
      <style>{`${historietasThemeCss}${seguindoPageCss}`}</style>
      <SeguindoLanguageBridge />

      {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}

      {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}

      <section style={isDesktop ? desktopContainerStyle : containerStyle}>
        {isDesktop ? (
          <header style={desktopSeguindoHeaderStyle}>
            <h1 style={desktopSeguindoHeaderTitleStyle}>Seguindo</h1>

            <div style={desktopSeguindoHeaderActionsStyle}>
              <label style={desktopSeguindoHeaderSearchShellStyle}>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                  style={desktopSeguindoHeaderSearchIconStyle}
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
                  aria-label={
                    visualizandoListaSocialDoPerfil
                      ? `Pesquisar em ${descricaoListaSocial}`
                      : abaConteudo === "seguidores"
                        ? "Pesquisar seguidor ou perfil"
                        : abaConteudo === "obras"
                          ? "Pesquisar obra, autor, gênero ou tag"
                          : "Pesquisar pessoa, autor ou perfil"
                  }
                  placeholder={
                    visualizandoListaSocialDoPerfil
                      ? `Pesquisar em ${descricaoListaSocial}`
                      : abaConteudo === "seguidores"
                        ? "Pesquisar seguidor ou perfil"
                        : abaConteudo === "obras"
                          ? "Pesquisar obra, autor, gênero ou tag"
                          : "Pesquisar pessoa, autor ou perfil"
                  }
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  maxLength={90}
                  style={desktopSeguindoHeaderSearchInputStyle}
                  type="text"
                />
              </label>

              <button
                type="button"
                onClick={() => setMostrarPainelOrdenacao(true)}
                style={desktopSeguindoHeaderFilterButtonStyle}
                aria-label="Abrir classificação de Seguindo"
              >
                <span>Filtros</span>
                <span aria-hidden="true">+</span>
              </button>
            </div>
          </header>
        ) : (
          <header style={seguindoHeaderStyle}>
            <button
              type="button"
              onClick={() => setMostrarPainelOrdenacao(true)}
              style={seguindoHeaderFilterButtonStyle}
              aria-label="Abrir classificação de Seguindo"
            >
              <span>Seguindo</span>
              <span style={seguindoHeaderFilterIconStyle} aria-hidden="true">
                +
              </span>
            </button>

            {buscaSeguindoAberta ? (
              <>
                <label style={seguindoHeaderSearchShellStyle}>
                  <input
                    value={busca}
                    onChange={(event) => setBusca(event.target.value)}
                    aria-label={
                      visualizandoListaSocialDoPerfil
                        ? `Pesquisar em ${descricaoListaSocial}`
                        : abaConteudo === "seguidores"
                          ? "Pesquisar seguidor ou perfil"
                          : abaConteudo === "obras"
                            ? "Pesquisar obra, autor, gênero ou tag"
                            : "Pesquisar pessoa, autor ou perfil"
                    }
                    placeholder={
                      visualizandoListaSocialDoPerfil
                        ? `Pesquisar em ${descricaoListaSocial}`
                        : abaConteudo === "seguidores"
                          ? "Pesquisar seguidor ou perfil"
                          : abaConteudo === "obras"
                            ? "Pesquisar obra, autor, gênero ou tag"
                            : "Pesquisar pessoa, autor ou perfil"
                    }
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    maxLength={90}
                    style={seguindoHeaderSearchInputStyle}
                    type="text"
                    autoFocus
                  />
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setBusca("");
                    setBuscaSeguindoAberta(false);
                  }}
                  aria-label="Fechar busca"
                  aria-expanded="true"
                  style={seguindoSearchToggleStyle}
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
                onClick={() => setBuscaSeguindoAberta(true)}
                aria-label="Abrir busca"
                aria-expanded="false"
                style={seguindoSearchToggleStyle}
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

        {totalDisponivelGeral > 0 && (
          <>
            <section style={isDesktop ? desktopSocialToolbarStyle : socialToolbarStyle}>
              <div
                style={
                  isDesktop
                    ? desktopSocialTabsStyle
                    : {
                        ...socialTabsStyle,
                        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                      }
                }
              >
                <>
                  <button
                    type="button"
                    onClick={() => trocarAbaConteudo("seguidores")}
                    style={{
                      ...(abaConteudo === "seguidores"
                        ? socialTabActiveStyle
                        : socialTabStyle),
                      ...(isDesktop
                        ? abaConteudo === "seguidores"
                          ? desktopSocialTabActiveStyle
                          : desktopSocialTabStyle
                        : mobileThreeSocialTabStyle),
                    }}
                  >
                    Seguidores
                    <span style={isDesktop ? socialTabCountStyle : mobileThreeSocialTabCountStyle}>
                      {usuariosSeguidores.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => trocarAbaConteudo("obras")}
                    style={{
                      ...(abaConteudo === "obras"
                        ? socialTabActiveStyle
                        : socialTabStyle),
                      ...(isDesktop
                        ? abaConteudo === "obras"
                          ? desktopSocialTabActiveStyle
                          : desktopSocialTabStyle
                        : mobileThreeSocialTabStyle),
                    }}
                  >
                    Obras seguidas
                    <span style={isDesktop ? socialTabCountStyle : mobileThreeSocialTabCountStyle}>
                      {obrasSeguidasBase.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => trocarAbaConteudo("pessoas")}
                    style={{
                      ...(abaConteudo === "pessoas"
                        ? socialTabActiveStyle
                        : socialTabStyle),
                      ...(isDesktop
                        ? abaConteudo === "pessoas"
                          ? desktopSocialTabActiveStyle
                          : desktopSocialTabStyle
                        : mobileThreeSocialTabStyle),
                    }}
                  >
                    Pessoas seguidas
                    <span style={isDesktop ? socialTabCountStyle : mobileThreeSocialTabCountStyle}>
                      {usuariosSeguidos.length}
                    </span>
                  </button>
                </>
              </div>

            </section>

            {mostrarPainelOrdenacao && (
              <div
                style={sortingBackdropStyle}
                onClick={() => setMostrarPainelOrdenacao(false)}
              >
                <div
                  style={isDesktop ? desktopSortingSheetStyle : sortingSheetStyle}
                  onClick={(event) => event.stopPropagation()}
                >
                  <span style={sortingHandleStyle} />

                  <h2 style={sortingTitleStyle}>Classificar por</h2>

                  <div style={sortingOptionsListStyle}>
                    {opcoesOrdenacao.map((opcao) => {
                      const ativo = ordenacao === opcao.valor;

                      return (
                        <button
                          key={opcao.valor}
                          type="button"
                          onClick={() => {
                            setOrdenacao(opcao.valor);
                            setMostrarPainelOrdenacao(false);
                          }}
                          style={
                            ativo ? sortingOptionActiveStyle : sortingOptionStyle
                          }
                        >
                          <span>{opcao.rotulo}</span>

                          <span
                            style={
                              ativo
                                ? sortingOptionRadioActiveStyle
                                : sortingOptionRadioStyle
                            }
                          >
                            {ativo ? "✓" : ""}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {totalSemFiltros === 0 && !buscaSugestoesUsuariosAtiva ? (
          <p
            style={{
              margin: "10px 0 0",
              color: "#FFFFFF",
              fontSize: "12px",
              fontWeight: 800,
              textAlign: "center",
            }}
          >
            {abaConteudo === "seguidores"
              ? visualizandoListaSocialDoPerfil
                ? "Nenhum seguidor ainda"
                : "Você ainda não tem seguidores"
              : abaConteudo === "obras"
                ? "Nenhuma obra seguida ainda"
                : visualizandoListaSocialDoPerfil
                  ? "Nenhum perfil seguido ainda"
                  : "Você ainda não segue nada"}
          </p>
        ) : (
          <>
            {totalSeguindo === 0 &&
              !carregandoUsuariosSugestoes &&
              usuariosSugestoesBusca.length === 0 && (
              <p
                style={{
                  margin: "10px 0 0",
                  color: "#FFFFFF",
                  fontSize: "12px",
                  fontWeight: 800,
                  textAlign: "center",
                }}
              >
                Nada encontrado
              </p>
            )}

            {abaConteudo === "obras" && (
              <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
              {obrasFiltradas.length === 0 ? (
                <p
                  style={{
                    margin: "10px 0 0",
                    color: "#FFFFFF",
                    fontSize: "12px",
                    fontWeight: 800,
                    textAlign: "center",
                  }}
                >
                  Nenhuma obra seguida encontrada
                </p>
              ) : (
                <div style={isDesktop ? desktopGridStyle : gridStyle}>
                  {obrasFiltradas.map((obra) => {
                    const obraHref =
                      obra.link ||
                      `/obra/${obra.slug || criarSlugBase(obra.titulo)}`;

                    return (
                      <article key={obra.id} style={isDesktop ? desktopCardStyle : cardStyle}>
                        <div style={criarCoverStyle(obra.capa, isDesktop ? desktopCoverStyle : coverStyle)}>
                          <div style={overlayStyle} />

                        </div>

                        <div style={isDesktop ? desktopContentStyle : contentStyle}>
                          <div style={badgeRowStyle}>
                            <span style={genreStyle}>
                              {obra.formato || "Obra"}
                            </span>

                            <span style={genreStyle}>
                              {formatarGeneroSeguindo(obra.genero)}
                            </span>

                            {mostrarClassificacao(obra) && (
                              <span style={classificationBadgeStyle}>
                                {obra.classificacaoIndicativa}
                              </span>
                            )}

                          </div>

                          <h3 data-historietas-i18n-ignore="true" style={cardTitleStyle}>{obra.titulo}</h3>

                          <Link
                            href={criarHrefPerfilAutorSeguindo(
                              obra.autor,
                              obra.autorId
                            )}
                            style={authorLinkStyle}
                          >
                            Por <span data-historietas-i18n-ignore="true">{obra.autor}</span>
                          </Link>

                          <div
                            style={{
                              ...actionsStyle,
                              gridTemplateColumns:
                                visualizandoListaSocialDoPerfil
                                  ? "minmax(0, 1fr)"
                                  : "minmax(0, 1fr) auto",
                              alignItems: "stretch",
                              marginTop: isDesktop ? "auto" : undefined,
                            }}
                          >
                            <Link
                              href={obraHref}
                              style={{
                                ...readButtonStyle,
                                width: "100%",
                                minHeight: isDesktop ? "32px" : "28px",
                              }}
                            >
                              Ver obra
                            </Link>

                            {!visualizandoListaSocialDoPerfil && (
                              <button
                                type="button"
                                onClick={() => deixarDeSeguirObra(obra)}
                                style={{
                                  ...unfollowButtonStyle,
                                  minWidth: isDesktop ? "112px" : "104px",
                                  minHeight: isDesktop ? "32px" : "28px",
                                }}
                              >
                                Deixar de seguir
                              </button>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
              </section>
            )}

            {abaConteudo === "seguidores" &&
              listaSocialEhDoUsuarioLogado &&
              solicitacoesSeguidoresFiltradas.length > 0 && (
                <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
                  <div
                    style={
                      isDesktop
                        ? desktopSectionHeaderStyle
                        : sectionHeaderStyle
                    }
                  >
                    <div style={isDesktop ? desktopSectionHeaderTextStyle : sectionHeaderTextStyle}>
                      <h2 style={isDesktop ? desktopSectionTitleStyle : sectionTitleStyle}>
                        SOLICITAÇÕES PARA SEGUIR
                      </h2>
                    </div>

                    <span style={isDesktop ? desktopSectionCounterStyle : sectionCounterStyle}>
                      {solicitacoesSeguidoresFiltradas.length}
                    </span>
                  </div>

                  <div
                    style={isDesktop ? desktopAuthorsGridStyle : authorsGridStyle}
                  >
                    {solicitacoesSeguidoresFiltradas.map((solicitacao) => {
                      const usuarioSolicitante = solicitacao.usuario;
                      const hrefPerfilUsuario =
                        criarHrefPerfilUsuarioSeguindo(usuarioSolicitante);
                      const respondendo =
                        solicitacaoRespondendoId === solicitacao.id;

                      return (
                        <article
                          key={solicitacao.id}
                          style={{
                            ...(isDesktop
                              ? desktopAuthorCardStyle
                              : authorCardStyle),
                            gridTemplateColumns: isDesktop
                              ? "58px minmax(0, 1fr)"
                              : "52px minmax(0, 1fr)",
                            gap: isDesktop ? "10px" : "7px",
                            width: isDesktop ? "100%" : "102%",
                            margin: isDesktop ? 0 : "0 auto",
                            padding: isDesktop
                              ? "11px"
                              : "6px 8px 6px 0",
                            borderRadius: isDesktop ? "20px" : 0,
                            background: isDesktop
                              ? "var(--historietas-seguindo-panel, rgba(4, 0, 10, 0.72))"
                              : "transparent",
                            border: isDesktop
                              ? "1px solid rgba(255,255,255,0.06)"
                              : "none",
                            boxShadow: "none",
                          }}
                        >
                          <Link
                            href={hrefPerfilUsuario}
                            aria-label={`Abrir perfil de ${usuarioSolicitante.nome}`}
                            style={{
                              ...criarAvatarUsuarioSeguindoStyle(
                                usuarioSolicitante.avatar,
                                authorAvatarStyle,
                              ),
                              ...(isDesktop ? desktopAuthorAvatarStyle : {}),
                              width: isDesktop ? "58px" : "52px",
                              height: isDesktop ? "58px" : "52px",
                              borderRadius: isDesktop ? "17px" : "16px",
                              fontSize: isDesktop ? "25px" : "22px",
                            }}
                          >
                            {!usuarioSolicitante.avatar &&
                              usuarioSolicitante.nome
                                .slice(0, 1)
                                .toUpperCase()}
                          </Link>

                          <div style={followRequestContentStyle}>
                            <div style={suggestedUserInfoStyle}>
                              <Link
                                href={hrefPerfilUsuario}
                                data-historietas-i18n-ignore="true"
                                style={suggestedUserNameStyle}
                              >
                                {usuarioSolicitante.nome}
                              </Link>

                              <span
                                data-historietas-i18n-ignore="true"
                                style={suggestedUserHandleStyle}
                              >
                                {usuarioSolicitante.handle}
                              </span>
                            </div>

                            <div
                              aria-label="Responder solicitação"
                              style={followRequestActionsStyle}
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  void responderSolicitacaoSeguidor(
                                    solicitacao,
                                    true,
                                  )
                                }
                                disabled={respondendo}
                                style={{
                                  ...followRequestAcceptButtonStyle,
                                  opacity: respondendo ? 0.58 : 1,
                                  cursor: respondendo
                                    ? "not-allowed"
                                    : "pointer",
                                }}
                              >
                                {respondendo ? "..." : "Aceitar"}
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  void responderSolicitacaoSeguidor(
                                    solicitacao,
                                    false,
                                  )
                                }
                                disabled={respondendo}
                                style={{
                                  ...followRequestDeclineButtonStyle,
                                  opacity: respondendo ? 0.58 : 1,
                                  cursor: respondendo
                                    ? "not-allowed"
                                    : "pointer",
                                }}
                              >
                                {respondendo ? "..." : "Recusar"}
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              )}

            {(abaConteudo === "pessoas" ||
              abaConteudo === "seguidores") &&
              usuariosFiltrados.length > 0 && (
              <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
                <div style={isDesktop ? desktopAuthorsGridStyle : authorsGridStyle}>
                  {usuariosFiltrados.map((usuarioSeguido) => {
                    const hrefPerfilUsuario = criarHrefPerfilUsuarioSeguindo(usuarioSeguido);

                    return (
                      <article
                        key={usuarioSeguido.id}
                        role="link"
                        tabIndex={0}
                        aria-label={`Abrir perfil de ${usuarioSeguido.nome}`}
                        onClick={() => router.push(hrefPerfilUsuario)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            router.push(hrefPerfilUsuario);
                          }
                        }}
                        style={{
                          ...(isDesktop ? desktopAuthorCardStyle : authorCardStyle),
                          gridTemplateColumns: isDesktop
                            ? "58px minmax(0, 1fr)"
                            : "52px minmax(0, 1fr)",
                          gap: isDesktop ? "7px" : "6px",
                          width: isDesktop ? "100%" : "102%",
                          margin: isDesktop ? 0 : "0 auto",
                          padding: isDesktop ? "11px" : "4px 7px 4px 0",
                          borderRadius: isDesktop ? "20px" : 0,
                          background: isDesktop
                            ? "var(--historietas-seguindo-panel, rgba(4, 0, 10, 0.72))"
                            : "transparent",
                          border: isDesktop
                            ? "1px solid rgba(255,255,255,0.06)"
                            : "none",
                          boxShadow: "none",
                          cursor: "pointer",
                        }}
                      >
                        <div
                          style={{
                            ...criarAvatarUsuarioSeguindoStyle(
                              usuarioSeguido.avatar,
                              authorAvatarStyle,
                            ),
                            ...(isDesktop ? desktopAuthorAvatarStyle : {}),
                            width: isDesktop ? "58px" : "52px",
                            height: isDesktop ? "58px" : "52px",
                            borderRadius: isDesktop ? "17px" : "16px",
                            fontSize: isDesktop ? "25px" : "22px",
                          }}
                        >
                          {!usuarioSeguido.avatar && usuarioSeguido.nome.slice(0, 1).toUpperCase()}
                        </div>

                        <div
                          style={{
                            ...authorContentStyle,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: isDesktop ? "10px" : "7px",
                            minWidth: 0,
                          }}
                        >
                          <div
                            style={{
                              display: "grid",
                              gap: "2px",
                              minWidth: 0,
                              flex: "1 1 auto",
                            }}
                          >
                            <h3
                              data-historietas-i18n-ignore="true"
                              style={{
                                ...authorNameStyle,
                                fontSize: isDesktop ? "17px" : "15px",
                                lineHeight: 1.05,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {usuarioSeguido.nome}
                            </h3>

                            <span
                              data-historietas-i18n-ignore="true"
                              style={{
                                ...authorLinkStyle,
                                fontSize: isDesktop ? "11px" : "10px",
                                lineHeight: 1,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {usuarioSeguido.handle}
                            </span>
                          </div>

                          {(podeRemoverUsuariosDaLista ||
                            podeRemoverSeguidoresDaLista) && (
                            <button
                              type="button"
                              disabled={
                                usuarioListaAlterandoId === usuarioSeguido.id
                              }
                              onClick={(event) => {
                                event.stopPropagation();

                                if (podeRemoverSeguidoresDaLista) {
                                  void removerSeguidorUsuario(usuarioSeguido.id);
                                  return;
                                }

                                void deixarDeSeguirUsuario(usuarioSeguido.id);
                              }}
                              onKeyDown={(event) => event.stopPropagation()}
                              style={{
                                ...unfollowButtonStyle,
                                width: isDesktop ? "112px" : "92px",
                                minWidth: isDesktop ? "112px" : "92px",
                                minHeight: "25px",
                                padding: "0 3px",
                                fontSize: "9px",
                                flex: "0 0 auto",
                                opacity:
                                  usuarioListaAlterandoId === usuarioSeguido.id
                                    ? 0.58
                                    : 1,
                                cursor:
                                  usuarioListaAlterandoId === usuarioSeguido.id
                                    ? "not-allowed"
                                    : "pointer",
                              }}
                            >
                              {usuarioListaAlterandoId === usuarioSeguido.id
                                ? "..."
                                : podeRemoverSeguidoresDaLista
                                  ? "Remover seguidor"
                                  : "Deixar de seguir"}
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            )}

            {buscaSugestoesUsuariosAtiva && (
              <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
                <div style={isDesktop ? desktopSectionHeaderStyle : sectionHeaderStyle}>
                  <div style={isDesktop ? desktopSectionHeaderTextStyle : sectionHeaderTextStyle}>
                    <h2 style={isDesktop ? desktopSectionTitleStyle : sectionTitleStyle}>SUGESTÕES PARA SEGUIR</h2>
                  </div>

                  <span style={isDesktop ? desktopSectionCounterStyle : sectionCounterStyle}>
                    {carregandoUsuariosSugestoes
                      ? "..."
                      : usuariosSugestoesBusca.length}
                  </span>
                </div>

                {carregandoUsuariosSugestoes ? (
                  <div style={suggestedUsersLoadingStyle}>
                    <LoadingSpinner
                      compacto
                      label="Carregando sugestões para seguir"
                    />
                  </div>
                ) : usuariosSugestoesBusca.length > 0 ? (
                  <div style={isDesktop ? desktopAuthorsGridStyle : authorsGridStyle}>
                    {usuariosSugestoesBusca.map((usuarioSugestao) => {
                      const hrefPerfil = criarHrefPerfilUsuarioSeguindo(
                        usuarioSugestao
                      );
                      const seguindoAgora =
                        usuarioSugestaoSeguindoId === usuarioSugestao.id;
                      const solicitacaoPendente =
                        solicitacoesEnviadasIds.includes(usuarioSugestao.id);

                      return (
                        <article
                          key={usuarioSugestao.id}
                          style={{
                            ...(isDesktop ? desktopAuthorCardStyle : authorCardStyle),
                            gridTemplateColumns: isDesktop
                              ? "58px minmax(0, 1fr) auto"
                              : "52px minmax(0, 1fr) auto",
                            gap: isDesktop ? "10px" : "7px",
                            width: isDesktop ? "100%" : "102%",
                            margin: isDesktop ? 0 : "0 auto",
                            padding: isDesktop ? "11px" : "4px 7px 4px 0",
                            borderRadius: isDesktop ? "20px" : 0,
                            background: isDesktop
                              ? "var(--historietas-seguindo-panel, rgba(4, 0, 10, 0.72))"
                              : "transparent",
                            border: isDesktop
                              ? "1px solid rgba(255,255,255,0.06)"
                              : "none",
                            boxShadow: "none",
                          }}
                        >
                          <Link
                            href={hrefPerfil}
                            aria-label={`Abrir perfil de ${usuarioSugestao.nome}`}
                            style={{
                              ...criarAvatarUsuarioSeguindoStyle(
                                usuarioSugestao.avatar,
                                authorAvatarStyle,
                              ),
                              ...(isDesktop ? desktopAuthorAvatarStyle : {}),
                              width: isDesktop ? "58px" : "52px",
                              height: isDesktop ? "58px" : "52px",
                              borderRadius: isDesktop ? "17px" : "16px",
                              fontSize: isDesktop ? "25px" : "22px",
                            }}
                          >
                            {!usuarioSugestao.avatar &&
                              usuarioSugestao.nome.slice(0, 1).toUpperCase()}
                          </Link>

                          <div style={suggestedUserInfoStyle}>
                            <Link
                              href={hrefPerfil}
                              data-historietas-i18n-ignore="true"
                              style={suggestedUserNameStyle}
                            >
                              {usuarioSugestao.nome}
                            </Link>

                            <span data-historietas-i18n-ignore="true" style={suggestedUserHandleStyle}>
                              {usuarioSugestao.handle}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              seguirUsuarioSugestao(usuarioSugestao)
                            }
                            disabled={seguindoAgora}
                            style={{
                              ...(solicitacaoPendente
                                ? suggestedUserRequestPendingButtonStyle
                                : suggestedUserFollowButtonStyle),
                              opacity: seguindoAgora ? 0.58 : 1,
                              cursor: seguindoAgora ? "not-allowed" : "pointer",
                            }}
                          >
                            {seguindoAgora
                              ? "..."
                              : solicitacaoPendente
                                ? "Cancelar"
                                : "Seguir"}
                          </button>
                        </article>
                      );
                    })}
                  </div>
                ) : null}
              </section>
            )}

            {!visualizandoListaSocialDoPerfil && abaConteudo === "pessoas" && autoresFiltrados.length > 0 && (
              <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
                <div style={isDesktop ? desktopSectionHeaderStyle : sectionHeaderStyle}>
                  <div style={isDesktop ? desktopSectionHeaderTextStyle : sectionHeaderTextStyle}>
                    <h2 style={isDesktop ? desktopSectionTitleStyle : sectionTitleStyle}>AUTORES SEGUIDOS</h2>
                  </div>

                  <span style={isDesktop ? desktopSectionCounterStyle : sectionCounterStyle}>
                    {autoresFiltrados.length}
                  </span>
                </div>

                <div style={isDesktop ? desktopAuthorsGridStyle : authorsGridStyle}>
                  {autoresFiltrados.map((autor) => (
                    <article
                      key={autor.chave}
                      style={
                        isDesktop
                          ? desktopAuthorFollowedCardStyle
                          : authorCardStyle
                      }
                    >
                      <div
                        style={
                          isDesktop
                            ? desktopAuthorFollowedAvatarStyle
                            : authorAvatarStyle
                        }
                      >
                        {autor.nome.slice(0, 1).toUpperCase()}
                      </div>

                      <div style={authorContentStyle}>
                        <div style={authorBadgeRowStyle}>
                          <span style={authorWorksMetaStyle}>
                            {autor.obras.length} {" "}
                            {autor.obras.length === 1 ? "obra" : "obras"}
                          </span>

                          {autor.totalEmLeitura > 0 && (
                            <span style={authorReadingMetaStyle}>
                              {autor.totalEmLeitura} em leitura
                            </span>
                          )}
                        </div>

                        <h3 data-historietas-i18n-ignore="true" style={authorNameStyle}>{autor.nome}</h3>

                        <div style={actionsStyle}>
                          <div style={isDesktop ? desktopAuthorActionsGridStyle : authorActionsGridStyle}>
                            <Link
                              href={criarHrefPerfilAutorSeguindo(
                                autor.nome,
                                autor.autorId
                              )}
                              style={readButtonStyle}
                            >
                              Abrir perfil
                            </Link>

                            <button
                              type="button"
                              onClick={() => deixarDeSeguirAutor(autor.chave)}
                              style={unfollowButtonStyle}
                            >
                              Deixar de seguir
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </section>
    </main>
  );
}

