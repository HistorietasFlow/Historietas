import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

function carregar(path, mocks = {}) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const js = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const mod = { exports: {} };
  new Function("require", "module", "exports", js)(name => {
    if (name === "server-only") return {};
    if (name in mocks) return mocks[name];
    throw Error("Dependência não prevista no teste");
  }, mod, mod.exports);
  return mod.exports;
}
const dto = carregar("../../lib/stories/avaliacao-story-payload.ts");
const api = "https://public.example";
const photo = `${api}/storage/v1/object/public/avatars/foto.png`;
const base = () => ({
  obra: { titulo: "Título real", autor: "Crédito real", capa: `${api}/storage/v1/object/public/capas-obras/capa.png`, slug: "titulo-real" },
  leitor: { nome: "Leitor público", avatar_url: photo },
  autor: { nome: "Autor público", avatar_url: photo, username: "autor.real" },
  nota: 4.5, supabaseUrl: api,
});
test("payload usa nota individual exata e username público do autor", () => {
  const p = dto.montarPayloadStoryAvaliacao(base());
  assert.equal(p.compartilhavel, true);
  assert.deepEqual(p.avaliacao, { nota: 4.5, escala: 5, estrelasInteiras: 4, meiaEstrela: true });
  assert.equal(p.autor.username, "autor.real");
  assert.equal(p.autor.handle, "@autor.real");
  assert.equal(p.autor.mostrarHandle, true);
  assert.equal(p.autor.mostrarSeparador, true);
  assert.equal(p.leitor.foto, photo);
  assert.equal(Object.values(p.ausencias).some(Boolean), false);
});
test("todas as meias estrelas válidas são preservadas sem arredondamento", () => {
  for (let nota = 0.5; nota <= 5; nota += 0.5) {
    assert.equal(dto.montarPayloadStoryAvaliacao({ ...base(), nota }).avaliacao.nota, nota);
    assert.equal(dto.montarPayloadStoryAvaliacao({ ...base(), nota: nota.toFixed(1) }).avaliacao.nota, nota);
  }
  for (const nota of [null, undefined, "", "4,5", "4.5x", 0, 5.5, 4.2, NaN, Infinity, true]) {
    assert.equal(dto.montarPayloadStoryAvaliacao({ ...base(), nota }), null);
  }
});
test("sem @ público não inventa handle e oculta também &", () => {
  for (const username of [null, undefined, "", "@autor", "Autor Real", "a".repeat(31), "segredo@email.invalid"]) {
    const p = dto.montarPayloadStoryAvaliacao({ ...base(), autor: { ...base().autor, username } });
    assert.equal(p.autor.username, null);
    assert.equal(p.autor.handle, null);
    assert.equal(p.autor.mostrarHandle, false);
    assert.equal(p.autor.mostrarSeparador, false);
    assert.equal(p.ausencias.usernameAutor, true);
  }
});
test("ausências não usam nomes genéricos, metadata, médias ou fotos inventadas", () => {
  const p = dto.montarPayloadStoryAvaliacao({ ...base(), leitor: null, autor: null, obra: { slug: "real" } });
  assert.equal(p.compartilhavel, false);
  assert.equal(p.leitor.nome.texto, null);
  assert.equal(p.autor.nome.texto, null);
  assert.equal(p.obra.titulo.texto, null);
  assert.equal(Object.values(p.ausencias).every(Boolean), true);
});
test("texto longo é limitado por grafemas, com flag, sem cortar emoji ou acento", () => {
  const emoji = "👩🏽‍💻";
  assert.deepEqual(dto.textoStory(emoji.repeat(81), 80), { texto: emoji.repeat(80) + "…", truncado: true });
  assert.deepEqual(dto.textoStory("a\u0301".repeat(121), 120), { texto: "a\u0301".repeat(120) + "…", truncado: true });
  assert.deepEqual(dto.textoStory(" Nome\n real\u0000 ", 80), { texto: "Nome real", truncado: false });
});
test("mídia só aceita bucket público conhecido, nunca assinatura, credencial ou URL arbitrária", () => {
  for (const url of ["data:image/png;base64,abc", "javascript:alert(1)", "//public.example/x", "/x",
    photo + "?token=SEGREDO", photo + "#SEGREDO", photo.replace("/public/", "/sign/"),
    photo.replace("/public/", "/authenticated/"), photo.replace("avatars", "privado"),
    photo.replace("public.example", "outro.example"), photo.replace("https://", "https://segredo:senha@"),
    `${api}/storage/v1/object/public/avatars/`]) {
    assert.equal(dto.imagemPublicaStory(url, api, "avatars"), null);
  }
  assert.equal(dto.imagemPublicaStory(photo, api, "avatars"), photo);
});
test("serializa somente campos permitidos, sem IDs, e-mail, texto privado ou segredos", () => {
  const secret = { email: "SEGREDO", password: "SEGREDO", token: "SEGREDO", bio: "SEGREDO", user_id: "SEGREDO", user_metadata: { nome: "SEGREDO" } };
  const p = dto.montarPayloadStoryAvaliacao({ ...base(), leitor: { ...base().leitor, ...secret }, autor: { ...base().autor, ...secret } });
  assert.doesNotMatch(JSON.stringify(p), /SEGREDO|user_id|user_metadata|email|password|token|bio/);
});

const readerId = "d0100000-0000-4000-8000-000000000001";
const authorId = "d0100000-0000-4000-8000-000000000002";
const work = () => ({ estado: "obra_publica", obraId: "d0200000-0000-4000-8000-000000000001", geracao: "g", revisao: "1", slug: "real", obra: { titulo: "Real", autor: "Real", autorId: authorId, capa: null } });
function ambiente({ projections = [work(), work()], ratings = [{ nota: 4.5, visibilidade: "publico" }, { nota: 4.5, visibilidade: "publico" }], profiles, errorRating = false, errorProfiles = false, users = [readerId, readerId], authError = false } = {}) {
  const calls = [];
  const profilesValue = profiles ?? [{ user_id: readerId, nome: "Leitor real", avatar_url: null }, { user_id: authorId, nome: "Autor real", avatar_url: null, username: "real" }];
  const client = { from(table) {
    calls.push(["from", table]);
    const builder = {
      select(fields) { calls.push(["select", table, fields]); return builder; },
      eq(field, value) { calls.push(["eq", table, field, value]); return builder; },
      async maybeSingle() { return { data: ratings.shift() ?? null, error: errorRating ? { message: "SEGREDO" } : null }; },
      async in(field, ids) { calls.push(["in", table, field, ids]); return { data: profilesValue, error: errorProfiles ? { message: "SEGREDO" } : null }; },
    };
    return builder;
  } };
  const loader = carregar("../../lib/server/stories/carregar-story-avaliacao.ts", {
    "../../supabase/server": { async criarSupabaseServerClient() { return { auth: { async getUser() {
      calls.push(["auth-user"]);
      const id = users.shift();
      return { data: { user: id ? { id } : null }, error: authError ? { message: "SEGREDO" } : null };
    } } }; } },
    "../../supabase/public": { criarSupabasePublicClient(options) { calls.push(["client", options]); return client; } },
    "../../utils": { idObraSupabaseValido: value => /^[a-f0-9-]{36}$/i.test(value.trim()) },
    "../agendamento/ler-projecao-publica": { async lerProjecaoPublicaObra() { calls.push(["projection"]); const p = projections.shift(); if (p instanceof Error) throw p; return p; } },
    "../../stories/avaliacao-story-payload": dto,
  });
  return { calls, load: (input = { slug: "real", leitorId: readerId }) => loader.carregarStoryAvaliacaoObra(input) };
}
test("identidade: sem autenticação ou Auth com erro não autoriza story", async () => {
  for (const options of [{ users: [null] }, { authError: true }]) {
    const e = ambiente(options), r = await e.load();
    assert.deepEqual(r, { estado: "indisponivel", motivo: "autenticacao_necessaria", payload: null });
    assert.equal(e.calls.some(c => c[0] === "from" || c[0] === "projection"), false);
  }
});
test("identidade: conta diferente não pode gerar story de avaliação pública alheia", async () => {
  const e = ambiente({ users: [authorId] }), r = await e.load();
  assert.deepEqual(r, { estado: "indisponivel", motivo: "avaliacao_de_outro_leitor", payload: null });
  assert.equal(e.calls.some(c => c[0] === "from" || c[0] === "projection"), false);
});
test("identidade: sessão revogada ou trocada antes do retorno descarta o payload", async () => {
  for (const id of [null, authorId]) {
    const r = await ambiente({ users: [readerId, id] }).load();
    assert.equal(r.payload, null);
    assert.equal(r.estado, "indisponivel");
  }
});
test("loader anônimo seleciona username, aplica obra/leitor/publico e confirma fonte atual", async () => {
  const e = ambiente(); const r = await e.load();
  assert.equal(r.estado, "disponivel"); assert.equal(r.payload.autor.username, "real");
  assert.deepEqual(e.calls.filter(c => c[0] === "select"), [
    ["select", "obra_avaliacoes", "nota,visibilidade"], ["select", "profiles_publicos", "user_id,nome,avatar_url,username"], ["select", "obra_avaliacoes", "nota,visibilidade"],
  ]);
  assert.equal(e.calls.filter(c => c[0] === "projection").length, 2);
  assert.equal(e.calls.filter(c => c[0] === "eq" && c[2] === "visibilidade" && c[3] === "publico").length, 2);
  assert.equal(e.calls.filter(c => c[0] === "eq" && c[2] === "obra_id").length, 2);
  assert.equal(e.calls.filter(c => c[0] === "eq" && c[2] === "user_id" && c[3] === readerId).length, 2);
  assert.equal(e.calls.filter(c => c[0] === "client").length, 1);
  assert.equal(e.calls.filter(c => c[0] === "auth-user").length, 2);
  assert.deepEqual(e.calls[0], ["auth-user"]);
});
test("não permite privado, parcial, oculto por RLS ou avaliação ausente, mesmo para dono/seguidor", async () => {
  for (const rating of [null, { nota: 4.5, visibilidade: "privado" }, { nota: 4.5, visibilidade: "parcial" }]) {
    const e = ambiente({ ratings: [rating] }); const r = await e.load();
    assert.deepEqual(r, { estado: "indisponivel", motivo: "avaliacao_nao_publica", payload: null });
    assert.equal(e.calls.some(c => c[1] === "profiles_publicos"), false);
  }
});
test("obra indisponível/draft/18+ não consulta perfis nem avaliações", async () => {
  const e = ambiente({ projections: [{ estado: "obra_indisponivel" }] });
  assert.equal((await e.load()).motivo, "obra_indisponivel");
  assert.deepEqual(e.calls.map(c => c[0]), ["auth-user", "projection"]);
});
test("parâmetros inválidos e autoavaliação fecham sem payload", async () => {
  const e = ambiente();
  assert.equal((await e.load({ slug: "real", leitorId: "invalido" })).motivo, "parametros_invalidos");
  assert.equal(e.calls.length, 0);
  assert.equal((await ambiente({ users: [authorId] }).load({ slug: "real", leitorId: authorId })).motivo, "avaliacao_invalida");
});
test("fonte alterada durante leitura não permite exportar o payload antigo", async () => {
  for (const change of [{ estado: "obra_indisponivel" }, { ...work(), revisao: "2" }, { ...work(), geracao: "outra" }]) {
    assert.equal((await ambiente({ projections: [work(), change] }).load()).motivo, "fonte_alterada");
  }
  for (const change of [null, { nota: 3.5, visibilidade: "publico" }, { nota: 4.5, visibilidade: "privado" }]) {
    const r = await ambiente({ ratings: [{ nota: 4.5, visibilidade: "publico" }, change] }).load();
    assert.equal(r.motivo, "fonte_alterada"); assert.equal(r.payload, null);
  }
});
test("erro de fonte não vaza mensagens nem usa cache ou fallback Auth", async () => {
  for (const options of [{ errorRating: true }, { errorProfiles: true }, { projections: [Error("SEGREDO")] }]) {
    assert.deepEqual(await ambiente(options).load(), { estado: "indisponivel", motivo: "fonte_indisponivel", payload: null });
  }
});
test("perfil ausente mantém flags e não autoriza compartilhar dados incompletos", async () => {
  const r = await ambiente({ profiles: [] }).load();
  assert.equal(r.estado, "dados_incompletos"); assert.equal(r.payload.compartilhavel, false);
  assert.equal(r.payload.ausencias.nomeLeitor, true); assert.equal(r.payload.ausencias.usernameAutor, true);
});
test("fronteira server-only valida Auth SSR mas mantém os dados no cliente público sem cache", () => {
  const source = readFileSync(new URL("../../lib/server/stories/carregar-story-avaliacao.ts", import.meta.url), "utf8");
  assert.match(source, /import "server-only"/);
  assert.match(source, /cache: "no-store"/);
  assert.match(source, /from "\.\.\/\.\.\/supabase\/server"/);
  assert.match(source, /sessao\.auth\.getUser\(\)/);
  assert.match(source, /eq\("user_id", leitorAutenticadoId\)/);
  assert.doesNotMatch(source, /supabase\/client|service_role|auth\.getSession\(|localStorage|unstable_cache|console\./);
});
