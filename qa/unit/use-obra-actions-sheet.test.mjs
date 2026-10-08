import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hook = readFileSync(
  new URL(
    "../../app/obra/[slug]/hooks/use-obra-actions-sheet.ts",
    import.meta.url,
  ),
  "utf8",
);
const cliente = readFileSync(
  new URL("../../app/obra/[slug]/ObraDinamicaClient.tsx", import.meta.url),
  "utf8",
);

test("hook preserva estado refs e foco inicial do dialogo de acoes", () => {
  assert.match(hook, /export function useObraActionsSheet\(\)/);
  assert.match(hook, /useState\(false\)/);
  assert.match(hook, /useRef<HTMLElement \| null>\(null\)/);
  assert.match(
    hook,
    /useObraDialogInitialFocus\(acoesObraAbertas, acoesObraDialogRef\)/,
  );
  assert.match(hook, /acoesObraAbertas,\s*setAcoesObraAbertas,/);
});

test("hook preserva abertura fechamento e toggle na ordem atual", () => {
  assert.match(
    hook,
    /function abrirAcoesObra\(\) \{\s*focoAntesAcoesObraRef\.current = obterElementoComFocoAtual\(\);\s*setAcoesObraAbertas\(true\);/,
  );
  assert.match(
    hook,
    /function fecharAcoesObra\(restaurarFoco = true\) \{\s*const focoAnterior = focoAntesAcoesObraRef\.current;\s*focoAntesAcoesObraRef\.current = null;\s*setAcoesObraAbertas\(false\);\s*if \(restaurarFoco\) \{\s*restaurarFocoAnterior\(focoAnterior\);/,
  );
  assert.match(
    hook,
    /function alternarAcoesObra\(\) \{\s*if \(acoesObraAbertas\) \{\s*fecharAcoesObra\(\);\s*return;\s*\}\s*abrirAcoesObra\(\);/,
  );
});

test("cliente preserva os handlers de dominio e a denuncia fora do hook", () => {
  assert.match(
    cliente,
    /import \{ useObraActionsSheet \} from "\.\/hooks\/use-obra-actions-sheet";/,
  );
  assert.match(cliente, /\} = useObraActionsSheet\(\);/);
  assert.doesNotMatch(
    cliente,
    /useObraDialogInitialFocus\(acoesObraAbertas, acoesObraDialogRef\)/,
  );
  assert.match(
    cliente,
    /const salvarObraPeloMenu = \(\) => \{\s*fecharAcoesObra\(\);\s*void alternarFavoritoObra\(\);/,
  );
  assert.match(
    cliente,
    /const concluirObraPeloMenu = \(\) => \{\s*fecharAcoesObra\(\);\s*void alternarConcluirObra\(\);/,
  );
  assert.match(
    cliente,
    /const compartilharObraPeloMenu = \(\) => \{\s*fecharAcoesObra\(\);\s*void compartilharObraAtual\(\);/,
  );
  assert.match(
    cliente,
    /function abrirDenunciaObraAtual\(\)[\s\S]*?fecharAcoesObra\(false\)/,
  );
  assert.match(cliente, /manterFocoNoDialogo\(event, \(\) => fecharAcoesObra\(\)\)/);
});
