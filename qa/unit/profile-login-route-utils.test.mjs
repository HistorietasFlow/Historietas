import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL(
    "../../app/perfil-autor/lib/profile-login-route-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/perfil-autor/page.tsx", import.meta.url),
  "utf8",
);
let indiceModulo = 0;

async function carregarModulo() {
  const javascript = typescript.transpileModule(source, {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  }).outputText;

  return import(
    `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}#${indiceModulo++}`
  );
}

test("usa /perfil-autor como fallback fora do navegador", async () => {
  const windowOriginal = globalThis.window;
  try {
    delete globalThis.window;
    const { criarLoginHrefPerfilAutor } = await carregarModulo();
    assert.equal(
      criarLoginHrefPerfilAutor(),
      "/login?redirectTo=%2Fperfil-autor",
    );
  } finally {
    if (windowOriginal === undefined) {
      delete globalThis.window;
    } else {
      globalThis.window = windowOriginal;
    }
  }
});

test("preserva pathname e search atuais no redirectTo", async () => {
  const windowOriginal = globalThis.window;
  try {
    globalThis.window = {
      location: {
        pathname: "/perfil-autor",
        search: "?id=usuario-1&aba=diario",
      },
    };
    const { criarLoginHrefPerfilAutor } = await carregarModulo();
    assert.equal(
      criarLoginHrefPerfilAutor(),
      "/login?redirectTo=%2Fperfil-autor%3Fid%3Dusuario-1%26aba%3Ddiario",
    );
  } finally {
    if (windowOriginal === undefined) {
      delete globalThis.window;
    } else {
      globalThis.window = windowOriginal;
    }
  }
});

test("rejeita destino iniciado por // e mantém fallback seguro", async () => {
  const windowOriginal = globalThis.window;
  try {
    globalThis.window = {
      location: {
        pathname: "//externo.example",
        search: "?x=1",
      },
    };
    const { criarLoginHrefPerfilAutor } = await carregarModulo();
    assert.equal(
      criarLoginHrefPerfilAutor(),
      "/login?redirectTo=%2Fperfil-autor",
    );
  } finally {
    if (windowOriginal === undefined) {
      delete globalThis.window;
    } else {
      globalThis.window = windowOriginal;
    }
  }
});

test("Perfil de Autor delega a rota de login para o helper", () => {
  assert.match(
    pagina,
    /import \{ criarLoginHrefPerfilAutor \} from "\.\/lib\/profile-login-route-utils";/,
  );
  assert.doesNotMatch(pagina, /function criarLoginHrefPerfilAutor\(/);
  assert.match(source, /export function criarLoginHrefPerfilAutor\(/);
  assert.match(source, /!redirectTo\.startsWith\("\/\/"\)/);
  assert.match(source, /new URLSearchParams\(\{/);
  assert.doesNotMatch(source, /supabase|useState|useEffect|localStorage/);
});
