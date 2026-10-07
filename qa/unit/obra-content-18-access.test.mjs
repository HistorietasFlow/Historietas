import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hook = readFileSync(
  new URL(
    "../../app/obra/[slug]/hooks/use-obra-content-18-access.ts",
    import.meta.url,
  ),
  "utf8",
);
const cliente = readFileSync(
  new URL("../../app/obra/[slug]/ObraDinamicaClient.tsx", import.meta.url),
  "utf8",
);

test("hook preserva estado indexado por obra, derivacao e reavaliacao agendada", () => {
  assert.match(hook, /export function useObraContent18Access\(obra: ObraDinamica \| null\)/);
  assert.match(
    hook,
    /obraId: "",\s*status: "verificando",/,
  );
  assert.match(
    hook,
    /obra && controleAcesso18\.obraId === obra\.id\s*\? controleAcesso18\.status\s*:\s*"verificando"/,
  );
  assert.match(hook, /window\.setTimeout\(\(\) => \{/);
  assert.match(hook, /\}, 0\);/);
  assert.match(hook, /\}, \[obra\]\);/);
  assert.match(hook, /window\.clearTimeout\(atualizarAcessoTimer\);/);
});

test("hook preserva estados de acesso, otimizacao e confirmacao manual", () => {
  assert.match(
    hook,
    /!ehClassificacao18\(obra\.classificacaoIndicativa\)\s*\? "permitido"\s*:\ acessoConteudo18Confirmado\(\)\s*\? "permitido"\s*:\ "bloqueado"/,
  );
  assert.match(
    hook,
    /controleAtual\.obraId === obra\.id &&\s*controleAtual\.status === proximoStatus/,
  );
  assert.match(hook, /return controleAtual;/);
  assert.match(
    hook,
    /function permitirAcesso18Atual\(\)[\s\S]*?setControleAcesso18\(\{ obraId: obra\.id, status: "permitido" \}\);/,
  );
  assert.match(hook, /return \{ statusAcesso18, permitirAcesso18Atual \};/);
});

test("cliente delega somente o estado de acesso e preserva gate e visualizacao", () => {
  assert.match(
    cliente,
    /import \{ useObraContent18Access \} from "\.\/hooks\/use-obra-content-18-access";/,
  );
  assert.match(
    cliente,
    /const \{ statusAcesso18, permitirAcesso18Atual \} =\s*useObraContent18Access\(obra\);/,
  );
  assert.doesNotMatch(cliente, /const \[controleAcesso18, setControleAcesso18\]/);
  assert.match(cliente, /statusAcesso18 !== "permitido"/);
  assert.match(cliente, /onConfirmar=\{permitirAcesso18Atual\}/);
  assert.match(cliente, /visualizacaoObraRegistradaRef/);
  assert.match(cliente, /incrementarVisualizacaoObraPublicaSupabase/);
});
