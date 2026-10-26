import type { LoginTranslationKey } from "./login-translations";

type ValidarFormularioLoginParams = {
  emailFinal: string;
  nomeFinal: string;
  senha: string;
  criandoConta: boolean;
  recuperandoSenha: boolean;
  aceitouTermos: boolean;
  cientePrivacidade: boolean;
};

export function validarFormularioLogin({
  emailFinal,
  nomeFinal,
  senha,
  criandoConta,
  recuperandoSenha,
  aceitouTermos,
  cientePrivacidade,
}: ValidarFormularioLoginParams): LoginTranslationKey | null {
  if (!emailFinal) {
    return "emailRequired";
  }

  if (
    criandoConta &&
    (senha.length < 8 ||
      !/[A-Za-zÀ-ÖØ-öø-ÿ]/.test(senha) ||
      !/\d/.test(senha))
  ) {
    return "signupPasswordRequirements";
  }

  if (!recuperandoSenha && !criandoConta && senha.length < 6) {
    return "passwordMin";
  }

  if (criandoConta && nomeFinal.length < 2) {
    return "displayNameMin";
  }

  if (criandoConta && (!aceitouTermos || !cientePrivacidade)) {
    return "consentRequired";
  }

  return null;
}
