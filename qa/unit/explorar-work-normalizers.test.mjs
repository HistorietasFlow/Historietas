import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const ler = (caminho) =>
  readFileSync(new URL(caminho, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const modulo = ler("../../app/explorar/lib/explorar-work-normalizers.ts");
const pagina = ler("../../app/explorar/page.tsx");
const storage = ler("../../app/explorar/lib/explorar-local-storage.ts");
const compilar = (codigo) =>
  typescript.transpileModule(codigo, {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  }).outputText;
const urlModulo = (codigo) =>
  `data:text/javascript;base64,${Buffer.from(compilar(codigo)).toString("base64")}`;
const utilUrl = urlModulo(ler("../../lib/utils.ts"));
const adultoUrl = urlModulo(ler("../../lib/historietasAdultContent.ts"));
const executavel = modulo
  .replace("../../../lib/utils", utilUrl)
  .replace("../../../lib/historietasAdultContent", adultoUrl);
const normalizadores = await import(urlModulo(executavel));
const {
  normalizarContadorExplorar,
  totalCurtidasObra,
  totalComentariosObra,
  totalSalvosObra,
  totalLidosObra,
  obraTemAtividadeLeitura,
  calcularProgressoLeitura,
  dataCriacaoObra,
  dataUltimoCapituloObraExplorar,
  pontuacaoRecomendacaoObraExplorar,
  normalizarCapitulo,
  normalizarArquivoObra,
  obraTemArquivoAnexadoExplorar,
  obraTemConteudoPublicadoExplorar,
  criarChavesBackupObra,
  normalizarObra,
  normalizarCategoriaArquivoSupabase,
  normalizarObraSupabase,
  mesclarObrasSemDuplicar,
} = normalizadores;

const semBackup = () => null;
const criarObraLocal = (dados = {}) => normalizarObra(dados, 0, "", semBackup);

test("os modelos e corpos movidos preservam literalmente o original", () => {
  const original = modulo
    .replace(/^import \{ criarSlugBase[^\n]+\nimport \{[\s\S]*?\} from "\.\.\/\.\.\/\.\.\/lib\/historietasAdultContent";\n\n/, "")
    .replace(/^export (?=type|function)/gm, "")
    .replace(
      '  userId = "",\n  obterArquivoObraComBackup: (\n    obra: Partial<ObraLocal> & Record<string, unknown>,\n    slug: string,\n    userId?: string\n  ) => ArquivoObraLocal | null\n): ObraLocal {',
      '  userId = ""\n): ObraLocal {',
    )
    .trimEnd();
  assert.equal(
    createHash("sha256").update(original).digest("hex"),
    "09bc0b83ef318ed23034e20a384c54c84d20b915c5f01f269b6e1f7ad606035c",
  );
});

test("contadores, métricas, progresso e datas mantêm regras e fallbacks", () => {
  for (const [valor, esperado] of [
    [null, 0], [NaN, 0], [-1.9, 0], [1.6, 2], ["1.234,5", 1235],
    ["  ", 0], ["inválido", 0],
  ]) {
    assert.equal(normalizarContadorExplorar(valor), esperado);
  }
  const obra = criarObraLocal({
    criadaEm: "2024-01-01",
    visualizacoes: 10,
    totalCurtidas: 5,
    totalComentarios: 1,
    totalSalvos: 2,
    totalFavoritos: 4,
    totalLidos: 0,
    capitulos: [
      { curtiu: true, comentario: " texto ", salvo: true, lido: true, criadoEm: "2024-01-02" },
      { curtiu: true, comentario: " ", salvo: true, lido: false, criadoEm: "inválido" },
      { comentario: "outro", lido: true, criadoEm: "2024-01-03" },
    ],
  });
  assert.equal(totalCurtidasObra(obra), 5);
  assert.equal(totalComentariosObra(obra), 2);
  assert.equal(totalSalvosObra(obra), 4);
  assert.equal(totalLidosObra(obra), 2);
  assert.equal(obraTemAtividadeLeitura(obra), true);
  assert.equal(calcularProgressoLeitura([]), 0);
  assert.equal(calcularProgressoLeitura(obra.capitulos), 67);
  assert.equal(dataCriacaoObra(obra), Date.parse("2024-01-01"));
  assert.equal(dataUltimoCapituloObraExplorar(obra), Date.parse("2024-01-03"));
  assert.equal(dataCriacaoObra(criarObraLocal({ criadaEm: "inválido" })), 0);
  assert.equal(pontuacaoRecomendacaoObraExplorar(obra), 96);
});

test("normaliza capítulos e arquivos sem alterar publicação ou conteúdo", () => {
  assert.deepEqual(normalizarCapitulo({}, 1), {
    id: "capitulo-2", titulo: "Capítulo sem título", texto: "",
    curtiu: false, salvo: false, comentario: "", criadoEm: "", lido: false,
    lidoEm: "", publicado: true, totalCurtidas: 0, totalComentarios: 0,
    totalSalvos: 0, totalLidos: 0,
  });
  const capitulo = normalizarCapitulo({ id: " id ", publicado: false, lido: true, totalCurtidas: 1.8 }, 0);
  assert.equal(capitulo.id, " id ");
  assert.equal(capitulo.publicado, false);
  assert.equal(capitulo.totalCurtidas, 2);
  for (const invalido of [null, [], "texto", {}, { nome: "  ", conteudo: "x" }, { nome: "x", conteudo: "  " }]) {
    assert.equal(normalizarArquivoObra(invalido), null);
  }
  const arquivo = normalizarArquivoObra({
    nome: " nome.txt ", conteudo: " texto ", tipo: "text/plain",
    tamanho: Infinity, categoria: "desconhecida",
  });
  assert.deepEqual(arquivo, {
    nome: "nome.txt", conteudo: " texto ", tipo: "text/plain",
    tamanho: 0, categoria: "outro", criadoEm: "",
  });
  assert.equal(obraTemArquivoAnexadoExplorar({ arquivoObra: arquivo }), true);
  assert.equal(obraTemConteudoPublicadoExplorar({ capitulos: [], arquivoObra: null }), false);
  assert.equal(obraTemConteudoPublicadoExplorar({ capitulos: [capitulo], arquivoObra: null }), true);
  assert.equal(obraTemConteudoPublicadoExplorar({ capitulos: [], arquivoObra: arquivo }), true);
});

test("obra local mantém defaults, 18+, IDs e chamada do backup", () => {
  const chamadas = [];
  const arquivo = normalizarArquivoObra({ nome: "obra.txt", conteudo: "conteúdo", categoria: "texto" });
  const entrada = {
    titulo: "  Título Épico  ", user_id: " autor ", classificacaoIndicativa: "18+",
    avisosConteudo: ["terror", " terror ", "inválido"], tags: [" ação ", " ", 3],
    capitulos: [{ lido: true }, { publicado: false, lido: false }],
    total_comentarios: "2", publicado: true,
  };
  const obra = normalizarObra(entrada, 4, "usuario", (...args) => {
    chamadas.push(args);
    return arquivo;
  });
  assert.deepEqual(chamadas, [[entrada, "titulo-epico", "usuario"]]);
  assert.equal(obra.id, "obra-5");
  assert.equal(obra.titulo, "Título Épico");
  assert.equal(obra.autorId, "autor");
  assert.equal(obra.autor, "Autor não informado");
  assert.deepEqual(obra.avisosConteudo, ["terror"]);
  assert.deepEqual(obra.tags, ["ação"]);
  assert.equal(obra.capitulos.length, 1);
  assert.equal(obra.progressoLeitura, 100);
  assert.equal(obra.totalComentarios, 2);
  assert.equal(obra.arquivoObra, arquivo);
  assert.equal(obra.link, "/obra/titulo-epico");
  const usuarioPadrao = [];
  normalizarObra({}, 0, undefined, (_obra, _slug, userId) => {
    usuarioPadrao.push(userId);
    return null;
  });
  assert.deepEqual(usuarioPadrao, [""]);
  assert.deepEqual(criarObraLocal({ classificacaoIndicativa: "18+" }).avisosConteudo, ["outro_tema_adulto"]);
  assert.deepEqual(criarObraLocal({ classificacaoIndicativa: "Livre", avisosConteudo: ["terror"] }).avisosConteudo, []);
  assert.deepEqual(criarChavesBackupObra({ id: " id ", titulo: " Árvore  Azul ", link: " /a " }, "slug"), [
    "id:id", "slug:slug", "titulo:arvore azul", "link:/a",
  ]);
});

test("obra Supabase preserva aliases locais, conteúdo 18+ e fallbacks", () => {
  const local = criarObraLocal({
    classificacaoIndicativa: "18+", avisosConteudo: ["terror"],
    ultimoCapituloLidoId: "c1", ultimaLeituraEm: "2024-01-02",
    capitulos: [{ id: "c1", titulo: "Local", lido: true, curtiu: true, comentario: "nota" }],
    totalCurtidas: 7,
  });
  const remota = {
    id: "obra-id", user_id: " user ", titulo: " História ", autor: null,
    genero: null, formato: null, classificacao_indicativa: null, avisos_conteudo: null,
    sinopse: null, tags: [], capa_url: null, capa_nome: null, arquivo_url: " arquivo ",
    arquivo_nome: null, arquivo_tipo: null, arquivo_tamanho: 7, arquivo_categoria: "documento",
    publicado: true, slug: null, link: null, criada_em: "2024-01-01", atualizado_em: null,
    visualizacoes: null,
  };
  const obra = normalizarObraSupabase(remota, [{ id: "c1", titulo: null, criado_em: null }], local, 0);
  assert.equal(obra.id, "obra-id");
  assert.equal(obra.autorId, "user");
  assert.equal(obra.slug, "historia");
  assert.equal(obra.link, "/obra/historia");
  assert.deepEqual(obra.avisosConteudo, ["terror"]);
  assert.equal(obra.capitulos[0].titulo, "Local");
  assert.equal(obra.capitulos[0].lido, true);
  assert.equal(obra.capitulos[0].curtiu, true);
  assert.equal(obra.progressoLeitura, 100);
  assert.equal(obra.totalCurtidas, 7);
  assert.deepEqual(obra.arquivoObra, {
    nome: "Arquivo da obra", tipo: "application/pdf", tamanho: 7,
    conteudo: "arquivo", categoria: "documento", criadoEm: "2024-01-01",
  });
  assert.equal(normalizarCategoriaArquivoSupabase("inválido"), "outro");
  assert.equal(normalizarObraSupabase({ ...remota, arquivo_url: null }, [], undefined, 0).arquivoObra, null);
});

test("merge conserva precedência remota, ordem e deduplicação por id ou slug", () => {
  const remota = criarObraLocal({ id: "a", titulo: "Remota", slug: "comum" });
  const mesmoId = criarObraLocal({ id: "a", titulo: "Outro" });
  const mesmoSlug = criarObraLocal({ id: "b", titulo: "Outro", slug: "comum" });
  const unico = criarObraLocal({ id: "c", titulo: "Único" });
  assert.deepEqual(mesclarObrasSemDuplicar([mesmoId, mesmoSlug, unico], [remota]), [remota, unico]);
});

test("a página injeta o backup e mantém storage e queries fora dos normalizadores", () => {
  for (const nome of ["carregarBackupArquivosObras", "obterArquivoObraComBackup", "salvarBackupsArquivosObras"]) {
    assert.match(storage, new RegExp(`export function ${nome}\\(`));
    assert.doesNotMatch(pagina, new RegExp(`function ${nome}\\(`));
    assert.doesNotMatch(modulo, new RegExp(`function ${nome}\\(`));
  }
  assert.match(pagina, /normalizarObra\(obra, index, userIdAtual, obterArquivoObraComBackup\)/);
  assert.match(pagina, /from "\.\/lib\/explorar-work-normalizers"/);
  assert.match(pagina, /from "\.\/lib\/explorar-local-storage"/);
  assert.doesNotMatch(pagina, /function normalizarObraSupabase\(/);
  assert.doesNotMatch(modulo, /\b(?:supabase|localStorage|window|document|useEffect|useState)\b/i);
});
