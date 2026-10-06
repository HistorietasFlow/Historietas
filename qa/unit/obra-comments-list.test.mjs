import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const listaComentarios = readFileSync(
  new URL(
    "../../app/obra/[slug]/components/obra-comments-list.tsx",
    import.meta.url,
  ),
  "utf8",
);
const paginaObra = readFileSync(
  new URL("../../app/obra/[slug]/ObraDinamicaClient.tsx", import.meta.url),
  "utf8",
);

test("lista preserva prioridade loading lista e vazio", () => {
  assert.match(listaComentarios, /<section style=\{commentsSheetListStyle\}>/);
  assert.match(
    listaComentarios,
    /\{comentariosCarregando \? \(\s*<div style=\{commentsLoadingStyle\}>\s*<LoadingSpinner compacto label="Carregando comentários" \/>\s*<\/div>\s*\) : comentariosRaiz\.length > 0 \? \(/,
  );
  assert.match(
    listaComentarios,
    /<p style=\{emptyCommentsStyle\}>Sem comentários ainda<\/p>/,
  );
});

test("lista encaminha raiz respostas e props para cada thread", () => {
  assert.match(
    listaComentarios,
    /const respostas = respostasPorRaiz\.get\(comentario\.id\) \|\| \[\];/,
  );
  assert.match(
    listaComentarios,
    /<ObraCommentThread\s*key=\{comentario\.id\}\s*comentario=\{comentario\}\s*respostas=\{respostas\}\s*quantidadeVisivelAtual=\{\s*respostasVisiveisPorComentario\[comentario\.id\] \|\| 0\s*\}/,
  );
  assert.match(listaComentarios, /usuarioIdLogado=\{usuarioIdLogado\}/);
  assert.match(
    listaComentarios,
    /comentarioRemovendoId=\{comentarioRemovendoId\}/,
  );
  assert.match(listaComentarios, /comentarioCurtindoId=\{comentarioCurtindoId\}/);
  assert.match(listaComentarios, /agoraComentarios=\{agoraComentarios\}/);
  assert.match(listaComentarios, /onResponder=\{onResponder\}/);
  assert.match(listaComentarios, /onRemover=\{onRemover\}/);
  assert.match(listaComentarios, /onDenunciar=\{onDenunciar\}/);
  assert.match(listaComentarios, /onCurtir=\{onCurtir\}/);
  assert.match(listaComentarios, /onMostrarRespostas=\{onMostrarRespostas\}/);
  assert.match(
    listaComentarios,
    /onMostrarMaisRespostas=\{onMostrarMaisRespostas\}/,
  );
  assert.match(listaComentarios, /onOcultarRespostas=\{onOcultarRespostas\}/);
});

test("lista preserva carregamento incremental e estado visual", () => {
  assert.match(listaComentarios, /\{comentariosTemMais \? \(/);
  assert.match(listaComentarios, /onClick=\{\(\) => void onCarregarMais\(\)\}/);
  assert.match(listaComentarios, /disabled=\{comentariosCarregandoMais\}/);
  assert.match(
    listaComentarios,
    /opacity: comentariosCarregandoMais \? 0\.62 : 1/,
  );
  assert.match(
    listaComentarios,
    /cursor: comentariosCarregandoMais\s*\? "not-allowed"\s*: "pointer"/,
  );
  assert.match(listaComentarios, /style=\{\{\s*\.\.\.commentsLoadMoreStyle,/);
  assert.match(listaComentarios, /\? "Carregando\.\.\."\s*: "Carregar mais comentários"/);
});

test("cliente preserva estrutura memoizada paginação handlers e guards", () => {
  assert.match(
    paginaObra,
    /const estruturaComentariosObra = useMemo\(\s*\(\) => criarEstruturaComentariosObra\(comentariosObra, ordenacaoComentarios\),/,
  );
  assert.match(paginaObra, /async function carregarMaisComentariosObra\(\)/);
  assert.match(paginaObra, /comentariosConsultaVersaoRef\.current === versaoConsulta/);
  assert.match(paginaObra, /execucaoIdentidadeObraEstaAtual/);
  assert.match(
    paginaObra,
    /<ObraCommentsList\s*comentariosCarregando=\{comentariosCarregando\}\s*comentariosRaiz=\{estruturaComentariosObra\.comentariosRaiz\}\s*respostasPorRaiz=\{estruturaComentariosObra\.respostasPorRaiz\}/,
  );
  assert.match(
    paginaObra,
    /onResponder=\{responderComentarioObra\}\s*onRemover=\{removerComentarioObra\}\s*onDenunciar=\{abrirDenunciaComentarioObra\}\s*onCurtir=\{alternarCurtidaComentarioObra\}/,
  );
  assert.match(paginaObra, /onCarregarMais=\{carregarMaisComentariosObra\}/);
  assert.doesNotMatch(
    listaComentarios,
    /useMemo|setComentarios|carregarPaginaComentariosObraSupabase|execucaoIdentidadeObraEstaAtual/,
  );
});
