"use client";

import { SeguindoFollowRequestCard } from "./seguindo-follow-request-card";
import { SeguindoFollowedAuthorCard } from "./seguindo-followed-author-card";
import { SeguindoSectionHeader } from "./seguindo-section-header";
import { SeguindoSocialUserCard } from "./seguindo-social-user-card";
import { SeguindoSuggestedUserCard } from "./seguindo-suggested-user-card";
import { LoadingSpinner } from "./seguindo-loading-spinner";
import {
  authorsGridStyle,
  desktopAuthorsGridStyle,
} from "../lib/seguindo-grid-layout-styles";
import {
  desktopSectionStyle,
  sectionStyle,
} from "../lib/seguindo-section-header-styles";
import { suggestedUsersLoadingStyle } from "../lib/seguindo-suggested-user-text-styles";
import type {
  AbaConteudoSeguindo,
  AutorSeguido,
  SolicitacaoSeguidor,
  UsuarioSeguido,
} from "../lib/seguindo-page-types";

type SeguindoPeopleSectionsProps = {
  isDesktop: boolean;
  abaConteudo: AbaConteudoSeguindo;
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
  buscaSugestoesUsuariosAtiva: boolean;
  carregandoUsuariosSugestoes: boolean;
  usuariosSugestoesBusca: UsuarioSeguido[];
  usuarioSugestaoSeguindoId: string | null;
  solicitacoesEnviadasIds: string[];
  onSeguirUsuarioSugestao: (usuario: UsuarioSeguido) => void;
  visualizandoListaSocialDoPerfil: boolean;
  autoresFiltrados: AutorSeguido[];
  onDeixarDeSeguirAutor: (chaveAutor: string) => void;
};

export function SeguindoPeopleSections({
  isDesktop,
  abaConteudo,
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
  buscaSugestoesUsuariosAtiva,
  carregandoUsuariosSugestoes,
  usuariosSugestoesBusca,
  usuarioSugestaoSeguindoId,
  solicitacoesEnviadasIds,
  onSeguirUsuarioSugestao,
  visualizandoListaSocialDoPerfil,
  autoresFiltrados,
  onDeixarDeSeguirAutor,
}: SeguindoPeopleSectionsProps) {
  return (
    <>
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
                    void onResponderSolicitacao(
                      solicitacaoRespondida,
                      aceitar,
                    )
                  }
                />
              ))}
            </div>
          </section>
        )}

      {(abaConteudo === "pessoas" || abaConteudo === "seguidores") &&
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
                  void onRemoverSeguidorUsuario(usuarioId)
                }
                onDeixarDeSeguirUsuario={(usuarioId) =>
                  void onDeixarDeSeguirUsuario(usuarioId)
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
                    void onSeguirUsuarioSugestao(usuario)
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
              <SeguindoFollowedAuthorCard
                key={autor.chave}
                autor={autor}
                isDesktop={isDesktop}
                onDeixarDeSeguirAutor={(chaveAutor) =>
                  void onDeixarDeSeguirAutor(chaveAutor)
                }
              />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
