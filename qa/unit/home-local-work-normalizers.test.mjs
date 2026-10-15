import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const modulo = readFileSync(
  new URL("../../app/lib/home-local-work-normalizers.ts", import.meta.url),
  "utf8",
);
const pagina = readFileSync(new URL("../../app/page.tsx", import.meta.url), "utf8");

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
    `const normalizarNumeroHome = (valor, fallback = 0) => {
  if (typeof valor === "number" && Number.isFinite(valor)) return Math.max(0, Math.round(valor));
  if (typeof valor === "string" && valor.trim()) {
    const numero = Number(valor.replace(/\\./g, "").replace(",", "."));
    if (Number.isFinite(numero)) return Math.max(0, Math.round(numero));
  }
  return fallback;
};
`,
  )
  .replace(
    'import { obraTemConteudoPublicoHome } from "./home-local-work-utils";\n',
    `const obraTemConteudoPublicoHome = (obra) => obra.capitulos.length > 0 || Boolean(
  obra.arquivoObra && typeof obra.arquivoObra === "object" && !Array.isArray(obra.arquivoObra) &&
  typeof obra.arquivoObra.nome === "string" && obra.arquivoObra.nome.trim() &&
  typeof obra.arquivoObra.conteudo === "string" && obra.arquivoObra.conteudo.trim()
);
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
  normalizarCapituloHome,
  normalizarObraHome,
  normalizarObrasHomeSalvas,
} = await import(
  `data:text/javascript;base64,${Buffer.from(javascriptModulo).toString("base64")}`,
);

const capitulo = (overrides = {}) => ({
  id: "cap-1",
  titulo: "Capítulo 1",
  texto: "Texto",
  curtiu: true,
  salvo: true,
  comentario: "Comentário",
  criadoEm: "2026-01-01",
  lido: true,
  lidoEm: "2026-01-02",
  publicado: true,
  ...overrides,
});

const obra = (overrides = {}) => ({
  id: "obra-1",
  titulo: "Obra Local",
  autor: "Ana",
  autorId: "autor-ana",
  genero: "Fantasia",
  formato: "Webcomic",
  classificacaoIndicativa: "Livre",
  sinopse: "Uma sinopse",
  tags: ["aventura"],
  capa: "capa.png",
  capaNome: "capa.png",
  publicado: true,
  capitulos: [capitulo()],
  criadaEm: "2026-01-01",
  ultimoCapituloLidoId: "cap-1",
  ultimaLeituraEm: "2026-01-02",
  visualizacoes: 10,
  totalCurtidas: 2,
  totalComentarios: 3,
  slug: "obra-local",
  link: "/obra/obra-local",
  ...overrides,
});

test("home-local-work-normalizers preserva campos e fallbacks de capítulo", () => {
  assert.deepEqual(normalizarCapituloHome(capitulo(), 0), capitulo());
  assert.deepEqual(normalizarCapituloHome({}, 2), {
    id: "capitulo-3",
    titulo: "Capítulo sem título",
    texto: "",
    curtiu: false,
    salvo: false,
    comentario: "",
    criadoEm: "",
    lido: false,
    lidoEm: "",
    publicado: true,
  });
  assert.equal(normalizarCapituloHome(capitulo({ publicado: false }), 0).publicado, false);
});

test("home-local-work-normalizers preserva títulos, slugs, autor e fallbacks textuais", () => {
  const normalizada = normalizarObraHome(obra({
    titulo: "  ",
    slug: "",
    autor: " ",
    autorId: "",
    user_id: " user-alternativo ",
    genero: " ",
    formato: " ",
    classificacaoIndicativa: " ",
    sinopse: " ",
    link: "",
  }), 1);

  assert.equal(normalizada.titulo, "Obra sem título");
  assert.equal(normalizada.slug, "obra-sem-titulo");
  assert.equal(normalizada.autor, "Autor não informado");
  assert.equal(normalizada.autorId, "user-alternativo");
  assert.equal(normalizada.genero, "Não informado");
  assert.equal(normalizada.formato, "Não informado");
  assert.equal(normalizada.classificacaoIndicativa, "Não informada");
  assert.equal(normalizada.sinopse, "Nenhuma sinopse informada.");
  assert.equal(normalizada.link, "/obra/obra-sem-titulo");
  assert.equal(normalizarObraHome(obra({ slug: " slug-existente ", link: " /link ", autorId: " autor " }), 0).slug, "slug-existente");
});

test("home-local-work-normalizers preserva tags, capítulos públicos e progresso", () => {
  const normalizada = normalizarObraHome(obra({
    tags: [" fantasia ", 1, "", "romance"],
    capitulos: [capitulo({ lido: true }), capitulo({ id: "privado", publicado: false, lido: false })],
  }), 0);

  assert.deepEqual(normalizada.tags, ["fantasia", "romance"]);
  assert.equal(normalizada.capitulos.length, 1);
  assert.equal(normalizada.progressoLeitura, 100);
  assert.deepEqual(normalizarObraHome(obra({ tags: ["", 1] }), 0).tags, ["sem tags"]);
});

test("home-local-work-normalizers preserva aliases e fallbacks das métricas", () => {
  for (const [campo, valor] of [
    ["visualizacoes", 11], ["views", 12], ["visualizacoesTotal", 13], ["totalVisualizacoes", 14], ["total_visualizacoes", 15],
  ]) {
    const entrada = obra({ visualizacoes: undefined, views: undefined, visualizacoesTotal: undefined, totalVisualizacoes: undefined, total_visualizacoes: undefined, [campo]: valor });
    assert.equal(normalizarObraHome(entrada, 0).visualizacoes, valor);
  }
  for (const [campo, valor] of [
    ["totalCurtidas", 11], ["curtidas", 12], ["likes", 13], ["totalLikes", 14], ["total_curtidas", 15],
  ]) {
    const entrada = obra({ totalCurtidas: undefined, curtidas: undefined, likes: undefined, totalLikes: undefined, total_curtidas: undefined, [campo]: valor });
    assert.equal(normalizarObraHome(entrada, 0).totalCurtidas, valor);
  }
  for (const [campo, valor] of [
    ["totalComentarios", 11], ["comentarios", 12], ["totalComments", 13], ["total_comentarios", 14],
  ]) {
    const entrada = obra({ totalComentarios: undefined, comentarios: undefined, totalComments: undefined, total_comentarios: undefined, [campo]: valor });
    assert.equal(normalizarObraHome(entrada, 0).totalComentarios, valor);
  }
  const locais = obra({
    totalCurtidas: undefined,
    totalComentarios: undefined,
    capitulos: [capitulo({ curtiu: true, comentario: "  " }), capitulo({ id: "cap-2", curtiu: true, comentario: "Comentário" })],
  });
  const normalizada = normalizarObraHome(locais, 0);
  assert.equal(normalizada.totalCurtidas, 2);
  assert.equal(normalizada.totalComentarios, 1);
});

test("home-local-work-normalizers preserva o filtro final de obras salvas", () => {
  assert.deepEqual(normalizarObrasHomeSalvas({}), []);
  assert.deepEqual(normalizarObrasHomeSalvas([
    obra({ id: "nao-publicada", publicado: false }),
    obra({ id: "sem-conteudo", capitulos: [], arquivoObra: undefined }),
    obra({ id: "com-capitulo" }),
    obra({ id: "com-arquivo", capitulos: [], arquivoObra: { nome: "obra.txt", conteudo: "conteúdo" } }),
  ]).map((item) => item.id), ["com-capitulo", "com-arquivo"]);
});

test("home-local-work-normalizers estabelece a fronteira dos normalizadores locais", () => {
  assert.match(pagina, /import \{ normalizarObrasHomeSalvas \} from "\.\/lib\/home-local-work-normalizers";/);
  for (const nome of ["normalizarCapituloHome", "normalizarObraHome", "normalizarObrasHomeSalvas"]) {
    assert.match(modulo, new RegExp(`export function ${nome}\\b`));
    assert.doesNotMatch(pagina, new RegExp(`function ${nome}\\b`));
  }
  assert.match(modulo, /import \{ criarSlugBase \} from "\.\.\/\.\.\/lib\/utils";/);
  assert.match(modulo, /import \{ calcularProgressoLeitura \} from "\.\/home-reading-utils";/);
  assert.match(modulo, /import \{ normalizarNumeroHome \} from "\.\/home-format-utils";/);
  assert.match(modulo, /import \{ obraTemConteudoPublicoHome \} from "\.\/home-local-work-utils";/);
  assert.doesNotMatch(modulo, /supabase|localStorage|useEffect|useState/);
});
