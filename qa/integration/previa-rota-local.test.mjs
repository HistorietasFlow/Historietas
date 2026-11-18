// Na raiz de uma cópia descartável, com o Vault e as migrations do repositório instalados.
// supabase status -o env | node qa/integration/previa-rota-local.test.mjs
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { setTimeout as pausa } from "node:timers/promises";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";
import { createChunks, stringToBase64URL } from "@supabase/ssr";
import { iniciarNext, observarApi, urlLocal } from "./previa-abertura/next-local.mjs";

import { revogarDuranteLeitura } from "./previa-abertura/troca-local.mjs";
import { conferirProvas } from "./previa-abertura/prova-local.mjs";

const config = Object.fromEntries(readFileSync(0, "utf8").split(/\r?\n/).filter(linha => /^[A-Z_0-9]+=/.test(linha)).map(linha => {
  const i = linha.indexOf("=");
  const valor = linha.slice(i + 1);
  return [linha.slice(0, i), valor.startsWith('"') ? JSON.parse(valor) : valor];
}));
const api = urlLocal(config.API_URL, ["http:"]);
const db = urlLocal(config.DB_URL, ["postgres:", "postgresql:"]);
const pasta = "qa/integration/previa-abertura/";
const opcoes = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };
const admin = createClient(api.href, config.SERVICE_ROLE_KEY, opcoes).auth.admin;
const auth = createClient(api.href, config.ANON_KEY, opcoes).auth;
const prefixo = "qa-rota-" + randomUUID() + "-";
const chaveCookie = "sb-" + api.hostname.split(".")[0] + "-auth-token";
const esperado = { trecho: "A".repeat(599) + "🌿" };

function sql(comando, variaveis = {}) {
  const args = ["-XqAt", "-v", "ON_ERROR_STOP=1", "-d", db.href];
  for (const [nome, valor] of Object.entries(variaveis)) args.push("-v", nome + "=" + valor);
  return execFileSync("psql", args, { input: comando, encoding: "utf8" }).trim();
}
const arquivo = (nome, vars) => sql(readFileSync(pasta + nome, "utf8"), vars);

function sqlRevisado(caminho, hash) {
  const bytes = readFileSync(caminho);
  assert.equal(createHash("sha256").update(bytes).digest("hex"), hash, caminho);
  return bytes.toString("utf8");
}
const instalar = sqlRevisado("supabase/migrations/20261118044729_previa_abertura_assinada.sql", "768c389d8ac074162cf4f2ac424539a2d55c97ccc39c300a6de7a9f94870d093");
const habilitar = sqlRevisado("docs/sql/previa-assinatura/habilitar-referencia.sql", "c909ce66b248a3b42b68a5333f190b6ad8fb88b33759b0c22fd3aab5fb25b0f4");
const pausaOperacional = sqlRevisado("docs/sql/previa-assinatura/pausar.sql", "241836e85b291ad46bd60a4041d2b656c73845587c30f3ed42b5a8dc09c99693");
const reverter = sqlRevisado("docs/sql/previa-assinatura/reverter.sql", "509ad5113e262a585d081f226243b41a2d6c26ee91e3e3f9c1339f63def177c1");

async function login(conta) {
  const { data, error } = await auth.signInWithPassword(conta);
  assert.ifError(error);
  return data.session;
}
function cookie(sessao, tamanho) {
  return createChunks(chaveCookie, "base64-" + stringToBase64URL(JSON.stringify(sessao)), tamanho)
    .map(({ name, value }) => name + "=" + value).join("; ");
}
async function consultar(origem, slug, cabecalhos = {}) {
  return fetch(origem + "/api/obras/" + prefixo + slug + "/previa", { headers: cabecalhos, redirect: "error" });
}
async function conferir(origem, slug, headers, status, corpo = {}) {
  const resposta = await consultar(origem, slug, headers);
  assert.equal(resposta.status, status, slug + " HTTP");
  assert.match(resposta.headers.get("cache-control") || "", /\bprivate\b/);
  assert.match(resposta.headers.get("cache-control") || "", /\bno-store\b/);
  assert.equal(resposta.headers.has("x-historietas-previa-prova"), false);
  assert.equal(resposta.headers.has("x-historietas-previa-exp"), false);
  assert.equal(resposta.headers.has("set-cookie"), false, "A prévia não altera a sessão");
  assert.deepEqual(await resposta.json(), corpo);
}

test("prévia via Next.js, proxy real, Auth, RLS e prova de origem local", async t => {
  const ponte = await observarApi(api);
  t.after(() => ponte.fechar());
  const contas = [];
  const segredos = [];
  function ativarNovaChave() {
    const id = sql("select vault.create_secret(encode(extensions.gen_random_bytes(32),'hex'),:'nome');",
      { nome: "historietas_previa_v1_" + randomUUID() });
    segredos.push(id);
    sql(habilitar, { id_segredo_vault: id });
    return { id, material: sql("select decrypted_secret from vault.decrypted_secrets where id=:'id'::uuid;", { id }) };
  }
  const versaoVault = sql("select extversion from pg_extension where extname='supabase_vault';");
  assert.ok(["0.3.1", "0.3.2"].includes(versaoVault), "Versão do Vault fora das homologadas para QA: " + versaoVault);
  t.diagnostic("Supabase Vault " + versaoVault);
  // Confere a operação real e o armazenamento cifrado sem imprimir o segredo.
  assert.equal(sql(`begin;
    select encode(extensions.gen_random_bytes(32),'hex') as material \\gset
    select vault.create_secret(:'material', :'nome') as id \\gset
    select exists(select 1 from vault.secrets s join vault.decrypted_secrets d using (id)
      where s.id = :'id'::uuid and s.secret <> :'material' and d.decrypted_secret = :'material');
    rollback;`, { nome: "qa-vault-" + randomUUID() }), "t");
  try {
    for (let i = 0; i < 4; i++) {
      const credenciais = { email: prefixo + i + "@example.test", password: randomUUID() };
      const { data, error } = await admin.createUser({ ...credenciais, email_confirm: true });
      assert.ifError(error);
      contas.push({ ...credenciais, id: data.user.id });
    }
    const [autor, leitor, bloqueado, bloqueador] = contas;
    arquivo("obras.sql", { autor: autor.id, leitor: leitor.id, bloqueado: bloqueado.id, bloqueador: bloqueador.id, prefixo });
    const interfaceLocal = process.argv.includes("--interface") ? await import("./previa-abertura/interface-local.mjs") : null;
    if (interfaceLocal) sql("update public.preferencias_privacidade set visibilidade_obras='publico' where user_id=:'autor';", { autor: autor.id });
    const desligado = await iniciarNext(ponte.url, config.ANON_KEY, false);
    try {
      await t.test("desligada: 404 inclusive com cookie inválido e zero chamadas ao Supabase", async () => {
        await conferir(desligado.origem, "publicada", {}, 404);
        await conferir(desligado.origem, "publicada", { cookie: chaveCookie + "=invalido" }, 404);
        assert.equal(ponte.chamadas.length, 0);
      });
      if (interfaceLocal) {
        await t.test("Explorar desligado: card real sem botão nem chamadas de prévia", () =>
          interfaceLocal.conferirDesligado(desligado.origem, prefixo));
      }
    } finally { await desligado.parar(); }
    if (interfaceLocal) sql("update public.preferencias_privacidade set visibilidade_obras='seguidores' where user_id=:'autor';", { autor: autor.id });
    try {
      await t.test("instalação inicia sem chave e preserva os privilégios de Auth", () => {
        assert.equal(sql("select count(*) from previa_assinatura.chave_ativa;"), "0");
        assert.equal(sql(`select bool_and(p.proowner='postgres'::regrole and 'search_path=""'=any(p.proconfig))
          from pg_proc p where oid in ('public.previa_abertura_assinada(text)'::regprocedure,
          'previa_assinatura.prova_confere(text)'::regprocedure);`), "t");
        assert.equal(sql(`select bool_and(not has_any_column_privilege(r,'previa_assinatura.chave_ativa','SELECT')
          and not has_any_column_privilege(r,'auth.sessions','SELECT')
          and not has_any_column_privilege(r,'vault.decrypted_secrets','SELECT')
          and not has_function_privilege(r,'public.previa_abertura_assinada(text)','EXECUTE'))
          from unnest(array['anon','authenticated']) as r;`), "t");
        assert.equal(sql(`select to_regprocedure('public.previa_abertura_local(text)') is null
          and not has_function_privilege('anon','previa_interno.abertura_obra(text)','EXECUTE')
          and not has_function_privilege('authenticated','previa_interno.abertura_obra(text)','EXECUTE');`), "t");
        // A prova foi movida para a função que lê a obra. O SELECT homologado permanece idêntico.
        assert.equal(sql(`select split_part(prosrc, 'return query', 2) from pg_proc
          where oid='public.previa_abertura_assinada(text)'::regprocedure;`),
        sql(`select split_part(prosrc, 'return query', 2) from pg_proc
          where oid='previa_interno.abertura_obra(text)'::regprocedure;`));
      });
      const { material: chaveProva } = ativarNovaChave();
      const ligado = await iniciarNext(ponte.url, config.ANON_KEY, true, chaveProva);
      try {
        await t.test("seguidor autorizado, bloqueios nos dois sentidos e respostas indistinguíveis", async () => {
          const estadoRestrito = arquivo("estado.sql");
          await conferir(ligado.origem, "publicada", {}, 404);
          await conferir(ligado.origem, "publicada", { "x-user-id": leitor.id, "x-role": "authenticated" }, 404);
          const seguidor = { cookie: cookie(await login(leitor), 250) };
          await conferir(ligado.origem, "publicada", seguidor, 200, esperado);
          for (const conta of [bloqueado, bloqueador]) {
            await conferir(ligado.origem, "publicada", { cookie: cookie(await login(conta)) }, 404);
          }
          for (const slug of ["rascunho", "adulto", "capitulo-privado", "sem-abertura", "inexistente"]) {
            await conferir(ligado.origem, slug, seguidor, 404);
          }
          assert.equal(arquivo("estado.sql"), estadoRestrito);
        });
        sql("update public.preferencias_privacidade set visibilidade_obras='publico' where user_id=:'autor';", { autor: autor.id });
        if (interfaceLocal) {
          await t.test("Explorar habilitado: teclado, desktop, celular e mudança de identidade", async () => {
            const abertura = "Inês encostou a planta na parede. Onde o papel indicava uma porta, o reboco estava intacto. Ela deu um passo para trás. Do outro lado, alguém também deu.";
            const vars = { slug: prefixo + "publicada" };
            const mudarTexto = "update public.capitulos set texto=:'texto' where ordem=1 and obra_id=(select id from public.obras where slug=:'slug');";
            const mudarTitulo = "update public.obras set titulo=:'titulo' where slug=:'slug';";
            // Usa texto legível no navegador e preserva a obra de 600 caracteres do teste da rota.
            sql("begin; " + mudarTexto + " " + mudarTitulo + " commit;", { ...vars, texto: abertura, titulo: "A Planta do Prédio" });
            const antesDaInterface = arquivo("estado.sql");
            try {
              await interfaceLocal.conferirHabilitado(ligado.origem, prefixo, abertura, () => login(leitor), chaveCookie);
              assert.equal(arquivo("estado.sql"), antesDaInterface);
            } finally {
              sql("begin; " + mudarTexto + " " + mudarTitulo + " commit;", { ...vars, texto: esperado.trecho + "FIM", titulo: "publicada" });
            }
          });
        }
        await conferirProvas(t, api, config.ANON_KEY, chaveProva, prefixo + "publicada",
          await login(leitor), await login(leitor), esperado);
        const antes = arquivo("estado.sql");
        await t.test("visitante legítimo e sessão encerrada na mesma obra pública", async () => {
          const antiga = await login(leitor);
          const outra = await login(leitor);
          const original = { cookie: cookie(antiga) };
          await conferir(ligado.origem, "publicada", original, 200, esperado);
          assert.ifError((await admin.signOut(antiga.access_token, "local")).error);
          const claims = JSON.parse(Buffer.from(antiga.access_token.split(".")[1], "base64url"));
          assert.equal(sql("select exists(select from auth.sessions where id=:'sid' and user_id=:'uid');", { sid: claims.session_id, uid: leitor.id }), "f");
          await conferir(ligado.origem, "publicada", original, 401);
          assert.ok(Date.now() < antiga.expires_at * 1000, "Token ainda dentro da validade");
          await conferir(ligado.origem, "publicada", { cookie: cookie(outra) }, 200, esperado);
          await conferir(ligado.origem, "publicada", { cookie: "preferencia=tema" }, 200, esperado);
        });
        await t.test("credenciais ilegíveis ou incompletas recebem 401", async () => {
          for (const valor of [chaveCookie + "=", chaveCookie + "=invalido", chaveCookie + ".1=parte"]) {
            await conferir(ligado.origem, "publicada", { cookie: valor }, 401);
          }
          await conferir(ligado.origem, "publicada", { authorization: "Bearer invalido" }, 401);
          await conferir(ligado.origem, "publicada", { cookie: cookie({ access_token: "invalido.para.teste" }) }, 401);
        });
        await t.test("falha do serviço dá 503 e a rota protegida habitual continua exigindo login", async () => {
          const sessao = { cookie: cookie(await login(leitor)) };
          ponte.simularFalha(true);
          try {
            await conferir(ligado.origem, "publicada", {}, 503);
            const inicio = ponte.chamadas.length;
            await conferir(ligado.origem, "publicada", sessao, 503);
            assert.deepEqual(ponte.chamadas.slice(inicio), ["/auth/v1/user"]);
          } finally { ponte.simularFalha(false); }
          const controle = await fetch(ligado.origem + "/painel-autor", { redirect: "manual" });
          assert.ok([307, 308].includes(controle.status));
          const destino = new URL(controle.headers.get("location"), ligado.origem);
          assert.equal(destino.pathname, "/login");
          assert.equal(destino.searchParams.get("redirectTo"), "/painel-autor");
        });
        await t.test("cookie original com JWT vencido recebe 401 mesmo com refresh token", async () => {
          const sessao = await login(leitor);
          const { exp } = JSON.parse(Buffer.from(sessao.access_token.split(".")[1], "base64url"));
          assert.ok(Number.isSafeInteger(exp) && exp * 1000 > Date.now());
          assert.ok(sessao.refresh_token);
          const original = { cookie: cookie(sessao) };
          await conferir(ligado.origem, "publicada", original, 200, esperado);
          await pausa(Math.max(0, exp * 1000 - Date.now() + 1200));
          assert.ok(Date.now() >= exp * 1000);
          await conferir(ligado.origem, "publicada", original, 401);
          await conferir(ligado.origem, "publicada", {}, 200, esperado);
        });
        await t.test("revogação com consultas simultâneas: decisão já tomada, prova em trânsito e pedido novo", () =>
          revogarDuranteLeitura({ db, sql, pausar: () => sql(pausaOperacional), ponte, conferir, origem: ligado.origem, esperado }));
        assert.equal(arquivo("estado.sql"), antes, "Leituras preservam tabelas e permissões");
      } finally { await ligado.parar(); }

      const { id: idNovo, material: chaveNova } = ativarNovaChave();
      assert.ok(chaveNova !== chaveProva, "As instâncias usam chaves distintas");
      await t.test("a instância B atende a chave nova e mantém as permissões de cada leitor", async () => {
        const nova = await iniciarNext(ponte.url, config.ANON_KEY, true, chaveNova);
        try {
          await conferir(nova.origem, "publicada", {}, 200, esperado);
          sql("update public.preferencias_privacidade set visibilidade_obras='seguidores' where user_id=:'autor';", { autor: autor.id });
          try {
            const antes = arquivo("estado.sql");
            await conferir(nova.origem, "publicada", {}, 404);
            await conferir(nova.origem, "publicada", { cookie: cookie(await login(leitor)) }, 200, esperado);
            await conferir(nova.origem, "publicada", { cookie: cookie(await login(bloqueado)) }, 404);
            assert.equal(arquivo("estado.sql"), antes);
          } finally {
            sql("update public.preferencias_privacidade set visibilidade_obras='publico' where user_id=:'autor';", { autor: autor.id });
          }
        } finally { await nova.parar(); }
      });
      await t.test("rollback da aplicação para A mantém a chave antiga revogada e a chave B no banco", async () => {
        const anterior = await iniciarNext(ponte.url, config.ANON_KEY, true, chaveProva);
        try {
          const antes = arquivo("estado.sql");
          await conferir(anterior.origem, "publicada", {}, 503);
          await conferir(anterior.origem, "publicada", { cookie: cookie(await login(leitor)) }, 503);
          assert.equal(sql("select id_vault from previa_assinatura.chave_ativa;"), idNovo);
          assert.equal(arquivo("estado.sql"), antes);
        } finally { await anterior.parar(); }
      });
      await t.test("restaurar a configuração B após o rollback recupera a prévia", async () => {
        const restaurada = await iniciarNext(ponte.url, config.ANON_KEY, true, chaveNova);
        try {
          await conferir(restaurada.origem, "publicada", {}, 200, esperado);
          await conferir(restaurada.origem, "publicada", { cookie: cookie(await login(leitor)) }, 200, esperado);
        } finally { await restaurada.parar(); }
      });
    } finally {
      sql(pausaOperacional);
      sql(reverter);
      await t.test("reversão remove a entrada de ensaio e restaura as permissões anteriores", () => {
        assert.equal(sql(`select to_regprocedure('public.previa_abertura_assinada(text)') is null
          and to_regnamespace('previa_assinatura') is null
          and to_regclass('previa_assinatura.chave_ativa') is null
          and not has_function_privilege('anon','previa_interno.abertura_obra(text)','EXECUTE')
          and not has_function_privilege('authenticated','previa_interno.abertura_obra(text)','EXECUTE')
          and not has_schema_privilege('anon','previa_interno','USAGE')
          and has_function_privilege('authenticated','previa_interno.sessao_atual_ativa()','EXECUTE');`), "t");
      });
      sql(instalar);
      assert.equal(sql(`select not exists(select from previa_assinatura.chave_ativa)
        and not has_function_privilege('anon','public.previa_abertura_assinada(text)','EXECUTE')
        and not has_function_privilege('authenticated','public.previa_abertura_assinada(text)','EXECUTE');`), "t");
    }
  } finally {
    for (const id of segredos) sql("delete from vault.secrets where id=:'id'::uuid;", { id });
    if (contas.length) sql("delete from public.obras where user_id=:'id' and starts_with(slug,:'prefixo');", { id: contas[0].id, prefixo });
    for (const conta of contas.reverse()) assert.ifError((await admin.deleteUser(conta.id)).error);
  }
});
