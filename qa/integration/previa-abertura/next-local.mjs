import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createServer, request } from "node:http";
import { createConnection, createServer as criarSocket } from "node:net";
import { setTimeout as pausa } from "node:timers/promises";

export function urlLocal(valor, protocolos) {
  const url = new URL(valor);
  assert.ok(protocolos.includes(url.protocol) && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname));
  assert.equal(url.search, "");
  return url;
}

async function escutar(server) {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  return server.address().port;
}

export async function observarApi(destino) {
  const chamadas = [];
  let indisponivel = false;
  let proximaPrevia;
  const server = createServer(async (entrada, saida) => {
    const entradaUrl = new URL(entrada.url, "http://localhost");
    const alvo = new URL(destino);
    alvo.pathname = entradaUrl.pathname;
    alvo.search = entradaUrl.search;
    chamadas.push(alvo.pathname);
    if (indisponivel) { saida.writeHead(503).end(); return; }
    if (proximaPrevia && alvo.pathname === "/rest/v1/rpc/previa_abertura_assinada") {
      const controle = proximaPrevia;
      proximaPrevia = undefined;
      controle.recebida.resolve(Number(entrada.headers["x-historietas-previa-exp"]));
      await controle.liberada.promise;
    }
    const upstream = request(alvo, {
      method: entrada.method, headers: { ...entrada.headers, host: destino.host },
    }, res => {
      saida.writeHead(res.statusCode, res.headers);
      res.pipe(saida);
    });
    upstream.on("error", () => saida.writeHead(503).end());
    entrada.pipe(upstream);
  });
  const porta = await escutar(server);
  return {
    url: "http://127.0.0.1:" + porta, chamadas,
    pausarProximaPrevia() {
      assert.ok(!proximaPrevia);
      const controle = { recebida: Promise.withResolvers(), liberada: Promise.withResolvers() };
      proximaPrevia = controle;
      return { recebida: controle.recebida.promise, liberar: () => controle.liberada.resolve() };
    },
    simularFalha(valor) { indisponivel = valor; },
    fechar() { server.closeAllConnections(); return new Promise(resolve => server.close(resolve)); },
  };
}

export async function iniciarNext(api, chave, habilitado, chaveProva, chaveServicoLocal) {
  const reserva = criarSocket();
  const porta = await escutar(reserva);
  await new Promise(resolve => reserva.close(resolve));
  const filho = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--webpack", "-H", "127.0.0.1", "-p", String(porta)], {
    detached: process.platform !== "win32",
    env: {
      PATH: process.env.PATH, HOME: process.env.HOME, SystemRoot: process.env.SystemRoot,
      NEXT_TELEMETRY_DISABLED: "1", NEXT_PUBLIC_SUPABASE_URL: api, NEXT_PUBLIC_SUPABASE_ANON_KEY: chave,
      SUPABASE_SERVICE_ROLE_KEY: chaveServicoLocal,
      HISTORIETAS_PREVIA_CHAVE_ENSAIO: chaveProva,
      HISTORIETAS_PREVIA_LOCAL: habilitado ? "1" : "0",
    },
    stdio: ["ignore", "ignore", "inherit"],
  });
  const fim = once(filho, "exit");
  async function parar() {
    if (filho.exitCode !== null || filho.signalCode) return;
    if (process.platform === "win32") filho.kill();
    else process.kill(-filho.pid, "SIGTERM");
    await fim;
  }
  try {
    for (let i = 0; i < 160; i++) {
      if (filho.exitCode !== null || filho.signalCode) throw new Error("Next encerrou antes de atender");
      const pronto = await new Promise(resolve => {
        const socket = createConnection(porta, "127.0.0.1");
        socket.once("connect", () => { socket.end(); resolve(true); });
        socket.once("error", () => resolve(false));
      });
      if (pronto) return { origem: "http://127.0.0.1:" + porta, parar };
      await pausa(250);
    }
    throw new Error("Next local não iniciou");
  } catch (erro) { await parar(); throw erro; }
}
