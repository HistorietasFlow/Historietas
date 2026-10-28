import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pagina = await readFile("app/em-breve/page.tsx", "utf8");
const modulo = await readFile(
  "app/em-breve/lib/em-breve-presentation-utils.ts",
  "utf8",
);

test("helper de icone tematico preserva normalizacao, ordem e simbolos", () => {
  [
    "normalizarTexto(genero)",
    'includes("romance")',
    'includes("terror")',
    'includes("fantasia")',
    'includes("acao")',
    'includes("aventura")',
    'includes("comedia")',
    'includes("ficcao")',
    'includes("sci-fi")',
    'includes("sci fi")',
    'includes("misterio")',
    'includes("suspense")',
    'includes("sobrenatural")',
    '"♡"',
    '"☾"',
    '"✦"',
    '"⚡"',
    '"⌖"',
    '"☺"',
    '"⌬"',
    '"◇"',
    '"◌"',
    '"✧"',
  ].forEach((contrato) => assert.ok(modulo.includes(contrato), contrato));

  assert.doesNotMatch(
    modulo,
    /supabase|\.from\(|useEffect|useState|router|localStorage|MutationObserver|Style|\.insert\(|\.update\(|\.delete\(/,
  );
});

test("pagina delega o icone e preserva seus demais usos", () => {
  assert.match(pagina, /from "\.\/lib\/em-breve-presentation-utils"/);
  assert.doesNotMatch(pagina, /function obterIconeTematicaEmBreve/);
  assert.match(pagina, /obterIconeTematicaEmBreve\(obra\.genero\)/);
  assert.match(pagina, /normalizarTexto/);
});
