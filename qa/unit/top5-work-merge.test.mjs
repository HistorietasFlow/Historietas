import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const mergePath = new URL(
  "../../app/perfil-autor/top-5/lib/top5-work-merge.ts",
  import.meta.url,
);
const pagePath = new URL(
  "../../app/perfil-autor/top-5/page.tsx",
  import.meta.url,
);

test("Top 5 delega somente a mesclagem pura das obras", async () => {
  const [merge, page] = await Promise.all([
    readFile(mergePath, "utf8"),
    readFile(pagePath, "utf8"),
  ]);

  assert.match(merge, /import \{ ehClassificacao18 \} from "\.\.\/\.\.\/\.\.\/\.\.\/lib\/historietasAdultContent";/);
  assert.match(merge, /import \{ obterIdentificadoresObraTop5 \} from "\.\/top5-work-identifiers";/);
  assert.match(merge, /import type \{ ObraTop5 \} from "\.\/top5-types";/);
  assert.match(merge, /export function mesclarObrasTop5/);
  assert.match(merge, /const obrasMescladas: ObraTop5\[\] = \[\];/);
  assert.match(merge, /new Map<string, number>\(\)/);
  assert.match(merge, /!obra\.publicado/);
  assert.match(merge, /ehClassificacao18\(obra\.classificacaoIndicativa\)/);
  assert.match(merge, /obterIdentificadoresObraTop5\(obra\)/);
  assert.match(merge, /typeof indice === "number"/);
  assert.ok(
    merge.indexOf("...obraExistente") < merge.indexOf("...obra,"),
    "preserva a prioridade de spreads da obra atual",
  );

  for (const fallback of [
    "capa: obra.capa || obraExistente.capa",
    "capaNome: obra.capaNome || obraExistente.capaNome",
    "obra.capitulos.length > 0 ? obra.capitulos : obraExistente.capitulos",
    "arquivoObra: obra.arquivoObra || obraExistente.arquivoObra",
    "link: obra.link || obraExistente.link",
  ]) {
    assert.ok(merge.includes(fallback), `mantém fallback de ${fallback}`);
  }

  assert.match(merge, /obrasMescladas\.push\(obra\)/);
  assert.match(merge, /return obrasMescladas;/);

  assert.match(
    page,
    /import \{ useTop5InitialLoad \} from "\.\/hooks\/use-top5-initial-load";/,
  );
  assert.doesNotMatch(page, /function mesclarObrasTop5/);
  assert.doesNotMatch(page, /mesclarObrasTop5\(/);
  assert.doesNotMatch(page, /prepararConteudoInicialTop5\(/);
  assert.doesNotMatch(page, /function normalizarIdsSelecionadosTop5/);
  assert.match(page, /persistirSelecaoTop5\(/);
  assert.doesNotMatch(page, /carregarObrasLocaisTop5/);
  assert.doesNotMatch(page, /carregarDadosIniciaisTop5/);
  assert.doesNotMatch(page, /ehClassificacao18/);

  for (const forbidden of [
    "react",
    "useEffect",
    "supabase",
    "auth",
    "useRouter",
    "localStorage",
    "TOP_FIVE_MAXIMO",
    "style={",
    "<div",
  ]) {
    assert.doesNotMatch(
      merge,
      new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    );
  }
});
