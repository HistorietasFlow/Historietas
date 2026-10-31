import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const paginaObra = readFileSync(
  new URL("../../app/obra/[slug]/ObraDinamicaClient.tsx", import.meta.url),
  "utf8",
);
const hook = readFileSync(
  new URL(
    "../../app/obra/[slug]/hooks/use-obra-comment-mutations.ts",
    import.meta.url,
  ),
  "utf8",
);

test("cliente delega somente as mutations de comentarios ao hook", () => {
  assert.match(
    paginaObra,
    /import \{ useObraCommentMutations \} from "\.\/hooks\/use-obra-comment-mutations";/,
  );
  assert.match(
    paginaObra,
    /const \{\s*enviarComentarioObra,\s*removerComentarioObra,\s*alternarCurtidaComentarioObra,\s*\} = useObraCommentMutations\(/,
  );
  assert.doesNotMatch(paginaObra, /async function enviarComentarioObra\(/);
  assert.doesNotMatch(paginaObra, /async function removerComentarioObra\(/);
  assert.doesNotMatch(paginaObra, /async function alternarCurtidaComentarioObra\(/);
  assert.match(paginaObra, /function responderComentarioObra\(/);
});

test("hook preserva envio, resposta, persistencia e rollback", () => {
  assert.match(hook, /export function useObraCommentMutations/);
  assert.match(hook, /respostaComentario\s*\n\s*\?/);
  assert.match(hook, /comentario_pai_id: comentarioTemporario\.comentarioPaiId \|\| null/);
  assert.match(hook, /carregarPerfilPublicoObra/);
  assert.match(hook, /inserirComentarioObraSupabase/);
  assert.match(hook, /normalizarComentariosObraSupabase/);
  assert.match(hook, /salvarComentariosObraLocais/);
  assert.match(hook, /setComentariosObra\(\(comentariosAtuais\) => \[/);
  assert.match(hook, /setTotalComentariosObra\(\(totalAtual\) => totalAtual \+ 1\)/);
  assert.match(hook, /setComentarioTexto\(textoDigitado\)/);
  assert.match(hook, /setRespostaComentario\(respostaAnterior\)/);
});

test("hook preserva locks e guards de identidade nas mutations", () => {
  assert.match(hook, /comentarioEnviando/);
  assert.match(hook, /comentarioRemovendoId/);
  assert.match(hook, /comentarioCurtindoId/);
  assert.match(hook, /obterIdentidadeLogadaParaAcao/);
  assert.match(hook, /criarGuardIdentidadeAcao\(identidadeAcao\)/);
  assert.match(hook, /if \(!execucaoAcaoEstaAtual\(\)\)/);
  assert.match(hook, /removerComentarioObraSupabase/);
  assert.match(hook, /removerCurtidaComentarioObraSupabase/);
  assert.match(hook, /inserirCurtidaComentarioObraSupabase/);
  assert.match(hook, /setComentarioRemovendoId\(""\)/);
  assert.match(hook, /setComentarioCurtindoId\(""\)/);
  assert.doesNotMatch(hook, /function responderComentarioObra/);
  assert.doesNotMatch(hook, /comentarioInputRef/);
});
