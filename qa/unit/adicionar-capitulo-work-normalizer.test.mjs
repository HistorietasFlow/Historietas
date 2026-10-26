import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(new URL("../../app/adicionar-capitulo/lib/adicionar-capitulo-work-normalizer.ts", import.meta.url), "utf8");
const pageSource = readFileSync(new URL("../../app/adicionar-capitulo/page.tsx", import.meta.url), "utf8");
const transpile = (value) => typescript.transpileModule(value, { compilerOptions: { module: typescript.ModuleKind.ESNext, target: typescript.ScriptTarget.ES2022 } }).outputText;
const dependencyUrl = (code) => `data:text/javascript;base64,${Buffer.from(code).toString("base64")}`;
const normalizerUrl = dependencyUrl(`export const normalizarCapitulo=(c,i)=>({id:typeof c.id==='string'&&c.id.trim()?c.id:'capitulo-'+(i+1),titulo:typeof c.titulo==='string'&&c.titulo.trim()?c.titulo:'Capítulo '+(i+1),texto:typeof c.texto==='string'?c.texto:'',curtiu:Boolean(c.curtiu),salvo:Boolean(c.salvo),comentario:typeof c.comentario==='string'?c.comentario:'',criadoEm:'',lido:Boolean(c.lido),lidoEm:'',publicado:undefined,ordem:i+1});`);
const fileUrl = dependencyUrl(`export const normalizarArquivoObra=(a)=>a&&a.nome&&a.conteudo?{...a}:null;`);
const metricsUrl = dependencyUrl(`export const calcularProgressoLeitura=(c)=>c.length?Math.round(c.filter(x=>x.lido).length/c.length*100):0;`);
const numberUrl = dependencyUrl(`export const obterCampoNumericoObraAdicionarCapitulo=(o,cs,f=0)=>{const v=cs.map(c=>o[c]).find(v=>(typeof v==='number'&&Number.isFinite(v))||(typeof v==='string'&&Boolean(v.trim())));const n=typeof v==='number'?v:typeof v==='string'?Number(v.replace(/\\./g,'').replace(',','.')):NaN;return Number.isFinite(n)?Math.max(0,Math.round(n)):Math.max(0,Math.round(f));};`);
const utilsUrl = dependencyUrl(`export const criarSlugBase=(t)=>t.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');`);
const javascript = transpile(source.replace('"../../../lib/utils"', JSON.stringify(utilsUrl)).replace('"./adicionar-capitulo-chapter-normalizer"', JSON.stringify(normalizerUrl)).replace('"./adicionar-capitulo-file-normalizer"', JSON.stringify(fileUrl)).replace('"./adicionar-capitulo-metrics-utils"', JSON.stringify(metricsUrl)).replace('"./adicionar-capitulo-number-utils"', JSON.stringify(numberUrl)));
const { normalizarObra } = await import(dependencyUrl(javascript));

test("normalizarObra preserva capítulos, tags, fallbacks e métricas", () => {
  const obra = normalizarObra({ id: " id ", titulo: "", autor: "", user_id: " user ", tags: [" x ", " ", 1], capitulos: [{ id: "c", titulo: "C", comentario: " ", curtiu: true, salvo: true, lido: true }], arquivoObra: { nome: "a", conteudo: "b" }, publicado: "sim" }, 2);
  assert.equal(obra.id, " id "); assert.equal(obra.titulo, "Obra sem título"); assert.equal(obra.autor, "Autor não informado"); assert.equal(obra.autorId, "user"); assert.deepEqual(obra.tags, ["x"]); assert.equal(obra.totalCurtidas, 1); assert.equal(obra.totalComentarios, 0); assert.equal(obra.totalSalvos, 1); assert.equal(obra.totalLidos, 1); assert.equal(obra.progressoLeitura, 100); assert.equal(obra.publicado, true); assert.deepEqual(obra.arquivoObra, { nome: "a", conteudo: "b" });
  const fallback = normalizarObra({ tags: [" "], capitulos: [] }, 3);
  assert.deepEqual(fallback.tags, ["sem tags"]); assert.deepEqual(fallback.capitulos, []); assert.equal(fallback.id, "obra-4"); assert.equal(fallback.genero, "Não informado"); assert.equal(fallback.formato, "Não informado"); assert.equal(fallback.classificacaoIndicativa, "Não informada"); assert.equal(fallback.sinopse, "Nenhuma sinopse informada."); assert.equal(fallback.slug, "obra-4"); assert.equal(fallback.link, "/obra/obra-4");
});

test("normalizarObra preserva precedência, aliases, slug e link", () => {
  assert.equal(normalizarObra({ autorId: " a ", user_id: "b", userId: "c", autor_id: "d" }, 0).autorId, "a");
  assert.equal(normalizarObra({ user_id: " b ", userId: "c", autor_id: "d" }, 0).autorId, "b");
  assert.equal(normalizarObra({ userId: " c ", autor_id: "d" }, 0).autorId, "c");
  assert.equal(normalizarObra({ autor_id: " d " }, 0).autorId, "d");
  const obra = normalizarObra({ titulo: "Título", visualizacoesTotal: 7, totalLikes: 3, totalComments: 2, totalFavoritos: 4, totalLeituras: 5, slug: " slug ", link: " /link " }, 0);
  assert.deepEqual([obra.visualizacoes, obra.totalCurtidas, obra.totalComentarios, obra.totalSalvos, obra.totalLidos], [7, 3, 2, 4, 5]); assert.equal(obra.slug, " slug "); assert.equal(obra.link, " /link ");
});

test("Adicionar Capítulo delega apenas normalização local de obra", () => {
  assert.doesNotMatch(pageSource, /function normalizarObra\(/); assert.match(pageSource, /function normalizarObraSupabase\(/); assert.equal((pageSource.match(/normalizarObra\(/g) || []).length, 2); assert.doesNotMatch(source, /supabase|localStorage|useState|useEffect|router|<[A-Z]/);
});
