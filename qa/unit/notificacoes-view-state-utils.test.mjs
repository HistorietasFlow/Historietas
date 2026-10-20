import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const viewState = readFileSync(
  new URL(
    "../../app/notificacoes/lib/notificacoes-view-state-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/notificacoes/page.tsx", import.meta.url),
  "utf8",
);
const hook = readFileSync(
  new URL(
    "../../app/notificacoes/hooks/use-notificacoes-page-view-state.ts",
    import.meta.url,
  ),
  "utf8",
);
const executavel = viewState.replace(
  /import type \{[\s\S]*?\} from "\.\/notificacoes-models";\n/,
  "",
);
const javascript = typescript.transpileModule(executavel, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const {
  calcularTotalNotificacoesLidas,
  contarNotificacoesNaoLidas,
  criarObrasPorIdNotificacoes,
  encontrarCapituloNotificacao,
  encontrarObraNotificacao,
  obterNotificacaoMenuAberta,
} = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`,
);

function criarObra(id, capitulos = []) {
  return { id, capitulos };
}

test("indice de obras e buscas preservam fallbacks de obra e capitulo", () => {
  const obra = criarObra("obra-1", [{ id: "capitulo-1", titulo: "Capítulo" }]);
  const obrasPorId = criarObrasPorIdNotificacoes([obra]);

  assert.equal(encontrarObraNotificacao(obrasPorId, obra.id), obra);
  assert.equal(encontrarObraNotificacao(obrasPorId, "ausente"), null);
  assert.equal(
    encontrarCapituloNotificacao(obrasPorId, obra.id, "capitulo-1"),
    obra.capitulos[0],
  );
  assert.equal(
    encontrarCapituloNotificacao(obrasPorId, obra.id, "ausente"),
    null,
  );
  assert.equal(
    encontrarCapituloNotificacao(obrasPorId, "ausente", "capitulo-1"),
    null,
  );
});

test("contagens e menu preservam totais e notificacao aberta", () => {
  const notificacoes = [
    { id: "lida", lida: true },
    { id: "nova", lida: false },
    { id: "nova-2", lida: false },
  ];

  assert.equal(contarNotificacoesNaoLidas(notificacoes), 2);
  assert.equal(calcularTotalNotificacoesLidas(3, 2), 1);
  assert.equal(calcularTotalNotificacoesLidas(0, 2), 0);
  assert.equal(obterNotificacaoMenuAberta("nova", notificacoes), notificacoes[1]);
  assert.equal(obterNotificacaoMenuAberta("ausente", notificacoes), null);
  assert.equal(obterNotificacaoMenuAberta("", notificacoes), null);
});

test("hook de estado visual delega consultas puras e preserva os memos", () => {
  assert.match(
    hook,
    /from "\.\.\/lib\/notificacoes-view-state-utils";/,
  );
  assert.match(
    hook,
    /const obrasPorId = useMemo\(\(\) => \{\s*return criarObrasPorIdNotificacoes\(obras\);\s*\}, \[obras\]\);/,
  );
  assert.match(
    hook,
    /const totalNaoLidas = useMemo\(\(\) => \{\s*return contarNotificacoesNaoLidas\(notificacoes\);\s*\}, \[notificacoes\]\);/,
  );
  assert.match(hook, /return encontrarObraNotificacao\(obrasPorId, obraId\);/);
  assert.match(
    hook,
    /return encontrarCapituloNotificacao\(obrasPorId, obraId, capituloId\);/,
  );
  assert.match(hook, /obterNotificacaoMenuAberta\(/);
  assert.match(
    pagina,
    /from "\.\/hooks\/use-notificacoes-page-view-state";/,
  );
});

test("modulo de estado visual nao adiciona React, Supabase ou storage", () => {
  assert.doesNotMatch(viewState, /React|use[A-Z]|supabase|localStorage|window|document/);
});
