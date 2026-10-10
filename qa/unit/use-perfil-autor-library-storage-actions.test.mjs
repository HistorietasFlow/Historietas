import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL(
    "../../app/perfil-autor/hooks/use-perfil-autor-library-storage-actions.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/perfil-autor/page.tsx", import.meta.url),
  "utf8",
);
let indiceModulo = 0;

async function carregarModulo({ falharStorage = false } = {}) {
  const chamadas = [];
  globalThis.__profileLibraryStorageDependencies = {
    storageKey: "historietas-obras",
    salvarJsonUsuarioPerfilAutor(chave, userId, valor) {
      chamadas.push(["salvar", chave, userId, valor]);
      if (falharStorage) {
        throw new Error("localStorage indisponível");
      }
    },
  };

  const javascript = typescript.transpileModule(
    source
      .replace(
        'import { STORAGE_KEY } from "../constants";',
        "const STORAGE_KEY = globalThis.__profileLibraryStorageDependencies.storageKey;",
      )
      .replace('import type { ObraLocal } from "../types";\n', "")
      .replace(
        'import { salvarJsonUsuarioPerfilAutor } from "../lib/profile-local-storage-utils";',
        "const salvarJsonUsuarioPerfilAutor = globalThis.__profileLibraryStorageDependencies.salvarJsonUsuarioPerfilAutor;",
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

test("atualiza o estado antes de persistir a Biblioteca", async () => {
  const modulo = await carregarModulo();
  const ordem = [];
  const obras = [{ id: "obra-1" }];

  globalThis.__profileLibraryStorageDependencies.salvarJsonUsuarioPerfilAutor =
    (chave, userId, valor) => {
      ordem.push(["salvar", chave, userId, valor]);
      modulo.chamadas.push(["salvar", chave, userId, valor]);
    };

  const { salvarObrasBibliotecaPerfil } =
    modulo.usePerfilAutorLibraryStorageActions({
      usuarioIdLogado: "usuario-1",
      setObras(valor) {
        ordem.push(["setObras", valor]);
      },
    });

  salvarObrasBibliotecaPerfil(obras);

  assert.deepEqual(ordem, [
    ["setObras", obras],
    ["salvar", "historietas-obras", "usuario-1", obras],
  ]);
});

test("mantém o estado em memória quando a persistência local falha", async () => {
  const modulo = await carregarModulo({ falharStorage: true });
  const estados = [];
  const obras = [{ id: "obra-2" }];

  const { salvarObrasBibliotecaPerfil } =
    modulo.usePerfilAutorLibraryStorageActions({
      usuarioIdLogado: "usuario-2",
      setObras(valor) {
        estados.push(valor);
      },
    });

  assert.doesNotThrow(() => salvarObrasBibliotecaPerfil(obras));
  assert.deepEqual(estados, [obras]);
  assert.deepEqual(modulo.chamadas, [
    ["salvar", "historietas-obras", "usuario-2", obras],
  ]);
});

test("Perfil de Autor delega a persistência das obras da Biblioteca", () => {
  assert.match(
    pagina,
    /import \{ usePerfilAutorLibraryStorageActions \} from "\.\/hooks\/use-perfil-autor-library-storage-actions";/,
  );
  assert.match(
    pagina,
    /const \{ salvarObrasBibliotecaPerfil \} =[\s\S]*?usePerfilAutorLibraryStorageActions\(\{[\s\S]*?usuarioIdLogado,[\s\S]*?setObras,[\s\S]*?\}\);/,
  );
  assert.doesNotMatch(pagina, /function salvarObrasBibliotecaPerfil\(/);
  assert.match(source, /setObras\(novasObras\)/);
  assert.match(
    source,
    /salvarJsonUsuarioPerfilAutor\([\s\S]*?STORAGE_KEY,[\s\S]*?usuarioIdLogado,[\s\S]*?novasObras/,
  );
  assert.doesNotMatch(source, /supabase|useEffect/);
});
