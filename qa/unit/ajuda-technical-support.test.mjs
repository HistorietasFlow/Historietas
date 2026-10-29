import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pagina = await readFile("app/ajuda/page.tsx", "utf8");
const suporte = await readFile("app/ajuda/lib/ajuda-technical-support.ts", "utf8");
const normalizadores = await readFile(
  "app/ajuda/lib/ajuda-technical-support-normalizers.ts",
  "utf8",
);

test("tipos e opções estáticas do suporte técnico preservam contratos e ordem", () => {
  assert.equal(
    createHash("sha256")
      .update(suporte.replace(/\r\n/g, "\n"))
      .digest("hex"),
    "35cb1888b991ac56747d651e8ecbc774978bfd23354169ba1a12c08670bc83fe",
  );
  for (const contrato of [
    "export type CategoriaProblemaTecnico",
    "export type StatusProblemaTecnico",
    "export type ProblemaTecnicoResumo",
    "export type ProblemaTecnicoRpcRow",
    "export const CATEGORIAS_PROBLEMA_TECNICO",
    'pt: "Lentidão ou travamento"',
    'en: "Slow or crashing"',
    'es: "Lentitud o bloqueo"',
    'pt: "Outro problema"',
  ]) assert.ok(suporte.includes(contrato), contrato);

  assert.deepEqual(
    [...suporte.matchAll(/valor: "([^"]+)"/g)].map((item) => item[1]),
    ["conta_acesso", "publicacao", "leitura", "comunidade", "diario", "notificacoes", "privacidade", "desempenho", "outro"],
  );
});

test("normalizadores dedicados mantêm contratos e a página os importa", () => {
  assert.match(pagina, /from "\.\/lib\/ajuda-technical-support"/);
  assert.match(pagina, /from "\.\/lib\/ajuda-technical-support-normalizers"/);
  assert.match(normalizadores, /new Set<CategoriaProblemaTecnico>\(/);
  assert.match(normalizadores, /CATEGORIAS_PROBLEMA_TECNICO\.map\(/);
  assert.match(normalizadores, /: "outro";/);
  assert.match(normalizadores, /valor === "aberto"/);
  assert.match(normalizadores, /valor === "fechado"/);
  assert.match(normalizadores, /: "aberto";/);
  assert.doesNotMatch(pagina, /type ProblemaTecnicoRpcRow =/);
  assert.doesNotMatch(pagina, /const CATEGORIAS_PROBLEMA_TECNICO/);
});
