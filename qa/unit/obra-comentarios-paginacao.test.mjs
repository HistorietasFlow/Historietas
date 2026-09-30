import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const paginaObra = readFileSync(
  new URL("../../app/obra/[slug]/ObraDinamicaClient.tsx", import.meta.url),
  "utf8",
);

function obterBloco(inicioTexto, fimTexto) {
  const inicio = paginaObra.indexOf(inicioTexto);
  const fim = paginaObra.indexOf(fimTexto, inicio);

  assert.ok(inicio >= 0);
  assert.ok(fim > inicio);

  return paginaObra.slice(inicio, fim);
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
  const bloco = obterBloco(
    "async function carregarPaginaComentariosObraSupabase(",
    "function criarEstruturaComentariosObra(",
  );

  assert.match(paginaObra, /const WORK_COMMENTS_PAGE_SIZE = 20/);
  assert.match(bloco, /\.is\("comentario_pai_id", null\)/);
  assert.match(bloco, /\.range\(inicio, fim\)/);
  assert.match(
    bloco,
    /const temMais = comentariosRaizTodos\.length > WORK_COMMENTS_PAGE_SIZE/,
  );
  assert.match(
    bloco,
    /nomeColecao: "respostas dos comentários da obra"/,
  );
  assert.match(bloco, /\.in\("comentario_pai_id", comentariosPaisLote\)/);
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
    paginaObra,
    /Carregar mais comentários/,
  );
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
