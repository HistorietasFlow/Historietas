import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const componenteThread = readFileSync(
  new URL(
    "../../app/obra/[slug]/components/obra-comment-thread.tsx",
    import.meta.url,
  ),
  "utf8",
);
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
const hookVisibilidade = readFileSync(
  new URL(
    "../../app/obra/[slug]/hooks/use-obra-comment-replies-visibility.ts",
    import.meta.url,
  ),
  "utf8",
);

test("thread preserva os calculos de respostas visiveis e ocultas", () => {
  assert.match(
    componenteThread,
    /const quantidadeVisivel = Math\.min\(\s*respostas\.length,\s*quantidadeVisivelAtual \|\| 0,\s*\);/,
  );
  assert.match(
    componenteThread,
    /const respostasVisiveis = respostas\.slice\(0, quantidadeVisivel\);/,
  );
  assert.match(
    componenteThread,
    /const respostasOcultas = Math\.max\(\s*0,\s*respostas\.length - quantidadeVisivel,\s*\);/,
  );
  assert.match(
    componenteThread,
    /const respostasExpandidas = quantidadeVisivel > 0;/,
  );
});

test("thread renderiza raiz e respostas com estilos e chaves corretos", () => {
  assert.match(componenteThread, /<section style=\{commentThreadStyle\}>/);
  assert.doesNotMatch(componenteThread, /<section\s+key=/);
  assert.match(
    componenteThread,
    /<ObraCommentItem\s*comentario=\{comentario\}\s*comentarioRaizId=\{comentario\.id\}/,
  );
  assert.match(
    componenteThread,
    /<div style=\{commentRepliesListStyle\}>\s*\{respostasVisiveis\.map\(\(resposta\) => \(\s*<ObraCommentItem\s*key=\{resposta\.id\}\s*comentario=\{resposta\}\s*comentarioRaizId=\{comentario\.id\}\s*resposta/,
  );
});

test("thread preserva textos, singular plural e callbacks dos controles", () => {
  assert.match(
    componenteThread,
    /onClick=\{\(\) => onMostrarRespostas\(comentario\.id, respostas\.length\)\}/,
  );
  assert.match(componenteThread, /\{`Ver \$\{respostas\.length\} \$\{/);
  assert.match(
    componenteThread,
    /respostas\.length === 1 \? "resposta" : "respostas"/,
  );
  assert.match(componenteThread, /style=\{commentRepliesToggleStyle\}/);
  assert.match(componenteThread, /<span style=\{commentRepliesLineStyle\} \/>/);
  assert.match(componenteThread, /<div style=\{commentRepliesControlsStyle\}>/);
  assert.match(
    componenteThread,
    /onMostrarMaisRespostas\(comentario\.id, respostas\.length\)/,
  );
  assert.match(componenteThread, /\{`Ver mais \$\{respostasOcultas\} \$\{/);
  assert.match(
    componenteThread,
    /respostasOcultas === 1 \? "resposta" : "respostas"/,
  );
  assert.match(
    componenteThread,
    /onClick=\{\(\) => onOcultarRespostas\(comentario\.id\)\}/,
  );
  assert.match(componenteThread, /style=\{commentRepliesHideButtonStyle\}/);
  assert.match(componenteThread, />\s*Ocultar respostas\s*<\/button>/);
});

test("hook centraliza estado e updaters de visibilidade sem mover a composicao", () => {
  assert.match(
    hookVisibilidade,
    /const \[respostasVisiveisPorComentario, setRespostasVisiveisPorComentario\] =\s*useState<Record<string, number>>\(\{\}\);/,
  );
  assert.match(
    hookVisibilidade,
    /\[comentarioId\]: Math\.min\(5, totalRespostas\)/,
  );
  assert.match(
    hookVisibilidade,
    /\[comentarioId\]: Math\.min\(\s*totalRespostas,\s*\(estadoAtual\[comentarioId\] \|\| 0\) \+ 5,\s*\)/,
  );
  assert.match(hookVisibilidade, /\[comentarioId\]: 0,/);
  assert.match(
    hookVisibilidade,
    /\[comentarioPaiId\]: Math\.max\(\s*5,\s*estadoAtual\[comentarioPaiId\] \|\| 0,\s*\)/,
  );
  assert.match(hookVisibilidade, /setRespostasVisiveisPorComentario\(\{\}\);/);
  assert.doesNotMatch(
    componenteThread,
    /setRespostasVisiveisPorComentario/,
  );
  assert.match(
    paginaObra,
    /import \{ useObraCommentRepliesVisibility \} from "\.\/hooks\/use-obra-comment-replies-visibility";/,
  );
  assert.match(paginaObra, /\} = useObraCommentRepliesVisibility\(\);/);
  assert.match(paginaObra, /resetarRespostasVisiveis\(\);/);
  assert.match(
    paginaObra,
    /garantirRespostaVisivel\(comentarioTemporario\.comentarioPaiId\);/,
  );
  assert.match(
    listaComentarios,
    /<ObraCommentThread\s*key=\{comentario\.id\}\s*comentario=\{comentario\}\s*respostas=\{respostas\}/,
  );
  assert.match(
    listaComentarios,
    /quantidadeVisivelAtual=\{\s*respostasVisiveisPorComentario\[comentario\.id\] \|\| 0\s*\}/,
  );
  assert.match(
    paginaObra,
    /<ObraCommentsList\s*comentariosCarregando=\{comentariosCarregando\}/,
  );
  assert.match(listaComentarios, /onMostrarRespostas=\{onMostrarRespostas\}/);
  assert.match(
    listaComentarios,
    /onMostrarMaisRespostas=\{onMostrarMaisRespostas\}/,
  );
  assert.match(listaComentarios, /onOcultarRespostas=\{onOcultarRespostas\}/);
});
