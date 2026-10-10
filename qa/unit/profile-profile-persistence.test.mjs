import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL(
    "../../app/perfil-autor/lib/profile-profile-persistence.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/perfil-autor/page.tsx", import.meta.url),
  "utf8",
);
let indiceModulo = 0;

async function carregarModulo({
  idValido = true,
  consultas = [],
  erroEscrita = null,
  bioMax = 10,
  sobreMax = 12,
} = {}) {
  const chamadas = [];
  const filaConsultas = [...consultas];
  const dependencias = {
    bioMax,
    sobreMax,
    idAutorSupabaseValido() {
      return idValido;
    },
    normalizarUsernamePerfilAutor(valor) {
      chamadas.push(["normalizarUsername", valor]);
      return valor.trim().toLowerCase();
    },
    pegarTexto(valor) {
      return typeof valor === "string" ? valor.trim() : "";
    },
    supabase: {
      from(tabela) {
        chamadas.push(["from", tabela]);
        let operacao = "";
        const consulta = {
          select(valor) {
            operacao = "select";
            chamadas.push(["select", valor]);
            return consulta;
          },
          eq(campo, valor) {
            chamadas.push(["eq", campo, valor]);
            if (operacao === "update") {
              return Promise.resolve({ error: erroEscrita });
            }
            return consulta;
          },
          limit(valor) {
            chamadas.push(["limit", valor]);
            return consulta;
          },
          maybeSingle() {
            chamadas.push(["maybeSingle"]);
            return Promise.resolve(
              filaConsultas.shift() ?? { data: null, error: null },
            );
          },
          update(payload) {
            operacao = "update";
            chamadas.push(["update", payload]);
            return consulta;
          },
          insert(payload) {
            chamadas.push(["insert", payload]);
            return Promise.resolve({ error: erroEscrita });
          },
        };
        return consulta;
      },
    },
  };
  globalThis.__profilePersistenceDependencies = dependencias;

  const javascript = typescript.transpileModule(
    source
      .replace(
        'import { supabase } from "../../../lib/supabase/client";',
        "const supabase = globalThis.__profilePersistenceDependencies.supabase;",
      )
      .replace(
        'import type { TablesUpdate } from "../../../lib/supabase/database.types";\n',
        "",
      )
      .replace(
        'import { BIO_MAX_LENGTH, SOBRE_BIO_MAX_LENGTH } from "../constants";',
        "const BIO_MAX_LENGTH = globalThis.__profilePersistenceDependencies.bioMax;\nconst SOBRE_BIO_MAX_LENGTH = globalThis.__profilePersistenceDependencies.sobreMax;",
      )
      .replace('import type { PerfilAutorSalvo } from "../types";\n', "")
      .replace(
        'import { pegarTexto } from "./data-normalizers";',
        "const pegarTexto = globalThis.__profilePersistenceDependencies.pegarTexto;",
      )
      .replace(
        /import \{[\s\S]*?\} from "\.\/profile-formatters";/,
        `const {
  idAutorSupabaseValido,
  normalizarUsernamePerfilAutor,
} = globalThis.__profilePersistenceDependencies;`,
      ),
    {
      compilerOptions: {
        module: typescript.ModuleKind.ESNext,
        target: typescript.ScriptTarget.ES2022,
      },
    },
  ).outputText;

  const modulo = await import(
    `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}#${indiceModulo++}`,
  );

  return { ...modulo, chamadas };
}

function criarPerfil({
  avatar = "https://cdn.example/avatar.png",
  bio = "123456789012345",
  sobreBio = "abcdefghijklmnop",
} = {}) {
  return {
    avatar,
    avatarNome: "",
    bio,
    sobreBio,
    mostrarDestaques: true,
  };
}

test("rejeita ID inválido sem consultar profiles", async () => {
  const modulo = await carregarModulo({ idValido: false });

  assert.deepEqual(
    await modulo.salvarPerfilUsuarioSupabase({
      userId: " usuario-invalido ",
      nome: "Autor",
      perfil: criarPerfil(),
    }),
    { ok: false, erro: "ID de usuário inválido para salvar perfil." },
  );
  assert.deepEqual(modulo.chamadas, []);
});

test("atualiza perfil encontrado por user_id preservando payload", async () => {
  const modulo = await carregarModulo({
    consultas: [{ data: { id: " perfil-1 " }, error: null }],
  });

  assert.deepEqual(
    await modulo.salvarPerfilUsuarioSupabase({
      userId: " usuario-1 ",
      nome: "  Autor Um  ",
      perfil: criarPerfil(),
      username: "  MeuUser  ",
    }),
    { ok: true, erro: "" },
  );

  assert.deepEqual(
    modulo.chamadas.filter((chamada) => chamada[0] === "eq"),
    [
      ["eq", "user_id", "usuario-1"],
      ["eq", "id", "perfil-1"],
    ],
  );

  const payload = modulo.chamadas.find(
    (chamada) => chamada[0] === "update",
  )[1];

  assert.equal(payload.nome, "Autor Um");
  assert.equal(payload.avatar_url, "https://cdn.example/avatar.png");
  assert.equal(payload.bio, "1234567890");
  assert.equal(payload.sobre_bio, "abcdefghijkl");
  assert.equal(payload.username, "meuuser");
  assert.equal(typeof payload.atualizado_em, "string");
});

test("faz fallback por id e atualiza o perfil encontrado", async () => {
  const modulo = await carregarModulo({
    consultas: [
      { data: null, error: null },
      { data: { id: "usuario-2" }, error: null },
    ],
  });

  const resultado = await modulo.salvarPerfilUsuarioSupabase({
    userId: "usuario-2",
    nome: "",
    perfil: criarPerfil({ avatar: "data:image/png;base64,abc" }),
    username: null,
  });

  assert.deepEqual(resultado, { ok: true, erro: "" });

  const payload = modulo.chamadas.find(
    (chamada) => chamada[0] === "update",
  )[1];
  assert.equal(payload.nome, "Usuário");
  assert.equal(payload.avatar_url, "");
  assert.equal(payload.username, null);

  assert.deepEqual(
    modulo.chamadas.filter((chamada) => chamada[0] === "eq").slice(0, 2),
    [
      ["eq", "user_id", "usuario-2"],
      ["eq", "id", "usuario-2"],
    ],
  );
});

test("insere novo perfil e omite username quando não informado", async () => {
  const modulo = await carregarModulo({
    consultas: [
      { data: null, error: null },
      { data: null, error: null },
    ],
  });

  assert.deepEqual(
    await modulo.salvarPerfilUsuarioSupabase({
      userId: "usuario-3",
      nome: "Autor Três",
      perfil: criarPerfil({ avatar: "blob:https://local/avatar" }),
    }),
    { ok: true, erro: "" },
  );

  const payload = modulo.chamadas.find(
    (chamada) => chamada[0] === "insert",
  )[1];

  assert.equal(payload.id, "usuario-3");
  assert.equal(payload.user_id, "usuario-3");
  assert.equal(payload.tipo, "leitor");
  assert.equal(payload.avatar_url, "");
  assert.equal("username" in payload, false);
});

test("preserva erros de consulta e escrita", async () => {
  const erroConsulta = new Error("consulta indisponível");
  const consultaFalha = await carregarModulo({
    consultas: [{ data: null, error: erroConsulta }],
  });
  assert.deepEqual(
    await consultaFalha.salvarPerfilUsuarioSupabase({
      userId: "usuario-4",
      nome: "Autor",
      perfil: criarPerfil(),
    }),
    { ok: false, erro: "consulta indisponível" },
  );

  const escritaFalha = await carregarModulo({
    consultas: [{ data: { id: "perfil-5" }, error: null }],
    erroEscrita: new Error("update bloqueado"),
  });
  assert.deepEqual(
    await escritaFalha.salvarPerfilUsuarioSupabase({
      userId: "usuario-5",
      nome: "Autor",
      perfil: criarPerfil(),
    }),
    { ok: false, erro: "update bloqueado" },
  );
});

test("Perfil de Autor delega a persistência do perfil para o novo módulo", () => {
  assert.match(
    pagina,
    /import \{ salvarPerfilUsuarioSupabase \} from "\.\/lib\/profile-profile-persistence";/,
  );
  assert.doesNotMatch(pagina, /async function salvarPerfilUsuarioSupabase\(/);
  assert.doesNotMatch(pagina, /TablesUpdate/);
  assert.match(
    source,
    /export async function salvarPerfilUsuarioSupabase\(/,
  );
  assert.match(source, /\.from\("profiles"\)/);
  assert.match(source, /\.update\(payloadAtualizacao\)/);
  assert.match(source, /\.insert\(\{/);
  assert.doesNotMatch(source, /useState|useEffect|localStorage/);
});
