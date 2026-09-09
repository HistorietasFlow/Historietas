import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import fs from "node:fs";

import { createClient } from "@supabase/supabase-js";

const DEFAULTS = Object.freeze({
  email: "e2e-author@historietas.test",
  password: "Historietas-E2E-2026!",
  authorName: "Autor E2E",
  username: "autor-e2e",
  publicWorkSlug: "obra-publica-e2e",
  publicChapterNumber: "1",
});

function removerAspas(valor) {
  const texto = valor.trim();

  if (texto.startsWith('"') && texto.endsWith('"')) {
    return JSON.parse(texto);
  }

  return texto;
}

function lerVariaveisStatusSupabase() {
  let saida;

  try {
    saida = execFileSync("supabase", ["status", "-o", "env"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (erro) {
    throw new Error(
      "Inicie o Supabase local antes de preparar os testes E2E (`supabase start`).",
      { cause: erro },
    );
  }

  return Object.fromEntries(
    saida
      .split(/\r?\n/)
      .map((linha) => /^([A-Z0-9_]+)=(.*)$/.exec(linha.trim()))
      .filter(Boolean)
      .map((resultado) => [resultado[1], removerAspas(resultado[2])]),
  );
}

function lerAmbienteSupabaseLocal() {
  const ambienteExplicito = {
    url: (process.env.SUPABASE_TEST_URL || "").trim(),
    publicKey: (process.env.SUPABASE_TEST_PUBLIC_KEY || "").trim(),
    secretKey: (process.env.SUPABASE_TEST_SECRET_KEY || "").trim(),
  };
  const quantidadeExplicita = Object.values(ambienteExplicito).filter(Boolean).length;

  if (quantidadeExplicita > 0) {
    assert.equal(
      quantidadeExplicita,
      3,
      "Defina juntas SUPABASE_TEST_URL, SUPABASE_TEST_PUBLIC_KEY e SUPABASE_TEST_SECRET_KEY.",
    );

    return ambienteExplicito;
  }

  const variaveis = lerVariaveisStatusSupabase();
  const ambiente = {
    url: variaveis.API_URL || variaveis.SUPABASE_URL || "",
    publicKey: variaveis.PUBLISHABLE_KEY || variaveis.ANON_KEY || "",
    secretKey: variaveis.SECRET_KEY || variaveis.SERVICE_ROLE_KEY || "",
  };

  assert.ok(
    ambiente.url && ambiente.publicKey && ambiente.secretKey,
    "O CLI não retornou a URL e as chaves pública/servidor do Supabase local.",
  );

  return ambiente;
}

function exigirDestinoLocal(url) {
  const destino = new URL(url);
  const hostsPermitidos = new Set(["127.0.0.1", "localhost", "[::1]"]);

  assert.equal(
    destino.protocol,
    "http:",
    `O preparo E2E recusa Supabase fora de HTTP local: ${destino.origin}`,
  );
  assert.ok(
    hostsPermitidos.has(destino.hostname),
    `O preparo E2E recusa Supabase remoto: ${destino.hostname}`,
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

function exigirSemErro(error, contexto) {
  if (error) {
    throw new Error(`${contexto}: ${error.message || "erro desconhecido"}`);
  }
}

async function excluirContaAnterior(admin, email) {
  for (let pagina = 1; pagina <= 20; pagina += 1) {
    const { data, error } = await admin.auth.admin.listUsers({
      page: pagina,
      perPage: 1_000,
    });
    exigirSemErro(error, "Não foi possível listar usuários locais");

    const usuario = (data?.users || []).find(
      (item) => (item.email || "").toLowerCase() === email.toLowerCase(),
    );

    if (usuario) {
      const { error: deleteError } = await admin.auth.admin.deleteUser(usuario.id);
      exigirSemErro(deleteError, "Não foi possível recriar a conta E2E local");
      return;
    }

    if ((data?.users || []).length < 1_000) {
      return;
    }
  }

  throw new Error("A busca pela conta E2E local excedeu o limite de segurança.");
}

function obterArquivoGithubEnv() {
  const indice = process.argv.indexOf("--github-env");

  if (indice < 0) {
    return "";
  }

  const destino = (process.argv[indice + 1] || "").trim();
  assert.ok(destino, "Informe o caminho depois de --github-env.");
  return destino;
}

function salvarGithubEnv(destino, variaveis) {
  if (!destino) {
    return;
  }

  const linhas = Object.entries(variaveis).map(([nome, valor]) => {
    assert.ok(
      !/[\r\n]/.test(valor),
      `A variável ${nome} contém quebra de linha e não pode ir para GITHUB_ENV.`,
    );
    return `${nome}=${valor}`;
  });

  fs.appendFileSync(destino, `${linhas.join("\n")}\n`, "utf8");
}

async function preparar() {
  const ambiente = lerAmbienteSupabaseLocal();
  exigirDestinoLocal(ambiente.url);

  const email = (process.env.E2E_USER_EMAIL || DEFAULTS.email).trim();
  const password = process.env.E2E_USER_PASSWORD || DEFAULTS.password;
  const publicWorkSlug = (
    process.env.E2E_PUBLIC_WORK_SLUG || DEFAULTS.publicWorkSlug
  ).trim();
  const publicChapterNumber = (
    process.env.E2E_PUBLIC_CHAPTER_NUMBER || DEFAULTS.publicChapterNumber
  ).trim();

  assert.ok(email && password.length >= 8, "A conta E2E precisa de e-mail e senha forte.");
  assert.match(publicWorkSlug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  assert.equal(publicChapterNumber, "1", "A fixture E2E usa o capítulo público 1.");

  const admin = criarCliente(ambiente.url, ambiente.secretKey);
  await excluirContaAnterior(admin, email);

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      name: DEFAULTS.authorName,
      nome: DEFAULTS.authorName,
    },
  });
  exigirSemErro(createError, "Não foi possível criar a conta E2E local");

  const userId = created.user?.id || "";
  assert.ok(userId, "O Supabase local não retornou o ID da conta E2E.");

  const authenticated = criarCliente(ambiente.url, ambiente.publicKey);
  const { error: signInError } = await authenticated.auth.signInWithPassword({
    email,
    password,
  });
  exigirSemErro(signInError, "A conta E2E local não conseguiu autenticar");

  const now = new Date().toISOString();
  const { error: profileError } = await authenticated.from("profiles").insert({
    id: userId,
    user_id: userId,
    nome: DEFAULTS.authorName,
    avatar_url: "",
    bio: "",
    tipo: "autor",
    criado_em: now,
    atualizado_em: now,
    sobre_bio: "Conta descartável dos testes E2E locais.",
    username: DEFAULTS.username,
  });
  exigirSemErro(profileError, "Não foi possível criar o perfil E2E local");

  const { data: accepted, error: acceptanceError } = await authenticated.rpc(
    "aceitar_termos_publicacao",
    {
      p_termos_versao: "2026-08-05",
      p_diretrizes_versao: "2026-08-05",
      p_politica_versao: "2026-08-05",
    },
  );
  exigirSemErro(acceptanceError, "Não foi possível registrar o aceite E2E local");
  assert.equal(accepted, true, "O aceite E2E local não foi confirmado.");

  const workId = randomUUID();
  const chapterId = randomUUID();
  const { error: workError } = await authenticated.from("obras").insert({
    id: workId,
    user_id: userId,
    titulo: "Obra Pública E2E",
    autor: DEFAULTS.authorName,
    genero: "Fantasia",
    formato: "Conto",
    classificacao_indicativa: "Livre",
    sinopse: "Fixture descartável para validar as rotas públicas no Supabase local.",
    tags: ["e2e", "teste-local"],
    publicado: false,
    slug: publicWorkSlug,
    link: `/obra/${publicWorkSlug}`,
    criada_em: now,
    atualizado_em: now,
  });
  exigirSemErro(workError, "Não foi possível criar a obra E2E local");

  const { error: chapterError } = await authenticated.from("capitulos").insert({
    id: chapterId,
    obra_id: workId,
    user_id: userId,
    titulo: "Capítulo 1",
    texto: "Este capítulo existe somente no ambiente local descartável dos testes E2E.",
    ordem: 1,
    publicado: true,
    criado_em: now,
    atualizado_em: now,
  });
  exigirSemErro(chapterError, "Não foi possível criar o capítulo E2E local");

  const { data: published, error: publishError } = await authenticated
    .from("obras")
    .update({ publicado: true, atualizado_em: now })
    .eq("id", workId)
    .eq("user_id", userId)
    .select("id, publicado")
    .single();
  exigirSemErro(publishError, "Não foi possível publicar a obra E2E local");
  assert.equal(published?.publicado, true, "A obra E2E local não ficou pública.");

  await authenticated.auth.signOut();

  const anonymous = criarCliente(ambiente.url, ambiente.publicKey);
  const { data: publicWork, error: publicWorkError } = await anonymous
    .from("obras")
    .select("id, slug, publicado")
    .eq("slug", publicWorkSlug)
    .eq("publicado", true)
    .single();
  exigirSemErro(publicWorkError, "A obra E2E não ficou visível anonimamente");
  assert.equal(publicWork?.id, workId);

  const { data: publicChapter, error: publicChapterError } = await anonymous
    .from("capitulos")
    .select("id, obra_id, ordem, publicado")
    .eq("obra_id", workId)
    .eq("ordem", 1)
    .eq("publicado", true)
    .single();
  exigirSemErro(publicChapterError, "O capítulo E2E não ficou visível anonimamente");
  assert.equal(publicChapter?.id, chapterId);

  salvarGithubEnv(obterArquivoGithubEnv(), {
    NEXT_PUBLIC_SUPABASE_URL: ambiente.url,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: ambiente.publicKey,
    SUPABASE_SERVICE_ROLE_KEY: ambiente.secretKey,
    E2E_USER_EMAIL: email,
    E2E_USER_PASSWORD: password,
    E2E_ALLOW_DESTRUCTIVE: "true",
    E2E_PUBLIC_WORK_SLUG: publicWorkSlug,
    E2E_PUBLIC_CHAPTER_NUMBER: publicChapterNumber,
  });

  console.log(
    `Supabase local preparado para E2E: conta autenticada e /obra/${publicWorkSlug}/capitulo/1.`,
  );
}

await preparar();
