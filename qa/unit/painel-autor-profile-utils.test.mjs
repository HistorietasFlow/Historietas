import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const utilsSource = readFileSync(
  new URL(
    "../../app/painel-autor/lib/painel-autor-profile-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/painel-autor/page.tsx", import.meta.url),
  "utf8",
);
const dataLoaderSource = readFileSync(
  new URL(
    "../../app/painel-autor/lib/painel-autor-supabase-data-loader.ts",
    import.meta.url,
  ),
  "utf8",
);
const profileLoaderSource = readFileSync(
  new URL(
    "../../app/painel-autor/lib/painel-autor-profile-loader.ts",
    import.meta.url,
  ),
  "utf8",
);
const resultMergeSource = readFileSync(new URL("../../app/painel-autor/lib/painel-autor-supabase-result-merge.ts", import.meta.url), "utf8");
const utilsJavascript = typescript
  .transpileModule(utilsSource, {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  })
  .outputText.replace(
    'import { obraPertenceAoUsuarioPainel } from "./painel-autor-ownership-utils";',
    'const obraPertenceAoUsuarioPainel = (obra, userId) => Boolean(userId.trim() && obra.autorId?.trim().toLowerCase() === userId.trim().toLowerCase());',
  );
const { obterNomeProfilePainelAutor, aplicarNomeProfileNasObrasPainel } = await import(
  `data:text/javascript;base64,${Buffer.from(utilsJavascript).toString("base64")}`,
);

const profileLoaderState = {
  chamadas: [],
  respostas: [],
  deveFalhar: false,
};
globalThis.__painelAutorProfileSupabase = {
  from(tabela) {
    return {
      select(campos) {
        return {
          eq(campo, valor) {
            return {
              limit(limite) {
                return {
                  async maybeSingle() {
                    profileLoaderState.chamadas.push({
                      tabela,
                      campos,
                      campo,
                      valor,
                      limite,
                    });
                    if (profileLoaderState.deveFalhar) {
                      throw new Error("falha de rede");
                    }
                    return profileLoaderState.respostas.shift() || {
                      data: null,
                      error: null,
                    };
                  },
                };
              },
            };
          },
        };
      },
    };
  },
};
const profileLoaderJavascript = typescript
  .transpileModule(
    profileLoaderSource.replace(
      'import { supabase } from "../../../lib/supabase/client";',
      "const supabase = globalThis.__painelAutorProfileSupabase;",
    ),
    {
      compilerOptions: {
        module: typescript.ModuleKind.ESNext,
        target: typescript.ScriptTarget.ES2022,
      },
    },
  )
  .outputText;
const { carregarProfilePainelAutor } = await import(
  `data:text/javascript;base64,${Buffer.from(profileLoaderJavascript).toString("base64")}`,
);

function prepararProfileLoader({ respostas = [], deveFalhar = false } = {}) {
  profileLoaderState.chamadas.length = 0;
  profileLoaderState.respostas = [...respostas];
  profileLoaderState.deveFalhar = deveFalhar;
}

test("obterNomeProfilePainelAutor preserva validação e trim", () => {
  assert.equal(obterNomeProfilePainelAutor({ nome: "  Autora  " }), "Autora");
  assert.equal(obterNomeProfilePainelAutor({ nome: "   " }), "");
  assert.equal(obterNomeProfilePainelAutor({ nome: 12 }), "");
  assert.equal(obterNomeProfilePainelAutor(null), "");
});

test("aplicarNomeProfileNasObrasPainel preserva identidade, ordem e fallback de autor", () => {
  const propriaComAutor = { id: "1", autor: "Antigo", autorId: " user-1 " };
  const propriaSemAutor = { id: "2", autor: "Antigo", autorId: "" };
  const outra = { id: "3", autor: "Outra", autorId: "user-2" };
  const obras = [propriaComAutor, propriaSemAutor, outra];

  const atualizadas = aplicarNomeProfileNasObrasPainel(
    obras,
    "user-1",
    "  Novo nome  ",
  );

  assert.deepEqual(atualizadas, [
    { id: "1", autor: "Novo nome", autorId: " user-1 " },
    propriaSemAutor,
    outra,
  ]);
  assert.notStrictEqual(atualizadas[0], propriaComAutor);
  assert.strictEqual(atualizadas[1], propriaSemAutor);
  assert.strictEqual(atualizadas[2], outra);
});

test("aplicarNomeProfileNasObrasPainel devolve a lista original quando o nome é vazio", () => {
  const obras = [{ id: "1", autor: "Autora", autorId: "user-1" }];
  assert.strictEqual(aplicarNomeProfileNasObrasPainel(obras, "user-1", "  "), obras);
});

test("carregarProfilePainelAutor consulta primeiro user_id e retorna o profile encontrado", async () => {
  const profile = { id: "perfil-1", user_id: "usuario-1", nome: "Ana" };
  prepararProfileLoader({ respostas: [{ data: profile, error: null }] });

  assert.strictEqual(await carregarProfilePainelAutor(" usuario-1 "), profile);
  assert.deepEqual(profileLoaderState.chamadas, [
    {
      tabela: "profiles_publicos",
      campos: "id, user_id, nome, avatar_url, bio, sobre_bio",
      campo: "user_id",
      valor: "usuario-1",
      limite: 1,
    },
  ]);
});

test("carregarProfilePainelAutor usa o fallback por id e mantém falhas silenciosas", async () => {
  const profile = { id: "perfil-2", user_id: "usuario-2", nome: "Beto" };
  prepararProfileLoader({
    respostas: [
      { data: null, error: { message: "indisponível" } },
      { data: profile, error: null },
    ],
  });

  assert.strictEqual(await carregarProfilePainelAutor("usuario-2"), profile);
  assert.deepEqual(
    profileLoaderState.chamadas.map(({ campo, valor, limite }) => ({
      campo,
      valor,
      limite,
    })),
    [
      { campo: "user_id", valor: "usuario-2", limite: 1 },
      { campo: "id", valor: "usuario-2", limite: 1 },
    ],
  );

  prepararProfileLoader({ deveFalhar: true });
  assert.equal(await carregarProfilePainelAutor("usuario-3"), null);
  assert.equal(profileLoaderState.chamadas.length, 1);

  prepararProfileLoader({
    respostas: [
      { data: null, error: null },
      { data: null, error: null },
    ],
  });
  assert.equal(await carregarProfilePainelAutor("usuario-4"), null);
  assert.equal(profileLoaderState.chamadas.length, 2);

  prepararProfileLoader();
  assert.equal(await carregarProfilePainelAutor("  "), null);
  assert.deepEqual(profileLoaderState.chamadas, []);
});

test("Painel do Autor delega somente os helpers de perfil ao módulo extraído", () => {
  const initialDataHook = readFileSync(
    new URL("../../app/painel-autor/hooks/use-painel-autor-initial-data.ts", import.meta.url),
    "utf8",
  );
  assert.match(
    initialDataHook,
    /import \{\s*aplicarNomeProfileNasObrasPainel,\s*obterNomeProfilePainelAutor,\s*\} from "\.\.\/lib\/painel-autor-profile-utils";/,
  );
  assert.doesNotMatch(pagina, /function obterNomeProfilePainelAutor\(/);
  assert.doesNotMatch(pagina, /function aplicarNomeProfileNasObrasPainel\(/);
  assert.equal((initialDataHook.match(/\bobterNomeProfilePainelAutor\b/g) || []).length, 2);
  assert.equal((initialDataHook.match(/\baplicarNomeProfileNasObrasPainel\b/g) || []).length, 2);
  assert.equal((dataLoaderSource.match(/\bobterNomeProfilePainelAutor\b/g) || []).length, 2);
  assert.equal((dataLoaderSource.match(/\baplicarNomeProfileNasObrasPainel\b/g) || []).length, 2);
  assert.match(resultMergeSource, /import \{ aplicarNomeProfileNasObrasPainel \} from "\.\/painel-autor-profile-utils";/);
  assert.match(resultMergeSource, /aplicarNomeProfileNasObrasPainel\(/);
  assert.match(
    initialDataHook,
    /import \{ carregarProfilePainelAutor \} from "\.\.\/lib\/painel-autor-profile-loader";/,
  );
  assert.doesNotMatch(pagina, /async function carregarProfilePainelAutor\(/);
  assert.equal((initialDataHook.match(/\bcarregarProfilePainelAutor\b/g) || []).length, 2);
  assert.equal((dataLoaderSource.match(/\bcarregarProfilePainelAutor\b/g) || []).length, 2);
  assert.match(
    profileLoaderSource,
    /export async function carregarProfilePainelAutor\(userId: string\)/,
  );
  assert.match(profileLoaderSource, /\.from\("profiles_publicos"\)/);
  assert.match(
    profileLoaderSource,
    /"id, user_id, nome, avatar_url, bio, sobre_bio"/,
  );
  assert.match(profileLoaderSource, /\.eq\("user_id", userIdLimpo\)/);
  assert.match(profileLoaderSource, /\.eq\("id", userIdLimpo\)/);
  assert.match(profileLoaderSource, /\.limit\(1\)/);
  assert.match(profileLoaderSource, /\.maybeSingle\(\)/);
  assert.match(
    profileLoaderSource,
    /O perfil público é uma camada social\. O painel continua com os dados da obra\./,
  );
  assert.doesNotMatch(profileLoaderSource, /useState|useEffect|localStorage|window|document/);
  assert.match(
    utilsSource,
    /import \{ obraPertenceAoUsuarioPainel \} from "\.\/painel-autor-ownership-utils";/,
  );
  assert.doesNotMatch(utilsSource, /supabase|localStorage|useState|useEffect/);
});
