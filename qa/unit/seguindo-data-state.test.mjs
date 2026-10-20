import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(
  new URL("../../app/seguindo/page.tsx", import.meta.url),
  "utf8",
);
const hook = readFileSync(
  new URL("../../app/seguindo/hooks/use-seguindo-data-state.ts", import.meta.url),
  "utf8",
);

test("Seguindo delega somente o estado bruto dos dados para hook dedicado", () => {
  assert.match(
    page,
    /import \{ useSeguindoDataState \} from "\.\/hooks\/use-seguindo-data-state";/,
  );
  assert.match(page, /\} = useSeguindoDataState\(\);/);
  assert.match(page, /useSeguindoDataLoader\(/);
  assert.match(page, /useSeguindoDataLoadTrigger\(/);

  assert.match(hook, /^"use client";/);
  assert.match(hook, /useState<ObraLocal\[\]>\(\[\]\)/);
  assert.match(hook, /useState<string\[\]>\(\[\]\)/);
  assert.match(hook, /useState<UsuarioSeguido\[\]>\(\[\]\)/);
  assert.match(hook, /useState<\s*SolicitacaoSeguidor\[\]\s*>\(\[\]\)/);
  assert.match(hook, /useState<AtividadeSeguindo\[\]>\(\[\]\)/);
  assert.match(hook, /useState\(true\)/);
  for (const setter of [
    "setObras",
    "setObrasSeguidas",
    "setAutoresSeguidos",
    "setUsuariosSeguidos",
    "setUsuariosSeguidores",
    "setSolicitacoesSeguidores",
    "setSolicitacoesEnviadasIds",
    "setAtividadesSeguindo",
    "setCarregando",
  ]) {
    assert.match(hook, new RegExp(setter));
  }
  assert.doesNotMatch(hook, /supabase|localStorage|useEffect|fetch\(/);
});
