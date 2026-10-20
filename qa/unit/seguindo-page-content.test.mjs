import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(
  new URL("../../app/seguindo/page.tsx", import.meta.url),
  "utf8",
);
const content = readFileSync(
  new URL("../../app/seguindo/components/seguindo-page-content.tsx", import.meta.url),
  "utf8",
);

test("Seguindo preserva a orquestração na página e delega somente o conteúdo visual", () => {
  assert.match(
    page,
    /import \{ SeguindoPageContent \} from "\.\/components\/seguindo-page-content";/,
  );
  assert.match(page, /<SeguindoPageContent[\s\S]*?totalSemFiltros=\{totalSemFiltros\}/);
  assert.match(page, /useSeguindoPageInitialSync\(/);
  assert.match(page, /useSeguindoUserSearchSync\(/);
  assert.match(page, /useSeguindoContentTabNavigation\(/);
});

test("o conteúdo preserva estados vazios, obras e pessoas sem dados remotos", () => {
  assert.match(content, /^"use client";/);
  assert.match(content, /totalSemFiltros === 0 && !buscaSugestoesUsuariosAtiva/);
  assert.match(content, /obterMensagemEstadoVazioSeguindo\(/);
  assert.match(content, /Nada encontrado/);
  assert.match(content, /abaConteudo === "obras"/);
  assert.match(content, /<SeguindoWorksSection/);
  assert.match(content, /<SeguindoPeopleSections/);
  assert.match(content, /onDeixarDeSeguirObra=\{onDeixarDeSeguirObra\}/);
  assert.match(content, /onResponderSolicitacao=\{onResponderSolicitacao\}/);
  assert.match(content, /onSeguirUsuarioSugestao=\{onSeguirUsuarioSugestao\}/);
  assert.doesNotMatch(content, /supabase|localStorage|useEffect|useState/);
});
