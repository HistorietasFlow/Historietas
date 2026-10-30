import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pageSource = readFileSync(
  new URL("../../app/redefinir-senha/page.tsx", import.meta.url),
  "utf8",
);
const translationsSource = readFileSync(
  new URL(
    "../../app/redefinir-senha/lib/redefinir-senha-translations.ts",
    import.meta.url,
  ),
  "utf8",
);
const stylesSource = readFileSync(
  new URL(
    "../../app/redefinir-senha/styles/redefinir-senha-styles.ts",
    import.meta.url,
  ),
  "utf8",
);

const translationKeys = [
  "backHome",
  "title",
  "description",
  "checking",
  "invalidTitle",
  "invalidDescription",
  "requestNewLink",
  "newPassword",
  "confirmPassword",
  "passwordPlaceholder",
  "confirmPlaceholder",
  "saving",
  "savePassword",
  "passwordMin",
  "passwordComposition",
  "passwordMismatch",
  "sessionInvalid",
  "genericError",
];

const styleNames = [
  "pageStyle",
  "containerStyle",
  "headerStyle",
  "logoStyle",
  "logoMarkStyle",
  "logoTextStyle",
  "languageWrapperStyle",
  "languageSelectStyle",
  "cardStyle",
  "contentStyle",
  "titleStyle",
  "descriptionStyle",
  "statusStyle",
  "formStyle",
  "fieldStyle",
  "labelStyle",
  "inputStyle",
  "primaryButtonStyle",
  "primaryLinkStyle",
  "errorStyle",
];

test("traduções de Redefinir Senha preservam o catálogo e as chaves", () => {
  assert.match(translationsSource, /export type TranslationKey =/);
  assert.match(translationsSource, /export const TRANSLATIONS: Record</);

  for (const language of ['"pt-BR"', "en", "es"]) {
    assert.match(translationsSource, new RegExp(`^  ${language}: \\{`, "m"));
  }

  for (const key of translationKeys) {
    assert.match(translationsSource, new RegExp(`\\| "${key}"`));
    assert.match(translationsSource, new RegExp(`\\b${key}:`));
  }

  assert.match(translationsSource, /CRIAR NOVA SENHA/);
  assert.match(translationsSource, /CREATE A NEW PASSWORD/);
  assert.match(translationsSource, /CREAR NUEVA CONTRASEÑA/);
});

test("Redefinir Senha mantém a tradução por useCallback dependente do idioma", () => {
  assert.match(
    pageSource,
    /import \{\s*TRANSLATIONS,\s*type TranslationKey,\s*\} from "\.\/lib\/redefinir-senha-translations";/,
  );
  assert.doesNotMatch(pageSource, /^type TranslationKey =/m);
  assert.doesNotMatch(pageSource, /^const TRANSLATIONS:/m);
  assert.match(
    pageSource,
    /const t = useCallback\(\s*\(key: TranslationKey\) => TRANSLATIONS\[language\]\[key\],\s*\[language\],\s*\);/,
  );
});

test("estilos estáticos de Redefinir Senha preservam os contratos visuais", () => {
  assert.match(
    stylesSource,
    /^import type \{ CSSProperties \} from "react";/,
  );
  assert.match(stylesSource, /export const redefinirSenhaPageCss = `/);

  for (const styleName of styleNames) {
    assert.match(
      stylesSource,
      new RegExp(`export const ${styleName}: CSSProperties =`),
    );
  }

  assert.match(stylesSource, /100dvh/);
  assert.match(stylesSource, /clamp\(28px, 8vh, 86px\)/);
  assert.match(stylesSource, /colorScheme: "dark"/);
  assert.match(stylesSource, /!important/);
});

test("página delega estilos sem mover autenticação, effects ou regra de senha", () => {
  assert.match(
    pageSource,
    /from "\.\/styles\/redefinir-senha-styles";/,
  );
  assert.doesNotMatch(pageSource, /^const \w+Style: CSSProperties =/m);
  assert.doesNotMatch(pageSource, /CSSProperties/);
  assert.doesNotMatch(pageSource, /^const pageCss =/m);
  assert.match(
    pageSource,
    /\{`\$\{historietasThemeCss\}\$\{redefinirSenhaPageCss\}`\}/,
  );
  assert.match(pageSource, /useEffect\(\(\) =>/);
  assert.match(pageSource, /supabase\.auth\.updateUser/);
  assert.match(pageSource, /sessaoEhRecuperacao\(\)/);
  assert.match(pageSource, /\[A-Za-zÀ-ÖØ-öø-ÿ\]/);
});

test("módulos estáticos não recebem runtime ou regras da página", () => {
  for (const source of [translationsSource, stylesSource]) {
    assert.doesNotMatch(source, /supabase/i);
    assert.doesNotMatch(source, /useEffect|useState|useCallback/);
    assert.doesNotMatch(source, /localStorage|MutationObserver|router/);
    assert.doesNotMatch(source, /<[a-z][a-z0-9-]*(?:\s|\/?>)/i);
  }
});
