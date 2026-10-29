import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const helperPath = new URL(
  "../../app/perfil-autor/top-5/lib/top5-initial-works.ts",
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
      'import { carregarObrasLocaisTop5 } from "./top5-local-works-loader";\n',
      "const chamadas = [];\nfunction carregarObrasLocaisTop5(userId) {\n  chamadas.push([\"local\", userId]);\n  return [{ id: \"local\" }];\n}\n",
    )
    .replace(
      'import { mesclarObrasTop5 } from "./top5-work-merge";\n',
      "function mesclarObrasTop5(obras) {\n  chamadas.push([\"mesclar\", obras]);\n  return obras;\n}\n",
    )
    .replace('import type { ObraTop5 } from "./top5-types";\n\n', "")
    .replace(
      "export function carregarObrasIniciaisTop5(\n  userId: string,\n  obrasSupabase: ObraTop5[],\n) {",
      "function carregarObrasIniciaisTop5(userId, obrasSupabase) {",
    );

  return new Function(
    `${executavel}\nreturn { chamadas, carregarObrasIniciaisTop5 };`,
  )();
}

test("Top 5 delega a composição inicial de obras sem alterar a ordem das fontes", async () => {
  const [helper, page] = await Promise.all([
    readFile(helperPath, "utf8"),
    readFile(pagePath, "utf8"),
  ]);
  const { chamadas, carregarObrasIniciaisTop5 } = carregarHelper(helper);

  assert.match(
    helper,
    /import \{ carregarObrasLocaisTop5 \} from "\.\/top5-local-works-loader";/,
  );
  assert.match(
    helper,
    /import \{ mesclarObrasTop5 \} from "\.\/top5-work-merge";/,
  );
  assert.match(helper, /import type \{ ObraTop5 \} from "\.\/top5-types";/);
  assert.match(helper, /export function carregarObrasIniciaisTop5/);
  assert.match(
    helper,
    /mesclarObrasTop5\(\[\s*\.\.\.carregarObrasLocaisTop5\(userId\),\s*\.\.\.obrasSupabase,\s*\]\)/,
  );
  assert.doesNotMatch(
    helper,
    /mesclarObrasTop5\(\[\s*\.\.\.obrasSupabase,\s*\.\.\.carregarObrasLocaisTop5\(userId\),/,
  );

  const obrasSupabase = [{ id: "supabase" }];
  assert.deepEqual(
    carregarObrasIniciaisTop5("usuario-1", obrasSupabase),
    [{ id: "local" }, { id: "supabase" }],
  );
  assert.deepEqual(chamadas, [
    ["local", "usuario-1"],
    ["mesclar", [{ id: "local" }, { id: "supabase" }]],
  ]);

  assert.match(
    page,
    /import \{ prepararConteudoInicialTop5 \} from "\.\/lib\/top5-initial-content";/,
  );
  assert.doesNotMatch(
    page,
    /import \{ carregarObrasLocaisTop5 \} from "\.\/lib\/top5-local-works-loader";/,
  );
  assert.doesNotMatch(
    page,
    /import \{ mesclarObrasTop5 \} from "\.\/lib\/top5-work-merge";/,
  );
  assert.match(
    page,
    /prepararConteudoInicialTop5\(\s*userId,\s*obrasSupabase,\s*\)/,
  );
  assert.match(
    page,
    /import \{ carregarDadosIniciaisTop5 \} from "\.\/lib\/top5-initial-data-loader";/,
  );
  assert.match(
    page,
    /const \{\s*obrasMescladas,\s*idsSalvos,\s*idsNormalizados,\s*\} = prepararConteudoInicialTop5\(/,
  );

  const primeiroCancelamento = page.indexOf("if (cancelado)");
  const composicao = page.indexOf("} = prepararConteudoInicialTop5(");
  const segundoCancelamento = page.indexOf(
    "if (cancelado)",
    primeiroCancelamento + 1,
  );
  assert.ok(primeiroCancelamento < segundoCancelamento);
  assert.ok(segundoCancelamento < composicao);

  for (const forbidden of [
    "react",
    "useEffect",
    "supabase",
    "auth",
    "useRouter",
    "localStorage",
    "carregarTop5Salvo",
    "normalizarIdsSelecionadosTop5",
    "style={",
    "<div",
  ]) {
    assert.doesNotMatch(
      helper,
      new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    );
  }
});
