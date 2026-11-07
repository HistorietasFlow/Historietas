import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const nomeLista = (process.argv[2] || "").trim();
assert.ok(nomeLista, "Informe o nome da lista de testes definida em package.json.");

const packageJson = JSON.parse(
  readFileSync(new URL("../../package.json", import.meta.url), "utf8"),
);
const lista = packageJson.scripts?.[nomeLista] || "";
const arquivos = lista.split(/\s+/).filter(Boolean);

assert.ok(arquivos.length > 0, `A lista ${nomeLista} está vazia.`);
arquivos.forEach((arquivo) => {
  assert.match(
    arquivo,
    /^qa\/(?:unit|integration)\/[a-z0-9-]+\.test\.mjs$/,
    `Arquivo de teste inválido em ${nomeLista}: ${arquivo}`,
  );
});

const resultado = spawnSync(
  process.execPath,
  [
    "--import",
    "./qa/scripts/test-source-newlines.mjs",
    "--test",
    ...arquivos,
  ],
  {
    cwd: new URL("../../", import.meta.url),
    env: process.env,
    shell: false,
    stdio: "inherit",
  },
);

if (resultado.error) {
  throw resultado.error;
}

process.exitCode = resultado.status ?? 1;
