import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL(
    "../../app/perfil-autor/lib/profile-auth-session-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/perfil-autor/page.tsx", import.meta.url),
  "utf8",
);
let indiceModulo = 0;

async function carregarModulo({ user = { id: "usuario-1" }, falhar = false } = {}) {
  const chamadas = [];
  globalThis.__profileAuthSessionDependencies = {
    supabase: {
      auth: {
        async getUser() {
          chamadas.push("getUser");
          if (falhar) {
            throw new Error("sessão indisponível");
          }
          return { data: { user } };
        },
      },
    },
  };

  const javascript = typescript.transpileModule(
    source.replace(
      'import { supabase } from "../../../lib/supabase/client";',
      "const supabase = globalThis.__profileAuthSessionDependencies.supabase;",
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

test("retorna true quando há usuário autenticado", async () => {
  const modulo = await carregarModulo();
  assert.equal(await modulo.usuarioEstaLogado(), true);
  assert.deepEqual(modulo.chamadas, ["getUser"]);
});

test("retorna false quando não há usuário autenticado", async () => {
  const modulo = await carregarModulo({ user: null });
  assert.equal(await modulo.usuarioEstaLogado(), false);
  assert.deepEqual(modulo.chamadas, ["getUser"]);
});

test("retorna false quando a leitura da sessão falha", async () => {
  const modulo = await carregarModulo({ falhar: true });
  assert.equal(await modulo.usuarioEstaLogado(), false);
  assert.deepEqual(modulo.chamadas, ["getUser"]);
});

test("Perfil de Autor delega a verificação de sessão para o helper", () => {
  assert.match(
    pagina,
    /import \{ usuarioEstaLogado \} from "\.\/lib\/profile-auth-session-utils";/,
  );
  assert.doesNotMatch(pagina, /async function usuarioEstaLogado\(/);
  assert.match(source, /export async function usuarioEstaLogado\(/);
  assert.match(source, /supabase\.auth\.getUser\(\)/);
  assert.doesNotMatch(source, /useState|useEffect|localStorage/);
});
