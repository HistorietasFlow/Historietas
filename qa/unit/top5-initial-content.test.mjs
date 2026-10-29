import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const helperPath = new URL(
  "../../app/perfil-autor/top-5/lib/top5-initial-content.ts",
  import.meta.url,
);
const pagePath = new URL(
  "../../app/perfil-autor/top-5/page.tsx",
  import.meta.url,
);

function carregarHelper(source) {
  const executavel = source
    .replace(/\r\n/g, "\n")
    .replace(
      'import { carregarObrasIniciaisTop5 } from "./top5-initial-works";\n',
      "const chamadas = [];\nfunction carregarObrasIniciaisTop5(userId, obrasSupabase) {\n  chamadas.push([\"obras\", userId, obrasSupabase]);\n  return [{ id: \"obra-mesclada\" }];\n}\n",
    )
    .replace(
      'import { prepararSelecaoInicialTop5 } from "./top5-initial-selection";\n',
      "function prepararSelecaoInicialTop5(userId, obrasMescladas) {\n  chamadas.push([\"selecao\", userId, obrasMescladas]);\n  return { idsSalvos: [\"salva\"], idsNormalizados: [\"normalizada\"] };\n}\n",
    )
    .replace('import type { ObraTop5 } from "./top5-types";\n\n', "")
    .replace(
      "export function prepararConteudoInicialTop5(\n  userId: string,\n  obrasSupabase: ObraTop5[],\n) {",
      "function prepararConteudoInicialTop5(userId, obrasSupabase) {",
    );

  return new Function(
    `${executavel}\nreturn { chamadas, prepararConteudoInicialTop5 };`,
  )();
}

test("Top 5 prepara obras e seleção iniciais na ordem atual", async () => {
  const [helper, page] = await Promise.all([
    readFile(helperPath, "utf8"),
    readFile(pagePath, "utf8"),
  ]);
  const { chamadas, prepararConteudoInicialTop5 } = carregarHelper(helper);

  assert.match(
    helper,
    /import \{ carregarObrasIniciaisTop5 \} from "\.\/top5-initial-works";/,
  );
  assert.match(
    helper,
    /import \{ prepararSelecaoInicialTop5 \} from "\.\/top5-initial-selection";/,
  );
  assert.match(helper, /import type \{ ObraTop5 \} from "\.\/top5-types";/);
  assert.match(helper, /export function prepararConteudoInicialTop5/);
  assert.match(
    helper,
    /const obrasMescladas = carregarObrasIniciaisTop5\(\s*userId,\s*obrasSupabase,\s*\);/,
  );
  assert.match(
    helper,
    /prepararSelecaoInicialTop5\(\s*userId,\s*obrasMescladas,\s*\)/,
  );
  assert.match(
    helper,
    /return \{\s*obrasMescladas,\s*idsSalvos,\s*idsNormalizados,\s*\};/,
  );

  const obrasSupabase = [{ id: "obra-supabase" }];
  const resultado = prepararConteudoInicialTop5("usuario-1", obrasSupabase);
  const obrasMescladas = [{ id: "obra-mesclada" }];
  assert.deepEqual(chamadas, [
    ["obras", "usuario-1", obrasSupabase],
    ["selecao", "usuario-1", obrasMescladas],
  ]);
  assert.deepEqual(resultado, {
    obrasMescladas,
    idsSalvos: ["salva"],
    idsNormalizados: ["normalizada"],
  });

  assert.match(
    page,
    /import \{ prepararConteudoInicialTop5 \} from "\.\/lib\/top5-initial-content";/,
  );
  assert.doesNotMatch(page, /import \{ carregarObrasIniciaisTop5 \}/);
  assert.doesNotMatch(page, /import \{ prepararSelecaoInicialTop5 \}/);
  assert.match(
    page,
    /if \(cancelado\) \{\s*return;\s*\}\s*const \{\s*obrasMescladas,\s*idsSalvos,\s*idsNormalizados,\s*\} = prepararConteudoInicialTop5\(\s*userId,\s*obrasSupabase,\s*\);\s*setUsuario\(userId \? \{ id: userId, nome: nomeUsuario \} : null\);\s*setObras\(obrasMescladas\);\s*setIdsSelecionados\(idsNormalizados\);\s*sincronizarSelecaoInicialTop5\(\s*userId,\s*idsSalvos,\s*idsNormalizados,\s*\);/,
  );

  for (const forbidden of [
    "react",
    "supabase",
    "set",
    "salvarTop5",
    "style={",
    "<div",
  ]) {
    assert.doesNotMatch(
      helper,
      new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    );
  }
});
