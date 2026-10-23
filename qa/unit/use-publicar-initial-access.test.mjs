import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hook = readFileSync(
  new URL("../../app/publicar/hooks/use-publicar-initial-access.ts", import.meta.url),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/publicar/page.tsx", import.meta.url),
  "utf8",
);
const controladorPagina = readFileSync(
  new URL("../../app/publicar/hooks/use-publicar-page-controller.ts", import.meta.url),
  "utf8",
);
const controladorFormulario = readFileSync(
  new URL("../../app/publicar/hooks/use-publicar-form-controller.ts", import.meta.url),
  "utf8",
);
const acaoSubmissao = readFileSync(
  new URL("../../app/publicar/lib/publicar-submission-action.ts", import.meta.url),
  "utf8",
);
const hookSubmissao = readFileSync(
  new URL("../../app/publicar/hooks/use-publicar-submission.ts", import.meta.url),
  "utf8",
);

test("usePublicarInitialAccess preserves the publication access lifecycle", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /export function usePublicarInitialAccess\(/);
  assert.match(hook, /const \{ data, error \} = await supabase\.auth\.getUser\(\);/);
  assert.match(hook, /if \(error \|\| !data\.user\) \{[\s\S]*?router\.replace\(criarLoginHrefPublicar\(\)\);/);
  assert.match(hook, /const statusAceite = await verificarAceiteTermosPublicacao\(\);/);
  assert.match(hook, /router\.replace\(criarHrefAceiteTermos\("\/publicar"\)\);/);
  assert.match(hook, /const nomePerfil = await carregarNomePerfilPublicar\([\s\S]*?data\.user\.id,[\s\S]*?nomeFallback/);
  assert.match(hook, /window\.setTimeout\(\(\) => \{[\s\S]*?setAutor\(\(autorAtual\) =>[\s\S]*?setVerificandoAutenticacao\(false\);[\s\S]*?\}, 0\);/);
  assert.equal((hook.match(/if \(cancelado\)/g) || []).length, 3);
  assert.match(hook, /return \(\) => \{[\s\S]*?cancelado = true;/);
  assert.match(hook, /\}, \[router, setAutor, setVerificandoAutenticacao\]\);/);
});

test("Publicar delega apenas o lifecycle inicial de acesso ao hook", () => {
  assert.match(pagina, /import \{ usePublicarPageController \} from "\.\/hooks\/use-publicar-page-controller";/);
  assert.match(controladorPagina, /import \{ usePublicarInitialAccess \} from "\.\/use-publicar-initial-access";/);
  assert.match(controladorPagina, /usePublicarInitialAccess\(\{[\s\S]*?router,[\s\S]*?setAutor: formulario\.setAutor,[\s\S]*?setVerificandoAutenticacao,[\s\S]*?\}\);/);
  assert.doesNotMatch(pagina, /async function verificarAutenticacaoPublicacao\(/);
  assert.doesNotMatch(pagina, /verificarAceiteTermosPublicacao/);
  assert.doesNotMatch(pagina, /criarHrefAceiteTermos/);
  assert.match(controladorPagina, /import \{ usePublicarFormController \} from "\.\/use-publicar-form-controller";/);
  assert.match(controladorFormulario, /import \{ usePublicarSubmission \} from "\.\/use-publicar-submission";/);
  assert.doesNotMatch(pagina, /from "\.\/lib\/publicar-submission-action";/);
  assert.doesNotMatch(pagina, /async function salvarObra/);
  assert.match(hookSubmissao, /from "\.\.\/lib\/publicar-submission-action";/);
  assert.match(hookSubmissao, /async function salvarObra/);
  assert.doesNotMatch(pagina, /supabase\.auth\.getUser/);
  assert.match(acaoSubmissao, /export async function salvarObraPublicar/);
  assert.match(acaoSubmissao, /supabase\.auth\.getUser/);
});
