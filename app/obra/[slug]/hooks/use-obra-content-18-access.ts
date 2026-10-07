import { useEffect, useState } from "react";
import {
  acessoConteudo18Confirmado,
  ehClassificacao18,
} from "../../../../lib/historietasAdultContent";
import type { ObraDinamica } from "../lib/obra-data-utils";

type ControleAcesso18 = {
  obraId: string;
  status: "verificando" | "permitido" | "bloqueado";
};

export function useObraContent18Access(obra: ObraDinamica | null) {
  const [controleAcesso18, setControleAcesso18] = useState<ControleAcesso18>({
    obraId: "",
    status: "verificando",
  });

  const statusAcesso18 =
    obra && controleAcesso18.obraId === obra.id
      ? controleAcesso18.status
      : "verificando";

  useEffect(() => {
    const atualizarAcessoTimer = window.setTimeout(() => {
      if (!obra) {
        setControleAcesso18({ obraId: "", status: "verificando" });
        return;
      }

      const proximoStatus = !ehClassificacao18(obra.classificacaoIndicativa)
        ? "permitido"
        : acessoConteudo18Confirmado()
          ? "permitido"
          : "bloqueado";

      setControleAcesso18((controleAtual) => {
        if (
          controleAtual.obraId === obra.id &&
          controleAtual.status === proximoStatus
        ) {
          return controleAtual;
        }

        return { obraId: obra.id, status: proximoStatus };
      });
    }, 0);

    return () => {
      window.clearTimeout(atualizarAcessoTimer);
    };
  }, [obra]);

  function permitirAcesso18Atual() {
    if (!obra) {
      return;
    }

    setControleAcesso18({ obraId: obra.id, status: "permitido" });
  }

  return { statusAcesso18, permitirAcesso18Atual };
}
