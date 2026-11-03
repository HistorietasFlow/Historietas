import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const modal = readFileSync("components/DenunciaModal.tsx", "utf8");
const submit = readFileSync(
  "components/hooks/use-denuncia-submit-action.ts",
  "utf8",
);
const lifecycle = readFileSync(
  "components/hooks/use-denuncia-modal-lifecycle.ts",
  "utf8",
);
const types = readFileSync("components/denuncia-types.ts", "utf8");

test("hooks de denúncia dependem de tipos neutros, não do modal", () => {
  for (const source of [submit, lifecycle]) {
    assert.match(source, /from "\.\.\/denuncia-types"/);
    assert.doesNotMatch(source, /from "\.\.\/DenunciaModal"/);
  }
});

test("DenunciaModal preserva os exports públicos dos tipos", () => {
  assert.match(
    modal,
    /export type \{ MotivoDenuncia, TipoAlvoDenuncia \} from "\.\/denuncia-types";/,
  );
  assert.match(
    modal,
    /import type \{ MotivoDenuncia, TipoAlvoDenuncia \} from "\.\/denuncia-types";/,
  );
});

test("arquivo neutro concentra os unions usados pela denúncia", () => {
  assert.match(types, /export type TipoAlvoDenuncia =/);
  assert.match(types, /export type MotivoDenuncia =/);
  assert.match(types, /\| "perfil";/);
  assert.match(types, /\| "outro";/);
});
