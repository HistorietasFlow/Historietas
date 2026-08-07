"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import { supabase } from "../../lib/supabase/client";
import { historietasThemeCss, useHistorietasTheme } from "../../lib/historietasTheme";
import LanguageSelect from "../../components/LanguageSelect";
import { useHistorietasLanguage } from "../../components/HistorietasLanguageProvider";
import type { HistorietasLanguage } from "../../lib/i18n";
import {
  criarMetadataAceiteTermos,
  DIRETRIZES_COMUNIDADE_VERSAO_ATUAL,
  POLITICA_PRIVACIDADE_VERSAO_ATUAL,
  TERMOS_USO_VERSAO_ATUAL,
} from "../../lib/aceiteTermos";

type ModoAuth = "entrar" | "criar" | "recuperar";

type LoginTranslationKey =
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

const LOGIN_TRANSLATIONS: Record<
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

function traduzirLogin(
  language: HistorietasLanguage,
  key: LoginTranslationKey,
) {
  return LOGIN_TRANSLATIONS[language][key];
}

const STORAGE_KEY = "historietas-obras";
const FAVORITES_STORAGE_KEY = "historietas-obras-favoritas";
const COMPLETED_STORAGE_KEY = "historietas-obras-concluidas";
const FOLLOW_STORAGE_KEY = "historietas-obras-seguidas";
const AUTHOR_FOLLOW_STORAGE_KEY = "historietas-autores-seguidos";

type ErroAuthSupabase = {
  message?: string;
  code?: string;
  status?: number | string;
  name?: string;
};

function obterMensagemErroAuth(error: unknown) {
  if (!error || typeof error !== "object") {
    return "";
  }

  const erroAuth = error as ErroAuthSupabase;

  return typeof erroAuth.message === "string" ? erroAuth.message.trim() : "";
}

function obterCodigoErroAuth(error: unknown) {
  if (!error || typeof error !== "object") {
    return "";
  }

  const erroAuth = error as ErroAuthSupabase;

  return typeof erroAuth.code === "string" ? erroAuth.code.trim() : "";
}

function formatarErroAuth(
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

type ResultadoSincronizacaoPerfil =
  | { ok: true }
  | { ok: false; error: unknown };

const PROFILE_SYNC_FAILURE_STORAGE_KEY =
  "historietas-profile-sync-failure";

function aguardarLogin(milisegundos: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, milisegundos);
  });
}

function obterDetalhesErroPerfil(error: unknown) {
  if (!error || typeof error !== "object") {
    return typeof error === "string" && error.trim()
      ? error.trim()
      : "erro desconhecido";
  }

  const erroSupabase = error as {
    message?: string;
    code?: string;
    details?: string;
    hint?: string;
  };

  return [
    erroSupabase.message,
    erroSupabase.code ? `código ${erroSupabase.code}` : "",
    erroSupabase.details,
    erroSupabase.hint,
  ]
    .filter((valor): valor is string => Boolean(valor?.trim()))
    .join(" | ") || "erro desconhecido";
}

function registrarFalhaSincronizacaoPerfil(
  error: unknown,
  userId: string,
) {
  const detalhes = obterDetalhesErroPerfil(error);

  console.error(
    "[Historietas] Falha ao sincronizar o perfil após a autenticação.",
    {
      userId,
      detalhes,
    },
  );

  if (typeof window === "undefined") {
    return;
  }

  try {
    sessionStorage.setItem(
      PROFILE_SYNC_FAILURE_STORAGE_KEY,
      JSON.stringify({
        userId,
        detalhes,
        registradoEm: new Date().toISOString(),
      }),
    );
  } catch {
    // O registro local é apenas diagnóstico e não pode bloquear o login.
  }
}

function obterRedirectToSeguro(valor: string | null, fallback: string) {
  const destino = typeof valor === "string" ? valor.trim() : "";

  if (
    !destino ||
    !destino.startsWith("/") ||
    destino.startsWith("//") ||
    destino.includes("\\") ||
    /[\u0000-\u001F\u007F]/.test(destino)
  ) {
    return fallback;
  }

  try {
    const urlDestino = new URL(destino, "https://historietas.local");
    const pathname = urlDestino.pathname.replace(/\/+$/, "") || "/";

    if (
      urlDestino.origin !== "https://historietas.local" ||
      pathname === "/login" ||
      pathname.startsWith("/login/")
    ) {
      return fallback;
    }

    return `${urlDestino.pathname}${urlDestino.search}${urlDestino.hash}`;
  } catch {
    return fallback;
  }
}

function obterRedirectToAtual(fallback: string) {
  if (typeof window === "undefined") {
    return fallback;
  }

  const params = new URLSearchParams(window.location.search);

  return obterRedirectToSeguro(params.get("redirectTo"), fallback);
}

function criarStorageUsuarioLoginKey(chave: string, userId: string) {
  const userIdLimpo = userId.trim();

  return userIdLimpo ? `${chave}:${userIdLimpo}` : "";
}

function criarStorageObrasUsuarioLoginKey(userId: string) {
  return criarStorageUsuarioLoginKey(STORAGE_KEY, userId);
}

function normalizarListaStringsLogin(valor: unknown) {
  return Array.isArray(valor)
    ? valor
        .filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
        .map((item) => item.trim())
    : [];
}

function lerJsonStorageLogin(chave: string): unknown {
  const chaveLimpa = chave.trim();

  if (typeof window === "undefined" || !chaveLimpa) {
    return null;
  }

  try {
    const texto = localStorage.getItem(chaveLimpa);

    return texto ? JSON.parse(texto) : null;
  } catch {
    return null;
  }
}

function salvarJsonStorageLogin(chave: string, valor: unknown) {
  const chaveLimpa = chave.trim();

  if (typeof window === "undefined" || !chaveLimpa) {
    return;
  }

  try {
    localStorage.setItem(chaveLimpa, JSON.stringify(valor));
  } catch {
    // localStorage é apoio. O login não deve falhar por causa dele.
  }
}

function normalizarObrasStorageLogin(valor: unknown) {
  return Array.isArray(valor)
    ? valor.filter((obra): obra is Record<string, unknown> => {
        return Boolean(obra && typeof obra === "object" && !Array.isArray(obra));
      })
    : ([] as Record<string, unknown>[]);
}

function obterTextoRegistroLogin(registro: Record<string, unknown>, campo: string) {
  const valor = registro[campo];

  return typeof valor === "string" ? valor.trim() : "";
}

function obterAutorIdObraLogin(obra: Record<string, unknown>) {
  return (
    obterTextoRegistroLogin(obra, "autorId") ||
    obterTextoRegistroLogin(obra, "user_id") ||
    obterTextoRegistroLogin(obra, "userId") ||
    obterTextoRegistroLogin(obra, "autor_id")
  );
}

function obraPertenceAoUsuarioLogin(obra: Record<string, unknown>, userId: string) {
  const userIdLimpo = userId.trim();
  const autorId = obterAutorIdObraLogin(obra);

  return Boolean(userIdLimpo && autorId && autorId === userIdLimpo);
}

function sincronizarStorageUsuarioLogin(userId: string) {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo || typeof window === "undefined") {
    return;
  }

  try {
    const chaveObrasUsuario = criarStorageObrasUsuarioLoginKey(userIdLimpo);
    const obrasUsuarioAtuais = normalizarObrasStorageLogin(
      lerJsonStorageLogin(chaveObrasUsuario),
    );
    const obrasUsuarioFiltradas = obrasUsuarioAtuais
      .filter((obra) => {
        const autorId = obterAutorIdObraLogin(obra);

        return !autorId || obraPertenceAoUsuarioLogin(obra, userIdLimpo);
      })
      .map((obra) => {
        return obterAutorIdObraLogin(obra)
          ? obra
          : {
              ...obra,
              autorId: userIdLimpo,
            };
      });

    salvarJsonStorageLogin(chaveObrasUsuario, obrasUsuarioFiltradas);

    [
      FAVORITES_STORAGE_KEY,
      COMPLETED_STORAGE_KEY,
      FOLLOW_STORAGE_KEY,
      AUTHOR_FOLLOW_STORAGE_KEY,
    ].forEach((chave) => {
      const chaveUsuario = criarStorageUsuarioLoginKey(chave, userIdLimpo);
      const listaUsuario = normalizarListaStringsLogin(
        lerJsonStorageLogin(chaveUsuario),
      );

      salvarJsonStorageLogin(chaveUsuario, listaUsuario);
    });
  } catch {
    // A sincronização local não pode bloquear autenticação.
  }
}

export default function LoginPage() {
  const router = useRouter();
  const { language } = useHistorietasLanguage();
  const t = useCallback(
    (key: LoginTranslationKey) => traduzirLogin(language, key),
    [language],
  );

  const [modo, setModo] = useState<ModoAuth>("entrar");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [cientePrivacidade, setCientePrivacidade] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");

  const criandoConta = modo === "criar";
  const recuperandoSenha = modo === "recuperar";
  const [isDesktop, setIsDesktop] = useState(false);
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);

  const salvarProfile = useCallback(async (
    userId: string,
    nomeInformado: string,
    emailInformado: string,
    userMetadata?: Record<string, unknown> | null,
  ): Promise<ResultadoSincronizacaoPerfil> => {
    const userIdLimpo = userId.trim();

    if (!userIdLimpo) {
      const error = new Error(
        "Não foi possível sincronizar o perfil sem o identificador do usuário.",
      );

      registrarFalhaSincronizacaoPerfil(error, userIdLimpo);
      return { ok: false, error };
    }

    const metadata =
      userMetadata && typeof userMetadata === "object" ? userMetadata : {};
    const nomeMetadata =
      [metadata.nome, metadata.name, metadata.full_name]
        .find(
          (valor): valor is string =>
            typeof valor === "string" && Boolean(valor.trim()),
        )
        ?.trim() || "";
    const emailLimpo = emailInformado.trim();
    const nomeFinal =
      nomeInformado.trim() ||
      nomeMetadata ||
      emailLimpo.split("@")[0] ||
      "Usuário";

    type PerfilExistenteLogin = {
      id?: string | null;
      user_id?: string | null;
      nome?: string | null;
      bio?: string | null;
      sobre_bio?: string | null;
      avatar_url?: string | null;
    };

    async function sincronizarUmaVez() {
      let perfilAtual: PerfilExistenteLogin | null = null;

      const { data: perfilPorUserId, error: erroPorUserId } = await supabase
        .from("profiles")
        .select("id,user_id,nome,bio,sobre_bio,avatar_url")
        .eq("user_id", userIdLimpo)
        .limit(1)
        .maybeSingle();

      if (!erroPorUserId && perfilPorUserId) {
        perfilAtual = perfilPorUserId as PerfilExistenteLogin;
      }

      let erroPorId: unknown = null;

      if (!perfilAtual) {
        const respostaPorId = await supabase
          .from("profiles")
          .select("id,user_id,nome,bio,sobre_bio,avatar_url")
          .eq("id", userIdLimpo)
          .limit(1)
          .maybeSingle();

        erroPorId = respostaPorId.error;

        if (!respostaPorId.error && respostaPorId.data) {
          perfilAtual = respostaPorId.data as PerfilExistenteLogin;
        }
      }

      if (!perfilAtual && (erroPorUserId || erroPorId)) {
        throw erroPorUserId || erroPorId;
      }

      const termosVersaoMetadata =
        typeof metadata.termos_uso_versao === "string"
          ? metadata.termos_uso_versao.trim()
          : "";
      const termosAceitosEmMetadata =
        typeof metadata.termos_uso_aceitos_em === "string"
          ? metadata.termos_uso_aceitos_em.trim()
          : "";
      const diretrizesVersaoMetadata =
        typeof metadata.diretrizes_comunidade_versao === "string"
          ? metadata.diretrizes_comunidade_versao.trim()
          : "";
      const diretrizesAceitasEmMetadata =
        typeof metadata.diretrizes_comunidade_aceitas_em === "string"
          ? metadata.diretrizes_comunidade_aceitas_em.trim()
          : "";
      const politicaVersaoMetadata =
        typeof metadata.politica_privacidade_versao === "string"
          ? metadata.politica_privacidade_versao.trim()
          : "";
      const politicaCienteEmMetadata =
        typeof metadata.politica_privacidade_ciente_em === "string"
          ? metadata.politica_privacidade_ciente_em.trim()
          : "";
      const aceiteMetadataAtual =
        termosVersaoMetadata === TERMOS_USO_VERSAO_ATUAL &&
        Boolean(termosAceitosEmMetadata) &&
        diretrizesVersaoMetadata === DIRETRIZES_COMUNIDADE_VERSAO_ATUAL &&
        Boolean(diretrizesAceitasEmMetadata) &&
        politicaVersaoMetadata === POLITICA_PRIVACIDADE_VERSAO_ATUAL &&
        Boolean(politicaCienteEmMetadata);
      const agora = new Date().toISOString();

      const perfilPayload: Record<string, unknown> = {
        user_id: userIdLimpo,
        nome: perfilAtual?.nome?.trim() || nomeFinal,
        bio: perfilAtual?.bio?.trim() || "Perfil de leitor no Historietas.",
        sobre_bio:
          perfilAtual?.sobre_bio?.trim() ||
          perfilAtual?.bio?.trim() ||
          "Perfil de leitor no Historietas.",
        avatar_url: perfilAtual?.avatar_url || "",
        atualizado_em: agora,
      };

      if (aceiteMetadataAtual) {
        Object.assign(perfilPayload, {
          termos_uso_versao: termosVersaoMetadata,
          termos_uso_aceitos_em: termosAceitosEmMetadata,
          diretrizes_comunidade_versao: diretrizesVersaoMetadata,
          diretrizes_comunidade_aceitas_em: diretrizesAceitasEmMetadata,
          politica_privacidade_versao: politicaVersaoMetadata,
          politica_privacidade_ciente_em: politicaCienteEmMetadata,
        });
      }

      if (perfilAtual?.id) {
        const { data: perfilAtualizado, error: erroAtualizacao } =
          await supabase
            .from("profiles")
            .update(perfilPayload)
            .eq("id", perfilAtual.id)
            .select("id")
            .maybeSingle();

        if (erroAtualizacao) {
          throw erroAtualizacao;
        }

        if (!perfilAtualizado) {
          throw new Error(
            "O perfil existente não pôde ser atualizado ou não ficou visível após a atualização.",
          );
        }

        return;
      }

      const { data: perfilCriado, error: erroCriacao } = await supabase
        .from("profiles")
        .upsert(
          {
            id: userIdLimpo,
            tipo: "leitor",
            ...perfilPayload,
          },
          {
            onConflict: "id",
            ignoreDuplicates: false,
          },
        )
        .select("id")
        .maybeSingle();

      if (erroCriacao) {
        throw erroCriacao;
      }

      if (!perfilCriado) {
        throw new Error(
          "O perfil não pôde ser criado ou não ficou visível após a criação.",
        );
      }
    }

    let ultimoErro: unknown = new Error(
      "A sincronização do perfil não foi concluída.",
    );

    for (let tentativa = 1; tentativa <= 2; tentativa += 1) {
      try {
        await sincronizarUmaVez();

        if (typeof window !== "undefined") {
          try {
            sessionStorage.removeItem(PROFILE_SYNC_FAILURE_STORAGE_KEY);
          } catch {
            // A limpeza do diagnóstico local não pode bloquear o login.
          }
        }

        return { ok: true };
      } catch (error) {
        ultimoErro = error;

        if (tentativa < 2) {
          await aguardarLogin(350);
        }
      }
    }

    registrarFalhaSincronizacaoPerfil(ultimoErro, userIdLimpo);

    return {
      ok: false,
      error: ultimoErro,
    };
  }, []);

  useEffect(() => {
    let componenteAtivo = true;

    async function redirecionarUsuarioJaLogado() {
      try {
        const { data } = await supabase.auth.getUser();

        if (componenteAtivo && data.user) {
          const resultadoPerfil = await salvarProfile(
            data.user.id,
            "",
            data.user.email || "",
            data.user.user_metadata,
          );

          if (!resultadoPerfil.ok && componenteAtivo) {
            setErro(t("profileSyncWarning"));
            await aguardarLogin(1600);
          }

          sincronizarStorageUsuarioLogin(data.user.id);

          router.replace(obterRedirectToAtual("/perfil-autor"));
          router.refresh();
        }
      } catch {
        // A página de login deve continuar acessível se a verificação falhar.
      }
    }

    void redirecionarUsuarioJaLogado();

    return () => {
      componenteAtivo = false;
    };
  }, [router, salvarProfile, t]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get("senhaRedefinida") === "1") {
      setModo("entrar");
      setErro("");
      setAviso(t("passwordChangedNotice"));
    }
  }, [t]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");

    const atualizarModoDesktop = () => {
      setIsDesktop(mediaQuery.matches);
    };

    atualizarModoDesktop();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", atualizarModoDesktop);

      return () => {
        mediaQuery.removeEventListener("change", atualizarModoDesktop);
      };
    }

    mediaQuery.addListener(atualizarModoDesktop);

    return () => {
      mediaQuery.removeListener(atualizarModoDesktop);
    };
  }, []);

  async function enviarFormulario(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (carregando) {
      return;
    }

    setErro("");
    setAviso("");

    const emailFinal = email.trim().toLowerCase();
    const nomeFinal = nome.trim();

    if (!emailFinal) {
      setErro(t("emailRequired"));
      return;
    }

    if (
      criandoConta &&
      (senha.length < 8 ||
        !/[A-Za-zÀ-ÖØ-öø-ÿ]/.test(senha) ||
        !/\d/.test(senha))
    ) {
      setErro(t("signupPasswordRequirements"));
      return;
    }

    if (!recuperandoSenha && !criandoConta && senha.length < 6) {
      setErro(t("passwordMin"));
      return;
    }

    if (criandoConta && nomeFinal.length < 2) {
      setErro(t("displayNameMin"));
      return;
    }

    if (criandoConta && (!aceitouTermos || !cientePrivacidade)) {
      setErro(t("consentRequired"));
      return;
    }

    setCarregando(true);

    try {
      if (recuperandoSenha) {
        const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(
          "/redefinir-senha",
        )}`;

        const { error } = await supabase.auth.resetPasswordForEmail(
          emailFinal,
          { redirectTo },
        );

        if (error) {
          setErro(formatarErroAuth(error, language));
          return;
        }

        setAviso(t("recoveryEmailSent"));
        return;
      }

      if (criandoConta) {
        const aceiteEm = new Date().toISOString();
        const metadataAceite = criarMetadataAceiteTermos(aceiteEm);
        const { data, error } = await supabase.auth.signUp({
          email: emailFinal,
          password: senha,
          options: {
            data: {
              nome: nomeFinal,
              name: nomeFinal,
              full_name: nomeFinal,
              tipo: "leitor",
              ...metadataAceite,
            },
          },
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
          }

          sincronizarStorageUsuarioLogin(data.user.id);
          router.replace(obterRedirectToAtual("/perfil-autor"));
          router.refresh();
          return;
        }

        setModo("entrar");
        setSenha("");
        setAceitouTermos(false);
        setCientePrivacidade(false);
        setAviso(t("accountCreatedNotice"));
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailFinal,
        password: senha,
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

      sincronizarStorageUsuarioLogin(data.user.id);
      router.replace(obterRedirectToAtual("/perfil-autor"));
      router.refresh();
    } catch (error) {
      setErro(formatarErroAuth(error, language));
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main style={pageThemeStyle}>
      <style>{`${historietasThemeCss}${loginPageCss}`}</style>

      {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
      {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}

      <section style={containerStyle}>
        <header style={topStyle}>
          <Link href="/" style={logoStyle} aria-label={t("backHome")}>
            <span style={logoMarkStyle}>H</span>
            <span className="historietas-theme-logo-text" style={logoTextStyle}>
              istorietas
            </span>
          </Link>

          <div style={languageSelectShellStyle}>
            <LanguageSelect
              showLabel={false}
              style={languageSelectWrapperStyle}
              selectStyle={languageSelectStyle}
            />
          </div>
        </header>

        <section style={heroStyle}>
          <div style={heroGlowStyle} />

          <div style={heroContentStyle}>
            <div style={introStyle}>
              <h1 className="historietas-theme-title" style={titleStyle}>
                {recuperandoSenha
                  ? t("recoveryTitle")
                  : criandoConta
                    ? t("createAccountTitle")
                    : t("signInTitle")}
              </h1>

              <p style={descriptionStyle}>
                {recuperandoSenha
                  ? t("recoveryDescription")
                  : t("description")}
              </p>
            </div>

            <div style={formPanelStyle}>
              {!recuperandoSenha && (
                <div style={tabsStyle}>
                  <button
                    type="button"
                    onClick={() => {
                      setModo("entrar");
                      setErro("");
                      setAviso("");
                    }}
                    style={modo === "entrar" ? tabActiveStyle : tabStyle}
                    aria-pressed={modo === "entrar"}
                  >
                    {t("signInTab")}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setModo("criar");
                      setErro("");
                      setAviso("");
                    }}
                    style={modo === "criar" ? tabActiveStyle : tabStyle}
                    aria-pressed={modo === "criar"}
                  >
                    {t("createAccountTab")}
                  </button>
                </div>
              )}

              <form onSubmit={enviarFormulario} style={formStyle}>
                {criandoConta && (
                  <label style={fieldStyle}>
                    <span style={labelStyle}>{t("displayName")}</span>

                    <input
                      value={nome}
                      onChange={(event) => {
                        setNome(event.target.value.slice(0, 80));
                        setErro("");
                        setAviso("");
                      }}
                      placeholder={t("displayNamePlaceholder")}
                      style={inputStyle}
                      type="text"
                      autoComplete="name"
                      maxLength={80}
                      required
                    />
                  </label>
                )}

                <label style={fieldStyle}>
                  <span style={labelStyle}>{t("email")}</span>

                  <input
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value.slice(0, 254));
                      setErro("");
                      setAviso("");
                    }}
                    placeholder="seuemail@email.com"
                    style={inputStyle}
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    maxLength={254}
                    required
                  />
                </label>

                {!recuperandoSenha && (
                  <label style={fieldStyle}>
                    <span style={labelStyle}>{t("password")}</span>

                    <input
                      value={senha}
                      onChange={(event) => {
                        setSenha(event.target.value);
                        setErro("");
                        setAviso("");
                      }}
                      placeholder={
                        criandoConta
                          ? t("signupPasswordPlaceholder")
                          : t("passwordPlaceholder")
                      }
                      style={inputStyle}
                      type="password"
                      autoComplete={
                        criandoConta ? "new-password" : "current-password"
                      }
                      minLength={criandoConta ? 8 : 6}
                      required
                    />
                  </label>
                )}

                {criandoConta && (
                  <div style={consentGroupStyle}>
                    <label style={consentLabelStyle}>
                      <input
                        type="checkbox"
                        checked={aceitouTermos}
                        onChange={(event) => {
                          setAceitouTermos(event.target.checked);
                          setErro("");
                          setAviso("");
                        }}
                        style={checkboxStyle}
                        required
                      />
                      <span>
                        {t("acceptTermsPrefix")} {" "}
                        <Link href="/termos-de-uso" target="_blank" style={legalLinkStyle}>
                          {t("termsLink")}
                        </Link>{" "}
                        {t("and")} {" "}
                        <Link
                          href="/diretrizes-da-comunidade"
                          target="_blank"
                          style={legalLinkStyle}
                        >
                          {t("guidelinesLink")}
                        </Link>.
                      </span>
                    </label>

                    <label style={consentLabelStyle}>
                      <input
                        type="checkbox"
                        checked={cientePrivacidade}
                        onChange={(event) => {
                          setCientePrivacidade(event.target.checked);
                          setErro("");
                          setAviso("");
                        }}
                        style={checkboxStyle}
                        required
                      />
                      <span>
                        {t("privacyPrefix")} {" "}
                        <Link
                          href="/politica-de-privacidade"
                          target="_blank"
                          style={legalLinkStyle}
                        >
                          {t("privacyLink")}
                        </Link>.
                      </span>
                    </label>
                  </div>
                )}

                {!criandoConta && !recuperandoSenha && (
                  <button
                    type="button"
                    onClick={() => {
                      setModo("recuperar");
                      setSenha("");
                      setErro("");
                      setAviso("");
                    }}
                    style={textButtonStyle}
                  >
                    {t("forgotPassword")}
                  </button>
                )}

                {aviso && (
                  <span role="status" aria-live="polite" style={successStyle}>
                    {aviso}
                  </span>
                )}

                {erro && (
                  <span role="alert" aria-live="assertive" style={errorStyle}>
                    {erro}
                  </span>
                )}

                <button
                  type="submit"
                  disabled={carregando}
                  style={{
                    ...primaryButtonStyle,
                    opacity: carregando ? 0.72 : 1,
                    cursor: carregando ? "not-allowed" : "pointer",
                  }}
                >
                  {carregando
                    ? t("wait")
                    : recuperandoSenha
                      ? t("sendRecoveryLink")
                      : criandoConta
                        ? t("create")
                        : t("signIn")}
                </button>

                {recuperandoSenha && (
                  <button
                    type="button"
                    onClick={() => {
                      setModo("entrar");
                      setErro("");
                      setAviso("");
                    }}
                    style={secondaryButtonStyle}
                  >
                    {t("backToSignIn")}
                  </button>
                )}
              </form>

              <p style={helperTextStyle}>
                {recuperandoSenha
                  ? t("recoveryHelperText")
                  : t("helperText")}
              </p>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

const loginPageCss = `
  html {
    --historietas-login-bg-page: #070212;
    --historietas-login-bg-deep: #04000A;
    --historietas-login-surface: #08030F;
    --historietas-login-logo-mid: #DDD6FE;
    --historietas-login-logo-end: #A78BFA;
    --historietas-login-danger: #FCA5A5;
    --historietas-login-success: #86EFAC;
    --historietas-login-purple-border: rgba(59, 7, 100, 0.58);
    --historietas-login-purple-border-soft: rgba(59, 7, 100, 0.50);
    --historietas-login-success-bg: rgba(34,197,94,0.10);
    --historietas-login-success-border: rgba(34,197,94,0.24);
    --historietas-login-placeholder: rgba(221, 214, 254, 0.62);
  }

  html[data-historietas-tema-visual="foco"] {
    --historietas-login-bg-page: #000000;
    --historietas-login-bg-deep: #000000;
    --historietas-login-surface: #050505;
    --historietas-login-logo-mid: #FFFFFF;
    --historietas-login-logo-end: #FFFFFF;
    --historietas-login-danger: #FFFFFF;
    --historietas-login-success: #FFFFFF;
    --historietas-login-purple-border: rgba(255,255,255,0.18);
    --historietas-login-purple-border-soft: rgba(255,255,255,0.18);
    --historietas-login-success-bg: rgba(255,255,255,0.06);
    --historietas-login-success-border: rgba(255,255,255,0.18);
    --historietas-login-placeholder: rgba(212,212,216,0.68);
  }

  html,
  body {
    overflow-x: hidden !important;
    overflow-y: auto !important;
    overscroll-behavior-y: contain !important;
  }

  html[data-historietas-tema-visual="original"] body,
  html[data-historietas-tema-visual="original"] main {
    background: #070212 !important;
  }

  html[data-historietas-tema-visual="foco"] body,
  html[data-historietas-tema-visual="foco"] main {
    background: #000000 !important;
    color: #FFFFFF !important;
  }

  html[data-historietas-tema-visual] main > div[aria-hidden="true"] {
    background: transparent !important;
    opacity: 0 !important;
  }

  html[data-historietas-tema-visual] input::placeholder {
    color: var(--historietas-login-placeholder) !important;
  }

  html[data-historietas-tema-visual] input {
    color: #FFFFFF !important;
  }

  html[data-historietas-tema-visual="foco"] .historietas-theme-logo-text,
  html[data-historietas-tema-visual="foco"] .historietas-theme-title {
    background: none !important;
    color: #FFFFFF !important;
    -webkit-text-fill-color: #FFFFFF !important;
    text-shadow: none !important;
  }
`;

const safeTextStyle: CSSProperties = {
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

const mobileTopWaterFadeStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: "min(520px, 72vh)",
  pointerEvents: "none",
  zIndex: 0,
  background: "transparent",
  opacity: 0,
};

const desktopTopWaterFadeStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: "min(620px, 68vh)",
  pointerEvents: "none",
  zIndex: 0,
  background: "transparent",
  opacity: 0,
};

const pageStyle: CSSProperties = {
  position: "relative",
  minHeight: "100dvh",
  height: "auto",
  width: "100%",
  maxWidth: "100vw",
  overflowX: "hidden",
  overflowY: "auto",
  boxSizing: "border-box",
  background: "var(--historietas-login-bg-page, #070212)",
  color: "#FFFFFF",
  fontFamily: "Inter, Poppins, Manrope, Arial, Helvetica, sans-serif",
};

const containerStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: "min(1120px, calc(100% - 28px))",
  maxWidth: "100%",
  margin: "0 auto",
  padding: "clamp(8px, 1.6vw, 16px) 0 8px",
  boxSizing: "border-box",
  minWidth: 0,
};

const topStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  marginBottom: "10px",
  minWidth: 0,
};

const languageSelectShellStyle: CSSProperties = {
  position: "relative",
  width: "108px",
  minWidth: 0,
  justifySelf: "end",
};

const languageSelectWrapperStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
};

const languageSelectStyle: CSSProperties = {
  minHeight: "36px",
  height: "36px",
  padding: "0 8px",
  borderRadius: "12px",
  border:
    "1px solid var(--historietas-login-purple-border, rgba(59, 7, 100, 0.58))",
  background: "var(--historietas-login-bg-deep, #04000A)",
  color: "#FFFFFF",
  fontSize: "12px",
  fontWeight: 850,
  colorScheme: "dark",
};

const logoStyle: CSSProperties = {
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "25px",
  fontWeight: 950,
  letterSpacing: 0,
  display: "flex",
  alignItems: "center",
  gap: "4px",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "visible",
  ...safeTextStyle,
};

const logoMarkStyle: CSSProperties = {
  width: "34px",
  height: "34px",
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--historietas-login-bg-deep, #04000A)",
  color: "#FFFFFF",
  fontSize: "19px",
  fontWeight: 950,
  letterSpacing: 0,
  flex: "0 0 auto",
  border: "1px solid var(--historietas-login-purple-border, rgba(59, 7, 100, 0.58))",
  boxShadow: "none",
};

const logoTextStyle: CSSProperties = {
  marginLeft: "-1px",
  background:
    "linear-gradient(135deg, #FFFFFF 0%, var(--historietas-login-logo-mid, #DDD6FE) 44%, var(--historietas-login-logo-end, #A78BFA) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  textShadow: "none",
};

const heroStyle: CSSProperties = {
  position: "relative",
  overflow: "visible",
  borderRadius: 0,
  border: "none",
  background: "transparent",
  boxShadow: "none",
  minWidth: 0,
};

const heroGlowStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  background: "transparent",
  pointerEvents: "none",
};

const heroContentStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  padding: "clamp(12px, 2.4vw, 26px) clamp(18px, 3.4vw, 38px) clamp(4px, 1vw, 10px)",
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  justifyItems: "center",
  alignItems: "center",
  gap: "clamp(14px, 2.8vw, 26px)",
  transform: "translateY(clamp(16px, 2.4vh, 26px))",
  minWidth: 0,
};

const introStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  gap: "10px",
  width: "100%",
  maxWidth: "760px",
  textAlign: "center",
  minWidth: 0,
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "clamp(27px, 6.6vw, 64px)",
  lineHeight: 1.08,
  fontWeight: 950,
  letterSpacing: "-0.055em",
  width: "100%",
  maxWidth: "760px",
  textAlign: "center",
  background: "none",
  WebkitBackgroundClip: "initial",
  backgroundClip: "initial",
  color: "#FFFFFF",
  WebkitTextFillColor: "#FFFFFF",
  padding: "0 0.16em 4px",
  marginLeft: "auto",
  marginRight: "auto",
  overflow: "visible",
  overflowWrap: "normal",
  wordBreak: "normal",
  whiteSpace: "normal",
};

const descriptionStyle: CSSProperties = {
  margin: 0,
  color: "#D4D4D8",
  fontSize: "clamp(12.5px, 2vw, 15px)",
  lineHeight: 1.54,
  fontWeight: 650,
  maxWidth: "620px",
  textAlign: "center",
  ...safeTextStyle,
};

const formPanelStyle: CSSProperties = {
  display: "grid",
  gap: "10px",
  width: "100%",
  maxWidth: "440px",
  justifySelf: "center",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
  boxShadow: "none",
  boxSizing: "border-box",
  minWidth: 0,
};

const tabsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "6px",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
  minWidth: 0,
};

const tabStyle: CSSProperties = {
  minHeight: "36px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-login-purple-border-soft, rgba(59, 7, 100, 0.50))",
  background: "var(--historietas-login-bg-deep, #04000A)",
  color: "#FFFFFF",
  fontSize: "12px",
  fontWeight: 950,
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "center",
  boxShadow: "none",
  ...safeTextStyle,
};

const tabActiveStyle: CSSProperties = {
  ...tabStyle,
  background: "var(--historietas-login-surface, #08030F)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#FFFFFF",
  boxShadow: "none",
};

const formStyle: CSSProperties = {
  display: "grid",
  gap: "9px",
  minWidth: 0,
};

const fieldStyle: CSSProperties = {
  display: "grid",
  gap: "5px",
  minWidth: 0,
};

const labelStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "11px",
  fontWeight: 950,
  ...safeTextStyle,
};

const inputStyle: CSSProperties = {
  width: "100%",
  height: "48px",
  minHeight: "48px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-login-purple-border, rgba(59, 7, 100, 0.58))",
  background: "var(--historietas-login-bg-deep, #04000A)",
  color: "#FFFFFF",
  padding: "0 13px",
  outline: "none",
  fontSize: "15px",
  fontWeight: 750,
  fontFamily: "inherit",
  boxSizing: "border-box",
  minWidth: 0,
};

const consentGroupStyle: CSSProperties = {
  display: "grid",
  gap: "9px",
};

const consentLabelStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "22px minmax(0, 1fr)",
  alignItems: "start",
  gap: "10px",
  padding: "12px 13px",
  borderRadius: "15px",
  border:
    "1px solid var(--historietas-login-purple-border-soft, rgba(59, 7, 100, 0.50))",
  background: "var(--historietas-login-bg-deep, #04000A)",
  color: "#E4E4E7",
  fontSize: "12px",
  fontWeight: 700,
  lineHeight: 1.5,
  cursor: "pointer",
  minWidth: 0,
};

const checkboxStyle: CSSProperties = {
  width: "18px",
  height: "18px",
  margin: "1px 0 0",
  accentColor: "#FFFFFF",
};

const legalLinkStyle: CSSProperties = {
  color: "#FFFFFF",
  fontWeight: 900,
  textUnderlineOffset: "3px",
};

const primaryButtonStyle: CSSProperties = {
  width: "100%",
  height: "44px",
  minHeight: "44px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "var(--historietas-login-surface, #08030F)",
  color: "#FFFFFF",
  fontSize: "13px",
  fontWeight: 950,
  fontFamily: "inherit",
  textAlign: "center",
  padding: "0 14px",
  boxShadow: "none",
  ...safeTextStyle,
};

const secondaryButtonStyle: CSSProperties = {
  ...primaryButtonStyle,
  background: "transparent",
  border:
    "1px solid var(--historietas-login-purple-border-soft, rgba(59, 7, 100, 0.50))",
  cursor: "pointer",
};

const textButtonStyle: CSSProperties = {
  width: "fit-content",
  justifySelf: "end",
  border: "none",
  background: "transparent",
  color: "#FFFFFF",
  padding: "2px 4px",
  fontFamily: "inherit",
  fontSize: "11px",
  fontWeight: 850,
  textDecoration: "none",
  cursor: "pointer",
  ...safeTextStyle,
};

const errorStyle: CSSProperties = {
  display: "block",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
  color: "var(--historietas-login-danger, #FCA5A5)",
  fontSize: "12px",
  fontWeight: 850,
  textAlign: "center",
  ...safeTextStyle,
};

const successStyle: CSSProperties = {
  display: "block",
  padding: "9px 12px",
  borderRadius: "14px",
  background: "var(--historietas-login-success-bg, rgba(34,197,94,0.10))",
  border: "1px solid var(--historietas-login-success-border, rgba(34,197,94,0.24))",
  color: "var(--historietas-login-success, #86EFAC)",
  fontSize: "12px",
  lineHeight: 1.45,
  fontWeight: 850,
  textAlign: "center",
  ...safeTextStyle,
};

const helperTextStyle: CSSProperties = {
  margin: 0,
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
  color: "#D4D4D8",
  fontSize: "11px",
  lineHeight: 1.45,
  fontWeight: 700,
  textAlign: "center",
  ...safeTextStyle,
};