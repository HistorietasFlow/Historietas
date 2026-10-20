"use client";

import { useHistorietasTheme } from "../../lib/historietasTheme";
import { LoadingSpinner } from "./components/seguindo-loading-spinner";
import { SeguindoPageContent } from "./components/seguindo-page-content";
import { SeguindoPageControls } from "./components/seguindo-page-controls";
import { SeguindoPageFrame } from "./components/seguindo-page-frame";
import { useSeguindoAccessSync } from "./hooks/use-seguindo-access-sync";
import { useSeguindoContentTabNavigation } from "./hooks/use-seguindo-content-tab-navigation";
import { useSeguindoDesktopMode } from "./hooks/use-seguindo-desktop-mode";
import { useSeguindoDerivedContent } from "./hooks/use-seguindo-derived-content";
import { useSeguindoPageActions } from "./hooks/use-seguindo-page-actions";
import { useSeguindoPageAccessContextState } from "./hooks/use-seguindo-page-access-context-state";
import { useSeguindoPageDataState } from "./hooks/use-seguindo-page-data-state";
import { useSeguindoPageDataLoading } from "./hooks/use-seguindo-page-data-loading";
import { useSeguindoPageDiscoveryState } from "./hooks/use-seguindo-page-discovery-state";
import { useSeguindoPageSocialState } from "./hooks/use-seguindo-page-social-state";
import { useSeguindoSortingSheetBodyLock } from "./hooks/use-seguindo-sorting-sheet-body-lock";
import { useSeguindoUserSearchSync } from "./hooks/use-seguindo-user-search-sync";
import { containerStyle, desktopContainerStyle, pageStyle } from "./lib/seguindo-layout-styles";

export default function SeguindoPage() {
  const {
    obras, setObras, obrasSeguidas, setObrasSeguidas, autoresSeguidos, setAutoresSeguidos,
    obrasFavoritas, setObrasFavoritas, obrasConcluidas, setObrasConcluidas,
    setAtividadesSeguindo, carregando, setCarregando,
  } = useSeguindoPageDataState();
  const {
    usuariosSeguidos, setUsuariosSeguidos, usuariosSeguidores, setUsuariosSeguidores,
    solicitacoesSeguidores, setSolicitacoesSeguidores, solicitacoesEnviadasIds, setSolicitacoesEnviadasIds,
    solicitacaoRespondendoId, setSolicitacaoRespondendoId, usuarioListaAlterandoId, setUsuarioListaAlterandoId,
  } = useSeguindoPageSocialState();
  const {
    busca, setBusca, buscaSeguindoAberta, setBuscaSeguindoAberta,
    usuariosSugestoesBusca, setUsuariosSugestoesBusca,
    carregandoUsuariosSugestoes, setCarregandoUsuariosSugestoes,
    usuarioSugestaoSeguindoId, setUsuarioSugestaoSeguindoId,
    filtro, setFiltro, ordenacao, setOrdenacao,
    abaConteudo, setAbaConteudo, mostrarPainelOrdenacao, setMostrarPainelOrdenacao,
  } = useSeguindoPageDiscoveryState();
  const isDesktop = useSeguindoDesktopMode();
  const {
    verificandoAcesso, setVerificandoAcesso, usuarioLogadoId, setUsuarioLogadoId,
    setAbaSeguimento, perfilSocialId, setPerfilSocialId, perfilSocialNome, setPerfilSocialNome,
  } = useSeguindoPageAccessContextState();
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

  useSeguindoPageDataLoading({
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

  const {
    removerSeguidorUsuario,
    responderSolicitacaoSeguidor,
    deixarDeSeguirUsuario,
    seguirUsuarioSugestao,
    deixarDeSeguirObra,
    deixarDeSeguirAutor,
  } = useSeguindoPageActions({
    usuarioLogadoId,
    usuarioListaAlterandoId,
    solicitacaoRespondendoId,
    usuarioSugestaoSeguindoId,
    solicitacoesEnviadasIds,
    obrasSeguidas,
    autoresSeguidos,
    setUsuarioListaAlterandoId,
    setSolicitacaoRespondendoId,
    setUsuariosSeguidores,
    setSolicitacoesSeguidores,
    setUsuarioSugestaoSeguindoId,
    setUsuariosSeguidos,
    setAtividadesSeguindo,
    setSolicitacoesEnviadasIds,
    setUsuariosSugestoesBusca,
    setObrasSeguidas,
    setAutoresSeguidos,
  });

  const {
    listaSocialEhDoUsuarioLogado,
    visualizandoListaSocialDoPerfil,
    buscaSugestoesUsuariosAtiva,
    descricaoListaSocial,
    podeRemoverUsuariosDaLista,
    podeRemoverSeguidoresDaLista,
    obrasSeguidasBase,
    obrasFiltradas,
    autoresFiltrados,
    usuariosFiltrados,
    solicitacoesSeguidoresFiltradas,
    totalDisponivelGeral,
    totalSemFiltros,
    totalSeguindo,
    opcoesOrdenacao,
  } = useSeguindoDerivedContent({
    obras,
    obrasSeguidas,
    autoresSeguidos,
    obrasFavoritas,
    obrasConcluidas,
    busca,
    buscaSeguindoAberta,
    abaConteudo,
    filtro,
    ordenacao,
    usuarioLogadoId,
    perfilSocialId,
    perfilSocialNome,
    usuariosSeguidos,
    usuariosSeguidores,
    solicitacoesSeguidores,
  });
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
  useSeguindoUserSearchSync({
    busca,
    buscaSugestoesUsuariosAtiva,
    usuarioLogadoId,
    usuariosSeguidos,
    setUsuariosSugestoesBusca,
    setCarregandoUsuariosSugestoes,
  });
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

        <SeguindoPageContent
          isDesktop={isDesktop}
          totalSemFiltros={totalSemFiltros}
          buscaSugestoesUsuariosAtiva={buscaSugestoesUsuariosAtiva}
          abaConteudo={abaConteudo}
          visualizandoListaSocialDoPerfil={visualizandoListaSocialDoPerfil}
          totalSeguindo={totalSeguindo}
          carregandoUsuariosSugestoes={carregandoUsuariosSugestoes}
          usuariosSugestoesBusca={usuariosSugestoesBusca}
          obrasFiltradas={obrasFiltradas}
          onDeixarDeSeguirObra={deixarDeSeguirObra}
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
          usuarioSugestaoSeguindoId={usuarioSugestaoSeguindoId}
          solicitacoesEnviadasIds={solicitacoesEnviadasIds}
          onSeguirUsuarioSugestao={seguirUsuarioSugestao}
          autoresFiltrados={autoresFiltrados}
          onDeixarDeSeguirAutor={deixarDeSeguirAutor}
        />
      </section>
    </SeguindoPageFrame>
  );
}

