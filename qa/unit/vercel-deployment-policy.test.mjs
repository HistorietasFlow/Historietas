import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { matchesGlob } from "node:path";
import test from "node:test";

const vercelConfig = JSON.parse(
  await readFile(new URL("../../vercel.json", import.meta.url), "utf8"),
);

const deploymentEnabled = vercelConfig.git?.deploymentEnabled;

function deploymentHabilitadoParaBranch(branch) {
  const regrasCorrespondentes = Object.entries(deploymentEnabled).filter(
    ([padrao]) => matchesGlob(branch, padrao),
  );

  return regrasCorrespondentes.length === 0
    ? true
    : regrasCorrespondentes.some(([, habilitado]) => habilitado);
}

test("mantém deploy automático somente para a main", () => {
  assert.equal(
    vercelConfig.$schema,
    "https://openapi.vercel.sh/vercel.json",
  );
  assert.deepEqual(deploymentEnabled, {
    "**": false,
    main: true,
  });
  assert.equal(deploymentHabilitadoParaBranch("main"), true);
  assert.equal(deploymentHabilitadoParaBranch("feature-simples"), false);
  assert.equal(deploymentHabilitadoParaBranch("fix/alguma-coisa"), false);
  assert.equal(Object.hasOwn(deploymentEnabled, "*"), false);
});
