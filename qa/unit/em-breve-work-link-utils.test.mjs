import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pagina = await readFile("app/em-breve/page.tsx", "utf8");
const modulo = await readFile(
  "app/em-breve/lib/em-breve-work-link-utils.ts",
  "utf8",
);

test("helpers de links preservam parametros e fallbacks", () => {
  [
    "URLSearchParams",
    "obraId: obra.id",
    "obra: obra.titulo",
    "return `/em-breve?${params.toString()}`",
    'obra.titulo?.trim() || "obra"',
    "obra.slug?.trim() || criarSlugBase(titulo)",
    'obra.link?.trim() || ""',
    '!link.startsWith("/em-breve")',
    "`/obra/${slug}`",
    'import type {',
    "ObraEmBreveCard",
    "SupabaseObraEmBreveRow",
  ].forEach((contrato) => assert.ok(modulo.includes(contrato), contrato));

  assert.doesNotMatch(
    modulo,
    /supabase|\.from\(|useEffect|useState|router|localStorage|MutationObserver/,
  );
});

test("pagina delega links e preserva a orquestracao", () => {
  assert.match(pagina, /from "\.\/lib\/em-breve-work-link-utils"/);
  assert.doesNotMatch(pagina, /function criarLinkCardEmBreve/);
  assert.doesNotMatch(pagina, /function criarLinkObraPublicadaEmBreve/);
  assert.doesNotMatch(pagina, /import \{ criarSlugBase,/);
  assert.match(pagina, /async function encontrarLinkObraComConteudoEmBreve/);
  assert.ok((pagina.match(/criarLinkObraPublicadaEmBreve\(/g) || []).length >= 2);
  assert.ok((pagina.match(/criarLinkCardEmBreve\(/g) || []).length >= 2);
});
