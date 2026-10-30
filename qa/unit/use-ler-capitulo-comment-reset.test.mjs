import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ler = (path) => readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const fonte = ler("../../app/ler-capitulo/hooks/use-ler-capitulo-comment-reset.ts");
const pagina = ler("../../app/ler-capitulo/page.tsx");

test("reset preserva timer, limpeza e dependências de capítulo e usuário", () => {
  assert.match(fonte, /window\.setTimeout\([\s\S]*?\}, 0\);/);
  assert.match(fonte, /setComentarioDigitado\([\s\S]*?comentarioAtual \|\| ""/);
  assert.match(fonte, /setComentarioStatus\(""\);/);
  assert.match(fonte, /setMensagemAcao\(""\);/);
  assert.match(fonte, /setMostrarComentario\(false\);/);
  assert.match(fonte, /window\.clearTimeout\([\s\S]*?atualizarComentarioTimer/);
  assert.match(fonte, /capituloId,[\s\S]*?comentarioAtual,[\s\S]*?usuarioIdLogado,/);
  assert.match(fonte, /setComentarioDigitado,[\s\S]*?setComentarioStatus,[\s\S]*?setMensagemAcao,[\s\S]*?setMostrarComentario,/);
});

test("página mantém estados e setters locais e delega o reset", () => {
  assert.match(pagina, /import \{ useLerCapituloCommentReset \} from "\.\/hooks\/use-ler-capitulo-comment-reset";/);
  assert.match(pagina, /const \[, setComentarioDigitado\] = useState\(""\);/);
  assert.match(pagina, /const \[comentarioStatus, setComentarioStatus\] = useState\(""\);/);
  assert.match(pagina, /const \[mensagemAcao, setMensagemAcao\] = useState\(""\);/);
  assert.match(pagina, /const \[mostrarComentario, setMostrarComentario\] = useState\(false\);/);
  assert.match(pagina, /useLerCapituloCommentReset\(\{[\s\S]*?capituloId:\s*capituloAtual\?\.id,[\s\S]*?comentarioAtual:\s*capituloAtual\?\.comentario,[\s\S]*?usuarioIdLogado,[\s\S]*?setComentarioDigitado,[\s\S]*?setComentarioStatus,[\s\S]*?setMensagemAcao,[\s\S]*?setMostrarComentario,/);
  assert.doesNotMatch(pagina, /const atualizarComentarioTimer/);
});
