import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const componente = readFileSync(
  new URL("../../app/ajuda/components/ajuda-faq-section.tsx", import.meta.url),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/ajuda/page.tsx", import.meta.url),
  "utf8",
);

test("a FAQ preserva contador, detalhes, fallback de ícone e estado vazio", () => {
  assert.match(componente, /export function AjudaFaqSection/);
  assert.match(componente, /perguntas: PerguntaAjuda\[\]/);
  assert.match(componente, /categoriaSelecionada: CategoriaAjuda/);
  assert.match(componente, /perguntas\.length === 1/);
  assert.match(componente, /"resposta"/);
  assert.match(componente, /"respostas"/);
  assert.match(componente, /perguntas\.length > 0/);
  assert.match(componente, /perguntas\.map\(/);
  assert.match(componente, /CATEGORIAS_AJUDA\.find\(/);
  assert.match(componente, /<details key=\{item\.id\} className="ajuda-faq-details">/);
  assert.match(componente, /className="ajuda-faq-summary"/);
  assert.match(componente, /className="ajuda-faq-icon"/);
  assert.match(componente, /className="ajuda-faq-chevron"/);
  assert.match(componente, /categoria\?\.icon \|\| "help"/);
  assert.match(componente, /name="chevronDown"/);
  assert.match(componente, /className="ajuda-faq-question"/);
  assert.match(componente, /className="ajuda-faq-answer"/);
  assert.match(componente, /"Nenhuma resposta encontrada"/);
  assert.match(componente, /className="ajuda-reset-button"/);
  assert.match(componente, /onClick=\{onReset\}/);
  assert.doesNotMatch(componente, /supabase|useEffect|useState/);
});

test("a página mantém as derivações e fornece callbacks de reset à FAQ", () => {
  assert.match(
    pagina,
    /import \{\s*AjudaFaqSection,\s*\} from "\.\/components\/ajuda-faq-section";/,
  );
  assert.match(pagina, /const perguntasFiltradas =[\s\S]*?useMemo\(/);
  assert.match(pagina, /const categoriaSelecionada =[\s\S]*?obterCategoriaAjudaSelecionada\(/);
  assert.match(pagina, /<AjudaFaqSection[\s\S]*?perguntas=\{perguntasFiltradas\}[\s\S]*?categoriaSelecionada=\{categoriaSelecionada\}[\s\S]*?setBusca\(""\);[\s\S]*?setCategoriaAtiva\("todos"\);/);
  assert.doesNotMatch(pagina, /perguntasFiltradas\.map\(/);
  assert.doesNotMatch(pagina, /className="ajuda-faq-details"/);
});
