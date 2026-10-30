import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const componente = readFileSync(
  new URL("../../app/ajuda/components/ajuda-categories-section.tsx", import.meta.url),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/ajuda/page.tsx", import.meta.url),
  "utf8",
);

test("a seção de categorias preserva lista, estado ativo, classes e callback", () => {
  assert.match(componente, /export function AjudaCategoriesSection/);
  assert.match(componente, /categoriaAtiva: CategoriaAjudaId/);
  assert.match(componente, /CATEGORIAS_AJUDA\.map\(/);
  assert.match(componente, /pt: "ASSUNTOS"/);
  assert.match(componente, /en: "TOPICS"/);
  assert.match(componente, /es: "TEMAS"/);
  assert.match(componente, /id="categorias-ajuda-titulo"/);
  assert.match(componente, /const ativa = categoria\.id === categoriaAtiva/);
  assert.match(componente, /type="button"/);
  assert.match(componente, /className="ajuda-category-button"/);
  assert.match(componente, /data-active=\{ativa \? "true" : "false"\}/);
  assert.match(componente, /aria-pressed=\{ativa\}/);
  assert.match(componente, /className="ajuda-category-icon"/);
  assert.match(componente, /className="ajuda-category-copy"/);
  assert.match(componente, /<SvgIcon name=\{categoria\.icon\} size=\{23\} strokeWidth=\{2\.05\}/);
  assert.match(componente, /onSelecionarCategoria\(categoria\.id\)/);
  assert.doesNotMatch(componente, /supabase|useEffect|useState/);
});

test("a página mantém a categoria ativa e delega somente a seção visual", () => {
  assert.match(
    pagina,
    /import \{\s*AjudaCategoriesSection,\s*\} from "\.\/components\/ajuda-categories-section";/,
  );
  assert.match(pagina, /useState<CategoriaAjudaId>\("todos"\)/);
  assert.match(pagina, /<AjudaCategoriesSection[\s\S]*?categoriaAtiva=\{categoriaAtiva\}[\s\S]*?onSelecionarCategoria=\{setCategoriaAtiva\}/);
  assert.doesNotMatch(pagina, /CATEGORIAS_AJUDA\.map\(/);
});
