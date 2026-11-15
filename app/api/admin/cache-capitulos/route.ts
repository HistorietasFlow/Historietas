import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { criarSupabaseServerClient, supabaseServerConfigurado } from "@/lib/supabase/server";
import { criarSupabaseAdminClient, supabaseAdminConfigurado } from "@/lib/supabase/admin";
import { tagObraPublica } from "@/lib/cache/obra-publica-cache-tag";
import { solicitarInvalidacaoCacheCapitulos } from "@/lib/server/agendamento/solicitar-invalidacao-cache";
import { consumirOperacaoCache } from "@/lib/server/agendamento/consumir-operacao-cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const resposta = (status: number, dados: Record<string, unknown>) =>
  NextResponse.json(dados, { status, headers: { "Cache-Control": "no-store" } });

function origemPermitida(request: NextRequest) {
  try {
    const origem = new URL(request.headers.get("origin") || "");
    // next start pode normalizar nextUrl.hostname para localhost. O Host real
    // preserva a origem do navegador; nao confiar em x-forwarded-host arbitrario.
    return origem.protocol === request.nextUrl.protocol
      && origem.host === request.headers.get("host")?.toLowerCase();
  } catch {
    return false;
  }
}

/** Acionamento manual estritamente administrativo. Sem Cron ou caller na UI. */
export async function POST(request: NextRequest) {
  if (!origemPermitida(request)) return resposta(403, { codigo: "origem_negada" });
  if (!supabaseServerConfigurado || !supabaseAdminConfigurado) return resposta(503, { codigo: "nao_configurado" });
  try {
    const sessao = await criarSupabaseServerClient();
    const usuario = await sessao.auth.getUser();
    if (usuario.error || !usuario.data.user) return resposta(401, { codigo: "nao_autenticado" });
    const autorizado = await sessao.rpc("autorizar_consumidor_cache_capitulos");
    if (autorizado.error || autorizado.data !== true) return resposta(403, { codigo: "acesso_negado" });
    const operacaoId = request.headers.get("Idempotency-Key")?.toLowerCase() ?? null;
    const acao = request.headers.get("X-Cache-Operation");
    if ((operacaoId !== null && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(operacaoId))
      || (acao !== null && acao !== "reconciliar")) return resposta(400, { codigo: "operacao_invalida" });
    const admin = criarSupabaseAdminClient();
    const resultado = await consumirOperacaoCache({
      operacaoId, reconciliar: acao === "reconciliar",
      chamar: async (etapa, id) => {
        // JWT da sessao atual, nunca service role nem IDs do navegador como prova.
        const { data, error } = await sessao.rpc("operar_cache_capitulos", { p_id: id, p_acao: etapa });
        if (error) throw new Error("Operacao indisponivel.");
        return data;
      },
      legado: async () => {
        const { data, error } = await admin.rpc("reivindicar_cache_capitulos", { p_limite: 5 });
        if (error) throw new Error("Outbox indisponivel.");
        return data;
      },
      consumir: async (eventos) => solicitarInvalidacaoCacheCapitulos({
        reivindicar: async () => eventos,
        invalidar: (evento) => {
          for (const slug of new Set([evento.slug, evento.slugAtual])) {
            if (slug === null) continue;
            revalidateTag(tagObraPublica(slug), { expire: 0 });
            // Hash da tag aceita slugs legados; caminhos devem ser canonicos seguros.
            if (/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) && slug.length <= 200) {
              revalidatePath(`/obra/${slug}`);
              if (evento.numero && evento.numero > 0) revalidatePath(`/obra/${slug}/capitulo/${evento.numero}`);
            }
          }
          revalidatePath("/sitemap.xml");
        },
        registrar: async (evento) => {
          // Revalidar revogacao/logout antes dos efeitos administrativos seguintes.
          if (operacaoId) {
            const atual = await sessao.rpc("autorizar_consumidor_cache_capitulos");
            if (atual.error || atual.data !== true) throw new Error("Sessao indisponivel.");
          }
          const { data, error } = await admin.rpc("registrar_solicitacao_cache_capitulo", {
            p_id: evento.id, p_lease_id: evento.leaseId,
          });
          if (error || data !== true) throw new Error("Solicitacao nao registrada.");
        },
      }),
    });
    // Next aplica a fila ao encerrar a requisicao, DEPOIS deste retorno. Nao ack.
    return resposta(resultado.estado === "solicitado_sem_confirmacao" ? 202 : 503, resultado);
  } catch {
    return resposta(503, { codigo: "invalidacao_pendente", confirmadas: 0 });
  }
}
