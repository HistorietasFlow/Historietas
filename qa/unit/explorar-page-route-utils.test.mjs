import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const modulePath = path.join(root, "app/explorar/lib/explorar-page-route-utils.ts");
const pagePath = path.join(root, "app/explorar/page.tsx");

async function carregarAtualizarUrlExplorar() {
  const source = await readFile(modulePath, "utf8");
  const executable = source
    .replace(
      'import type { ModoConteudoExplorar } from "../components/explorar-section-components";\n\n',
      "",
    )
    .replace("export function atualizarUrlExplorar", "function atualizarUrlExplorar")
    .replace(/: string/g, "")
    .replace(/: ModoConteudoExplorar/g, "");

  return new Function(
    `${executable}\nreturn atualizarUrlExplorar;`,
  )();
}

function capturarUrl(atualizarUrlExplorar, categoria, modo) {
  const windowAnterior = globalThis.window;
  let args = null;

  try {
    globalThis.window = {
      history: {
        pushState(...novosArgs) {
          args = novosArgs;
        },
      },
    };
    atualizarUrlExplorar(categoria, modo);
    return args;
  } finally {
    globalThis.window = windowAnterior;
  }
}

test("atualiza a URL de obras e autores preservando parâmetros e histórico", async () => {
  const atualizarUrlExplorar = await carregarAtualizarUrlExplorar();

  assert.deepEqual(capturarUrl(atualizarUrlExplorar, "", "obras"), [null, "", "/explorar"]);
  assert.deepEqual(capturarUrl(atualizarUrlExplorar, "", "autores"), [null, "", "/explorar?tipo=autores"]);

  const obrasComCategoria = capturarUrl(
    atualizarUrlExplorar,
    " Fantasia ",
    "obras",
  );
  assert.equal(obrasComCategoria[2], "/explorar?categoria=Fantasia");

  const autoresComCategoria = capturarUrl(
    atualizarUrlExplorar,
    "Fantasia",
    "autores",
  );
  const parametros = new URL(autoresComCategoria[2], "https://historietas.local").searchParams;
  assert.equal(parametros.get("tipo"), "autores");
  assert.equal(parametros.get("categoria"), "Fantasia");
});

test("a página usa o helper nos dois call sites sem router", async () => {
  const [source, page] = await Promise.all([
    readFile(modulePath, "utf8"),
    readFile(pagePath, "utf8"),
  ]);

  assert.match(source, /new URLSearchParams\(\)/);
  assert.match(source, /modo === "autores"/);
  assert.match(source, /categoria\.trim\(\)/);
  assert.match(source, /window\.history\.pushState\(null, "",/);
  assert.doesNotMatch(source, /router/);
  assert.match(page, /import \{ atualizarUrlExplorar \} from "\.\/lib\/explorar-page-route-utils";/);
  assert.doesNotMatch(page, /function atualizarUrl\(/);
  assert.match(page, /atualizarUrlExplorar\("", modo\);/);
  assert.match(page, /atualizarUrlExplorar\(categoria, modoConteudo\);/);
});
