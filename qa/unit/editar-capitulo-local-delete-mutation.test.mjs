import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const mutationSource = readFileSync(
  new URL(
    "../../app/editar-capitulo/lib/editar-capitulo-local-delete-mutation.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/editar-capitulo/page.tsx", import.meta.url),
  "utf8",
);
const deleteActionSource = readFileSync(
  new URL(
    "../../app/editar-capitulo/hooks/useEditarCapituloDeleteAction.ts",
    import.meta.url,
  ),
  "utf8",
);

const normalizacoes = [];
const progressos = [];
globalThis.__editarCapituloNormalizarObraParaExcluir = (obra, index) => {
  normalizacoes.push([obra, index]);

  return {
    ...obra,
    id: obra.id || `obra-${index + 1}`,
    ultimoCapituloLidoId: obra.ultimoCapituloLidoId || "",
    totalCurtidas: obra.totalCurtidas || 0,
    totalComentarios: obra.totalComentarios || 0,
    totalSalvos: obra.totalSalvos || 0,
    totalLidos: obra.totalLidos || 0,
    capitulos: obra.capitulos.map((capitulo) => ({ ...capitulo })),
  };
};
globalThis.__editarCapituloCalcularProgressoParaExcluir = (capitulos) => {
  progressos.push(capitulos);
  return 42;
};

const mutationJavascript = typescript.transpileModule(
  mutationSource
    .replace(
      'import { calcularProgressoLeitura } from "./editar-capitulo-metrics-utils";',
      "const calcularProgressoLeitura = globalThis.__editarCapituloCalcularProgressoParaExcluir;",
    )
    .replace(
      'import { normalizarObra } from "./editar-capitulo-work-normalizer";',
      "const normalizarObra = globalThis.__editarCapituloNormalizarObraParaExcluir;",
    ),
  {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  },
).outputText;
const { removerCapituloDasObrasLocais } = await import(
  `data:text/javascript;base64,${Buffer.from(mutationJavascript).toString("base64")}`,
);

function criarObras() {
  return [
    {
      id: "obra-outra",
      titulo: "Outra obra",
      capitulos: [{ id: "capitulo-outra", titulo: "Outro", texto: "Texto" }],
    },
    {
      id: "obra-alvo",
      titulo: "Obra alvo",
      ultimoCapituloLidoId: "capitulo-removido",
      totalCurtidas: 1,
      totalComentarios: 1,
      totalSalvos: 1,
      totalLidos: 1,
      capitulos: [
        {
          id: "capitulo-removido",
          titulo: "Removido",
          texto: "Texto",
          curtiu: true,
          comentario: "Comentário",
          salvo: true,
          lido: true,
          publicado: true,
          criadoEm: "2026-01-01",
        },
        { id: "capitulo-preservado", titulo: "Preservado", texto: "Texto" },
      ],
    },
  ];
}

test("a mutação local normaliza todas as obras, preserva ordem e remove somente o capítulo alvo", () => {
  normalizacoes.length = 0;
  progressos.length = 0;
  const obras = criarObras();

  const novasObras = removerCapituloDasObrasLocais({
    obras,
    obraId: "obra-alvo",
    capituloId: "capitulo-removido",
  });

  assert.deepEqual(normalizacoes.map(([, index]) => index), [0, 1]);
  assert.deepEqual(novasObras.map((obra) => obra.id), ["obra-outra", "obra-alvo"]);
  assert.deepEqual(novasObras[0].capitulos, obras[0].capitulos);
  assert.deepEqual(novasObras[1].capitulos, [obras[1].capitulos[1]]);
  assert.equal(novasObras[1].ultimoCapituloLidoId, "");
  assert.equal(novasObras[1].progressoLeitura, 42);
  assert.equal(progressos[0], novasObras[1].capitulos);
  assert.deepEqual(
    [
      novasObras[1].totalCurtidas,
      novasObras[1].totalComentarios,
      novasObras[1].totalSalvos,
      novasObras[1].totalLidos,
    ],
    [0, 0, 0, 0],
  );
});

test("a mutação local preserva último lido, não reduz comentário vazio e mantém contadores quando o capítulo não existe", () => {
  const obras = criarObras();
  obras[1].ultimoCapituloLidoId = "capitulo-preservado";
  obras[1].capitulos[0].comentario = "   ";
  obras[1].totalComentarios = 0;

  const comComentarioVazio = removerCapituloDasObrasLocais({
    obras,
    obraId: "obra-alvo",
    capituloId: "capitulo-removido",
  });
  assert.equal(comComentarioVazio[1].ultimoCapituloLidoId, "capitulo-preservado");
  assert.equal(comComentarioVazio[1].totalComentarios, 0);

  const capituloInexistente = removerCapituloDasObrasLocais({
    obras: criarObras(),
    obraId: "obra-alvo",
    capituloId: "capitulo-inexistente",
  });
  assert.deepEqual(capituloInexistente[1].capitulos, criarObras()[1].capitulos);
  assert.deepEqual(
    [
      capituloInexistente[1].totalCurtidas,
      capituloInexistente[1].totalComentarios,
      capituloInexistente[1].totalSalvos,
      capituloInexistente[1].totalLidos,
      capituloInexistente[1].progressoLeitura,
    ],
    [1, 1, 1, 1, 42],
  );
});

test("Editar Capítulo delega somente a mutação local determinística da exclusão", () => {
  assert.match(
    mutationSource,
    /import \{ normalizarObra \} from "\.\/editar-capitulo-work-normalizer";/,
  );
  assert.match(
    mutationSource,
    /import \{ calcularProgressoLeitura \} from "\.\/editar-capitulo-metrics-utils";/,
  );
  assert.match(mutationSource, /const novasObras = obras\.map\(\(obra, obraIndex\) =>/);
  assert.match(mutationSource, /\) \|\| null;/);
  assert.match(mutationSource, /capituloRemovido\?\.comentario\.trim\(\)/);
  assert.match(mutationSource, /\(obraNormalizada\.totalCurtidas \|\| 0\)/);
  assert.match(mutationSource, /Math\.max\(\s*0,/);
  assert.doesNotMatch(mutationSource, /supabase|localStorage|useState|useEffect|router|^\s*<[A-Za-z]/m);
  assert.match(
    deleteActionSource,
    /import \{ removerCapituloDasObrasLocais \} from "\.\.\/lib\/editar-capitulo-local-delete-mutation";/,
  );
  const excluirCapituloAtePersistencia = deleteActionSource.slice(
    deleteActionSource.indexOf("async function excluirCapitulo"),
    deleteActionSource.indexOf("const novasObrasDoUsuario =", deleteActionSource.indexOf("async function excluirCapitulo")),
  );
  assert.match(excluirCapituloAtePersistencia, /removerCapituloDasObrasLocais\(\{/);
  assert.doesNotMatch(excluirCapituloAtePersistencia, /const novasObras = obras\.map/);
  const exclusaoAposPersistencia = deleteActionSource.slice(
    deleteActionSource.indexOf("const novasObrasDoUsuario =", deleteActionSource.indexOf("async function excluirCapitulo")),
    deleteActionSource.indexOf("} catch", deleteActionSource.indexOf("async function excluirCapitulo")),
  );
  assert.match(exclusaoAposPersistencia, /salvarObrasEditarCapituloStorage\(\s*novasObras,\s*userId,?\s*\)/);
  assert.match(exclusaoAposPersistencia, /setObras\(novasObrasDoUsuario\)/);
  assert.match(exclusaoAposPersistencia, /router\.replace\("\/painel-autor"\)/);
  assert.match(exclusaoAposPersistencia, /router\.refresh\(\)/);
});
