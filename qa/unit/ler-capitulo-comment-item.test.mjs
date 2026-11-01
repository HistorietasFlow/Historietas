import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const ler = (path) => readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const sheet = ler("../../app/ler-capitulo/components/ler-capitulo-comments-sheet.tsx");
const item = ler("../../app/ler-capitulo/components/ler-capitulo-comment-item.tsx");
const funcoes = item.slice(
  item.indexOf("function criarHrefPerfilUsuarioLeitor("),
  item.indexOf("export function LerCapituloCommentItem("),
);
const js = typescript.transpileModule(
  `${funcoes}\nexport { criarHrefPerfilUsuarioLeitor, criarAvatarComentarioBaseStyle, formatarTempoRelativoComentarioCapitulo };`,
  {
    compilerOptions: { module: typescript.ModuleKind.ESNext, target: typescript.ScriptTarget.ES2022 },
  },
).outputText;
const helpers = await import(`data:text/javascript;base64,${Buffer.from(js).toString("base64")}`);

test("item visual preserva avatar, perfil, ações e curtida do comentário", () => {
  assert.match(item, /^"use client";/);
  assert.match(item, /export function LerCapituloCommentItem\(/);
  assert.match(item, /resposta \? commentReplyItemStyle : commentItemStyle/);
  assert.match(item, /criarHrefPerfilUsuarioLeitor\(/);
  assert.match(item, /criarAvatarComentarioBaseStyle\(/);
  assert.match(item, /formatarTempoRelativoComentarioCapitulo\(/);
  assert.match(item, />\s*Responder\s*</);
  assert.match(item, /comentarioRemovendo \? "Removendo\.\.\." : "Remover"/);
  assert.match(item, /comentarioDenunciando \? "Enviando\.\.\." : "Denunciar"/);
  assert.match(item, /aria-pressed=\{usuarioCurtiuComentario\}/);
  assert.match(item, /data-historietas-reader-like="comment"/);
  assert.match(item, /comentarioCurtindoId === comentario\.id/);
  assert.match(item, /onResponderComentario\(comentario, comentarioRaizId\)/);
  assert.match(item, /onCurtirComentario\(postId, comentario\.id\)/);
  assert.match(item, /onRemoverComentario\(postId, comentario\.id\)/);
  assert.match(item, /onDenunciarComentario\(comentario\.id\)/);
  assert.doesNotMatch(item, /useState|useEffect|supabase|localStorage/);
});

test("item preserva os helpers de perfil, avatar e tempo relativo", () => {
  assert.equal(
    helpers.criarHrefPerfilUsuarioLeitor("  id  ", " Ana Silva "),
    "/perfil-autor?userId=id&autorId=id&autor=Ana+Silva",
  );
  assert.equal(
    helpers.criarHrefPerfilUsuarioLeitor(" ", " "),
    "/perfil-autor?autor=Usu%C3%A1rio",
  );
  const base = { display: "flex" };
  assert.equal(helpers.criarAvatarComentarioBaseStyle(base, "  "), base);
  assert.deepEqual(helpers.criarAvatarComentarioBaseStyle(base, " imagem.png "), {
    display: "flex", backgroundImage: "url(imagem.png)", backgroundSize: "cover", backgroundPosition: "center", color: "transparent", WebkitTextFillColor: "transparent",
  });

  const agora = Date.parse("2026-01-02T00:00:00Z");
  assert.equal(helpers.formatarTempoRelativoComentarioCapitulo("inválido", agora), "agora");
  assert.equal(helpers.formatarTempoRelativoComentarioCapitulo("2026-01-01T23:59:59Z", agora), "agora");
  assert.equal(helpers.formatarTempoRelativoComentarioCapitulo("2026-01-01T23:59:00Z", agora), "há 1 minuto");
  assert.equal(helpers.formatarTempoRelativoComentarioCapitulo("2026-01-01T00:00:00Z", agora), "há 1 dia");
});

test("sheet delega apenas os itens raiz e respostas ao componente", () => {
  assert.match(sheet, /from "\.\/ler-capitulo-comment-item";/);
  assert.match(sheet, /<LerCapituloCommentItem\s*comentario=\{comentario\}/);
  assert.match(sheet, /<LerCapituloCommentItem\s*key=\{resposta\.id\}\s*comentario=\{resposta\}/);
  assert.doesNotMatch(sheet, /function renderizarComentario\(/);
  assert.doesNotMatch(sheet, /function criarHrefPerfilUsuarioLeitor\(/);
  assert.doesNotMatch(sheet, /function formatarTempoRelativoComentarioCapitulo\(/);
});
