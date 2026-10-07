import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

function transpilarModuloTypescript(caminho, substituicoes = []) {
  let texto = readFileSync(new URL(caminho, import.meta.url), "utf8");

  substituicoes.forEach(([padrao, substituicao]) => {
    texto = texto.replace(padrao, substituicao);
  });

  return typescript.transpileModule(texto, {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  }).outputText;
}

function criarUrlModulo(codigo) {
  return `data:text/javascript;base64,${Buffer.from(codigo).toString("base64")}`;
}

const paginaServidor = readFileSync(
  new URL("../../app/obra/[slug]/page.tsx", import.meta.url),
  "utf8",
);
const paginaCliente = readFileSync(
  new URL("../../app/obra/[slug]/ObraDinamicaClient.tsx", import.meta.url),
  "utf8",
);
const carregadorObra = readFileSync(
  new URL(
    "../../app/obra/[slug]/lib/obra-public-work-loader.ts",
    import.meta.url,
  ),
  "utf8",
);

const adultoUrl = criarUrlModulo(
  "export const normalizarAvisosConteudo18 = () => [];",
);
const utilsUrl = criarUrlModulo([
  "export const criarSlugBase = (texto) => String(texto)",
  '.normalize("NFD").replace(/[\\u0300-\\u036f]/g, "")',
  '.toLowerCase().trim().replace(/\\s+/g, "-");',
].join(" "));
const metricasUrl = criarUrlModulo([
  "export const normalizarContadorObraPublica = () => 0;",
  "export const totalComentariosObraPublica = () => 0;",
  "export const totalCurtidasObraPublica = () => 0;",
  "export const totalVisualizacoesObraPublica = () => 0;",
].join("\n"));
const leituraUrl = criarUrlModulo([
  "export const calcularProgressoLeitura = () => 0;",
  "export const normalizarCapituloLocal = () => ({});",
  "export const obraLocalEstaDisponivelParaLeitura = () => false;",
].join("\n"));
const arquivoUrl = criarUrlModulo([
  "export const normalizarArquivoObra = (arquivo) => arquivo || null;",
  "export const normalizarCategoriaArquivoSupabase = () => \"\";",
  "export const obterChavesBackupObra = () => [];",
].join("\n"));
const dadosObraJavascript = transpilarModuloTypescript(
  "../../app/obra/[slug]/lib/obra-data-utils.ts",
)
  .replace(
    'from "../../../../lib/historietasAdultContent";',
    `from "${adultoUrl}";`,
  )
  .replace('from "../../../../lib/utils";', `from "${utilsUrl}";`)
  .replace('from "./obra-metric-utils";', `from "${metricasUrl}";`)
  .replace('from "./obra-reading-utils";', `from "${leituraUrl}";`)
  .replace('from "./obra-file-utils";', `from "${arquivoUrl}";`);
const {
  removerObraLocalAusentePorSlug,
  substituirOuInserirObraLocal,
} = await import(criarUrlModulo(dadosObraJavascript));

function obterBloco(texto, inicioTexto, fimTexto) {
  const inicio = texto.indexOf(inicioTexto);
  const fim = texto.indexOf(fimTexto, inicio);

  assert.ok(inicio >= 0);
  assert.ok(fim > inicio);

  return texto.slice(inicio, fim);
}

test("rota da obra usa 404 real apenas para slug invalido ou obra ausente", () => {
  const bloco = paginaServidor.slice(
    paginaServidor.indexOf("export default async function ObraPage"),
  );

  assert.match(
    paginaServidor,
    /import \{ notFound \} from "next\/navigation";/,
  );
  assert.match(bloco, /const slug = await obterSlug\(params\);/);
  assert.match(bloco, /if \(!slug\) \{\s*notFound\(\);\s*\}/);
  assert.match(
    bloco,
    /const obra = await obterObraMetadataPublica\(slug\);/,
  );
  assert.match(bloco, /if \(!obra\) \{\s*notFound\(\);\s*\}/);
  assert.doesNotMatch(bloco, /\.catch\(/);
  assert.doesNotMatch(bloco, /catch\s*\(/);
});

test("ausencia confirmada no Supabase descarta somente cache da obra atual", () => {
  const bloco = obterBloco(
    carregadorObra,
    "if (!obraBanco) {",
    "let capitulosBanco",
  );

  assert.match(
    bloco,
    /obras: removerObraLocalAusentePorSlug\(obrasLocais, slugLimpo\)/,
  );
  assert.match(bloco, /status: "nao_encontrada"/);
  assert.doesNotMatch(bloco, /aplicarMetricasSeAtual/);
});

test("remove somente a obra local ausente, por slug explicito ou derivado", () => {
  const obrasLocais = [
    {
      id: "obra-slug-explicito",
      slug: "  obra-explicita  ",
      titulo: "Titulo diferente",
    },
    {
      id: "obra-slug-derivado",
      slug: "",
      titulo: "Obra Derivada",
    },
    {
      id: "obra-preservada",
      slug: "obra-preservada",
      titulo: "Obra Preservada",
    },
  ];

  const semSlugExplicito = removerObraLocalAusentePorSlug(
    obrasLocais,
    "obra-explicita",
  );
  assert.deepEqual(
    semSlugExplicito.map((obra) => obra.id),
    ["obra-slug-derivado", "obra-preservada"],
  );
  assert.equal(semSlugExplicito[0], obrasLocais[1]);
  assert.equal(semSlugExplicito[1], obrasLocais[2]);

  const semSlugDerivado = removerObraLocalAusentePorSlug(
    obrasLocais,
    "obra-derivada",
  );
  assert.deepEqual(
    semSlugDerivado.map((obra) => obra.id),
    ["obra-slug-explicito", "obra-preservada"],
  );

  const semCorrespondencia = removerObraLocalAusentePorSlug(
    obrasLocais,
    "obra-inexistente",
  );
  assert.deepEqual(semCorrespondencia, obrasLocais);
});

test("substitui no mesmo indice ou insere a obra normalizada no inicio", () => {
  const obraPrimeira = { id: "obra-primeira", titulo: "Primeira" };
  const obraSubstituida = { id: "obra-substituida", titulo: "Antiga" };
  const obraUltima = { id: "obra-ultima", titulo: "Ultima" };
  const obrasLocais = [obraPrimeira, obraSubstituida, obraUltima];
  const obraNormalizada = { id: "obra-substituida", titulo: "Nova" };

  const obrasSubstituidas = substituirOuInserirObraLocal(
    obrasLocais,
    obraNormalizada,
  );
  assert.deepEqual(obrasSubstituidas, [
    obraPrimeira,
    obraNormalizada,
    obraUltima,
  ]);
  assert.equal(obrasSubstituidas[0], obraPrimeira);
  assert.equal(obrasSubstituidas[1], obraNormalizada);
  assert.equal(obrasSubstituidas[2], obraUltima);

  const obraNova = { id: "obra-nova", titulo: "Nova" };
  const obrasInseridas = substituirOuInserirObraLocal(obrasLocais, obraNova);
  assert.deepEqual(obrasInseridas, [
    obraNova,
    obraPrimeira,
    obraSubstituida,
    obraUltima,
  ]);
  assert.equal(obrasInseridas[1], obraPrimeira);
  assert.equal(obrasInseridas[2], obraSubstituida);
  assert.equal(obrasInseridas[3], obraUltima);
});

test("erro do Supabase preserva fallback local e e tratado como erro", () => {
  const blocoCarregador = carregadorObra;

  assert.match(
    blocoCarregador,
    /export async function carregarObraSupabasePorSlug\(/,
  );

  assert.match(
    blocoCarregador,
    /if \(erroObra\)[\s\S]*?obras: await aplicarMetricasSeAtual\(obrasLocais\),[\s\S]*?status: "erro"/,
  );
  assert.match(
    blocoCarregador,
    /catch \(error\)[\s\S]*?obras: await aplicarMetricasSeAtual\(obrasLocais\),[\s\S]*?status: "erro"/,
  );

  const blocoEfeito = obterBloco(
    paginaCliente,
    "async function carregarObraPublica()",
    "void carregarObraPublica();",
  );

  assert.match(
    blocoEfeito,
    /setErroCarregamentoObra\(resultadoSupabase\.status === "erro"\)/,
  );
  assert.doesNotMatch(
    blocoEfeito,
    /catch \{[\s\S]*?setObrasLocais\(\[\]\)/,
  );
});

test("cliente diferencia indisponibilidade de obra nao encontrada", () => {
  assert.match(
    paginaCliente,
    /erroCarregamentoObra[\s\S]*?"Não foi possível carregar a obra agora\."[\s\S]*?"Obra não encontrada"/,
  );
});
