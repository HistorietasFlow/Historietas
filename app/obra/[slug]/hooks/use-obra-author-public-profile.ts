import { useEffect, useState } from "react";
import { carregarPerfilPublicoObra } from "../lib/obra-public-profile-resolver";
import type { PerfilPublicoObra } from "../lib/obra-text-utils";

export function useObraAuthorPublicProfile(
  autorId: string | undefined,
  autor: string,
) {
  const [perfilAutorObra, setPerfilAutorObra] =
    useState<PerfilPublicoObra | null>(null);

  useEffect(() => {
    let cancelado = false;

    async function carregarPerfilAutorDaObra() {
      if (!autorId) {
        window.setTimeout(() => {
          if (!cancelado) {
            setPerfilAutorObra(null);
          }
        }, 0);
        return;
      }

      const perfilAutor = await carregarPerfilPublicoObra(autorId, autor);

      window.setTimeout(() => {
        if (!cancelado) {
          setPerfilAutorObra(perfilAutor);
        }
      }, 0);
    }

    void carregarPerfilAutorDaObra();

    return () => {
      cancelado = true;
    };
  }, [autorId, autor]);

  return perfilAutorObra;
}
