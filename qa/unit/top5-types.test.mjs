import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const typesPath = new URL(
  "../../app/perfil-autor/top-5/lib/top5-types.ts",
  import.meta.url,
);
const pagePath = new URL(
  "../../app/perfil-autor/top-5/page.tsx",
  import.meta.url,
);

test("Top 5 delega somente os tipos e modelos para módulo dedicado", async () => {
  const [types, page] = await Promise.all([
    readFile(typesPath, "utf8"),
    readFile(pagePath, "utf8"),
  ]);

  for (const typeName of [
    "CapituloLocal",
    "ArquivoObraLocal",
    "ObraTop5",
    "ObraTop5Salva",
    "SupabaseObraTop5Row",
    "UsuarioTop5",
  ]) {
    assert.match(types, new RegExp(`export type ${typeName}`));
    assert.doesNotMatch(page, new RegExp(`type ${typeName} =`));
  }

  assert.match(
    types,
    /categoria: "texto" \| "documento" \| "imagem" \| "outro";/,
  );
  assert.match(types, /arquivoObra\?: ArquivoObraLocal \| null;/);
  assert.match(types, /capitulos: CapituloLocal\[\];/);
  assert.match(types, /Partial<ObraTop5> & Record<string, unknown>/);
  assert.match(types, /Record<string, unknown>/);

  assert.match(page, /import type \{[\s\S]*from "\.\/lib\/top5-types";/);
  assert.match(page, /normalizarCategoriaArquivo\(tipo: string\): ArquivoObraLocal/);
  assert.match(page, /normalizarCapituloTop5\([\s\S]*CapituloLocal/);
  assert.match(page, /normalizarObraLocalTop5\(obra: ObraTop5Salva/);
  assert.match(page, /normalizarObraSupabaseTop5\(row: SupabaseObraTop5Row/);
  assert.match(page, /useState<UsuarioTop5 \| null>/);
  assert.match(page, /useState<ObraTop5\[\]>/);

  for (const forbidden of [
    "react",
    "useEffect",
    "supabase",
    "auth",
    "useRouter",
    "localStorage",
    "function ",
    ".insert(",
    ".delete(",
    "STORAGE_KEY",
  ]) {
    assert.doesNotMatch(types, new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});
