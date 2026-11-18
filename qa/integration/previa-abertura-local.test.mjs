import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { setTimeout as delay } from "node:timers/promises";
import test from "node:test";

// Entrada: saída de 'supabase status -o env' do banco descartável.
const config = Object.fromEntries(readFileSync(0, "utf8").split(/\r?\n/)
  .filter(line => /^[A-Z0-9_]+=/.test(line))
  .map(line => {
    const pos = line.indexOf("=");
    const value = line.slice(pos + 1);
    return [line.slice(0, pos), value.startsWith('"') ? JSON.parse(value) : value];
  }));

function local(value, protocols) {
  const url = new URL(value);
  assert.ok(protocols.includes(url.protocol) && ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname));
  assert.equal(url.search, "", "A conexão de QA deve ser direta");
  return url.href.replace(/\/$/, "");
}
const auth = local(config.AUTH_URL || config.API_URL + "/auth/v1", ["http:"]);
const rest = local(config.REST_URL || config.API_URL + "/rest/v1", ["http:"]);
const db = local(config.DB_URL, ["postgres:", "postgresql:"]);
const dir = "qa/integration/previa-abertura/";
const up = "supabase/migrations/20261118021209_previa_abertura_inativa.sql";
const down = "docs/sql/rollback-previa-abertura.sql";

function psqlArgs(variables = {}) {
  return ["-X", "-qAt", "-v", "ON_ERROR_STOP=1", "-d", db,
    ...Object.entries(variables).flatMap(([key, value]) => ["-v", key + "=" + value])];
}
function sql(input, variables) {
  return execFileSync("psql", psqlArgs(variables), {input, encoding: "utf8"}).trim();
}
function script(file, variables) {
  return execFileSync("psql", [...psqlArgs(variables), "-f", file], {encoding: "utf8"}).trim();
}
function hash(file) {
  return createHash("sha256").update(readFileSync(file)).digest("hex");
}

async function request(url, {token, key = config.ANON_KEY, body, method, schema} = {}) {
  const response = await fetch(url, {
    method: method || (body === undefined ? "GET" : "POST"),
    redirect: "error",
    headers: {
      apikey: key,
      "Content-Type": "application/json",
      ...(token && {Authorization: "Bearer " + token}),
      ...(schema && {"Content-Profile": schema}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  return {status: response.status, data: text ? JSON.parse(text) : null};
}

async function login(account) {
  const result = await request(auth + "/token?grant_type=password", {body: account.credentials});
  assert.equal(result.status, 200, "Login local");
  assert.equal(result.data.user.id, account.id);
  return result.data.access_token;
}
async function createAccount(accounts) {
  const credentials = {email: "previa-" + randomUUID() + "@example.test", password: randomBytes(24).toString("hex")};
  const result = await request(auth + "/admin/users", {
    key: config.SERVICE_ROLE_KEY, token: config.SERVICE_ROLE_KEY, body: {...credentials, email_confirm: true},
  });
  assert.ok([200, 201].includes(result.status), "Criar usuário fictício pelo Auth local");
  const account = {id: result.data.id, credentials};
  accounts.push(account);
  account.token = await login(account);
  return account;
}

const adapter = "previa_abertura_local";
async function surface(token) {
  const catalog = await request(rest + "/", {token});
  assert.equal(catalog.status, 200);
  for (const name of [adapter, "abertura_obra", "sessao_atual_ativa"]) {
    const path = "/rpc/" + name;
    const body = name === "sessao_atual_ativa" ? {} : {p_slug: "qa"};
    assert.equal(Object.hasOwn(catalog.data.paths, path), false);
    assert.equal((await request(rest + path, {token, body})).status, 404);
    assert.equal((await request(rest + path, {token, body, schema: "previa_interno"})).status, 406);
  }
}
async function waitCatalog(present) {
  for (let attempt = 0; attempt < 80; attempt++) {
    const r = await request(rest + "/");
    assert.equal(r.status, 200);
    if (Object.hasOwn(r.data.paths, "/rpc/" + adapter) === present) {
      const probe = await request(rest + "/rpc/" + adapter, {body: {p_slug: "qa-espera-catalogo"}});
      if (present ? probe.status === 200 : probe.status === 404 && probe.data.code === "PGRST202") return;
    }
    await delay(250);
  }
  assert.fail("PostgREST não recarregou o catálogo local");
}

test("prévia desativada, permissões do leitor, logout e reversão exata", async () => {
  assert.ok(config.SERVICE_ROLE_KEY && config.ANON_KEY, "Chaves do ambiente local");
  assert.equal(hash(up), "17c91d46e8a318981d2290d851b1267ee21c0e2aa92a00abedb31ba677aa2539");
  assert.equal(hash(down), "ff3ab7834a5d012e8faf3629ea6144b881e1c712ae0dad7305477be844bb44cf");
  const accounts = [];
  const prefix = "qa-previa-" + randomUUID() + "-";
  const expected = [{trecho: "A".repeat(599) + "🌿"}];
  const preview = (token, name) => request(rest + "/rpc/" + adapter, {token, body: {p_slug: prefix + name}});
  try {
    const author = await createAccount(accounts);
    const reader = await createAccount(accounts);
    const blocked = await createAccount(accounts);
    const blocker = await createAccount(accounts);
    script(dir + "obras.sql", {autor: author.id, leitor: reader.id, bloqueado: blocked.id, bloqueador: blocker.id, prefixo: prefix});
    const before = script(dir + "estado.sql");
    await surface();
    await surface(reader.token);
    script(dir + "adapter-local.sql");
    try {
      await waitCatalog(true);
      const active = await login(reader);
      const session = JSON.parse(Buffer.from(reader.token.split(".")[1], "base64url"));
      const sessionExists = () => sql("select exists(select from auth.sessions where id=:'sid' and user_id=:'uid');", {sid: session.session_id, uid: reader.id});
      assert.equal(sessionExists(), "t");
      for (const token of [reader.token, active, author.token]) {
        assert.deepEqual(await preview(token, "publicada"), {status: 200, data: expected});
      }
      for (const token of [undefined, blocked.token, blocker.token]) {
        assert.deepEqual(await preview(token, "publicada"), {status: 200, data: []});
      }
      for (const slug of ["rascunho", "adulto", "capitulo-privado", "sem-abertura", "inexistente"]) {
        for (const token of [reader.token, author.token]) assert.deepEqual(await preview(token, slug), {status: 200, data: []});
      }
      const logout = await request(auth + "/logout?scope=local", {token: reader.token, body: {}});
      assert.equal(logout.status, 204);
      assert.equal(sessionExists(), "f");
      const revoked = await preview(reader.token, "publicada");
      assert.equal(revoked.status, 401);
      assert.equal(revoked.data.code, "PT401");
      assert.ok(Date.now() < session.exp * 1000);
      assert.deepEqual(await preview(active, "publicada"), {status: 200, data: expected});
      assert.equal((await preview("token-invalido", "publicada")).status, 401);

      const restricted = spawnSync("psql", [...psqlArgs(), "-v", "VERBOSITY=verbose", "-f", down], {encoding: "utf8"});
      assert.equal(restricted.status, 3);
      assert.match(restricted.stderr, /2BP01/);
    } finally {
      script(dir + "remover-adapter-local.sql");
      await waitCatalog(false);
    }
    await surface();
    assert.equal(script(dir + "estado.sql"), before, "Prévia sem efeitos sobre dados ou ACLs");
    script(down);
    try {
      assert.equal(sql("select to_regnamespace('previa_interno') is null;"), "t");
      await surface(await login(reader));
      assert.equal(script(dir + "estado.sql"), before, "Reversão preserva dados e ACLs");
    } finally {
      script(up); // Restaura a instalação inativa para os demais testes.
    }
  } finally {
    if (accounts.length) {
      sql("delete from public.obras where user_id=:'autor' and starts_with(slug,:'prefixo');", {autor: accounts[0].id, prefixo: prefix});
    }
    for (const account of accounts.reverse()) {
      const r = await request(auth + "/admin/users/" + account.id, {
        key: config.SERVICE_ROLE_KEY, token: config.SERVICE_ROLE_KEY, method: "DELETE",
      });
      assert.equal(r.status, 200, "Remover usuário fictício");
    }
  }
});
