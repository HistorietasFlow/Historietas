import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const helperPath = new URL(
  "../../app/perfil-autor/top-5/lib/top5-initial-selection-sync.ts",
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
      'import { salvarTop5 } from "./top5-selection-storage";\n',
      "const chamadas = [];\nfunction salvarTop5(userId, ids) {\n  chamadas.push([userId, ids]);\n  return false;\n}\n",
    )
    .replace(
      "export function sincronizarSelecaoInicialTop5(\n  userId: string,\n  idsSalvos: string[],\n  idsNormalizados: string[],\n) {",
      "function sincronizarSelecaoInicialTop5(userId, idsSalvos, idsNormalizados) {",
    );

  return new Function(
    `${executavel}\nreturn { chamadas, sincronizarSelecaoInicialTop5 };`,
  )();
}

test("Top 5 sincroniza somente a correção necessária da seleção inicial", async () => {
  const [helper, page] = await Promise.all([
    readFile(helperPath, "utf8"),
    readFile(pagePath, "utf8"),
  ]);
  const { chamadas, sincronizarSelecaoInicialTop5 } = carregarHelper(helper);

  assert.match(
    helper,
    /import \{ salvarTop5 \} from "\.\/top5-selection-storage";/,
  );
  assert.match(helper, /export function sincronizarSelecaoInicialTop5/);
  assert.match(
    helper,
    /userId &&\s*JSON\.stringify\(idsSalvos\) !==\s*JSON\.stringify\(idsNormalizados\)/,
  );
  assert.match(helper, /salvarTop5\(userId, idsNormalizados\)/);

  const idsSalvos = ["obra-a"];
  const idsNormalizados = ["obra-b"];
  assert.doesNotThrow(() =>
    sincronizarSelecaoInicialTop5("usuario-1", idsSalvos, idsNormalizados),
  );
  assert.deepEqual(chamadas, [["usuario-1", idsNormalizados]]);
  assert.deepEqual(idsSalvos, ["obra-a"]);
  assert.deepEqual(idsNormalizados, ["obra-b"]);

  chamadas.length = 0;
  sincronizarSelecaoInicialTop5("", ["obra-a"], ["obra-b"]);
  assert.deepEqual(chamadas, []);

  sincronizarSelecaoInicialTop5("usuario-1", ["obra-a"], ["obra-a"]);
  assert.deepEqual(chamadas, []);

  const idsEmOrdemOriginal = ["obra-a", "obra-b"];
  const idsEmOrdemCorrigida = ["obra-b", "obra-a"];
  sincronizarSelecaoInicialTop5(
    "usuario-1",
    idsEmOrdemOriginal,
    idsEmOrdemCorrigida,
  );
  assert.deepEqual(chamadas, [["usuario-1", idsEmOrdemCorrigida]]);

  assert.match(
    page,
    /import \{ sincronizarSelecaoInicialTop5 \} from "\.\/lib\/top5-initial-selection-sync";/,
  );
  assert.doesNotMatch(
    page,
    /JSON\.stringify\(idsSalvos\) !== JSON\.stringify\(idsNormalizados\)/,
  );
  assert.match(
    page,
    /sincronizarSelecaoInicialTop5\(\s*userId,\s*idsSalvos,\s*idsNormalizados,\s*\);/,
  );
  assert.match(
    page,
    /const \{\s*obrasMescladas,\s*idsSalvos,\s*idsNormalizados,\s*\} = prepararConteudoInicialTop5\(\s*userId,\s*obrasSupabase,\s*\);/,
  );

  const setUsuario = page.indexOf("setUsuario(userId ? { id: userId, nome: nomeUsuario } : null);");
  const setObras = page.indexOf("setObras(obrasMescladas);");
  const setIds = page.indexOf("setIdsSelecionados(idsNormalizados);");
  const sincronizar = page.indexOf("sincronizarSelecaoInicialTop5(");
  assert.ok(setUsuario < setObras);
  assert.ok(setObras < setIds);
  assert.ok(setIds < sincronizar);

  const inicioSalvar = page.indexOf("function salvarEscolhasTop5");
  const handlerSalvar = page.slice(inicioSalvar);
  assert.match(handlerSalvar, /const salvou = salvarTop5\(usuario\.id, idsValidos\);/);

  for (const forbidden of [
    "react",
    "useEffect",
    "supabase",
    "auth",
    "useRouter",
    "localStorage",
    "ObraTop5",
    "style={",
    "<div",
  ]) {
    assert.doesNotMatch(
      helper,
      new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    );
  }
});
