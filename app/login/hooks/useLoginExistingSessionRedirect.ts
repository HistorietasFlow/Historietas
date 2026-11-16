import { useEffect } from "react";
import { supabase } from "../../../lib/supabase/client";

type UseLoginExistingSessionRedirectParams = {
  capturarNavegacao: () => () => boolean;
  finalizarLogin: (userId: string) => void;
  prepararContinuacao: (userId: string) => void;
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
  capturarNavegacao,
  finalizarLogin,
  prepararContinuacao,
  salvarProfile,
  t,
  setErro,
}: UseLoginExistingSessionRedirectParams) {
  useEffect(() => {
    let componenteAtivo = true;
    const consultaVigente = capturarNavegacao();
    const vigente = () => componenteAtivo && consultaVigente();

    async function redirecionarUsuarioJaLogado() {
      try {
        if (!vigente()) return;
        const { data, error } = await supabase.auth.getUser();

        if (!error && vigente() && data.user) {
          const resultadoPerfil = await salvarProfile(
            data.user.id,
            "",
            data.user.email || "",
            data.user.user_metadata,
          );
          if (!vigente()) return;

          if (!resultadoPerfil.ok) {
            setErro(t("profileSyncWarning"));
            prepararContinuacao(data.user.id);
            return;
          }

          finalizarLogin(data.user.id);
        }
      } catch {
        // A página de login deve continuar acessível se a verificação falhar.
      }
    }

    void redirecionarUsuarioJaLogado();

    return () => {
      componenteAtivo = false;
    };
  }, [capturarNavegacao, finalizarLogin, prepararContinuacao, salvarProfile, t, setErro]);
}
