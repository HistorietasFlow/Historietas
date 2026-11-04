import { useEffect, useState } from "react";
import { carregarPerfilPublicoObra } from "../lib/obra-public-profile-resolver";
import type { PerfilPublicoObra } from "../lib/obra-text-utils";

type PerfilUsuarioLogadoCarregado = {
  usuarioId: string;
  perfil: PerfilPublicoObra | null;
};

export function useObraCurrentUserPublicProfile(usuarioIdLogado: string) {
  const [perfilCarregado, setPerfilCarregado] =
    useState<PerfilUsuarioLogadoCarregado>({
      usuarioId: "",
      perfil: null,
    });

  useEffect(() => {
    let cancelado = false;

    async function carregarPerfilUsuarioAtual() {
      if (!usuarioIdLogado) {
        setPerfilCarregado({ usuarioId: "", perfil: null });
        return;
      }

      const perfil = await carregarPerfilPublicoObra(
        usuarioIdLogado,
        "Você",
      );

      if (!cancelado) {
        setPerfilCarregado({ usuarioId: usuarioIdLogado, perfil });
      }
    }

    void carregarPerfilUsuarioAtual();

    return () => {
      cancelado = true;
    };
  }, [usuarioIdLogado]);

  return perfilCarregado.usuarioId === usuarioIdLogado
    ? perfilCarregado.perfil
    : null;
}
