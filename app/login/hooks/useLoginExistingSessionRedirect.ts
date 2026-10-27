import { useEffect } from "react";
import { supabase } from "../../../lib/supabase/client";
import { obterRedirectToAtual } from "../lib/login-redirect-utils";
import { sincronizarStorageUsuarioLogin } from "../lib/login-storage-sync";
import { aguardarLogin } from "../lib/login-timing-utils";

type UseLoginExistingSessionRedirectParams = {
  router: {
    replace: (href: string) => void;
    refresh: () => void;
  };
  salvarProfile: (
    userId: string,
    nomeInformado: string,
    emailInformado: string,
    userMetadata?: Record<string, unknown> | null,
  ) => Promise<{ ok: boolean }>;
  t: (key: "profileSyncWarning") => string;
  setErro: (erro: string) => void;
};

export function useLoginExistingSessionRedirect({
  router,
  salvarProfile,
  t,
  setErro,
}: UseLoginExistingSessionRedirectParams) {
  useEffect(() => {
    let componenteAtivo = true;

    async function redirecionarUsuarioJaLogado() {
      try {
        const { data } = await supabase.auth.getUser();

        if (componenteAtivo && data.user) {
          const resultadoPerfil = await salvarProfile(
            data.user.id,
            "",
            data.user.email || "",
            data.user.user_metadata,
          );

          if (!resultadoPerfil.ok && componenteAtivo) {
            setErro(t("profileSyncWarning"));
            await aguardarLogin(1600);
          }

          sincronizarStorageUsuarioLogin(data.user.id);

          router.replace(obterRedirectToAtual("/perfil-autor"));
          router.refresh();
        }
      } catch {
        // A página de login deve continuar acessível se a verificação falhar.
      }
    }

    void redirecionarUsuarioJaLogado();

    return () => {
      componenteAtivo = false;
    };
  }, [router, salvarProfile, t, setErro]);
}
