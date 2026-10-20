"use client";

import { useState } from "react";
import { useHistorietasTheme } from "../../lib/historietasTheme";
import { normalizarTexto } from "../../lib/utils";
import { LoadingSpinner } from "./components/seguindo-loading-spinner";
import { SeguindoEmptyState } from "./components/seguindo-empty-state";
import { SeguindoPeopleSections } from "./components/seguindo-people-sections";
import { SeguindoPageControls } from "./components/seguindo-page-controls";
import { SeguindoPageFrame } from "./components/seguindo-page-frame";
import { SeguindoWorksSection } from "./components/seguindo-works-section";
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
import { obterMensagemEstadoVazioSeguindo } from "./lib/seguindo-empty-state-message";
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
import { containerStyle, desktopContainerStyle, pageStyle } from "./lib/seguindo-layout-styles";

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
      <SeguindoPageFrame isDesktop={isDesktop} pageThemeStyle={pageThemeStyle}>
        <LoadingSpinner label="Carregando seguindo" />
      </SeguindoPageFrame>
    );
  }

  return (
    <SeguindoPageFrame isDesktop={isDesktop} pageThemeStyle={pageThemeStyle}>
      <section style={isDesktop ? desktopContainerStyle : containerStyle}>
        <SeguindoPageControls
          isDesktop={isDesktop}
          busca={busca}
          setBusca={setBusca}
          buscaSeguindoAberta={buscaSeguindoAberta}
          setBuscaSeguindoAberta={setBuscaSeguindoAberta}
          setMostrarPainelOrdenacao={setMostrarPainelOrdenacao}
          visualizandoListaSocialDoPerfil={visualizandoListaSocialDoPerfil}
          descricaoListaSocial={descricaoListaSocial}
          abaConteudo={abaConteudo}
          totalDisponivelGeral={totalDisponivelGeral}
          trocarAbaConteudo={trocarAbaConteudo}
          totalSeguidores={usuariosSeguidores.length}
          totalObrasSeguidas={obrasSeguidasBase.length}
          totalPessoasSeguidas={usuariosSeguidos.length}
          mostrarPainelOrdenacao={mostrarPainelOrdenacao}
          opcoesOrdenacao={opcoesOrdenacao}
          ordenacao={ordenacao}
          setOrdenacao={setOrdenacao}
        />

        {totalSemFiltros === 0 && !buscaSugestoesUsuariosAtiva ? (
          <SeguindoEmptyState>
            {obterMensagemEstadoVazioSeguindo(
              abaConteudo,
              visualizandoListaSocialDoPerfil,
            )}
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
              <SeguindoWorksSection
                isDesktop={isDesktop}
                obrasFiltradas={obrasFiltradas}
                visualizandoListaSocialDoPerfil={visualizandoListaSocialDoPerfil}
                onDeixarDeSeguirObra={deixarDeSeguirObra}
              />
            )}

            <SeguindoPeopleSections
              isDesktop={isDesktop}
              abaConteudo={abaConteudo}
              listaSocialEhDoUsuarioLogado={listaSocialEhDoUsuarioLogado}
              solicitacoesSeguidoresFiltradas={solicitacoesSeguidoresFiltradas}
              solicitacaoRespondendoId={solicitacaoRespondendoId}
              onResponderSolicitacao={responderSolicitacaoSeguidor}
              usuariosFiltrados={usuariosFiltrados}
              podeRemoverUsuariosDaLista={podeRemoverUsuariosDaLista}
              podeRemoverSeguidoresDaLista={podeRemoverSeguidoresDaLista}
              usuarioListaAlterandoId={usuarioListaAlterandoId}
              onRemoverSeguidorUsuario={removerSeguidorUsuario}
              onDeixarDeSeguirUsuario={deixarDeSeguirUsuario}
              buscaSugestoesUsuariosAtiva={buscaSugestoesUsuariosAtiva}
              carregandoUsuariosSugestoes={carregandoUsuariosSugestoes}
              usuariosSugestoesBusca={usuariosSugestoesBusca}
              usuarioSugestaoSeguindoId={usuarioSugestaoSeguindoId}
              solicitacoesEnviadasIds={solicitacoesEnviadasIds}
              onSeguirUsuarioSugestao={seguirUsuarioSugestao}
              visualizandoListaSocialDoPerfil={visualizandoListaSocialDoPerfil}
              autoresFiltrados={autoresFiltrados}
              onDeixarDeSeguirAutor={deixarDeSeguirAutor}
            />
          </>
        )}
      </section>
    </SeguindoPageFrame>
  );
}

