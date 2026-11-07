import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import "../env.mjs";

const qaDir = path.dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const rootDir = path.dirname(qaDir);
const baseUrl = new URL(process.env.E2E_BASE_URL || "http://127.0.0.1:3000");

if (!new Set(["127.0.0.1", "localhost", "[::1]"]).has(baseUrl.hostname)) {
  throw new Error(`O runner E2E local recusa servidor remoto: ${baseUrl.origin}`);
}

function iniciar(comando, argumentos, opcoes = {}) {
  return spawn(comando, argumentos, {
    shell: false,
    stdio: "inherit",
    windowsHide: true,
    ...opcoes,
  });
}

async function aguardarServidor(processo, timeoutMs = 120_000) {
  const limite = Date.now() + timeoutMs;

  while (Date.now() < limite) {
    if (processo.exitCode !== null) {
      throw new Error(`O servidor Next encerrou antes de ficar pronto (${processo.exitCode}).`);
    }

    try {
      const resposta = await fetch(baseUrl, { redirect: "manual" });
      if (resposta.status < 500) return;
    } catch {}

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`O servidor Next não respondeu em ${baseUrl.origin}.`);
}

async function encerrar(processo) {
  if (processo.exitCode !== null) return;

  processo.kill();
  await Promise.race([
    new Promise((resolve) => processo.once("exit", resolve)),
    new Promise((resolve) => setTimeout(resolve, 5_000)),
  ]);

  if (processo.exitCode === null) processo.kill("SIGKILL");
}

const servidor = iniciar(
  process.execPath,
  [path.join(rootDir, "node_modules/next/dist/bin/next"), "start", rootDir],
  { cwd: rootDir, env: process.env },
);

try {
  await aguardarServidor(servidor);

  const playwright = iniciar(
    process.execPath,
    [path.join(qaDir, "node_modules/@playwright/test/cli.js"), "test", ...process.argv.slice(2)],
    {
      cwd: qaDir,
      env: { ...process.env, E2E_SERVER_EXTERNALLY_MANAGED: "true" },
    },
  );
  const codigo = await new Promise((resolve) => playwright.once("exit", resolve));
  process.exitCode = codigo ?? 1;
} finally {
  await encerrar(servidor);
}
