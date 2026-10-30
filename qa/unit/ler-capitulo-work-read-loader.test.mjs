import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const ler = (path) => readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const fonte = ler("../../app/ler-capitulo/lib/ler-capitulo-work-read-loader.ts");
const pagina = ler("../../app/ler-capitulo/page.tsx");
const commentPersistence = ler("../../app/ler-capitulo/lib/ler-capitulo-comment-persistence.ts");
const fonteMockada = fonte
  .replace('import { supabase } from "../../../lib/supabase/client";', "const supabase = { from: (...args) => globalThis.__leitorWorkRead.supabase.from(...args) };")
  .replace('import { carregarMetricasConteudos } from "../../../lib/metricas";', "const carregarMetricasConteudos = (...args) => globalThis.__leitorWorkRead.metricas(...args);")
  .replace(
    /import \{\s*carregarTodasPaginasPorLotesSupabase,\s*carregarTodasPaginasSupabase,\s*\} from "\.\.\/\.\.\/\.\.\/lib\/supabase\/paginacao\.mjs";/,
    "const carregarTodasPaginasPorLotesSupabase = (...args) => globalThis.__leitorWorkRead.porLotes(...args);\nconst carregarTodasPaginasSupabase = (...args) => globalThis.__leitorWorkRead.paginado(...args);",
  )
  .replace(
    /import \{\s*calcularProgressoLeitura,\s*mesclarObraSupabaseComLocal,\s*type CapituloSupabaseRow,\s*type ObraLocal,\s*\} from "\.\/ler-capitulo-work-normalization";/,
    "const calcularProgressoLeitura = (...args) => globalThis.__leitorWorkRead.progresso(...args);\nconst mesclarObraSupabaseComLocal = (...args) => globalThis.__leitorWorkRead.mesclar(...args);",
  );
const js = typescript.transpileModule(fonteMockada, {
  compilerOptions: { module: typescript.ModuleKind.ESNext, target: typescript.ScriptTarget.ES2022 },
}).outputText;
const loader = await import(`data:text/javascript;base64,${Buffer.from(js).toString("base64")}`);

function cenario({
  obraBanco = { id: "obra", user_id: " autor ", publicado: true },
  erroObra = null,
  capitulos = [],
  comentarios = [],
  metricas = { carregado: false, capitulos: new Map() },
  falhaCapitulos = false,
  falhaComentarios = false,
} = {}) {
  const consultas = [];
  const chamadas = [];
  const dependencias = {
    supabase: {
      from(tabela) {
        const consulta = { tabela, passos: [] };
        consultas.push(consulta);
        const cadeia = {};
        for (const operacao of ["select", "eq", "in", "limit", "order", "range"]) {
          cadeia[operacao] = (...args) => {
            consulta.passos.push([operacao, ...args]);
            return cadeia;
          };
        }
        cadeia.maybeSingle = async () => ({ data: obraBanco, error: erroObra });
        return cadeia;
      },
    },
    async paginado({ nomeColecao, buscarPagina }) {
      chamadas.push(["paginado", nomeColecao]);
      await buscarPagina(0, 999);
      if (falhaCapitulos) throw new Error("capítulos indisponíveis");
      return capitulos;
    },
    async porLotes({ nomeColecao, itens, buscarPaginaLote }) {
      chamadas.push(["lotes", nomeColecao, itens]);
      await buscarPaginaLote(itens, 0, 999);
      if (falhaComentarios) throw new Error("comentários indisponíveis");
      return comentarios;
    },
    async metricas(args) {
      chamadas.push(["metricas", args]);
      return metricas;
    },
    mesclar(...args) {
      chamadas.push(["mesclar", ...args]);
      return { resultado: args };
    },
    progresso(caps) {
      chamadas.push(["progresso", caps]);
      return Math.round(caps.filter((cap) => cap.lido).length / caps.length * 100);
    },
  };
  globalThis.__leitorWorkRead = dependencias;
  return { consultas, chamadas };
}

test("os dois helpers e seus contratos permanecem literalmente iguais", () => {
  const corpo = fonte.slice(fonte.indexOf("export async function carregarObraSupabase("))
    .replaceAll("export async function ", "async function ").trimEnd();
  assert.equal(createHash("sha256").update(corpo).digest("hex"), "f63dc60eb6b106c1f560c919fa5c0fb797d52da1200f1cd564814a75528d7492");
  const inicializacao = ler("../../app/ler-capitulo/hooks/use-ler-capitulo-initial-load.ts");
  assert.match(inicializacao, /from "\.\.\/lib\/ler-capitulo-work-read-loader";/);
  assert.match(pagina, /useLerCapituloInitialLoad\(/);
  for (const nome of ["carregarObraSupabase", "aplicarInteracoesCapitulosSupabase"]) {
    assert.match(fonte, new RegExp(`export async function ${nome}\\(`));
    assert.doesNotMatch(pagina, new RegExp(`async function ${nome}\\(`));
    assert.match(inicializacao, new RegExp(`await ${nome}\\(`));
  }
  assert.doesNotMatch(fonte, /\.(?:insert|update|delete|upsert)\s*\(|\b(?:localStorage|useEffect|useState)\b/);
  const persistencia = ler("../../app/ler-capitulo/lib/ler-capitulo-interaction-persistence.ts");
  assert.match(pagina, /from "\.\/lib\/ler-capitulo-interaction-persistence";/);
  assert.match(persistencia, /export async function salvarProgressoLeituraSupabase\(/);
  assert.doesNotMatch(pagina, /async function salvarProgressoLeituraSupabase\(/);
  assert.match(pagina, /from "\.\/lib\/ler-capitulo-comment-persistence";/);
  assert.doesNotMatch(pagina, /async function salvarComentarioCapituloSupabase\(/);
  assert.match(commentPersistence, /export async function salvarComentarioCapituloSupabase\(/);
});

test("obra ausente ou não publicada não é carregada para visitante", async () => {
  let atual = cenario({ obraBanco: null });
  assert.equal(await loader.carregarObraSupabase("obra"), null);
  assert.equal(atual.consultas.length, 1);
  atual = cenario({ erroObra: { message: "erro" } });
  assert.equal(await loader.carregarObraSupabase("obra"), null);
  atual = cenario({ obraBanco: { id: "obra", user_id: "autor", publicado: false } });
  assert.equal(await loader.carregarObraSupabase("obra", null, "visitante"), null);
  assert.equal(atual.consultas.length, 1);
});

test("leitura preserva filtros, ordenação e paginação de visitante e dono", async () => {
  const capitulos = [{ id: "c1" }];
  const local = { id: "local" };
  let atual = cenario({ capitulos });
  assert.deepEqual((await loader.carregarObraSupabase("obra", local, "visitante")).resultado, [
    { id: "obra", user_id: " autor ", publicado: true }, capitulos, local, false,
  ]);
  assert.deepEqual(atual.consultas[0], { tabela: "obras", passos: [
    ["select", "id,user_id,titulo,autor,genero,formato,classificacao_indicativa,avisos_conteudo,sinopse,tags,capa_url,capa_nome,arquivo_url,arquivo_nome,arquivo_tipo,arquivo_tamanho,arquivo_categoria,publicado,slug,link,criada_em,atualizado_em"],
    ["eq", "id", "obra"], ["limit", 1],
  ] });
  assert.deepEqual(atual.consultas[1], { tabela: "capitulos", passos: [
    ["select", "id,obra_id,user_id,titulo,texto,ordem,publicado,visualizacoes,criado_em,atualizado_em"],
    ["eq", "obra_id", "obra"], ["eq", "publicado", true],
    ["order", "ordem", { ascending: true }], ["order", "id", { ascending: true }], ["range", 0, 999],
  ] });
  atual = cenario({ obraBanco: { id: "obra", user_id: " autor ", publicado: false }, capitulos });
  assert.equal((await loader.carregarObraSupabase("obra", local, "autor")).resultado[3], true);
  assert.ok(!atual.consultas[1].passos.some((passo) => passo[0] === "eq" && passo[1] === "publicado"));
});

test("falha de paginação preserva composição da obra com capítulos vazios", async () => {
  cenario({ falhaCapitulos: true });
  assert.deepEqual((await loader.carregarObraSupabase("obra")).resultado[1], []);
});

test("sem capítulos não há consulta; interações remotas preservam comentários e progresso", async () => {
  let atual = cenario();
  const vazia = { id: "obra", capitulos: [] };
  assert.equal(await loader.aplicarInteracoesCapitulosSupabase(vazia, "u"), vazia);
  assert.deepEqual(atual.consultas, []);
  const obra = { id: "obra", ultimoCapituloLidoId: "antigo", ultimaLeituraEm: "antiga", capitulos: [
    { id: "c1", curtiu: true, salvo: false, comentario: "local", lido: true, lidoEm: "2024-01-01" },
    { id: "c2", curtiu: false, salvo: false, comentario: "local 2", lido: false, lidoEm: "" },
  ] };
  atual = cenario({
    comentarios: [{ capitulo_id: "c1", comentario: "remoto" }, { capitulo_id: null, comentario: "inválido" }],
    metricas: { carregado: true, capitulos: new Map([
      ["c1", { usuario: { leu: false, curtiu: false, salvou: true, lidoEm: "" } }],
      ["c2", { usuario: { leu: true, curtiu: true, salvou: false, lidoEm: "2025-01-01" } }],
    ]) },
  });
  const resultado = await loader.aplicarInteracoesCapitulosSupabase(obra, "u");
  assert.deepEqual(resultado.capitulos[0], { ...obra.capitulos[0], salvo: true, comentario: "remoto", lido: false, lidoEm: "" });
  assert.deepEqual(resultado.capitulos[1], { ...obra.capitulos[1], curtiu: true, lido: true, lidoEm: "2025-01-01" });
  assert.equal(resultado.ultimoCapituloLidoId, "c2");
  assert.equal(resultado.ultimaLeituraEm, "2025-01-01");
  assert.equal(resultado.progressoLeitura, 50);
  assert.deepEqual(atual.consultas[0], { tabela: "comentarios_capitulos", passos: [
    ["select", "id,capitulo_id,comentario,atualizado_em"], ["eq", "user_id", "u"], ["in", "capitulo_id", ["c1", "c2"]],
    ["order", "atualizado_em", { ascending: false }], ["order", "id", { ascending: false }], ["range", 0, 999],
  ] });
  assert.ok(atual.chamadas.some((chamada) => chamada[0] === "metricas" && JSON.stringify(chamada[1]) === JSON.stringify({ obraIds: ["obra"], capituloIds: ["c1", "c2"] })));
});

test("falha dos comentários e métricas não carregadas preserva valores locais", async () => {
  cenario({ falhaComentarios: true });
  const obra = { id: "obra", ultimoCapituloLidoId: "c1", ultimaLeituraEm: "data original", capitulos: [
    { id: "c1", curtiu: false, salvo: true, comentario: "local", lido: true, lidoEm: "inválida" },
  ] };
  const resultado = await loader.aplicarInteracoesCapitulosSupabase(obra, "u");
  assert.deepEqual(resultado.capitulos, obra.capitulos);
  assert.equal(resultado.ultimoCapituloLidoId, "c1");
  assert.equal(resultado.ultimaLeituraEm, "data original");
  assert.equal(resultado.progressoLeitura, 100);
});
