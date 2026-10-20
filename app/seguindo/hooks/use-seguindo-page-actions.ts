"use client";

import { useSeguindoFollowerActions } from "./use-seguindo-follower-actions";
import { useSeguindoUserFollowActions } from "./use-seguindo-user-follow-actions";
import { useSeguindoWorkAuthorActions } from "./use-seguindo-work-author-actions";

type UseSeguindoPageActionsParams =
  Parameters<typeof useSeguindoFollowerActions>[0] &
  Parameters<typeof useSeguindoUserFollowActions>[0] &
  Parameters<typeof useSeguindoWorkAuthorActions>[0];

export function useSeguindoPageActions({
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
}: UseSeguindoPageActionsParams) {
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

  return {
    removerSeguidorUsuario,
    responderSolicitacaoSeguidor,
    deixarDeSeguirUsuario,
    seguirUsuarioSugestao,
    deixarDeSeguirObra,
    deixarDeSeguirAutor,
  };
}
