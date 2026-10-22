import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { HistorietasLanguage } from "../../../lib/i18n";
import { supabase } from "../../../lib/supabase/client";
import { limparDadosLocaisContaExcluida } from "./configuracoes-account-deletion-local-cleanup";
import { traduzirErroExclusaoContaConfiguracoes } from "./configuracoes-account-deletion-error-messages";
import { validarExclusaoContaConfiguracoes } from "./configuracoes-security-form-validation";
import type { TraduzirTextoConfiguracoes } from "./configuracoes-callback-types";
import type {
  AtualizarRotaConfiguracoes,
  RedirecionarLoginConfiguracoes,
} from "./configuracoes-navigation-types";

export async function excluirContaConfiguracoes({
  event,
  excluindoConta,
  senhaExclusaoConta,
  confirmacaoExclusaoConta,
  language,
  usuarioIdLogado,
  setErroExclusaoConta,
  setExcluindoConta,
  redirecionarLogin,
  atualizarRota,
  traduzirTexto,
}: {
  event: FormEvent<HTMLFormElement>;
  excluindoConta: boolean;
  senhaExclusaoConta: string;
  confirmacaoExclusaoConta: string;
  language: HistorietasLanguage;
  usuarioIdLogado: string;
  setErroExclusaoConta: Dispatch<SetStateAction<string>>;
  setExcluindoConta: Dispatch<SetStateAction<boolean>>;
  redirecionarLogin: RedirecionarLoginConfiguracoes;
  atualizarRota: AtualizarRotaConfiguracoes;
  traduzirTexto: TraduzirTextoConfiguracoes;
}) {
  event.preventDefault();

  if (excluindoConta) {
    return;
  }

  setErroExclusaoConta("");

  const erroValidacao = validarExclusaoContaConfiguracoes(
    senhaExclusaoConta,
    confirmacaoExclusaoConta,
    language,
  );

  if (erroValidacao) {
    setErroExclusaoConta(erroValidacao);
    return;
  }

  setExcluindoConta(true);

  try {
    const response = await fetch("/api/conta/excluir", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        senha: senhaExclusaoConta,
        confirmacao: "EXCLUIR",
      }),
    });
    const data = (await response.json().catch(() => null)) as
      | { ok?: boolean; codigo?: string; mensagem?: string }
      | null;

    if (!response.ok || !data?.ok) {
      setErroExclusaoConta(
        traduzirErroExclusaoContaConfiguracoes(
          data?.codigo || "",
          data?.mensagem ||
            traduzirTexto(
              "Não foi possível excluir sua conta agora.",
              "Your account could not be deleted right now.",
              "No se pudo eliminar tu cuenta ahora.",
            ),
          language,
        ),
      );
      return;
    }

    limparDadosLocaisContaExcluida(usuarioIdLogado);

    try {
      await supabase.auth.signOut();
    } catch {
      // A conta já foi removida no servidor.
    }

    redirecionarLogin();
    atualizarRota();
  } catch {
    setErroExclusaoConta(
      traduzirTexto(
        "Não foi possível excluir sua conta agora. Verifique sua conexão e tente novamente.",
        "Your account could not be deleted right now. Check your connection and try again.",
        "No se pudo eliminar tu cuenta ahora. Revisa tu conexión e inténtalo de nuevo.",
      ),
    );
  } finally {
    setExcluindoConta(false);
  }
}
