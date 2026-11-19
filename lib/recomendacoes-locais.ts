import { supabase } from "./supabase/client";
import { normalizarTexto } from "./utils";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
const chave = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || "";
const rpc = "qa5_recomendar_obras_autorizadas";
const erro = "Não foi possível carregar as recomendações agora.";
const uuid = /^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i;
const classificacoes = new Set(["Livre", "10+", "12+", "14+", "16+"]);

function origemLocal(valor: string) {
  try {
    const origem = new URL(valor);
    if (origem.protocol === "http:" &&
        ["127.0.0.1", "localhost", "[::1]"].includes(origem.hostname) &&
        origem.href === origem.origin + "/") return origem.origin;
  } catch {
    // Sem URL válida, o piloto fica desativado.
  }
  return "";
}

const origemDev =
  process.env.NODE_ENV === "development" &&
  process.env.NEXT_PUBLIC_HISTORIETAS_RECOMENDACOES_LOCAL === "1"
    ? origemLocal(url)
    : "";
const origemPreview = process.env.HISTORIETAS_RECOMENDACOES_ORIGEM_PREVIEW || "";
const origem =
  origemDev ||
  (process.env.NODE_ENV === "production" &&
  origemPreview &&
  chave.startsWith("sb_publishable_") &&
  (url === origemPreview || url === origemPreview + "/")
    ? origemPreview
    : "");
export const recomendacoesLocaisAtivas = Boolean(origem && chave);

export function usarRecomendacoesLocais(modo: string, secao: string) {
  return recomendacoesLocaisAtivas && modo === "obras" && secao === "recomendacoes";
}

type ObraRecomendada = {
  id: string;
  user_id: string;
  titulo: string | null;
  autor: string | null;
  genero: string | null;
  formato: string | null;
  classificacao_indicativa: string;
  avisos_conteudo: string[] | null;
  sinopse: string | null;
  tags: string[] | null;
  slug: string;
  criada_em: string | null;
  publicado: true;
  visualizacoes: number;
  total_capitulos: number;
  possui_arquivo: boolean;
};

type Cursor = { valor: number; data: string; id: string };
type Linha = { obra: ObraRecomendada; cursor: Cursor; temMais: boolean };

function registro(valor: unknown): Record<string, unknown> {
  if (typeof valor !== "object" || valor === null || Array.isArray(valor)) throw new Error(erro);
  return valor as Record<string, unknown>;
}

function texto(valor: unknown) {
  if (valor === null || typeof valor === "string") return valor;
  throw new Error(erro);
}

function textos(valor: unknown) {
  if (valor === null) return null;
  if (Array.isArray(valor) && valor.every((item) => typeof item === "string")) return valor as string[];
  throw new Error(erro);
}

function inteiro(valor: unknown) {
  if (typeof valor === "number" && Number.isSafeInteger(valor) && valor >= 0) return valor;
  throw new Error(erro);
}

function lerLinha(valor: unknown): Linha {
  const linha = registro(valor);
  const m = registro(linha.metadados);
  if (typeof m.id !== "string" || !uuid.test(m.id) || m.id !== linha.obra_id ||
      m.id !== linha.cursor_id || typeof m.user_id !== "string" || !uuid.test(m.user_id) ||
      typeof m.classificacao_indicativa !== "string" || !classificacoes.has(m.classificacao_indicativa) ||
      m.publicado !== true || typeof m.slug !== "string" || !m.slug ||
      typeof m.possui_arquivo !== "boolean" || typeof linha.tem_mais !== "boolean" ||
      typeof linha.cursor_data !== "string" || !Number.isFinite(Date.parse(linha.cursor_data)) ||
      linha.cursor_valor !== 0) throw new Error(erro);

  return {
    obra: {
      id: m.id, user_id: m.user_id, titulo: texto(m.titulo), autor: texto(m.autor),
      genero: texto(m.genero), formato: texto(m.formato), classificacao_indicativa: m.classificacao_indicativa,
      avisos_conteudo: textos(m.avisos_conteudo), sinopse: texto(m.sinopse), tags: textos(m.tags),
      slug: m.slug, criada_em: texto(m.criada_em), publicado: true, visualizacoes: inteiro(m.visualizacoes),
      total_capitulos: inteiro(m.total_capitulos), possui_arquivo: m.possui_arquivo,
    },
    cursor: { valor: linha.cursor_valor, data: linha.cursor_data, id: m.id },
    temMais: linha.tem_mais,
  };
}

async function desempate(id: string) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("desempate|" + id));
  return new DataView(hash).getUint32(0);
}

async function ordenar(obras: ObraRecomendada[], generos: string[]) {
  const preferidos = new Set(generos.map(normalizarTexto));
  const classificadas = await Promise.all(obras.map(async (obra) => ({
    obra,
    preferida: Number(preferidos.has(normalizarTexto(obra.genero || ""))),
    ordem: await desempate(obra.id),
  })));
  classificadas.sort((a, b) =>
    b.preferida - a.preferida || a.ordem - b.ordem || a.obra.id.localeCompare(b.obra.id),
  );

  const resultado: ObraRecomendada[] = [];
  const quantidadePorAutor = new Map<string, number>();
  for (const { obra } of classificadas) {
    const quantidade = quantidadePorAutor.get(obra.user_id) ?? 0;
    if (quantidade >= 2) continue;
    resultado.push(obra);
    quantidadePorAutor.set(obra.user_id, quantidade + 1);
  }
  return resultado;
}

export async function carregarRecomendacoesLocais(leitor: string, signal: AbortSignal) {
  if (!recomendacoesLocaisAtivas) throw new Error(erro);
  const { data, error } = await supabase.auth.getSession();
  if (error || (data.session?.user.id ?? "") !== leitor) throw new Error(erro);
  const token = data.session?.access_token;
  if (leitor && !token) throw new Error(erro);
  const headers = new Headers({ apikey: chave, "Content-Type": "application/json" });
  if (token || !chave.startsWith("sb_publishable_")) {
    headers.set("Authorization", "Bearer " + (token || chave));
  }

  // Preferências de fixture, comuns às duas telas. Nenhuma leitura de histórico.
  const valores = (process.env.NEXT_PUBLIC_HISTORIETAS_RECOMENDACOES_GENEROS || "")
    .split(",").map((valor) => valor.trim()).filter(Boolean);
  const generos = [...new Map(valores.map((valor) => [normalizarTexto(valor), valor])).values()];
  if (generos.length > 3 || generos.some((valor) => valor.length > 64)) throw new Error(erro);

  const consultas = (generos.length ? generos : [""]).map((genero) => ({
    genero, cursor: null as Cursor | null, terminou: false,
  }));
  const maxChamadas = generos.length ? 8 : 1;
  const limite = generos.length ? 7 : 28;
  const obras = new Map<string, ObraRecomendada>();
  let chamadas = 0;
  while (chamadas < maxChamadas && consultas.some((consulta) => !consulta.terminou)) {
    for (const consulta of consultas) {
      if (consulta.terminou || chamadas === maxChamadas) continue;
      signal.throwIfAborted();
      const cursor = consulta.cursor;
      const resposta = await fetch(`${origem}/rest/v1/rpc/${rpc}`, {
        method: "POST", headers, cache: "no-store", redirect: "error", signal,
        body: JSON.stringify({
          p_busca: "", p_genero: consulta.genero, p_formato: "", p_classificacao: "",
          p_filtro_capitulos: "todos", p_ordenacao: "recentes", p_limite: limite, p_tag: "",
          p_cursor_valor: cursor?.valor ?? null, p_cursor_data: cursor?.data ?? null,
          p_cursor_id: cursor?.id ?? null,
        }),
      });
      chamadas++;
      if (!resposta.ok) throw new Error(erro);
      const valor: unknown = await resposta.json();
      if (!Array.isArray(valor) || valor.length > limite) throw new Error(erro);
      const linhas = valor.map(lerLinha);
      const ultima = linhas.at(-1);
      if (ultima?.temMais && (linhas.length !== limite || ultima.cursor.id === cursor?.id)) {
        throw new Error(erro);
      }
      for (const linha of linhas) obras.set(linha.obra.id, linha.obra);
      consulta.cursor = ultima?.cursor ?? null;
      consulta.terminou = !ultima?.temMais;
    }
  }
  signal.throwIfAborted();
  return ordenar([...obras.values()], generos);
}
