import { useEffect, type Dispatch, type SetStateAction } from "react";
import { carregarTopFivePerfilAutor } from "../lib/profile-top-five-local-utils";

export function usePerfilAutorTopFiveStorageSync({
  perfilAutorId,
  usuarioIdLogado,
  setTopFiveObraIds,
}: {
  perfilAutorId: string;
  usuarioIdLogado: string;
  setTopFiveObraIds: Dispatch<SetStateAction<string[]>>;
}) {
  useEffect(() => {
    const topFiveUserId = perfilAutorId.trim() || usuarioIdLogado.trim();

    function atualizarTopFivePerfil() {
      setTopFiveObraIds(carregarTopFivePerfilAutor(topFiveUserId));
    }

    const atualizarTopFiveTimer = window.setTimeout(
      atualizarTopFivePerfil,
      0,
    );

    function atualizarQuandoVoltarParaTela() {
      if (document.visibilityState !== "hidden") {
        atualizarTopFivePerfil();
      }
    }

    window.addEventListener("focus", atualizarTopFivePerfil);
    window.addEventListener("storage", atualizarTopFivePerfil);
    document.addEventListener(
      "visibilitychange",
      atualizarQuandoVoltarParaTela,
    );

    return () => {
      window.clearTimeout(atualizarTopFiveTimer);
      window.removeEventListener("focus", atualizarTopFivePerfil);
      window.removeEventListener("storage", atualizarTopFivePerfil);
      document.removeEventListener(
        "visibilitychange",
        atualizarQuandoVoltarParaTela,
      );
    };
  }, [perfilAutorId, usuarioIdLogado]);
}
