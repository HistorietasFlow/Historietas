import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const bridge = readFileSync(
  new URL(
    "../../app/notificacoes/components/notificacoes-language-bridge.tsx",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/notificacoes/page.tsx", import.meta.url),
  "utf8",
);
const bridgeExecutavel = bridge
  .replace('import { useEffect } from "react";\n', "")
  .replace(
    'import { useHistorietasLanguage } from "../../../components/HistorietasLanguageProvider";\n',
    'const useHistorietasLanguage = () => ({ language: "pt-BR" });\n',
  )
  .replace(
    'import { normalizarTexto } from "../../../lib/utils";\n',
    [
      'const normalizarTexto = (texto) => String(texto ?? "")',
      '  .normalize("NFD")',
      '  .replace(/[\\u0300-\\u036f]/g, "")',
      "  .toLowerCase();",
    ].join("\n") + "\n",
  )
  .replace('import type { HistorietasLanguage } from "../../../lib/i18n";\n', "");
const bridgeJavascript = typescript.transpileModule(bridgeExecutavel, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const { traduzirTextoNotificacoes } = await import(
  `data:text/javascript;base64,${Buffer.from(bridgeJavascript).toString("base64")}`,
);

test("traduz textos das notificacoes sem alterar o original em portugues", () => {
  assert.equal(
    traduzirTextoNotificacoes("Notifica\u00e7\u00f5es", "pt-BR"),
    "Notifica\u00e7\u00f5es",
  );
  assert.equal(
    traduzirTextoNotificacoes("Notifica\u00e7\u00f5es", "en"),
    "Notifications",
  );
  assert.equal(
    traduzirTextoNotificacoes("Notifica\u00e7\u00f5es", "es"),
    "Notificaciones",
  );
  assert.equal(
    traduzirTextoNotificacoes("  Notifica\u00e7\u00f5es\n", "en"),
    "  Notifications\n",
  );
});

test("traduz datas, padroes dinamicos e status especializados", () => {
  assert.equal(
    traduzirTextoNotificacoes("5 de mar\u00e7o de 2026", "en"),
    "March 5, 2026",
  );
  assert.equal(
    traduzirTextoNotificacoes("Abrir perfil de Ana", "en"),
    "Open Ana's profile",
  );
  assert.equal(
    traduzirTextoNotificacoes("Den\u00fancia em an\u00e1lise", "en"),
    "Report under review",
  );
  assert.equal(
    traduzirTextoNotificacoes(
      'Seu chamado t\u00e9cnico "Erro" foi atualizado para resolvido.',
      "es",
    ),
    'Tu solicitud t\u00e9cnica "Erro" fue actualizada a resuelto.',
  );
  assert.equal(
    traduzirTextoNotificacoes("Texto sem mapeamento", "en"),
    "Texto sem mapeamento",
  );
});

test("mantem a ponte de idioma isolada da pagina e com o contrato do observador", () => {
  assert.match(
    bridge,
    /\[data-historietas-notificacoes-root='true'\], \[data-historietas-notificacoes-overlay='true'\]/,
  );
  assert.match(
    bridge,
    /\[data-historietas-i18n-ignore='true'\]/,
  );
  assert.match(
    bridge,
    /const atributosTraduziveis = \["aria-label", "title", "placeholder", "alt"\];/,
  );
  assert.match(bridge, /new MutationObserver/);
  assert.match(
    bridge,
    /observador\.observe\(document\.body, \{\s*subtree: true,\s*childList: true,\s*characterData: true,\s*attributes: true,\s*attributeFilter: atributosTraduziveis,\s*\}\);/,
  );

  const indiceDisconnect = bridge.indexOf("observador.disconnect();");
  const indiceRestauracaoTexto = bridge.indexOf("textosAlterados.forEach");

  assert.ok(indiceDisconnect >= 0);
  assert.ok(indiceRestauracaoTexto > indiceDisconnect);
  assert.match(
    bridge,
    /estado && no\.isConnected && no\.data === estado\.traduzido/,
  );
  assert.match(
    bridge,
    /registro\.elemento\.isConnected[\s\S]*?getAttribute\(registro\.atributo\) ===\s*estado\.traduzido/,
  );
  assert.match(
    pagina,
    /import NotificacoesLanguageBridge from "\.\/components\/notificacoes-language-bridge";/,
  );
  assert.equal(
    (pagina.match(/<NotificacoesLanguageBridge \/>/g) || []).length,
    2,
  );
  assert.doesNotMatch(pagina, /function NotificacoesLanguageBridge/);
  assert.doesNotMatch(pagina, /NOTIFICACOES_UI_TRANSLATIONS/);
});
