import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const normalizersPath = new URL(
  "../../app/perfil-autor/top-5/lib/top5-work-normalizers.ts",
  import.meta.url,
);
const pagePath = new URL(
  "../../app/perfil-autor/top-5/page.tsx",
  import.meta.url,
);

test("Top 5 delega somente os normalizadores de obra para módulo dedicado", async () => {
  const [normalizers, page] = await Promise.all([
    readFile(normalizersPath, "utf8"),
    readFile(pagePath, "utf8"),
  ]);

  assert.match(normalizers, /import \{ criarSlugBase \} from "\.\.\/\.\.\/\.\.\/\.\.\/lib\/utils";/);
  assert.match(normalizers, /from "\.\/top5-types";/);
  assert.match(normalizers, /export function normalizarObraLocalTop5/);
  assert.match(normalizers, /export function normalizarObraSupabaseTop5/);
  assert.match(normalizers, /export function pegarTexto/);

  for (const helper of [
    "pegarNumero",
    "pegarBooleano",
    "pegarTags",
    "normalizarCategoriaArquivo",
    "normalizarArquivoObra",
    "normalizarCapituloTop5",
  ]) {
    assert.match(normalizers, new RegExp(`function ${helper}`));
    assert.doesNotMatch(normalizers, new RegExp(`export function ${helper}`));
    assert.doesNotMatch(page, new RegExp(`function ${helper}`));
  }

  assert.doesNotMatch(page, /function pegarTexto/);

  for (const exported of ["normalizarObraLocalTop5", "normalizarObraSupabaseTop5"]) {
    assert.doesNotMatch(page, new RegExp(`function ${exported}`));
  }

  for (const text of [
    "sem tags",
    "Capítulo sem título",
    "Autor não informado",
    "Não informado",
    "Não informada",
  ]) {
    assert.match(normalizers, new RegExp(text));
  }

  assert.match(normalizers, /valor\.replace\(\/\\\.\/g, ""\)\.replace\(",", "\."\)/);
  assert.match(normalizers, /"texto"/);
  assert.match(normalizers, /"documento"/);
  assert.match(normalizers, /"imagem"/);
  assert.match(normalizers, /"outro"/);
  assert.match(normalizers, /image\//);
  assert.match(normalizers, /pdf/);
  assert.match(normalizers, /document/);
  assert.match(normalizers, /text\//);
  assert.match(normalizers, /markdown/);

  assert.match(
    page,
    /import \{[\s\S]*normalizarObraSupabaseTop5,[\s\S]*pegarTexto,[\s\S]*from "\.\/lib\/top5-work-normalizers";/,
  );
  assert.match(page, /import \{ normalizarTexto \} from "\.\.\/\.\.\/\.\.\/lib\/utils";/);
  assert.doesNotMatch(page, /criarSlugBase/);
  assert.doesNotMatch(page, /normalizarObraLocalTop5/);
  assert.match(page, /normalizarObraSupabaseTop5\(/);

  for (const forbidden of [
    "react",
    "useEffect",
    "auth",
    "useRouter",
    "localStorage",
    ".insert(",
    ".delete(",
    "style={",
  ]) {
    assert.doesNotMatch(normalizers, new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});
