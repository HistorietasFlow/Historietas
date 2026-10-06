import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const paginaObra = readFileSync(
  new URL("../../app/obra/[slug]/ObraDinamicaClient.tsx", import.meta.url),
  "utf8",
);
const listaComentarios = readFileSync(
  new URL(
    "../../app/obra/[slug]/components/obra-comments-list.tsx",
    import.meta.url,
  ),
  "utf8",
);
const consultaRaizesComentarios = readFileSync(
  new URL(
    "../../app/obra/[slug]/lib/obra-supabase-root-comments-query.ts",
    import.meta.url,
  ),
  "utf8",
);
const consultaRespostasComentarios = readFileSync(
  new URL(
    "../../app/obra/[slug]/lib/obra-supabase-comment-replies-query.ts",
    import.meta.url,
  ),
  "utf8",
);
const normalizadorComentarios = readFileSync(
  new URL(
    "../../app/obra/[slug]/lib/obra-supabase-comment-normalizer.ts",
    import.meta.url,
  ),
  "utf8",
);
const carregadorPaginaComentarios = readFileSync(
  new URL(
    "../../app/obra/[slug]/lib/obra-supabase-comments-page-loader.ts",
    import.meta.url,
  ),
  "utf8",
);

function obterBloco(inicioTexto, fimTexto) {
  const inicio = paginaObra.indexOf(inicioTexto);
  const fim = paginaObra.indexOf(fimTexto, inicio);

  assert.ok(inicio >= 0);
  assert.ok(fim > inicio);

  return paginaObra.slice(inicio, fim);
}

function extrairCallbackUpdater(bloco, setter) {
  const prefixo = `${setter}((`;
  const inicio = bloco.indexOf(prefixo);
  const fim = bloco.indexOf("\n      });", inicio);

  assert.ok(inicio >= 0);
  assert.ok(fim > inicio);

  const callback = bloco
    .slice(inicio + setter.length + 1, fim + "\n      }".length)
    .trim();

  return new Function(
    "execucaoAtual",
    "mesclarComentariosObraPorId",
    "pagina",
    `return (${callback});`,
  );
}

test("comentarios remotos so carregam quando o painel esta aberto", () => {
  const bloco = obterBloco(
    "const versaoConsulta = comentariosConsultaVersaoRef.current + 1;",
    "}, [comentariosAbertos, obraIdComentarios, usuarioIdLogado]);",
  );

  assert.match(bloco, /if \(!comentariosAbertos\) \{\s*return;\s*\}/);
  assert.match(
    bloco,
    /await carregarPaginaComentariosObraSupabase\(\s*obraIdComentarios,\s*0,/,
  );
  assert.doesNotMatch(bloco, /carregarTodasPaginasSupabase/);
});

test("pagina comentarios raiz e busca apenas respostas dos topicos carregados", () => {
  const bloco = carregadorPaginaComentarios;

  assert.match(
    paginaObra,
    /from "\.\/lib\/obra-supabase-comments-page-loader"/,
  );
  assert.match(bloco, /const WORK_COMMENTS_PAGE_SIZE = 20/);
  assert.match(
    bloco,
    /await consultarPaginaRaizesComentariosObraSupabase\(obraId, inicio, fim\)/,
  );
  assert.match(
    bloco,
    /const temMais = comentariosRaizTodos\.length > WORK_COMMENTS_PAGE_SIZE/,
  );
  assert.match(
    bloco,
    /await carregarRespostasComentariosObraSupabase\(\s*obraId,\s*idsPais,\s*\)/,
  );
  assert.match(
    bloco,
    /await normalizarComentariosObraSupabase\(\[\s*\.\.\.comentariosRaiz,/,
  );
  assert.match(
    normalizadorComentarios,
    /await carregarPerfisPublicosObra\(usuariosIds\)/,
  );
  assert.match(
    normalizadorComentarios,
    /await carregarCurtidasComentariosObraSupabase\(\s*comentariosIds\s*\)/,
  );
  assert.match(
    consultaRespostasComentarios,
    /nomeColecao: "respostas dos comentários da obra"/,
  );
  assert.match(
    consultaRespostasComentarios,
    /\.in\("comentario_pai_id", comentariosPaisLote\)/,
  );
  assert.match(
    consultaRaizesComentarios,
    /\.is\("comentario_pai_id", null\)/,
  );
  assert.match(consultaRaizesComentarios, /\.range\(inicio, fim\)/);
});

test("painel oferece carregamento incremental sem perder protecao de versao", () => {
  const bloco = obterBloco(
    "async function carregarMaisComentariosObra()",
    "const estruturaComentariosObra = useMemo(",
  );

  assert.match(bloco, /comentariosCarregandoMais/);
  assert.match(bloco, /comentariosTemMais/);
  assert.match(bloco, /comentariosProximoOffset/);
  assert.match(
    bloco,
    /comentariosConsultaVersaoRef\.current === versaoConsulta/,
  );
  assert.match(bloco, /execucaoIdentidadeObraEstaAtual/);
  assert.match(
    bloco,
    /setComentariosObra\(\(comentariosAtuais\) => \{\s*if \(!execucaoAtual\(\)\) \{\s*return comentariosAtuais;\s*\}\s*return mesclarComentariosObraPorId\(\s*comentariosAtuais,\s*pagina\.comentarios,\s*\);\s*\}\);/,
  );
  assert.match(
    bloco,
    /setTotalComentariosObra\(\(totalAtual\) => \{\s*if \(!execucaoAtual\(\)\) \{\s*return totalAtual;\s*\}\s*return Math\.max\(totalAtual, pagina\.proximoOffset\);\s*\}\);/,
  );
  assert.doesNotMatch(bloco, /const comentariosPorId = new Map/);

  assert.match(
    listaComentarios,
    /Carregar mais comentários/,
  );
  assert.match(paginaObra, /onCarregarMais=\{carregarMaisComentariosObra\}/);
});

test("updaters enfileirados de carregar mais ignoram execucao obsoleta", () => {
  const bloco = obterBloco(
    "async function carregarMaisComentariosObra()",
    "const estruturaComentariosObra = useMemo(",
  );
  const criarUpdaterComentarios = extrairCallbackUpdater(
    bloco,
    "setComentariosObra",
  );
  const criarUpdaterTotal = extrairCallbackUpdater(
    bloco,
    "setTotalComentariosObra",
  );
  const pagina = {
    comentarios: [{ id: "comentario-da-consulta-antiga" }],
    proximoOffset: 40,
  };
  const comentariosDaNovaExecucao = [{ id: "comentario-da-nova-execucao" }];
  const totalDaNovaExecucao = 12;

  const atualizarComentariosObsoleta = criarUpdaterComentarios(
    () => false,
    () => {
      throw new Error("nao deve mesclar execucao obsoleta");
    },
    pagina,
  );
  const atualizarTotalObsoleto = criarUpdaterTotal(
    () => false,
    () => {
      throw new Error("nao deve mesclar execucao obsoleta");
    },
    pagina,
  );

  assert.equal(
    atualizarComentariosObsoleta(comentariosDaNovaExecucao),
    comentariosDaNovaExecucao,
  );
  assert.equal(atualizarTotalObsoleto(totalDaNovaExecucao), totalDaNovaExecucao);

  const atualizarComentariosAtual = criarUpdaterComentarios(
    () => true,
    (comentariosAtuais, novosComentarios) => [
      ...comentariosAtuais,
      ...novosComentarios,
    ],
    pagina,
  );
  const atualizarTotalAtual = criarUpdaterTotal(() => true, () => [], pagina);

  assert.deepEqual(atualizarComentariosAtual([]), pagina.comentarios);
  assert.equal(atualizarTotalAtual(12), 40);
});

test("total de comentarios e alimentado pelas metricas sem abrir o painel", () => {
  assert.match(
    paginaObra,
    /setTotalComentariosObra\(metricasBase\.comentarios\);/,
  );
  assert.match(
    paginaObra,
    /setTotalComentariosObra\(metrica\.interacoesDiretas\.comentarios\);/,
  );
});
