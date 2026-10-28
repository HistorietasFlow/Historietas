import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const utilPath = new URL(
  "../../app/em-breve/lib/em-breve-work-selection-utils.ts",
  import.meta.url,
);
const pagePath = new URL("../../app/em-breve/page.tsx", import.meta.url);

test("Em Breve delega a seleção de obras exibidas ao util puro", async () => {
  const util = await readFile(utilPath, "utf8");
  const page = await readFile(pagePath, "utf8");

  assert.match(util, /import \{ normalizarTexto \} from "\.\.\/\.\.\/\.\.\/lib\/utils"/);
  assert.match(util, /import type \{ ObraEmBreveCard \} from "\.\/em-breve-work-normalizers"/);
  assert.match(util, /export function selecionarObrasExibidasEmBreve/);

  for (const trecho of [
    "obraIdConsultada || nomeObra",
    "obrasEmBreve.find",
    "obraIdConsultada && obra.id === obraIdConsultada",
    "Boolean(nomeObra)",
    "normalizarTexto(obra.titulo)",
    "normalizarTexto(nomeObra)",
    "|| null",
    "obrasEmBreve.filter",
    "obra.id !== obraConsultada.id",
    ".slice(0, 8)",
  ]) {
    assert.ok(util.includes(trecho), `mantém ${trecho}`);
  }

  assert.match(
    page,
    /import \{ selecionarObrasExibidasEmBreve \} from "\.\/lib\/em-breve-work-selection-utils"/,
  );
  assert.match(
    page,
    /const outrasObrasEmBreve = selecionarObrasExibidasEmBreve\(/,
  );
  assert.doesNotMatch(page, /const obraConsultada =/);
  assert.doesNotMatch(page, /normalizarTexto\(/);
  assert.doesNotMatch(page, /from "\.\.\/\.\.\/lib\/utils"/);
  assert.doesNotMatch(
    util,
    /React|use(?:Effect|State|Memo)|supabase|\.from\(|auth|router|localStorage|\.(?:insert|update|delete|upsert)\(|<\w/,
  );
});
