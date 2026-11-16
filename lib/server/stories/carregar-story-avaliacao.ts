import "server-only";
import { criarSupabasePublicClient } from "../../supabase/public";
import { criarSupabaseServerClient } from "../../supabase/server";
import { idObraSupabaseValido } from "../../utils";
import { lerProjecaoPublicaObra } from "../agendamento/ler-projecao-publica";
import { montarPayloadStoryAvaliacao, type PayloadStoryAvaliacao } from "../../stories/avaliacao-story-payload";

type Motivo = "parametros_invalidos" | "obra_indisponivel" | "avaliacao_nao_publica" |
  "avaliacao_invalida" | "fonte_indisponivel" | "fonte_alterada" |
  "autenticacao_necessaria" | "avaliacao_de_outro_leitor";
export type ResultadoStoryAvaliacao =
  { estado: "indisponivel"; motivo: Motivo; payload: null } |
  { estado: "disponivel" | "dados_incompletos"; payload: PayloadStoryAvaliacao };

/** Fonte para a futura ação da página da obra. Auth SSR valida o solicitante;
 * dados exportáveis continuam anônimos/RLS, sem service role ou cache.
 * Leitura pública atual, não promessa de revogação de uma imagem já exportada. */
export async function carregarStoryAvaliacaoObra({ slug, leitorId }: {
  slug: string; leitorId: string;
}): Promise<ResultadoStoryAvaliacao> {
  const negar = (motivo: Motivo): ResultadoStoryAvaliacao => ({ estado: "indisponivel", motivo, payload: null });
  if (typeof slug !== "string" || !slug || slug.length > 200 || slug !== slug.trim() ||
    typeof leitorId !== "string" || !idObraSupabaseValido(leitorId) || leitorId !== leitorId.trim()) return negar("parametros_invalidos");
  try {
    // Não confiar no ID recebido, no getSession local ou em metadata editável.
    const sessao = await criarSupabaseServerClient();
    const identidade = await sessao.auth.getUser();
    if (identidade.error || !identidade.data.user) return negar("autenticacao_necessaria");
    const leitorAutenticadoId = identidade.data.user.id;
    if (leitorAutenticadoId !== leitorId) return negar("avaliacao_de_outro_leitor");
    const antes = await lerProjecaoPublicaObra(slug);
    if (antes.estado !== "obra_publica") return negar("obra_indisponivel");
    const autorId = antes.obra.autorId;
    if (typeof autorId !== "string" || !idObraSupabaseValido(autorId)) return negar("obra_indisponivel");
    // A própria avaliação do autor não é uma avaliação de leitor.
    if (autorId === leitorId) return negar("avaliacao_invalida");
    const client = criarSupabasePublicClient({
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    });
    const lerAvaliacao = () => client.from("obra_avaliacoes")
      .select("nota,visibilidade").eq("obra_id", antes.obraId)
      .eq("user_id", leitorAutenticadoId).eq("visibilidade", "publico").maybeSingle();
    const avaliacao = await lerAvaliacao();
    if (avaliacao.error) return negar("fonte_indisponivel");
    if (!avaliacao.data || avaliacao.data.visibilidade !== "publico") return negar("avaliacao_nao_publica");
    // Sem bios, e-mail, campos privados, fallback Auth ou username inferido do nome.
    const perfis = await client.from("profiles_publicos")
      .select("user_id,nome,avatar_url,username").in("user_id", [leitorId, autorId]);
    if (perfis.error || !Array.isArray(perfis.data)) return negar("fonte_indisponivel");
    const payload = montarPayloadStoryAvaliacao({
      obra: { titulo: antes.obra.titulo, autor: antes.obra.autor, capa: antes.obra.capa, slug: antes.slug },
      leitor: perfis.data.find(p => p.user_id === leitorId) ?? null,
      autor: perfis.data.find(p => p.user_id === autorId) ?? null,
      nota: avaliacao.data.nota,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    });
    if (!payload) return negar("avaliacao_invalida");
    // Não certificar dados após despublicação, troca de autor/slug ou de privacidade.
    const confirmacao = await lerAvaliacao();
    if (confirmacao.error) return negar("fonte_indisponivel");
    if (!confirmacao.data || confirmacao.data.visibilidade !== "publico" ||
      confirmacao.data.nota !== avaliacao.data.nota) return negar("fonte_alterada");
    const depois = await lerProjecaoPublicaObra(slug);
    if (depois.estado !== "obra_publica" || depois.obraId !== antes.obraId ||
      depois.geracao !== antes.geracao || depois.revisao !== antes.revisao ||
      depois.slug !== antes.slug) return negar("fonte_alterada");
    const identidadeFinal = await sessao.auth.getUser();
    if (identidadeFinal.error || !identidadeFinal.data.user) return negar("autenticacao_necessaria");
    if (identidadeFinal.data.user.id !== leitorAutenticadoId) return negar("avaliacao_de_outro_leitor");
    return { estado: payload.compartilhavel ? "disponivel" : "dados_incompletos", payload };
  } catch {
    // Erros de rede/schema/RLS não viram dados locais nem mensagens com segredos.
    return negar("fonte_indisponivel");
  }
}
