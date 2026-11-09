import "server-only";
import { createHash } from "node:crypto";
import { unstable_cache } from "next/cache";
import { criarSupabasePublicClient } from "../supabase/public";
import { lerComBarreiraPublica, ProjecaoPublicaAlterada } from "./barreira-projecao-publica";
import type { Database } from "../supabase/database.types";

type Funcoes = Database["public"]["Functions"];
type Revisao = Funcoes["listar_revisoes_sitemap_publico"]["Returns"][number];
type Capitulo = Funcoes["listar_capitulos_sitemap_publico"]["Returns"][number];
const TAMANHO = 500;

async function listar<T extends { id: string }>(buscar: (cursor: string | null) => Promise<T[]>): Promise<T[]> {
  const registros: T[] = [];
  let cursor: string | null = null;
  for (let pagina = 0; pagina < 10000; pagina++) {
    const dados = await buscar(cursor);
    if (!Array.isArray(dados) || dados.length > TAMANHO) throw new Error("Página pública inválida.");
    for (const item of dados) {
      if (typeof item.id !== "string" || (cursor !== null && item.id <= cursor)) throw new Error("Cursor público inválido.");
      cursor = item.id;
    }
    registros.push(...dados);
    if (dados.length < TAMANHO) return registros;
  }
  throw new Error("Sitemap excedeu o limite de páginas.");
}

const chaveManifesto = (revisoes: Revisao[]) => createHash("sha256")
  .update(revisoes.map((r) => `${r.id}:${r.geracao}:${r.revisao}`).join("\n")).digest("hex");

export async function obterConteudoSitemapPublico() {
  const supabase = criarSupabasePublicClient({ fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) });
  const lerManifesto = () => listar<Revisao>(async (cursor) => {
    const { data, error } = await supabase.rpc("listar_revisoes_sitemap_publico", { p_depois_id: cursor, p_limite: TAMANHO });
    if (error) throw error;
    if (!data) throw new Error("Manifesto público indisponível.");
    return data;
  });
  const lerVersao = async () => {
    const { data, error } = await supabase.rpc("obter_revisao_sitemap_publico");
    if (error) throw error;
    if (typeof data !== "string" || !/^[a-f0-9]{64}$/.test(data)) throw new Error("Revisão do sitemap inválida.");
    return data;
  };
  return lerComBarreiraPublica({
    lerVersao, chave: (versao) => versao,
    carregar: (versao) => unstable_cache(async () => {
      const obras = await lerManifesto();
      if (chaveManifesto(obras) !== versao) throw new ProjecaoPublicaAlterada();
      const capitulos = await listar<Capitulo>(async (cursor) => {
        const { data, error } = await supabase.rpc("listar_capitulos_sitemap_publico", { p_depois_id: cursor, p_limite: TAMANHO });
        if (error) throw error;
        if (!data) throw new Error("Capítulos do sitemap indisponíveis.");
        return data;
      });
      const porId = new Map(obras.map((obra) => [obra.id, obra]));
      for (const capitulo of capitulos) {
        const obra = porId.get(capitulo.obra_id);
        if (!obra || obra.geracao !== capitulo.geracao || obra.revisao !== capitulo.revisao) throw new ProjecaoPublicaAlterada();
      }
      // Nunca persistir uma combinacao de paginas que mudou durante a coleta.
      if (versao !== await lerVersao()) throw new ProjecaoPublicaAlterada();
      return { obras, capitulos };
    }, ["historietas-sitemap-projecao-v1", versao], { revalidate: 60 })(),
  });
}
