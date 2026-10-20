"use client";

import { SeguindoPageLoadingState } from "./components/seguindo-page-loading-state";
import { SeguindoPageLoadedState } from "./components/seguindo-page-loaded-state";
import { useSeguindoDerivedContent } from "./hooks/use-seguindo-derived-content";
import { useSeguindoPageActions } from "./hooks/use-seguindo-page-actions";
import { useSeguindoPageContentInteractions } from "./hooks/use-seguindo-page-content-interactions";
import { useSeguindoPageContext } from "./hooks/use-seguindo-page-context";
import { useSeguindoPageInitialSync } from "./hooks/use-seguindo-page-initial-sync";
import { useSeguindoPageState } from "./hooks/use-seguindo-page-state";

export default function SeguindoPage() {
  const {
    obras, setObras, obrasSeguidas, setObrasSeguidas, autoresSeguidos, setAutoresSeguidos,
    obrasFavoritas, setObrasFavoritas, obrasConcluidas, setObrasConcluidas,
    setAtividadesSeguindo, carregando, setCarregando,
    usuariosSeguidos, setUsuariosSeguidos, usuariosSeguidores, setUsuariosSeguidores,
    solicitacoesSeguidores, setSolicitacoesSeguidores, solicitacoesEnviadasIds, setSolicitacoesEnviadasIds,
    solicitacaoRespondendoId, setSolicitacaoRespondendoId, usuarioListaAlterandoId, setUsuarioListaAlterandoId,
    busca, setBusca, buscaSeguindoAberta, setBuscaSeguindoAberta,
    usuariosSugestoesBusca, setUsuariosSugestoesBusca,
    carregandoUsuariosSugestoes, setCarregandoUsuariosSugestoes,
    usuarioSugestaoSeguindoId, setUsuarioSugestaoSeguindoId,
    filtro, setFiltro, ordenacao, setOrdenacao,
    abaConteudo, setAbaConteudo, mostrarPainelOrdenacao, setMostrarPainelOrdenacao,
  } = useSeguindoPageState();
  const {
    isDesktop, pageThemeStyle,
    verificandoAcesso, setVerificandoAcesso, usuarioLogadoId, setUsuarioLogadoId,
    setAbaSeguimento, perfilSocialId, setPerfilSocialId, perfilSocialNome, setPerfilSocialNome,
  } = useSeguindoPageContext(
    mostrarPainelOrdenacao,
  );

  useSeguindoPageInitialSync({
    setUsuarioLogadoId,
    setAbaSeguimento,
    setAbaConteudo,
    setPerfilSocialId,
    setPerfilSocialNome,
    setVerificandoAcesso,
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
  const trocarAbaConteudo = useSeguindoPageContentInteractions({
    perfilSocialId,
    perfilSocialNome,
    usuarioLogadoId,
    visualizandoListaSocialDoPerfil,
    setAbaConteudo,
    setAbaSeguimento,
    setBusca,
    setFiltro,
    setOrdenacao,
    busca,
    buscaSugestoesUsuariosAtiva,
    usuariosSeguidos,
    setUsuariosSugestoesBusca,
    setCarregandoUsuariosSugestoes,
  });
  if (verificandoAcesso || carregando) {
    return <SeguindoPageLoadingState isDesktop={isDesktop} pageThemeStyle={pageThemeStyle} />;
  }

  return (
    <SeguindoPageLoadedState
      isDesktop={isDesktop}
      pageThemeStyle={pageThemeStyle}
      controls={{
        isDesktop,
        busca,
        setBusca,
        buscaSeguindoAberta,
        setBuscaSeguindoAberta,
        setMostrarPainelOrdenacao,
        visualizandoListaSocialDoPerfil,
        descricaoListaSocial,
        abaConteudo,
        totalDisponivelGeral,
        trocarAbaConteudo,
        totalSeguidores: usuariosSeguidores.length,
        totalObrasSeguidas: obrasSeguidasBase.length,
        totalPessoasSeguidas: usuariosSeguidos.length,
        mostrarPainelOrdenacao,
        opcoesOrdenacao,
        ordenacao,
        setOrdenacao,
      }}
      content={{
        isDesktop,
        totalSemFiltros,
        buscaSugestoesUsuariosAtiva,
        abaConteudo,
        visualizandoListaSocialDoPerfil,
        totalSeguindo,
        carregandoUsuariosSugestoes,
        usuariosSugestoesBusca,
        obrasFiltradas,
        onDeixarDeSeguirObra: deixarDeSeguirObra,
        listaSocialEhDoUsuarioLogado,
        solicitacoesSeguidoresFiltradas,
        solicitacaoRespondendoId,
        onResponderSolicitacao: responderSolicitacaoSeguidor,
        usuariosFiltrados,
        podeRemoverUsuariosDaLista,
        podeRemoverSeguidoresDaLista,
        usuarioListaAlterandoId,
        onRemoverSeguidorUsuario: removerSeguidorUsuario,
        onDeixarDeSeguirUsuario: deixarDeSeguirUsuario,
        usuarioSugestaoSeguindoId,
        solicitacoesEnviadasIds,
        onSeguirUsuarioSugestao: seguirUsuarioSugestao,
        autoresFiltrados,
        onDeixarDeSeguirAutor: deixarDeSeguirAutor,
      }}
    />
  );
}

