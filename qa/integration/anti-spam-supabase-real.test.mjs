import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import test from "node:test";

import { createClient } from "@supabase/supabase-js";

const USUARIO_ID = "c0000000-0000-4000-8000-000000000001";
const EMAIL = "qa-anti-spam@historietas.test";
const SENHA = randomBytes(24).toString("base64url");
const CODIGO_LIMITE = "HISTORIETAS_RATE_LIMIT";

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
      "Defina juntas as três variáveis SUPABASE_TEST_*.",
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
    "O CLI não retornou URL e chaves do Supabase local.",
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

function uuidFixture(prefixo, indice) {
  return `${prefixo}-0000-0000-0000-${String(indice).padStart(12, "0")}`;
}

function exigirSucesso(resposta, contexto) {
  assert.equal(
    resposta.error,
    null,
    `${contexto}: ${resposta.error?.message || "erro desconhecido"}`,
  );
}

function exigirLimite(resposta, rotulo) {
  assert.ok(resposta.error, `${rotulo}: a ação excedente deveria falhar`);
  assert.equal(resposta.status, 429, `${rotulo}: deveria responder HTTP 429`);
  assert.equal(resposta.error.code, CODIGO_LIMITE);
  assert.match(resposta.error.message, /Muitas ações/i);
  assert.match(resposta.error.message, /Tente novamente em \d+ segundos/i);
}

async function prepararUsuario(ambiente) {
  const admin = criarCliente(ambiente.url, ambiente.secretKey);
  const exclusao = await admin.auth.admin.deleteUser(USUARIO_ID);

  if (exclusao.error && exclusao.error.status !== 404) {
    throw exclusao.error;
  }

  const criacao = await admin.auth.admin.createUser({
    id: USUARIO_ID,
    email: EMAIL,
    password: SENHA,
    email_confirm: true,
  });
  assert.equal(criacao.error, null, criacao.error?.message);

  const cliente = criarCliente(ambiente.url, ambiente.publicKey);
  const login = await cliente.auth.signInWithPassword({
    email: EMAIL,
    password: SENHA,
  });
  assert.equal(login.error, null, login.error?.message);

  const agora = new Date().toISOString();
  exigirSucesso(
    await cliente.from("profiles").insert({
      id: USUARIO_ID,
      user_id: USUARIO_ID,
      nome: "QA Anti-spam",
      avatar_url: "",
      bio: "",
      tipo: "leitor",
      criado_em: agora,
      atualizado_em: agora,
    }),
    "criação do perfil anti-spam",
  );
  const aceite = await cliente.rpc("aceitar_termos_publicacao", {
    p_termos_versao: "2026-08-05",
    p_diretrizes_versao: "2026-08-05",
    p_politica_versao: "2026-08-05",
  });
  exigirSucesso(aceite, "aceite dos documentos da Comunidade");
  assert.equal(aceite.data, true);

  return { admin, cliente };
}

test("limita spam real pela Data API de um Supabase local descartável", async (t) => {
  const ambiente = lerAmbienteSupabaseLocal();
  exigirDestinoLocal(ambiente.url);

  const { admin, cliente } = await prepararUsuario(ambiente);
  t.after(async () => {
    await cliente.auth.signOut();
    await admin.auth.admin.deleteUser(USUARIO_ID);
  });

  await t.test("aceita cinco posts e rejeita o sexto com HTTP 429", async () => {
    for (let indice = 1; indice <= 5; indice += 1) {
      exigirSucesso(
        await cliente.from("comunidade_posts").insert({
          autor_id: USUARIO_ID,
          autor_nome: "QA Anti-spam",
          texto: `Publicação anti-spam permitida ${indice}`,
          visibilidade: "publico",
        }),
        `post permitido ${indice}`,
      );
    }

    exigirLimite(
      await cliente.from("comunidade_posts").insert({
        autor_id: USUARIO_ID,
        autor_nome: "QA Anti-spam",
        texto: "Publicação anti-spam que deve ser bloqueada",
        visibilidade: "publico",
      }),
      "limite de posts",
    );
  });

  await t.test("aceita quinze comentários e rejeita o décimo sexto", async () => {
    const postId = uuidFixture("10000000", 137);

    for (let indice = 1; indice <= 15; indice += 1) {
      exigirSucesso(
        await cliente.from("comunidade_comentarios").insert({
          post_id: postId,
          autor_id: USUARIO_ID,
          autor_nome: "QA Anti-spam",
          texto: `Comentário permitido ${indice}`,
        }),
        `comentário permitido ${indice}`,
      );
    }

    exigirLimite(
      await cliente.from("comunidade_comentarios").insert({
        post_id: postId,
        autor_id: USUARIO_ID,
        autor_nome: "QA Anti-spam",
        texto: "Comentário que deve ser bloqueado",
      }),
      "limite de comentários",
    );
  });

  await t.test("serializa curtidas concorrentes em posts e comentários", async () => {
    const requisicoes = Array.from({ length: 70 }, (_, indice) => {
      const numero = indice + 1;

      if (numero <= 35) {
        return cliente.from("comunidade_curtidas").insert({
          post_id: uuidFixture("10000000", numero),
          usuario_id: USUARIO_ID,
        });
      }

      return cliente.from("comunidade_comentario_curtidas").insert({
        comentario_id: uuidFixture("20000000", numero - 35),
        usuario_id: USUARIO_ID,
      });
    });
    const respostas = await Promise.all(requisicoes);
    const permitidas = respostas.filter((resposta) => !resposta.error);
    const bloqueadas = respostas.filter(
      (resposta) => resposta.error?.code === CODIGO_LIMITE,
    );

    assert.equal(permitidas.length, 60);
    assert.equal(bloqueadas.length, 10);
    bloqueadas.forEach((resposta) => exigirLimite(resposta, "limite concorrente"));
  });

  await t.test("serializa vinte seguimentos e bloqueia os excedentes", async () => {
    const respostas = await Promise.all(
      Array.from({ length: 25 }, (_, indice) =>
        cliente.rpc("solicitar_ou_seguir_usuario", {
          p_seguido_id: uuidFixture("a0000000", indice + 2),
        }),
      ),
    );
    const permitidas = respostas.filter((resposta) => !resposta.error);
    const bloqueadas = respostas.filter(
      (resposta) => resposta.error?.code === CODIGO_LIMITE,
    );

    assert.equal(permitidas.length, 20);
    assert.equal(bloqueadas.length, 5);
    bloqueadas.forEach((resposta) => exigirLimite(resposta, "limite de seguimentos"));
  });
});
