import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const componente = readFileSync(
  new URL("../../app/ajuda/components/ajuda-header-hero.tsx", import.meta.url),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/ajuda/page.tsx", import.meta.url),
  "utf8",
);

test("o header, hero e busca da Ajuda preservam conteúdo, acessibilidade e callbacks", () => {
  assert.match(componente, /export function AjudaHeaderHero/);
  assert.match(componente, /href="\/configuracoes"/);
  assert.match(componente, /aria-label=\{t\(/);
  assert.match(componente, /name="arrowLeft" size=\{25\} strokeWidth=\{2\.35\}/);
  assert.match(componente, /pt: "SUPORTE"/);
  assert.match(componente, /en: "SUPPORT"/);
  assert.match(componente, /es: "SOPORTE"/);
  assert.match(componente, /pt: "Central de ajuda"/);
  assert.match(componente, /en: "Help center"/);
  assert.match(componente, /es: "Centro de ayuda"/);
  assert.match(componente, /name="help" size=\{31\} strokeWidth=\{2\.15\}/);
  assert.match(componente, /pt: "Como podemos ajudar\?"/);
  assert.match(componente, /en: "How can we help\?"/);
  assert.match(componente, /pt: "Digite sua dúvida\.\.\."/);
  assert.match(componente, /en: "Type your question\.\.\."/);
  assert.match(componente, /es: "Escribe tu duda\.\.\."/);
  assert.match(componente, /id="buscar-ajuda"/);
  assert.match(componente, /className="ajuda-search-input"/);
  assert.match(componente, /maxLength=\{100\}/);
  assert.match(componente, /autoComplete="off"/);
  assert.match(componente, /onBuscaChange\(event\.target\.value\)/);
  assert.match(componente, /\{busca \? \(/);
  assert.match(componente, /className="ajuda-clear-button"/);
  assert.match(componente, />\s*×\s*<\/button>/);
  assert.match(componente, /pt: "Limpar busca"/);
  assert.match(componente, /en: "Clear search"/);
  assert.match(componente, /es: "Borrar búsqueda"/);
  assert.match(componente, /onClick=\{onLimparBusca\}/);
});

test("a página mantém o estado de busca e delega somente a apresentação", () => {
  assert.match(
    pagina,
    /import \{\s*AjudaHeaderHero,\s*\} from "\.\/components\/ajuda-header-hero";/,
  );
  assert.match(pagina, /const \[busca, setBusca\] = useState\(""\);/);
  assert.match(pagina, /<AjudaHeaderHero[\s\S]*?busca=\{busca\}[\s\S]*?onBuscaChange=\{setBusca\}[\s\S]*?onLimparBusca=\{\(\) => setBusca\(""\)\}/);
  assert.doesNotMatch(pagina, /id="buscar-ajuda"/);
  assert.doesNotMatch(componente, /supabase|useEffect|useState/);
});
