import assert from "node:assert/strict";
import test from "node:test";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loadApplicationModule as load } from "../helpers/load-application-module.mjs";

for (const language of ["pt-BR", "en", "es"]) {
  for (const estado of ["verificando", "valido", "invalido"]) {
    test(`página anuncia ${estado} e mantém mensagens acessíveis em ${language}`, () => {
      let i = 0;
      const values = [estado, "", "", "Falha de sessão fixture", true];
      const { default: Page } = load("app/redefinir-senha/page.tsx", {
        react: { ...React, useState: () => [values[i++], () => {}] },
        "next/link": { default: ({ children, ...props }) => React.createElement("a", props, children) },
        "next/navigation": { useRouter: () => ({}) },
        "../../components/LanguageSelect": { default: () => null },
        "../../components/HistorietasLanguageProvider": { useHistorietasLanguage: () => ({ language }) },
        "../../lib/historietasTheme": { historietasThemeCss: "", useHistorietasTheme: style => ({ pageThemeStyle: style }) },
        "./hooks/use-redefinir-senha-recovery-validation": { useRedefinirSenhaRecoveryValidation: () => ({ current: {} }) },
        "./hooks/use-redefinir-senha-save-action": { useRedefinirSenhaSaveAction: () => ({ salvarNovaSenha() {} }) },
      });
      const html = renderToStaticMarkup(React.createElement(Page));
      assert.match(html, /role="alert" aria-live="assertive"[^>]*>Falha de sessão fixture<\/span>/);
      if (estado === "verificando") assert.match(html, /role="status" aria-live="polite"/);
      if (estado === "valido") {
        assert.match(html, /<form aria-busy="true"/);
        assert.equal((html.match(/type="password"/g) || []).length, 2);
        assert.equal((html.match(/autoComplete="new-password"/g) || []).length, 2);
        assert.match(html, /<button type="submit" disabled=""/);
      } else assert.doesNotMatch(html, /<form|type="password"/);
      if (estado === "invalido") assert.match(html, /<div role="alert" aria-live="assertive"/);
    });
  }
}
