import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import test from "node:test";

import { createClient } from "@supabase/supabase-js";

const USUARIO_A_ID = "d1000000-0000-4000-8000-000000000001";
const USUARIO_B_ID = "d1000000-0000-4000-8000-000000000002";
const SENHA_A = randomBytes(24).toString("base64url");
const SENHA_B = randomBytes(24).toString("base64url");
const IMAGEM_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

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

async function criarUsuarioAutenticado({ admin, ambiente, id, email, senha }) {
  const exclusao = await admin.auth.admin.deleteUser(id);
  if (exclusao.error && exclusao.error.status !== 404) {
    throw exclusao.error;
  }

  const criacao = await admin.auth.admin.createUser({
    id,
    email,
    password: senha,
    email_confirm: true,
  });
  assert.equal(criacao.error, null, criacao.error?.message);

  const cliente = criarCliente(ambiente.url, ambiente.publicKey);
  const login = await cliente.auth.signInWithPassword({
    email,
    password: senha,
  });
  assert.equal(login.error, null, login.error?.message);
  return cliente;
}

async function removerPasta(admin, bucket, pasta) {
  const listagem = await admin.storage.from(bucket).list(pasta, { limit: 100 });
  assert.equal(listagem.error, null, listagem.error?.message);

  const caminhos = (listagem.data || []).map(
    (objeto) => `${pasta}/${objeto.name}`,
  );
  if (caminhos.length === 0) {
    return;
  }

  const remocao = await admin.storage.from(bucket).remove(caminhos);
  assert.equal(remocao.error, null, remocao.error?.message);
}

function imagem(tamanho = IMAGEM_PNG.length) {
  return tamanho === IMAGEM_PNG.length
    ? IMAGEM_PNG
    : Buffer.alloc(tamanho, 1);
}

function exigirFalha(resposta, contexto) {
  assert.ok(resposta.error, `${contexto} deveria falhar`);
}

test("protege a listagem dos buckets publicos no Supabase local", async (t) => {
  const ambiente = lerAmbienteSupabaseLocal();
  exigirDestinoLocal(ambiente.url);

  const admin = criarCliente(ambiente.url, ambiente.secretKey);
  const anon = criarCliente(ambiente.url, ambiente.publicKey);
  const usuarioA = await criarUsuarioAutenticado({
    admin,
    ambiente,
    id: USUARIO_A_ID,
    email: "qa-storage-a@historietas.test",
    senha: SENHA_A,
  });
  const usuarioB = await criarUsuarioAutenticado({
    admin,
    ambiente,
    id: USUARIO_B_ID,
    email: "qa-storage-b@historietas.test",
    senha: SENHA_B,
  });

  t.after(async () => {
    for (const bucket of ["avatars", "capas-obras"]) {
      await removerPasta(admin, bucket, USUARIO_A_ID);
      await removerPasta(admin, bucket, USUARIO_B_ID);
    }
    await usuarioA.auth.signOut();
    await usuarioB.auth.signOut();
    await admin.auth.admin.deleteUser(USUARIO_A_ID);
    await admin.auth.admin.deleteUser(USUARIO_B_ID);
  });

  const avatarA = `${USUARIO_A_ID}/avatar.png`;
  const avatarB = `${USUARIO_B_ID}/avatar.png`;
  const capaA = `${USUARIO_A_ID}/capa.png`;
  const capaB = `${USUARIO_B_ID}/capa.png`;

  for (const [cliente, bucket, caminho] of [
    [usuarioA, "avatars", avatarA],
    [usuarioB, "avatars", avatarB],
    [usuarioA, "capas-obras", capaA],
    [usuarioB, "capas-obras", capaB],
  ]) {
    const upload = await cliente.storage.from(bucket).upload(
      caminho,
      imagem(),
      { contentType: "image/png", upsert: false },
    );
    assert.equal(upload.error, null, upload.error?.message);
  }

  await t.test("anon nao enumera avatars nem capas-obras", async () => {
    for (const bucket of ["avatars", "capas-obras"]) {
      const raiz = await anon.storage.from(bucket).list("", { limit: 100 });
      assert.equal(raiz.error, null, raiz.error?.message);
      assert.deepEqual(raiz.data, []);

      const pasta = await anon.storage
        .from(bucket)
        .list(USUARIO_A_ID, { limit: 100 });
      assert.equal(pasta.error, null, pasta.error?.message);
      assert.deepEqual(pasta.data, []);
    }
  });

  await t.test("usuario lista somente o proprio prefixo", async () => {
    for (const [bucket, nomeEsperado] of [
      ["avatars", "avatar.png"],
      ["capas-obras", "capa.png"],
    ]) {
      const propria = await usuarioA.storage
        .from(bucket)
        .list(USUARIO_A_ID, { limit: 100 });
      assert.equal(propria.error, null, propria.error?.message);
      assert.deepEqual(propria.data?.map((objeto) => objeto.name), [nomeEsperado]);

      const alheia = await usuarioA.storage
        .from(bucket)
        .list(USUARIO_B_ID, { limit: 100 });
      assert.equal(alheia.error, null, alheia.error?.message);
      assert.deepEqual(alheia.data, []);
    }
  });

  await t.test("URLs publicas conhecidas continuam anonimas", async () => {
    for (const [bucket, caminho] of [
      ["avatars", avatarA],
      ["capas-obras", capaA],
    ]) {
      const { data } = anon.storage.from(bucket).getPublicUrl(caminho);
      const resposta = await fetch(data.publicUrl, { cache: "no-store" });
      assert.equal(resposta.status, 200);
      assert.match(resposta.headers.get("content-type") || "", /image\/png/);
    }
  });

  await t.test("proprietario faz upsert, update e delete", async () => {
    const upsertAvatar = await usuarioA.storage.from("avatars").upload(
      avatarA,
      imagem(),
      { contentType: "image/png", upsert: true },
    );
    assert.equal(upsertAvatar.error, null, upsertAvatar.error?.message);

    const updateAvatar = await usuarioA.storage.from("avatars").update(
      avatarA,
      imagem(),
      { contentType: "image/png", upsert: true },
    );
    assert.equal(updateAvatar.error, null, updateAvatar.error?.message);

    const updateCapa = await usuarioA.storage.from("capas-obras").update(
      capaA,
      imagem(),
      { contentType: "image/png", upsert: false },
    );
    assert.equal(updateCapa.error, null, updateCapa.error?.message);

    for (const [bucket, caminho] of [
      ["avatars", avatarA],
      ["capas-obras", capaA],
    ]) {
      const remocao = await usuarioA.storage.from(bucket).remove([caminho]);
      assert.equal(remocao.error, null, remocao.error?.message);
      const listagem = await usuarioA.storage
        .from(bucket)
        .list(USUARIO_A_ID, { limit: 100 });
      assert.equal(listagem.error, null, listagem.error?.message);
      assert.deepEqual(listagem.data, []);
    }
  });

  await t.test("usuario nao cria, altera nem remove arquivos de outro", async () => {
    exigirFalha(
      await usuarioA.storage.from("avatars").upload(
        `${USUARIO_B_ID}/intrusao.png`,
        imagem(),
        { contentType: "image/png", upsert: false },
      ),
      "upload fora do prefixo",
    );
    exigirFalha(
      await usuarioA.storage.from("capas-obras").update(
        capaB,
        imagem(),
        { contentType: "image/png", upsert: false },
      ),
      "update de capa alheia",
    );

    await usuarioA.storage.from("capas-obras").remove([capaB]);
    const listagemB = await usuarioB.storage
      .from("capas-obras")
      .list(USUARIO_B_ID, { limit: 100 });
    assert.equal(listagemB.error, null, listagemB.error?.message);
    assert.deepEqual(listagemB.data?.map((objeto) => objeto.name), ["capa.png"]);
  });

  await t.test("MIME, tamanho e quota permanecem ativos", async () => {
    for (const [bucket, tamanhoMaximo] of [
      ["avatars", 1024 * 1024],
      ["capas-obras", 2 * 1024 * 1024],
    ]) {
      exigirFalha(
        await usuarioA.storage.from(bucket).upload(
          `${USUARIO_A_ID}/invalido.txt`,
          Buffer.from("nao e imagem"),
          { contentType: "text/plain", upsert: false },
        ),
        `MIME invalido em ${bucket}`,
      );
      exigirFalha(
        await usuarioA.storage.from(bucket).upload(
          `${USUARIO_A_ID}/grande.png`,
          imagem(tamanhoMaximo + 1),
          { contentType: "image/png", upsert: false },
        ),
        `arquivo acima do limite em ${bucket}`,
      );
    }

    for (let indice = 1; indice <= 5; indice += 1) {
      const upload = await usuarioA.storage.from("avatars").upload(
        `${USUARIO_A_ID}/quota-${indice}.png`,
        imagem(),
        { contentType: "image/png", upsert: false },
      );
      assert.equal(upload.error, null, upload.error?.message);
    }

    exigirFalha(
      await usuarioA.storage.from("avatars").upload(
        `${USUARIO_A_ID}/quota-6.png`,
        imagem(),
        { contentType: "image/png", upsert: false },
      ),
      "sexto avatar",
    );
  });

  await t.test("cliente administrativo preserva listagem e limpeza", async () => {
    const listagem = await admin.storage
      .from("avatars")
      .list(USUARIO_A_ID, { limit: 100 });
    assert.equal(listagem.error, null, listagem.error?.message);
    assert.equal(listagem.data?.length, 5);

    await removerPasta(admin, "avatars", USUARIO_A_ID);
    const vazia = await admin.storage
      .from("avatars")
      .list(USUARIO_A_ID, { limit: 100 });
    assert.equal(vazia.error, null, vazia.error?.message);
    assert.deepEqual(vazia.data, []);
  });
});
