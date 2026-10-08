import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const classificationPanel = readFileSync(
  new URL(
    "../../app/obra/[slug]/components/obra-classification-panel.tsx",
    import.meta.url,
  ),
  "utf8",
);
const paginaObra = readFileSync(
  new URL("../../app/obra/[slug]/ObraDinamicaClient.tsx", import.meta.url),
  "utf8",
);
const hookClassificacao = readFileSync(
  new URL(
    "../../app/obra/[slug]/hooks/use-obra-classification-panel.ts",
    import.meta.url,
  ),
  "utf8",
);

test("painel preserva portal raiz backdrop e dialogo", () => {
  assert.match(classificationPanel, /createPortal\(/);
  assert.match(classificationPanel, /document\.body,/);
  assert.match(
    classificationPanel,
    /data-historietas-obra-classificacao-root="true"/,
  );
  assert.match(classificationPanel, /style=\{classificationPanelOverlayStyle\}/);
  assert.match(classificationPanel, /aria-label=\{textos\.titulo\}/);
  assert.match(classificationPanel, /aria-label=\{textos\.fechar\}/);
  assert.match(classificationPanel, /onClick=\{onFechar\}/);
  assert.match(classificationPanel, /style=\{classificationPanelBackdropStyle\}/);
  assert.match(classificationPanel, /ref=\{dialogRef\}/);
  assert.match(classificationPanel, /role="dialog"/);
  assert.match(classificationPanel, /aria-modal="true"/);
  assert.match(
    classificationPanel,
    /aria-labelledby="historietas-classificacao-title"/,
  );
  assert.match(classificationPanel, /tabIndex=\{-1\}/);
  assert.match(classificationPanel, /onKeyDown=\{onKeyDown\}/);
  assert.match(classificationPanel, /style=\{classificationPanelStyle\}/);
});

test("painel preserva badge titulo descricao e foco inicial", () => {
  assert.match(
    classificationPanel,
    /data-historietas-i18n-ignore="true"/,
  );
  assert.match(classificationPanel, /data-dialog-initial-focus="true"/);
  assert.match(classificationPanel, /style=\{classificationPanelCloseStyle\}/);
  assert.match(
    classificationPanel,
    /id="historietas-classificacao-title"/,
  );
  assert.match(classificationPanel, /\{textos\.titulo\}/);
  assert.match(classificationPanel, /\{textos\.descricao\}\{" "\}/);
  assert.match(classificationPanel, /\{classificacaoIndicativa\}/);

  const baseBadge = classificationPanel.indexOf(
    "...classificationPanelBadgeStyle",
  );
  const adultBadge = classificationPanel.indexOf(
    "? classificationPanelBadgeAdultStyle",
  );

  assert.ok(baseBadge >= 0);
  assert.ok(baseBadge < adultBadge);
  assert.match(
    classificationPanel,
    /ehClassificacao18\(classificacaoIndicativa\)/,
  );
});

test("painel preserva avisos 18 mais fallback e traducao", () => {
  assert.match(classificationPanel, /style=\{classificationWarningsStyle\}/);
  assert.match(
    classificationPanel,
    /\{avisosConteudo\.length > 0 \? \(/,
  );
  assert.match(classificationPanel, /avisosConteudo\.map\(\(aviso\) => \(/);
  assert.match(classificationPanel, /key=\{aviso\}/);
  assert.match(
    classificationPanel,
    /style=\{classificationWarningDotStyle\}\s*aria-hidden="true"/,
  );
  assert.match(
    classificationPanel,
    /traduzirAvisoConteudo18\(aviso, language\)/,
  );
  assert.match(classificationPanel, /style=\{classificationNoWarningsStyle\}/);
  assert.match(classificationPanel, /\{textos\.semAvisos\}/);
});

test("hook preserva estado refs foco e lifecycle do painel de classificacao", () => {
  assert.match(
    hookClassificacao,
    /export function useObraClassificationPanel\(\)/,
  );
  assert.match(hookClassificacao, /useState\(false\)/);
  assert.match(
    hookClassificacao,
    /useRef<HTMLElement \| null>\(null\)/,
  );
  assert.match(
    hookClassificacao,
    /useObraDialogInitialFocus\(\s*painelClassificacaoAberto,\s*classificacaoDialogRef,\s*\)/,
  );
  assert.match(
    hookClassificacao,
    /function abrirPainelClassificacaoObra\(\) \{\s*focoAntesClassificacaoRef\.current = obterElementoComFocoAtual\(\);\s*setPainelClassificacaoAberto\(true\);/,
  );
  assert.match(
    hookClassificacao,
    /function fecharPainelClassificacaoObra\(\) \{\s*const focoAnterior = focoAntesClassificacaoRef\.current;\s*focoAntesClassificacaoRef\.current = null;\s*setPainelClassificacaoAberto\(false\);\s*restaurarFocoAnterior\(focoAnterior\);/,
  );
  assert.match(
    hookClassificacao,
    /const resetarPainelClassificacaoObra = useCallback\(\(\) => \{\s*setPainelClassificacaoAberto\(false\);\s*\}, \[\]\);/,
  );
});

test("cliente preserva condicao ref foco e composicao do painel", () => {
  assert.match(
    paginaObra,
    /obra && painelClassificacaoAberto && typeof document !== "undefined"/,
  );
  assert.match(
    paginaObra,
    /import \{ useObraClassificationPanel \} from "\.\/hooks\/use-obra-classification-panel";/,
  );
  assert.match(paginaObra, /\} = useObraClassificationPanel\(\);/);
  assert.match(hookClassificacao, /const classificacaoDialogRef = useRef<HTMLElement \| null>\(null\)/);
  assert.match(hookClassificacao, /function fecharPainelClassificacaoObra\(\)/);
  assert.match(
    paginaObra,
    /const fecharPaineisTimer = window\.setTimeout\(\(\) => \{\s*setSinopseAberta\(false\);\s*resetarPainelClassificacaoObra\(\);\s*\}, 0\);/,
  );
  assert.match(
    paginaObra,
    /\}, \[obra\?\.id, resetarPainelClassificacaoObra\]\);/,
  );
  assert.match(
    paginaObra,
    /<ObraClassificationPanel\s*classificacaoIndicativa=\{obra\.classificacaoIndicativa\}\s*avisosConteudo=\{obra\.avisosConteudo\}\s*language=\{language\}\s*textos=\{textosPainelClassificacao\}\s*dialogRef=\{classificacaoDialogRef\}\s*onFechar=\{fecharPainelClassificacaoObra\}/,
  );
  assert.match(
    paginaObra,
    /onKeyDown=\{\(event\) =>\s*manterFocoNoDialogo\(event, fecharPainelClassificacaoObra\)\s*\}/,
  );
  assert.doesNotMatch(classificationPanel, /forwardRef|manterFocoNoDialogo|useState|useEffect/);
});
