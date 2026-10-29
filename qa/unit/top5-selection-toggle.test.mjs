import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const togglePath = new URL(
  "../../app/perfil-autor/top-5/lib/top5-selection-toggle.ts",
  import.meta.url,
);
const pagePath = new URL(
  "../../app/perfil-autor/top-5/page.tsx",
  import.meta.url,
);

function carregarAlternador(source) {
  const executavel = source
    .replace(/\r\n/g, "\n")
    .replace(
      'import { TOP_FIVE_MAXIMO } from "./top5-selection-storage";\n',
      "const TOP_FIVE_MAXIMO = 5;\n",
    )
    .replace(
      /export type ResultadoAlternarIdSelecionadoTop5 = \{[\s\S]*?\};\n\n/,
      "",
    )
    .replace(
      "export function alternarIdSelecionadoTop5(\n  idsAtuais: string[],\n  chave: string,\n): ResultadoAlternarIdSelecionadoTop5 {",
      "function alternarIdSelecionadoTop5(\n  idsAtuais,\n  chave,\n) {",
    );

  return new Function(
    `${executavel}\nreturn { alternarIdSelecionadoTop5 };`,
  )().alternarIdSelecionadoTop5;
}

test("Top 5 delega a alternância pura da seleção", async () => {
  const [toggle, page] = await Promise.all([
    readFile(togglePath, "utf8"),
    readFile(pagePath, "utf8"),
  ]);
  const alternarIdSelecionadoTop5 = carregarAlternador(toggle);

  assert.match(
    toggle,
    /import \{ TOP_FIVE_MAXIMO \} from "\.\/top5-selection-storage";/,
  );
  assert.match(toggle, /export type ResultadoAlternarIdSelecionadoTop5/);
  assert.match(toggle, /export function alternarIdSelecionadoTop5/);
  assert.match(toggle, /idsAtuais\.includes\(chave\)/);
  assert.match(toggle, /idsAtuais\.filter\(\(id\) => id !== chave\)/);
  assert.match(toggle, /idsAtuais\.length >= TOP_FIVE_MAXIMO/);
  assert.match(toggle, /ids: idsAtuais,/);
  assert.match(toggle, /ids: \[\.\.\.idsAtuais, chave\]/);

  const idsAtuais = ["obra-1", "obra-2"];
  const adicao = alternarIdSelecionadoTop5(idsAtuais, "obra-3");
  assert.deepEqual(adicao, {
    ids: ["obra-1", "obra-2", "obra-3"],
    limiteAtingido: false,
  });
  assert.deepEqual(idsAtuais, ["obra-1", "obra-2"]);

  const idsComChave = ["obra-1", "obra-2", "obra-3"];
  const remocao = alternarIdSelecionadoTop5(idsComChave, "obra-2");
  assert.deepEqual(remocao, {
    ids: ["obra-1", "obra-3"],
    limiteAtingido: false,
  });
  assert.deepEqual(idsComChave, ["obra-1", "obra-2", "obra-3"]);

  const idsNoLimite = ["obra-1", "obra-2", "obra-3", "obra-4", "obra-5"];
  const limite = alternarIdSelecionadoTop5(idsNoLimite, "obra-6");
  assert.equal(limite.ids, idsNoLimite);
  assert.equal(limite.limiteAtingido, true);
  assert.deepEqual(idsNoLimite, [
    "obra-1",
    "obra-2",
    "obra-3",
    "obra-4",
    "obra-5",
  ]);

  assert.match(
    page,
    /import \{ alternarIdSelecionadoTop5 \} from "\.\/lib\/top5-selection-toggle";/,
  );
  assert.match(page, /function alternarObraTop5\(obra: ObraTop5\)/);
  assert.match(page, /const chave = criarChaveObraTop5\(obra\);/);
  assert.match(page, /if \(!chave\) \{\s*return;\s*\}/);
  assert.match(
    page,
    /setMensagem\(""\);\s*setIdsSelecionados\(\(idsAtuais\) => \{/,
  );
  assert.match(
    page,
    /const resultado = alternarIdSelecionadoTop5\(idsAtuais, chave\);/,
  );
  assert.match(page, /if \(resultado\.limiteAtingido\) \{/);
  assert.match(
    page,
    /setMensagem\("Você já escolheu 5 obras\. Remova uma para trocar\."\);/,
  );
  assert.match(page, /return resultado\.ids;/);

  const inicioHandler = page.indexOf("function alternarObraTop5");
  const fimHandler = page.indexOf(
    "function removerSelecionadaTop5",
    inicioHandler,
  );
  assert.notEqual(inicioHandler, -1);
  assert.notEqual(fimHandler, -1);
  const handler = page.slice(inicioHandler, fimHandler);
  assert.doesNotMatch(handler, /idsAtuais\.includes\(chave\)/);
  assert.doesNotMatch(handler, /idsAtuais\.length >= TOP_FIVE_MAXIMO/);
  assert.doesNotMatch(handler, /return \[\.\.\.idsAtuais, chave\]/);

  for (const forbidden of [
    "react",
    "useEffect",
    "supabase",
    "auth",
    "useRouter",
    "localStorage",
    "ObraTop5",
    "setMensagem",
    "Você já escolheu",
    "style={",
    "<div",
  ]) {
    assert.doesNotMatch(
      toggle,
      new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    );
  }
});
