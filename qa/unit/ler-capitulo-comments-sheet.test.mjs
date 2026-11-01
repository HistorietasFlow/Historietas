import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const ler = (path) => readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const pagina = ler("../../app/ler-capitulo/page.tsx");
const loader = ler("../../app/ler-capitulo/lib/ler-capitulo-comments-read-loader.ts");
const lifecycle = ler("../../app/ler-capitulo/hooks/use-ler-capitulo-interaction-data.ts");
const acoes = ler("../../app/ler-capitulo/lib/ler-capitulo-comment-actions.ts");
const denuncias = ler("../../app/ler-capitulo/lib/ler-capitulo-report-actions.ts");
const sheet = ler("../../app/ler-capitulo/components/ler-capitulo-comments-sheet.tsx");
const acoesSheet = ler("../../app/ler-capitulo/hooks/use-ler-capitulo-comment-sheet-actions.ts");
const funcoes = sheet.slice(sheet.indexOf("function criarHrefPerfilUsuarioLeitor("), sheet.indexOf("type ComentariosCapituloSheetProps = {"));
const js = typescript.transpileModule(`${funcoes}\nexport { criarHrefPerfilUsuarioLeitor, criarAvatarComentarioBaseStyle, formatarTempoRelativoComentarioCapitulo, criarEstruturaComentariosCapitulo };`, {
  compilerOptions: { module: typescript.ModuleKind.ESNext, target: typescript.ScriptTarget.ES2022 },
}).outputText;
const helpers = await import(`data:text/javascript;base64,${Buffer.from(js).toString("base64")}`);

test("sheet preserva efeitos, JSX e props enquanto delega ações assíncronas", () => {
  assert.match(sheet, /^"use client";/);
  assert.match(sheet, /const ComentariosCapituloSheet = memo\(function ComentariosCapituloSheet/);
  assert.match(sheet, /export default ComentariosCapituloSheet;/);
  assert.match(sheet, /if \(!post \|\| typeof document === "undefined"\)/);
  assert.match(sheet, /return createPortal\([\s\S]*?document\.body/);
  assert.match(sheet, /window\.setInterval\([\s\S]*?30000/);
  assert.match(sheet, /window\.clearInterval\(timer\)/);
  assert.match(sheet, /window\.clearTimeout\(dragResetTimerRef\.current\)/);
  assert.match(sheet, /event\.key === "Enter" \|\| event\.key === " "[\s\S]*?event\.preventDefault\(\)/);
  assert.match(sheet, /\["💜", "🔥", "😂", "😮", "😭", "👏"\]/);
  assert.match(sheet, /maxLength=\{420\}/);
  assert.doesNotMatch(sheet, /\b(?:supabase|localStorage)\b/);
  assert.match(sheet, /useLerCapituloCommentSheetActions\(\{/);
  assert.match(acoesSheet, /async function curtirComentarioSeguro\(/);
  assert.match(acoesSheet, /async function removerComentarioSeguro\(/);
  assert.match(acoesSheet, /async function denunciarComentarioSeguro\(/);
  assert.doesNotMatch(sheet, /async function curtirComentarioSeguro\(/);
  assert.doesNotMatch(sheet, /async function removerComentarioSeguro\(/);
  assert.doesNotMatch(sheet, /async function denunciarComentarioSeguro\(/);
});

test("página mantém a integração e as ações de dados e persistência", () => {
  assert.match(pagina, /import ComentariosCapituloSheet,[\s\S]*?from "\.\/components\/ler-capitulo-comments-sheet";/);
  assert.doesNotMatch(pagina, /function ComentariosCapituloSheet\(/);
  for (const [prop, valor] of Object.entries({
    onFechar: "fecharComentariosCapitulo",
    onEnviar: "enviarComentarioCapitulo",
    onCurtirComentario: "alternarCurtidaComentarioCapitulo",
    onRemoverComentario: "removerComentarioCapitulo",
    onDenunciarComentario: "denunciarComentarioCapitulo",
  })) {
    assert.match(pagina, new RegExp(`${prop}=\\{${valor}\\}`));
  }
  assert.match(pagina, /post=\{mostrarComentario \? postComentariosCapitulo : null\}/);
  assert.match(pagina, /podeComentar=\{Boolean\(usuarioIdLogado\)\}/);
  assert.match(pagina, /criarAcoesComentariosCapitulo\(\{/);
  assert.match(acoes, /async function enviarComentarioCapitulo\(/);
  assert.match(pagina, /useLerCapituloInteractionData\(\{/);
  assert.match(lifecycle, /import \{ carregarComentariosCapituloSupabase \} from "\.\.\/lib\/ler-capitulo-comments-read-loader";/);
  assert.match(loader, /export async function carregarComentariosCapituloSupabase\(/);
  assert.match(lifecycle, /await carregarComentariosCapituloSupabase\(/);
  assert.doesNotMatch(pagina, /async function carregarComentariosCapituloSupabase\(/);
  assert.match(acoes, /function obterIdsComentarioCapituloComRespostas\(/);
  assert.match(pagina, /from "\.\/lib\/ler-capitulo-report-actions";/);
  assert.match(pagina, /criarAcoesDenunciaLeitor\(\{/);
  assert.match(denuncias, /async function denunciarComentarioCapitulo\(/);
  assert.doesNotMatch(pagina, /async function denunciarComentarioCapitulo\(/);
});

test("helpers mantêm a rota e o fallback visual do avatar", () => {
  assert.equal(helpers.criarHrefPerfilUsuarioLeitor("  id  ", " Ana Silva "), "/perfil-autor?userId=id&autorId=id&autor=Ana+Silva");
  assert.equal(helpers.criarHrefPerfilUsuarioLeitor(" ", " "), "/perfil-autor?autor=Usu%C3%A1rio");
  const base = { display: "flex" };
  assert.equal(helpers.criarAvatarComentarioBaseStyle(base, "  "), base);
  assert.deepEqual(helpers.criarAvatarComentarioBaseStyle(base, " imagem.png "), {
    display: "flex", backgroundImage: "url(imagem.png)", backgroundSize: "cover", backgroundPosition: "center", color: "transparent", WebkitTextFillColor: "transparent",
  });
});

test("helpers preservam tempo relativo, agrupamento, ordenação e relevância", () => {
  const agora = Date.parse("2026-01-02T00:00:00Z");
  assert.equal(helpers.formatarTempoRelativoComentarioCapitulo("inválido", agora), "agora");
  assert.equal(helpers.formatarTempoRelativoComentarioCapitulo("2026-01-01T23:59:59Z", agora), "agora");
  assert.equal(helpers.formatarTempoRelativoComentarioCapitulo("2026-01-01T23:59:00Z", agora), "há 1 minuto");
  assert.equal(helpers.formatarTempoRelativoComentarioCapitulo("2026-01-01T00:00:00Z", agora), "há 1 dia");
  const comentario = (id, criadoEm, curtidas, comentarioPaiId = "") => ({ id, criadoEm, curtidas, comentarioPaiId });
  const dados = [
    comentario("a", "2026-01-01", ["u1", "u2"]),
    comentario("b", "2026-01-02", []),
    comentario("r1", "2026-01-03", [], "b"),
    comentario("r2", "2026-01-04", [], "r1"),
    comentario("orfa", "inválido", [], "ausente"),
  ];
  const relevantes = helpers.criarEstruturaComentariosCapitulo(dados, "relevantes");
  assert.deepEqual(relevantes.comentariosRaiz.map((c) => c.id), ["a", "b", "orfa"]);
  assert.deepEqual(relevantes.respostasPorRaiz.get("b").map((c) => c.id), ["r1", "r2"]);
  assert.deepEqual(helpers.criarEstruturaComentariosCapitulo(dados, "recentes").comentariosRaiz.map((c) => c.id), ["b", "a", "orfa"]);
});
