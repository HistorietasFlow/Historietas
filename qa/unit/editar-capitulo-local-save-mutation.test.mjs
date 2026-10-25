import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const mutationSource = readFileSync(
  new URL(
    "../../app/editar-capitulo/lib/editar-capitulo-local-save-mutation.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/editar-capitulo/page.tsx", import.meta.url),
  "utf8",
);

const normalizacoes = [];
const progressos = [];
globalThis.__editarCapituloNormalizarObraParaSalvar = (obra, index) => {
  normalizacoes.push([obra, index]);

  return {
    ...obra,
    id: obra.id || `obra-${index + 1}`,
    autorId: obra.autorId || "",
    capitulos: obra.capitulos.map((capitulo) => ({ ...capitulo })),
  };
};
globalThis.__editarCapituloCalcularProgressoParaSalvar = (capitulos) => {
  progressos.push(capitulos);
  return 73;
};

const mutationJavascript = typescript.transpileModule(
  mutationSource
    .replace(
      'import { calcularProgressoLeitura } from "./editar-capitulo-metrics-utils";',
      "const calcularProgressoLeitura = globalThis.__editarCapituloCalcularProgressoParaSalvar;",
    )
    .replace(
      'import { normalizarObra } from "./editar-capitulo-work-normalizer";',
      "const normalizarObra = globalThis.__editarCapituloNormalizarObraParaSalvar;",
    ),
  {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  },
).outputText;
const { aplicarEdicaoCapituloNasObrasLocais } = await import(
  `data:text/javascript;base64,${Buffer.from(mutationJavascript).toString("base64")}`,
);

function criarObras() {
  return [
    {
      id: "obra-outra",
      autor: "Outra autora",
      autorId: "autora-outra",
      capitulos: [{ id: "capitulo-outro", titulo: "Outro", texto: "Texto", ordem: 1 }],
    },
    {
      id: "obra-alvo",
      autor: "Autora antiga",
      autorId: "autora-existente",
      capitulos: [
        {
          id: "capitulo-alvo",
          titulo: "Título anterior",
          texto: "Texto anterior",
          ordem: 1,
          publicado: true,
          curtiu: true,
          salvo: true,
          comentario: "Comentário",
          criadoEm: "2026-01-01",
          lido: true,
          lidoEm: "2026-01-02",
        },
        { id: "capitulo-preservado", titulo: "Preservado", texto: "Texto", ordem: 2 },
      ],
    },
  ];
}

test("a mutação local normaliza todas as obras e altera somente o capítulo alvo", () => {
  normalizacoes.length = 0;
  progressos.length = 0;
  const obras = criarObras();

  const { novasObras, obraAtualizadaParaAcoes } =
    aplicarEdicaoCapituloNasObrasLocais({
      obras,
      obraId: "obra-alvo",
      capituloId: "capitulo-alvo",
      tituloFinal: "Título final",
      textoFinal: "Texto final",
      numeroCapituloFinal: 9,
      autorFinalObra: "Autora final",
      userId: "usuario-1",
    });

  assert.deepEqual(normalizacoes.map(([, index]) => index), [0, 1]);
  assert.deepEqual(novasObras.map((obra) => obra.id), ["obra-outra", "obra-alvo"]);
  assert.deepEqual(novasObras[0].capitulos, obras[0].capitulos);
  assert.equal(novasObras[1].autor, "Autora final");
  assert.equal(novasObras[1].autorId, "autora-existente");
  assert.deepEqual(novasObras[1].capitulos[0], {
    ...obras[1].capitulos[0],
    titulo: "Título final",
    texto: "Texto final",
    ordem: 9,
  });
  assert.deepEqual(novasObras[1].capitulos[1], obras[1].capitulos[1]);
  assert.equal(novasObras[1].progressoLeitura, 73);
  assert.equal(progressos.length, 1);
  assert.equal(progressos[0], novasObras[1].capitulos);
  assert.equal(obraAtualizadaParaAcoes, novasObras[1]);
});

test("a mutação local usa userId somente como fallback de autorId e mantém null sem obra alvo", () => {
  const obrasSemAutor = criarObras();
  obrasSemAutor[1].autorId = "";

  const comFallback = aplicarEdicaoCapituloNasObrasLocais({
    obras: obrasSemAutor,
    obraId: "obra-alvo",
    capituloId: "capitulo-alvo",
    tituloFinal: "Título",
    textoFinal: "Texto",
    numeroCapituloFinal: 2,
    autorFinalObra: "Autora",
    userId: "usuario-fallback",
  });
  assert.equal(comFallback.novasObras[1].autorId, "usuario-fallback");

  const semAlvo = aplicarEdicaoCapituloNasObrasLocais({
    obras: criarObras(),
    obraId: "obra-inexistente",
    capituloId: "capitulo-alvo",
    tituloFinal: "Título",
    textoFinal: "Texto",
    numeroCapituloFinal: 2,
    autorFinalObra: "Autora",
    userId: "usuario-fallback",
  });
  assert.equal(semAlvo.obraAtualizadaParaAcoes, null);
  assert.match(mutationSource, /autorId: obraNormalizada\.autorId \|\| userId/);
});

test("Editar Capítulo delega somente a mutação local determinística do salvamento", () => {
  assert.match(
    mutationSource,
    /import \{ normalizarObra \} from "\.\/editar-capitulo-work-normalizer";/,
  );
  assert.match(
    mutationSource,
    /import \{ calcularProgressoLeitura \} from "\.\/editar-capitulo-metrics-utils";/,
  );
  assert.match(mutationSource, /const novasObras = obras\.map\(\(obra, obraIndex\) =>/);
  assert.match(mutationSource, /normalizarObra\(obra, obraIndex\)/);
  assert.match(mutationSource, /progressoLeitura: calcularProgressoLeitura\(capitulosAtualizados\)/);
  assert.doesNotMatch(mutationSource, /supabase|localStorage|useState|useEffect|router|^\s*<[A-Za-z]/m);
  assert.match(
    pageSource,
    /import \{ aplicarEdicaoCapituloNasObrasLocais \} from "\.\/lib\/editar-capitulo-local-save-mutation";/,
  );
  const salvarEdicaoAteBackup = pageSource.slice(
    pageSource.indexOf("async function salvarEdicao"),
    pageSource.indexOf("const backupArquivos =", pageSource.indexOf("async function salvarEdicao")),
  );
  assert.match(salvarEdicaoAteBackup, /aplicarEdicaoCapituloNasObrasLocais\(\{/);
  assert.doesNotMatch(salvarEdicaoAteBackup, /const novasObras = obras\.map/);
  assert.match(pageSource, /const backupArquivos =\s*carregarBackupArquivosObras\(userId\)/);
  assert.match(pageSource, /salvarObrasEditarCapituloStorage\(/);
  assert.match(pageSource, /setObras\(novasObrasDoUsuario\)/);
  assert.match(pageSource, /registrarDiarioEdicaoCapitulo\(/);
  assert.match(pageSource, /atualizarNotificacaoCapituloSupabase\(/);
});
