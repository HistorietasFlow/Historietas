import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const modulo = readFileSync(
  new URL("../../app/lib/home-supabase-work-normalizers.ts", import.meta.url),
  "utf8",
);
const pagina = readFileSync(new URL("../../app/page.tsx", import.meta.url), "utf8");
const obrasLoader = readFileSync(
  new URL("../../app/lib/home-supabase-works-loader.ts", import.meta.url),
  "utf8",
);
const hookBuscaCatalogo = readFileSync(
  new URL("../../app/hooks/use-home-catalog-search.ts", import.meta.url),
  "utf8",
);

const moduloExecutavel = modulo
  .replace(
    'import { criarSlugBase } from "../../lib/utils";\n',
    `const criarSlugBase = (valor) => String(valor)
  .normalize("NFD")
  .replace(/[\\u0300-\\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "");
`,
  )
  .replace(
    'import { normalizarNumeroHome } from "./home-format-utils";\n',
    `const normalizarNumeroHome = (valor, fallback = 0) =>
  typeof valor === "number" && Number.isFinite(valor) ? Math.max(0, Math.round(valor)) : fallback;
`,
  )
  .replace(
    'import { calcularProgressoLeitura } from "./home-reading-utils";\n',
    `const calcularProgressoLeitura = (capitulos) => {
  if (capitulos.length === 0) return 0;
  return Math.round((capitulos.filter((capitulo) => capitulo.lido).length / capitulos.length) * 100);
};
`,
  );

const javascriptModulo = typescript.transpileModule(moduloExecutavel, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const {
  normalizarCategoriaArquivoHome,
  criarArquivoObraSupabaseHome,
  normalizarObraSupabaseHome,
} = await import(
  `data:text/javascript;base64,${Buffer.from(javascriptModulo).toString("base64")}`,
);

const obra = (overrides = {}) => ({
  id: "obra-1", user_id: "autor-1", titulo: "Obra Supabase", autor: "Ana",
  genero: "Fantasia", formato: "Webcomic", classificacao_indicativa: "Livre",
  sinopse: "Uma sinopse", tags: ["aventura"], capa_url: "capa.png", capa_nome: "capa.png",
  arquivo_url: null, arquivo_nome: null, arquivo_tipo: null, arquivo_tamanho: null,
  arquivo_categoria: null, publicado: true, visualizacoes: 12, slug: "obra-supabase",
  link: "/obra/obra-supabase", criada_em: "2026-01-01", ...overrides,
});

const capitulo = (overrides = {}) => ({
  id: "cap-1", obra_id: "obra-1", titulo: "Capítulo 1", ordem: 1,
  criado_em: "2026-01-02", ...overrides,
});

const obraLocal = (overrides = {}) => ({
  capitulos: [{
    id: "cap-1", titulo: "Local", texto: "", curtiu: true, salvo: true,
    comentario: "Comentário local", criadoEm: "", lido: true, lidoEm: "2026-01-03",
  }],
  ultimoCapituloLidoId: "cap-1", ultimaLeituraEm: "2026-01-03", ...overrides,
});

test("home-supabase-work-normalizers preserva as categorias de arquivo", () => {
  for (const categoria of ["texto", "documento", "imagem", "outro"]) {
    assert.equal(normalizarCategoriaArquivoHome(categoria), categoria);
  }
  assert.equal(normalizarCategoriaArquivoHome("invalida"), "outro");
  assert.equal(normalizarCategoriaArquivoHome(null), "outro");
});

test("home-supabase-work-normalizers preserva arquivo, tipo e tamanho", () => {
  assert.equal(criarArquivoObraSupabaseHome(obra()), null);
  assert.deepEqual(criarArquivoObraSupabaseHome(obra({
    arquivo_url: " arquivo.pdf ", arquivo_nome: " ", arquivo_tipo: " application/custom ",
    arquivo_tamanho: 24, arquivo_categoria: "documento",
  })), {
    nome: "Arquivo da obra", tipo: "application/custom", tamanho: 24,
    conteudo: "arquivo.pdf", categoria: "documento", criadoEm: "2026-01-01",
  });
  for (const [categoria, tipo] of [["documento", "application/pdf"], ["imagem", "image/*"], ["texto", "text/plain"], ["outro", ""]]) {
    const arquivo = criarArquivoObraSupabaseHome(obra({ arquivo_url: "arquivo", arquivo_categoria: categoria, arquivo_tamanho: Number.NaN }));
    assert.equal(arquivo.tipo, tipo);
    assert.equal(arquivo.tamanho, 0);
  }
});

test("home-supabase-work-normalizers ordena capítulos e preserva interação local", () => {
  const normalizada = normalizarObraSupabaseHome(
    obra(), [capitulo({ id: "cap-2", titulo: null, ordem: null }), capitulo()], obraLocal(), 0,
  );
  assert.deepEqual(normalizada.capitulos.map((item) => item.id), ["cap-2", "cap-1"]);
  assert.equal(normalizada.capitulos[0].titulo, "Capítulo 1");
  assert.deepEqual(normalizada.capitulos[1], {
    id: "cap-1", titulo: "Capítulo 1", texto: "", curtiu: true, salvo: true,
    comentario: "Comentário local", criadoEm: "2026-01-02", lido: true,
    lidoEm: "2026-01-03", publicado: true,
  });
  assert.equal(normalizada.progressoLeitura, 50);
  assert.equal(normalizada.totalCurtidas, 1);
  assert.equal(normalizada.totalComentarios, 1);
});

test("home-supabase-work-normalizers preserva fallbacks, tags, capa, métricas e link", () => {
  const normalizada = normalizarObraSupabaseHome(obra({
    id: "", user_id: " ", titulo: " ", autor: " ", genero: " ", formato: " ",
    classificacao_indicativa: " ", sinopse: " ", tags: [" fantasia ", "", 1], capa_url: " ",
    capa_nome: " ", slug: "", link: "", visualizacoes: null, arquivo_url: "texto.txt",
    arquivo_categoria: "texto",
  }), [], undefined, 2);
  assert.equal(normalizada.id, "obra-3");
  assert.equal(normalizada.titulo, "Obra sem título");
  assert.equal(normalizada.slug, "obra-sem-titulo");
  assert.equal(normalizada.autor, "Autor não informado");
  assert.equal(normalizada.autorId, "");
  assert.equal(normalizada.genero, "Não informado");
  assert.equal(normalizada.formato, "Não informado");
  assert.equal(normalizada.classificacaoIndicativa, "Não informada");
  assert.equal(normalizada.sinopse, "Nenhuma sinopse informada.");
  assert.deepEqual(normalizada.tags, [" fantasia "]);
  assert.equal(normalizada.capa, "");
  assert.equal(normalizada.capaNome, "");
  assert.equal(normalizada.arquivoObra?.tipo, "text/plain");
  assert.equal(normalizada.visualizacoes, 0);
  assert.equal(normalizada.link, "/obra/obra-sem-titulo");
  assert.deepEqual(normalizarObraSupabaseHome(obra({ tags: [] }), [], undefined, 0).tags, ["sem tags"]);
});

test("home-supabase-work-normalizers delega somente a normalização Supabase", () => {
  assert.match(pagina, /from "\.\/hooks\/use-home-catalog-search";/);
  assert.match(
    hookBuscaCatalogo,
    /from "\.\.\/lib\/home-supabase-works-loader";/,
  );
  assert.doesNotMatch(
    pagina,
    /from "\.\/lib\/home-supabase-work-normalizers";/,
  );
  for (const nome of ["normalizarCategoriaArquivoHome", "criarArquivoObraSupabaseHome", "normalizarObraSupabaseHome"]) {
    assert.match(modulo, new RegExp(`export function ${nome}\\b`));
    assert.doesNotMatch(pagina, new RegExp(`function ${nome}\\b`));
  }
  assert.match(modulo, /import \{ criarSlugBase \} from "\.\.\/\.\.\/lib\/utils";/);
  assert.match(modulo, /import \{ calcularProgressoLeitura \} from "\.\/home-reading-utils";/);
  assert.match(modulo, /import \{ normalizarNumeroHome \} from "\.\/home-format-utils";/);
  assert.match(
    obrasLoader,
    /import \{ normalizarObraSupabaseHome \} from "\.\/home-supabase-work-normalizers";/,
  );
  assert.doesNotMatch(modulo, /supabase|localStorage|useEffect|useState/);
});
