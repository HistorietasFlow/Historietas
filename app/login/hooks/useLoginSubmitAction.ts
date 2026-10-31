import type { FormEvent } from "react";
import type { HistorietasLanguage } from "../../../lib/i18n";
import { registrarAceiteTermosPublicacao } from "../../../lib/aceiteTermos";
import { criarContaLogin } from "../actions/criar-conta-login";
import { entrarComSenhaLogin } from "../actions/entrar-com-senha-login";
import { finalizarAutenticacaoLogin } from "../actions/finalizar-autenticacao-login";
import { solicitarRecuperacaoSenhaLogin } from "../actions/solicitar-recuperacao-senha-login";
import { formatarErroAuth } from "../lib/login-auth-error-formatter";
import { prepararFormularioLogin } from "../lib/login-form-preparation";
import { validarFormularioLogin } from "../lib/login-form-validation";
import { aguardarLogin } from "../lib/login-timing-utils";
import type { LoginTranslationKey } from "../lib/login-translations";

type UseLoginSubmitActionParams = {
  router: {
    replace: (href: string) => void;
    refresh: () => void;
  };
  language: HistorietasLanguage;
  t: (key: LoginTranslationKey) => string;
  email: string;
  nome: string;
  senha: string;
  criandoConta: boolean;
  recuperandoSenha: boolean;
  aceitouTermos: boolean;
  cientePrivacidade: boolean;
  carregando: boolean;
  salvarProfile: (
    userId: string,
    nomeInformado: string,
    emailInformado: string,
    userMetadata?: Record<string, unknown> | null,
  ) => Promise<{ ok: boolean }>;
  setModo: (modo: "entrar" | "criar" | "recuperar") => void;
  setSenha: (senha: string) => void;
  setAceitouTermos: (aceitouTermos: boolean) => void;
  setCientePrivacidade: (cientePrivacidade: boolean) => void;
  setCarregando: (carregando: boolean) => void;
  setErro: (erro: string) => void;
  setAviso: (aviso: string) => void;
};

export function useLoginSubmitAction({
  router,
  language,
  t,
  email,
  nome,
  senha,
  criandoConta,
  recuperandoSenha,
  aceitouTermos,
  cientePrivacidade,
  carregando,
  salvarProfile,
  setModo,
  setSenha,
  setAceitouTermos,
  setCientePrivacidade,
  setCarregando,
  setErro,
  setAviso,
}: UseLoginSubmitActionParams) {
  async function enviarFormulario(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (carregando) {
      return;
    }

    setErro("");
    setAviso("");

    const { emailFinal, nomeFinal } = prepararFormularioLogin(email, nome);
    const chaveErro = validarFormularioLogin({
      emailFinal,
      nomeFinal,
      senha,
      criandoConta,
      recuperandoSenha,
      aceitouTermos,
      cientePrivacidade,
    });

    if (chaveErro) {
      setErro(t(chaveErro));
      return;
    }

    setCarregando(true);

    try {
      if (recuperandoSenha) {
        const resultadoRecuperacao =
          await solicitarRecuperacaoSenhaLogin(emailFinal);

        if (!resultadoRecuperacao.ok) {
          setErro(t("genericFailure"));
          return;
        }

        setAviso(t("recoveryEmailSent"));
        return;
      }

      if (criandoConta) {
        const { data, error } = await criarContaLogin({
          emailFinal,
          senha,
          nomeFinal,
        });

        if (error) {
          setErro(formatarErroAuth(error, language));
          return;
        }

        if (!data.user) {
          setErro(t("accountCreationNotConfirmed"));
          return;
        }

        if (data.session) {
          const resultadoPerfil = await salvarProfile(
            data.user.id,
            nomeFinal,
            data.user.email || emailFinal,
            data.user.user_metadata,
          );

          if (!resultadoPerfil.ok) {
            setErro(t("profileSyncWarning"));
            await aguardarLogin(1600);
          } else {
            const resultadoAceite =
              await registrarAceiteTermosPublicacao();

            if (!resultadoAceite.aceito) {
              setErro(
                resultadoAceite.erro ||
                  "Nao foi possivel registrar o aceite dos termos.",
              );
              return;
            }
          }

          finalizarAutenticacaoLogin({ userId: data.user.id, router });
          return;
        }

        setModo("entrar");
        setSenha("");
        setAceitouTermos(false);
        setCientePrivacidade(false);
        setAviso(t("accountCreatedNotice"));
        return;
      }

      const { data, error } = await entrarComSenhaLogin({
        emailFinal,
        senha,
      });

      if (error) {
        setErro(formatarErroAuth(error, language));
        return;
      }

      if (!data.user) {
        setErro(t("sessionNotConfirmed"));
        return;
      }

      const resultadoPerfil = await salvarProfile(
        data.user.id,
        "",
        data.user.email || emailFinal,
        data.user.user_metadata,
      );

      if (!resultadoPerfil.ok) {
        setErro(t("profileSyncWarning"));
        await aguardarLogin(1600);
      }

      finalizarAutenticacaoLogin({ userId: data.user.id, router });
    } catch (error) {
      setErro(formatarErroAuth(error, language));
    } finally {
      setCarregando(false);
    }
  }

  return { enviarFormulario };
}
