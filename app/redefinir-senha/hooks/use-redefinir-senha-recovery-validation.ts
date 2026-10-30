import { useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import { supabase } from "../../../lib/supabase/client";
import {
  sessaoEhRecuperacao,
  type EstadoLink,
} from "../lib/redefinir-senha-recovery-utils";

export function useRedefinirSenhaRecoveryValidation(
  setEstadoLink: Dispatch<SetStateAction<EstadoLink>>,
) {
  useEffect(() => {
    let ativo = true;

    async function validarRecuperacao() {
      const params = new URLSearchParams(window.location.search);

      const retornoConfirmado =
        params.get("recuperacao") === "1";

      const erroNoLink =
        params.get("erro") === "link-invalido";

      if (!retornoConfirmado || erroNoLink) {
        if (ativo) {
          setEstadoLink("invalido");
        }

        return;
      }

      try {
        const { data, error } =
          await supabase.auth.getUser();

        const recuperacaoValida =
          !error && data.user
            ? await sessaoEhRecuperacao()
            : false;

        if (!ativo) {
          return;
        }

        setEstadoLink(
          recuperacaoValida ? "valido" : "invalido",
        );
      } catch {
        if (ativo) {
          setEstadoLink("invalido");
        }
      }
    }

    void validarRecuperacao();

    return () => {
      ativo = false;
    };
  }, [setEstadoLink]);
}
