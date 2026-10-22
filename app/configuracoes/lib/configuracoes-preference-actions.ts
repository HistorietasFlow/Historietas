import type { Dispatch, SetStateAction } from "react";
import {
  criarPreferenciaAtualizadaConfiguracoes,
  criarPreferenciasComAvisosAlternadosConfiguracoes,
} from "./configuracoes-account-preference-state-utils";
import type { PreferenciasConta } from "./configuracoes-account-models";
import { salvarPreferencias } from "./configuracoes-account-preferences";
import {
  salvarPreferenciasPrivacidade,
} from "./configuracoes-privacy-preferences";
import type { PreferenciasPrivacidadeHistorietas } from "./configuracoes-privacy-preferences";
import type {
  LimparMensagemAcaoConfiguracoes,
  MostrarMensagemAcaoConfiguracoes,
  TraduzirTextoConfiguracoes,
} from "./configuracoes-callback-types";

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

  setPreferencias(preferenciasAtualizadas);

  if (usuarioIdLogado) {
    salvarPreferencias(preferenciasAtualizadas, usuarioIdLogado);
  }
}

export function aplicarPrivacidadeAtualizadaConfiguracoes({
  privacidadeAtualizada,
  setPrivacidade,
  setMensagemAcao,
  usuarioIdLogado,
  mostrarMensagemAcao,
  traduzirTexto,
}: {
  privacidadeAtualizada: PreferenciasPrivacidadeHistorietas;
  setPrivacidade: Dispatch<SetStateAction<PreferenciasPrivacidadeHistorietas>>;
  setMensagemAcao: LimparMensagemAcaoConfiguracoes;
  usuarioIdLogado: string;
  mostrarMensagemAcao: MostrarMensagemAcaoConfiguracoes;
  traduzirTexto: TraduzirTextoConfiguracoes;
}) {
  setPrivacidade(privacidadeAtualizada);
  setMensagemAcao(null);

  const userIdSeguro = usuarioIdLogado.trim();

  if (!userIdSeguro) {
    mostrarMensagemAcao(
      "aviso",
      traduzirTexto(
        "A preferência ficou salva apenas neste aparelho porque sua conta não pôde ser confirmada.",
        "The preference was saved only on this device because your account could not be confirmed.",
        "La preferencia se guardó solo en este dispositivo porque no se pudo confirmar tu cuenta.",
      ),
    );
    return;
  }

  void salvarPreferenciasPrivacidade(
    privacidadeAtualizada,
    userIdSeguro,
  )
    .then((resultado) => {
      if (resultado.ok) {
        return;
      }

      console.warn(
        "A privacidade ficou salva neste aparelho, mas não sincronizou:",
        resultado.erro,
      );

      mostrarMensagemAcao(
        "aviso",
        traduzirTexto(
          "A preferência foi salva neste aparelho, mas não sincronizou com sua conta. Verifique sua conexão e tente novamente.",
          "The preference was saved on this device, but it did not sync with your account. Check your connection and try again.",
          "La preferencia se guardó en este dispositivo, pero no se sincronizó con tu cuenta. Comprueba tu conexión e inténtalo de nuevo.",
        ),
      );
    })
    .catch((error) => {
      console.warn(
        "Não foi possível sincronizar a preferência de privacidade:",
        error,
      );

      mostrarMensagemAcao(
        "aviso",
        traduzirTexto(
          "A preferência foi salva neste aparelho, mas não sincronizou com sua conta. Verifique sua conexão e tente novamente.",
          "The preference was saved on this device, but it did not sync with your account. Check your connection and try again.",
          "La preferencia se guardó en este dispositivo, pero no se sincronizó con tu cuenta. Comprueba tu conexión e inténtalo de nuevo.",
        ),
      );
    });
}
