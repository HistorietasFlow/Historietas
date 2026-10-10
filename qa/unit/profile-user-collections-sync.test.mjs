import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL(
    "../../app/perfil-autor/lib/profile-user-collections-sync.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/perfil-autor/page.tsx", import.meta.url),
  "utf8",
);
let indiceModulo = 0;

function criarSupabase({ userId = "usuario-1", respostas = [] } = {}) {
  const chamadas = [];
  const fila = [...respostas];

  function proximaResposta() {
    return fila.shift() ?? { error: null };
  }

  return {
    chamadas,
    supabase: {
      auth: {
        async getUser() {
          chamadas.push({ tipo: "auth.getUser" });
          return { data: { user: userId ? { id: userId } : null } };
        },
      },
      from(tabela) {
        const filtros = [];
        let registroDelete = null;
        const consulta = {
          delete() {
            registroDelete = { tipo: "delete", tabela, eq: filtros };
            chamadas.push(registroDelete);
            return consulta;
          },
          eq(campo, valor) {
            filtros.push([campo, valor]);
            return consulta;
          },
          insert(payload) {
            chamadas.push({ tipo: "insert", tabela, payload });
            return Promise.resolve(proximaResposta());
          },
          upsert(payload, opcoes) {
            chamadas.push({ tipo: "upsert", tabela, payload, opcoes });
            return Promise.resolve(proximaResposta());
          },
          then(resolve, reject) {
            if (registroDelete) {
              registroDelete.eq = [...filtros];
            }
            return Promise.resolve(proximaResposta()).then(resolve, reject);
          },
        };
        return consulta;
      },
    },
  };
}

async function carregarModulo(configuracao = {}) {
  const dependencias = criarSupabase(configuracao);
  globalThis.__profileUserCollectionsSyncDependencies = dependencias;

  const javascript = typescript.transpileModule(
    source
      .replace(
        'import { supabase } from "../../../lib/supabase/client";',
        "const supabase = globalThis.__profileUserCollectionsSyncDependencies.supabase;",
      )
      .replace(
        'import type { VisibilidadeDiarioPerfil } from "../types";\n',
        "",
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

  return { ...modulo, dependencias };
}

test("ignora sincronização de coleção sem usuário ou identificador", async () => {
  const semUsuario = await carregarModulo({ userId: "" });
  await semUsuario.sincronizarTabelaUsuario("favoritos", "obra-1", true);
  assert.deepEqual(semUsuario.dependencias.chamadas, [
    { tipo: "auth.getUser" },
  ]);

  const semId = await carregarModulo();
  await semId.sincronizarTabelaUsuario("favoritos", "", true);
  assert.deepEqual(semId.dependencias.chamadas, [
    { tipo: "auth.getUser" },
  ]);
});

test("preserva delete antes do insert e payloads de obra e capítulo", async () => {
  const favoritos = await carregarModulo({
    respostas: [{ error: null }, { error: null }],
  });
  await favoritos.sincronizarTabelaUsuario(
    "favoritos",
    "obra-1",
    true,
    "publico",
  );
  assert.deepEqual(favoritos.dependencias.chamadas.slice(1), [
    {
      tipo: "delete",
      tabela: "favoritos",
      eq: [
        ["user_id", "usuario-1"],
        ["obra_id", "obra-1"],
      ],
    },
    {
      tipo: "insert",
      tabela: "favoritos",
      payload: {
        user_id: "usuario-1",
        obra_id: "obra-1",
        visibilidade: "publico",
      },
    },
  ]);

  const capitulos = await carregarModulo({
    respostas: [{ error: null }, { error: null }],
  });
  await capitulos.sincronizarTabelaUsuario(
    "salvos_capitulos",
    "capitulo-1",
    true,
    "privado",
  );
  assert.deepEqual(capitulos.dependencias.chamadas.slice(1), [
    {
      tipo: "delete",
      tabela: "salvos_capitulos",
      eq: [
        ["user_id", "usuario-1"],
        ["capitulo_id", "capitulo-1"],
      ],
    },
    {
      tipo: "insert",
      tabela: "salvos_capitulos",
      payload: {
        user_id: "usuario-1",
        capitulo_id: "capitulo-1",
      },
    },
  ]);
});

test("preserva visibilidade em concluídas e seguindo obras", async () => {
  for (const [tabela, visibilidade] of [
    ["concluidas", "parcial"],
    ["seguindo_obras", "publico"],
  ]) {
    const modulo = await carregarModulo({
      respostas: [{ error: null }, { error: null }],
    });
    await modulo.sincronizarTabelaUsuario(
      tabela,
      "obra-2",
      true,
      visibilidade,
    );
    assert.deepEqual(modulo.dependencias.chamadas.at(-1), {
      tipo: "insert",
      tabela,
      payload: {
        user_id: "usuario-1",
        obra_id: "obra-2",
        visibilidade,
      },
    });
  }
});

test("remoção não reinsere e falhas permanecem isoladas", async () => {
  const remocao = await carregarModulo({ respostas: [{ error: null }] });
  await remocao.sincronizarTabelaUsuario("concluidas", "obra-2", false);
  assert.equal(
    remocao.dependencias.chamadas.some((chamada) => chamada.tipo === "insert"),
    false,
  );

  const falha = await carregarModulo({
    respostas: [{ error: new Error("delete indisponível") }],
  });
  const warnOriginal = console.warn;
  const avisos = [];
  console.warn = (...args) => avisos.push(args);
  try {
    await falha.sincronizarTabelaUsuario("seguindo_obras", "obra-3", true);
  } finally {
    console.warn = warnOriginal;
  }
  assert.equal(
    falha.dependencias.chamadas.some((chamada) => chamada.tipo === "insert"),
    false,
  );
  assert.equal(avisos.length, 1);
});

test("preserva upsert e delete de autores seguidos", async () => {
  const seguindo = await carregarModulo({ respostas: [{ error: null }] });
  await seguindo.sincronizarAutorSeguidoSupabase("Autor", true);
  assert.deepEqual(seguindo.dependencias.chamadas.slice(1), [
    {
      tipo: "upsert",
      tabela: "seguindo_autores",
      payload: { user_id: "usuario-1", autor_nome: "Autor" },
      opcoes: { onConflict: "user_id,autor_nome" },
    },
  ]);

  const removendo = await carregarModulo({ respostas: [{ error: null }] });
  await removendo.sincronizarAutorSeguidoSupabase("Autor", false);
  assert.deepEqual(removendo.dependencias.chamadas.slice(1), [
    {
      tipo: "delete",
      tabela: "seguindo_autores",
      eq: [
        ["user_id", "usuario-1"],
        ["autor_nome", "Autor"],
      ],
    },
  ]);
});

test("página delega as duas sincronizações para a nova fronteira", () => {
  assert.match(
    pagina,
    /import \{[\s\S]*?sincronizarAutorSeguidoSupabase,[\s\S]*?sincronizarTabelaUsuario,[\s\S]*?\} from "\.\/lib\/profile-user-collections-sync";/,
  );
  assert.doesNotMatch(pagina, /async function sincronizarTabelaUsuario\(/);
  assert.doesNotMatch(
    pagina,
    /async function sincronizarAutorSeguidoSupabase\(/,
  );
  assert.match(source, /export async function sincronizarTabelaUsuario\(/);
  assert.match(
    source,
    /export async function sincronizarAutorSeguidoSupabase\(/,
  );
  assert.match(pagina, /sincronizarTabelaUsuario\(\s*"favoritos",/);
  assert.match(
    pagina,
    /sincronizarAutorSeguidoSupabase\(\s*autorNormalizado,/,
  );
});
