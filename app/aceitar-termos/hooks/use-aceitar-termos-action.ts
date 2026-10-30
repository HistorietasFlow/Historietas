import type { Dispatch, SetStateAction } from "react";
import { registrarAceiteTermosPublicacao } from "../../../lib/aceiteTermos";
import type { ChaveTexto } from "../lib/aceitar-termos-translations";

type AceitarTermosRouter = {
  replace: (href: string) => void;
  refresh: () => void;
};

type UseAceitarTermosActionParams = {
  router: AceitarTermosRouter;
  salvando: boolean;
  confirmouTermos: boolean;
  confirmouPrivacidade: boolean;
  redirectTo: string;
  t: (chave: ChaveTexto) => string;
  setErro: Dispatch<SetStateAction<string>>;
  setSalvando: Dispatch<SetStateAction<boolean>>;
};

export function useAceitarTermosAction({
  router,
  salvando,
  confirmouTermos,
  confirmouPrivacidade,
  redirectTo,
  t,
  setErro,
  setSalvando,
}: UseAceitarTermosActionParams) {
  async function aceitar() {
    if (salvando) {
      return;
    }

    if (!confirmouTermos || !confirmouPrivacidade) {
      setErro(t("erroMarcar"));
      return;
    }

    setSalvando(true);
    setErro("");

    const resultado = await registrarAceiteTermosPublicacao();

    if (!resultado.aceito) {
      setErro(resultado.erro || t("erroLogin"));
      setSalvando(false);
      return;
    }

    router.replace(redirectTo);
    router.refresh();
  }

  return { aceitar };
}
