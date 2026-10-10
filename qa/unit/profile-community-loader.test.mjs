import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(new URL("../../app/perfil-autor/lib/profile-community-loader.ts", import.meta.url), "utf8");
const pagina = readFileSync(new URL("../../app/perfil-autor/page.tsx", import.meta.url), "utf8");
let indice = 0;

async function modulo(respostas) {
  const deps = { respostas: [...respostas], chamadas: [] };
  deps.supabase = { from(tabela) { const resposta = deps.respostas.shift(); const chamada = { tabela, select: null, eq: [], order: null, limit: null, in: null }; deps.chamadas.push(chamada); const q = { select: (v, o) => (chamada.select = [v, o], q), eq: (c, v) => (chamada.eq.push([c, v]), q), order: (c, o) => (chamada.order = [c, o], q), limit: (v) => (chamada.limit = v, q), in: (c, v) => (chamada.in = [c, v], q), then: (ok, erro) => Promise.resolve(resposta).then(ok, erro) }; return q; } };
  globalThis.__community = deps;
  const js = typescript.transpileModule(source
    .replace('import { ehClassificacao18 } from "../../../lib/historietasAdultContent";', 'const ehClassificacao18 = (valor) => valor === "18+";')
    .replace('import { normalizarTexto } from "../../../lib/utils";', 'const normalizarTexto = (valor) => String(valor).normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").toLowerCase();')
    .replace('import { supabase } from "../../../lib/supabase/client";', 'const supabase = globalThis.__community.supabase;')
    .replace('import type { ComunidadePerfilEstado, PublicacaoComunidadePerfil } from "../types";\n', '')
    .replace('import { pegarTexto } from "./data-normalizers";', 'const pegarTexto = (valor, fallback = "") => typeof valor === "string" && valor.trim() ? valor.trim() : fallback;')
    .replace('import { idAutorSupabaseValido } from "./profile-formatters";', 'const idAutorSupabaseValido = (id) => id.startsWith("usuario-");')
    .replace('import { normalizarPublicacaoComunidadePerfil } from "./profile-community-publication-utils";', 'const normalizarPublicacaoComunidadePerfil = (r) => typeof r.id === "string" && r.id.trim() ? { id: r.id.trim(), categoria: typeof r.categoria === "string" && r.categoria.trim() ? r.categoria.trim() : "Geral", tipoPublicacao: typeof r.tipo_publicacao === "string" && r.tipo_publicacao.trim() ? r.tipo_publicacao.trim() : "Discussão", temSpoiler: r.tem_spoiler === true, texto: typeof r.texto === "string" ? r.texto.trim().slice(0, 700) : "", obraRelacionada: typeof r.obra_relacionada === "string" ? r.obra_relacionada.trim().slice(0, 120) : "", criadoEm: typeof r.criado_em === "string" ? r.criado_em.trim() : "" } : null;'), { compilerOptions: { module: typescript.ModuleKind.ESNext, target: typescript.ScriptTarget.ES2022 } }).outputText;
  return { ...(await import(`data:text/javascript;base64,${Buffer.from(js).toString("base64")}#${indice++}`)), deps };
}

test("retorna vazio para id inválido", async () => {
  const { carregarComunidadePerfilSupabase, deps } = await modulo([]);
  assert.deepEqual(await carregarComunidadePerfilSupabase("invalido"), { totalPublicacoes: 0, totalTeorias: 0, totalReviews: 0, publicacoesRecentes: [] });
  assert.equal(deps.chamadas.length, 0);
});

test("preserva consultas, contagens, normalização e filtro de obras relacionadas", async () => {
  const { carregarComunidadePerfilSupabase, deps } = await modulo([
    { count: 4, error: null, data: [{ id: "p1", tipo_publicacao: "Teoria", texto: "texto", obra_relacionada: "Livre" }, { id: "p2", tipo_publicacao: "Review", obra_relacionada: "Adulto" }, { id: "p3", obra_relacionada: "Sem classificação" }, { id: "", texto: "inválida" }] },
    { count: 5, error: null }, { count: 2, error: null },
    { error: null, data: [{ titulo: "Livre", classificacao_indicativa: "Livre" }, { titulo: "Adulto", classificacao_indicativa: "18+" }, { titulo: "Sem classificação", classificacao_indicativa: "Não informada" }] },
  ]);
  const resultado = await carregarComunidadePerfilSupabase(" usuario-1 ");
  assert.equal(resultado.totalPublicacoes, 4); assert.equal(resultado.totalTeorias, 5); assert.equal(resultado.totalReviews, 2);
  assert.deepEqual(resultado.publicacoesRecentes.map((p) => p.obraRelacionada), ["Livre", "", ""]);
  assert.deepEqual(deps.chamadas[0].order, ["criado_em", { ascending: false }]); assert.equal(deps.chamadas[0].limit, 12);
  assert.deepEqual(deps.chamadas[3].in, ["titulo", ["Livre", "Adulto", "Sem classificação"]]);
});

test("preserva bypass, fallbacks e falha da consulta principal", async () => {
  const bypass = await modulo([{ count: 1, error: null, data: [{ id: "p1", obra_relacionada: "18+" }] }, { count: null, error: new Error("teorias") }, { count: null, error: new Error("reviews") }]);
  const resultado = await bypass.carregarComunidadePerfilSupabase("usuario-1", true);
  assert.deepEqual(resultado, { totalPublicacoes: 1, totalTeorias: 0, totalReviews: 0, publicacoesRecentes: [{ id: "p1", categoria: "Geral", tipoPublicacao: "Discussão", temSpoiler: false, texto: "", obraRelacionada: "18+", criadoEm: "" }] });
  assert.equal(bypass.deps.chamadas.length, 3);
  const falha = await modulo([{ count: null, error: new Error("posts") }, { count: 0, error: null }, { count: 0, error: null }]);
  await assert.rejects(() => falha.carregarComunidadePerfilSupabase("usuario-1"), /posts/);
});

test("preserva dados da publicação e fallback quando a consulta de obras falha", async () => {
  const { carregarComunidadePerfilSupabase } = await modulo([
    { count: 1, error: null, data: [{ id: "p1", categoria: "Análise", tipo_publicacao: "Teoria", tem_spoiler: true, texto: "conteúdo", obra_relacionada: "Obra" }] },
    { count: null, error: null }, { count: null, error: null },
    { data: null, error: new Error("obras indisponíveis") },
  ]);
  const resultado = await carregarComunidadePerfilSupabase("usuario-1");
  assert.deepEqual(resultado, { totalPublicacoes: 1, totalTeorias: 1, totalReviews: 0, publicacoesRecentes: [{ id: "p1", categoria: "Análise", tipoPublicacao: "Teoria", temSpoiler: true, texto: "conteúdo", obraRelacionada: "", criadoEm: "" }] });
});

test("página delega o carregador à nova fronteira", () => {
  assert.match(pagina, /import \{ carregarComunidadePerfilSupabase \} from "\.\/lib\/profile-community-loader";/);
  assert.match(pagina, /carregarComunidadePerfilSupabase\(\s*userIdPerfil,/);
  assert.doesNotMatch(pagina, /async function carregarComunidadePerfilSupabase\(/);
  assert.match(source, /export async function carregarComunidadePerfilSupabase\(/);
});
