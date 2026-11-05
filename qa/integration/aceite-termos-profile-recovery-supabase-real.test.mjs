import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import test from "node:test";

import { createClient } from "@supabase/supabase-js";

const VERSAO_ATUAL = "2026-08-05";
const USUARIOS = Object.freeze({
  ausente: "d1000000-0000-4000-8000-000000000001",
  existente: "d1000000-0000-4000-8000-000000000002",
  legado: "d1000000-0000-4000-8000-000000000003",
  metadataVazia: "d1000000-0000-4000-8000-000000000004",
  retry: "d1000000-0000-4000-8000-000000000005",
  outro: "d1000000-0000-4000-8000-000000000006",
  alvoRls: "d1000000-0000-4000-8000-000000000007",
});
const PERFIL_LEGADO_ID = "d2000000-0000-4000-8000-000000000003";
const SENHA = randomBytes(24).toString("base64url");

function removerAspas(valor) {
  const texto = valor.trim();
  return texto.startsWith('"') && texto.endsWith('"')
    ? JSON.parse(texto)
    : texto;
}

function lerAmbienteSupabaseLocal() {
  const explicito = {
    url: (process.env.SUPABASE_TEST_URL || "").trim(),
    publicKey: (process.env.SUPABASE_TEST_PUBLIC_KEY || "").trim(),
    secretKey: (process.env.SUPABASE_TEST_SECRET_KEY || "").trim(),
  };
  const quantidadeExplicita = Object.values(explicito).filter(Boolean).length;

  if (quantidadeExplicita > 0) {
    assert.equal(
      quantidadeExplicita,
      3,
      "Defina juntas as tres variaveis SUPABASE_TEST_*.",
    );
    return explicito;
  }

  let saida;

  try {
    saida = execFileSync("supabase", ["status", "-o", "env"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (erro) {
    throw new Error(
      "Inicie o Supabase local antes do teste (`supabase start`).",
      { cause: erro },
    );
  }

  const variaveis = Object.fromEntries(
    saida
      .split(/\r?\n/)
      .map((linha) => /^([A-Z0-9_]+)=(.*)$/.exec(linha.trim()))
      .filter(Boolean)
      .map((resultado) => [resultado[1], removerAspas(resultado[2])]),
  );

  const ambiente = {
    url: variaveis.API_URL || variaveis.SUPABASE_URL || "",
    publicKey: variaveis.ANON_KEY || variaveis.PUBLISHABLE_KEY || "",
    secretKey: variaveis.SERVICE_ROLE_KEY || variaveis.SECRET_KEY || "",
  };

  assert.ok(
    ambiente.url && ambiente.publicKey && ambiente.secretKey,
    "O CLI nao retornou URL e chaves do Supabase local.",
  );

  return ambiente;
}

function exigirDestinoLocal(url) {
  const destino = new URL(url);

  assert.equal(destino.protocol, "http:");
  assert.ok(
    new Set(["127.0.0.1", "localhost", "[::1]"]).has(destino.hostname),
    `O teste recusa Supabase remoto: ${destino.hostname}`,
  );
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

function argumentosAceite(sobrescritas = {}) {
  return {
    p_termos_versao: VERSAO_ATUAL,
    p_diretrizes_versao: VERSAO_ATUAL,
    p_politica_versao: VERSAO_ATUAL,
    ...sobrescritas,
  };
}

async function criarUsuario(admin, ambiente, id, metadata = {}) {
  const email = `qa-aceite-${id.slice(-4)}@historietas.test`;
  const exclusao = await admin.auth.admin.deleteUser(id);

  if (exclusao.error && exclusao.error.status !== 404) {
    throw exclusao.error;
  }

  const criacao = await admin.auth.admin.createUser({
    id,
    email,
    password: SENHA,
    email_confirm: true,
    user_metadata: metadata,
  });
  assert.equal(criacao.error, null, criacao.error?.message);

  const cliente = criarCliente(ambiente.url, ambiente.publicKey);
  const login = await cliente.auth.signInWithPassword({
    email,
    password: SENHA,
  });
  assert.equal(login.error, null, login.error?.message);

  return cliente;
}

async function obterProfiles(admin, userId) {
  const resposta = await admin
    .from("profiles")
    .select("*")
    .eq("user_id", userId);

  assert.equal(resposta.error, null, resposta.error?.message);
  return resposta.data || [];
}

async function exigirAceite(cliente, contexto) {
  const resposta = await cliente.rpc(
    "aceitar_termos_publicacao",
    argumentosAceite(),
  );

  assert.equal(
    resposta.error,
    null,
    `${contexto}: ${resposta.error?.message || "erro desconhecido"}`,
  );
  assert.equal(resposta.data, true, contexto);
}

test("recupera profile ausente ao aceitar termos no Supabase local", async (t) => {
  const ambiente = lerAmbienteSupabaseLocal();
  exigirDestinoLocal(ambiente.url);

  const admin = criarCliente(ambiente.url, ambiente.secretKey);
  const anon = criarCliente(ambiente.url, ambiente.publicKey);
  const clientes = [];

  t.after(async () => {
    await Promise.all(clientes.map((cliente) => cliente.auth.signOut()));
    await Promise.all(
      Object.values(USUARIOS).map((id) => admin.auth.admin.deleteUser(id)),
    );
  });

  await t.test("anon nao executa a RPC protegida", async () => {
    const resposta = await anon.rpc(
      "aceitar_termos_publicacao",
      argumentosAceite(),
    );

    assert.ok(resposta.error);
    assert.match(resposta.error.message, /permission denied|autenticado/i);
  });

  await t.test("duas chamadas concorrentes criam um unico profile seguro", async () => {
    const cliente = await criarUsuario(
      admin,
      ambiente,
      USUARIOS.ausente,
      {
        nome: "  <Ana>\n\t" + "x".repeat(120),
        tipo: "autor",
        is_admin: true,
      },
    );
    clientes.push(cliente);

    const respostas = await Promise.all([
      cliente.rpc("aceitar_termos_publicacao", argumentosAceite()),
      cliente.rpc("aceitar_termos_publicacao", argumentosAceite()),
    ]);

    respostas.forEach((resposta) => {
      assert.equal(resposta.error, null, resposta.error?.message);
      assert.equal(resposta.data, true);
    });

    const profiles = await obterProfiles(admin, USUARIOS.ausente);
    assert.equal(profiles.length, 1);
    assert.equal(profiles[0].id, USUARIOS.ausente);
    assert.equal(profiles[0].user_id, USUARIOS.ausente);
    assert.equal(profiles[0].tipo, "leitor");
    assert.equal(profiles[0].is_admin, false);
    assert.ok(profiles[0].nome.startsWith("Ana "));
    assert.ok(profiles[0].nome.length <= 80);
    assert.doesNotMatch(profiles[0].nome, /[<>\r\n\t]/);
    assert.equal(profiles[0].termos_uso_versao, VERSAO_ATUAL);
    assert.equal(profiles[0].diretrizes_comunidade_versao, VERSAO_ATUAL);
    assert.equal(profiles[0].politica_privacidade_versao, VERSAO_ATUAL);

    await exigirAceite(cliente, "retry idempotente");
    assert.equal((await obterProfiles(admin, USUARIOS.ausente)).length, 1);

    const status = await cliente.rpc("status_aceite_termos_publicacao");
    assert.equal(status.error, null, status.error?.message);
    assert.equal(status.data, true);

    const post = await cliente
      .from("comunidade_posts")
      .insert({
        autor_id: USUARIOS.ausente,
        autor_nome: profiles[0].nome,
        texto: "Publicacao permitida depois da recuperacao do profile.",
        visibilidade: "publico",
      })
      .select("id")
      .single();
    assert.equal(post.error, null, post.error?.message);
  });

  await t.test("profile existente preserva dados legitimos", async () => {
    const cliente = await criarUsuario(
      admin,
      ambiente,
      USUARIOS.existente,
      { nome: "Metadata nao deve substituir" },
    );
    clientes.push(cliente);

    const criadoEm = new Date(Date.now() - 60_000).toISOString();
    const insercao = await admin.from("profiles").insert({
      id: USUARIOS.existente,
      user_id: USUARIOS.existente,
      nome: "Autora Existente",
      avatar_url: "https://example.invalid/avatar.png",
      bio: "Bio preservada",
      sobre_bio: "Sobre preservado",
      username: "autora-existente",
      tipo: "autor",
      is_admin: true,
      criado_em: criadoEm,
      atualizado_em: criadoEm,
    });
    assert.equal(insercao.error, null, insercao.error?.message);

    await exigirAceite(cliente, "profile existente");

    const [profile] = await obterProfiles(admin, USUARIOS.existente);
    assert.equal(profile.nome, "Autora Existente");
    assert.equal(profile.avatar_url, "https://example.invalid/avatar.png");
    assert.equal(profile.bio, "Bio preservada");
    assert.equal(profile.sobre_bio, "Sobre preservado");
    assert.equal(profile.username, "autora-existente");
    assert.equal(profile.tipo, "autor");
    assert.equal(profile.is_admin, true);
    assert.equal(Date.parse(profile.criado_em), Date.parse(criadoEm));
  });

  await t.test("profile legado e localizado por user_id sem duplicacao", async () => {
    const cliente = await criarUsuario(
      admin,
      ambiente,
      USUARIOS.legado,
      { nome: "Metadata Legada" },
    );
    clientes.push(cliente);

    const insercao = await admin.from("profiles").insert({
      id: PERFIL_LEGADO_ID,
      user_id: USUARIOS.legado,
      nome: "Perfil Legado",
      tipo: "leitor",
    });
    assert.equal(insercao.error, null, insercao.error?.message);

    await exigirAceite(cliente, "profile legado");

    const profiles = await obterProfiles(admin, USUARIOS.legado);
    assert.equal(profiles.length, 1);
    assert.equal(profiles[0].id, PERFIL_LEGADO_ID);
    assert.equal(profiles[0].nome, "Perfil Legado");
  });

  await t.test("metadata vazia usa fallback sem elevar autorizacao", async () => {
    const cliente = await criarUsuario(
      admin,
      ambiente,
      USUARIOS.metadataVazia,
      { nome: "   ", tipo: "autor", is_admin: true },
    );
    clientes.push(cliente);

    await exigirAceite(cliente, "metadata vazia");

    const [profile] = await obterProfiles(admin, USUARIOS.metadataVazia);
    assert.equal(profile.nome, "Usuário");
    assert.equal(profile.tipo, "leitor");
    assert.equal(profile.is_admin, false);
  });

  await t.test("versao invalida nao cria profile e permite retry valido", async () => {
    const cliente = await criarUsuario(
      admin,
      ambiente,
      USUARIOS.retry,
      { nome: "Retry Seguro" },
    );
    clientes.push(cliente);

    const invalido = await cliente.rpc(
      "aceitar_termos_publicacao",
      argumentosAceite({ p_termos_versao: "versao-invalida" }),
    );
    assert.ok(invalido.error);
    assert.equal(invalido.error.code, "22023");
    assert.equal((await obterProfiles(admin, USUARIOS.retry)).length, 0);

    await exigirAceite(cliente, "retry depois de versao invalida");
    assert.equal((await obterProfiles(admin, USUARIOS.retry)).length, 1);
  });

  await t.test("RLS continua impedindo criar profile de outra identidade", async () => {
    const cliente = await criarUsuario(
      admin,
      ambiente,
      USUARIOS.outro,
      { nome: "Outro Usuario" },
    );
    clientes.push(cliente);

    const criacaoAlvo = await admin.auth.admin.createUser({
      id: USUARIOS.alvoRls,
      email: "qa-aceite-alvo-rls@historietas.test",
      password: SENHA,
      email_confirm: true,
    });
    assert.equal(criacaoAlvo.error, null, criacaoAlvo.error?.message);

    const resposta = await cliente.from("profiles").insert({
      id: USUARIOS.alvoRls,
      user_id: USUARIOS.alvoRls,
      nome: "Tentativa indevida",
      tipo: "leitor",
    });

    assert.ok(resposta.error);
    assert.match(resposta.error.message, /row-level security/i);
  });
});
