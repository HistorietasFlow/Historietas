import { obterRedirectToAtual } from "../lib/login-redirect-utils";
import { sincronizarStorageUsuarioLogin } from "../lib/login-storage-sync";

type FinalizarAutenticacaoLoginParams = {
  userId: string;
  router: {
    replace: (href: string) => void;
    refresh: () => void;
  };
};

export function finalizarAutenticacaoLogin({
  userId,
  router,
}: FinalizarAutenticacaoLoginParams) {
  sincronizarStorageUsuarioLogin(userId);
  router.replace(obterRedirectToAtual("/perfil-autor"));
  router.refresh();
}
