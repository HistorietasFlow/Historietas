import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL(
    "../../app/admin/exclusoes-conta/lib/admin-exclusoes-conta-route-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/admin/exclusoes-conta/page.tsx", import.meta.url),
  "utf8",
);
const hookSource = readFileSync(
  new URL(
    "../../app/admin/exclusoes-conta/hooks/use-admin-exclusoes-conta-initial-data.ts",
    import.meta.url,
  ),
  "utf8",
);

const javascript = typescript.transpileModule(source, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const { criarLoginHrefAdminExclusoesConta } = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`,
);

function executarComWindow(location, callback) {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "window");

  try {
    if (location) {
      Object.defineProperty(globalThis, "window", {
        configurable: true,
        value: { location },
      });
    } else {
      delete globalThis.window;
    }

    return callback();
  } finally {
    if (descriptor) {
      Object.defineProperty(globalThis, "window", descriptor);
    } else {
      delete globalThis.window;
    }
  }
}

test("rota de login preserva o fallback SSR e pathname simples", () => {
  assert.equal(
    executarComWindow(null, criarLoginHrefAdminExclusoesConta),
    "/login?redirectTo=%2Fadmin%2Fexclusoes-conta",
  );
  assert.equal(
    executarComWindow(
      { pathname: "/admin/exclusoes-conta", search: "" },
      criarLoginHrefAdminExclusoesConta,
    ),
    "/login?redirectTo=%2Fadmin%2Fexclusoes-conta",
  );
});

test("rota de login preserva pathname, query e serialização por URLSearchParams", () => {
  assert.equal(
    executarComWindow(
      { pathname: "/admin/exclusoes-conta", search: "?pagina=2&filtro=pendente" },
      criarLoginHrefAdminExclusoesConta,
    ),
    "/login?redirectTo=%2Fadmin%2Fexclusoes-conta%3Fpagina%3D2%26filtro%3Dpendente",
  );
  assert.equal(
    executarComWindow(
      { pathname: "/admin/a b", search: "?nome=Jhona &" },
      criarLoginHrefAdminExclusoesConta,
    ),
    "/login?redirectTo=%2Fadmin%2Fa+b%3Fnome%3DJhona+%26",
  );
});

test("rota de login aceita destino iniciado por / e bloqueia //", () => {
  assert.equal(
    executarComWindow(
      { pathname: "/destino", search: "?origem=admin" },
      criarLoginHrefAdminExclusoesConta,
    ),
    "/login?redirectTo=%2Fdestino%3Forigem%3Dadmin",
  );
  assert.equal(
    executarComWindow(
      { pathname: "//destino-inseguro", search: "?origem=admin" },
      criarLoginHrefAdminExclusoesConta,
    ),
    "/login?redirectTo=%2Fadmin%2Fexclusoes-conta",
  );
});

test("Admin Exclusões de Conta delega somente a rota de login", () => {
  assert.match(
    pageSource,
    /import \{ criarLoginHrefAdminExclusoesConta \} from "\.\/lib\/admin-exclusoes-conta-route-utils";/,
  );
  assert.doesNotMatch(pageSource, /function criarLoginHref\(/);
  assert.equal(
    [pageSource, hookSource]
      .map(
        (sourceToCheck) =>
          (
            sourceToCheck.match(
              /router\.replace\(criarLoginHrefAdminExclusoesConta\(\)\);/g,
            ) || []
          ).length,
      )
      .reduce((total, quantidade) => total + quantidade, 0),
    4,
  );
  assert.match(source, /window\.location\.pathname/);
  assert.match(source, /window\.location\.search/);
  assert.match(source, /new URLSearchParams\(\{ redirectTo: destino \}\)/);
  assert.match(source, /redirectTo\.startsWith\("\/"\)/);
  assert.match(source, /!redirectTo\.startsWith\("\/\/"\)/);
  assert.doesNotMatch(
    source,
    /useState|useEffect|useMemo|useCallback|fetch\(|supabase|router|localStorage|sessionStorage|<(?:[A-Z][A-Za-z0-9]*|[a-z][a-z0-9-]*)(?:\s|\/?>)/i,
  );
});
