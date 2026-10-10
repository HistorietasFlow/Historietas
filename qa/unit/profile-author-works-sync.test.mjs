import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL(
    "../../app/perfil-autor/lib/profile-author-works-sync.ts",
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
  resposta = { error: null },
  falharFrom = false,
} = {}) {
  const chamadas = [];
  const dependencias = {
    idAutorSupabaseValido() {
      return idValido;
    },
    supabase: {
      from(tabela) {
        chamadas.push(["from", tabela]);
        if (falharFrom) {
          throw new Error("Supabase indisponível");
        }

        const consulta = {
          update(payload) {
            chamadas.push(["update", payload]);
            return consulta;
          },
          eq(campo, valor) {
            chamadas.push(["eq", campo, valor]);
            return Promise.resolve(resposta);
          },
        };

        return consulta;
      },
    },
  };
  globalThis.__profileAuthorWorksSyncDependencies = dependencias;

  const javascript = typescript.transpileModule(
    source
      .replace(
        'import { supabase } from "../../../lib/supabase/client";',
        "const supabase = globalThis.__profileAuthorWorksSyncDependencies.supabase;",
      )
      .replace(
        'import { idAutorSupabaseValido } from "./profile-formatters";',
        "const idAutorSupabaseValido = globalThis.__profileAuthorWorksSyncDependencies.idAutorSupabaseValido;",
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

test("rejeita dados insuficientes sem consultar o Supabase", async () => {
  const moduloId = await carregarModulo({ idValido: false });
  assert.deepEqual(
    await moduloId.sincronizarNomeAutorObrasSupabase("usuario-1", "Autor"),
    { ok: false, erro: "Dados insuficientes para sincronizar obras." },
  );
  assert.deepEqual(moduloId.chamadas, []);

  const moduloNome = await carregarModulo();
  assert.deepEqual(
    await moduloNome.sincronizarNomeAutorObrasSupabase("usuario-1", "   "),
    { ok: false, erro: "Dados insuficientes para sincronizar obras." },
  );
  assert.deepEqual(moduloNome.chamadas, []);
});

test("preserva trim, payload e filtro por user_id", async () => {
  const modulo = await carregarModulo();

  assert.deepEqual(
    await modulo.sincronizarNomeAutorObrasSupabase(
      " usuario-1 ",
      "  Novo Autor  ",
    ),
    { ok: true, erro: "" },
  );

  assert.equal(modulo.chamadas[0][0], "from");
  assert.equal(modulo.chamadas[0][1], "obras");

  const payload = modulo.chamadas[1][1];
  assert.equal(payload.autor, "Novo Autor");
  assert.equal(typeof payload.atualizado_em, "string");
  assert.equal(Number.isNaN(Date.parse(payload.atualizado_em)), false);

  assert.deepEqual(modulo.chamadas[2], ["eq", "user_id", "usuario-1"]);
});

test("preserva erro retornado pelo Supabase e exceção inesperada", async () => {
  const moduloErro = await carregarModulo({
    resposta: { error: new Error("update bloqueado") },
  });
  assert.deepEqual(
    await moduloErro.sincronizarNomeAutorObrasSupabase("usuario-2", "Autor"),
    { ok: false, erro: "update bloqueado" },
  );

  const moduloExcecao = await carregarModulo({ falharFrom: true });
  assert.deepEqual(
    await moduloExcecao.sincronizarNomeAutorObrasSupabase(
      "usuario-3",
      "Autor",
    ),
    { ok: false, erro: "Supabase indisponível" },
  );
});

test("Perfil de Autor delega a sincronização do nome das obras", () => {
  assert.match(
    pagina,
    /import \{ sincronizarNomeAutorObrasSupabase \} from "\.\/lib\/profile-author-works-sync";/,
  );
  assert.doesNotMatch(
    pagina,
    /async function sincronizarNomeAutorObrasSupabase\(/,
  );
  assert.match(
    source,
    /export async function sincronizarNomeAutorObrasSupabase\(/,
  );
  assert.match(source, /\.from\("obras"\)/);
  assert.match(source, /\.eq\("user_id", userIdLimpo\)/);
  assert.doesNotMatch(source, /useState|useEffect|localStorage/);
});
