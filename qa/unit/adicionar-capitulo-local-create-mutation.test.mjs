import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL(
    "../../app/adicionar-capitulo/lib/adicionar-capitulo-local-create-mutation.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/adicionar-capitulo/page.tsx", import.meta.url),
  "utf8",
);
const chamadasOrdenacao = [];
const chamadasProgresso = [];

globalThis.__adicionarCapituloLocalCreate = {
  ordenarCapitulosPorOrdem(capitulos) {
    chamadasOrdenacao.push(capitulos);
    return [...capitulos].sort((a, b) => a.ordem - b.ordem);
  },
  calcularProgressoLeitura(capitulos) {
    chamadasProgresso.push(capitulos);
    return 73;
  },
};

const javascript = typescript.transpileModule(
  source
    .replace(
      'import { calcularProgressoLeitura } from "./adicionar-capitulo-metrics-utils";',
      "const { calcularProgressoLeitura } = globalThis.__adicionarCapituloLocalCreate;",
    )
    .replace(
      'import { ordenarCapitulosPorOrdem } from "./adicionar-capitulo-chapter-order-utils";',
      "const { ordenarCapitulosPorOrdem } = globalThis.__adicionarCapituloLocalCreate;",
    ),
  { compilerOptions: { module: typescript.ModuleKind.ESNext, target: typescript.ScriptTarget.ES2022 } },
).outputText;
const { aplicarNovoCapituloNasObrasLocais } = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`,
);

test("mutação local altera somente a obra alvo sem mutar capítulos anteriores", () => {
  const capituloAnterior = { id: "capitulo-2", criadoEm: "2025", ordem: 2, lido: false };
  const outraObra = { id: "outra", autor: "Outro", capitulos: [], progressoLeitura: 0 };
  const obraAlvo = { id: "alvo", autor: "Autora", capitulos: [capituloAnterior], progressoLeitura: 0 };
  const obras = [outraObra, obraAlvo];
  const novoCapitulo = { id: "capitulo-1", criadoEm: "2026", ordem: 1, lido: true };

  chamadasOrdenacao.length = 0;
  chamadasProgresso.length = 0;
  const resultado = aplicarNovoCapituloNasObrasLocais({
    obras,
    obraId: "alvo",
    novoCapitulo,
    nomeProfileAutor: "Perfil",
    usuarioIdLogado: "usuario-local",
    userId: "usuario-supabase",
  });

  assert.equal(resultado[0], outraObra);
  assert.notEqual(resultado[1], obraAlvo);
  assert.deepEqual(obraAlvo.capitulos, [capituloAnterior]);
  assert.deepEqual(resultado[1].capitulos, [novoCapitulo, capituloAnterior]);
  assert.deepEqual(chamadasOrdenacao, [[capituloAnterior, novoCapitulo]]);
  assert.deepEqual(chamadasProgresso, [[novoCapitulo, capituloAnterior]]);
  assert.equal(resultado[1].autor, "Perfil");
  assert.equal(resultado[1].autorId, "usuario-local");
  assert.equal(resultado[1].progressoLeitura, 73);
});

test("mutação preserva os fallbacks de autor e a prioridade de autorId", () => {
  const capitulo = { id: "capitulo", criadoEm: "2026", ordem: 1 };
  for (const [autorId, usuarioIdLogado, userId, esperado] of [
    ["autor-existente", "local", "supabase", "autor-existente"],
    ["", "local", "supabase", "local"],
    ["", "", "supabase", "supabase"],
  ]) {
    const [resultado] = aplicarNovoCapituloNasObrasLocais({
      obras: [{ id: "alvo", autor: "Autor atual", autorId, capitulos: [] }],
      obraId: "alvo",
      novoCapitulo: capitulo,
      nomeProfileAutor: "",
      usuarioIdLogado,
      userId,
    });
    assert.equal(resultado.autor, "Autor atual");
    assert.equal(resultado.autorId, esperado);
  }
});

test("Adicionar Capítulo delega somente a mutação local de criação", () => {
  assert.match(source, /ordenarCapitulosPorOrdem\(\[\s*\.\.\.obra\.capitulos,\s*novoCapitulo,/);
  assert.match(source, /autor: nomeProfileAutor \|\| obra\.autor/);
  assert.match(source, /autorId: obra\.autorId \|\| usuarioIdLogado \|\| userId/);
  assert.match(source, /progressoLeitura: calcularProgressoLeitura\(capitulosAtualizados\)/);
  assert.doesNotMatch(source, /supabase|localStorage|useState|useEffect|router|^\s*<[A-Za-z]/mi);
  assert.match(pageSource, /import \{ aplicarNovoCapituloNasObrasLocais \} from "\.\/lib\/adicionar-capitulo-local-create-mutation";/);
  assert.doesNotMatch(pageSource, /const novasObras = obras\.map\(/);
  assert.match(pageSource, /const novasObras = aplicarNovoCapituloNasObrasLocais\(/);
  assert.match(pageSource, /salvarObras\(novasObras\);/);
});
