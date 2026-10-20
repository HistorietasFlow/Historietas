"use client";

import Link from "next/link";
import { useState } from "react";
import { historietasThemeCss, useHistorietasTheme } from "../../lib/historietasTheme";
import { criarSlugBase, normalizarTexto } from "../../lib/utils";
import { SeguindoLanguageBridge } from "./components/seguindo-language-bridge";
import { LoadingSpinner } from "./components/seguindo-loading-spinner";
import { SeguindoHeader } from "./components/seguindo-header";
import { SeguindoEmptyState } from "./components/seguindo-empty-state";
import { SeguindoFollowRequestCard } from "./components/seguindo-follow-request-card";
import { SeguindoSectionHeader } from "./components/seguindo-section-header";
import { SeguindoSocialToolbar } from "./components/seguindo-social-toolbar";
import { SeguindoSocialUserCard } from "./components/seguindo-social-user-card";
import { SeguindoSortingPanel } from "./components/seguindo-sorting-panel";
import { SeguindoSuggestedUserCard } from "./components/seguindo-suggested-user-card";
import { useSeguindoAccessSync } from "./hooks/use-seguindo-access-sync";
import { useSeguindoContentTabNavigation } from "./hooks/use-seguindo-content-tab-navigation";
import { useSeguindoDataLoader } from "./hooks/use-seguindo-data-loader";
import { useSeguindoDataLoadTrigger } from "./hooks/use-seguindo-data-load-trigger";
import { useSeguindoDesktopMode } from "./hooks/use-seguindo-desktop-mode";
import { useSeguindoReadingStatusState } from "./hooks/use-seguindo-reading-status-state";
import { useSeguindoRequestActionState } from "./hooks/use-seguindo-request-action-state";
import { useSeguindoSuggestionState } from "./hooks/use-seguindo-suggestion-state";
import { useSeguindoFollowTabState } from "./hooks/use-seguindo-follow-tab-state";
import { useSeguindoAccessState } from "./hooks/use-seguindo-access-state";
import { useSeguindoProfileContextState } from "./hooks/use-seguindo-profile-context-state";
import { useSeguindoSortingPanelState } from "./hooks/use-seguindo-sorting-panel-state";
import { useSeguindoContentTabState } from "./hooks/use-seguindo-content-tab-state";
import { useSeguindoFilterSortState } from "./hooks/use-seguindo-filter-sort-state";
import { useSeguindoSearchState } from "./hooks/use-seguindo-search-state";
import { useSeguindoFilteredFollowerRequests } from "./hooks/use-seguindo-filtered-follower-requests";
import { useSeguindoFilteredUsers } from "./hooks/use-seguindo-filtered-users";
import { useSeguindoFilteredAuthors } from "./hooks/use-seguindo-filtered-authors";
import { useSeguindoFilteredWorks } from "./hooks/use-seguindo-filtered-works";
import { useSeguindoAuthorsBase } from "./hooks/use-seguindo-authors-base";
import { useSeguindoVisibleWorks } from "./hooks/use-seguindo-visible-works";
import { useSeguindoFollowerActions } from "./hooks/use-seguindo-follower-actions";
import { useSeguindoSortingSheetBodyLock } from "./hooks/use-seguindo-sorting-sheet-body-lock";
import { useSeguindoUserFollowActions } from "./hooks/use-seguindo-user-follow-actions";
import { useSeguindoUserSearchSync } from "./hooks/use-seguindo-user-search-sync";
import { useSeguindoWorkAuthorActions } from "./hooks/use-seguindo-work-author-actions";
import { seguindoPageCss } from "./lib/seguindo-page-css";
import { calcularTotaisSeguindo } from "./lib/seguindo-list-counts";
import { obterOpcoesOrdenacaoSeguindo } from "./lib/seguindo-sort-options";
import { selecionarUsuariosBaseSocial } from "./lib/seguindo-social-users-selector";
import { obterContextoListaSocial } from "./lib/seguindo-social-list-context";
import { buscaSugestoesUsuariosEstaAtiva } from "./lib/seguindo-social-search-eligibility";
import { obterPermissoesListaSocial } from "./lib/seguindo-social-list-permissions";
import { obterRotulosListaSocial } from "./lib/seguindo-social-list-labels";
import type {
  ObraLocal,
  UsuarioSeguido,
  SolicitacaoSeguidor,
  AtividadeSeguindo,
} from "./lib/seguindo-page-types";
import { authorNameStyle } from "./lib/seguindo-author-name-style";
import {
  desktopAuthorFollowedCardStyle,
  desktopAuthorFollowedAvatarStyle,
} from "./lib/seguindo-desktop-author-avatar-styles";
import {
  authorContentStyle,
  authorBadgeRowStyle,
  authorActionsGridStyle,
  desktopAuthorActionsGridStyle,
} from "./lib/seguindo-author-content-styles";
import { authorAvatarStyle, authorCardStyle } from "./lib/seguindo-author-card-styles";
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
} from "./lib/seguindo-section-header-styles";
import { suggestedUsersLoadingStyle } from "./lib/seguindo-suggested-user-text-styles";
import { containerStyle, desktopContainerStyle, pageStyle } from "./lib/seguindo-layout-styles";
import {
  desktopTopWaterFadeStyle,
  mobileTopWaterFadeStyle,
} from "./lib/seguindo-surface-styles";
import {
  formatarGeneroSeguindo,
} from "./lib/seguindo-format-utils";
import { criarCoverStyle } from "./lib/seguindo-image-style-utils";
import {
  mostrarClassificacao,
} from "./lib/seguindo-work-presentation-utils";
import { criarHrefPerfilAutorSeguindo } from "./lib/seguindo-route-utils";

export default function SeguindoPage() {
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
  const {
    solicitacaoRespondendoId, setSolicitacaoRespondendoId,
    usuarioListaAlterandoId, setUsuarioListaAlterandoId,
  } = useSeguindoRequestActionState();
  const [, setAtividadesSeguindo] = useState<AtividadeSeguindo[]>([]);
  const { obrasFavoritas, setObrasFavoritas, obrasConcluidas, setObrasConcluidas } = useSeguindoReadingStatusState();
  const [carregando, setCarregando] = useState(true);
  const { busca, setBusca, buscaSeguindoAberta, setBuscaSeguindoAberta } = useSeguindoSearchState();
  const {
    usuariosSugestoesBusca, setUsuariosSugestoesBusca,
    carregandoUsuariosSugestoes, setCarregandoUsuariosSugestoes,
    usuarioSugestaoSeguindoId, setUsuarioSugestaoSeguindoId,
  } = useSeguindoSuggestionState();
  const { filtro, setFiltro, ordenacao, setOrdenacao } = useSeguindoFilterSortState();
  const { abaConteudo, setAbaConteudo } = useSeguindoContentTabState();
  const { mostrarPainelOrdenacao, setMostrarPainelOrdenacao } = useSeguindoSortingPanelState();
  const isDesktop = useSeguindoDesktopMode();
  const { verificandoAcesso, setVerificandoAcesso, usuarioLogadoId, setUsuarioLogadoId } = useSeguindoAccessState();
  const { setAbaSeguimento } = useSeguindoFollowTabState();
  const { perfilSocialId, setPerfilSocialId, perfilSocialNome, setPerfilSocialNome } = useSeguindoProfileContextState();
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
  const { listaSocialEhDoUsuarioLogado, visualizandoListaSocialDoPerfil } =
    obterContextoListaSocial(usuarioLogadoId, perfilSocialId);
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
  const usuariosBaseSocial = selecionarUsuariosBaseSocial(
    abaConteudo,
    usuariosSeguidores,
    usuariosSeguidos,
  );
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


  const { obrasVisiveisSeguindo, obrasSeguidasBase } =
    useSeguindoVisibleWorks(obras, obrasSeguidas);

  const autoresBase = useSeguindoAuthorsBase(
    obrasVisiveisSeguindo, autoresSeguidos, obrasFavoritas, obrasConcluidas,
  );

  const obrasFiltradas = useSeguindoFilteredWorks(
    obrasSeguidasBase, termoBusca, filtro, ordenacao, obrasFavoritas, obrasConcluidas, abaConteudo,
  );

  const autoresFiltrados = useSeguindoFilteredAuthors(
    autoresBase, termoBusca, filtro, ordenacao, abaConteudo, visualizandoListaSocialDoPerfil,
  );

  const usuariosFiltrados = useSeguindoFilteredUsers(
    usuariosBaseSocial, termoBusca, filtro, ordenacao, abaConteudo, visualizandoListaSocialDoPerfil,
  );

  const solicitacoesSeguidoresFiltradas = useSeguindoFilteredFollowerRequests(
    abaConteudo, listaSocialEhDoUsuarioLogado, solicitacoesSeguidores, termoBusca,
  );

  const { totalDisponivelGeral, totalSemFiltros, totalSeguindo } = calcularTotaisSeguindo({
    abaConteudo,
    listaSocialEhDoUsuarioLogado,
    visualizandoListaSocialDoPerfil,
    obrasSeguidasBase,
    usuariosSeguidos,
    usuariosSeguidores,
    solicitacoesSeguidores,
    autoresBase,
    usuariosFiltrados,
    solicitacoesSeguidoresFiltradas,
    obrasFiltradas,
    autoresFiltrados,
  });

  const opcoesOrdenacao = obterOpcoesOrdenacaoSeguindo(abaConteudo);

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
        <SeguindoHeader
          isDesktop={isDesktop}
          busca={busca}
          setBusca={setBusca}
          buscaSeguindoAberta={buscaSeguindoAberta}
          setBuscaSeguindoAberta={setBuscaSeguindoAberta}
          setMostrarPainelOrdenacao={setMostrarPainelOrdenacao}
          visualizandoListaSocialDoPerfil={visualizandoListaSocialDoPerfil}
          descricaoListaSocial={descricaoListaSocial}
          abaConteudo={abaConteudo}
        />

        {totalDisponivelGeral > 0 && (
          <>
            <SeguindoSocialToolbar
              isDesktop={isDesktop}
              abaConteudo={abaConteudo}
              trocarAbaConteudo={trocarAbaConteudo}
              totalSeguidores={usuariosSeguidores.length}
              totalObrasSeguidas={obrasSeguidasBase.length}
              totalPessoasSeguidas={usuariosSeguidos.length}
            />

            {mostrarPainelOrdenacao && (
              <SeguindoSortingPanel
                isDesktop={isDesktop}
                opcoesOrdenacao={opcoesOrdenacao}
                ordenacao={ordenacao}
                setOrdenacao={setOrdenacao}
                setMostrarPainelOrdenacao={setMostrarPainelOrdenacao}
              />
            )}
          </>
        )}

        {totalSemFiltros === 0 && !buscaSugestoesUsuariosAtiva ? (
          <SeguindoEmptyState>
            {abaConteudo === "seguidores"
              ? visualizandoListaSocialDoPerfil
                ? "Nenhum seguidor ainda"
                : "Você ainda não tem seguidores"
              : abaConteudo === "obras"
                ? "Nenhuma obra seguida ainda"
                : visualizandoListaSocialDoPerfil
                  ? "Nenhum perfil seguido ainda"
                  : "Você ainda não segue nada"}
          </SeguindoEmptyState>
        ) : (
          <>
            {totalSeguindo === 0 &&
              !carregandoUsuariosSugestoes &&
              usuariosSugestoesBusca.length === 0 && (
              <SeguindoEmptyState>
                Nada encontrado
              </SeguindoEmptyState>
            )}

            {abaConteudo === "obras" && (
              <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
              {obrasFiltradas.length === 0 ? (
                <SeguindoEmptyState>
                  Nenhuma obra seguida encontrada
                </SeguindoEmptyState>
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
                  <SeguindoSectionHeader
                    isDesktop={isDesktop}
                    titulo="SOLICITAÇÕES PARA SEGUIR"
                    total={solicitacoesSeguidoresFiltradas.length}
                  />

                  <div
                    style={isDesktop ? desktopAuthorsGridStyle : authorsGridStyle}
                  >
                    {solicitacoesSeguidoresFiltradas.map((solicitacao) => (
                      <SeguindoFollowRequestCard
                        key={solicitacao.id}
                        solicitacao={solicitacao}
                        isDesktop={isDesktop}
                        respondendo={solicitacaoRespondendoId === solicitacao.id}
                        onResponderSolicitacao={(solicitacaoRespondida, aceitar) =>
                          void responderSolicitacaoSeguidor(
                            solicitacaoRespondida,
                            aceitar,
                          )
                        }
                      />
                    ))}
                  </div>
                </section>
              )}

            {(abaConteudo === "pessoas" ||
              abaConteudo === "seguidores") &&
              usuariosFiltrados.length > 0 && (
              <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
                <div style={isDesktop ? desktopAuthorsGridStyle : authorsGridStyle}>
                  {usuariosFiltrados.map((usuarioSeguido) => (
                    <SeguindoSocialUserCard
                      key={usuarioSeguido.id}
                      usuario={usuarioSeguido}
                      isDesktop={isDesktop}
                      podeRemoverUsuariosDaLista={podeRemoverUsuariosDaLista}
                      podeRemoverSeguidoresDaLista={podeRemoverSeguidoresDaLista}
                      usuarioListaAlterandoId={usuarioListaAlterandoId}
                      onRemoverSeguidorUsuario={(usuarioId) =>
                        void removerSeguidorUsuario(usuarioId)
                      }
                      onDeixarDeSeguirUsuario={(usuarioId) =>
                        void deixarDeSeguirUsuario(usuarioId)
                      }
                    />
                  ))}
                </div>
              </section>
            )}

            {buscaSugestoesUsuariosAtiva && (
              <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
                <SeguindoSectionHeader
                  isDesktop={isDesktop}
                  titulo="SUGESTÕES PARA SEGUIR"
                  total={
                    carregandoUsuariosSugestoes
                      ? "..."
                      : usuariosSugestoesBusca.length
                  }
                />

                {carregandoUsuariosSugestoes ? (
                  <div style={suggestedUsersLoadingStyle}>
                    <LoadingSpinner
                      compacto
                      label="Carregando sugestões para seguir"
                    />
                  </div>
                ) : usuariosSugestoesBusca.length > 0 ? (
                  <div style={isDesktop ? desktopAuthorsGridStyle : authorsGridStyle}>
                    {usuariosSugestoesBusca.map((usuarioSugestao) => (
                      <SeguindoSuggestedUserCard
                        key={usuarioSugestao.id}
                        usuario={usuarioSugestao}
                        isDesktop={isDesktop}
                        seguindoAgora={
                          usuarioSugestaoSeguindoId === usuarioSugestao.id
                        }
                        solicitacaoPendente={solicitacoesEnviadasIds.includes(
                          usuarioSugestao.id,
                        )}
                        onSeguirUsuarioSugestao={(usuario) =>
                          void seguirUsuarioSugestao(usuario)
                        }
                      />
                    ))}
                  </div>
                ) : null}
              </section>
            )}

            {!visualizandoListaSocialDoPerfil && abaConteudo === "pessoas" && autoresFiltrados.length > 0 && (
              <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
                <SeguindoSectionHeader
                  isDesktop={isDesktop}
                  titulo="AUTORES SEGUIDOS"
                  total={autoresFiltrados.length}
                />

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

