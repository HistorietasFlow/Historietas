import type { HistorietasLanguage } from "../../../lib/i18n";

export type LoginTranslationKey =
  | "backHome"
  | "signInTitle"
  | "createAccountTitle"
  | "description"
  | "signInTab"
  | "createAccountTab"
  | "displayName"
  | "displayNamePlaceholder"
  | "email"
  | "password"
  | "passwordPlaceholder"
  | "signupPasswordPlaceholder"
  | "wait"
  | "create"
  | "signIn"
  | "helperText"
  | "emailRequired"
  | "passwordMin"
  | "signupPasswordRequirements"
  | "displayNameMin"
  | "accountCreationNotConfirmed"
  | "accountCreatedNotice"
  | "sessionNotConfirmed"
  | "genericFailure"
  | "invalidCredentials"
  | "emailNotConfirmed"
  | "alreadyRegistered"
  | "signupDisabled"
  | "databaseFailure"
  | "weakPassword"
  | "invalidEmail"
  | "connectionFailure"
  | "technicalError"
  | "unknownError"
  | "forgotPassword"
  | "recoveryTitle"
  | "recoveryDescription"
  | "sendRecoveryLink"
  | "backToSignIn"
  | "recoveryHelperText"
  | "recoveryEmailSent"
  | "passwordChangedNotice"
  | "acceptTermsPrefix"
  | "termsLink"
  | "guidelinesLink"
  | "and"
  | "privacyPrefix"
  | "privacyLink"
  | "consentRequired"
  | "profileSyncWarning";

export const LOGIN_TRANSLATIONS: Record<
  HistorietasLanguage,
  Record<LoginTranslationKey, string>
> = {
  "pt-BR": {
    backHome: "Voltar para a página inicial",
    signInTitle: "FAZER LOGIN",
    createAccountTitle: "CRIAR CONTA",
    description:
      "Acesse sua conta para publicar histórias, salvar o progresso, acompanhar obras e continuar construindo seu perfil de autor na Historietas.",
    signInTab: "ENTRAR",
    createAccountTab: "CRIAR CONTA",
    displayName: "Nome de exibição",
    displayNamePlaceholder: "Ex.: Nome do Autor",
    email: "E-mail",
    password: "Senha",
    passwordPlaceholder: "Mínimo de 6 caracteres",
    signupPasswordPlaceholder: "Mínimo de 8 caracteres, com letra e número",
    wait: "Aguarde...",
    create: "CRIAR",
    signIn: "ENTRAR",
    helperText:
      "Use seu e-mail e senha para acessar sua conta. Ao criar uma conta, confira os dados antes de continuar.",
    emailRequired: "Digite seu e-mail.",
    passwordMin: "A senha precisa ter pelo menos 6 caracteres.",
    signupPasswordRequirements:
      "A senha precisa ter pelo menos 8 caracteres, incluindo uma letra e um número.",
    displayNameMin:
      "Digite um nome de exibição com pelo menos 2 caracteres.",
    accountCreationNotConfirmed:
      "Não consegui confirmar a criação da conta.",
    accountCreatedNotice:
      "Conta criada. Confira seu e-mail para confirmar o cadastro e depois entre.",
    sessionNotConfirmed: "Não consegui confirmar sua sessão.",
    genericFailure: "Não foi possível concluir agora.",
    invalidCredentials: "E-mail ou senha incorretos.",
    emailNotConfirmed: "Confirme seu e-mail antes de entrar.",
    alreadyRegistered:
      "Já existe uma conta com este e-mail. Use Entrar ou recupere a senha.",
    signupDisabled: "O cadastro por e-mail está desativado no Supabase.",
    databaseFailure:
      "O Supabase recusou o cadastro por um erro no banco, gatilho ou perfil.",
    weakPassword: "A senha não atende aos requisitos necessários.",
    invalidEmail: "Verifique o e-mail informado.",
    connectionFailure: "Não consegui conectar ao Supabase agora.",
    technicalError: "Erro técnico",
    unknownError: "erro desconhecido",
    forgotPassword: "Esqueci minha senha",
    recoveryTitle: "RECUPERAR SENHA",
    recoveryDescription:
      "Digite o e-mail da sua conta. Enviaremos um link para você criar uma nova senha.",
    sendRecoveryLink: "ENVIAR LINK DE RECUPERAÇÃO",
    backToSignIn: "VOLTAR PARA ENTRAR",
    recoveryHelperText:
      "Por segurança, a mensagem será a mesma mesmo que não exista uma conta com o e-mail informado.",
    recoveryEmailSent:
      "Se existir uma conta com este e-mail, você receberá um link de recuperação. Verifique também a caixa de spam.",
    passwordChangedNotice:
      "Senha redefinida com sucesso. Entre usando sua nova senha.",
    acceptTermsPrefix: "Li e aceito os",
    termsLink: "Termos de Uso",
    guidelinesLink: "Diretrizes da Comunidade",
    and: "e as",
    privacyPrefix: "Li e estou ciente da",
    privacyLink: "Política de Privacidade",
    consentRequired:
      "Para criar a conta, aceite os Termos e as Diretrizes e confirme que leu a Política de Privacidade.",
    profileSyncWarning:
      "Sua conta foi acessada, mas o perfil não pôde ser sincronizado agora. Tentaremos novamente automaticamente no próximo acesso.",
  },
  en: {
    backHome: "Back to the home page",
    signInTitle: "SIGN IN",
    createAccountTitle: "CREATE ACCOUNT",
    description:
      "Sign in to publish stories, save your progress, follow works, and keep building your author profile on Historietas.",
    signInTab: "SIGN IN",
    createAccountTab: "CREATE ACCOUNT",
    displayName: "Display name",
    displayNamePlaceholder: "Example: Author Name",
    email: "Email",
    password: "Password",
    passwordPlaceholder: "At least 6 characters",
    signupPasswordPlaceholder: "At least 8 characters, with a letter and a number",
    wait: "Please wait...",
    create: "CREATE",
    signIn: "SIGN IN",
    helperText:
      "Use your email and password to access your account. When creating an account, check your details before continuing.",
    emailRequired: "Enter your email address.",
    passwordMin: "Your password must be at least 6 characters long.",
    signupPasswordRequirements:
      "Your password must be at least 8 characters long and include a letter and a number.",
    displayNameMin: "Enter a display name with at least 2 characters.",
    accountCreationNotConfirmed:
      "The account creation could not be confirmed.",
    accountCreatedNotice:
      "Account created. Check your email to confirm your registration, then sign in.",
    sessionNotConfirmed: "Your session could not be confirmed.",
    genericFailure: "The request could not be completed right now.",
    invalidCredentials: "Incorrect email or password.",
    emailNotConfirmed: "Confirm your email before signing in.",
    alreadyRegistered:
      "An account with this email already exists. Sign in or recover your password.",
    signupDisabled: "Email sign-up is disabled in Supabase.",
    databaseFailure:
      "Supabase rejected the sign-up because of a database, trigger, or profile error.",
    weakPassword: "The password does not meet the required criteria.",
    invalidEmail: "Check the email address you entered.",
    connectionFailure: "Supabase could not be reached right now.",
    technicalError: "Technical error",
    unknownError: "unknown error",
    forgotPassword: "Forgot my password",
    recoveryTitle: "RECOVER PASSWORD",
    recoveryDescription:
      "Enter your account email. We will send you a link to create a new password.",
    sendRecoveryLink: "SEND RECOVERY LINK",
    backToSignIn: "BACK TO SIGN IN",
    recoveryHelperText:
      "For security, the message will be the same even if there is no account with the email provided.",
    recoveryEmailSent:
      "If an account exists with this email, you will receive a recovery link. Also check your spam folder.",
    passwordChangedNotice:
      "Password reset successfully. Sign in using your new password.",
    acceptTermsPrefix: "I have read and accept the",
    termsLink: "Terms of Use",
    guidelinesLink: "Community Guidelines",
    and: "and",
    privacyPrefix: "I have read and acknowledge the",
    privacyLink: "Privacy Policy",
    consentRequired:
      "To create the account, accept the Terms and Guidelines and confirm that you have read the Privacy Policy.",
    profileSyncWarning:
      "Your account was accessed, but the profile could not be synchronized right now. We will automatically try again the next time you sign in.",
  },
  es: {
    backHome: "Volver a la página de inicio",
    signInTitle: "INICIAR SESIÓN",
    createAccountTitle: "CREAR CUENTA",
    description:
      "Accede a tu cuenta para publicar historias, guardar tu progreso, seguir obras y continuar construyendo tu perfil de autor en Historietas.",
    signInTab: "ENTRAR",
    createAccountTab: "CREAR CUENTA",
    displayName: "Nombre para mostrar",
    displayNamePlaceholder: "Ej.: Nombre del Autor",
    email: "Correo electrónico",
    password: "Contraseña",
    passwordPlaceholder: "Mínimo 6 caracteres",
    signupPasswordPlaceholder: "Mínimo 8 caracteres, con una letra y un número",
    wait: "Espera...",
    create: "CREAR",
    signIn: "ENTRAR",
    helperText:
      "Usa tu correo y contraseña para acceder a tu cuenta. Al crear una cuenta, revisa tus datos antes de continuar.",
    emailRequired: "Escribe tu correo electrónico.",
    passwordMin: "La contraseña debe tener al menos 6 caracteres.",
    signupPasswordRequirements:
      "La contraseña debe tener al menos 8 caracteres e incluir una letra y un número.",
    displayNameMin:
      "Escribe un nombre para mostrar de al menos 2 caracteres.",
    accountCreationNotConfirmed:
      "No se pudo confirmar la creación de la cuenta.",
    accountCreatedNotice:
      "Cuenta creada. Revisa tu correo para confirmar el registro y luego inicia sesión.",
    sessionNotConfirmed: "No se pudo confirmar tu sesión.",
    genericFailure: "No fue posible completar la solicitud ahora.",
    invalidCredentials: "Correo o contraseña incorrectos.",
    emailNotConfirmed: "Confirma tu correo antes de iniciar sesión.",
    alreadyRegistered:
      "Ya existe una cuenta con este correo. Inicia sesión o recupera la contraseña.",
    signupDisabled: "El registro por correo está desactivado en Supabase.",
    databaseFailure:
      "Supabase rechazó el registro por un error en la base de datos, el trigger o el perfil.",
    weakPassword: "La contraseña no cumple los requisitos necesarios.",
    invalidEmail: "Revisa el correo electrónico ingresado.",
    connectionFailure: "No se pudo conectar con Supabase ahora.",
    technicalError: "Error técnico",
    unknownError: "error desconocido",
    forgotPassword: "Olvidé mi contraseña",
    recoveryTitle: "RECUPERAR CONTRASEÑA",
    recoveryDescription:
      "Escribe el correo de tu cuenta. Te enviaremos un enlace para crear una nueva contraseña.",
    sendRecoveryLink: "ENVIAR ENLACE DE RECUPERACIÓN",
    backToSignIn: "VOLVER A INICIAR SESIÓN",
    recoveryHelperText:
      "Por seguridad, el mensaje será el mismo aunque no exista una cuenta con el correo indicado.",
    recoveryEmailSent:
      "Si existe una cuenta con este correo, recibirás un enlace de recuperación. Revisa también la carpeta de spam.",
    passwordChangedNotice:
      "Contraseña restablecida correctamente. Inicia sesión con tu nueva contraseña.",
    acceptTermsPrefix: "He leído y acepto los",
    termsLink: "Términos de Uso",
    guidelinesLink: "Normas de la Comunidad",
    and: "y las",
    privacyPrefix: "He leído y conozco la",
    privacyLink: "Política de Privacidad",
    consentRequired:
      "Para crear la cuenta, acepta los Términos y las Normas y confirma que leíste la Política de Privacidad.",
    profileSyncWarning:
      "Se accedió a tu cuenta, pero el perfil no pudo sincronizarse ahora. Lo intentaremos de nuevo automáticamente en el próximo acceso.",
  },
};

export function traduzirLogin(
  language: HistorietasLanguage,
  key: LoginTranslationKey,
) {
  return LOGIN_TRANSLATIONS[language][key];
}


