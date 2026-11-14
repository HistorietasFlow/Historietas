import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {loadApplicationModule} from "../helpers/load-application-module.mjs";
import {criarPublicarHarness, rejeicaoPublicar} from "../helpers/publicar-submission-harness.mjs";

const hook = readFileSync(
  new URL("../../app/publicar/hooks/use-publicar-submission.ts", import.meta.url),
  "utf8",
);
const page = readFileSync(
  new URL("../../app/publicar/page.tsx", import.meta.url),
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

function montarHook(s) {
  let ref;
  return loadApplicationModule("app/publicar/hooks/use-publicar-submission.ts", {
    react: {useRef: initial => ref ??= {current: initial}},
    "../lib/publicar-submission-action": s.action,
  }).usePublicarSubmission;
}

test("duplo envio no mesmo instante e após rerender executa apenas uma publicação", async () => {
  const s = criarPublicarHarness(), useSubmission = montarHook(s);
  let liberar;
  s.falhas.set("auth", escrever => new Promise(resolve => {liberar = () => resolve(escrever());}));
  const event = {preventDefault() {}};
  const primeira = useSubmission(s.params).salvarObra(event);
  await useSubmission({...s.params, titulo: "Título alterado"}).salvarObra(event);
  assert.deepEqual(s.calls, ["auth"]);
  liberar();
  await primeira;
  await useSubmission(s.params).salvarObra(event);
  assert.equal(s.calls.filter(call => call === "obras:insert").length, 1);
  assert.equal(s.calls.filter(call => call === "capas-obras:upload").length, 1);
  assert.equal([...s.obras.values()][0].titulo, "Minha obra");
});

test("hook conserva bloqueio incerto entre renders, inclusive com campos editados", async () => {
  const s = criarPublicarHarness(), useSubmission = montarHook(s);
  s.falhas.set("obras:insert", escrever => {escrever(); throw new Error("Resposta perdida");});
  await useSubmission(s.params).salvarObra({preventDefault() {}});
  const feitas = [...s.calls];
  await useSubmission({...s.params, titulo: "Outro título", validarFormulario: () => "Inválido"}).salvarObra({preventDefault() {}});
  assert.deepEqual(s.calls, feitas);
  assert.match(s.state.erro, /confirmar/);
});

test("após limpeza comprovada, usuário pode reenviar com os campos do render atual", async () => {
  const s = criarPublicarHarness(), useSubmission = montarHook(s);
  s.falhas.set("capitulos:insert", rejeicaoPublicar);
  await useSubmission(s.params).salvarObra({preventDefault() {}});
  assert.equal(s.obras.size, 0);
  assert.equal(s.arquivos.size, 0);
  s.falhas.clear();
  await useSubmission({...s.params, titulo: "Título revisado"}).salvarObra({preventDefault() {}});
  assert.equal(s.obras.size, 1);
  assert.equal(s.arquivos.size, 1);
  assert.equal([...s.obras.values()][0].titulo, "Título revisado");
});

test("usePublicarSubmission preserva a guarda de envio e delega a ação", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /export function usePublicarSubmission\(/);
  assert.match(hook, /const jaSalvouRef = useRef\(false\)/);
  assert.match(hook, /async function salvarObra\(event: FormEvent<HTMLFormElement>\)/);
  assert.match(hook, /salvarObraPublicar\(/);
  assert.match(hook, /\.\.\.params,/);
  assert.match(hook, /jaSalvouRef,/);
  assert.match(hook, /return \{ salvarObra \};/);
  assert.doesNotMatch(hook, /supabase|localStorage|useEffect/);
});

test("Publicar delega somente o adapter de submissão ao hook", () => {
  assert.match(
    page,
    /import \{ usePublicarFormController \} from "\.\/hooks\/use-publicar-form-controller";/,
  );
  assert.match(formController, /import \{ usePublicarSubmission \} from "\.\/use-publicar-submission";/);
  assert.match(formController, /const \{ salvarObra \} = usePublicarSubmission\(\{/);
  assert.doesNotMatch(page, /useRef\(/);
  assert.doesNotMatch(page, /async function salvarObra\(/);
  assert.doesNotMatch(page, /salvarObraPublicar\(/);
  assert.match(action, /export type SalvarObraPublicarParams = \{/);
  assert.match(action, /export async function salvarObraPublicar\(/);
});
