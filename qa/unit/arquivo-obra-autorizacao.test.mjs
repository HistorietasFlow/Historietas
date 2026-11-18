import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const id = "00000000-0000-4000-8000-000000000001";
const owner = "00000000-0000-4000-8000-000000000002";
const reader = "00000000-0000-4000-8000-000000000003";
const path = owner + "/arquivo-fixture.txt";
const executeFile = (file, modulos) => {
  const source = readFileSync(new URL(file, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } });
  const exports = {};
  new Function("exports", "require", outputText)(exports, (name) => {
    assert.ok(name in modulos, name);
    return modulos[name];
  });
  return exports;
};

function factory({ uid = reader, permitir = true, published = true, rating = "Livre", file = path } = {}) {
  const calls = [];
  const state = { uid, permitir, published, rating, file };
  const admin = {
    async rpc(name) {
      assert.equal(name, "obter_arquivo_obra_para_assinatura");
      return { data: [{ id, user_id: owner, publicado: state.published, classificacao_indicativa: state.rating, arquivo_url: state.file }] };
    },
    storage: { from(bucket) {
      assert.equal(bucket, "arquivos-obras");
      return { async createSignedUrl(candidate, ttl) {
        assert.equal(ttl, 600);
        calls.push(["assinar", candidate]);
        return { data: { signedUrl: "https://storage.invalid/fixture" } };
      } };
    } },
  };
  const { POST } = executeFile("../../app/api/arquivos-obras/url/route.ts", {
    "next/server": { NextResponse: Response },
    "node:crypto": { createHash },
    "@/lib/server/protecaoAbuso": {
      obterIpConfiavel: () => "192.0.2.1",
      consumirLimiteRequisicao: async () => ({ permitido: true, restante: 99 }),
    },
    "@/lib/supabase/admin": { criarSupabaseAdminClient: () => admin, supabaseAdminConfigurado: true },
    "@/lib/supabase/server": { supabaseServerConfigurado: true },
    "@/lib/server/autorizacao-arquivo-obra": {
      resolverLeitorArquivo: async () => state.uid === null ? null : { usuarioId: state.uid },
      autorizarLeitorArquivo: async (usuario, obra, titular, fingerprint) => {
        assert.equal(fingerprint, createHash("sha256").update(state.file).digest("hex"));
        calls.push(["autorizar", usuario.usuarioId, obra, titular]);
        return state.permitir;
      },
    },
  });
  return { calls, state, request() {
    const r = new Request("https://historietas.invalid/api/arquivos-obras/url", {
      method: "POST",
      headers: { origin: "https://historietas.invalid", "content-type": "application/json" },
      body: JSON.stringify({ obraId: id }),
    });
    Object.defineProperty(r, "nextUrl", { value: new URL(r.url) });
    return POST(r);
  } };
}

test("titular e leitor autorizado recebem o caminho correto após autorização", async () => {
  for (const caso of [factory({ uid: owner, published: false, rating: "18+" }), factory(), factory({ uid: "" })]) {
    const r = await caso.request();
    assert.equal(r.status, 200);
    assert.equal(r.headers.get("cache-control"), "no-store");
    assert.deepEqual(await r.json(), { ok: true, url: "https://storage.invalid/fixture", expiraEmSegundos: 600 });
    assert.deepEqual(caso.calls, [["autorizar", caso.state.uid, id, owner], ["assinar", path]]);
  }
});

test("uma permissão previamente válida não autoriza a próxima assinatura", async () => {
  const caso = factory();
  assert.equal((await caso.request()).status, 200);
  caso.state.permitir = false;
  const negado = await caso.request();
  assert.equal(negado.status, 404);
  assert.equal((await negado.json()).url, undefined);
  assert.equal(caso.calls.filter(([t]) => t === "assinar").length, 1);
});

test("sessão inválida ou revogada é recusada sem fallback anônimo", async () => {
  for (const caso of [factory({ uid: null }), factory({ permitir: "sessao_invalida" }), factory({ uid: owner, permitir: "sessao_invalida" })]) {
    const r = await caso.request();
    assert.equal(r.status, 401);
    assert.equal((await r.json()).url, undefined);
    assert.ok(!caso.calls.some(([t]) => t === "assinar"));
  }
});

test("rascunho, classificação bloqueada e caminho de outro titular não são assinados", async () => {
  for (const caso of [factory({ published: false }), factory({ rating: "18+" }), factory({ file: reader + "/outro.txt" })]) {
    assert.equal((await caso.request()).status, 404);
    assert.ok(!caso.calls.some(([t]) => t === "assinar"));
  }
});
