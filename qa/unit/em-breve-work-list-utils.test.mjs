import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pagina = await readFile("app/em-breve/page.tsx", "utf8");
const modulo = await readFile("app/em-breve/lib/em-breve-work-list-utils.ts", "utf8");

test("helpers de lista de obras de Em Breve preservam contratos puros", () => {
  [
    "Array.isArray(valor)",
    'typeof id === "string"',
    "id.trim()",
    "new Set",
    "criarSlugBase(obra.titulo)",
    "normalizarTexto(obra.titulo)",
    "listaNormalizada.has(id)",
    'import type { ObraEmBreveCard }',
    "new Set(obterIdentificadoresObraEmBreve(obra))",
    "normalizarListaIdsEmBreve(lista)",
    "!idsObra.has(id)",
    "const obraId = obra.id.trim()",
    "removerObraDaListaEmBreve(obra, lista)",
    "obraId ? [obraId] : obterIdentificadoresObraEmBreve(obra)",
    "new Map<string, string>()",
    "obraIdPorIdentificador.set",
    "obraIdPorIdentificador.get(identificador) || identificador",
    "removerObrasDuplicadasEmBreve",
    "new Set<string>()",
    "normalizarTexto(obra.titulo) || obra.id",
    "obrasVistas.has(chave)",
    "obrasVistas.add(chave)",
  ].forEach((contrato) => assert.ok(modulo.includes(contrato), contrato));
  assert.doesNotMatch(
    modulo,
    /supabase\/client|supabase\.from\(|useEffect|useState|router|localStorage|MutationObserver|\.update\(/,
  );
});

test("pagina delega identificacao e mantem helpers de lista adjacentes", () => {
  assert.match(pagina, /from "\.\/lib\/em-breve-work-list-utils"/);
  assert.doesNotMatch(pagina, /function normalizarListaIdsEmBreve/);
  assert.doesNotMatch(pagina, /function obterIdentificadoresObraEmBreve/);
  assert.doesNotMatch(pagina, /function listaTemObraEmBreve/);
  assert.doesNotMatch(pagina, /function removerObraDaListaEmBreve/);
  assert.doesNotMatch(pagina, /function adicionarObraNaListaEmBreve/);
  assert.doesNotMatch(pagina, /function normalizarLancamentosSalvosComObrasEmBreve/);
  assert.doesNotMatch(pagina, /function removerObrasDuplicadasEmBreve/);
  assert.match(pagina, /removerObrasDuplicadasEmBreve\(obrasReaisEmBreve\)/);
});
