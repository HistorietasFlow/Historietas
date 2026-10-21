"use client";

import { useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import { supabase } from "../../../lib/supabase/client";
import {
  metadataTemAdminConfiguracoes,
} from "../lib/configuracoes-account-utils";
import type { AppMetadataAdminConfiguracoes } from "../lib/configuracoes-account-utils";

export function useConfiguracoesAdminAccess({
  verificandoAcesso,
  setAdminLiberado,
}: {
  verificandoAcesso: boolean;
  setAdminLiberado: Dispatch<SetStateAction<boolean>>;
}) {
  useEffect(() => {
    if (verificandoAcesso) {
      return;
    }

    let cancelado = false;

    async function verificarAdmin() {
      try {
        const { data, error: userError } = await supabase.auth.getUser();
        const user = data.user || null;

        if (!user || userError) {
          if (!cancelado) {
            setAdminLiberado(false);
          }

          return;
        }

        const adminPeloToken = metadataTemAdminConfiguracoes(
          user.app_metadata as AppMetadataAdminConfiguracoes | null | undefined,
        );
        const { data: adminLiberadoResposta, error } = await supabase.rpc(
          "usuario_e_admin",
        );

        if (!cancelado) {
          setAdminLiberado(
            error ? adminPeloToken : adminLiberadoResposta === true,
          );
        }
      } catch {
        if (!cancelado) {
          setAdminLiberado(false);
        }
      }
    }

    void verificarAdmin();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setAdminLiberado(false);
        return;
      }

      void verificarAdmin();
    });

    return () => {
      cancelado = true;
      subscription.unsubscribe();
    };
    // setAdminLiberado é um setter React estável recebido da página.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verificandoAcesso]);
}
