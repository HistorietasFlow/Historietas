import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../../app/seguindo/page.tsx", import.meta.url), "utf8");
const hook = readFileSync(new URL("../../app/seguindo/hooks/use-seguindo-access-state.ts", import.meta.url), "utf8");

test("estado de acesso preserva defaults e setters", () => {
  assert.match(page, /useSeguindoPageContext\(\s*mostrarPainelOrdenacao,?\s*\)/);
  assert.match(hook, /const \[verificandoAcesso, setVerificandoAcesso\] = useState\(true\)/);
  assert.match(hook, /const \[usuarioLogadoId, setUsuarioLogadoId\] = useState\(""\)/);
  assert.match(hook, /return \{ verificandoAcesso, setVerificandoAcesso, usuarioLogadoId, setUsuarioLogadoId \}/);
});
