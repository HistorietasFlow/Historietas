import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pageSource = readFileSync(
  new URL("../../app/redefinir-senha/page.tsx", import.meta.url),
  "utf8",
);
const actionSource = readFileSync(
  new URL(
    "../../app/redefinir-senha/hooks/use-redefinir-senha-save-action.ts",
    import.meta.url,
  ),
  "utf8",
);

test("ação de salvar preserva validações locais antes do processamento", () => {
  assert.match(
    actionSource,
    /event: FormEvent<HTMLFormElement>/,
  );
  assert.match(actionSource, /event\.preventDefault\(\);/);
  assert.match(
    actionSource,
    /if \(salvando \|\| estadoLink !== "valido"\) \{\s*return;/,
  );
  assert.match(actionSource, /setErro\(""\);/);
  assert.match(
    actionSource,
    /if \(novaSenha\.length < 8\) \{\s*setErro\(t\("passwordMin"\)\);\s*return;/,
  );
  assert.match(actionSource, /\[A-Za-zÀ-ÖØ-öø-ÿ\]/);
  assert.match(actionSource, /!\/\\d\/\.test\(novaSenha\)/);
  assert.match(
    actionSource,
    /setErro\(t\("passwordComposition"\)\);\s*return;/,
  );
  assert.match(
    actionSource,
    /if \(novaSenha !== confirmacao\) \{\s*setErro\(t\("passwordMismatch"\)\);\s*return;/,
  );

  const processingIndex = actionSource.indexOf("setSalvando(true);");
  const confirmationIndex = actionSource.indexOf(
    "if (novaSenha !== confirmacao)",
  );

  assert.ok(processingIndex > confirmationIndex);
});

test("ação preserva a sequência de autenticação, atualização, logout e navegação", () => {
  const getUserIndex = actionSource.indexOf("supabase.auth.getUser()");
  const recoveryIndex = actionSource.indexOf(
    "await sessaoEhRecuperacao()",
  );
  const updateIndex = actionSource.indexOf("supabase.auth.updateUser");
  const signOutIndex = actionSource.indexOf("supabase.auth.signOut()");
  const replaceIndex = actionSource.indexOf(
    'router.replace("/login?senhaRedefinida=1")',
  );
  const refreshIndex = actionSource.indexOf("router.refresh()");

  assert.ok(getUserIndex >= 0);
  assert.ok(recoveryIndex > getUserIndex);
  assert.ok(updateIndex > recoveryIndex);
  assert.ok(signOutIndex > updateIndex);
  assert.ok(replaceIndex > signOutIndex);
  assert.ok(refreshIndex > replaceIndex);
  assert.match(
    actionSource,
    /if \(erroUsuario \|\| !usuarioAtual\.user\) \{/,
  );
  assert.match(
    actionSource,
    /setEstadoLink\("invalido"\);\s*setErro\(t\("sessionInvalid"\)\);\s*return;/,
  );
  assert.match(
    actionSource,
    /await supabase\.auth\.updateUser\(\{\s*password: novaSenha,\s*\}\)/,
  );
  assert.match(
    actionSource,
    /obterMensagemErro\(error, t\("genericError"\)\)/,
  );
  assert.match(actionSource, /finally \{\s*setSalvando\(false\);\s*\}/);
});

test("página delega apenas o submit e preserva o formulário", () => {
  assert.match(
    pageSource,
    /import \{ useRedefinirSenhaSaveAction \} from "\.\/hooks\/use-redefinir-senha-save-action";/,
  );
  assert.match(
    pageSource,
    /const \{ salvarNovaSenha \} = useRedefinirSenhaSaveAction\(\{[\s\S]*?router,[\s\S]*?salvando,[\s\S]*?estadoLink,[\s\S]*?novaSenha,[\s\S]*?confirmacao,[\s\S]*?t,[\s\S]*?setEstadoLink,[\s\S]*?setErro,[\s\S]*?setSalvando,[\s\S]*?\}\);/,
  );
  assert.match(pageSource, /<form\s*onSubmit=\{salvarNovaSenha\}/);
  assert.doesNotMatch(pageSource, /async function salvarNovaSenha\(/);
  assert.doesNotMatch(pageSource, /supabase\.auth\.updateUser/);
  assert.doesNotMatch(pageSource, /supabase\.auth\.signOut\(\)/);
});
