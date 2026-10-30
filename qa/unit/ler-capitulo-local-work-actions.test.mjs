import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const ler = (path) =>
  readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const fonte = ler("../../app/ler-capitulo/lib/ler-capitulo-local-work-actions.ts");
const pagina = ler("../../app/ler-capitulo/page.tsx");
const js = typescript.transpileModule(fonte, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const executavel = js
  .replace(
    /import \{\s*salvarObrasPreservandoContas,\s*\} from "\.\/ler-capitulo-local-storage";/,
    "const salvarObrasPreservandoContas = (...args) => globalThis.__lerCapituloLocalWork.salvar(...args);",
  )
  .replace(
    /import \{\s*atualizarCapituloNasObrasLeitor,\s*normalizarObrasLeitor,?\s*\} from "\.\/ler-capitulo-local-work-mutations";/,
    "const atualizarCapituloNasObrasLeitor = (...args) => globalThis.__lerCapituloLocalWork.atualizar(...args); const normalizarObrasLeitor = (...args) => globalThis.__lerCapituloLocalWork.normalizar(...args);",
  );
const { criarAcoesObraLocalLeitor } = await import(
  `data:text/javascript;base64,${Buffer.from(executavel).toString("base64")}`,
);

function cenario({ obraAtual = { id: "obra" }, capituloAtual = { id: "capitulo" } } = {}) {
  const eventos = [];
  globalThis.__lerCapituloLocalWork = {
    normalizar(obras) {
      eventos.push(["normalizar", obras]);
      return [{ id: "normalizada" }];
    },
    salvar(obras, usuario) {
      eventos.push(["persistir", obras, usuario]);
    },
    atualizar(args) {
      eventos.push(["atualizar", args]);
      return [{ id: "atualizada" }];
    },
  };
  const acoes = criarAcoesObraLocalLeitor({
    obras: [{ id: "original" }],
    obraAtual,
    capituloAtual,
    usuarioIdLogado: "usuario",
    setObras(obras) {
      eventos.push(["estado", obras]);
    },
  });

  return { acoes, eventos };
}

test("wrapper local preserva fronteira e injeção nas factories", () => {
  assert.match(fonte, /normalizarObrasLeitor\(/);
  assert.match(fonte, /salvarObrasPreservandoContas\(/);
  assert.match(fonte, /atualizarCapituloNasObrasLeitor\(/);
  assert.match(pagina, /from "\.\/lib\/ler-capitulo-local-work-actions";/);
  assert.match(pagina, /criarAcoesObraLocalLeitor\(\{[\s\S]*?obras,[\s\S]*?setObras,/);
  assert.match(pagina, /criarAcoesInteracoesCapitulo\(\{[\s\S]*?atualizarCapitulo,/);
  assert.match(pagina, /criarAcaoProgressoLeituraCapitulo\(\{[\s\S]*?salvarObras,/);
  assert.match(pagina, /criarAcoesComentariosCapitulo\(\{[\s\S]*?atualizarCapitulo,/);
  assert.doesNotMatch(pagina, /function salvarObras\(/);
  assert.doesNotMatch(pagina, /function atualizarCapitulo\(/);
  assert.doesNotMatch(fonte, /\b(?:react|supabase|useState|useEffect|localStorage)\b/i);
});

test("salvarObras normaliza, persiste por usuário e só então atualiza o estado", () => {
  const atual = cenario();
  const origem = [{ id: "origem" }];
  atual.acoes.salvarObras(origem);
  assert.deepEqual(atual.eventos, [
    ["normalizar", origem],
    ["persistir", [{ id: "normalizada" }], "usuario"],
    ["estado", [{ id: "normalizada" }]],
  ]);
});

test("atualizarCapitulo mantém guardas, IDs, dados e delega o resultado a salvarObras", () => {
  for (const opcoes of [{ obraAtual: null }, { capituloAtual: null }]) {
    const atual = cenario(opcoes);
    atual.acoes.atualizarCapitulo({ lido: true });
    assert.deepEqual(atual.eventos, []);
  }

  const atual = cenario();
  atual.acoes.atualizarCapitulo({ lido: true });
  assert.deepEqual(atual.eventos, [
    ["atualizar", {
      obras: [{ id: "original" }],
      obraAtualId: "obra",
      capituloAtualId: "capitulo",
      dados: { lido: true },
    }],
    ["normalizar", [{ id: "atualizada" }]],
    ["persistir", [{ id: "normalizada" }], "usuario"],
    ["estado", [{ id: "normalizada" }]],
  ]);
});
