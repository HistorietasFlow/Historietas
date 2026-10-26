import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(new URL("../../app/adicionar-capitulo/lib/adicionar-capitulo-work-merge-utils.ts", import.meta.url), "utf8");
const pageSource = readFileSync(new URL("../../app/adicionar-capitulo/page.tsx", import.meta.url), "utf8");
const dependency = `data:text/javascript;base64,${Buffer.from("export const calcularProgressoLeitura=(capitulos)=>capitulos.length?Math.round(capitulos.filter((capitulo)=>capitulo.lido).length/capitulos.length*100):0;").toString("base64")}`;
const javascript = typescript.transpileModule(source.replace('"./adicionar-capitulo-metrics-utils"', JSON.stringify(dependency)), { compilerOptions: { module: typescript.ModuleKind.ESNext, target: typescript.ScriptTarget.ES2022 } }).outputText;
const { mesclarObrasComSupabase } = await import(`data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`);

test("mesclarObrasComSupabase preserva referências, ordem, campos e métricas", () => {
  const remotoSemLocal = { id: "r", capitulos: [], ultimoCapituloLidoId: "", ultimaLeituraEm: "", visualizacoes: 1, totalCurtidas: 1, totalComentarios: 1, totalSalvos: 1, totalLidos: 1, remoto: true };
  const capituloRemoto = { id: "c", titulo: "Remoto", texto: "texto", ordem: 1, publicado: true, criadoEm: "r", curtiu: false, salvo: false, comentario: "", lido: false, lidoEm: "" };
  const capituloSemLocal = { ...capituloRemoto, id: "outro" };
  const remoto = { ...remotoSemLocal, id: "m", capitulos: [capituloRemoto, capituloSemLocal], ultimoCapituloLidoId: "remoto", ultimaLeituraEm: "remota", visualizacoes: 2 };
  const local = { ...remoto, capitulos: [{ ...capituloRemoto, curtiu: true, salvo: true, comentario: " local ", lido: true, lidoEm: "local" }], ultimoCapituloLidoId: "local", ultimaLeituraEm: "agora", visualizacoes: 3, totalCurtidas: 4, totalComentarios: 5, totalSalvos: 6, totalLidos: 7 };
  const somenteLocal = { ...local, id: "l" };
  const resultado = mesclarObrasComSupabase([local, somenteLocal], [remotoSemLocal, remoto]);
  assert.equal(resultado[0], remotoSemLocal); assert.equal(resultado[1].capitulos[1], capituloSemLocal); assert.equal(resultado[2], somenteLocal);
  assert.equal(resultado[1].capitulos[0].titulo, "Remoto"); assert.deepEqual([resultado[1].capitulos[0].curtiu, resultado[1].capitulos[0].salvo, resultado[1].capitulos[0].comentario, resultado[1].capitulos[0].lido, resultado[1].capitulos[0].lidoEm], [true, true, " local ", true, "local"]);
  assert.deepEqual([resultado[1].ultimoCapituloLidoId, resultado[1].ultimaLeituraEm, resultado[1].progressoLeitura, resultado[1].visualizacoes, resultado[1].totalCurtidas, resultado[1].totalComentarios, resultado[1].totalSalvos, resultado[1].totalLidos], ["local", "agora", 0, 3, 4, 5, 6, 7]);
  assert.equal(remoto.capitulos[0].curtiu, false);
});

test("Adicionar Capítulo delega apenas o merge remoto/local", () => {
  assert.doesNotMatch(pageSource, /function mesclarObrasComSupabase\(/); assert.match(pageSource, /mesclarObrasComSupabase\(\s*obrasLocais,\s*obrasSupabase\s*\)/); assert.match(pageSource, /function carregarObrasLocais\(/); assert.doesNotMatch(source, /useState|useEffect|localStorage|\.from\(|router/);
});
