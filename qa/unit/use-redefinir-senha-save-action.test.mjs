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
    /controle\.ocupado \|\| salvando \|\| estadoLink !== "valido"/,
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
  const recoveryIndex = actionSource.indexOf("await obterSessaoRecuperacao()");
  const updateIndex = actionSource.indexOf("await atualizarSenhaNaSessaoRecuperacao(");
  const signOutIndex = actionSource.indexOf("await supabase.auth.signOut()");
  const finalIndex = actionSource.indexOf("await supabase.auth.getSession()");
  const replaceIndex = actionSource.indexOf('router.replace("/login?senhaRedefinida=1")');
  assert.ok(recoveryIndex >= 0);
  assert.ok(updateIndex > recoveryIndex);
  assert.ok(signOutIndex > updateIndex);
  assert.ok(finalIndex > signOutIndex);
  assert.ok(replaceIndex > finalIndex);
  assert.match(actionSource, /data\.user\?\.id !== sessaoEsperada\.usuarioId/);
  assert.match(actionSource, /contexto\.consumido = true/);
  assert.match(actionSource, /obterMensagemErro\(error, t\("genericError"\)\)/);
  assert.match(actionSource, /if \(controle\.ativo\) setSalvando\(false\)/);
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
