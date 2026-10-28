import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pagina = await readFile("app/em-breve/page.tsx", "utf8");
const modulo = await readFile(
  "app/em-breve/lib/em-breve-work-normalizers.ts",
  "utf8",
);

test("normalizadores de obra de Em Breve preservam tipos e fallbacks", () => {
  [
    "SupabaseObraEmBreveRow",
    "ObraEmBreveCard",
    "id:",
    "user_id:",
    "classificacao_indicativa:",
    "arquivo_url:",
    'origem: "supabase"',
    '"Obra sem título"',
    '"Autor não informado"',
    '"Não informado"',
    '"Original"',
    'views: "0"',
    'likes: "0"',
    'comentarios: "0"',
    "obra.arquivo_url?.trim()",
    "criarSlugBase(titulo)",
    "`/obra/${slug}`",
  ].forEach((contrato) => assert.ok(modulo.includes(contrato), contrato));
  assert.doesNotMatch(
    modulo,
    /supabase\/client|\.from\(|useEffect|useState|router|localStorage|MutationObserver|\.update\(/,
  );
});

test("pagina consome os normalizadores sem manter declaracoes locais", () => {
  assert.match(pagina, /from "\.\/lib\/em-breve-work-normalizers"/);
  assert.doesNotMatch(pagina, /type SupabaseObraEmBreveRow =/);
  assert.doesNotMatch(pagina, /type ObraEmBreveCard =/);
  assert.doesNotMatch(pagina, /function obraSupabaseTemArquivoEmBreve/);
  assert.doesNotMatch(pagina, /function normalizarObraSupabaseEmBreve/);
  assert.equal((pagina.match(/obraSupabaseTemArquivoEmBreve\(/g) || []).length, 2);
  assert.equal((pagina.match(/normalizarObraSupabaseEmBreve\(/g) || []).length, 1);
});
