import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pageSource = readFileSync(
  new URL("../../app/aceitar-termos/page.tsx", import.meta.url),
  "utf8",
);
const translationsSource = readFileSync(
  new URL(
    "../../app/aceitar-termos/lib/aceitar-termos-translations.ts",
    import.meta.url,
  ),
  "utf8",
);
const stylesSource = readFileSync(
  new URL(
    "../../app/aceitar-termos/styles/aceitar-termos-styles.ts",
    import.meta.url,
  ),
  "utf8",
);

const translationKeys = [
  "titulo",
  "descricao",
  "termos",
  "diretrizes",
  "privacidade",
  "confirmacaoTermos",
  "confirmacaoPrivacidade",
  "aceitarContinuar",
  "aguarde",
  "jaAceito",
  "continuar",
  "erroLogin",
  "erroMarcar",
  "voltar",
];

const styleNames = [
  "pageStyle",
  "containerStyle",
  "backLinkStyle",
  "cardStyle",
  "markStyle",
  "titleStyle",
  "descriptionStyle",
  "linksStyle",
  "legalLinkStyle",
  "checksStyle",
  "checkLabelStyle",
  "checkboxStyle",
  "primaryButtonStyle",
  "statusStyle",
  "successStyle",
  "errorStyle",
];

test("traduções de Aceitar Termos preservam o catálogo estático", () => {
  assert.match(translationsSource, /export type ChaveTexto =/);
  assert.match(translationsSource, /export const TEXTOS: Record</);

  for (const language of ['"pt-BR"', "en", "es"]) {
    assert.match(translationsSource, new RegExp(`^  ${language}: \\{`, "m"));
  }

  for (const key of translationKeys) {
    assert.match(translationsSource, new RegExp(`\\| "${key}"`));
    assert.match(translationsSource, new RegExp(`\\b${key}:`));
  }

  assert.match(translationsSource, /ACEITE PARA PUBLICAR/);
  assert.match(translationsSource, /ACCEPTANCE REQUIRED TO PUBLISH/);
  assert.match(translationsSource, /ACEPTACIÓN PARA PUBLICAR/);
});

test("página mantém o useCallback de tradução dependente do idioma", () => {
  assert.match(
    pageSource,
    /import \{\s*TEXTOS,\s*type ChaveTexto,\s*\} from "\.\/lib\/aceitar-termos-translations";/,
  );
  assert.doesNotMatch(pageSource, /^type ChaveTexto =/m);
  assert.doesNotMatch(pageSource, /^const TEXTOS:/m);
  assert.match(
    pageSource,
    /const t = useCallback\(\(chave: ChaveTexto\) => TEXTOS\[language\]\[chave\], \[language\]\);/,
  );
});

test("estilos estáticos de Aceitar Termos preservam os contratos visuais", () => {
  assert.match(stylesSource, /^import type \{ CSSProperties \} from "react";/);
  assert.match(stylesSource, /export const aceitarTermosPageCss = `/);

  for (const styleName of styleNames) {
    assert.match(
      stylesSource,
      new RegExp(`export const ${styleName}: CSSProperties =`),
    );
  }

  assert.match(stylesSource, /100dvh/);
  assert.match(stylesSource, /clamp\(22px, 5vw, 38px\)/);
  assert.match(stylesSource, /#000000/);
  assert.match(stylesSource, /!important/);
});

test("página delega estáticos e preserva os pontos de integração", () => {
  assert.match(
    pageSource,
    /from "\.\/styles\/aceitar-termos-styles";/,
  );
  assert.doesNotMatch(pageSource, /^const \w+Style: CSSProperties =/m);
  assert.doesNotMatch(pageSource, /CSSProperties/);
  assert.doesNotMatch(pageSource, /^const pageCss =/m);
  assert.match(
    pageSource,
    /\{`\$\{historietasThemeCss\}\$\{aceitarTermosPageCss\}`\}/,
  );
  assert.match(pageSource, /useAceitarTermosInitialLoad\(/);
  assert.match(pageSource, /useAceitarTermosAction\(/);
  assert.match(pageSource, /onClick=\{\(\) => void aceitar\(\)\}/);
});

test("módulos estáticos não recebem runtime ou regras de aceite", () => {
  for (const source of [translationsSource, stylesSource]) {
    assert.doesNotMatch(source, /supabase/i);
    assert.doesNotMatch(source, /useEffect|useState|useCallback/);
    assert.doesNotMatch(source, /router|localStorage|MutationObserver/);
    assert.doesNotMatch(source, /registrarAceiteTermosPublicacao/);
    assert.doesNotMatch(source, /verificarAceiteTermosPublicacao/);
    assert.doesNotMatch(source, /<[a-z][a-z0-9-]*(?:\s|\/?>)/i);
  }
});
