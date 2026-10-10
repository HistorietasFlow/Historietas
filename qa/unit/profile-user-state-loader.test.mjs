import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL(
    "../../app/perfil-autor/lib/profile-user-state-loader.ts",
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
  userId = "usuario-1",
  falharAuth = false,
  falharColecao = false,
} = {}) {
  const chamadas = [];
  const dependencias = {
    supabase: {
      auth: {
        async getUser() {
          chamadas.push(["auth.getUser"]);
          if (falharAuth) {
            throw new Error("auth indisponível");
          }
          return { data: { user: userId ? { id: userId } : null } };
        },
      },
    },
    async carregarIdsObrasTabelaUsuario(tabela, id) {
      chamadas.push(["ids", tabela, id]);
      if (falharColecao) {
        throw new Error("coleção indisponível");
      }
      return {
        favoritos: ["fav-1"],
        concluidas: ["concluida-1"],
        seguindo_obras: ["seguida-1"],
      }[tabela] ?? [];
    },
    async carregarAutoresSeguidosSupabase(id) {
      chamadas.push(["autores", id]);
      return ["Autor Um"];
    },
  };
  globalThis.__profileUserStateLoaderDependencies = dependencias;

  const javascript = typescript.transpileModule(
    source
      .replace(
        'import { supabase } from "../../../lib/supabase/client";',
        "const supabase = globalThis.__profileUserStateLoaderDependencies.supabase;",
      )
      .replace(
        /import \{[\s\S]*?\} from "\.\/profile-user-collections-loader";/,
        `const {
  carregarAutoresSeguidosSupabase,
  carregarIdsObrasTabelaUsuario,
} = globalThis.__profileUserStateLoaderDependencies;`,
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

test("sem sessão confirma identidade e não carrega coleções", async () => {
  const modulo = await carregarModulo({ userId: "" });

  assert.deepEqual(await modulo.carregarEstadoUsuarioSupabase(), {
    estadoUsuario: null,
    identidadeConfirmada: true,
  });
  assert.deepEqual(modulo.chamadas, [["auth.getUser"]]);
});

test("carrega as quatro coleções do usuário preservando o contrato", async () => {
  const modulo = await carregarModulo();

  assert.deepEqual(await modulo.carregarEstadoUsuarioSupabase(), {
    estadoUsuario: {
      userId: "usuario-1",
      favoritas: ["fav-1"],
      concluidas: ["concluida-1"],
      obrasSeguidas: ["seguida-1"],
      autoresSeguidos: ["Autor Um"],
    },
    identidadeConfirmada: true,
  });
  assert.deepEqual(modulo.chamadas, [
    ["auth.getUser"],
    ["ids", "favoritos", "usuario-1"],
    ["ids", "concluidas", "usuario-1"],
    ["ids", "seguindo_obras", "usuario-1"],
    ["autores", "usuario-1"],
  ]);
});

test("falhas preservam identidade não confirmada", async () => {
  const falhaAuth = await carregarModulo({ falharAuth: true });
  assert.deepEqual(await falhaAuth.carregarEstadoUsuarioSupabase(), {
    estadoUsuario: null,
    identidadeConfirmada: false,
  });

  const falhaColecao = await carregarModulo({ falharColecao: true });
  assert.deepEqual(await falhaColecao.carregarEstadoUsuarioSupabase(), {
    estadoUsuario: null,
    identidadeConfirmada: false,
  });
});

test("Perfil de Autor delega o estado do usuário para o novo carregador", () => {
  assert.match(
    pagina,
    /import \{ carregarEstadoUsuarioSupabase \} from "\.\/lib\/profile-user-state-loader";/,
  );
  assert.doesNotMatch(pagina, /async function carregarEstadoUsuarioSupabase\(/);
  assert.match(source, /export async function carregarEstadoUsuarioSupabase\(/);
  assert.match(
    source,
    /carregarIdsObrasTabelaUsuario\("favoritos", userId\)/,
  );
  assert.match(source, /carregarAutoresSeguidosSupabase\(userId\)/);
  assert.doesNotMatch(source, /useState|useEffect|localStorage/);
});
