import type { HistorietasLanguage } from "../../../lib/i18n";

import {
  obterCodigoErroAuth,
  obterMensagemErroAuth,
} from "./login-auth-error-utils";
import { traduzirLogin } from "./login-translations";

export function formatarErroAuth(
  error: unknown,
  language: HistorietasLanguage,
) {
  const mensagem = obterMensagemErroAuth(error);
  const codigo = obterCodigoErroAuth(error);
  const textoErro = [mensagem, codigo].filter(Boolean).join(" | ");
  const mensagemNormalizada = textoErro.toLowerCase();

  let mensagemAmigavel = traduzirLogin(language, "genericFailure");

  if (
    mensagemNormalizada.includes("invalid login credentials") ||
    mensagemNormalizada.includes("invalid credentials")
  ) {
    mensagemAmigavel = traduzirLogin(language, "invalidCredentials");
  } else if (mensagemNormalizada.includes("email not confirmed")) {
    mensagemAmigavel = traduzirLogin(language, "emailNotConfirmed");
  } else if (
    mensagemNormalizada.includes("user already registered") ||
    mensagemNormalizada.includes("already registered") ||
    mensagemNormalizada.includes("user_already_exists") ||
    mensagemNormalizada.includes("email_exists")
  ) {
    mensagemAmigavel = traduzirLogin(language, "alreadyRegistered");
  } else if (
    mensagemNormalizada.includes("signup") &&
    mensagemNormalizada.includes("disabled")
  ) {
    mensagemAmigavel = traduzirLogin(language, "signupDisabled");
  } else if (
    mensagemNormalizada.includes("database error") ||
    mensagemNormalizada.includes("saving new user") ||
    mensagemNormalizada.includes("unexpected_failure")
  ) {
    mensagemAmigavel = traduzirLogin(language, "databaseFailure");
  } else if (
    mensagemNormalizada.includes("password") ||
    mensagemNormalizada.includes("weak_password")
  ) {
    mensagemAmigavel = traduzirLogin(language, "weakPassword");
  } else if (mensagemNormalizada.includes("email")) {
    mensagemAmigavel = traduzirLogin(language, "invalidEmail");
  } else if (
    mensagemNormalizada.includes("failed to fetch") ||
    mensagemNormalizada.includes("network") ||
    mensagemNormalizada.includes("fetch")
  ) {
    mensagemAmigavel = traduzirLogin(language, "connectionFailure");
  }

  const technicalError = traduzirLogin(language, "technicalError");

  if (!textoErro) {
    return `${mensagemAmigavel} ${technicalError}: ${traduzirLogin(
      language,
      "unknownError",
    )}.`;
  }

  return `${mensagemAmigavel} ${technicalError}: ${textoErro}`;
}


