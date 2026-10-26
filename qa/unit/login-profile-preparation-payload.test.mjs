import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const preparationSource = readFileSync(
  new URL("../../app/login/lib/login-profile-preparation.ts", import.meta.url),
  "utf8",
);
const payloadSource = readFileSync(
  new URL("../../app/login/lib/login-profile-payload.ts", import.meta.url),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/login/page.tsx", import.meta.url),
  "utf8",
);

function carregar(source) {
  const javascript = typescript.transpileModule(source, {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`);
}

const { prepararDadosProfileLogin } = await carregar(preparationSource);
const { criarPayloadProfileLogin } = await carregar(payloadSource);

test("preparação preserva trim, metadata e prioridades do nome", () => {
  assert.deepEqual(
    prepararDadosProfileLogin("  user-1  ", "", "  leitor@historietas.test  ", {
      nome: "  Nome  ",
      name: "Name",
      full_name: "Full",
    }),
    {
      userIdLimpo: "user-1",
      metadata: { nome: "  Nome  ", name: "Name", full_name: "Full" },
      nomeMetadata: "Nome",
      emailLimpo: "leitor@historietas.test",
      nomeFinal: "Nome",
    },
  );
  assert.equal(
    prepararDadosProfileLogin("u", "", "", "invalido").nomeFinal,
    "Usuário",
  );
  assert.equal(
    prepararDadosProfileLogin("u", "", "prefixo@dominio.test", {
      nome: " ",
      name: "  Name  ",
      full_name: "Full",
    }).nomeFinal,
    "Name",
  );
  assert.equal(
    prepararDadosProfileLogin("u", "  Informado  ", "prefixo@dominio.test", null)
      .nomeFinal,
    "Informado",
  );
  assert.equal(
    prepararDadosProfileLogin("u", "", "prefixo@dominio.test", null).nomeFinal,
    "prefixo",
  );
});

test("payload preserva profile existente, fallbacks e timestamp recebido", () => {
  const atualizadoEm = "2026-10-26T12:00:00.000Z";
  assert.deepEqual(
    criarPayloadProfileLogin(
      {
        nome: "  Nome existente  ",
        bio: "  Bio existente  ",
        sobre_bio: "  Sobre existente  ",
        avatar_url: "avatar.png",
      },
      "user-1",
      "Nome final",
      atualizadoEm,
    ),
    {
      user_id: "user-1",
      nome: "Nome existente",
      bio: "Bio existente",
      sobre_bio: "Sobre existente",
      avatar_url: "avatar.png",
      atualizado_em: atualizadoEm,
    },
  );
  assert.deepEqual(
    criarPayloadProfileLogin(
      { bio: "  Bio existente  " },
      "user-2",
      "Nome final",
      atualizadoEm,
    ),
    {
      user_id: "user-2",
      nome: "Nome final",
      bio: "Bio existente",
      sobre_bio: "Bio existente",
      avatar_url: "",
      atualizado_em: atualizadoEm,
    },
  );
  assert.equal(
    criarPayloadProfileLogin(null, "user-3", "Nome final", atualizadoEm)
      .sobre_bio,
    "Perfil de leitor no Historietas.",
  );
});

test("Login delega preparação e payload sem mover a sincronização", () => {
  assert.match(pageSource, /from "\.\/lib\/login-profile-preparation";/);
  assert.match(pageSource, /from "\.\/lib\/login-profile-payload";/);
  assert.match(
    pageSource,
    /Não foi possível sincronizar o perfil sem o identificador do usuário\./,
  );
  assert.match(
    pageSource,
    /const agora = new Date\(\)\.toISOString\(\);[\s\S]*?criarPayloadProfileLogin\([\s\S]*?agora,/,
  );
  assert.doesNotMatch(pageSource, /const perfilPayload: TablesInsert/);
  assert.doesNotMatch(pageSource, /type PerfilExistenteLogin =/);
  assert.doesNotMatch(
    `${preparationSource}\n${payloadSource}`,
    /from\s+["']react["']|useState|useEffect|localStorage|router|import\s+\{\s*supabase\s*\}|supabase\.(?:auth|from|rpc)|<(?:[A-Z][A-Za-z0-9]*|[a-z][a-z0-9-]*)(?:\s|\/?>)/,
  );
});
