import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const helperPath = new URL(
  "../../app/perfil-autor/top-5/lib/top5-initial-selection.ts",
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
      'import { normalizarIdsSelecionadosTop5 } from "./top5-selection-normalizer";\n',
      "const chamadas = [];\nconst idsSalvosTeste = [\"salvo\"];\nconst idsNormalizadosTeste = [\"normalizado\"];\nfunction normalizarIdsSelecionadosTop5(ids, obras) {\n  chamadas.push([\"normalizar\", ids, obras]);\n  return idsNormalizadosTeste;\n}\n",
    )
    .replace(
      'import { carregarTop5Salvo } from "./top5-selection-storage";\n',
      "function carregarTop5Salvo(userId) {\n  chamadas.push([\"carregar\", userId]);\n  return idsSalvosTeste;\n}\n",
    )
    .replace('import type { ObraTop5 } from "./top5-types";\n\n', "")
    .replace(
      "export function prepararSelecaoInicialTop5(\n  userId: string,\n  obrasDisponiveis: ObraTop5[],\n) {",
      "function prepararSelecaoInicialTop5(userId, obrasDisponiveis) {",
    );

  return new Function(
    `${executavel}\nreturn { chamadas, idsSalvosTeste, idsNormalizadosTeste, prepararSelecaoInicialTop5 };`,
  )();
}

test("Top 5 delega a preparação inicial da seleção sem persistir", async () => {
  const [helper, page] = await Promise.all([
    readFile(helperPath, "utf8"),
    readFile(pagePath, "utf8"),
  ]);
  const {
    chamadas,
    idsSalvosTeste,
    idsNormalizadosTeste,
    prepararSelecaoInicialTop5,
  } = carregarHelper(helper);

  assert.match(
    helper,
    /import \{ carregarTop5Salvo \} from "\.\/top5-selection-storage";/,
  );
  assert.match(
    helper,
    /import \{ normalizarIdsSelecionadosTop5 \} from "\.\/top5-selection-normalizer";/,
  );
  assert.match(helper, /import type \{ ObraTop5 \} from "\.\/top5-types";/);
  assert.match(helper, /export function prepararSelecaoInicialTop5/);
  assert.match(
    helper,
    /const idsSalvos = userId\s*\? carregarTop5Salvo\(userId\)\s*: \[\];/,
  );
  assert.match(
    helper,
    /normalizarIdsSelecionadosTop5\(\s*idsSalvos,\s*obrasDisponiveis,\s*\)/,
  );
  assert.match(
    helper,
    /return \{\s*idsSalvos,\s*idsNormalizados,\s*\};/,
  );

  const obrasDisponiveis = [{ id: "obra-1" }];
  const selecaoComUsuario = prepararSelecaoInicialTop5(
    "usuario-1",
    obrasDisponiveis,
  );
  assert.equal(selecaoComUsuario.idsSalvos, idsSalvosTeste);
  assert.equal(selecaoComUsuario.idsNormalizados, idsNormalizadosTeste);
  assert.deepEqual(chamadas, [
    ["carregar", "usuario-1"],
    ["normalizar", idsSalvosTeste, obrasDisponiveis],
  ]);

  chamadas.length = 0;
  const selecaoSemUsuario = prepararSelecaoInicialTop5("", obrasDisponiveis);
  assert.deepEqual(selecaoSemUsuario.idsSalvos, []);
  assert.equal(selecaoSemUsuario.idsNormalizados, idsNormalizadosTeste);
  assert.deepEqual(chamadas, [
    ["normalizar", selecaoSemUsuario.idsSalvos, obrasDisponiveis],
  ]);

  assert.match(
    page,
    /import \{ useTop5InitialLoad \} from "\.\/hooks\/use-top5-initial-load";/,
  );
  assert.doesNotMatch(page, /carregarTop5Salvo\(/);
  assert.doesNotMatch(page, /prepararConteudoInicialTop5\(/);
  const inicioSalvar = page.indexOf("function salvarEscolhasTop5");
  const handlerSalvar = page.slice(inicioSalvar);
  assert.match(handlerSalvar, /persistirSelecaoTop5\(/);

  for (const forbidden of [
    "react",
    "useEffect",
    "supabase",
    "auth",
    "useRouter",
    "localStorage",
    "salvarTop5",
    "JSON.stringify",
    "set",
    "style={",
    "<div",
  ]) {
    assert.doesNotMatch(
      helper,
      new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    );
  }
});
