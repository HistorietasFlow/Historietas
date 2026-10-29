import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const helperPath = new URL(
  "../../app/perfil-autor/top-5/lib/top5-selection-save.ts",
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
      "const chamadas = [];\nfunction normalizarIdsSelecionadosTop5(ids, obras) {\n  chamadas.push([\"normalizar\", ids, obras]);\n  return [\"normalizada\"];\n}\n",
    )
    .replace(
      'import { salvarTop5 } from "./top5-selection-storage";\n',
      "let resultadoSalvar = true;\nfunction salvarTop5(userId, ids) {\n  chamadas.push([\"salvar\", userId, ids]);\n  return resultadoSalvar;\n}\n",
    )
    .replace('import type { ObraTop5 } from "./top5-types";\n\n', "")
    .replace(
      "export function persistirSelecaoTop5(\n  userId: string,\n  idsSelecionados: string[],\n  obrasDisponiveis: ObraTop5[],\n) {",
      "function persistirSelecaoTop5(userId, idsSelecionados, obrasDisponiveis) {",
    );

  return new Function(
    `${executavel}\nreturn { chamadas, persistirSelecaoTop5, definirResultadoSalvar: (resultado) => { resultadoSalvar = resultado; } };`,
  )();
}

test("Top 5 normaliza e persiste a seleção manual sem alterar o handler", async () => {
  const [helper, page] = await Promise.all([
    readFile(helperPath, "utf8"),
    readFile(pagePath, "utf8"),
  ]);
  const {
    chamadas,
    persistirSelecaoTop5,
    definirResultadoSalvar,
  } = carregarHelper(helper);

  assert.match(
    helper,
    /import \{ normalizarIdsSelecionadosTop5 \} from "\.\/top5-selection-normalizer";/,
  );
  assert.match(
    helper,
    /import \{ salvarTop5 \} from "\.\/top5-selection-storage";/,
  );
  assert.match(helper, /import type \{ ObraTop5 \} from "\.\/top5-types";/);
  assert.match(helper, /export function persistirSelecaoTop5/);
  assert.match(
    helper,
    /const idsValidos = normalizarIdsSelecionadosTop5\(\s*idsSelecionados,\s*obrasDisponiveis,\s*\);/,
  );
  assert.match(helper, /const salvou = salvarTop5\(\s*userId,\s*idsValidos,\s*\);/);
  assert.match(
    helper,
    /Não foi possível gravar o TOP 5 no navegador\./,
  );

  const idsSelecionados = ["obra-salva"];
  const obrasDisponiveis = [{ id: "obra-1" }];
  const idsValidos = persistirSelecaoTop5(
    "usuario-1",
    idsSelecionados,
    obrasDisponiveis,
  );
  assert.deepEqual(chamadas, [
    ["normalizar", idsSelecionados, obrasDisponiveis],
    ["salvar", "usuario-1", idsValidos],
  ]);
  assert.deepEqual(idsValidos, ["normalizada"]);

  chamadas.length = 0;
  definirResultadoSalvar(false);
  assert.throws(
    () => persistirSelecaoTop5("usuario-1", idsSelecionados, obrasDisponiveis),
    /Não foi possível gravar o TOP 5 no navegador\./,
  );
  assert.deepEqual(chamadas, [
    ["normalizar", idsSelecionados, obrasDisponiveis],
    ["salvar", "usuario-1", ["normalizada"]],
  ]);

  assert.match(
    page,
    /import \{ persistirSelecaoTop5 \} from "\.\/lib\/top5-selection-save";/,
  );
  assert.doesNotMatch(page, /import \{ normalizarIdsSelecionadosTop5 \}/);
  assert.doesNotMatch(page, /salvarTop5\(/);

  const inicioHandler = page.indexOf("function salvarEscolhasTop5");
  const handler = page.slice(inicioHandler);
  assert.match(handler, /setSalvando\(true\);/);
  assert.match(handler, /setMensagem\(""\);/);
  assert.match(handler, /const idsValidos = persistirSelecaoTop5\(\s*usuario\.id,\s*idsSelecionados,\s*obras,\s*\);/);
  assert.match(handler, /setIdsSelecionados\(idsValidos\);/);
  assert.match(handler, /router\.push\("\/perfil-autor"\);/);
  assert.match(handler, /Não foi possível salvar agora\. Tente novamente\./);
  assert.match(handler, /Entre na sua conta para salvar seu TOP 5\./);

  for (const forbidden of [
    "react",
    "supabase",
    "router",
    "localStorage",
    "setIdsSelecionados",
    "style={",
    "<div",
  ]) {
    assert.doesNotMatch(
      helper,
      new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    );
  }
});
