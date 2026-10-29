import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const filterPath = new URL(
  "../../app/perfil-autor/top-5/lib/top5-work-filter.ts",
  import.meta.url,
);
const pagePath = new URL(
  "../../app/perfil-autor/top-5/page.tsx",
  import.meta.url,
);

test("Top 5 delega somente o filtro e a ordenação pura das obras", async () => {
  const [filter, page] = await Promise.all([
    readFile(filterPath, "utf8"),
    readFile(pagePath, "utf8"),
  ]);

  assert.match(
    filter,
    /import \{ normalizarTexto \} from "\.\.\/\.\.\/\.\.\/\.\.\/lib\/utils";/,
  );
  assert.match(
    filter,
    /import \{ criarChaveObraTop5 \} from "\.\/top5-work-identifiers";/,
  );
  assert.match(filter, /import type \{ ObraTop5 \} from "\.\/top5-types";/);
  assert.match(filter, /export function filtrarObrasTop5/);
  assert.match(filter, /const buscaNormalizada = normalizarTexto\(busca\);/);
  assert.match(filter, /new Set\(idsSelecionados\)/);
  assert.match(filter, /\[\.\.\.obras\]\.sort\(/);
  assert.match(filter, /criarChaveObraTop5\(obraA\)/);
  assert.match(filter, /criarChaveObraTop5\(obraB\)/);
  assert.match(filter, /Number\(selecionadaB\) - Number\(selecionadaA\)/);
  assert.match(filter, /localeCompare\(/);
  assert.match(filter, /"pt-BR"/);
  assert.match(filter, /if \(!buscaNormalizada\) \{/);
  assert.match(filter, /return obrasOrdenadas;/);
  assert.match(
    filter,
    /\[obra\.titulo, obra\.autor, obra\.genero, obra\.formato, \.\.\.obra\.tags\]\.join\(" "\)/,
  );
  assert.match(filter, /textoBusca\.includes\(buscaNormalizada\)/);

  assert.match(
    page,
    /import \{ filtrarObrasTop5 \} from "\.\/lib\/top5-work-filter";/,
  );
  assert.match(
    page,
    /const obrasFiltradas = useMemo\(\s*\(\) => filtrarObrasTop5\(obras, idsSelecionados, busca\),\s*\[busca, idsSelecionados, obras\],\s*\);/s,
  );

  for (const inlineLogic of [
    "const buscaNormalizada =",
    "const idsSelecionadosSet =",
    "const obrasOrdenadas =",
    "const textoBusca =",
  ]) {
    assert.doesNotMatch(page, new RegExp(inlineLogic));
  }

  assert.doesNotMatch(page, /\[\.\.\.obras\]\.sort\(/);

  assert.doesNotMatch(page, /import \{ normalizarTexto \} from "\.\.\/\.\.\/\.\.\/lib\/utils";/);

  for (const forbidden of [
    "react",
    "useMemo",
    "supabase",
    "auth",
    "useRouter",
    "localStorage",
    "carregarObras",
    "<div",
    "CSSProperties",
  ]) {
    assert.doesNotMatch(
      filter,
      new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    );
  }
});
