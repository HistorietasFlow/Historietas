"use client";

import { useSeguindoAccessSync } from "./use-seguindo-access-sync";
import { useSeguindoPageDataLoading } from "./use-seguindo-page-data-loading";

type UseSeguindoPageInitialSyncParams = Parameters<
  typeof useSeguindoAccessSync
>[0] &
  Parameters<typeof useSeguindoPageDataLoading>[0];

export function useSeguindoPageInitialSync({
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
}: UseSeguindoPageInitialSyncParams) {
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
}
