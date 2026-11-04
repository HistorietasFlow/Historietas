import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ler = (path) =>
  readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const hook = ler(
  "../../app/obra/[slug]/hooks/use-obra-comments-sheet-interactions.ts",
);
const cliente = ler(
  "../../app/obra/[slug]/ObraDinamicaClient.tsx",
);
const bodyLock = ler(
  "../../app/obra/[slug]/hooks/use-obra-comments-sheet-body-lock.ts",
);

test("hook centraliza estado refs abertura e fechamento do comments sheet", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /export function useObraCommentsSheetInteractions\(/);
  assert.match(hook, /const \[comentariosAbertos, setComentariosAbertos\] = useState\(false\);/);
  assert.match(
    hook,
    /const \[comentariosSheetExpandido, setComentariosSheetExpandido\] =\s*useState\(false\);/,
  );
  for (const referencia of [
    "comentariosSheetRef",
    "focoAntesComentariosRef",
    "comentariosDragStartYRef",
    "comentariosDragOffsetYRef",
    "comentariosDragIgnorarCliqueRef",
    "comentariosDragResetTimerRef",
  ]) {
    assert.match(hook, new RegExp(`const ${referencia} = useRef`));
  }
  assert.match(
    hook,
    /function abrirComentariosObra\(\) \{\s*focoAntesComentariosRef\.current = obterElementoComFocoAtual\(\);\s*setComentariosSheetExpandido\(false\);\s*fecharMenuOrdenacaoComentarios\(\);\s*setComentariosAbertos\(true\);\s*\}/,
  );
  assert.match(
    hook,
    /function fecharComentariosObra\(\) \{\s*const focoAnterior = focoAntesComentariosRef\.current;\s*focoAntesComentariosRef\.current = null;\s*setComentariosAbertos\(false\);\s*setComentariosSheetExpandido\(false\);\s*fecharMenuOrdenacaoComentarios\(\);\s*limparRespostaComentario\(\);\s*comentariosDragOffsetYRef\.current = 0;\s*restaurarFocoAnterior\(focoAnterior\);\s*\}/,
  );
});

test("hook preserva desktop thresholds transicoes e protecao pos drag", () => {
  assert.equal((hook.match(/if \(isDesktop\)/g) || []).length, 3);
  assert.match(hook, /const limiteSuperior = comentariosSheetExpandido \? -46 : -58;/);
  assert.match(hook, /const limiteInferior = comentariosSheetExpandido \? 112 : 132;/);
  assert.match(hook, /Math\.abs\(deslocamento\) > 6/);
  assert.match(hook, /deslocamento < -34/);
  assert.match(hook, /deslocamento > 52 && comentariosSheetExpandido/);
  assert.match(hook, /deslocamento > 118 && !comentariosSheetExpandido/);
  assert.match(hook, /comentariosSheetRef\.current\.style\.transition = "none";/);
  assert.match(hook, /comentariosSheetRef\.current\.style\.transition = "height 220ms ease";/);
  assert.match(hook, /handle\.style\.transition = "transform 160ms ease";/);
  assert.match(hook, /handle\.style\.transform = `translate3d\(0, \$\{deslocamento\}px, 0\)`;/);
  assert.match(hook, /handle\.style\.transform = "";/);
  assert.match(hook, /\}, 350\);/);
  assert.match(
    hook,
    /if \(isDesktop \|\| comentariosDragIgnorarCliqueRef\.current\) \{\s*return;\s*\}/,
  );
});

test("cliente delega interacoes e mantem body lock responsavel pelo cleanup do timer", () => {
  assert.match(
    cliente,
    /import \{ useObraCommentsSheetInteractions \} from "\.\/hooks\/use-obra-comments-sheet-interactions";/,
  );
  assert.match(
    cliente,
    /\} = useObraCommentsSheetInteractions\(\{\s*isDesktop,\s*fecharMenuOrdenacaoComentarios,\s*limparRespostaComentario: \(\) => setRespostaComentario\(null\),\s*\}\);/,
  );
  assert.match(
    cliente,
    /useObraCommentsSheetBodyLock\(\s*comentariosAbertos,\s*comentariosDragResetTimerRef,\s*\);/,
  );
  assert.match(
    bodyLock,
    /if \(comentariosDragResetTimerRef\.current !== null\) \{\s*window\.clearTimeout\(comentariosDragResetTimerRef\.current\);\s*comentariosDragResetTimerRef\.current = null;\s*\}/,
  );
  assert.doesNotMatch(cliente, /function (?:abrir|fechar|iniciarArraste|moverArraste|finalizarArraste|alternarExpansao)ComentariosObra/);
  assert.doesNotMatch(hook, /\b(?:supabase|localStorage|comentariosObra|comentarioTexto|onEnviar)\b/);
});
