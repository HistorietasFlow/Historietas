import { randomBytes, randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { expect, test } from "@playwright/test";

// Somente fixtures novas no descartável. Nunca habilitar o gate neste harness.
const api = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const client = () => createClient(api, key, options);
const checked = result => {
  // Não incluir respostas, credenciais ou identidades nos diagnósticos.
  expect(result.error === null, "operação local deve concluir sem erro").toBe(true);
  return result.data;
};
let author, other, anonymous, session, authorId;
const original = "Texto original da fixture de integração local.";
const edited = "Texto editado, com espaços  internos e marcação **literal**.";
const root = page => page.locator('main[data-historietas-editar-capitulo-root="true"]:visible');
const body = page => root(page).getByRole("textbox", { name: "Texto do capítulo", exact: true });
const save = page => root(page).getByRole("button", { name: "Salvar alterações", exact: true });

test.beforeAll(async () => {
  expect(["127.0.0.1", "localhost", "[::1]"]).toContain(new URL(api).hostname);
  expect(["127.0.0.1", "localhost", "[::1]"]).toContain(new URL(process.env.E2E_BASE_URL).hostname);
  const admin = createClient(api, process.env.SUPABASE_SERVICE_ROLE_KEY, options);
  const accounts = [];
  for (const label of ["author", "other"]) {
    const email = `editor-${randomUUID()}@historietas.test`;
    const password = randomBytes(24).toString("base64url");
    checked(await admin.auth.admin.createUser({ email, password, email_confirm: true }));
    const account = client();
    const auth = checked(await account.auth.signInWithPassword({ email, password }));
    checked(await account.from("profiles").insert({ id: auth.user.id, user_id: auth.user.id,
      nome: "QA integração", tipo: "autor", username: `qa-${randomUUID()}` }));
    checked(await account.rpc("aceitar_termos_publicacao", { p_termos_versao: "2026-08-05",
      p_diretrizes_versao: "2026-08-05", p_politica_versao: "2026-08-05" }));
    accounts.push({ account, auth });
    console.log(JSON.stringify({ phase: `fixture-${label}`, status: "passed" }));
  }
  author = accounts[0].account;
  session = accounts[0].auth.session;
  authorId = accounts[0].auth.user.id;
  other = accounts[1].account;
  anonymous = client();
});

async function fixture(published = false) {
  const work = { id: randomUUID(), chapter: randomUUID() };
  checked(await author.from("obras").insert({ id: work.id, user_id: authorId,
    titulo: "QA integração editor", autor: "QA integração", genero: "Fantasia", formato: "Romance",
    classificacao_indicativa: "Livre", publicado: published, slug: `qa-editor-${work.id}` }));
  checked(await author.from("capitulos").insert({ id: work.chapter, obra_id: work.id, user_id: authorId,
    titulo: "Capítulo QA", texto: original, ordem: 7, publicado: published, tipo_conteudo: "texto" }));
  return work;
}
const remote = async work => checked(await author.from("capitulos").select("*").eq("id", work.chapter).single());
const diary = async work => checked(await author.from("diario_atividades").select("id")
  .eq("capitulo_id", work.chapter).eq("tipo", "editou_capitulo"));
const recovery = (page, work) => page.evaluate(key => JSON.parse(sessionStorage.getItem(key) || "null"),
  `historietas-edicao-texto:${authorId}:${work.id}:${work.chapter}`);

async function open(page, context, baseURL, work, viewport) {
  await page.setViewportSize(viewport);
  const cookies = new Map();
  const ssr = createServerClient(api, key, { cookies: { getAll: () => [], setAll: values => {
    for (const item of values) cookies.set(item.name, item);
  } } });
  checked(await ssr.auth.setSession({ access_token: session.access_token, refresh_token: session.refresh_token }));
  await context.addCookies([...cookies.values()].filter(c => c.value).map(c => ({ name: c.name,
    value: c.value, url: baseURL, sameSite: "Lax" })));
  await page.goto(`/editar-capitulo?obraId=${work.id}&capituloId=${work.chapter}`);
  await expect(body(page)).toHaveValue(original);
  await expect(save(page)).toBeEnabled();
}

test("Data API/Auth: gate fechado, CAS e isolamento de contas", async () => {
  const work = await fixture();
  for (const reader of [other, anonymous]) {
    expect(checked(await reader.from("capitulos").select("id").eq("id", work.chapter))).toEqual([]);
  }
  const before = await remote(work);
  const changed = checked(await author.from("capitulos").update({ texto: edited }).eq("id", work.chapter)
    .eq("user_id", authorId).eq("atualizado_em", before.atualizado_em).select("*"));
  expect(changed).toHaveLength(1);
  expect(typeof changed[0].diario_edicao_versao === "string").toBe(true);
  expect(checked(await author.from("capitulos").update({ texto: original }).eq("id", work.chapter)
    .eq("atualizado_em", before.atualizado_em).select("id"))).toEqual([]);
  expect(checked(await other.from("capitulos").update({ texto: original }).eq("id", work.chapter).select("id"))).toEqual([]);
  const args = { p_capitulo_id: work.chapter, p_versao: changed[0].diario_edicao_versao };
  expect((await author.rpc("registrar_diario_edicao_capitulo", args)).error?.code).toBe("55000");
  expect((await other.rpc("registrar_diario_edicao_capitulo", args)).error?.code).toBe("55000");
  expect((await anonymous.rpc("registrar_diario_edicao_capitulo", args)).error?.code).toBe("42501");
  expect((await author.from("diario_atividades").insert({ user_id: authorId, tipo: "editou_capitulo",
    obra_id: work.id, capitulo_id: work.chapter })).error?.code).toBe("42501");
  expect((await remote(work)).texto).toBe(edited);
  expect(await diary(work)).toEqual([]);
});

for (const [device, viewport] of [["desktop", { width: 1440, height: 900 }], ["mobile", { width: 390, height: 844 }]]) {
  test(`save publicado e recuperação somente RPC com gate desligado — ${device}`, async ({ page, context, baseURL }) => {
    const work = await fixture(true);
    await open(page, context, baseURL, work, viewport);
    const counts = { patch: 0, directInsert: 0, rpc: 0, notification: 0 };
    page.on("request", request => {
      const path = new URL(request.url()).pathname;
      if (path === "/rest/v1/capitulos" && request.method() === "PATCH") counts.patch++;
      if (path === "/rest/v1/diario_atividades" && request.method() === "POST") counts.directInsert++;
      if (path === "/rest/v1/rpc/registrar_diario_edicao_capitulo") counts.rpc++;
      if (path === "/rest/v1/rpc/criar_notificacoes_capitulo") counts.notification++;
    });
    await body(page).fill(edited);
    await save(page).dblclick();
    const updated = root(page).getByRole("button", { name: "Atualizado", exact: true });
    await expect(updated).toBeVisible();
    await expect(root(page).getByText("O capítulo foi salvo. O Diário está indisponível ou desativado; a intenção foi preservada.", { exact: true })).toBeVisible();
    expect(counts).toMatchObject({ patch: 1, directInsert: 0, rpc: 1 });
    const first = await remote(work), notification = counts.notification;
    expect(first.texto).toBe(edited);
    expect(first.ordem).toBe(7);
    expect(first.publicado).toBe(true);
    expect((await recovery(page, work)).diario).toEqual([{ versao: first.diario_edicao_versao, estado: "indisponivel" }]);
    const retry = page.waitForResponse(r => new URL(r.url()).pathname === "/rest/v1/rpc/registrar_diario_edicao_capitulo");
    await updated.click(); // Ação manual funcional; não é retry do runner.
    const denied = await retry;
    expect(denied.status()).toBe(500); // SQLSTATE 55000, não falha de transporte.
    expect((await denied.json()).code).toBe("55000");
    await expect(updated).toBeVisible();
    expect(counts).toEqual({ patch: 1, directInsert: 0, rpc: 2, notification });
    expect(await remote(work)).toEqual(first);
    expect(await diary(work)).toEqual([]);
    await test.info().attach("editor-counts", { body: JSON.stringify(counts), contentType: "application/json" });
  });

  test(`CAS concorrente preserva texto remoto e buffer — ${device}`, async ({ page, context, baseURL }) => {
    const work = await fixture();
    await open(page, context, baseURL, work, viewport);
    checked(await author.from("capitulos").update({ texto: "Versão concorrente local" }).eq("id", work.chapter));
    const concurrent = await remote(work);
    await body(page).fill(edited);
    await save(page).click();
    await expect(root(page).getByText("O capítulo foi alterado em outra versão. Seu texto foi preservado; compare as versões antes de salvar.", { exact: true })).toBeVisible();
    expect(await remote(work)).toEqual(concurrent);
    await expect(body(page)).toHaveValue(edited);
    expect((await recovery(page, work)).texto).toBe(edited);
    expect(await diary(work)).toEqual([]);
  });
}
