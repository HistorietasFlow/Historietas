import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pagina = await readFile("app/em-breve/page.tsx", "utf8");
const modulo = await readFile("app/em-breve/lib/em-breve-route-utils.ts", "utf8");

test("helpers de rota de Em Breve preservam leitura de parametros e redirect seguro", () => {
  [
    "export function pegarParametro",
    "Array.isArray(parametro)",
    'parametro[0]?.trim() || ""',
    'parametro?.trim() || ""',
    "export function criarLoginHrefEmBreve",
    "window.location.pathname",
    "window.location.search",
    '"/em-breve"',
    'redirectTo.startsWith("/")',
    '!redirectTo.startsWith("//")',
    "new URLSearchParams",
    "redirectTo: destinoSeguro",
    "return `/login?${params.toString()}`",
  ].forEach((contrato) => assert.ok(modulo.includes(contrato), contrato));

  assert.doesNotMatch(
    modulo,
    /supabase|useEffect|useState|localStorage|MutationObserver|\.from\(|\.update\(/,
  );
});

test("pagina usa os helpers de rota sem manter as declaracoes locais", () => {
  assert.match(
    pagina,
    /import \{\s*criarLoginHrefEmBreve,\s*pegarParametro,\s*\} from "\.\/lib\/em-breve-route-utils"/s,
  );
  assert.doesNotMatch(pagina, /function pegarParametro/);
  assert.doesNotMatch(pagina, /function criarLoginHrefEmBreve/);
  assert.equal((pagina.match(/pegarParametro\(/g) || []).length, 2);
  assert.equal((pagina.match(/criarLoginHrefEmBreve\(/g) || []).length, 1);
});
