import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL(
    "../../app/perfil-autor/hooks/use-perfil-autor-tab-navigation.ts",
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
  const javascript = typescript.transpileModule(
    source.replace(
      'import type { AbaPerfilAutor } from "../types";\n',
      "",
    ),
    {
      compilerOptions: {
        module: typescript.ModuleKind.ESNext,
        target: typescript.ScriptTarget.ES2022,
      },
    },
  ).outputText;

  return import(
    `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}#${indiceModulo++}`,
  );
}

test("atualiza o estado da aba mesmo fora do navegador", async () => {
  const windowOriginal = globalThis.window;
  const valores = [];

  try {
    delete globalThis.window;
    const { usePerfilAutorTabNavigation } = await carregarModulo();
    const { selecionarAbaPerfil } = usePerfilAutorTabNavigation({
      setAbaPerfil(valor) {
        valores.push(valor);
      },
    });

    selecionarAbaPerfil("diario");
    assert.deepEqual(valores, ["diario"]);
  } finally {
    if (windowOriginal === undefined) {
      delete globalThis.window;
    } else {
      globalThis.window = windowOriginal;
    }
  }
});

test("preserva query existente, atualiza aba e mantém hash", async () => {
  const windowOriginal = globalThis.window;
  const chamadas = [];
  const valores = [];

  try {
    globalThis.window = {
      location: {
        pathname: "/perfil-autor",
        search: "?id=usuario-1&aba=obras",
        hash: "#topo",
      },
      history: {
        state: { origem: "teste" },
        replaceState(...args) {
          chamadas.push(args);
        },
      },
    };

    const { usePerfilAutorTabNavigation } = await carregarModulo();
    const { selecionarAbaPerfil } = usePerfilAutorTabNavigation({
      setAbaPerfil(valor) {
        valores.push(valor);
      },
    });

    selecionarAbaPerfil("biblioteca");

    assert.deepEqual(valores, ["biblioteca"]);
    assert.deepEqual(chamadas, [
      [
        { origem: "teste" },
        "",
        "/perfil-autor?id=usuario-1&aba=biblioteca#topo",
      ],
    ]);
  } finally {
    if (windowOriginal === undefined) {
      delete globalThis.window;
    } else {
      globalThis.window = windowOriginal;
    }
  }
});

test("Perfil de Autor delega a navegação de abas para o hook", () => {
  assert.match(
    pagina,
    /import \{ usePerfilAutorTabNavigation \} from "\.\/hooks\/use-perfil-autor-tab-navigation";/,
  );
  assert.match(
    pagina,
    /const \{ selecionarAbaPerfil \} = usePerfilAutorTabNavigation\(\{[\s\S]*?setAbaPerfil,[\s\S]*?\}\);/,
  );
  assert.doesNotMatch(pagina, /function selecionarAbaPerfil\(/);
  assert.match(source, /function selecionarAbaPerfil\(novaAba: AbaPerfilAutor\)/);
  assert.match(source, /window\.history\.replaceState\(window\.history\.state, "", novaUrl\)/);
  assert.doesNotMatch(source, /supabase|localStorage/);
});
