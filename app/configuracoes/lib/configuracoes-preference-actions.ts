import type { Dispatch, SetStateAction } from "react";
import {
  criarPreferenciaAtualizadaConfiguracoes,
  criarPreferenciasComAvisosAlternadosConfiguracoes,
} from "./configuracoes-account-preference-state-utils";
import type { PreferenciasConta } from "./configuracoes-account-models";
import { salvarPreferencias } from "./configuracoes-account-preferences";

export function atualizarPreferenciaConfiguracoes<
  K extends keyof PreferenciasConta,
>({
  campo,
  valor,
  setPreferencias,
}: {
  campo: K;
  valor: PreferenciasConta[K];
  setPreferencias: Dispatch<SetStateAction<PreferenciasConta>>;
}) {
  setPreferencias((preferenciasAtuais) =>
    criarPreferenciaAtualizadaConfiguracoes(
      preferenciasAtuais,
      campo,
      valor,
    ),
  );
}

export function alternarReceberAvisosConfiguracoes({
  preferencias,
  setPreferencias,
  usuarioIdLogado,
}: {
  preferencias: PreferenciasConta;
  setPreferencias: Dispatch<SetStateAction<PreferenciasConta>>;
  usuarioIdLogado: string;
}) {
  const preferenciasAtualizadas =
    criarPreferenciasComAvisosAlternadosConfiguracoes(preferencias);

  if (!usuarioIdLogado.trim() || !salvarPreferencias(preferenciasAtualizadas, usuarioIdLogado)) {
    return null;
  }
  setPreferencias(preferenciasAtualizadas);
  return preferenciasAtualizadas;
}
