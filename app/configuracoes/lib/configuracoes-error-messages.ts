import type { HistorietasLanguage } from "../../../lib/i18n";
import { textoIdioma } from "./configuracoes-search-utils";

export function traduzirErroSenhaConfiguracoes(
  mensagem: string,
  language: HistorietasLanguage,
) {
  const mensagemNormalizada = mensagem.toLowerCase();

  if (
    mensagemNormalizada.includes("invalid login credentials") ||
    mensagemNormalizada.includes("current password") ||
    mensagemNormalizada.includes("incorrect password") ||
    mensagemNormalizada.includes("invalid password")
  ) {
    return textoIdioma(
      language,
      "A senha atual está incorreta.",
      "The current password is incorrect.",
      "La contraseña actual es incorrecta.",
    );
  }

  if (
    mensagemNormalizada.includes("same password") ||
    mensagemNormalizada.includes("different from the old password") ||
    mensagemNormalizada.includes("new password should be different")
  ) {
    return textoIdioma(
      language,
      "A nova senha precisa ser diferente da senha atual.",
      "The new password must be different from the current password.",
      "La nueva contraseña debe ser diferente de la contraseña actual.",
    );
  }

  if (
    mensagemNormalizada.includes("weak password") ||
    mensagemNormalizada.includes("password should") ||
    mensagemNormalizada.includes("password must") ||
    mensagemNormalizada.includes("password is too short")
  ) {
    return textoIdioma(
      language,
      "A nova senha não atende aos requisitos de segurança.",
      "The new password does not meet the security requirements.",
      "La nueva contraseña no cumple los requisitos de seguridad.",
    );
  }

  if (
    mensagemNormalizada.includes("reauth") ||
    mensagemNormalizada.includes("nonce") ||
    mensagemNormalizada.includes("session")
  ) {
    return textoIdioma(
      language,
      "Por segurança, entre novamente na conta e tente alterar a senha.",
      "For security, sign in again and try changing the password.",
      "Por seguridad, inicia sesión de nuevo e intenta cambiar la contraseña.",
    );
  }

  return textoIdioma(
    language,
    "Não foi possível alterar a senha agora.",
    "The password could not be changed right now.",
    "No se pudo cambiar la contraseña ahora.",
  );
}

export function traduzirErroUsernameConfiguracoes(
  mensagem: string,
  language: HistorietasLanguage,
) {
  const mensagemNormalizada = mensagem.toLowerCase();

  if (
    mensagemNormalizada.includes("profiles_username_unique") ||
    mensagemNormalizada.includes("duplicate") ||
    mensagemNormalizada.includes("unique")
  ) {
    return textoIdioma(
      language,
      "Esse @username já está em uso.",
      "This @username is already in use.",
      "Este @username ya está en uso.",
    );
  }

  return textoIdioma(
    language,
    "Não consegui salvar esse @username agora.",
    "I could not save this @username right now.",
    "No pude guardar este @username ahora.",
  );
}
