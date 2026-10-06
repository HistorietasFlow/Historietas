import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const componenteComentario = readFileSync(
  new URL(
    "../../app/obra/[slug]/components/obra-comment-item.tsx",
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

test("item preserva estilos distintos de comentario raiz e resposta", () => {
  assert.match(
    componenteComentario,
    /style=\{resposta \? commentSheetReplyItemStyle : commentSheetItemStyle\}/,
  );
  assert.match(
    componenteComentario,
    /resposta\s*\? commentSheetReplyAvatarLinkStyle\s*:\s*commentSheetAvatarLinkStyle/,
  );
  assert.match(
    componenteComentario,
    /backgroundImage: `url\(\$\{comentario\.avatar\}\)`/,
  );
  assert.match(componenteComentario, /backgroundSize: "cover"/);
  assert.match(componenteComentario, /backgroundPosition: "center"/);
  assert.match(
    componenteComentario,
    /comentario\.nome\.slice\(0, 1\)\.toUpperCase\(\) \|\| "U"/,
  );
});

test("item preserva nome texto e controles acessiveis", () => {
  assert.match(
    componenteComentario,
    /aria-label=\{`Abrir perfil de \$\{comentario\.nome\}`\}/,
  );
  assert.equal(
    (componenteComentario.match(/data-historietas-i18n-ignore="true"/g) || [])
      .length,
    2,
  );
  assert.match(
    componenteComentario,
    /usuarioCurtiu\s*\? "Remover curtida do comentário"\s*:\s*"Curtir comentário"/,
  );
  assert.match(componenteComentario, /disabled=\{removendo\}/);
  assert.match(componenteComentario, /disabled=\{curtindo\}/);
  assert.match(componenteComentario, /aria-hidden="true"/);
  assert.match(componenteComentario, /strokeWidth="2"/);
  assert.match(componenteComentario, /strokeLinecap="round"/);
  assert.match(componenteComentario, /strokeLinejoin="round"/);
});

test("item preserva as regras de acoes e os argumentos dos callbacks", () => {
  assert.match(componenteComentario, /\{podeRemover \? \(/);
  assert.match(componenteComentario, /\{removendo \? "Removendo\.\.\." : "Remover"\}/);
  assert.match(componenteComentario, /\) : !comentario\.local \? \(/);
  assert.match(componenteComentario, />\s*Denunciar\s*<\/button>/);
  assert.match(
    componenteComentario,
    /onClick=\{\(\) => onResponder\(comentario, comentarioRaizId\)\}/,
  );
  assert.match(
    componenteComentario,
    /onClick=\{\(\) => void onRemover\(comentario\)\}/,
  );
  assert.match(
    componenteComentario,
    /onClick=\{\(\) => onDenunciar\(comentario\)\}/,
  );
  assert.match(
    componenteComentario,
    /onClick=\{\(\) => void onCurtir\(comentario\)\}/,
  );
  assert.match(componenteComentario, /\{comentario\.curtidas\.length\}/);
});

test("chave da thread fica na lista e handlers permanecem no cliente", () => {
  assert.doesNotMatch(componenteComentario, /key=\{comentario\.id\}/);
  assert.match(
    listaComentarios,
    /<ObraCommentThread\s*key=\{comentario\.id\}/,
  );
  assert.match(paginaObra, /<ObraCommentsList/);
  assert.match(paginaObra, /onResponder=\{responderComentarioObra\}/);
  assert.match(paginaObra, /onRemover=\{removerComentarioObra\}/);
  assert.match(paginaObra, /onDenunciar=\{abrirDenunciaComentarioObra\}/);
  assert.match(paginaObra, /onCurtir=\{alternarCurtidaComentarioObra\}/);
});
