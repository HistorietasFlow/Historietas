import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const translationsSource = readFileSync(
  new URL("../../app/login/lib/login-translations.ts", import.meta.url),
  "utf8",
);
const errorUtilsSource = readFileSync(
  new URL("../../app/login/lib/login-auth-error-utils.ts", import.meta.url),
  "utf8",
);
const formatterSource = readFileSync(
  new URL("../../app/login/lib/login-auth-error-formatter.ts", import.meta.url),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/login/page.tsx", import.meta.url),
  "utf8",
);

function transpilar(codigo) {
  return typescript.transpileModule(codigo, {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  }).outputText;
}

function criarUrlData(codigo) {
  return `data:text/javascript;base64,${Buffer.from(codigo).toString("base64")}`;
}

const translationsUrl = criarUrlData(transpilar(translationsSource));
const errorUtilsUrl = criarUrlData(transpilar(errorUtilsSource));
let formatterJavascript = transpilar(formatterSource)
  .replaceAll('from "./login-auth-error-utils"', `from "${errorUtilsUrl}"`)
  .replaceAll('from "./login-translations"', `from "${translationsUrl}"`);
const { traduzirLogin } = await import(translationsUrl);
const { formatarErroAuth } = await import(criarUrlData(formatterJavascript));

test("traduções do Login preservam textos representativos nas três línguas", () => {
  assert.equal(traduzirLogin("pt-BR", "signInTitle"), "FAZER LOGIN");
  assert.equal(traduzirLogin("en", "signInTitle"), "SIGN IN");
  assert.equal(traduzirLogin("es", "signInTitle"), "INICIAR SESIÓN");
  assert.equal(
    traduzirLogin("pt-BR", "passwordChangedNotice"),
    "Senha redefinida com sucesso. Entre usando sua nova senha.",
  );
  assert.equal(
    traduzirLogin("en", "passwordChangedNotice"),
    "Password reset successfully. Sign in using your new password.",
  );
  assert.equal(
    traduzirLogin("es", "passwordChangedNotice"),
    "Contraseña restablecida correctamente. Inicia sesión con tu nueva contraseña.",
  );
});

test("formatter preserva categorias, prioridade e detalhes técnicos", () => {
  const categorias = [
    ["invalid login credentials", "invalidCredentials"],
    ["email not confirmed", "emailNotConfirmed"],
    ["user already registered", "alreadyRegistered"],
    ["signup disabled", "signupDisabled"],
    ["database error", "databaseFailure"],
    ["weak_password", "weakPassword"],
    ["email inválido", "invalidEmail"],
    ["failed to fetch", "connectionFailure"],
  ];

  categorias.forEach(([mensagem, chave]) => {
    assert.equal(
      formatarErroAuth({ message: mensagem }, "pt-BR"),
      `${traduzirLogin("pt-BR", chave)} ${traduzirLogin(
        "pt-BR",
        "technicalError",
      )}: ${mensagem}`,
    );
  });

  assert.equal(
    formatarErroAuth(
      { message: "invalid credentials", code: "email_exists" },
      "en",
    ),
    `${traduzirLogin("en", "invalidCredentials")} ${traduzirLogin(
      "en",
      "technicalError",
    )}: invalid credentials | email_exists`,
  );
  assert.equal(
    formatarErroAuth({ code: "network" }, "es"),
    `${traduzirLogin("es", "connectionFailure")} ${traduzirLogin(
      "es",
      "technicalError",
    )}: network`,
  );
});

test("formatter preserva fallback sem erro técnico", () => {
  assert.equal(
    formatarErroAuth({}, "pt-BR"),
    `${traduzirLogin("pt-BR", "genericFailure")} ${traduzirLogin(
      "pt-BR",
      "technicalError",
    )}: ${traduzirLogin("pt-BR", "unknownError")}.`,
  );
  assert.equal(
    formatarErroAuth("erro desconhecido", "en"),
    `${traduzirLogin("en", "genericFailure")} ${traduzirLogin(
      "en",
      "technicalError",
    )}: ${traduzirLogin("en", "unknownError")}.`,
  );
});

test("Login delega traduções e formatação de erros aos módulos extraídos", () => {
  assert.match(translationsSource, /export type LoginTranslationKey/);
  assert.match(translationsSource, /export const LOGIN_TRANSLATIONS/);
  assert.match(translationsSource, /export function traduzirLogin/);
  assert.match(formatterSource, /export function formatarErroAuth/);
  assert.match(formatterSource, /obterMensagemErroAuth/);
  assert.match(formatterSource, /obterCodigoErroAuth/);
  assert.match(formatterSource, /traduzirLogin/);
  assert.doesNotMatch(pageSource, /const LOGIN_TRANSLATIONS/);
  assert.doesNotMatch(pageSource, /function traduzirLogin\(/);
  assert.doesNotMatch(pageSource, /function formatarErroAuth\(/);
  assert.match(pageSource, /const t = useCallback\(/);
  assert.doesNotMatch(
    `${translationsSource}\n${formatterSource}`,
    /from\s+["']react["']|useState|useEffect|localStorage|router|import\s+\{\s*supabase\s*\}|supabase\.(?:auth|from|rpc)|<(?:[A-Z][A-Za-z0-9]*|[a-z][a-z0-9-]*)(?:\s|\/?>)/,
  );
});
