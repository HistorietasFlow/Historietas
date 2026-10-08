import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hook = readFileSync(
  new URL(
    "../../app/obra/[slug]/hooks/use-obra-view-registration.ts",
    import.meta.url,
  ),
  "utf8",
);
const cliente = readFileSync(
  new URL("../../app/obra/[slug]/ObraDinamicaClient.tsx", import.meta.url),
  "utf8",
);

test("hook preserva guards, ref string unica e ordem do registro", () => {
  assert.match(hook, /useRef\(""\)/);
  assert.match(hook, /!obra/);
  assert.match(hook, /statusAcesso18 !== "permitido"/);
  assert.match(hook, /!idObraSupabaseValido\(obra\.id\)/);
  assert.match(hook, /const obraIdAtual = obra\.id;/);
  assert.match(
    hook,
    /visualizacaoObraRegistradaRef\.current === obraIdAtual/,
  );

  const marcarRef = hook.indexOf(
    "visualizacaoObraRegistradaRef.current = obraIdAtual;",
  );
  const chamadaAssincrona = hook.indexOf(
    "await incrementarVisualizacaoObraPublicaSupabase(obraIdAtual);",
  );

  assert.ok(marcarRef >= 0);
  assert.ok(chamadaAssincrona > marcarRef);
  assert.match(hook, /if \(totalVisualizacoes === null\) \{\s*return;/);
  assert.doesNotMatch(
    hook,
    /visualizacaoObraRegistradaRef\.current = ""/,
  );
  assert.doesNotMatch(hook, /\bSet\b|localStorage|sessionStorage/);
});

test("hook atualiza somente visualizacoes com updater funcional e Math.max", () => {
  assert.match(
    hook,
    /setMetricasObra\(\(metricasAtuais\) => \(\{[\s\S]*?\.\.\.metricasAtuais,[\s\S]*?visualizacoes: Math\.max\([\s\S]*?metricasAtuais\.visualizacoes,[\s\S]*?totalVisualizacoes\s*\),[\s\S]*?\}\)\);/,
  );
  assert.match(
    hook,
    /\}, \[obra, statusAcesso18, setMetricasObra\]\);/,
  );
});

test("cliente delega somente o registro de visualizacao", () => {
  assert.match(
    cliente,
    /import \{ useObraViewRegistration \} from "\.\/hooks\/use-obra-view-registration";/,
  );
  assert.match(
    cliente,
    /useObraViewRegistration\(obra, statusAcesso18, setMetricasObra\);/,
  );
  assert.doesNotMatch(cliente, /visualizacaoObraRegistradaRef/);
  assert.doesNotMatch(cliente, /incrementarVisualizacaoObraPublicaSupabase/);
});
