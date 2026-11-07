import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { criarInvocacaoStatusSupabase } from "../scripts/supabase-cli-invocation.mjs";
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

  const invocacao = criarInvocacaoStatusSupabase();
  const saida = execFileSync(invocacao.comando, invocacao.argumentos, {
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

async function aceitarTermos(cliente) {
  const resposta = await cliente.rpc("aceitar_termos_publicacao", {
    p_termos_versao: "2026-08-05",
    p_diretrizes_versao: "2026-08-05",
    p_politica_versao: "2026-08-05",
  });
  assert.equal(resposta.error, null, resposta.error?.message);
  assert.equal(resposta.data, true);
}

async function inserirComentario(cliente, tabela, payload) {
  const resposta = await cliente.from(tabela).insert(payload).select("id").single();
  assert.equal(resposta.error, null, resposta.error?.message);
  assert.ok(resposta.data?.id);
  return resposta.data.id;
}

async function removerComentario(cliente, tabela, comentarioId) {
  const resposta = await cliente
    .from(tabela)
    .delete()
    .eq("id", comentarioId)
    .select("id");
  assert.equal(resposta.error, null, resposta.error?.message);
  return resposta.data || [];
}

test("autor gerencia comentários recebidos sem ampliar acesso de terceiros", async (t) => {
  const obraId = (process.env.E2E_PUBLIC_WORK_ID || "").trim();
  const capituloId = (process.env.E2E_PUBLIC_CHAPTER_ID || "").trim();
  const autorEmail = (process.env.E2E_USER_EMAIL || "").trim();
  const autorPassword = process.env.E2E_USER_PASSWORD || "";
  const leitorEmail = (process.env.E2E_VISITOR_EMAIL || "").trim();
  const leitorPassword = process.env.E2E_VISITOR_PASSWORD || "";

  assert.ok(
    obraId && capituloId && autorEmail && autorPassword && leitorEmail && leitorPassword,
    "Prepare as fixtures E2E locais antes do teste.",
  );

  const ambiente = lerAmbienteSupabaseLocal();
  const autor = criarCliente(ambiente.url, ambiente.publicKey);
  const leitor = criarCliente(ambiente.url, ambiente.publicKey);
  const autorId = await entrar(autor, autorEmail, autorPassword);
  const leitorId = await entrar(leitor, leitorEmail, leitorPassword);
  await aceitarTermos(leitor);
  const criados = [];

  t.after(async () => {
    for (const { cliente, tabela, id } of criados) {
      await cliente.from(tabela).delete().eq("id", id);
    }
    await Promise.all([autor.auth.signOut(), leitor.auth.signOut()]);
  });

  await t.test("autor da obra remove comentário de leitor na obra", async () => {
    const id = await inserirComentario(leitor, "comentarios_obras", {
      obra_id: obraId,
      user_id: leitorId,
      comentario: "Comentário E2E para gestão do autor na obra",
    });
    criados.push({ cliente: leitor, tabela: "comentarios_obras", id });
    assert.deepEqual(await removerComentario(autor, "comentarios_obras", id), [{ id }]);
  });

  await t.test("autor da obra remove comentário de leitor no capítulo", async () => {
    const id = await inserirComentario(leitor, "comentarios_capitulos", {
      capitulo_id: capituloId,
      user_id: leitorId,
      comentario: "Comentário E2E para gestão do autor no capítulo",
    });
    criados.push({ cliente: leitor, tabela: "comentarios_capitulos", id });
    assert.deepEqual(await removerComentario(autor, "comentarios_capitulos", id), [{ id }]);
  });

  await t.test("leitor não remove comentário alheio em obra que não possui", async () => {
    const id = await inserirComentario(autor, "comentarios_obras", {
      obra_id: obraId,
      user_id: autorId,
      comentario: "Comentário E2E protegido contra terceiro",
    });
    criados.push({ cliente: autor, tabela: "comentarios_obras", id });
    assert.deepEqual(await removerComentario(leitor, "comentarios_obras", id), []);
    const verificacao = await autor
      .from("comentarios_obras")
      .select("id")
      .eq("id", id)
      .single();
    assert.equal(verificacao.error, null, verificacao.error?.message);
    assert.equal(verificacao.data?.id, id);
  });

  await t.test("comentarista continua removendo o próprio comentário", async () => {
    const id = await inserirComentario(leitor, "comentarios_capitulos", {
      capitulo_id: capituloId,
      user_id: leitorId,
      comentario: "Comentário E2E removido pelo próprio leitor",
    });
    criados.push({ cliente: leitor, tabela: "comentarios_capitulos", id });
    assert.deepEqual(await removerComentario(leitor, "comentarios_capitulos", id), [{ id }]);
  });
});
