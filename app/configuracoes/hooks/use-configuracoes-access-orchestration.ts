"use client";

import { useConfiguracoesAdminAccess } from "./use-configuracoes-admin-access";
import { useConfiguracoesBlockedUsers } from "./use-configuracoes-blocked-users";
import { useConfiguracoesInitialAccess } from "./use-configuracoes-initial-access";

type InitialAccessArgs = Parameters<typeof useConfiguracoesInitialAccess>[0];
type AdminAccessArgs = Parameters<typeof useConfiguracoesAdminAccess>[0];
type BlockedUsersArgs = Parameters<typeof useConfiguracoesBlockedUsers>[0];

type UseConfiguracoesAccessOrchestrationArgs = Omit<
  InitialAccessArgs,
  "setUsuariosBloqueados"
> &
  AdminAccessArgs &
  BlockedUsersArgs;

export function useConfiguracoesAccessOrchestration({
  router,
  setVerificandoAcesso,
  setUsuario,
  setPreferencias,
  setPrivacidade,
  setResumo,
  verificandoAcesso,
  setAdminLiberado,
  traduzirTexto,
  mostrarMensagemAcao,
}: UseConfiguracoesAccessOrchestrationArgs) {
  const blockedUsers = useConfiguracoesBlockedUsers({
    traduzirTexto,
    mostrarMensagemAcao,
  });

  useConfiguracoesInitialAccess({
    router,
    setVerificandoAcesso,
    setUsuario,
    setPreferencias,
    setPrivacidade,
    setResumo,
    setUsuariosBloqueados: blockedUsers.setUsuariosBloqueados,
  });

  useConfiguracoesAdminAccess({
    verificandoAcesso,
    setAdminLiberado,
  });

  return blockedUsers;
}
