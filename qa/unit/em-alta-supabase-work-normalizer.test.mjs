import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const modulo = readFileSync(
  new URL(
    "../../app/em-alta/lib/em-alta-supabase-work-normalizer.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/em-alta/page.tsx", import.meta.url),
  "utf8",
);

const executavel = modulo
  .replace(
    'import { criarSlugBase } from "../../../lib/utils";\n',
    `const criarSlugBase = (valor) => valor.normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");\n`,
  )
  .replace(
    /import \{\r?\n  obterAvatarProfileAutorRanking,\r?\n  obterNomeProfileAutorRanking,\r?\n\} from "\.\/em-alta-author-profile-utils";\r?\n/,
    `const obterNomeProfileAutorRanking = (profile) => typeof profile?.nome === "string" && profile.nome.trim() ? profile.nome.trim() : "";
const obterAvatarProfileAutorRanking = (profile) => typeof profile?.avatar_url === "string" ? profile.avatar_url.trim() : "";\n`,
  )
  .replace(
    'import { obterAvatarAutorLocalEmAlta } from "./em-alta-local-storage-utils";\n',
    `const obterAvatarAutorLocalEmAlta = (mapa, nome, id) => mapa.get(id) || mapa.get(nome) || "";\n`,
  )
  .replace(
    /import \{\r?\n  calcularProgressoLeitura,\r?\n\} from "\.\/em-alta-ranking-data-utils";\r?\n/,
    `const calcularProgressoLeitura = (capitulos) => capitulos.length ? Math.round((capitulos.filter((capitulo) => capitulo.lido).length / capitulos.length) * 100) : 0;\n`,
  )
  .replace(/import type \{[\s\S]*?\} from "\.\/em-alta-models";\r?\n/, "")
  .replace(
    "function normalizarTipoArquivoSupabase(",
    "export function normalizarTipoArquivoSupabase(",
  );
const javascriptModulo = typescript.transpileModule(executavel, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const { converterObraSupabaseParaLocal, normalizarTipoArquivoSupabase } =
  await import(
    `data:text/javascript;base64,${Buffer.from(javascriptModulo).toString("base64")}`,
  );

function obra(overrides = {}) {
  return {
    id: "obra-1", user_id: "autor-1", titulo: " Obra Teste ", autor: " Autor da obra ", genero: " Fantasia ", formato: " Webtoon ", classificacao_indicativa: " Livre ", sinopse: " Sinopse ", tags: [" aventura ", "", 42], capa_url: " capa ", capa_nome: " Capa ", arquivo_url: null, arquivo_nome: null, arquivo_tamanho: null, arquivo_categoria: null, visualizacoes: 12, publicado: true, slug: "obra-teste", link: "", criada_em: "2026-01-01T00:00:00.000Z", atualizado_em: null, ...overrides,
  };
}

function converter({ obraSupabase = obra(), capitulos = [], obraLocal, index = 0, profiles = new Map(), avatares = new Map(), progresso = new Map(), progressoCarregado = false, curtidas = {}, comentarios = {}, salvos = {}, seguidores = {}, avaliacoes = {}, seguidoresAutores = {} } = {}) {
  return converterObraSupabaseParaLocal(obraSupabase, capitulos, obraLocal, index, curtidas, comentarios, salvos, seguidores, avaliacoes, profiles, seguidoresAutores, avatares, progresso, progressoCarregado);
}

test("normaliza apenas os quatro tipos de arquivo aceitos", () => {
  for (const tipo of ["imagem", "documento", "texto", "outro"]) assert.equal(normalizarTipoArquivoSupabase(tipo), tipo);
  assert.equal(normalizarTipoArquivoSupabase(null), "outro");
  assert.equal(normalizarTipoArquivoSupabase("pdf"), "outro");
});

test("preserva título, slug, capítulos e fallback local de progresso", () => {
  const resultado = converter({
    obraSupabase: obra({ titulo: null, slug: null }),
    capitulos: [{ id: "cap-1", titulo: null, criado_em: "2026-01-02", obra_id: "obra-1" }],
    obraLocal: { capitulos: [{ id: "cap-1", curtiu: true, salvo: true, comentario: "nota", lido: true, lidoEm: "2026-01-03" }], ultimoCapituloLidoId: "cap-1", ultimaLeituraEm: "2026-01-03" },
  });
  assert.equal(resultado.titulo, "Obra sem título");
  assert.equal(resultado.slug, "obra-sem-titulo");
  assert.equal(resultado.link, "/obra/obra-sem-titulo");
  assert.deepEqual(resultado.capitulos[0], { id: "cap-1", titulo: "Capítulo 1", texto: "", curtiu: true, salvo: true, comentario: "nota", criadoEm: "2026-01-02", lido: true, lidoEm: "2026-01-03" });
  assert.equal(resultado.progressoLeitura, 100);
});

test("progresso carregado usa Map, datas e último capítulo", () => {
  const resultado = converter({
    capitulos: [{ id: "cap-1", titulo: "Um", criado_em: "", obra_id: "obra-1" }, { id: "cap-2", titulo: "Dois", criado_em: "", obra_id: "obra-1" }],
    obraLocal: { capitulos: [{ id: "cap-1", lido: true, lidoEm: "2020-01-01" }], ultimoCapituloLidoId: "cap-1", ultimaLeituraEm: "2020-01-01" },
    progressoCarregado: true,
    progresso: new Map([["obra-1::cap-1", { lido: true, atualizado_em: "data inválida" }], ["obra-1::cap-2", { lido: true, atualizado_em: "2026-02-02" }]]),
  });
  assert.equal(resultado.capitulos[0].lidoEm, "data inválida");
  assert.equal(resultado.ultimoCapituloLidoId, "cap-2");
  assert.equal(resultado.ultimaLeituraEm, "2026-02-02");
  assert.equal(resultado.progressoLeitura, 100);
});

test("preserva autor/avatar, tags, arquivo e métricas", () => {
  const resultado = converter({
    obraSupabase: obra({ arquivo_url: " https://arquivo ", arquivo_nome: " ", arquivo_categoria: "invalido", arquivo_tamanho: Infinity, tags: ["  ", " ação "], visualizacoes: Infinity }),
    profiles: new Map([["autor-1", { nome: " Nome profile ", avatar_url: " avatar-profile " }]]),
    avatares: new Map([["autor-1", "avatar-local"], ["Autor da obra", "avatar-original"]]),
    curtidas: { "obra-1": 1 }, comentarios: { "obra-1": 2 }, salvos: { "obra-1": 3 }, seguidores: { "obra-1": 4 }, avaliacoes: { "obra-1": { total: 5, media: 4.5 } }, seguidoresAutores: { "autor-1": 6 },
  });
  assert.equal(resultado.autor, "Nome profile");
  assert.equal(resultado.autorAvatarRanking, "avatar-profile");
  assert.deepEqual(resultado.tags, [" ação "]);
  assert.deepEqual(resultado.arquivoObra, { nome: "Arquivo da obra", tipo: "outro", tamanho: 0, conteudo: "https://arquivo", enviadoEm: "2026-01-01T00:00:00.000Z" });
  assert.deepEqual([resultado.totalCurtidasRanking, resultado.totalComentariosRanking, resultado.totalSalvosRanking, resultado.totalViewsRanking, resultado.totalSeguidoresRanking, resultado.totalSeguidoresAutorRanking, resultado.totalAvaliacoesRanking, resultado.mediaAvaliacoesRanking], [1, 2, 3, 0, 4, 6, 5, 4.5]);
});

test("preserva fallbacks de autor, avatar, tags e arquivo ausente", () => {
  const autorObra = converter({ obraSupabase: obra({ user_id: null, autor: " Autor da obra ", tags: [], arquivo_url: null }), avatares: new Map([["Autor da obra", "avatar-original"]]) });
  assert.equal(autorObra.autor, "Autor da obra");
  assert.equal(autorObra.autorAvatarRanking, "avatar-original");
  assert.deepEqual(autorObra.tags, ["sem tags"]);
  assert.equal(autorObra.arquivoObra, null);
  assert.equal(converter({ obraSupabase: obra({ user_id: null, autor: "  " }) }).autor, "Autor não informado");
});

test("fronteira preserva conversão pura e loader de obras na página", () => {
  assert.match(modulo, /export function converterObraSupabaseParaLocal\b/);
  assert.match(modulo, /function normalizarTipoArquivoSupabase\b/);
  assert.match(modulo, /satisfies CapituloLocal/);
  assert.match(modulo, /const chaveProgresso = `\$\{obra\.id\}::\$\{capitulo\.id\}`/);
  assert.match(modulo, /registroProgresso\?\.lido === true/);
  assert.match(modulo, /Number\.isNaN\(tempoAtual\)/);
  assert.match(modulo, /calcularProgressoLeitura\(capitulosMesclados\)/);
  for (const proibido of [/supabase\/client/, /\.from\(/, /\.select\(/, /\.in\(/, /from ["']react["']/i, /\buse[A-Z]\w*\b/, /\.auth\b/, /\blocalStorage\b/i, /\bwindow\b/, /\bdocument\b/, /<[A-Z][\w.]*/]) assert.doesNotMatch(modulo, proibido);
  assert.match(pagina, /import \{ converterObraSupabaseParaLocal \} from "\.\/lib\/em-alta-supabase-work-normalizer";/);
  assert.doesNotMatch(pagina, /function normalizarTipoArquivoSupabase\b/);
  assert.doesNotMatch(pagina, /function converterObraSupabaseParaLocal\b/);
  assert.match(pagina, /async function carregarObrasSupabasePublicadas\b/);
});
