import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { HistorietasLanguage } from "../../../lib/i18n";
import { supabase } from "../../../lib/supabase/client";
import { traduzirErroSenhaConfiguracoes } from "./configuracoes-error-messages";
import { validarAlteracaoSenhaConfiguracoes } from "./configuracoes-security-form-validation";
import type { TraduzirTextoConfiguracoes } from "./configuracoes-callback-types";

export async function alterarSenhaConfiguracoes({
  event,
  salvandoSenha,
  senhaAlterada,
  senhaAtual,
  novaSenha,
  confirmarNovaSenha,
  language,
  usuarioIdLogado,
  setSenhaAtual,
  setNovaSenha,
  setConfirmarNovaSenha,
  setSalvandoSenha,
  setErroSenha,
  setSenhaAlterada,
  traduzirTexto,
}: {
  event: FormEvent<HTMLFormElement>;
  salvandoSenha: boolean;
  senhaAlterada: boolean;
  senhaAtual: string;
  novaSenha: string;
  confirmarNovaSenha: string;
  language: HistorietasLanguage;
  usuarioIdLogado: string;
  setSenhaAtual: Dispatch<SetStateAction<string>>;
  setNovaSenha: Dispatch<SetStateAction<string>>;
  setConfirmarNovaSenha: Dispatch<SetStateAction<string>>;
  setSalvandoSenha: Dispatch<SetStateAction<boolean>>;
  setErroSenha: Dispatch<SetStateAction<string>>;
  setSenhaAlterada: Dispatch<SetStateAction<boolean>>;
  traduzirTexto: TraduzirTextoConfiguracoes;
}) {
  event.preventDefault();

  if (salvandoSenha || senhaAlterada) {
    return;
  }

  setErroSenha("");

  const erroValidacao = validarAlteracaoSenhaConfiguracoes(
    senhaAtual,
    novaSenha,
    confirmarNovaSenha,
    language,
  );

  if (erroValidacao) {
    setErroSenha(erroValidacao);
    return;
  }

  setSalvandoSenha(true);

  try {
    const { data: dadosUsuario, error: erroUsuario } =
      await supabase.auth.getUser();

    if (
      erroUsuario ||
      !dadosUsuario.user ||
      dadosUsuario.user.id !== usuarioIdLogado
    ) {
      setErroSenha(
        traduzirTexto(
          "Sua sessão expirou. Entre novamente na conta.",
          "Your session has expired. Sign in again.",
          "Tu sesión expiró. Inicia sesión de nuevo.",
        ),
      );
      return;
    }

    const emailUsuario = dadosUsuario.user.email?.trim().toLowerCase() || "";

    if (!emailUsuario) {
      setErroSenha(
        traduzirTexto(
          "Não foi possível confirmar o e-mail da sua conta. Entre novamente e tente de novo.",
          "Your account email could not be confirmed. Sign in again and try once more.",
          "No se pudo confirmar el correo de tu cuenta. Inicia sesión de nuevo e inténtalo otra vez.",
        ),
      );
      return;
    }

    const { data: autenticacaoSenhaAtual, error: erroSenhaAtual } =
      await supabase.auth.signInWithPassword({
        email: emailUsuario,
        password: senhaAtual,
      });

    if (
      erroSenhaAtual ||
      !autenticacaoSenhaAtual.user ||
      autenticacaoSenhaAtual.user.id !== usuarioIdLogado
    ) {
      setErroSenha(
        traduzirErroSenhaConfiguracoes(
          erroSenhaAtual?.message || "invalid login credentials",
          language,
        ),
      );
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: novaSenha,
    });

    if (error) {
      setErroSenha(traduzirErroSenhaConfiguracoes(error.message, language));
      return;
    }

    setSenhaAtual("");
    setNovaSenha("");
    setConfirmarNovaSenha("");
    setSenhaAlterada(true);
  } catch (error) {
    setErroSenha(
      traduzirErroSenhaConfiguracoes(
        error instanceof Error ? error.message : "",
        language,
      ),
    );
  } finally {
    setSalvandoSenha(false);
  }
}
