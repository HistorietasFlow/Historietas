import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(
  new URL("../../app/publicar/page.tsx", import.meta.url),
  "utf8",
);
const pageController = readFileSync(
  new URL("../../app/publicar/hooks/use-publicar-page-controller.ts", import.meta.url),
  "utf8",
);
const formController = readFileSync(
  new URL("../../app/publicar/hooks/use-publicar-form-controller.ts", import.meta.url),
  "utf8",
);
const action = readFileSync(
  new URL("../../app/publicar/lib/publicar-submission-action.ts", import.meta.url),
  "utf8",
);
const hook = readFileSync(
  new URL("../../app/publicar/hooks/use-publicar-submission.ts", import.meta.url),
  "utf8",
);

test("ação de submissão de Publicar preserva a transação, rollback e navegação", () => {
  assert.match(action, /export async function salvarObraPublicar\(/);
  assert.match(action, /event: FormEvent<HTMLFormElement>/);
  assert.match(action, /event\.preventDefault\(\)/);
  assert.match(action, /const mensagemErro = validarFormulario\(\)/);
  assert.match(action, /if \(jaSalvouRef\.current\)/);
  assert.match(action, /jaSalvouRef\.current = true/);
  assert.match(action, /setProcessando\(true\)/);
  assert.match(action, /supabase\.auth\.getUser\(\)/);
  assert.match(action, /supabase\.from\("obras"\)\.insert\(/);
  assert.match(action, /supabase\.from\("capitulos"\)\.insert\(/);
  assert.match(action, /\.eq\("id", obraId\)\s*\.eq\("user_id", userId\)/);
  assert.match(action, /enviarArquivoStorage\("capas-obras", userId, capaArquivo\)/);
  assert.match(action, /enviarArquivoStorage\(\s*"arquivos-obras",/);
  assert.match(action, /await registrarDiarioPublicacao\(/);
  assert.match(action, /tipo: "publicou_obra"/);
  assert.match(action, /tipo: "publicou_capitulo"/);
  assert.match(action, /salvarObrasLocalmente\(novasObrasDoUsuario, userId\)/);
  assert.match(action, /await desfazerPublicacaoParcialPublicar\(/);
  assert.match(action, /erroDesconhecido\.name === "QuotaExceededError"/);
  assert.match(action, /router\.replace\("\/painel-autor"\)/);
  assert.match(action, /router\.refresh\(\)/);
  assert.match(action, /window\.scrollTo\(/);
});

test("página de Publicar delega a submissão sem duplicar os efeitos", () => {
  assert.match(
    pageController,
    /import \{ usePublicarFormController \} from "\.\/use-publicar-form-controller";/,
  );
  assert.match(formController, /import \{ usePublicarSubmission \} from "\.\/use-publicar-submission";/);
  assert.match(formController, /const \{ salvarObra \} = usePublicarSubmission\(\{/);
  assert.doesNotMatch(page, /from "\.\/lib\/publicar-submission-action";/);
  assert.doesNotMatch(page, /async function salvarObra\(/);
  assert.match(hook, /from "\.\.\/lib\/publicar-submission-action";/);
  assert.match(hook, /async function salvarObra\(event: FormEvent<HTMLFormElement>\)/);
  assert.match(hook, /return salvarObraPublicar\(/);
  for (const dependencia of [
    "router,",
    "setAutor,",
    "setErro,",
    "setProcessando,",
    "validarFormulario,",
  ]) {
    assert.ok(formController.includes(dependencia), `dependência preservada: ${dependencia}`);
  }
  assert.match(hook, /const jaSalvouRef = useRef\(false\)/);
  assert.doesNotMatch(page, /supabase\.auth\.getUser\(\)/);
  assert.doesNotMatch(page, /supabase\.from\("obras"\)/);
  assert.doesNotMatch(page, /enviarArquivoStorage\(/);
  assert.doesNotMatch(page, /desfazerPublicacaoParcialPublicar\(/);
});
