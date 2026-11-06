import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

import { createClient } from "@supabase/supabase-js";

function removerAspas(valor) {
  const texto = valor.trim();
  return texto.startsWith('"') && texto.endsWith('"')
    ? JSON.parse(texto)
    : texto;
}

function lerAmbienteSupabaseLocal() {
  const urlExplicita = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const chaveExplicita = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ""
  ).trim();

  if (urlExplicita && chaveExplicita) {
    assert.ok(
      new Set(["127.0.0.1", "localhost", "[::1]"]).has(
        new URL(urlExplicita).hostname,
      ),
      "O teste recusa Supabase remoto.",
    );
    return { url: urlExplicita, publicKey: chaveExplicita };
  }

  const saida = execFileSync("supabase", ["status", "-o", "env"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  const variaveis = Object.fromEntries(
    saida
      .split(/\r?\n/)
      .map((linha) => /^([A-Z0-9_]+)=(.*)$/.exec(linha.trim()))
      .filter(Boolean)
      .map((resultado) => [resultado[1], removerAspas(resultado[2])]),
  );
  const url = variaveis.API_URL || variaveis.SUPABASE_URL || "";
  const publicKey = variaveis.ANON_KEY || variaveis.PUBLISHABLE_KEY || "";

  assert.ok(url && publicKey, "O Supabase local não informou URL e chave pública.");
  assert.ok(
    new Set(["127.0.0.1", "localhost", "[::1]"]).has(new URL(url).hostname),
    "O teste recusa Supabase remoto.",
  );

  return { url, publicKey };
}

function criarCliente(url, key) {
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

async function entrar(cliente, email, password) {
  const resposta = await cliente.auth.signInWithPassword({ email, password });
  assert.equal(resposta.error, null, resposta.error?.message);
  assert.ok(resposta.data.user?.id);
  return resposta.data.user.id;
}

function argumentos({ obraId, capituloId, lido, ocorridoEm, progresso = 50 }) {
  return {
    p_obra_id: obraId,
    p_capitulo_id: capituloId,
    p_lido: lido,
    p_progresso: progresso,
    p_ocorrido_em: ocorridoEm,
  };
}

async function sincronizar(cliente, args) {
  const resposta = await cliente.rpc("salvar_progresso_leitura", args);
  assert.equal(resposta.error, null, resposta.error?.message);
  return resposta.data;
}

async function obterEstado(cliente, userId, obraId, capituloId) {
  const resposta = await cliente
    .from("progresso_leitura")
    .select("user_id,lido,progresso,atualizado_em")
    .eq("user_id", userId)
    .eq("obra_id", obraId)
    .eq("capitulo_id", capituloId)
    .maybeSingle();
  assert.equal(resposta.error, null, resposta.error?.message);
  return resposta.data;
}

test("preserva progresso mais recente entre dispositivos e contas", async (t) => {
  const obraId = (process.env.E2E_PUBLIC_WORK_ID || "").trim();
  const capituloId = (process.env.E2E_PUBLIC_CHAPTER_ID || "").trim();
  const email = (process.env.E2E_USER_EMAIL || "").trim();
  const password = process.env.E2E_USER_PASSWORD || "";
  const outroEmail = (process.env.E2E_VISITOR_EMAIL || "").trim();
  const outroPassword = process.env.E2E_VISITOR_PASSWORD || "";

  assert.ok(
    obraId && capituloId && email && password && outroEmail && outroPassword,
    "Prepare as fixtures E2E locais antes do teste.",
  );

  const ambiente = lerAmbienteSupabaseLocal();
  const dispositivoA = criarCliente(ambiente.url, ambiente.publicKey);
  const dispositivoB = criarCliente(ambiente.url, ambiente.publicKey);
  const outraConta = criarCliente(ambiente.url, ambiente.publicKey);
  const anon = criarCliente(ambiente.url, ambiente.publicKey);
  const userId = await entrar(dispositivoA, email, password);
  assert.equal(await entrar(dispositivoB, email, password), userId);
  const outroUserId = await entrar(outraConta, outroEmail, outroPassword);

  async function limpar(cliente, alvoUserId) {
    const resposta = await cliente
      .from("progresso_leitura")
      .delete()
      .eq("user_id", alvoUserId)
      .eq("obra_id", obraId)
      .eq("capitulo_id", capituloId);
    assert.equal(resposta.error, null, resposta.error?.message);
  }

  t.after(async () => {
    await Promise.all([
      limpar(dispositivoA, userId),
      limpar(outraConta, outroUserId),
    ]);
    await Promise.all([
      dispositivoA.auth.signOut(),
      dispositivoB.auth.signOut(),
      outraConta.auth.signOut(),
    ]);
  });

  await limpar(dispositivoA, userId);
  await limpar(outraConta, outroUserId);

  const base = Date.now();
  const antiga = new Date(base).toISOString();
  const recente = new Date(base + 2_000).toISOString();
  const maisRecente = new Date(base + 4_000).toISOString();

  await t.test("resposta antiga não apaga leitura mais nova", async () => {
    assert.equal(
      await sincronizar(dispositivoB, argumentos({ obraId, capituloId, lido: true, ocorridoEm: recente })),
      true,
    );
    assert.equal(
      await sincronizar(dispositivoA, argumentos({ obraId, capituloId, lido: false, ocorridoEm: antiga })),
      false,
    );
    assert.equal((await obterEstado(dispositivoA, userId, obraId, capituloId))?.lido, true);
  });

  await t.test("tombstone recente impede ressurreição e aceita retry", async () => {
    assert.equal(
      await sincronizar(dispositivoB, argumentos({ obraId, capituloId, lido: false, ocorridoEm: maisRecente, progresso: 0 })),
      true,
    );
    assert.equal(
      await sincronizar(dispositivoA, argumentos({ obraId, capituloId, lido: true, ocorridoEm: recente })),
      false,
    );
    assert.equal(
      await sincronizar(dispositivoA, argumentos({ obraId, capituloId, lido: false, ocorridoEm: maisRecente, progresso: 0 })),
      true,
    );
    const estado = await obterEstado(dispositivoA, userId, obraId, capituloId);
    assert.equal(estado?.lido, false);
    assert.equal(Date.parse(estado?.atualizado_em || ""), Date.parse(maisRecente));
  });

  await t.test("requisições concorrentes convergem para o evento mais recente", async () => {
    const concorrenteAntiga = new Date(base + 6_000).toISOString();
    const concorrenteRecente = new Date(base + 8_000).toISOString();
    await Promise.all([
      sincronizar(dispositivoA, argumentos({ obraId, capituloId, lido: true, ocorridoEm: concorrenteAntiga })),
      sincronizar(dispositivoB, argumentos({ obraId, capituloId, lido: false, ocorridoEm: concorrenteRecente, progresso: 0 })),
    ]);
    const estado = await obterEstado(dispositivoA, userId, obraId, capituloId);
    assert.equal(estado?.lido, false);
    assert.equal(
      Date.parse(estado?.atualizado_em || ""),
      Date.parse(concorrenteRecente),
    );
  });

  await t.test("RLS e identidade mantêm as contas isoladas", async () => {
    const outraData = new Date(base + 10_000).toISOString();
    assert.equal(
      await sincronizar(outraConta, argumentos({ obraId, capituloId, lido: true, ocorridoEm: outraData })),
      true,
    );
    assert.equal((await obterEstado(outraConta, outroUserId, obraId, capituloId))?.lido, true);
    assert.equal(await obterEstado(dispositivoA, userId, obraId, capituloId).then((estado) => estado?.lido), false);

    const leituraCruzada = await dispositivoA
      .from("progresso_leitura")
      .select("id")
      .eq("user_id", outroUserId)
      .eq("obra_id", obraId);
    assert.equal(leituraCruzada.error, null, leituraCruzada.error?.message);
    assert.deepEqual(leituraCruzada.data, []);

    const semSessao = await anon.rpc(
      "salvar_progresso_leitura",
      argumentos({ obraId, capituloId, lido: true, ocorridoEm: outraData }),
    );
    assert.ok(semSessao.error);
  });
});
