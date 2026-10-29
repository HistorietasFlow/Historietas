import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const identifiersPath = new URL(
  "../../app/perfil-autor/top-5/lib/top5-work-identifiers.ts",
  import.meta.url,
);
const pagePath = new URL(
  "../../app/perfil-autor/top-5/page.tsx",
  import.meta.url,
);

test("Top 5 delega somente os identificadores e a chave canônica de obras", async () => {
  const [identifiers, page] = await Promise.all([
    readFile(identifiersPath, "utf8"),
    readFile(pagePath, "utf8"),
  ]);

  assert.match(
    identifiers,
    /import \{ criarSlugBase, normalizarTexto \} from "\.\.\/\.\.\/\.\.\/\.\.\/lib\/utils";/,
  );
  assert.match(identifiers, /import type \{ ObraTop5 \} from "\.\/top5-types";/);
  assert.match(identifiers, /export function obterIdentificadoresObraTop5/);
  assert.match(identifiers, /export function criarChaveObraTop5/);

  const indiceId = identifiers.indexOf("obra.id");
  const indiceSlug = identifiers.indexOf("obra.slug");
  const indiceSlugBase = identifiers.indexOf("criarSlugBase(obra.titulo)");
  const indiceTituloNormalizado = identifiers.indexOf(
    "normalizarTexto(obra.titulo)",
  );

  assert.ok(indiceId < indiceSlug);
  assert.ok(indiceSlug < indiceSlugBase);
  assert.ok(indiceSlugBase < indiceTituloNormalizado);
  assert.match(identifiers, /new Set\(/);
  assert.match(identifiers, /identificador\.trim\(\)/);
  assert.match(identifiers, /\.filter\(Boolean\)/);
  assert.match(
    identifiers,
    /return obterIdentificadoresObraTop5\(obra\)\[0\] \|\| "";/,
  );

  assert.match(
    page,
    /import \{[\s\S]*criarChaveObraTop5,[\s\S]*obterIdentificadoresObraTop5,[\s\S]*from "\.\/lib\/top5-work-identifiers";/,
  );
  assert.doesNotMatch(page, /function obterIdentificadoresObraTop5/);
  assert.doesNotMatch(page, /function criarChaveObraTop5/);
  assert.match(page, /obterIdentificadoresObraTop5\(/);
  assert.match(page, /criarChaveObraTop5\(/);
  assert.match(
    page,
    /import \{ normalizarTexto \} from "\.\.\/\.\.\/\.\.\/lib\/utils";/,
  );
  assert.doesNotMatch(page, /criarSlugBase/);

  for (const forbidden of [
    "react",
    "useEffect",
    "supabase",
    "auth",
    "useRouter",
    "localStorage",
    "STORAGE_KEY",
    ".insert(",
    ".delete(",
    "style={",
  ]) {
    assert.doesNotMatch(
      identifiers,
      new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    );
  }
});
