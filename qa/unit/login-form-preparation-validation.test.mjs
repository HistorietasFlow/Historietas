import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const preparationSource = readFileSync(
  new URL("../../app/login/lib/login-form-preparation.ts", import.meta.url),
  "utf8",
);
const validationSource = readFileSync(
  new URL("../../app/login/lib/login-form-validation.ts", import.meta.url),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/login/page.tsx", import.meta.url),
  "utf8",
);
const submitActionSource = readFileSync(
  new URL("../../app/login/hooks/useLoginSubmitAction.ts", import.meta.url),
  "utf8",
);

function carregarModulo(source) {
  const javascript = typescript.transpileModule(source, {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  }).outputText;

  return import(
    `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`
  );
}

const { prepararFormularioLogin } = await carregarModulo(preparationSource);
const { validarFormularioLogin } = await carregarModulo(validationSource);

function validar(valores = {}) {
  return validarFormularioLogin({
    emailFinal: "leitor@historietas.test",
    nomeFinal: "Leitor",
    senha: "senha123",
    criandoConta: false,
    recuperandoSenha: false,
    aceitouTermos: true,
    cientePrivacidade: true,
    ...valores,
  });
}

test("preparação do formulário preserva trim e lowercase atuais", () => {
  assert.deepEqual(
    prepararFormularioLogin("  LEITOR@Historietas.Test  ", "  Nome do Autor  "),
    {
      emailFinal: "leitor@historietas.test",
      nomeFinal: "Nome do Autor",
    },
  );
});

test("validação preserva regras de e-mail, senha, recuperação e letras acentuadas", () => {
  assert.equal(validar({ emailFinal: "" }), "emailRequired");
  assert.equal(
    validar({ criandoConta: true, senha: "abc1234" }),
    "signupPasswordRequirements",
  );
  assert.equal(
    validar({ criandoConta: true, senha: "abcdefgh" }),
    "signupPasswordRequirements",
  );
  assert.equal(
    validar({ criandoConta: true, senha: "12345678" }),
    "signupPasswordRequirements",
  );
  assert.equal(
    validar({ criandoConta: true, senha: "ábcdefg1" }),
    null,
  );
  assert.equal(validar({ senha: "12345" }), "passwordMin");
  assert.equal(
    validar({ recuperandoSenha: true, senha: "" }),
    null,
  );
});

test("validação preserva cadastro, consentimentos e prioridade das regras", () => {
  assert.equal(
    validar({ criandoConta: true, nomeFinal: "A" }),
    "displayNameMin",
  );
  assert.equal(
    validar({
      criandoConta: true,
      aceitouTermos: false,
      cientePrivacidade: true,
    }),
    "consentRequired",
  );
  assert.equal(
    validar({
      criandoConta: true,
      senha: "",
      nomeFinal: "",
      aceitouTermos: false,
      cientePrivacidade: false,
    }),
    "signupPasswordRequirements",
  );
  assert.equal(validar(), null);
});

test("Login mantém a orquestração e delega preparação e validação", () => {
  assert.match(pageSource, /useLoginSubmitAction\(/);
  assert.match(submitActionSource, /from "\.\.\/lib\/login-form-preparation";/);
  assert.match(submitActionSource, /from "\.\.\/lib\/login-form-validation";/);
  assert.doesNotMatch(submitActionSource, /const emailFinal = email\.trim\(\)\.toLowerCase\(\);/);
  assert.doesNotMatch(submitActionSource, /const nomeFinal = nome\.trim\(\);/);
  assert.doesNotMatch(submitActionSource, /!\[A-Za-zÀ-ÖØ-öø-ÿ\]\.test\(senha\)/);
  assert.match(submitActionSource, /const chaveErro = validarFormularioLogin\(/);
  assert.match(submitActionSource, /setErro\(t\(chaveErro\)\);/);
  assert.match(
    submitActionSource,
    /if \(chaveErro\) \{[\s\S]*?setErro\(t\(chaveErro\)\);[\s\S]*?return;[\s\S]*?\}\s*\n\s*setCarregando\(true\);/,
  );
  assert.doesNotMatch(
    `${preparationSource}\n${validationSource}`,
    /from\s+["']react["']|useState|useEffect|localStorage|router|supabase|<(?:[A-Z][A-Za-z0-9]*|[a-z][a-z0-9-]*)(?:\s|\/?>)/i,
  );
});
