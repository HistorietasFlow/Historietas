import type { HistorietasLanguage } from "../../../lib/i18n";

export type TranslationKey =
  | "backHome"
  | "title"
  | "description"
  | "checking"
  | "invalidTitle"
  | "invalidDescription"
  | "requestNewLink"
  | "newPassword"
  | "confirmPassword"
  | "passwordPlaceholder"
  | "confirmPlaceholder"
  | "saving"
  | "savePassword"
  | "passwordMin"
  | "passwordComposition"
  | "passwordMismatch"
  | "sessionInvalid"
  | "genericError";

export const TRANSLATIONS: Record<
  HistorietasLanguage,
  Record<TranslationKey, string>
> = {
  "pt-BR": {
    backHome: "Voltar para a página inicial",
    title: "CRIAR NOVA SENHA",
    description:
      "Escolha uma senha forte. Ela precisa ter pelo menos 8 caracteres, incluindo uma letra e um número.",
    checking: "Validando seu link de recuperação...",
    invalidTitle: "LINK INVÁLIDO OU EXPIRADO",
    invalidDescription:
      "Este link não pode mais ser usado. Solicite um novo link de recuperação na página de login.",
    requestNewLink: "SOLICITAR NOVO LINK",
    newPassword: "Nova senha",
    confirmPassword: "Confirmar nova senha",
    passwordPlaceholder: "Mínimo de 8 caracteres",
    confirmPlaceholder: "Digite novamente a nova senha",
    saving: "Salvando...",
    savePassword: "SALVAR NOVA SENHA",
    passwordMin: "A nova senha precisa ter pelo menos 8 caracteres.",
    passwordComposition: "Use pelo menos uma letra e um número.",
    passwordMismatch: "A confirmação não corresponde à nova senha.",
    sessionInvalid:
      "Não foi possível validar a recuperação. O link pode ter expirado ou já ter sido usado.",
    genericError: "Não foi possível redefinir a senha agora.",
  },

  en: {
    backHome: "Back to the home page",
    title: "CREATE A NEW PASSWORD",
    description:
      "Choose a strong password. It must be at least 8 characters long and include a letter and a number.",
    checking: "Validating your recovery link...",
    invalidTitle: "INVALID OR EXPIRED LINK",
    invalidDescription:
      "This link can no longer be used. Request a new recovery link from the sign-in page.",
    requestNewLink: "REQUEST A NEW LINK",
    newPassword: "New password",
    confirmPassword: "Confirm new password",
    passwordPlaceholder: "At least 8 characters",
    confirmPlaceholder: "Enter the new password again",
    saving: "Saving...",
    savePassword: "SAVE NEW PASSWORD",
    passwordMin: "The new password must be at least 8 characters long.",
    passwordComposition: "Use at least one letter and one number.",
    passwordMismatch: "The confirmation does not match the new password.",
    sessionInvalid:
      "The recovery session could not be validated. The link may have expired or already been used.",
    genericError: "The password could not be reset right now.",
  },

  es: {
    backHome: "Volver a la página de inicio",
    title: "CREAR NUEVA CONTRASEÑA",
    description:
      "Elige una contraseña segura. Debe tener al menos 8 caracteres e incluir una letra y un número.",
    checking: "Validando el enlace de recuperación...",
    invalidTitle: "ENLACE INVÁLIDO O VENCIDO",
    invalidDescription:
      "Este enlace ya no puede usarse. Solicita un nuevo enlace de recuperación en la página de inicio de sesión.",
    requestNewLink: "SOLICITAR NUEVO ENLACE",
    newPassword: "Nueva contraseña",
    confirmPassword: "Confirmar nueva contraseña",
    passwordPlaceholder: "Mínimo 8 caracteres",
    confirmPlaceholder: "Escribe nuevamente la nueva contraseña",
    saving: "Guardando...",
    savePassword: "GUARDAR NUEVA CONTRASEÑA",
    passwordMin: "La nueva contraseña debe tener al menos 8 caracteres.",
    passwordComposition: "Usa al menos una letra y un número.",
    passwordMismatch: "La confirmación no coincide con la nueva contraseña.",
    sessionInvalid:
      "No se pudo validar la recuperación. El enlace puede haber vencido o ya haber sido usado.",
    genericError: "No se pudo restablecer la contraseña ahora.",
  },
};
