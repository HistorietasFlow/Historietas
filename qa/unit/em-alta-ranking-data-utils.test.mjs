import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const modulo = readFileSync(new URL("../../app/em-alta/lib/em-alta-ranking-data-utils.ts", import.meta.url), "utf8");
const pagina = readFileSync(new URL("../../app/em-alta/page.tsx", import.meta.url), "utf8");
const executavel = modulo
  .replace(/import \{ criarSlugBase, normalizarTexto \} from "\.\.\/\.\.\/\.\.\/lib\/utils";\r?\n/, `const normalizarTexto = (valor) => String(valor || "").normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").toLowerCase();
const criarSlugBase = (valor) => normalizarTexto(valor).replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");\n`)
  .replace(/import type \{ CapituloLocal, ObraLocal \} from "\.\/em-alta-models";\r?\n/, "");
const js = typescript.transpileModule(executavel, { compilerOptions: { module: typescript.ModuleKind.ESNext, target: typescript.ScriptTarget.ES2022 } }).outputText;
const utils = await import(`data:text/javascript;base64,${Buffer.from(js).toString("base64")}`);
const obra = { id: "obra-1", slug: "slug-obra", titulo: "Obra Ágil", capitulos: [{ lido: true }, { lido: false }, { lido: true }] };

test("formatadores preservam fallbacks, locale e arredondamento", () => {
  assert.equal(utils.formatarNumero(1234), "1.234"); assert.equal(utils.formatarNumero(Number.NaN), "0");
  assert.equal(utils.formatarMediaRanking(0), "0"); assert.equal(utils.formatarMediaRanking(-1), "0"); assert.equal(utils.formatarMediaRanking(Number.POSITIVE_INFINITY), "0");
  assert.equal(utils.formatarMediaRanking(4), "4"); assert.equal(utils.formatarMediaRanking(4.26), "4.3");
  assert.equal(utils.formatarDataRanking(0), "Sem data"); assert.equal(utils.formatarDataRanking(Number.NaN), "Sem data"); assert.equal(utils.formatarDataRanking(new Date(2025, 0, 2).getTime()), "02/01/2025");
  assert.equal(utils.formatarGeneroCard(" Fantasia Sombria "), "Fantasia"); assert.equal(utils.formatarGeneroCard("  "), "Não informado");
});
test("normaliza visualizações e resolve o maior alias", () => {
  assert.deepEqual(utils.normalizarVisualizacoesRanking(null), {});
  assert.deepEqual(utils.normalizarVisualizacoesRanking({ " id ": 1.6, zero: 0, negativo: -1, texto: "2" }), { id: 2 });
  assert.equal(utils.obterVisualizacoesRegistradasObra(obra, { "obra-1": 2, "slug-obra": 7, "obra-agil": 4, "obra agil": 9 }), 9);
});
test("normaliza avaliações em passos de meio ponto e resolve aliases", () => {
  assert.deepEqual(utils.normalizarAvaliacoesLocaisRanking([]), {});
  assert.deepEqual(utils.normalizarAvaliacoesLocaisRanking({ " nota ": 4.26, baixa: 0.24, alta: 5.4, limite: 0.5 }), { nota: 4.5, limite: 0.5 });
  assert.equal(utils.obterAvaliacaoLocalRanking(obra, { "obra-1": 3, "slug-obra": 4.5, "obra-agil": 4 }), 4.5);
});
test("calcula capítulos lidos e progresso arredondado", () => {
  assert.equal(utils.calcularCapitulosLidos(obra.capitulos), 2); assert.equal(utils.calcularProgressoLeitura([]), 0); assert.equal(utils.calcularProgressoLeitura(obra.capitulos), 67);
});
test("encontra o próximo capítulo preservando prioridade e fallbacks", () => {
  const primeiroNaoLido = { id: "primeiro", lido: false };
  const ultimoLido = { id: "ultimo", lido: true };
  const posteriorNaoLido = { id: "posterior", lido: false };

  assert.equal(
    utils.encontrarCapituloParaContinuar({ capitulos: [primeiroNaoLido] }),
    null,
  );
  assert.equal(
    utils.encontrarCapituloParaContinuar({
      capitulos: [primeiroNaoLido, ultimoLido, posteriorNaoLido],
      ultimoCapituloLidoId: "ultimo",
    }),
    posteriorNaoLido,
  );
  assert.equal(
    utils.encontrarCapituloParaContinuar({
      capitulos: [primeiroNaoLido, ultimoLido],
      ultimoCapituloLidoId: "ultimo",
    }),
    primeiroNaoLido,
  );
  assert.equal(
    utils.encontrarCapituloParaContinuar({
      capitulos: [primeiroNaoLido, ultimoLido],
      ultimoCapituloLidoId: "ausente",
    }),
    primeiroNaoLido,
  );
  assert.equal(
    utils.encontrarCapituloParaContinuar({
      capitulos: [ultimoLido],
      ultimoCapituloLidoId: "ultimo",
    }),
    null,
  );
});
test("fronteira delega os onze helpers e permanece pura", () => {
  for (const nome of ["formatarNumero", "formatarMediaRanking", "normalizarVisualizacoesRanking", "obterVisualizacoesRegistradasObra", "normalizarAvaliacoesLocaisRanking", "obterAvaliacaoLocalRanking", "formatarDataRanking", "formatarGeneroCard", "calcularCapitulosLidos", "calcularProgressoLeitura", "encontrarCapituloParaContinuar"]) {
    assert.match(modulo, new RegExp(`export function ${nome}\\b`)); assert.match(pagina, new RegExp(`\\b${nome}\\b`)); assert.doesNotMatch(pagina, new RegExp(`function ${nome}\\b`));
  }
  for (const proibido of [/react/i, /\buse[A-Z]\w*\b/, /supabase/i, /localStorage/, /\bwindow\b/, /\bdocument\b/, /<[A-Z][\w.]*\s+[\w-]+=/]) assert.doesNotMatch(modulo, proibido);
});
