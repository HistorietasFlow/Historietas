import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const fonte = readFileSync(
  new URL(
    "../../app/ler-capitulo/lib/ler-capitulo-navigation-actions.ts",
    import.meta.url,
  ),
  "utf8",
).replace(/\r\n/g, "\n");
const js = typescript.transpileModule(fonte, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText.replace(
  /import \{\s*criarHrefLeituraCapituloLeitor,?\s*\} from "\.\/ler-capitulo-chapter-route";/,
  "const criarHrefLeituraCapituloLeitor = (...args) => globalThis.__lerCapituloNavigation.href(...args);",
);
const { criarAcaoTrocaCapituloLeitor } = await import(
  `data:text/javascript;base64,${Buffer.from(js).toString("base64")}`,
);

function cenario(obraAtual) {
  const eventos = [];
  globalThis.__lerCapituloNavigation = {
    href(obra, capituloId) {
      eventos.push(["href", obra, capituloId]);
      return `/obra/${obra.id}/${capituloId}`;
    },
  };
  const acao = criarAcaoTrocaCapituloLeitor({
    obraAtual,
    setCapituloId(capituloId) {
      eventos.push(["setter", capituloId]);
    },
  });

  return { acao, eventos };
}

test("ação preserva a fronteira visual sem persistência", () => {
  assert.match(fonte, /export function criarAcaoTrocaCapituloLeitor\(/);
  assert.match(fonte, /if \(!obraAtual\)/);
  assert.match(fonte, /window\.history\.pushState\(/);
  assert.match(fonte, /window\.scrollTo\(/);
  assert.match(fonte, /top: 0,/);
  assert.match(fonte, /behavior: "smooth",/);
  assert.doesNotMatch(fonte, /\b(?:supabase|localStorage|useState|useEffect|router)\b/);
});

test("sem obra não há setter, navegação nem rolagem", () => {
  const anterior = globalThis.window;
  const atual = cenario(null);
  globalThis.window = {
    history: { pushState: () => atual.eventos.push(["push"]) },
    scrollTo: () => atual.eventos.push(["scroll"]),
  };
  try {
    atual.acao.trocarCapitulo("novo");
    assert.deepEqual(atual.eventos, []);
  } finally {
    if (anterior === undefined) delete globalThis.window;
    else globalThis.window = anterior;
  }
});

test("com obra preserva a ordem setter, pushState e scrollTo", () => {
  const anterior = globalThis.window;
  const obra = { id: "obra" };
  const atual = cenario(obra);
  globalThis.window = {
    history: {
      pushState(...args) {
        atual.eventos.push(["push", ...args]);
      },
    },
    scrollTo(args) {
      atual.eventos.push(["scroll", args]);
    },
  };
  try {
    atual.acao.trocarCapitulo("novo");
    assert.deepEqual(atual.eventos, [
      ["setter", "novo"],
      ["href", obra, "novo"],
      ["push", null, "", "/obra/obra/novo"],
      ["scroll", { top: 0, behavior: "smooth" }],
    ]);
  } finally {
    if (anterior === undefined) delete globalThis.window;
    else globalThis.window = anterior;
  }
});
