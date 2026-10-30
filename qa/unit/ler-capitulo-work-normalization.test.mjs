import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const ler = (path) => readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const modulo = ler("../../app/ler-capitulo/lib/ler-capitulo-work-normalization.ts");
const pagina = ler("../../app/ler-capitulo/page.tsx");
const storage = ler("../../app/ler-capitulo/lib/ler-capitulo-local-storage.ts");
const loader = ler("../../app/ler-capitulo/lib/ler-capitulo-work-read-loader.ts");
const mutacoes = ler("../../app/ler-capitulo/lib/ler-capitulo-local-work-mutations.ts");
const acoesObraLocal = ler("../../app/ler-capitulo/lib/ler-capitulo-local-work-actions.ts");
const js = (source) => ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const dataUrl = (source) => `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
const utilsUrl = dataUrl(js(ler("../../lib/utils.ts")));
const adultUrl = dataUrl(js(ler("../../lib/historietasAdultContent.ts")));
const executavel = js(modulo)
  .replace('"../../../lib/utils"', JSON.stringify(utilsUrl))
  .replace('"../../../lib/historietasAdultContent"', JSON.stringify(adultUrl));
const { normalizarObra, calcularProgressoLeitura, mesclarObraSupabaseComLocal } = await import(dataUrl(executavel));

test("normalização preserva fallbacks, tags, slug e progresso arredondado", () => {
  const obra = normalizarObra({ titulo: "Uma História", autorId: " autor ", tags: [" ação ", " ", 4], capitulos: [{ lido: true }, { lido: false }, { lido: false }] }, 1);
  assert.equal(obra.id, "obra-2");
  assert.equal(obra.autor, "Autor não informado");
  assert.equal(obra.autorId, "autor");
  assert.deepEqual(obra.tags, ["ação"]);
  assert.equal(obra.slug, "uma-historia");
  assert.equal(obra.link, "/obra/uma-historia");
  assert.equal(obra.progressoLeitura, 33);
  assert.equal(obra.capitulos[0].id, "capitulo-1");
  assert.equal(obra.capitulos[0].titulo, "Capítulo 1");
  assert.equal(calcularProgressoLeitura([]), 0);
  assert.deepEqual(normalizarObra({}, 0).tags, ["sem tags"]);
});

test("arquivo local inválido é descartado e arquivo válido conserva conteúdo", () => {
  for (const arquivo of [null, [], {}, { nome: "  ", conteudo: "texto" }, { nome: "x", conteudo: "  " }]) {
    assert.equal(normalizarObra({ arquivoObra: arquivo }, 0).arquivoObra, null);
  }
  const arquivo = normalizarObra({ arquivoObra: { nome: " a.txt ", conteudo: " texto ", categoria: "desconhecida", tamanho: Infinity } }, 0).arquivoObra;
  assert.deepEqual(arquivo, { nome: "a.txt", tipo: "", tamanho: 0, conteudo: " texto ", categoria: "outro", criadoEm: "" });
});

test("avisos 18+ preservam classificação, deduplicação e fallback", () => {
  assert.deepEqual(normalizarObra({ classificacaoIndicativa: "18+", avisosConteudo: [" terror ", "terror", "inválido"] }, 0).avisosConteudo, ["terror"]);
  assert.deepEqual(normalizarObra({ classificacaoIndicativa: "18+", avisosConteudo: [] }, 0).avisosConteudo, ["outro_tema_adulto"]);
  assert.deepEqual(normalizarObra({ classificacaoIndicativa: "Livre", avisosConteudo: ["terror"] }, 0).avisosConteudo, []);
  assert.deepEqual(mesclarObraSupabaseComLocal({ id: "obra", user_id: "a", classificacao_indicativa: "18+", avisos_conteudo: ["terror"] }, []).avisosConteudo, ["terror"]);
});

test("composição mantém interações locais, sequência remota e inclusão opcional dos capítulos locais", () => {
  const local = normalizarObra({ titulo: "Local", tags: ["local"], ultimoCapituloLidoId: "c1", ultimaLeituraEm: "2024-01-01", capitulos: [{ id: "c1", titulo: "Local 1", texto: "texto local", curtiu: true, salvo: true, comentario: "nota", lido: true, lidoEm: "data" }, { id: "somente-local", lido: false }] }, 0);
  const remoto = { id: "obra", user_id: "autor", titulo: " Remoto ", publicado: true, tags: [" remota "] };
  const capitulos = [{ id: "c1", titulo: " Capítulo remoto ", texto: " ", publicado: true, visualizacoes: 8 }];
  const resultado = mesclarObraSupabaseComLocal(remoto, capitulos, local, true);
  assert.equal(resultado.titulo, "Remoto");
  assert.equal(resultado.autorId, "autor");
  assert.deepEqual(resultado.tags, ["remota"]);
  assert.deepEqual(resultado.capitulos.map((c) => c.id), ["c1", "somente-local"]);
  assert.equal(resultado.capitulos[0].titulo, "Capítulo remoto");
  assert.equal(resultado.capitulos[0].texto, "texto local");
  assert.equal(resultado.capitulos[0].curtiu, true);
  assert.equal(resultado.capitulos[0].salvo, true);
  assert.equal(resultado.capitulos[0].comentario, "nota");
  assert.equal(resultado.capitulos[0].lido, true);
  assert.equal(resultado.capitulos[0].lidoEm, "data");
  assert.equal(resultado.capitulos[0].visualizacoes, 8);
  assert.equal(resultado.ultimoCapituloLidoId, "c1");
  assert.equal(resultado.ultimaLeituraEm, "2024-01-01");
  assert.equal(resultado.progressoLeitura, 50);
  assert.deepEqual(mesclarObraSupabaseComLocal(remoto, capitulos, local).capitulos.map((c) => c.id), ["c1"]);
});

test("composição preserva fallback local de arquivo e dados remotos válidos", () => {
  const local = normalizarObra({ arquivoObra: { nome: "local.txt", conteudo: "local", categoria: "texto" } }, 0);
  const remoto = { id: "obra", user_id: "", arquivo_url: null, arquivo_nome: null };
  assert.deepEqual(mesclarObraSupabaseComLocal(remoto, [], local).arquivoObra, local.arquivoObra);
  const arquivo = mesclarObraSupabaseComLocal({ ...remoto, arquivo_url: " URL ", arquivo_nome: " livro.pdf ", arquivo_categoria: "documento", arquivo_tamanho: 20 }, [], local).arquivoObra;
  assert.equal(arquivo.nome, "livro.pdf");
  assert.equal(arquivo.conteudo, "URL");
  assert.equal(arquivo.categoria, "documento");
  assert.equal(arquivo.tamanho, 20);
});

test("página delega transformações mantendo carregamento e persistência fora do módulo puro", () => {
  for (const nome of ["normalizarObra", "calcularProgressoLeitura", "mesclarObraSupabaseComLocal"]) {
    assert.match(modulo, new RegExp(`export function ${nome}\\(`));
    assert.doesNotMatch(pagina, new RegExp(`function ${nome}\\(`));
    assert.match(
      nome === "mesclarObraSupabaseComLocal" ? loader : mutacoes,
      new RegExp(`\\b${nome}\\(`),
    );
  }
  assert.match(pagina, /from "\.\/lib\/ler-capitulo-work-normalization"/);
  assert.match(pagina, /from "\.\/lib\/ler-capitulo-local-work-actions"/);
  assert.match(pagina, /criarAcoesObraLocalLeitor\(\{/);
  assert.match(acoesObraLocal, /normalizarObrasLeitor\(/);
  assert.match(acoesObraLocal, /atualizarCapituloNasObrasLeitor\(/);
  assert.match(
    pagina,
    /criarAcaoProgressoLeituraCapitulo\(\{[\s\S]*?normalizarObra,[\s\S]*?calcularProgressoLeitura,/,
  );
  assert.match(loader, /export async function carregarObraSupabase\(/);
  assert.match(pagina, /useLerCapituloInitialLoad\(/);
  const inicializacao = ler("../../app/ler-capitulo/hooks/use-ler-capitulo-initial-load.ts");
  assert.match(inicializacao, /carregarObraSupabase\(/);
  assert.match(inicializacao, /carregarObrasLocaisNormalizadas\(/);
  assert.match(storage, /export function carregarObrasLocaisNormalizadas\(/);
  assert.match(storage, /normalizarObra\(/);
  assert.doesNotMatch(modulo, /from ["'][^"']*(?:react|supabase\/client)["']|localStorage|\buse(?:Effect|State|Memo)\b|\.(?:insert|update|delete|upsert)\(/);
});
