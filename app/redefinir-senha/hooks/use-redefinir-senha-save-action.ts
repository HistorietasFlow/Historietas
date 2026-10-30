import type { Dispatch, FormEvent, SetStateAction } from "react";
import { supabase } from "../../../lib/supabase/client";
import {
  obterMensagemErro,
  sessaoEhRecuperacao,
  type EstadoLink,
} from "../lib/redefinir-senha-recovery-utils";
import type { TranslationKey } from "../lib/redefinir-senha-translations";

type RedefinirSenhaRouter = {
  replace: (href: string) => void;
  refresh: () => void;
};

type UseRedefinirSenhaSaveActionParams = {
  router: RedefinirSenhaRouter;
  salvando: boolean;
  estadoLink: EstadoLink;
  novaSenha: string;
  confirmacao: string;
  t: (key: TranslationKey) => string;
  setEstadoLink: Dispatch<SetStateAction<EstadoLink>>;
  setErro: Dispatch<SetStateAction<string>>;
  setSalvando: Dispatch<SetStateAction<boolean>>;
};

export function useRedefinirSenhaSaveAction({
  router,
  salvando,
  estadoLink,
  novaSenha,
  confirmacao,
  t,
  setEstadoLink,
  setErro,
  setSalvando,
}: UseRedefinirSenhaSaveActionParams) {
  async function salvarNovaSenha(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (salvando || estadoLink !== "valido") {
      return;
    }

    setErro("");

    if (novaSenha.length < 8) {
      setErro(t("passwordMin"));
      return;
    }

    if (
      !/[A-Za-zÀ-ÖØ-öø-ÿ]/.test(novaSenha) ||
      !/\d/.test(novaSenha)
    ) {
      setErro(t("passwordComposition"));
      return;
    }

    if (novaSenha !== confirmacao) {
      setErro(t("passwordMismatch"));
      return;
    }

    setSalvando(true);

    try {
      const {
        data: usuarioAtual,
        error: erroUsuario,
      } = await supabase.auth.getUser();

      if (erroUsuario || !usuarioAtual.user) {
        setEstadoLink("invalido");
        setErro(t("sessionInvalid"));
        return;
      }

      const recuperacaoValida =
        await sessaoEhRecuperacao();

      if (!recuperacaoValida) {
        setEstadoLink("invalido");
        setErro(t("sessionInvalid"));
        return;
      }

      const { error } =
        await supabase.auth.updateUser({
          password: novaSenha,
        });

      if (error) {
        setErro(
          obterMensagemErro(error, t("genericError")),
        );

        return;
      }

      const { error: erroLogout } = await supabase.auth.signOut();

      if (erroLogout) {
        setErro(t("genericError"));
        return;
      }

      router.replace("/login?senhaRedefinida=1");
      router.refresh();
    } catch (error) {
      setErro(
        obterMensagemErro(error, t("genericError")),
      );
    } finally {
      setSalvando(false);
    }
  }

  return { salvarNovaSenha };
}
