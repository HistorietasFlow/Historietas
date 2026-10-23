import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hook = readFileSync(
  new URL("../../app/publicar/hooks/use-publicar-submission.ts", import.meta.url),
  "utf8",
);
const page = readFileSync(
  new URL("../../app/publicar/page.tsx", import.meta.url),
  "utf8",
);
const action = readFileSync(
  new URL("../../app/publicar/lib/publicar-submission-action.ts", import.meta.url),
  "utf8",
);

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
    /import \{ usePublicarSubmission \} from "\.\/hooks\/use-publicar-submission";/,
  );
  assert.match(page, /const \{ salvarObra \} = usePublicarSubmission\(\{/);
  assert.doesNotMatch(page, /useRef\(/);
  assert.doesNotMatch(page, /async function salvarObra\(/);
  assert.doesNotMatch(page, /salvarObraPublicar\(/);
  assert.match(action, /export type SalvarObraPublicarParams = \{/);
  assert.match(action, /export async function salvarObraPublicar\(/);
});
