import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pageSource = readFileSync(
  new URL("../../app/editar-capitulo/page.tsx", import.meta.url),
  "utf8",
);
const bridgeSource = readFileSync(
  new URL(
    "../../app/editar-capitulo/components/EditarCapituloLanguageBridge.tsx",
    import.meta.url,
  ),
  "utf8",
);

test("Editar Capítulo delega somente a bridge de tradução", () => {
  assert.match(
    pageSource,
    /import \{ EditarCapituloLanguageBridge \} from "\.\/components\/EditarCapituloLanguageBridge";/,
  );
  assert.doesNotMatch(pageSource, /EDITAR_CAPITULO_UI_TRANSLATIONS/);
  assert.doesNotMatch(pageSource, /function traduzirTextoEditarCapitulo/);
  assert.doesNotMatch(pageSource, /function EditarCapituloLanguageBridge/);
  assert.equal(
    pageSource.match(/<EditarCapituloLanguageBridge \/>/g)?.length,
    3,
  );
});

test("bridge preserva traduções exatas e padrões dinâmicos", () => {
  for (const trecho of [
    "EDITAR_CAPITULO_UI_TRANSLATIONS",
    '"Capítulo não encontrado"',
    '"EDITAR CAPÍTULO"',
    "/^Não consegui atualizar o capítulo no Supabase:\\s*([\\s\\S]+)$/i.exec(",
    "function traduzirTextoEditarCapitulo",
    'idioma === "pt-BR"',
    "/^(\\s*)([\\s\\S]*?)(\\s*)$/.exec(texto)",
    "/^Capítulo\\s+(\\d+)$/i.exec(conteudo)",
    "/^Ex:\\s*Capítulo\\s+(\\d+)$/i.exec(conteudo)",
    "/^Notificações:\\s*(\\d+)\\s*não lidas$/i.exec(conteudo)",
    "/^(.*?)\\s*•\\s*(\\d+)\\s*palavras\\s*•\\s*(\\d+)\\s*min$/i.exec(",
    "/^Não consegui confirmar sua permissão para editar o capítulo:\\s*([\\s\\S]+)$/i.exec(",
    "/^Não consegui atualizar o capítulo no Supabase:\\s*([\\s\\S]+)$/i.exec(",
  ]) {
    assert.ok(bridgeSource.includes(trecho), trecho);
  }
});

test("bridge preserva observer, filtros e cleanup condicional", () => {
  assert.match(
    bridgeSource,
    /import \{ useHistorietasLanguage \} from "\.\.\/\.\.\/\.\.\/components\/HistorietasLanguageProvider";/,
  );
  assert.match(
    bridgeSource,
    /import type \{ HistorietasLanguage \} from "\.\.\/\.\.\/\.\.\/lib\/i18n";/,
  );
  for (const trecho of [
    '"[data-historietas-editar-capitulo-root=\'true\']"',
    '"[data-historietas-i18n-ignore=\'true\']"',
    'tag === "script" || tag === "style"',
    'elementoPai?.tagName.toLowerCase() === "textarea"',
    'const atributosTraduziveis = ["aria-label", "title", "placeholder", "alt"]',
    "const estadosTexto: WeakMap<Text, EstadoTraducaoEditarCapitulo> = new WeakMap()",
    "const estadosAtributos: WeakMap<",
    "const textosAlterados = new Set<Text>()",
    "const atributosAlterados: Array<{ elemento: Element; atributo: string }> = []",
    "let aplicando = false",
    "new MutationObserver",
    "attributeFilter: atributosTraduziveis",
    "observador.disconnect()",
    "no.isConnected && no.data === estado.traduzido",
    "registro.elemento.getAttribute(registro.atributo) === estado.traduzido",
    "}, [language]);",
  ]) {
    assert.ok(bridgeSource.includes(trecho), trecho);
  }
});
