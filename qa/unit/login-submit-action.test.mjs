import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pageSource = readFileSync("app/login/page.tsx", "utf8");
const source = readFileSync(
  "app/login/hooks/useLoginSubmitAction.ts",
  "utf8",
);

function indice(texto) {
  const resultado = source.indexOf(texto);
  assert.notEqual(resultado, -1, `Esperava encontrar: ${texto}`);
  return resultado;
}

test("a página delega somente o submit e preserva salvarProfile compartilhado", () => {
  assert.match(pageSource, /import \{ useLoginSubmitAction \} from "\.\/hooks\/useLoginSubmitAction";/);
  assert.match(pageSource, /const salvarProfile = useCallback/);
  assert.match(pageSource, /useLoginExistingSessionRedirect\(\{ router, salvarProfile, t, setErro \}\)/);
  assert.match(pageSource, /const \{ enviarFormulario \} = useLoginSubmitAction\(\{/);
  assert.match(pageSource, /salvarProfile,/);
  assert.match(pageSource, /<form onSubmit=\{enviarFormulario\} style=\{formStyle\}>/);
  assert.doesNotMatch(pageSource, /async function enviarFormulario/);
  assert.doesNotMatch(source, /sincronizarProfileLogin/);
});

test("a action preserva preparação, validação e ordem inicial", () => {
  assert.match(source, /export function useLoginSubmitAction/);
  assert.match(source, /return \{ enviarFormulario \}/);
  assert.match(source, /async function enviarFormulario\(event: FormEvent<HTMLFormElement>\)/);
  assert.ok(indice("event.preventDefault();") < indice("if (carregando)"));
  assert.ok(indice("if (carregando)") < indice('setErro("");'));
  assert.ok(indice('setErro("");') < indice("prepararFormularioLogin(email, nome)"));
  assert.ok(indice("prepararFormularioLogin(email, nome)") < indice("validarFormularioLogin({"));
  assert.ok(indice("validarFormularioLogin({") < indice("setCarregando(true);"));
  assert.match(source, /if \(chaveErro\) \{[\s\S]*?setErro\(t\(chaveErro\)\);[\s\S]*?return;[\s\S]*?\}\s*\n\s*setCarregando\(true\);/);
});

test("a action preserva a recuperação, cadastro, login e finalização", () => {
  const recuperacao = indice("if (recuperandoSenha)");
  const cadastro = indice("if (criandoConta)");
  const login = indice("const { data, error } = await entrarComSenhaLogin");
  assert.ok(recuperacao < cadastro);
  assert.ok(cadastro < login);
  assert.match(source, /solicitarRecuperacaoSenhaLogin\(emailFinal\)/);
  assert.match(source, /setErro\(t\("genericFailure"\)\)/);
  assert.match(source, /setAviso\(t\("recoveryEmailSent"\)\)/);
  assert.match(source, /criarContaLogin\(\{[\s\S]*?emailFinal,[\s\S]*?senha,[\s\S]*?nomeFinal,/);
  assert.match(source, /setModo\("entrar"\);[\s\S]*?setSenha\(""\);[\s\S]*?setAceitouTermos\(false\);[\s\S]*?setCientePrivacidade\(false\);[\s\S]*?setAviso\(t\("accountCreatedNotice"\)\);/);
  assert.match(source, /entrarComSenhaLogin\(\{\s*emailFinal,\s*senha,/);
  assert.equal((source.match(/finalizarAutenticacaoLogin\(\{ userId: data\.user\.id, router \}\)/g) || []).length, 2);
});

test("a action preserva profile, aceite, catch e finally", () => {
  const sincronizacaoCadastro = indice("const resultadoPerfil = await salvarProfile(");
  const aceite = indice("await registrarAceiteTermosPublicacao()");
  const finalizacaoCadastro = source.indexOf(
    "finalizarAutenticacaoLogin({ userId: data.user.id, router });",
    sincronizacaoCadastro,
  );
  const sincronizacaoLogin = source.indexOf(
    "const resultadoPerfil = await salvarProfile(",
    sincronizacaoCadastro + 1,
  );
  const finalizacaoLogin = source.indexOf(
    "finalizarAutenticacaoLogin({ userId: data.user.id, router });",
    finalizacaoCadastro + 1,
  );

  assert.ok(sincronizacaoCadastro < aceite);
  assert.ok(aceite < finalizacaoCadastro);
  assert.ok(sincronizacaoLogin < finalizacaoLogin);
  assert.match(source, /resultadoAceite\.erro \|\|\s*"Nao foi possivel registrar o aceite dos termos\."/);
  assert.match(source, /catch \(error\) \{\s*setErro\(formatarErroAuth\(error, language\)\);\s*\} finally \{\s*setCarregando\(false\);/);
  assert.doesNotMatch(source, /useState|useEffect|localStorage|supabase|<(?:div|p|form|button|input)\b/i);
});
