import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const modulePath = path.join(
  root,
  "app/explorar/lib/explorar-login-route-utils.ts",
);
const pagePath = path.join(root, "app/explorar/page.tsx");

async function carregarCriarLoginHrefExplorar() {
  const source = await readFile(modulePath, "utf8");
  return new Function(
    `${source.replace("export function criarLoginHrefExplorar", "function criarLoginHrefExplorar")}\nreturn criarLoginHrefExplorar;`,
  )();
}

test("o helper de login preserva a estrutura de redirect seguro e a página o importa", async () => {
  const [source, page] = await Promise.all([
    readFile(modulePath, "utf8"),
    readFile(pagePath, "utf8"),
  ]);

  assert.match(source, /export function criarLoginHrefExplorar/);
  assert.match(source, /typeof window !== "undefined"/);
  assert.match(source, /window\.location\.pathname/);
  assert.match(source, /window\.location\.search/);
  assert.match(source, /redirectTo\.startsWith\("\/"\)/);
  assert.match(source, /!redirectTo\.startsWith\("\/\/"\)/);
  assert.match(source, /"\/explorar"/);
  assert.match(source, /new URLSearchParams/);
  assert.match(source, /return `\/login\?\$\{params\.toString\(\)\}`;/);
  assert.match(page, /import \{ criarLoginHrefExplorar \} from "\.\/lib\/explorar-login-route-utils";/);
  assert.doesNotMatch(page, /function criarLoginHrefExplorar/);
  assert.match(page, /router\.push\(criarLoginHrefExplorar\(\)\)/);
});

test("preserva pathname e query no parâmetro redirectTo", async () => {
  const criarLoginHrefExplorar = await carregarCriarLoginHrefExplorar();
  const tinhaWindow = Object.prototype.hasOwnProperty.call(globalThis, "window");
  const windowAnterior = globalThis.window;

  try {
    globalThis.window = {
      location: {
        pathname: "/explorar",
        search: "?modo=autores",
      },
    };
    const href = criarLoginHrefExplorar();
    const parametros = new URL(href, "https://historietas.local").searchParams;

    assert.ok(href.startsWith("/login?"));
    assert.equal(parametros.get("redirectTo"), "/explorar?modo=autores");
  } finally {
    if (tinhaWindow) {
      globalThis.window = windowAnterior;
    } else {
      delete globalThis.window;
    }
  }
});

test("usa o fallback SSR /explorar sem window", async () => {
  const criarLoginHrefExplorar = await carregarCriarLoginHrefExplorar();
  const tinhaWindow = Object.prototype.hasOwnProperty.call(globalThis, "window");
  const windowAnterior = globalThis.window;

  try {
    delete globalThis.window;
    const href = criarLoginHrefExplorar();
    const parametros = new URL(href, "https://historietas.local").searchParams;

    assert.equal(parametros.get("redirectTo"), "/explorar");
  } finally {
    if (tinhaWindow) {
      globalThis.window = windowAnterior;
    }
  }
});
