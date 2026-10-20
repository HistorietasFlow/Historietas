"use client";

import { SeguindoEmptyState } from "./seguindo-empty-state";
import { SeguindoPeopleSections } from "./seguindo-people-sections";
import { SeguindoWorksSection } from "./seguindo-works-section";
import { obterMensagemEstadoVazioSeguindo } from "../lib/seguindo-empty-state-message";
import type {
  AbaConteudoSeguindo,
  AutorSeguido,
  ObraLocal,
  SolicitacaoSeguidor,
  UsuarioSeguido,
} from "../lib/seguindo-page-types";

type SeguindoPageContentProps = {
  isDesktop: boolean;
  totalSemFiltros: number;
  buscaSugestoesUsuariosAtiva: boolean;
  abaConteudo: AbaConteudoSeguindo;
  visualizandoListaSocialDoPerfil: boolean;
  totalSeguindo: number;
  carregandoUsuariosSugestoes: boolean;
  usuariosSugestoesBusca: UsuarioSeguido[];
  obrasFiltradas: ObraLocal[];
  onDeixarDeSeguirObra: (obra: ObraLocal) => void;
  listaSocialEhDoUsuarioLogado: boolean;
  solicitacoesSeguidoresFiltradas: SolicitacaoSeguidor[];
  solicitacaoRespondendoId: string | null;
  onResponderSolicitacao: (
    solicitacao: SolicitacaoSeguidor,
    aceitar: boolean,
  ) => void;
  usuariosFiltrados: UsuarioSeguido[];
  podeRemoverUsuariosDaLista: boolean;
  podeRemoverSeguidoresDaLista: boolean;
  usuarioListaAlterandoId: string | null;
  onRemoverSeguidorUsuario: (usuarioId: string) => void;
  onDeixarDeSeguirUsuario: (usuarioId: string) => void;
  usuarioSugestaoSeguindoId: string | null;
  solicitacoesEnviadasIds: string[];
  onSeguirUsuarioSugestao: (usuario: UsuarioSeguido) => void;
  autoresFiltrados: AutorSeguido[];
  onDeixarDeSeguirAutor: (chaveAutor: string) => void;
};

export function SeguindoPageContent({
  isDesktop,
  totalSemFiltros,
  buscaSugestoesUsuariosAtiva,
  abaConteudo,
  visualizandoListaSocialDoPerfil,
  totalSeguindo,
  carregandoUsuariosSugestoes,
  usuariosSugestoesBusca,
  obrasFiltradas,
  onDeixarDeSeguirObra,
  listaSocialEhDoUsuarioLogado,
  solicitacoesSeguidoresFiltradas,
  solicitacaoRespondendoId,
  onResponderSolicitacao,
  usuariosFiltrados,
  podeRemoverUsuariosDaLista,
  podeRemoverSeguidoresDaLista,
  usuarioListaAlterandoId,
  onRemoverSeguidorUsuario,
  onDeixarDeSeguirUsuario,
  usuarioSugestaoSeguindoId,
  solicitacoesEnviadasIds,
  onSeguirUsuarioSugestao,
  autoresFiltrados,
  onDeixarDeSeguirAutor,
}: SeguindoPageContentProps) {
  return totalSemFiltros === 0 && !buscaSugestoesUsuariosAtiva ? (
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
          onDeixarDeSeguirObra={onDeixarDeSeguirObra}
        />
      )}

      <SeguindoPeopleSections
        isDesktop={isDesktop}
        abaConteudo={abaConteudo}
        listaSocialEhDoUsuarioLogado={listaSocialEhDoUsuarioLogado}
        solicitacoesSeguidoresFiltradas={solicitacoesSeguidoresFiltradas}
        solicitacaoRespondendoId={solicitacaoRespondendoId}
        onResponderSolicitacao={onResponderSolicitacao}
        usuariosFiltrados={usuariosFiltrados}
        podeRemoverUsuariosDaLista={podeRemoverUsuariosDaLista}
        podeRemoverSeguidoresDaLista={podeRemoverSeguidoresDaLista}
        usuarioListaAlterandoId={usuarioListaAlterandoId}
        onRemoverSeguidorUsuario={onRemoverSeguidorUsuario}
        onDeixarDeSeguirUsuario={onDeixarDeSeguirUsuario}
        buscaSugestoesUsuariosAtiva={buscaSugestoesUsuariosAtiva}
        carregandoUsuariosSugestoes={carregandoUsuariosSugestoes}
        usuariosSugestoesBusca={usuariosSugestoesBusca}
        usuarioSugestaoSeguindoId={usuarioSugestaoSeguindoId}
        solicitacoesEnviadasIds={solicitacoesEnviadasIds}
        onSeguirUsuarioSugestao={onSeguirUsuarioSugestao}
        visualizandoListaSocialDoPerfil={visualizandoListaSocialDoPerfil}
        autoresFiltrados={autoresFiltrados}
        onDeixarDeSeguirAutor={onDeixarDeSeguirAutor}
      />
    </>
  );
}
