import { useEffect, type Dispatch, type SetStateAction } from "react";
import {
  carregarEstadoBloqueioPerfil,
  type EstadoBloqueioPerfil,
} from "../../../lib/historietasPrivacy";
import { idAutorSupabaseValido } from "../lib/profile-formatters";

export function usePerfilAutorBlockStateSync({
  perfilAutorId,
  usuarioIdLogado,
  setEstadoBloqueioPerfil,
}: {
  perfilAutorId: string;
  usuarioIdLogado: string;
  setEstadoBloqueioPerfil: Dispatch<SetStateAction<EstadoBloqueioPerfil>>;
}) {
  useEffect(() => {
    const perfilUserId = perfilAutorId.trim();
    const usuarioAtualId = usuarioIdLogado.trim();
    let cancelado = false;

    async function carregarBloqueioPerfil() {
      if (
        !perfilUserId ||
        !usuarioAtualId ||
        perfilUserId === usuarioAtualId ||
        !idAutorSupabaseValido(perfilUserId)
      ) {
        setEstadoBloqueioPerfil({
          bloqueadoPorMim: false,
          bloqueadoPeloPerfil: false,
          existeBloqueio: false,
        });
        return;
      }

      const estado = await carregarEstadoBloqueioPerfil(perfilUserId);

      if (!cancelado) {
        setEstadoBloqueioPerfil(estado);
      }
    }

    const carregarBloqueioTimer = window.setTimeout(() => {
      void carregarBloqueioPerfil();
    }, 0);

    return () => {
      cancelado = true;
      window.clearTimeout(carregarBloqueioTimer);
    };
  }, [
    perfilAutorId,
    usuarioIdLogado,
    setEstadoBloqueioPerfil,
  ]);
}
