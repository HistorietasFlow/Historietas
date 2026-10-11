import { useEffect, type Dispatch, type SetStateAction } from "react";
import { carregarCurtidasTopFiveLocais } from "../lib/profile-top-five-local-utils";
import { carregarCurtidasTopFivePerfil } from "../lib/profile-top-five-supabase-utils";

export function usePerfilAutorTopFiveLikesSync({
  perfilAutorId,
  usuarioIdLogado,
  setTopFiveCurtidasTotal,
  setTopFiveCurtidoPorMim,
}: {
  perfilAutorId: string;
  usuarioIdLogado: string;
  setTopFiveCurtidasTotal: Dispatch<SetStateAction<number>>;
  setTopFiveCurtidoPorMim: Dispatch<SetStateAction<boolean>>;
}) {
  useEffect(() => {
    const perfilAutorIdSeguro = perfilAutorId.trim();
    let cancelado = false;

    async function atualizarCurtidasTopFive() {
      if (!perfilAutorIdSeguro) {
        setTopFiveCurtidasTotal(0);
        setTopFiveCurtidoPorMim(false);
        return;
      }

      const estadoLocal = carregarCurtidasTopFiveLocais(
        perfilAutorIdSeguro,
        usuarioIdLogado,
      );

      setTopFiveCurtidasTotal(estadoLocal.total);
      setTopFiveCurtidoPorMim(estadoLocal.curtiu);

      const estadoRemoto = await carregarCurtidasTopFivePerfil(
        perfilAutorIdSeguro,
        usuarioIdLogado,
      );

      if (cancelado) {
        return;
      }

      setTopFiveCurtidasTotal(estadoRemoto.total);
      setTopFiveCurtidoPorMim(estadoRemoto.curtiu);
    }

    const atualizarCurtidasTimer = window.setTimeout(() => {
      void atualizarCurtidasTopFive();
    }, 0);

    if (perfilAutorIdSeguro) {
      window.addEventListener("focus", atualizarCurtidasTopFive);
      window.addEventListener("storage", atualizarCurtidasTopFive);
    }

    return () => {
      cancelado = true;
      window.clearTimeout(atualizarCurtidasTimer);
      window.removeEventListener("focus", atualizarCurtidasTopFive);
      window.removeEventListener("storage", atualizarCurtidasTopFive);
    };
  }, [
    perfilAutorId,
    usuarioIdLogado,
    setTopFiveCurtidasTotal,
    setTopFiveCurtidoPorMim,
  ]);
}
